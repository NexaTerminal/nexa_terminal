/**
 * Nexa 3.0 · Inquiry Board service (manual model).
 *
 * Lifecycle:
 *   admin creates → 'open' (visible on member boards, subject to first-look window)
 *   member submits Express Interest → embedded signal in interest_signals collection
 *     · inquiry transitions to 'interest_received' on first signal
 *   admin approves a signal → signal status 'approved' + entry in inquiry.approvals[]
 *     · inquiry transitions to 'partially_claimed' or 'claimed' depending on
 *       whether every tagged category is now filled
 *   admin clicks Mark Introduced → sets introducedAt on the approval and
 *     transitions sibling signals (same inquiry × same category) to 'acknowledged'
 *   admin Close → status 'closed'
 *
 * Manual reply mechanic: NO email is auto-sent on approval. The admin sees a
 * "Ready to introduce" payload with both contacts + a copyable subject/body
 * template, and writes from their own mailbox.
 */

const { ObjectId } = require('mongodb');
const tierService = require('./tierService');
const {
  INQUIRY_SOURCES, INQUIRY_CATEGORIES, INQUIRY_CITIES, INQUIRY_LANGUAGES,
  INQUIRY_URGENCY, PROFESSIONS, INQUIRY_STATUS, SIGNAL_STATUS, QUOTAS, FIRST_LOOK_HOURS
} = require('../constants/inquiryEnums');

const INQUIRIES = 'inquiries';
const SIGNALS = 'inquiry_interest_signals';

