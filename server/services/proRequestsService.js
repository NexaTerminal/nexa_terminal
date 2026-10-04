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
// 'open' = admin-approved and broadcast to the Pro board, awaiting a Pro to claim.
const STATUSES = ['pending_approval', 'open', 'active', 'closed', 'rejected'];
const MSG_KINDS = ['message', 'quote'];

// Which board category a request belongs to, derived from the AI agent it came
// from. Step 1 routes everything legal to lawyers; other categories are reserved
// for later (HR consultants, marketing pros, …).
const AGENT_TO_CATEGORY = Object.freeze({
  legal: 'legal',
  corporate: 'legal',
  hr: 'legal',
  marketing: 'marketing',
  people: 'hr',
  insurance: 'insurance',
});
const DEFAULT_CATEGORY = 'legal';

// Legal practice areas (subset of roles.js PRACTICE_AREAS). A Pro is eligible for
// the 'legal' board if they declare any of these — or none at all (treated as a
// general lawyer during the founding cohort).
const LEGAL_PRACTICE_AREAS = Object.freeze([
  'consumer-legal', 'immigration', 'citizenship', 'company-registration',
  'ip-law', 'tax-accounting', 'labor-law', 'general-legal',
]);
const CATEGORY_TO_PRACTICE_AREAS = Object.freeze({
  legal: LEGAL_PRACTICE_AREAS,
});

