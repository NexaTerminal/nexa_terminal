'use strict';

/**
 * Outreach contact lists — Mailchimp-style audiences that feed the daily drip.
 *
 * Two collections (namespaced `outreach_*`; the plain `contacts` collection is
 * owned by the public contact form):
 *   outreach_lists    { name, type:'basic'|'pro', createdBy, contactCount, ts }
 *   outreach_contacts { listId, email(lc), name?, company?,
 *                       status:'pending'|'sent'|'failed'|'unsubscribed',
 *                       sentAt?, createdAt, updatedAt }
 *
 * Lists are editable without limit. The drip reads `pending` contacts of a
 * given type; sending is handled by dripSendService, which flips status.
 */

const { ObjectId } = require('mongodb');

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));
const isValidId = (v) => { try { toId(v); return true; } catch { return false; } };
const normEmail = (e) => String(e || '').trim().toLowerCase();
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cleanType = (t) => (t === 'pro' ? 'pro' : 'basic');
const clean = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));

const VALID_STATUS = new Set(['pending', 'sent', 'failed', 'unsubscribed']);

class ContactListService {
  constructor(database) {
    if (!database) throw new Error('ContactListService requires a database');
    this.db = database;
    this.lists = database.collection('outreach_lists');
    this.contacts = database.collection('outreach_contacts');
  }

  async ensureIndexes() {
    await this.lists.createIndex({ createdAt: -1 });
    // One row per email per list; a contact can live in a basic and a pro list.
    await this.contacts.createIndex({ listId: 1, email: 1 }, { unique: true });
    await this.contacts.createIndex({ listId: 1, status: 1, createdAt: 1 });
    // The drip queries by type+status+age across all lists of a type via a join
    // on listId; a plain status index keeps the daily-count query fast.
    await this.contacts.createIndex({ status: 1, sentAt: -1 });
  }

  // ── Lists ────────────────────────────────────────────────────────────────
  async listLists() {
    return this.lists.find({}).sort({ createdAt: -1 }).toArray();
  }