class InquiriesService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(INQUIRIES);
    this.signals = db.collection(SIGNALS);
    this.users = db.collection('users');
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex({ status: 1, categories: 1, city: 1 });
    await this.col.createIndex({ createdBy: 1, status: 1 });
    await this.col.createIndex({ 'approvals.memberId': 1 });
    await this.signals.createIndex({ inquiryId: 1 });
    await this.signals.createIndex({ memberId: 1, status: 1, decidedAt: 1 });
    await this.signals.createIndex({ inquiryId: 1, memberId: 1 }, { unique: true });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  // ── admin: create ────────────────────────────────────────────────────────

  async create(admin, input) {
    await this._ensureIndexes();
    const clean = InquiriesService.validateInquiryInput(input);
    const adminId = InquiriesService.toObjectId(admin._id);
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      ...clean,
      status: INQUIRY_STATUS.OPEN,
      postedAt: now,
      closedAt: null,
      approvals: [],
      createdBy: adminId,
      updatedAt: now
    };
    await this.col.insertOne(doc);
    return doc;
  }

  async update(admin, id, input) {
    await this._ensureIndexes();
    const oid = InquiriesService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const doc = await this.col.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }

    // Only certain fields are editable post-creation.
    const patch = { updatedAt: new Date() };
    if (input?.topic     !== undefined) patch.topic    = String(input.topic).trim().slice(0, 240);
    if (input?.summary   !== undefined) patch.summary  = String(input.summary).trim().slice(0, 1200);
    if (input?.urgency   !== undefined && INQUIRY_URGENCY.includes(input.urgency)) patch.urgency = input.urgency;
    if (input?.internalNotes !== undefined) patch.internalNotes = String(input.internalNotes).slice(0, 4000);
    if (Array.isArray(input?.categories)) {
      const cats = input.categories.filter(c => INQUIRY_CATEGORIES.includes(c));
      if (cats.length > 0) patch.categories = Array.from(new Set(cats));
    }
    await this.col.updateOne({ _id: oid }, { $set: patch });
    return this.col.findOne({ _id: oid });
  }

  async closeInquiry(admin, id) {
    await this._ensureIndexes();
    const oid = InquiriesService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    await this.col.updateOne({ _id: oid }, {
      $set: { status: INQUIRY_STATUS.CLOSED, closedAt: new Date(), updatedAt: new Date() }
    });
    return this.col.findOne({ _id: oid });
  }

  // ── admin: list / detail ────────────────────────────────────────────────

  async listForAdmin({ status, page = 1, perPage = 30 }) {
    await this._ensureIndexes();
    const filter = {};
    if (status && Object.values(INQUIRY_STATUS).includes(status)) filter.status = status;
    const cursor = this.col.find(filter).sort({ postedAt: -1 }).skip((page - 1) * perPage).limit(perPage);
    const [items, total] = await Promise.all([cursor.toArray(), this.col.countDocuments(filter)]);
    return { items, total, page, perPage };
  }

  async getForAdmin(id) {
    await this._ensureIndexes();
    const oid = InquiriesService.toObjectId(id);
    if (!oid) return null;
    const inq = await this.col.findOne({ _id: oid });
    if (!inq) return null;
    const signals = await this.signals.find({ inquiryId: oid }).sort({ createdAt: 1 }).toArray();
    // Hydrate signal author info for the admin view.
    const memberIds = signals.map(s => s.memberId).filter(Boolean);
    const members = memberIds.length
      ? await this.users.find(
          { _id: { $in: memberIds } },
          { projection: { email: 1, username: 1, fullName: 1, companyInfo: 1, createdAt: 1 } }
        ).toArray()
      : [];
    const byId = new Map(members.map(m => [String(m._id), m]));
    const hydrated = signals.map(s => ({
      ...s,
      member: byId.get(String(s.memberId)) || null
    }));
    return { inquiry: inq, signals: hydrated };
  }

  // ── member: board query ──────────────────────────────────────────────────

  /**
   * Returns inquiries visible to `user`, respecting category × city × tier
   * first-look window. Hides private inquirer fields and `internalNotes`.
   */
  async listBoardFor(user) {
    await this._ensureIndexes();
    const tier = tierService.effectiveTier(user);
    // Trial users get a read-only preview of the board (cards are blurred on
    // the client). They can't submit interest — that's enforced by
    // canExpressInterest in the controller.
    const isTrialPreview = tierService.isTrial(user) && tier !== 'ADMIN';
    if (tier !== 'B' && tier !== 'C' && tier !== 'ADMIN' && !isTrialPreview) return [];

    // Map the user's declared practiceAreas (kebab-case legal subcategories
    // from roles.js — 'labor-law', 'tax-accounting', etc.) onto the inquiry
    // category enum (snake_case service buckets from inquiryEnums.js —
    // 'legal', 'accounting', 'hr', etc.). Without this mapping, the two
    // taxonomies share no values and the `$in` filter returns nothing for
    // any user that has practiceAreas configured.
    const PA_TO_INQUIRY_CATEGORY = {
      'consumer-legal':       ['legal'],
      'immigration':          ['legal'],
      'citizenship':          ['legal'],
      'company-registration': ['legal'],
      'ip-law':               ['legal'],
      'general-legal':        ['legal'],
      'labor-law':            ['legal', 'hr'],
      'tax-accounting':       ['accounting', 'tax']
    };
    const rawPracticeAreas = user.superUser?.practiceAreas || [];
    const categories = Array.from(new Set(
      rawPracticeAreas.flatMap(pa => PA_TO_INQUIRY_CATEGORY[pa] || [pa])
    ));
    // City filter: use the declared `superUser.cities` array. Free-text
    // `companyInfo.companyAddress` is NOT a city — it's a street address
    // (e.g., "ул. Македонска 22, Скопје"), so we never use it for matching.
    // If the user has no declared cities, we don't apply a city filter at
    // all — they see inquiries from every city, which is the safer default
    // than hiding everything because of an undeclared profile field.
    const cities = (user.superUser?.cities || [])
      .map(c => String(c || '').trim())
      .filter(Boolean);

    // We honor practiceAreas as the member's profession-categories alias
    // (the user-profile form may eventually be relabelled; the field stays).
    const matchFilter = {
      status: { $in: [INQUIRY_STATUS.OPEN, INQUIRY_STATUS.INTEREST_RECEIVED, INQUIRY_STATUS.PARTIALLY_CLAIMED] }
    };
    if (categories.length > 0) {
      matchFilter.categories = { $in: categories };
    }
    if (cities.length > 0) {
      // Match any of the user's declared cities OR the 'Anywhere' bucket.
      matchFilter.$or = [
        { city: { $in: cities } },
        { city: 'Anywhere' }
      ];
    }

    const docs = await this.col.find(matchFilter).sort({ postedAt: -1 }).limit(100).toArray();

    // First-look window removed (2026-05-31). Both tier B and tier C see
    // new inquiries the moment they're posted. FIRST_LOOK_HOURS is still
    // exported in case the product policy changes again.

    return docs.map(InquiriesService.publicProjection);
  }

  /** Get an inquiry for a member — sanitized projection. */
  async getForMember(user, id) {
    await this._ensureIndexes();
    const oid = InquiriesService.toObjectId(id);
    if (!oid) return null;
    const doc = await this.col.findOne({ _id: oid });
    if (!doc) return null;
    // Members can read any inquiry id, but private fields are stripped.
    return InquiriesService.publicProjection(doc);
  }

  static publicProjection(doc) {
    const out = { ...doc };
    delete out.inquirerName;
    delete out.inquirerEmail;
    delete out.inquirerPhone;
    delete out.originalEmailBody;
    delete out.internalNotes;
    delete out.createdBy;
    return out;
  }

  // ── member: Express Interest ────────────────────────────────────────────

  async submitInterest(user, inquiryId, input) {
    await this._ensureIndexes();
    const check = tierService.canExpressInterest(user);
    if (!check.allowed) {
      const e = new Error(check.reason === 'trial'
        ? 'Изразувањето интерес е достапно по активирање на платена претплата.'
        : 'Изразувањето интерес е достапно само за Nexa Мрежа корисници.');
      e.code = check.reason === 'trial' ? 'TRIAL_LOCKED' : 'TIER_FORBIDDEN';
      throw e;
    }
    const oid = InquiriesService.toObjectId(inquiryId);
    const uid = InquiriesService.toObjectId(user._id);
    if (!oid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const inq = await this.col.findOne({ _id: oid });
    if (!inq) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![INQUIRY_STATUS.OPEN, INQUIRY_STATUS.INTEREST_RECEIVED, INQUIRY_STATUS.PARTIALLY_CLAIMED].includes(inq.status)) {
      const e = new Error('Барањето веќе не прифаќа интерес.');
      e.code = 'INQUIRY_CLOSED';
      throw e;
    }

    const profession = PROFESSIONS.includes(input?.profession) ? input.profession : 'other';
    const freeTalkOffered = !!input?.freeTalkOffered;
    const helpDescription = String(input?.helpDescription || '').trim().slice(0, 400);
    if (!helpDescription) { const e = new Error('helpDescription is required'); e.code = 'INCOMPLETE'; throw e; }

    const now = new Date();
    try {
      const signal = {
        _id: new ObjectId(),
        inquiryId: oid,
        memberId: uid,
        profession,
        freeTalkOffered,
        helpDescription,
        status: SIGNAL_STATUS.PENDING,
        createdAt: now,
        decidedAt: null
      };
      await this.signals.insertOne(signal);
      // Bump the inquiry status when the first signal lands.
      if (inq.status === INQUIRY_STATUS.OPEN) {
        await this.col.updateOne({ _id: oid }, {
          $set: { status: INQUIRY_STATUS.INTEREST_RECEIVED, updatedAt: now }
        });
      }
      return signal;
    } catch (err) {
      if (err.code === 11000) {
        const e = new Error('Веќе сте изразиле интерес за ова барање.');
        e.code = 'ALREADY_INTERESTED';
        throw e;
      }
      throw err;
    }
  }

  async getMySignal(user, inquiryId) {
    await this._ensureIndexes();
    const oid = InquiriesService.toObjectId(inquiryId);
    const uid = InquiriesService.toObjectId(user._id);
    if (!oid || !uid) return null;
    return this.signals.findOne({ inquiryId: oid, memberId: uid });
  }

  async listMyClaims(user) {
    await this._ensureIndexes();
    const uid = InquiriesService.toObjectId(user._id);
    if (!uid) return [];
    const signals = await this.signals.find({ memberId: uid }).sort({ createdAt: -1 }).toArray();
    const inquiryIds = Array.from(new Set(signals.map(s => String(s.inquiryId)))).map(InquiriesService.toObjectId).filter(Boolean);
    const inquiries = inquiryIds.length
      ? await this.col.find({ _id: { $in: inquiryIds } }).toArray()
      : [];
    const byId = new Map(inquiries.map(i => [String(i._id), InquiriesService.publicProjection(i)]));
    return signals.map(s => ({ signal: s, inquiry: byId.get(String(s.inquiryId)) || null }));
  }

  async listMyEngagements(user) {
    await this._ensureIndexes();
    const uid = InquiriesService.toObjectId(user._id);
    if (!uid) return [];
    // Approved engagements expose the inquirer's contact data.
    const inquiries = await this.col.find({ 'approvals.memberId': uid }).sort({ 'approvals.approvedAt': -1 }).toArray();
    return inquiries.map(inq => {
      const my = (inq.approvals || []).find(a => String(a.memberId) === String(uid));
      return {
        inquiry: {
          _id: inq._id,
          topic: inq.topic,
          city: inq.city,
          categories: inq.categories,
          summary: inq.summary,
          language: inq.language,
          urgency: inq.urgency,
          postedAt: inq.postedAt,
          source: inq.source,
          inquirerName:  inq.inquirerName  || null,
          inquirerEmail: inq.inquirerEmail || null,
          inquirerPhone: inq.inquirerPhone || null
        },
        approval: my || null
      };
    });
  }

  // ── admin: approve ──────────────────────────────────────────────────────

  /**
   * Approves a single interest signal. Inquiry transitions to
   * 'partially_claimed' (if any tagged category remains without approval) or
   * 'claimed' (if every tagged category is now approved).
   */
  async approveSignal(admin, inquiryId, signalId, operatorNotes = '') {
    await this._ensureIndexes();
    const inqOid    = InquiriesService.toObjectId(inquiryId);
    const signalOid = InquiriesService.toObjectId(signalId);
    if (!inqOid || !signalOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const inq = await this.col.findOne({ _id: inqOid });
    if (!inq) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const sig = await this.signals.findOne({ _id: signalOid, inquiryId: inqOid });
    if (!sig) { const e = new Error('Signal not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sig.status !== SIGNAL_STATUS.PENDING) {
      const e = new Error('Signal already decided.'); e.code = 'INVALID_TRANSITION'; throw e;
    }

    // Pick the category. Use member.categories ∩ inquiry.categories, fall back
    // to the first inquiry category. Strict 1-per-category enforcement.
    const memberUser = await this.users.findOne({ _id: sig.memberId }, { projection: { superUser: 1 } });
    const memberCats = memberUser?.superUser?.practiceAreas || [];
    const eligible = (inq.categories || []).filter(c => memberCats.length === 0 || memberCats.includes(c));
    const chosenCategory = eligible[0] || (inq.categories || [])[0] || 'other';

    const alreadyTaken = (inq.approvals || []).some(a => a.category === chosenCategory);
    if (alreadyTaken) {
      const e = new Error(`Категоријата "${chosenCategory}" веќе има одобрен член за ова барање.`);
      e.code = 'CATEGORY_TAKEN';
      throw e;
    }

    // Daily quota for Type C, monthly for Type B (best-effort: blocks at approval).
    await this._enforceApprovalQuota(memberUser);

    const now = new Date();
    const approval = {
      _id: new ObjectId(),
      memberId: sig.memberId,
      category: chosenCategory,
      approvedAt: now,
      operatorNotes: String(operatorNotes || '').slice(0, 800),
      introducedAt: null
    };

    // Atomically: push to approvals, update inquiry status, mark signal approved.
    const allCats = new Set(inq.categories || []);
    const filled = new Set([
      ...((inq.approvals || []).map(a => a.category)),
      chosenCategory
    ]);
    const nextInqStatus = [...allCats].every(c => filled.has(c))
      ? INQUIRY_STATUS.CLAIMED
      : INQUIRY_STATUS.PARTIALLY_CLAIMED;

    await this.col.updateOne({ _id: inqOid }, {
      $push: { approvals: approval },
      $set:  { status: nextInqStatus, updatedAt: now }
    });
    await this.signals.updateOne({ _id: signalOid }, {
      $set: { status: SIGNAL_STATUS.APPROVED, decidedAt: now }
    });

    return { approval, nextInqStatus, chosenCategory };
  }

  async _enforceApprovalQuota(memberUser) {
    const tier = tierService.effectiveTier(memberUser);
    const q = QUOTAS[tier];
    if (!q) return; // no quota for ADMIN / A
    const since = q.period === 'month'
      ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
      : new Date(Date.now() - 24 * 3600 * 1000);
    const used = await this.signals.countDocuments({
      memberId: memberUser._id,
      status: SIGNAL_STATUS.APPROVED,
      decidedAt: { $gte: since }
    });
    if (used >= q.max) {
      const e = new Error(`Овој член ја достигна границата (${q.max}/${q.period === 'month' ? 'месечно' : 'дневно'}).`);
      e.code = 'QUOTA_EXCEEDED';
      throw e;
    }
  }

  /**
   * Mark Introduced — sets introducedAt on the approval, transitions sibling
   * signals (same inquiry × same category × still pending) to 'acknowledged',
   * and returns the list of acknowledged member ids so the caller can send
   * the "not chosen" notification.
   */
  async markIntroduced(admin, inquiryId, approvalId) {
    await this._ensureIndexes();
    const inqOid = InquiriesService.toObjectId(inquiryId);
    const apprOid = InquiriesService.toObjectId(approvalId);
    if (!inqOid || !apprOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const inq = await this.col.findOne({ _id: inqOid });
    if (!inq) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const approval = (inq.approvals || []).find(a => String(a._id) === String(apprOid));
    if (!approval) { const e = new Error('Approval not found'); e.code = 'NOT_FOUND'; throw e; }

    const now = new Date();
    await this.col.updateOne(
      { _id: inqOid, 'approvals._id': apprOid },
      { $set: { 'approvals.$.introducedAt': now, updatedAt: now } }
    );

    // Acknowledge sibling pending signals across all categories of this
    // inquiry. The original spec scopes by category; we generalize because a
    // member could have only one interest per inquiry (unique index), so
    // there's no overlap. This auto-clears the queue once an introduction
    // happens for any category.
    const siblings = await this.signals.find({
      inquiryId: inqOid,
      status: SIGNAL_STATUS.PENDING,
      memberId: { $ne: approval.memberId }
    }).toArray();

    if (siblings.length > 0) {
      await this.signals.updateMany(
        { _id: { $in: siblings.map(s => s._id) } },
        { $set: { status: SIGNAL_STATUS.ACKNOWLEDGED, decidedAt: now } }
      );
    }

    return {
      approval: { ...approval, introducedAt: now },
      acknowledgedMemberIds: siblings.map(s => s.memberId)
    };
  }

  // ── validation ───────────────────────────────────────────────────────────

  static validateInquiryInput(input) {
    const errs = [];
    const source   = INQUIRY_SOURCES.includes(input?.source) ? input.source : null;
    const topic    = String(input?.topic || '').trim().slice(0, 240);
    const city     = INQUIRY_CITIES.includes(input?.city)    ? input.city    : null;
    const language = INQUIRY_LANGUAGES.includes(input?.language) ? input.language : null;
    const urgency  = INQUIRY_URGENCY.includes(input?.urgency) ? input.urgency : 'standard';
    const summary  = String(input?.summary || '').trim().slice(0, 1200);
    const categories = Array.isArray(input?.categories)
      ? Array.from(new Set(input.categories.filter(c => INQUIRY_CATEGORIES.includes(c))))
      : [];
    const internalNotes = String(input?.internalNotes || '').slice(0, 4000);
    const inquirerName  = String(input?.inquirerName  || '').trim().slice(0, 240);
    const inquirerEmail = String(input?.inquirerEmail || '').trim().slice(0, 240);
    const inquirerPhone = String(input?.inquirerPhone || '').trim().slice(0, 64);
    const originalEmailBody = String(input?.originalEmailBody || '').slice(0, 20000);

    if (!source)   errs.push('source');
    if (!topic)    errs.push('topic');
    if (!city)     errs.push('city');
    if (!language) errs.push('language');
    if (!summary || summary.length < 40) errs.push('summary');
    if (categories.length === 0) errs.push('categories');
    if (!inquirerName)  errs.push('inquirerName');
    if (!inquirerEmail) errs.push('inquirerEmail');
    if (!inquirerPhone) errs.push('inquirerPhone');

    if (errs.length) {
      const e = new Error(`Недостасуваат полиња: ${errs.join(', ')}`);
      e.code = 'INVALID_INPUT';
      e.fields = errs;
      throw e;
    }
    return {
      source, topic, city, language, urgency, summary, categories, internalNotes,
      inquirerName, inquirerEmail, inquirerPhone, originalEmailBody
    };
  }
}

InquiriesService.INQUIRIES = INQUIRIES;
InquiriesService.SIGNALS = SIGNALS;
InquiriesService.publicProjection = InquiriesService.publicProjection;

module.exports = InquiriesService;
