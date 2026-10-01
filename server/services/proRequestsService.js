/**
 * Pro Requests service — the "Ask a Pro" bridge (Queries / Барања).
 *
 * A pro request is a human handoff created from the AI side:
 *   - type 'consult'          → a question raised from an AI chat
 *   - type 'contract_review'  → a review request on a generated agreement
 *
 * Lifecycle: pending_approval → (admin approves + hand-picks a Pro) active →
 * closed. Admin may instead reject. While active, the requester (Basic user)
 * and the assigned Pro exchange messages in an embedded thread; the Pro may post
 * a structured `quote` message (price) at any point. Payment happens offline.
 *
 * Three actors read the same object through different scopes:
 *   - user  → their own requests        (userId === caller)
 *   - pro   → requests assigned to them (assignedProId === caller)
 *   - admin → everything
 *
 * Collection: `pro_requests`. Thread messages are embedded sub-documents (few
 * per request) — same rationale as cases.deadlines / contracts.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'pro_requests';

const TYPES = ['consult', 'contract_review'];
const STATUSES = ['pending_approval', 'active', 'closed', 'rejected'];
const MSG_KINDS = ['message', 'quote'];

const clamp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt);

function invalid(message, fields) {
  const e = new Error(message); e.code = 'INVALID_INPUT'; if (fields) e.fields = fields; return e;
}
function notFound() { const e = new Error('Барањето не е пронајдено.'); e.code = 'NOT_FOUND'; return e; }
function forbidden() { const e = new Error('Немате пристап до ова барање.'); e.code = 'FORBIDDEN'; return e; }

class ProRequestsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.users = db.collection('users');
    this._indexed = false;
  }

  static toObjectId(id) {
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex({ userId: 1, updatedAt: -1 });
    await this.col.createIndex({ assignedProId: 1, updatedAt: -1 });
    await this.col.createIndex({ status: 1, createdAt: -1 });
    this._indexed = true;
  }

  // Snapshot of the requester, kept on the doc so admin/pro lists don't need joins.
  static _userSnapshot(user) {
    return {
      userId: user._id,
      userEmail: clamp(user.email, 200) || null,
      userName: clamp(user.name || user.username, 160) || null,
      companyName: clamp(user.companyInfo?.companyName, 200) || null,
    };
  }

  static _publicMessage(m) {
    return {
      _id: String(m._id),
      authorId: m.authorId ? String(m.authorId) : null,
      authorRole: m.authorRole,
      authorName: m.authorName || null,
      body: m.body || '',
      kind: m.kind || 'message',
      amount: m.amount ?? null,
      currency: m.currency || null,
      createdAt: m.createdAt,
    };
  }

  // Shape a request for API responses (stringify ids, normalize messages).
  static present(doc) {
    if (!doc) return null;
    return {
      _id: String(doc._id),
      type: doc.type,
      status: doc.status,
      subject: doc.subject,
      agent: doc.agent || null,
      context: doc.context || {},
      userId: String(doc.userId),
      userEmail: doc.userEmail || null,
      userName: doc.userName || null,
      companyName: doc.companyName || null,
      assignedProId: doc.assignedProId ? String(doc.assignedProId) : null,
      assignedProName: doc.assignedProName || null,
      assignedProEmail: doc.assignedProEmail || null,
      rejectionReason: doc.rejectionReason || null,
      messages: (doc.messages || []).map(ProRequestsService._publicMessage),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      closedAt: doc.closedAt || null,
    };
  }

  // ── Create (user) ──────────────────────────────────────────────────────────
  async create(user, input = {}) {
    await this._ensureIndexes();
    const type = oneOf(input.type, TYPES, null);
    if (!type) throw invalid('Непознат вид на барање.', ['type']);

    const subject = clamp(input.subject, 240);
    if (!subject) throw invalid('Насловот е задолжителен.', ['subject']);

    // Context is type-specific; we trust only known, size-capped fields.
    const ctxIn = input.context || {};
    const context = {
      question: clamp(ctxIn.question, 4000) || null,
      conversationId: clamp(ctxIn.conversationId, 64) || null,
      transcriptExcerpt: clamp(ctxIn.transcriptExcerpt, 6000) || null,
      documentRef: clamp(ctxIn.documentRef, 600) || null,
      documentName: clamp(ctxIn.documentName, 240) || null,
    };

    const now = new Date();
    const doc = {
      type,
      status: 'pending_approval',
      subject,
      agent: clamp(input.agent, 40) || null,
      context,
      ...ProRequestsService._userSnapshot(user),
      consent: {
        acceptedAt: now,
        version: Number(input.consentVersion) || 1,
      },
      assignedProId: null,
      assignedProName: null,
      assignedProEmail: null,
      rejectionReason: null,
      messages: [],
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    const { insertedId } = await this.col.insertOne(doc);
    return ProRequestsService.present({ ...doc, _id: insertedId });
  }

  // ── Reads (role-scoped) ─────────────────────────────────────────────────────
  async listForUser(userId) {
    await this._ensureIndexes();
    const id = ProRequestsService.toObjectId(userId);
    const docs = await this.col.find({ userId: id }).sort({ updatedAt: -1 }).toArray();
    return docs.map(ProRequestsService.present);
  }

  async listForPro(proId) {
    await this._ensureIndexes();
    const id = ProRequestsService.toObjectId(proId);
    const docs = await this.col.find({ assignedProId: id }).sort({ updatedAt: -1 }).toArray();
    return docs.map(ProRequestsService.present);
  }

  async listForAdmin({ status } = {}) {
    await this._ensureIndexes();
    const q = {};
    if (status && STATUSES.includes(status)) q.status = status;
    const docs = await this.col.find(q).sort({ createdAt: -1 }).toArray();
    return docs.map(ProRequestsService.present);
  }

  // Raw doc + access check for a given actor. isAdmin when visibleTier==='ADMIN'.
  async _getForActor(actor, id, isAdmin) {
    const _id = ProRequestsService.toObjectId(id);
    if (!_id) throw invalid('Невалиден идентификатор.');
    const doc = await this.col.findOne({ _id });
    if (!doc) throw notFound();
    const uid = String(actor._id);
    const owner = String(doc.userId) === uid;
    const assigned = doc.assignedProId && String(doc.assignedProId) === uid;
    if (!owner && !assigned && !isAdmin) throw forbidden();
    return { doc, owner, assigned, isAdmin: !!isAdmin };
  }

  async getForActor(actor, id, isAdmin) {
    const { doc } = await this._getForActor(actor, id, isAdmin);
    return ProRequestsService.present(doc);
  }

  // ── Thread ──────────────────────────────────────────────────────────────────
  async addMessage(actor, id, body, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
    if (doc.status !== 'active') throw invalid('Разговорот не е активен.');
    const text = clamp(body, 6000);
    if (!text) throw invalid('Пораката не може да биде празна.');

    const authorRole = isAdmin ? 'admin' : owner ? 'user' : 'pro';
    const message = {
      _id: new ObjectId(),
      authorId: actor._id,
      authorRole,
      authorName: clamp(actor.name || actor.username || actor.companyInfo?.companyName, 160) || null,
      body: text,
      kind: 'message',
      amount: null,
      currency: null,
      createdAt: new Date(),
    };
    await this.col.updateOne(
      { _id: doc._id },
      { $push: { messages: message }, $set: { updatedAt: new Date() } }
    );
    return { request: ProRequestsService.present({ ...doc, messages: [...doc.messages, message], updatedAt: new Date() }), message: ProRequestsService._publicMessage(message), authorRole };
  }

  // Structured price offer — assigned Pro only.
  async addQuote(actor, id, { amount, currency, body }, isAdmin) {
    const { doc, assigned } = await this._getForActor(actor, id, isAdmin);
    if (!assigned && !isAdmin) throw forbidden();
    if (doc.status !== 'active') throw invalid('Разговорот не е активен.');
    const amt = Number(amount);
    if (!amt || amt <= 0) throw invalid('Внесете валиден износ.', ['amount']);

    const message = {
      _id: new ObjectId(),
      authorId: actor._id,
      authorRole: 'pro',
      authorName: clamp(actor.name || actor.username || actor.companyInfo?.companyName, 160) || null,
      body: clamp(body, 2000) || null,
      kind: 'quote',
      amount: amt,
      currency: clamp(currency, 8) || 'МКД',
      createdAt: new Date(),
    };
    await this.col.updateOne(
      { _id: doc._id },
      { $push: { messages: message }, $set: { updatedAt: new Date() } }
    );
    return { request: ProRequestsService.present({ ...doc, messages: [...doc.messages, message], updatedAt: new Date() }), message: ProRequestsService._publicMessage(message) };
  }

  // ── Admin actions ────────────────────────────────────────────────────────────
  async approveAndAssign(id, proId) {
    const _id = ProRequestsService.toObjectId(id);
    if (!_id) throw invalid('Невалиден идентификатор.');
    const pid = ProRequestsService.toObjectId(proId);
    if (!pid) throw invalid('Изберете професионалец.', ['assignedProId']);

    const pro = await this.users.findOne({ _id: pid });
    if (!pro) throw invalid('Избраниот професионалец не постои.', ['assignedProId']);

    const now = new Date();
    const res = await this.col.findOneAndUpdate(
      { _id, status: 'pending_approval' },
      {
        $set: {
          status: 'active',
          assignedProId: pid,
          assignedProName: clamp(pro.name || pro.username || pro.companyInfo?.companyName, 160) || null,
          assignedProEmail: clamp(pro.email, 200) || null,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );
    const doc = res?.value || res; // driver version tolerance (v5 {value} / v6 doc)
    if (!doc || !doc._id) throw invalid('Барањето веќе е обработено.');
    return ProRequestsService.present(doc);
  }

  async reject(id, reason) {
    const _id = ProRequestsService.toObjectId(id);
    if (!_id) throw invalid('Невалиден идентификатор.');
    const now = new Date();
    const res = await this.col.findOneAndUpdate(
      { _id, status: 'pending_approval' },
      { $set: { status: 'rejected', rejectionReason: clamp(reason, 600) || null, updatedAt: now, closedAt: now } },
      { returnDocument: 'after' }
    );
    const doc = res?.value || res;
    if (!doc || !doc._id) throw invalid('Барањето веќе е обработено.');
    return ProRequestsService.present(doc);
  }

  // ── Close (owner or assigned Pro or admin) ───────────────────────────────────
  async close(actor, id, isAdmin) {
    const { doc } = await this._getForActor(actor, id, isAdmin);
    if (doc.status !== 'active') throw invalid('Само активно барање може да се затвори.');
    const now = new Date();
    await this.col.updateOne({ _id: doc._id }, { $set: { status: 'closed', updatedAt: now, closedAt: now } });
    return ProRequestsService.present({ ...doc, status: 'closed', updatedAt: now, closedAt: now });
  }

  // ── Providers (admin hand-pick list) ─────────────────────────────────────────
  async listProviders() {
    const docs = await this.users
      .find({
        role: { $ne: 'admin' },
        $or: [
          { role: 'admin_user' },
          { 'subscription.plan': { $in: ['pro', 'admin_5', 'admin_10'] } },
        ],
      })
      .project({ email: 1, name: 1, username: 1, 'companyInfo.companyName': 1 })
      .limit(500)
      .toArray();
    return docs.map((u) => ({
      _id: String(u._id),
      name: u.name || u.username || u.companyInfo?.companyName || u.email || 'Про член',
      email: u.email || null,
      companyName: u.companyInfo?.companyName || null,
    }));
  }
}

module.exports = ProRequestsService;