function categoryForAgent(agent) {
  return AGENT_TO_CATEGORY[agent] || DEFAULT_CATEGORY;
}

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
    await this.col.createIndex({ status: 1, category: 1, createdAt: -1 });
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
      category: doc.category || null,
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
      openedAt: doc.openedAt || null,
      claimedAt: doc.claimedAt || null,
      closedAt: doc.closedAt || null,
    };
  }

  // Board view for Pros BEFORE they claim: enough to decide, without exposing the
  // requester's direct contact details (revealed once claimed → thread).
  static presentForBoard(doc) {
    if (!doc) return null;
    return {
      _id: String(doc._id),
      type: doc.type,
      status: doc.status,
      subject: doc.subject,
      category: doc.category || null,
      companyName: doc.companyName || null,
      aiSummary: doc.context?.aiSummary || null,
      question: doc.context?.question || null,
      documentName: doc.context?.documentName || null,
      createdAt: doc.createdAt,
      openedAt: doc.openedAt || null,
    };
  }

  // ── Create (user) ──────────────────────────────────────────────────────────
  // `aiSummary` is a short brief of the AI↔user conversation, generated by the
  // controller at creation time so BOTH the admin (reviewing) and the Pro
  // (deciding whether to claim) read the same summary before committing.
  async create(user, input = {}, aiSummary = null) {
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
      aiSummary: clamp(aiSummary, 4000) || null,
    };

    const agent = clamp(input.agent, 40) || null;
    const now = new Date();
    const doc = {
      type,
      status: 'pending_approval',
      subject,
      agent,
      category: categoryForAgent(agent),
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

  // ── Board model: approve → broadcast → first Pro claims ──────────────────────

  // Is a Pro user eligible to see/claim a given category's requests?
  // Legal: admin_user with any legal practice area, or none declared (founding
  // cohort = treated as general lawyer). Platform admin is always eligible.
  static proEligibleForCategory(proUser, category) {
    if (!proUser) return false;
    if (proUser.role === 'admin' || proUser.isAdmin === true) return true;
    if (proUser.role !== 'admin_user') return false;
    const areas = CATEGORY_TO_PRACTICE_AREAS[category] || [];
    if (areas.length === 0) return false; // unknown category → nobody (safe default)
    const mine = proUser.superUser?.practiceAreas || [];
    if (mine.length === 0) return true; // no declared areas → eligible (general)
    return mine.some((a) => areas.includes(a));
  }

  // Admin approves a pending request onto the open board. Optionally stores an
  // AI-generated summary (built by the controller) into context.aiSummary.
  async approveToBoard(id, aiSummary) {
    const _id = ProRequestsService.toObjectId(id);
    if (!_id) throw invalid('Невалиден идентификатор.');
    const now = new Date();
    const set = { status: 'open', openedAt: now, updatedAt: now };
    if (aiSummary) set['context.aiSummary'] = clamp(aiSummary, 4000);
    const res = await this.col.findOneAndUpdate(
      { _id, status: 'pending_approval' },
      { $set: set },
      { returnDocument: 'after' }
    );
    const doc = res?.value || res;
    if (!doc || !doc._id) throw invalid('Барањето веќе е обработено.');
    return ProRequestsService.present(doc);
  }

  // Open requests a given Pro may claim (matched by category eligibility).
  async listBoardForPro(proUser) {
    await this._ensureIndexes();
    if (proUser.role === 'admin' || proUser.isAdmin === true) {
      const docs = await this.col.find({ status: 'open' }).sort({ openedAt: -1 }).toArray();
      return docs.map(ProRequestsService.presentForBoard);
    }
    if (proUser.role !== 'admin_user') return [];
    const mine = proUser.superUser?.practiceAreas || [];
    // Eligible categories = those whose area set this Pro overlaps, or (if the Pro
    // declared no areas) every category (general). Step 1 only 'legal' exists.
    const categories = Object.keys(CATEGORY_TO_PRACTICE_AREAS).filter((cat) =>
      ProRequestsService.proEligibleForCategory(proUser, cat)
    );
    if (categories.length === 0) return [];
    void mine;
    const docs = await this.col
      .find({ status: 'open', category: { $in: categories } })
      .sort({ openedAt: -1 })
      .toArray();
    return docs.map(ProRequestsService.presentForBoard);
  }

  // First-come claim. Atomic: only one Pro can flip 'open' → 'active'. The claimer
  // becomes the assigned Pro (their name is shown publicly in the thread).
  async claim(proUser, id, consent) {
    await this._ensureIndexes();
    const _id = ProRequestsService.toObjectId(id);
    if (!_id) throw invalid('Невалиден идентификатор.');

    const doc = await this.col.findOne({ _id });
    if (!doc) throw notFound();
    if (doc.status !== 'open') throw invalid('Ова барање веќе е преземено или не е отворено.');
    if (!ProRequestsService.proEligibleForCategory(proUser, doc.category)) {
      throw forbidden();
    }

    const now = new Date();
    const res = await this.col.findOneAndUpdate(
      { _id, status: 'open' },
      {
        $set: {
          status: 'active',
          assignedProId: proUser._id,
          assignedProName: clamp(proUser.name || proUser.username || proUser.companyInfo?.companyName, 160) || null,
          assignedProEmail: clamp(proUser.email, 200) || null,
          claimedAt: now,
          updatedAt: now,
          proConsent: { acceptedAt: now, version: Number(consent?.version) || 1 },
        },
      },
      { returnDocument: 'after' }
    );
    const updated = res?.value || res;
    if (!updated || !updated._id) throw invalid('Ова барање штотуку беше преземено од друг професионалец.');
    return ProRequestsService.present(updated);
  }

  // All Pros to notify when a request opens for a category (for broadcast email).
  async eligibleProsForCategory(category) {
    const areas = CATEGORY_TO_PRACTICE_AREAS[category] || [];
    if (areas.length === 0) return [];
    const docs = await this.users
      .find({
        role: 'admin_user',
        'subscription.status': 'active',
        $or: [
          { 'superUser.practiceAreas': { $in: areas } },
          { 'superUser.practiceAreas': { $exists: false } },
          { 'superUser.practiceAreas': { $size: 0 } },
        ],
      })
      .project({ email: 1, name: 1, username: 1, 'companyInfo.companyName': 1 })
      .limit(500)
      .toArray();
    return docs
      .filter((u) => u.email)
      .map((u) => ({
        _id: String(u._id),
        name: u.name || u.username || u.companyInfo?.companyName || 'Про член',
        email: u.email,
      }));
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
}

module.exports = ProRequestsService;
