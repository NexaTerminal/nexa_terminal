/**
 * Nexa 3.0 · Topics Q&A Authoring service (Type C only).
 *
 * Collections:
 *   - qa_worklist           : operator-curated topics (10–15 active at a time)
 *   - qa_submissions        : per-member work-in-progress + history
 *   - topics_pages          : published Q&A pages — read by the future
 *                             topics.nexa.mk renderer via the public API
 *
 * Exclusivity: qa_worklist.activeSubmissionId points to the current
 * submission holding the topic. Cleared on release / force-release.
 *
 * Per-member quota: at most one in-flight submission per author.
 */

const { ObjectId } = require('mongodb');
const tierService = require('./tierService');
const { generateUniqueSlug } = require('../utils/slugify');
const {
  WORKLIST_STATUS, SUBMISSION_STATUS, ACTIVE_LOCK_STATUSES,
  DEFAULT_SOFT_DEADLINE_DAYS, DEFAULT_TARGET_LENGTH_WORDS,
  MIN_QUESTIONS, MAX_QUESTIONS, MIN_WORDS_PER_ANSWER, REQUEST_REASON_MAX
} = require('../constants/qaEnums');

const WORKLIST = 'qa_worklist';
const SUBMISSIONS = 'qa_submissions';
const PAGES = 'topics_pages';

