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
const { redactPii, redactPiiKeepLines, REDACTED } = require('../utils/redactPii');
const { anonymizeForPro } = require('./aiSummaryService');

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
  accounting: 'accounting',
});
const DEFAULT_CATEGORY = 'legal';

function categoryForAgent(agent) {
  return AGENT_TO_CATEGORY[agent] || DEFAULT_CATEGORY;
}

// Is this user a Pro who may see/join the board? Any Pro (admin_user) or platform
// admin — no practice-area/category gating: every Pro can join any open conversation.
function isPro(user) {
  return !!user && (user.role === 'admin' || user.isAdmin === true || user.role === 'admin_user');
}

const clamp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt);

// Form fields that identify a person or company inside a document preview link.
const IDENTITY_KEY = /name|address|pin|embg|edb|tax|manager|representative|email|phone|iban|account|bank|passport|idcard|birth|signat/i;

/**
 * Document preview links (`/preview/<type>?data=<base64(encodeURIComponent(JSON))>`)
 * carry the whole form — company + employee identity, EMBG. For the Pro, blank the
 * identity fields and pattern-redact the rest, so they review the document's
 * substance without learning who it's for. Other links pass through unchanged.
 */
function redactDocumentRef(ref) {
  if (!ref) return null;
  const m = String(ref).match(/^(.*\/preview\/[^?]+\?data=)([^&#]+)(.*)$/);
  if (!m) return ref;
  try {
    const data = JSON.parse(decodeURIComponent(Buffer.from(decodeURIComponent(m[2]), 'base64').toString('utf8')));
    for (const [k, v] of Object.entries(data)) {
      if (typeof v !== 'string' || !v) continue;
      data[k] = IDENTITY_KEY.test(k) ? REDACTED : redactPii(v);
    }
    return m[1] + Buffer.from(encodeURIComponent(JSON.stringify(data))).toString('base64') + m[3];
  } catch {
    return null; // unparseable → never leak the raw form data
  }
}

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

  static _publicMessage(m, maskUser = false) {
    return {
      _id: String(m._id),
      authorId: m.authorId ? String(m.authorId) : null,
      authorRole: m.authorRole,
      // The requester (SMB) stays anonymous to the Pro until they reveal — so a
      // user-authored message shows no name on Pro-facing views.
      authorName: (maskUser && m.authorRole === 'user') ? 'Анонимен корисник' : (m.authorName || null),
      // The Pro reads the anonymized copy of the user's words (personal data
      // redacted at send time); legacy messages fall back to pattern redaction.
      body: (maskUser && m.authorRole === 'user') ? (m.bodyForPro || redactPiiKeepLines(m.body)) : (m.body || ''),
      kind: m.kind || 'message',
      amount: m.amount ?? null,
      currency: m.currency || null,
      createdAt: m.createdAt,
    };
  }

  // An active conversation is waiting on the Pro when the user spoke last — or
  // nobody has written since the Pro joined (the original question is pending).
  static awaitingPro(doc) {
    if (!doc || doc.status !== 'active') return false;
    const last = (doc.messages || [])[(doc.messages || []).length - 1];
    return !last || last.authorRole === 'user';
  }

  // What a Pro may see of the request's text: the anonymized copy made at create
  // time (`context.proSafe`), or — for requests created before it existed — the
  // raw text through pattern redaction. Never the raw user text.
  static _proSafe(doc) {
    const ctx = doc.context || {};
    const ps = ctx.proSafe;
    return {
      subject: ps ? ps.subject : redactPii(doc.subject),
      context: {
        question: ps ? ps.question : (ctx.question ? redactPii(ctx.question) : null),
        conversationId: ctx.conversationId || null,
        transcriptExcerpt: ps ? ps.transcript : (ctx.transcriptExcerpt ? redactPiiKeepLines(ctx.transcriptExcerpt) : null),
        documentRef: ps ? ps.documentRef : redactDocumentRef(ctx.documentRef),
        documentName: ps ? ps.documentName : (ctx.documentName ? redactPii(ctx.documentName) : null),
        aiSummary: ctx.aiSummary || null, // already anonymized at create time
      },
    };
  }

  // Shape a request for API responses (stringify ids, normalize messages).
  // `viewerRole` ∈ 'user' (owner) | 'pro' (assigned) | 'admin' | undefined.
  // A Pro sees the requester as anonymous until `userRevealed` is set by the user:
  // identity fields are hidden AND every user-authored text is the anonymized copy.
  static present(doc, viewerRole) {
    if (!doc) return null;
    const maskUser = viewerRole === 'pro' && !doc.userRevealed;
    const { proSafe, ...rawContext } = doc.context || {};
    const safe = maskUser ? ProRequestsService._proSafe(doc) : null;
    return {
      _id: String(doc._id),
      type: doc.type,
      status: doc.status,
      subject: safe ? safe.subject : doc.subject,
      agent: doc.agent || null,
      category: doc.category || null,
      context: safe ? safe.context : rawContext,
      userId: String(doc.userId),
      userRevealed: !!doc.userRevealed,
      userEmail: maskUser ? null : (doc.userEmail || null),
      userName: maskUser ? null : (doc.userName || null),
      companyName: maskUser ? null : (doc.companyName || null),
      assignedProId: doc.assignedProId ? String(doc.assignedProId) : null,
      assignedProName: doc.assignedProName || null,
      assignedProEmail: doc.assignedProEmail || null,
      // Pro's public profile — always visible to the user (from the Pro's account).
      assignedProCity: doc.assignedProCity || null,
      assignedProAddress: doc.assignedProAddress || null,
      assignedProWebsite: doc.assignedProWebsite || null,
      assignedProPhone: doc.assignedProPhone || null,
      assignedProLicense: doc.assignedProLicense || null,
      rejectionReason: doc.rejectionReason || null,
      // Per-side email opt-out for this conversation (bell notifications stay on).
      emailMuted: { user: !!doc.emailMuted?.user, pro: !!doc.emailMuted?.pro },
      awaitingPro: ProRequestsService.awaitingPro(doc),
      messages: (doc.messages || []).map((m) => ProRequestsService._publicMessage(m, maskUser)),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      openedAt: doc.openedAt || null,
      claimedAt: doc.claimedAt || null,
      closedAt: doc.closedAt || null,
    };
  }

  // Board view for Pros BEFORE they claim: enough to decide, WITHOUT exposing the
  // requester's identity (the SMB is anonymous by default — never show company).
  static presentForBoard(doc) {
    if (!doc) return null;
    const safe = ProRequestsService._proSafe(doc);
    return {
      _id: String(doc._id),
      type: doc.type,
      status: doc.status,
      subject: safe.subject,
      category: doc.category || null,
      companyName: null, // anonymous — requester identity is never on the board
      aiSummary: safe.context.aiSummary,
      question: safe.context.question,
      transcript: safe.context.transcriptExcerpt,
      documentName: safe.context.documentName,
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

    // Pro-facing copy of the user's text, anonymized once here so the board, the
    // Pro's thread view and Pro emails never carry raw personal data.
    const anon = await anonymizeForPro({
      subject,
      question: context.question,
      transcript: context.transcriptExcerpt,
    });
    context.proSafe = {
      subject: clamp(anon.subject, 240) || 'Барање за професионалец',
      question: anon.question || null,
      transcript: anon.transcript || null,
      documentRef: redactDocumentRef(context.documentRef),
      documentName: context.documentName ? redactPii(context.documentName) : null,
    };

    const agent = clamp(input.agent, 40) || null;
    const now = new Date();
    // Requests are published straight to the open board (no admin-approval gate):
    // created 'open' and broadcast to eligible Pros immediately. Admin may still
    // reject an open request to pull it back.
    const doc = {
      type,
      status: 'open',
      subject,
      agent,
      category: categoryForAgent(agent),
      context,
      ...ProRequestsService._userSnapshot(user),
      userRevealed: false, // SMB is anonymous to the Pro until they opt to reveal
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
      openedAt: now,
      closedAt: null,
    };
    const { insertedId } = await this.col.insertOne(doc);
    // `proSubject` is for Pro-facing notifications (the owner's item keeps the raw subject).
    return { item: ProRequestsService.present({ ...doc, _id: insertedId }), proSubject: context.proSafe.subject };
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
    return docs.map((d) => ProRequestsService.present(d, 'pro'));
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

  // Raw (unmasked) notification targets for server-side emails/notifications.
  // NEVER sent to a Pro client — kept separate from present() so masking the
  // user's identity on the Pro view doesn't break "new message" emails.
  static _notifyTargets(doc) {
    return {
      userEmail: doc.userEmail || null,
      userId: doc.userId ? String(doc.userId) : null,
      assignedProEmail: doc.assignedProEmail || null,
      assignedProId: doc.assignedProId ? String(doc.assignedProId) : null,
      subject: doc.subject || null,
      proSubject: ProRequestsService._proSafe(doc).subject || null, // for Pro-facing emails/bells
      userEmailMuted: !!doc.emailMuted?.user,
      proEmailMuted: !!doc.emailMuted?.pro,
    };
  }

  // Map access flags → the viewerRole that drives anonymity masking in present().
  static _viewerRole({ owner, assigned, isAdmin }) {
    if (isAdmin) return 'admin';
    if (owner) return 'user';
    if (assigned) return 'pro';
    return undefined;
  }

  async getForActor(actor, id, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
    return ProRequestsService.present(doc, ProRequestsService._viewerRole({ owner, assigned, isAdmin }));
  }

  // Owner (SMB) opts to reveal / re-hide their identity to the assigned Pro.
  async setRevealed(actor, id, revealed, isAdmin) {
    const { doc, owner } = await this._getForActor(actor, id, isAdmin);
    if (!owner && !isAdmin) throw forbidden();
    const now = new Date();
    await this.col.updateOne(
      { _id: doc._id },
      { $set: { userRevealed: !!revealed, userRevealedAt: revealed ? now : null, updatedAt: now } }
    );
    return ProRequestsService.present({ ...doc, userRevealed: !!revealed, updatedAt: now }, 'user');
  }

  // Either side turns the per-step emails for THIS conversation on/off for themselves.
  async setEmailMuted(actor, id, muted, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
    if (!owner && !assigned) throw forbidden();
    const side = owner ? 'user' : 'pro';
    const now = new Date();
    await this.col.updateOne({ _id: doc._id }, { $set: { [`emailMuted.${side}`]: !!muted, updatedAt: now } });
    const viewerRole = ProRequestsService._viewerRole({ owner, assigned, isAdmin });
    return ProRequestsService.present({ ...doc, emailMuted: { ...(doc.emailMuted || {}), [side]: !!muted }, updatedAt: now }, viewerRole);
  }

  // Active conversations assigned to this Pro that wait on their reply (badge +
  // banner). Subjects are the anonymized Pro-facing copy.
  async unansweredForPro(proId) {
    await this._ensureIndexes();
    const id = ProRequestsService.toObjectId(proId);
    const docs = await this.col
      .find({ assignedProId: id, status: 'active' })
      .project({ status: 1, subject: 1, context: 1, messages: { $slice: -1 }, updatedAt: 1, claimedAt: 1 })
      .toArray();
    const items = docs.filter(ProRequestsService.awaitingPro).map((d) => ({
      _id: String(d._id),
      subject: ProRequestsService._proSafe(d).subject,
      since: (d.messages && d.messages[0]?.createdAt) || d.claimedAt || d.updatedAt,
    }));
    items.sort((a, b) => new Date(a.since) - new Date(b.since)); // longest-waiting first
    return { count: items.length, items };
  }

  // ── Thread ──────────────────────────────────────────────────────────────────
  async addMessage(actor, id, body, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
    if (doc.status !== 'active') throw invalid('Разговорот не е активен.');
    const text = clamp(body, 6000);
    if (!text) throw invalid('Пораката не може да биде празна.');

    const authorRole = isAdmin ? 'admin' : owner ? 'user' : 'pro';
    // The user's words reach the Pro only as an anonymized copy.
    const bodyForPro = authorRole === 'user' ? (await anonymizeForPro({ body: text })).body : undefined;
    const message = {
      _id: new ObjectId(),
      authorId: actor._id,
      authorRole,
      authorName: clamp(actor.name || actor.username || actor.companyInfo?.companyName, 160) || null,
      body: text,
      ...(bodyForPro ? { bodyForPro } : {}),
      kind: 'message',
      amount: null,
      currency: null,
      createdAt: new Date(),
    };
    await this.col.updateOne(
      { _id: doc._id },
      { $push: { messages: message }, $set: { updatedAt: new Date() } }
    );
    const viewerRole = ProRequestsService._viewerRole({ owner, assigned, isAdmin });
    const maskUser = viewerRole === 'pro' && !doc.userRevealed;
    return {
      request: ProRequestsService.present({ ...doc, messages: [...doc.messages, message], updatedAt: new Date() }, viewerRole),
      message: ProRequestsService._publicMessage(message, maskUser),
      authorRole,
      targets: ProRequestsService._notifyTargets(doc),
      proBody: bodyForPro || text, // what the Pro may read of this message (email)
    };
  }

  // Structured price offer — assigned Pro only.
  async addQuote(actor, id, { amount, currency, body }, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
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
    const viewerRole = ProRequestsService._viewerRole({ owner, assigned, isAdmin });
    return {
      request: ProRequestsService.present({ ...doc, messages: [...doc.messages, message], updatedAt: new Date() }, viewerRole),
      message: ProRequestsService._publicMessage(message),
      targets: ProRequestsService._notifyTargets(doc),
    };
  }

  // ── Board model: auto-broadcast → first Pro claims ───────────────────────────

  // Any Pro may see/claim any open conversation (no category gating).
  static proEligibleForCategory(proUser) {
    return isPro(proUser);
  }

  // All open conversations awaiting a Pro — visible to every Pro.
  async listBoardForPro(proUser) {
    await this._ensureIndexes();
    if (!isPro(proUser)) return [];
    const docs = await this.col.find({ status: 'open' }).sort({ openedAt: -1 }).toArray();
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
          // Snapshot the Pro's public profile so the user can always see who they
          // are dealing with. City + website come from the provider profile
          // (superUser), address/phone/license from the account where available.
          assignedProCity: clamp((proUser.superUser?.cities || []).join(', '), 200) || null,
          assignedProWebsite: clamp(proUser.superUser?.website || proUser.companyInfo?.website, 200) || null,
          assignedProAddress: clamp(proUser.companyInfo?.address || proUser.companyInfo?.companyAddress, 300) || null,
          assignedProPhone: clamp(proUser.companyInfo?.phone, 64) || null,
          assignedProLicense: clamp(proUser.proVerification?.license, 80) || null,
          claimedAt: now,
          updatedAt: now,
          proConsent: { acceptedAt: now, version: Number(consent?.version) || 1 },
        },
      },
      { returnDocument: 'after' }
    );
    const updated = res?.value || res;
    if (!updated || !updated._id) throw invalid('Ова барање штотуку беше преземено од друг професионалец.');
    // Claimer is the Pro → present with the user still anonymous; return raw
    // targets separately so the "a Pro joined" email still reaches the user.
    return { item: ProRequestsService.present(updated, 'pro'), targets: ProRequestsService._notifyTargets(updated) };
  }

  // Every Pro to notify when a conversation opens — all Pros can join, so all are
  // pinged (bell + email). Skips only admin-deactivated accounts.
  async eligibleProsForCategory(_category) {
    const docs = await this.users
      .find({ role: 'admin_user', isActive: { $ne: false } })
      .project({ email: 1, name: 1, username: 1, 'companyInfo.companyName': 1 })
      .limit(1000)
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
      { _id, status: { $in: ['pending_approval', 'open'] } },
      { $set: { status: 'rejected', rejectionReason: clamp(reason, 600) || null, updatedAt: now, closedAt: now } },
      { returnDocument: 'after' }
    );
    const doc = res?.value || res;
    if (!doc || !doc._id) throw invalid('Барањето веќе е обработено.');
    return ProRequestsService.present(doc);
  }

  // ── Close (owner or assigned Pro or admin) ───────────────────────────────────
  async close(actor, id, isAdmin) {
    const { doc, owner, assigned } = await this._getForActor(actor, id, isAdmin);
    if (doc.status !== 'active') throw invalid('Само активно барање може да се затвори.');
    const now = new Date();
    await this.col.updateOne({ _id: doc._id }, { $set: { status: 'closed', updatedAt: now, closedAt: now } });
    const viewerRole = ProRequestsService._viewerRole({ owner, assigned, isAdmin });
    return {
      item: ProRequestsService.present({ ...doc, status: 'closed', updatedAt: now, closedAt: now }, viewerRole),
      closedBy: viewerRole,
      targets: ProRequestsService._notifyTargets(doc),
    };
  }
}

module.exports = ProRequestsService;
module.exports.redactDocumentRef = redactDocumentRef;