  async createList({ name, type, createdBy }) {
    const now = new Date();
    const doc = {
      name: clean(name, 120) || 'Без име',
      type: cleanType(type),
      createdBy: createdBy ? toId(createdBy) : null,
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const { insertedId } = await this.lists.insertOne(doc);
    return { ...doc, _id: insertedId };
  }

  async updateList(id, { name, type }) {
    if (!isValidId(id)) return null;
    const $set = { updatedAt: new Date() };
    if (name !== undefined) $set.name = clean(name, 120) || 'Без име';
    if (type !== undefined) $set.type = cleanType(type);
    const r = await this.lists.findOneAndUpdate(
      { _id: toId(id) }, { $set }, { returnDocument: 'after' }
    );
    return r.value || null;
  }

  async deleteList(id) {
    if (!isValidId(id)) return false;
    await this.contacts.deleteMany({ listId: toId(id) });
    const { deletedCount } = await this.lists.deleteOne({ _id: toId(id) });
    return deletedCount === 1;
  }

  async getListsByType(type) {
    return this.lists.find({ type: cleanType(type) }).toArray();
  }

  /**
   * Merge one or more source lists into a target list: every contact is
   * re-homed under the target, then the drained source lists are deleted.
   * Global dedup means an email lives in only one list, so a straight re-assign
   * is safe; any stray collision with the target is dropped rather than moved.
   * Returns { moved, deletedLists } or null if the target is invalid.
   */
  async mergeLists(targetId, sourceIds = []) {
    if (!isValidId(targetId)) return null;
    const target = await this.lists.findOne({ _id: toId(targetId) });
    if (!target) return null;

    const sources = (sourceIds || [])
      .filter((id) => isValidId(id) && String(id) !== String(targetId))
      .map((id) => toId(id));
    if (sources.length === 0) return { moved: 0, deletedLists: 0 };

    // Guard against the unique (listId,email) index: drop any source contact
    // whose email already sits in the target before re-homing the rest.
    const targetEmails = new Set(
      (await this.contacts.find({ listId: toId(targetId) }, { projection: { email: 1 } }).toArray())
        .map((c) => c.email)
    );
    if (targetEmails.size) {
      await this.contacts.deleteMany({ listId: { $in: sources }, email: { $in: [...targetEmails] } });
    }

    const res = await this.contacts.updateMany(
      { listId: { $in: sources } },
      { $set: { listId: toId(targetId), updatedAt: new Date() } }
    );
    const del = await this.lists.deleteMany({ _id: { $in: sources } });
    await this._recount(targetId);
    return { moved: res.modifiedCount || 0, deletedLists: del.deletedCount || 0 };
  }

  async _recount(listId) {
    const count = await this.contacts.countDocuments({ listId: toId(listId) });
    await this.lists.updateOne({ _id: toId(listId) }, { $set: { contactCount: count, updatedAt: new Date() } });
    return count;
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  async listContacts(listId, { status, limit = 500 } = {}) {
    if (!isValidId(listId)) return [];
    const q = { listId: toId(listId) };
    if (status && VALID_STATUS.has(status)) q.status = status;
    return this.contacts.find(q).sort({ createdAt: 1 }).limit(Math.min(limit, 2000)).toArray();
  }

  async addContact(listId, { email, name, company }) {
    if (!isValidId(listId)) return { ok: false, reason: 'bad_list' };
    const e = normEmail(email);
    if (!isEmail(e)) return { ok: false, reason: 'bad_email' };
    // Global dedup: an email already present in ANY list is ignored, so the
    // same address is never added twice across audiences.
    const existing = await this.contacts.findOne({ email: e }, { projection: { _id: 1 } });
    if (existing) return { ok: false, reason: 'duplicate' };
    const now = new Date();
    try {
      await this.contacts.insertOne({
        listId: toId(listId), email: e,
        name: clean(name, 160), company: clean(company, 200),
        status: 'pending', sentAt: null, createdAt: now, updatedAt: now,
      });
      await this._recount(listId);
      return { ok: true };
    } catch (err) {
      if (err.code === 11000) return { ok: false, reason: 'duplicate' };
      throw err;
    }
  }

  /**
   * Bulk import from pasted text. Accepts newline/comma/semicolon-separated
   * lines; each line may be "email" or "email, name, company". Returns counts.
   */
  async bulkImport(listId, rawText) {
    if (!isValidId(listId)) return { added: 0, duplicates: 0, invalid: 0 };
    const lines = String(rawText || '').split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    let added = 0, duplicates = 0, invalid = 0;
    const now = new Date();

    // Parse + dedup within the pasted block first.
    const rows = new Map(); // email → { name, company }
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const e = normEmail(parts[0]);
      if (!isEmail(e)) { invalid++; continue; }
      if (rows.has(e)) { duplicates++; continue; }
      rows.set(e, { name: clean(parts[1], 160), company: clean(parts[2], 200) });
    }

    // Global dedup: drop any email already present in ANY list (not just this one).
    if (rows.size) {
      const emails = [...rows.keys()];
      const existing = await this.contacts
        .find({ email: { $in: emails } }, { projection: { email: 1 } })
        .toArray();
      for (const row of existing) {
        if (rows.delete(row.email)) duplicates++;
      }
    }

    if (rows.size) {
      const docs = [...rows.entries()].map(([email, meta]) => ({
        listId: toId(listId), email,
        name: meta.name, company: meta.company,
        status: 'pending', sentAt: null, createdAt: now, updatedAt: now,
      }));
      try {
        const res = await this.contacts.insertMany(docs, { ordered: false });
        added = res.insertedCount || docs.length;
      } catch (err) {
        // A race could still trip the unique index; count survivors as added.
        added = err.result?.insertedCount ?? (err.insertedDocs?.length || 0);
        duplicates += docs.length - added;
      }
      await this._recount(listId);
    }
    return { added, duplicates, invalid };
  }

  async updateContact(id, { name, company, status }) {
    if (!isValidId(id)) return null;
    const $set = { updatedAt: new Date() };
    if (name !== undefined) $set.name = clean(name, 160);
    if (company !== undefined) $set.company = clean(company, 200);
    if (status !== undefined && VALID_STATUS.has(status)) {
      $set.status = status;
      if (status === 'pending') $set.sentAt = null; // requeue
    }
    const r = await this.contacts.findOneAndUpdate(
      { _id: toId(id) }, { $set }, { returnDocument: 'after' }
    );
    return r.value || null;
  }

  /**
   * Rows for CSV export. `listId` null → every list (deduped by email, so the
   * combined export is one row per unique address). Each row carries its list
   * name + type for context.
   */
  async exportRows(listId = null) {
    const lists = await this.lists.find({}).toArray();
    const listMap = new Map(lists.map((l) => [String(l._id), l]));
    const q = {};
    if (listId && isValidId(listId)) q.listId = toId(listId);
    const contacts = await this.contacts.find(q).sort({ createdAt: 1 }).toArray();
    const seen = new Set();
    const rows = [];
    for (const c of contacts) {
      if (seen.has(c.email)) continue;       // dedup across lists for "all"
      seen.add(c.email);
      const l = listMap.get(String(c.listId));
      rows.push({
        email: c.email,
        name: c.name || '',
        company: c.company || '',
        list: l?.name || '',
        type: l?.type || '',
        status: c.status || '',
      });
    }
    return rows;
  }

  async deleteContact(id) {
    if (!isValidId(id)) return false;
    const doc = await this.contacts.findOne({ _id: toId(id) }, { projection: { listId: 1 } });
    const { deletedCount } = await this.contacts.deleteOne({ _id: toId(id) });
    if (doc?.listId) await this._recount(doc.listId);
    return deletedCount === 1;
  }

  // ── Drip support ───────────────────────────────────────────────────────────
  /**
   * Resolve the set of list _ids a drip bucket targets. `listId` null/undefined
   * → all lists of `type`; a specific id → just that list (only if it's really
   * of this type, so a stale/mismatched selection sends nothing rather than
   * crossing buckets).
   */
  async _bucketListIds(type, listId) {
    if (listId && isValidId(listId)) {
      const one = await this.lists.findOne({ _id: toId(listId), type: (type === 'pro' ? 'pro' : 'basic') });
      return one ? [one._id] : [];
    }
    return (await this.getListsByType(type)).map((l) => l._id);
  }

  /** Count contacts marked sent since `since` for a bucket (daily top-up). */
  async countSentSince(type, since, listId = null) {
    const listIds = await this._bucketListIds(type, listId);
    if (listIds.length === 0) return 0;
    return this.contacts.countDocuments({
      listId: { $in: listIds }, status: 'sent', sentAt: { $gte: since },
    });
  }

  /** Oldest `limit` pending contacts for a bucket (all lists of type, or one). */
  async pickPending(type, limit, listId = null) {
    if (limit <= 0) return [];
    const listIds = await this._bucketListIds(type, listId);
    if (listIds.length === 0) return [];
    return this.contacts
      .find({ listId: { $in: listIds }, status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
  }

  async markContact(id, status) {
    if (!isValidId(id) || !VALID_STATUS.has(status)) return;
    const $set = { status, updatedAt: new Date() };
    if (status === 'sent') $set.sentAt = new Date();
    await this.contacts.updateOne({ _id: toId(id) }, { $set });
  }

  /** Totals for the admin progress readout — whole type, or one list. */
  async statsByType(type, listId = null) {
    const listIds = await this._bucketListIds(type, listId);
    if (listIds.length === 0) return { pending: 0, sent: 0, failed: 0, unsubscribed: 0, total: 0 };
    const rows = await this.contacts.aggregate([
      { $match: { listId: { $in: listIds } } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]).toArray();
    const out = { pending: 0, sent: 0, failed: 0, unsubscribed: 0, total: 0 };
    for (const r of rows) { if (r._id in out) out[r._id] = r.n; out.total += r.n; }
    return out;
  }
}

module.exports = ContactListService;