const wordCount = (s) =>
  String(s || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

class TopicsService {
  constructor(db) {
    this.db = db;
    this.worklist = db.collection(WORKLIST);
    this.subs = db.collection(SUBMISSIONS);
    this.pages = db.collection(PAGES);
    this.users = db.collection('users');
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.worklist.createIndex({ status: 1, category: 1 });
    await this.worklist.createIndex({ activeSubmissionId: 1 });
    await this.subs.createIndex({ worklistId: 1 });
    await this.subs.createIndex({ authorId: 1, status: 1 });
    await this.pages.createIndex({ slug: 1 }, { unique: true });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  // ── admin: worklist CRUD ────────────────────────────────────────────────

  async createWorklistItem(admin, input) {
    await this._ensureIndexes();
    const clean = TopicsService.validateWorklistInput(input);
    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      ...clean,
      status: WORKLIST_STATUS.OPEN,
      activeSubmissionId: null,
      createdBy: TopicsService.toObjectId(admin._id),
      createdAt: now,
      updatedAt: now,
      archivedAt: null
    };
    await this.worklist.insertOne(doc);
    return doc;
  }

  async updateWorklistItem(admin, id, input) {
    await this._ensureIndexes();
    const oid = TopicsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const doc = await this.worklist.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    // Block edits while a submission is in-flight beyond title/scope tweaks.
    const patch = { updatedAt: new Date() };
    if (input.title           !== undefined) patch.title           = String(input.title).trim().slice(0, 240);
    if (input.practiceArea    !== undefined) patch.practiceArea    = String(input.practiceArea).trim().slice(0, 80);
    if (input.category        !== undefined) patch.category        = String(input.category).trim().slice(0, 80);
    if (input.targetKeyword   !== undefined) patch.targetKeyword   = String(input.targetKeyword).trim().slice(0, 240);
    if (input.targetLengthWords !== undefined) patch.targetLengthWords = Math.max(300, Math.min(5000, Number(input.targetLengthWords) || DEFAULT_TARGET_LENGTH_WORDS));
    if (input.softDeadlineDays  !== undefined) patch.softDeadlineDays  = Math.max(7, Math.min(120, Number(input.softDeadlineDays) || DEFAULT_SOFT_DEADLINE_DAYS));
    if (input.scope           !== undefined) patch.scope           = String(input.scope).trim().slice(0, 1200);
    if (Array.isArray(input.questions)) {
      patch.questions = TopicsService._normalizeQuestions(input.questions);
    }
    await this.worklist.updateOne({ _id: oid }, { $set: patch });
    return this.worklist.findOne({ _id: oid });
  }

  async archiveWorklistItem(admin, id) {
    await this._ensureIndexes();
    const oid = TopicsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const doc = await this.worklist.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (doc.activeSubmissionId) {
      const e = new Error('Не може да се архивира додека има активно поднесување.');
      e.code = 'HAS_ACTIVE'; throw e;
    }
    await this.worklist.updateOne({ _id: oid }, {
      $set: { status: WORKLIST_STATUS.ARCHIVED, archivedAt: new Date(), updatedAt: new Date() }
    });
    return this.worklist.findOne({ _id: oid });
  }

  async listWorklistForAdmin({ status } = {}) {
    await this._ensureIndexes();
    const filter = {};
    if (status && Object.values(WORKLIST_STATUS).includes(status)) filter.status = status;
    return this.worklist.find(filter).sort({ updatedAt: -1 }).toArray();
  }

  async getWorklistForAdmin(id) {
    await this._ensureIndexes();
    const oid = TopicsService.toObjectId(id);
    if (!oid) return null;
    return this.worklist.findOne({ _id: oid });
  }

  // ── member: worklist board ──────────────────────────────────────────────

  async listOpenForMember(user) {
    await this._ensureIndexes();
    const tier = tierService.effectiveTier(user);
    const visible = tierService.visibleTier(user);
    if (visible !== 'B' && tier !== 'ADMIN') return [];
    // Filter by member's declared practice areas/categories. If none declared,
    // show everything that's open.
    const filter = {
      status: WORKLIST_STATUS.OPEN,
      activeSubmissionId: null
    };
    const areas = user.superUser?.practiceAreas || [];
    if (areas.length > 0) {
      // practiceArea is a free-text label; we match either practiceArea OR category.
      filter.$or = [{ practiceArea: { $in: areas } }, { category: { $in: areas } }];
    }
    return this.worklist.find(filter).sort({ updatedAt: -1 }).toArray();
  }

  async getOneForMember(user, id) {
    await this._ensureIndexes();
    const oid = TopicsService.toObjectId(id);
    if (!oid) return null;
    const doc = await this.worklist.findOne({ _id: oid });
    return doc || null;
  }

  // ── member: request to open ─────────────────────────────────────────────

  async requestToOpen(user, worklistId, requestReason) {
    await this._ensureIndexes();
    const check = tierService.canRequestQATopic(user);
    if (!check.allowed) {
      const e = new Error(check.reason === 'trial'
        ? 'Барањето тема е достапно по активирање на платена претплата.'
        : 'Topics Q&A е достапно само за Nexa Мрежа · Студио членови.');
      e.code = check.reason === 'trial' ? 'TRIAL_LOCKED' : 'TIER_FORBIDDEN';
      throw e;
    }
    const reason = String(requestReason || '').trim();
    if (!reason) {
      const e = new Error('Образложение е задолжително.'); e.code = 'INCOMPLETE'; throw e;
    }
    if (reason.length > REQUEST_REASON_MAX) {
      const e = new Error(`Образложението е премногу долго (макс ${REQUEST_REASON_MAX} карактери).`);
      e.code = 'TOO_LONG'; throw e;
    }
    const wlOid = TopicsService.toObjectId(worklistId);
    const uid = TopicsService.toObjectId(user._id);
    if (!wlOid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    // Quota: at most one in-flight submission per member.
    const active = await this.subs.findOne({
      authorId: uid,
      status: { $in: ACTIVE_LOCK_STATUSES }
    });
    if (active) {
      const e = new Error('Имате веќе една активна тема. Завршете ја или ослободете ја пред да барате нова.');
      e.code = 'ALREADY_ACTIVE'; throw e;
    }

    // Worklist must be open and unheld.
    const wl = await this.worklist.findOne({ _id: wlOid });
    if (!wl) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (wl.status !== WORKLIST_STATUS.OPEN || wl.activeSubmissionId) {
      const e = new Error('Темата веќе не е достапна.'); e.code = 'NOT_OPEN'; throw e;
    }

    const now = new Date();
    const sub = {
      _id: new ObjectId(),
      worklistId: wlOid,
      authorId: uid,
      status: SUBMISSION_STATUS.REQUESTED,
      requestReason: reason.slice(0, REQUEST_REASON_MAX),
      answers: (wl.questions || []).map(q => ({ order: q.order, text: '', wordCount: 0 })),
      revisions: [],
      requestedAt: now,
      approvedAt: null,
      submittedAt: null,
      acceptedAt: null,
      publishedAt: null,
      publishedUrl: null,
      releasedAt: null,
      editorialNotes: '',
      updatedAt: now
    };
    await this.subs.insertOne(sub);

    // Transition the worklist row to 'requested' (still open to other members
    // for visibility on the admin worklist, but invisible on the member board
    // because activeSubmissionId is still null until approval).
    await this.worklist.updateOne({ _id: wlOid }, {
      $set: { status: WORKLIST_STATUS.REQUESTED, updatedAt: now }
    });

    return sub;
  }

  // ── admin: review requests / approve / decline ──────────────────────────

  async approveRequest(admin, submissionId) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.REQUESTED) {
      const e = new Error('Submission is not in requested state.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    const now = new Date();
    // Apply the exclusivity lock + transition the submission.
    await this.worklist.updateOne(
      { _id: sub.worklistId, activeSubmissionId: null },
      { $set: {
          status: WORKLIST_STATUS.IN_PROGRESS,
          activeSubmissionId: sOid,
          updatedAt: now
      } }
    );
    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.IN_PROGRESS, approvedAt: now, updatedAt: now }
    });
    return this.subs.findOne({ _id: sOid });
  }

  async declineRequest(admin, submissionId, reason = '') {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.REQUESTED) {
      const e = new Error('Submission is not in requested state.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    const now = new Date();
    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.DECLINED, editorialNotes: String(reason || '').slice(0, 800), updatedAt: now }
    });
    // Return the worklist row to open if no other pending requests on it.
    const pending = await this.subs.countDocuments({
      worklistId: sub.worklistId,
      status: SUBMISSION_STATUS.REQUESTED,
      _id: { $ne: sOid }
    });
    if (pending === 0) {
      await this.worklist.updateOne({ _id: sub.worklistId }, {
        $set: { status: WORKLIST_STATUS.OPEN, updatedAt: now }
      });
    }
    return this.subs.findOne({ _id: sOid });
  }

  // ── member: save draft / submit / release ───────────────────────────────

  async saveDraft(user, submissionId, answers) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    const uid = TopicsService.toObjectId(user._id);
    if (!sOid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid, authorId: uid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![SUBMISSION_STATUS.IN_PROGRESS, SUBMISSION_STATUS.RETURNED].includes(sub.status)) {
      const e = new Error('Submission cannot be edited in its current status.');
      e.code = 'NOT_EDITABLE'; throw e;
    }
    const norm = (Array.isArray(answers) ? answers : []).map(a => ({
      order: Number(a.order),
      text: String(a.text || '').slice(0, 12000),
      wordCount: wordCount(a.text)
    }));
    await this.subs.updateOne({ _id: sOid }, { $set: { answers: norm, updatedAt: new Date() } });
    return this.subs.findOne({ _id: sOid });
  }

  async submitForReview(user, submissionId) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    const uid = TopicsService.toObjectId(user._id);
    if (!sOid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid, authorId: uid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![SUBMISSION_STATUS.IN_PROGRESS, SUBMISSION_STATUS.RETURNED].includes(sub.status)) {
      const e = new Error('Submission cannot be submitted in its current status.');
      e.code = 'INVALID_TRANSITION'; throw e;
    }
    // Every answer must be non-empty (≥50 words is a warning, not blocker per spec).
    const empty = (sub.answers || []).find(a => !String(a.text || '').trim());
    if (empty) {
      const e = new Error(`Сите прашања мора да имаат одговор пред поднесување (празно прашање #${empty.order}).`);
      e.code = 'INCOMPLETE'; throw e;
    }
    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.SUBMITTED, submittedAt: new Date(), updatedAt: new Date() }
    });
    await this.worklist.updateOne({ _id: sub.worklistId }, {
      $set: { status: WORKLIST_STATUS.SUBMITTED, updatedAt: new Date() }
    });
    return this.subs.findOne({ _id: sOid });
  }

  async release(user, submissionId) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    const uid = TopicsService.toObjectId(user._id);
    if (!sOid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid, authorId: uid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![SUBMISSION_STATUS.IN_PROGRESS, SUBMISSION_STATUS.RETURNED].includes(sub.status)) {
      const e = new Error('Cannot release in current status.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    return this._releaseLock(sub, false);
  }

  // ── admin: review (return / reject / force-release / accept / publish) ──

  async returnForRevision(admin, submissionId, editorialNotes) {
    await this._ensureIndexes();
    const notes = String(editorialNotes || '').trim();
    if (!notes) { const e = new Error('editorialNotes is required'); e.code = 'NOTES_REQUIRED'; throw e; }
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.SUBMITTED) {
      const e = new Error('Can only return a submitted entry.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    const now = new Date();
    await this.subs.updateOne({ _id: sOid }, {
      $push: { revisions: { returnedAt: now, editorialNotes: notes, returnedBy: TopicsService.toObjectId(admin._id) } },
      $set:  { status: SUBMISSION_STATUS.RETURNED, editorialNotes: notes, updatedAt: now }
    });
    // Lock stays. Worklist moves back to in_progress.
    await this.worklist.updateOne({ _id: sub.worklistId }, {
      $set: { status: WORKLIST_STATUS.IN_PROGRESS, updatedAt: now }
    });
    return this.subs.findOne({ _id: sOid });
  }

  async accept(admin, submissionId) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.SUBMITTED) {
      const e = new Error('Can only accept a submitted entry.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    const now = new Date();
    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.ACCEPTED, acceptedAt: now, updatedAt: now }
    });
    return this.subs.findOne({ _id: sOid });
  }

  async reject(admin, submissionId, reason) {
    await this._ensureIndexes();
    const notes = String(reason || '').trim();
    if (!notes) { const e = new Error('editorialNotes is required'); e.code = 'NOTES_REQUIRED'; throw e; }
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.SUBMITTED && sub.status !== SUBMISSION_STATUS.RETURNED) {
      const e = new Error('Cannot reject in current status.'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.REJECTED, editorialNotes: notes, updatedAt: new Date() }
    });
    // Free the lock; return the worklist to open.
    return this._releaseLock(sub, true);
  }

  async forceRelease(admin, submissionId, reason = '') {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![SUBMISSION_STATUS.IN_PROGRESS, SUBMISSION_STATUS.RETURNED, SUBMISSION_STATUS.SUBMITTED].includes(sub.status)) {
      const e = new Error('Submission is not in a state that can be released.');
      e.code = 'INVALID_TRANSITION'; throw e;
    }
    await this.subs.updateOne({ _id: sOid }, {
      $set: { editorialNotes: String(reason || '').slice(0, 800) }
    });
    return this._releaseLock(sub, true);
  }

  async _releaseLock(sub, force) {
    const now = new Date();
    await this.subs.updateOne({ _id: sub._id }, {
      $set: { status: SUBMISSION_STATUS.RELEASED, releasedAt: now, updatedAt: now }
    });
    await this.worklist.updateOne({ _id: sub.worklistId }, {
      $set: { status: WORKLIST_STATUS.OPEN, activeSubmissionId: null, updatedAt: now }
    });
    return this.subs.findOne({ _id: sub._id });
  }

  // ── admin: publish → topics_pages ───────────────────────────────────────

  async publish(admin, submissionId) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(submissionId);
    if (!sOid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (sub.status !== SUBMISSION_STATUS.ACCEPTED) {
      const e = new Error('Only accepted submissions can be published.');
      e.code = 'INVALID_TRANSITION'; throw e;
    }
    const wl = await this.worklist.findOne({ _id: sub.worklistId });
    if (!wl) { const e = new Error('Worklist gone'); e.code = 'NOT_FOUND'; throw e; }
    const author = await this.users.findOne(
      { _id: sub.authorId },
      { projection: { email: 1, username: 1, fullName: 1, companyInfo: 1 } }
    );

    const slug = await generateUniqueSlug(this.db, wl.title);
    const publicUrl = `https://topics.nexa.mk/${slug}`;
    const now = new Date();
    const page = TopicsService.buildPageDoc({ worklist: wl, submission: sub, author, slug, publicUrl, acceptedAt: sub.acceptedAt || now });
    await this.pages.insertOne(page);

    await this.subs.updateOne({ _id: sOid }, {
      $set: { status: SUBMISSION_STATUS.PUBLISHED, publishedAt: now, publishedUrl: publicUrl, updatedAt: now }
    });
    await this.worklist.updateOne({ _id: sub.worklistId }, {
      $set: { status: WORKLIST_STATUS.PUBLISHED, updatedAt: now }
    });

    return { submission: await this.subs.findOne({ _id: sOid }), page };
  }

  // ── member: lists ───────────────────────────────────────────────────────

  async listMineSubmissions(user) {
    await this._ensureIndexes();
    const uid = TopicsService.toObjectId(user._id);
    if (!uid) return [];
    const subs = await this.subs.find({ authorId: uid }).sort({ updatedAt: -1 }).toArray();
    const worklistIds = Array.from(new Set(subs.map(s => String(s.worklistId)))).map(TopicsService.toObjectId).filter(Boolean);
    const wls = worklistIds.length ? await this.worklist.find({ _id: { $in: worklistIds } }).toArray() : [];
    const byId = new Map(wls.map(w => [String(w._id), w]));
    return subs.map(s => ({ submission: s, worklist: byId.get(String(s.worklistId)) || null }));
  }

  async listMinePublished(user) {
    await this._ensureIndexes();
    const uid = TopicsService.toObjectId(user._id);
    if (!uid) return [];
    return this.subs.find({ authorId: uid, status: SUBMISSION_STATUS.PUBLISHED }).sort({ publishedAt: -1 }).toArray();
  }

  async getSubmissionForOwnerOrAdmin(user, id) {
    await this._ensureIndexes();
    const sOid = TopicsService.toObjectId(id);
    if (!sOid) return null;
    const sub = await this.subs.findOne({ _id: sOid });
    if (!sub) return null;
    const isOwner = String(sub.authorId) === String(user._id);
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) { const e = new Error('Forbidden'); e.code = 'FORBIDDEN'; throw e; }
    const wl = await this.worklist.findOne({ _id: sub.worklistId });
    return { submission: sub, worklist: wl || null };
  }

  // ── admin: list submissions queue ───────────────────────────────────────

  async listSubmissionsForAdmin({ status } = {}) {
    await this._ensureIndexes();
    const filter = {};
    if (status && Object.values(SUBMISSION_STATUS).includes(status)) filter.status = status;
    return this.subs.find(filter).sort({ updatedAt: -1 }).limit(200).toArray();
  }

  // ── public page read ────────────────────────────────────────────────────

  async getPageBySlug(slug) {
    await this._ensureIndexes();
    return this.pages.findOne({ slug: String(slug || '').trim() });
  }

  // ── helpers ─────────────────────────────────────────────────────────────

  static _normalizeQuestions(questions) {
    const valid = (Array.isArray(questions) ? questions : [])
      .filter(q => q && q.prompt && String(q.prompt).trim())
      .slice(0, MAX_QUESTIONS)
      .map((q, i) => ({
        order: i + 1,
        prompt: String(q.prompt).trim().slice(0, 500),
        notes:  String(q.notes  || '').slice(0, 800)
      }));
    if (valid.length < MIN_QUESTIONS) {
      const e = new Error(`Минимум ${MIN_QUESTIONS} прашања, максимум ${MAX_QUESTIONS}.`);
      e.code = 'INVALID_QUESTIONS'; throw e;
    }
    return valid;
  }

  static validateWorklistInput(input) {
    const errs = [];
    const title         = String(input?.title || '').trim().slice(0, 240);
    const practiceArea  = String(input?.practiceArea  || '').trim().slice(0, 80);
    const category      = String(input?.category      || '').trim().slice(0, 80);
    const targetKeyword = String(input?.targetKeyword || '').trim().slice(0, 240);
    const scope         = String(input?.scope         || '').trim().slice(0, 1200);
    const targetLengthWords = Math.max(300, Math.min(5000, Number(input?.targetLengthWords) || DEFAULT_TARGET_LENGTH_WORDS));
    const softDeadlineDays  = Math.max(7,   Math.min(120,  Number(input?.softDeadlineDays)  || DEFAULT_SOFT_DEADLINE_DAYS));
    if (!title)        errs.push('title');
    if (!practiceArea) errs.push('practiceArea');
    if (!scope || scope.length < 40) errs.push('scope');
    const questions = TopicsService._normalizeQuestions(input?.questions);
    if (errs.length) {
      const e = new Error(`Недостасуваат полиња: ${errs.join(', ')}`);
      e.code = 'INVALID_INPUT'; e.fields = errs;
      throw e;
    }
    return { title, practiceArea, category, targetKeyword, scope, targetLengthWords, softDeadlineDays, questions };
  }

  /**
   * Build the topics_pages document. The HTML rendering is server-side so
   * the future topics.nexa.mk satellite just has to slot the contentHtml
   * into its layout. Schema-org JSON-LD is included.
   */
  static buildPageDoc({ worklist, submission, author, slug, publicUrl, acceptedAt }) {
    const byline = author?.fullName || author?.companyInfo?.companyName || author?.username || 'Nexa expert';
    const firm   = author?.companyInfo?.companyName || '';
    const items = (worklist.questions || []).map(q => {
      const ans = (submission.answers || []).find(a => a.order === q.order);
      return { order: q.order, prompt: q.prompt, text: (ans?.text || '').trim() };
    }).filter(x => x.text);

    const escapeHtml = (s) => String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const sections = items.map(it => `
<section id="q${it.order}">
  <h2>${escapeHtml(it.prompt)}</h2>
  <div class="answer">${escapeHtml(it.text).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')}</div>
</section>`).join('\n');

    const contentHtml = `
<article class="qa-page">
  <header>
    <p class="eyebrow">${escapeHtml(worklist.practiceArea)}</p>
    <h1>${escapeHtml(worklist.title)}</h1>
    <p class="byline">By <strong>${escapeHtml(byline)}</strong>${firm ? ` · <span>${escapeHtml(firm)}</span>` : ''} · Last reviewed: ${acceptedAt.toISOString().slice(0, 10)}</p>
  </header>
  <nav class="toc">
    <ol>
      ${items.map(it => `<li><a href="#q${it.order}">${escapeHtml(it.prompt)}</a></li>`).join('\n      ')}
    </ol>
  </nav>
  ${sections}
  <footer>
    <p class="disclaimer">Општи информации, не индивидуален совет. За конкретен правен совет, консултирајте се со квалификуван професионалец.</p>
  </footer>
</article>`.trim();

    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(it => ({
        '@type': 'Question',
        name: it.prompt,
        acceptedAnswer: { '@type': 'Answer', text: it.text }
      }))
    };
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: worklist.title,
      author: { '@type': 'Person', name: byline },
      publisher: { '@type': 'Organization', name: 'Nexa' },
      datePublished: acceptedAt.toISOString(),
      dateModified:  acceptedAt.toISOString(),
      mainEntityOfPage: publicUrl
    };

    return {
      _id: new ObjectId(),
      slug,
      url: publicUrl,
      title: worklist.title,
      practiceArea: worklist.practiceArea,
      category: worklist.category,
      targetKeyword: worklist.targetKeyword,
      author: {
        id: author?._id || submission.authorId,
        name: byline,
        firm
      },
      submissionId: submission._id,
      worklistId: worklist._id,
      contentHtml,
      jsonLd: [faqJsonLd, articleJsonLd],
      meta: {
        title: worklist.title + ' — Nexa Topics',
        description: (worklist.scope || '').slice(0, 155),
        canonical: publicUrl
      },
      acceptedAt,
      publishedAt: new Date(),
      lastReviewedAt: acceptedAt
    };
  }
}

TopicsService.WORKLIST = WORKLIST;
TopicsService.SUBMISSIONS = SUBMISSIONS;
TopicsService.PAGES = PAGES;
TopicsService.wordCount = wordCount;

module.exports = TopicsService;
