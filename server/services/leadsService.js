/**
 * Leads Service — collection access + thin CRUD helpers for inbound leads
 * from the Nexa satellite sites.
 *
 * The lead inbox is conceptually similar to offer_requests (see
 * offerRequestService.js). It is intentionally NOT a CRM — status flags
 * + notes are the whole model.
 *
 * Slice 0: collection + helpers only. No routes, no auto-routing, no email.
 * Inbound HMAC validation, admin queue, and auto-routing arrive in Slice 3+.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'leads';

const LEAD_STATUSES = Object.freeze([
  'new',         // inbound, not yet assigned
  'offered',     // posted to a self-serve claim pool, visible to N admin_users
  'assigned',    // exclusively routed/claimed by one admin_user
  'contacted',   // admin_user contacted the prospect
  'won',         // closed positive
  'lost',        // closed negative
  'expired',     // stale > 72h with no progression
  'dismissed'    // admin rejected (spam / junk / wrong match)
]);

const SOURCE_SITES = Object.freeze([
  'samodaprasham',
  'immigration',
  'macedoniancitizenship',
  'company',
  'iplaw',
  'topics',
  'nexa'
]);

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));

class LeadsService {
  constructor(database) {
    if (!database) throw new Error('LeadsService requires a database instance');
    this.db = database;
    this.col = database.collection(COLLECTION);
  }

  // One-time index creation. Called from server boot (Slice 3 will wire it).
  async ensureIndexes() {
    await this.col.createIndex({ status: 1, receivedAt: -1 });
    await this.col.createIndex({ assignedSuperUserId: 1, receivedAt: -1 });
    await this.col.createIndex({ practiceArea: 1, city: 1 });
    await this.col.createIndex({ sourceSite: 1 });
  }

  async findById(id) {
    return this.col.findOne({ _id: toObjectId(id) });
  }

  async insert(lead) {
    const now = new Date();
    const doc = {
      sourceSite: lead.sourceSite,
      practiceArea: lead.practiceArea,
      city: lead.city || null,
      language: lead.language || 'mk',
      payload: lead.payload || {},
      assignedSuperUserId: null,
      assignedAt: null,
      offeredTo: [],
      offeredAt: null,
      claimedBy: null,
      claimedAt: null,
      status: 'new',
      notes: [],
      receivedAt: now,
      updatedAt: now
    };
    const result = await this.col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  /**
   * Admin offers a lead to N admin_users (the claim pool).
   * Sets status='offered', offeredTo=[ids], offeredAt=now.
   */
  async offer(leadId, superUserIds) {
    if (!Array.isArray(superUserIds) || superUserIds.length === 0) {
      throw new Error('At least one candidate required');
    }
    const ids = superUserIds.map(toObjectId);
    const now = new Date();
    const result = await this.col.findOneAndUpdate(
      { _id: toObjectId(leadId), status: { $in: ['new', 'expired'] } },
      { $set: { status: 'offered', offeredTo: ids, offeredAt: now, updatedAt: now } },
      { returnDocument: 'after', includeResultMetadata: true }
    );
    if (!result?.value) throw new Error('Lead is not in a state that can be offered');
    return result.value;
  }

  /**
   * SU claims an offered lead. Atomic — only the first call where status='offered'
   * AND offeredTo contains this user's id will succeed. Losers get null.
   */
  async claim(leadId, superUserId) {
    const id = toObjectId(superUserId);
    const now = new Date();
    const result = await this.col.findOneAndUpdate(
      { _id: toObjectId(leadId), status: 'offered', offeredTo: id },
      {
        $set: {
          status: 'assigned',
          assignedSuperUserId: id,
          assignedAt: now,
          claimedBy: id,
          claimedAt: now,
          updatedAt: now
        }
      },
      { returnDocument: 'after', includeResultMetadata: true }
    );
    return result?.value || null;
  }

  /** List leads currently offered to a specific admin_user (their "Available" tab). */
  async listAvailableFor(superUserId, { page = 1, pageSize = 25 } = {}) {
    const id = toObjectId(superUserId);
    const q = { status: 'offered', offeredTo: id };
    const skip = Math.max(0, (page - 1) * pageSize);
    const [items, total] = await Promise.all([
      this.col.find(q).sort({ offeredAt: -1 }).skip(skip).limit(pageSize).toArray(),
      this.col.countDocuments(q)
    ]);
    return { items, total, page, pageSize };
  }

  async updateById(id, patch) {
    const update = { ...patch, updatedAt: new Date() };
    const result = await this.col.findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    return result?.value || null;
  }

  async appendNote(id, { by, text }) {
    const note = { at: new Date(), by: by ? toObjectId(by) : null, text };
    await this.col.updateOne(
      { _id: toObjectId(id) },
      { $push: { notes: note }, $set: { updatedAt: new Date() } }
    );
    return note;
  }

  /**
   * Paginated query. Filters: { status, sourceSite, practiceArea, assignedSuperUserId }
   * Pagination: { page, pageSize }
   */
  async listByQuery(filter = {}, { page = 1, pageSize = 20 } = {}) {
    const q = {};
    if (filter.status) q.status = filter.status;
    if (filter.sourceSite) q.sourceSite = filter.sourceSite;
    if (filter.practiceArea) q.practiceArea = filter.practiceArea;
    if (filter.assignedSuperUserId) q.assignedSuperUserId = toObjectId(filter.assignedSuperUserId);

    const skip = Math.max(0, (page - 1) * pageSize);
    const [items, total] = await Promise.all([
      this.col.find(q).sort({ receivedAt: -1 }).skip(skip).limit(pageSize).toArray(),
      this.col.countDocuments(q)
    ]);
    return { items, total, page, pageSize };
  }
}

module.exports = LeadsService;
module.exports.COLLECTION = COLLECTION;
module.exports.LEAD_STATUSES = LEAD_STATUSES;
module.exports.SOURCE_SITES = SOURCE_SITES;
