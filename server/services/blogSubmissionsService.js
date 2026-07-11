/**
 * Blog Submissions service.
 *
 * Workflow:
 *   draft → ai_checking → ai_passed | ai_failed
 *   ai_failed → ai_checking (retry; caps at 3 attempts before forcing manual review)
 *   ai_passed → returned (admin sends back with notes) → draft (member revises)
 *   ai_passed → accepted (admin) → published (admin) → row in `blogs` collection
 *   ai_passed → rejected (admin, terminal)
 *
 * Quota: Basic (tier A) = 1/month, Pro (tier B) = 2/month. Counted by
 * `submittedAt` falling in the current calendar month, in any status except
 * `draft` and `rejected`.
 */

const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
// AI guideline check service kept on disk but not invoked from the submit
// flow anymore. Editorial review is fully manual per product decision.
const tierService = require('./tierService');
const { generateUniqueSlug } = require('../utils/slugify');

const COLLECTION = 'blog_submissions';
const BLOGS_COLLECTION = 'blogs';

// AI verdict is advisory only. Every non-empty submission lands in the admin
// queue as `submitted` regardless of pass/fail. The legacy AI_PASSED /
// AI_FAILED constants are kept for back-compat with rows created before this
// change; admin handlers treat them the same as SUBMITTED.
const STATUS = Object.freeze({
  DRAFT:       'draft',
  AI_CHECKING: 'ai_checking',
  SUBMITTED:   'submitted',
  AI_PASSED:   'ai_passed',   // legacy — treat as submitted
  AI_FAILED:   'ai_failed',   // legacy — treat as submitted
  RETURNED:    'returned',
  ACCEPTED:    'accepted',
  PUBLISHED:   'published',
  REJECTED:    'rejected',
  ARCHIVED:    'archived'
});

const QUOTA_BY_TIER = { A: 1, B: 2 };

class BlogSubmissionsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.blogs = db.collection(BLOGS_COLLECTION);
    // this.ai removed — AI guideline check no longer invoked from submit().
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex({ authorId: 1, status: 1 });
    await this.col.createIndex({ status: 1, submittedAt: 1 });
    await this.col.createIndex({ newsletterMonth: 1, status: 1 });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  // ── quota ────────────────────────────────────────────────────────────────

  /** Used calendar month count for `user`, excluding draft/rejected. */
  async monthlyCount(user) {
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!uid) return 0;
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    return this.col.countDocuments({
      authorId: uid,
      status: { $nin: [STATUS.DRAFT, STATUS.REJECTED] },
      submittedAt: { $gte: start }
    });
  }

  async checkQuota(user) {
    const tier = tierService.effectiveTier(user);
    const max = tier === 'ADMIN' ? Infinity : (QUOTA_BY_TIER[tier] || 0);
    if (max === 0 || user?.role === 'sub_seat') {
      const err = new Error('Поднесувањето на прилози е достапно за претплатници.');
      err.code = 'TIER_FORBIDDEN';
      throw err;
    }
    const used = await this.monthlyCount(user);
    if (used >= max) {
      const err = new Error(`Достигната месечна граница (${max} поднесувања месечно за Вашиот план). Се ресетира на 1-ви во наредниот месец.`);
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }
    return { tier, used, max };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async createDraft(user, input) {
    await this._ensureIndexes();
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!uid) {
      const err = new Error('Invalid user id'); err.code = 'INVALID_USER'; throw err;
    }
    // Permission check; quota is enforced on submit, not on draft creation.
    const tier = tierService.effectiveTier(user);
    if ((tier !== 'A' && tier !== 'B' && tier !== 'ADMIN') || user?.role === 'sub_seat') {
      const err = new Error('Поднесувањето на прилози е достапно за претплатници.');
      err.code = 'TIER_FORBIDDEN';
      throw err;
    }
    const now = new Date();
    const doc = {
      _id:               new ObjectId(),
      authorId:          uid,
      status:            STATUS.DRAFT,
      attemptsAi:        0,
      title:             String(input?.title || '').slice(0, 140),
      bodyHtml:          String(input?.bodyHtml || ''),
      suggestedCategory: String(input?.suggestedCategory || '').slice(0, 80),
      suggestedKeywords: Array.isArray(input?.suggestedKeywords)
        ? input.suggestedKeywords.map(k => String(k || '').trim()).filter(Boolean).slice(0, 5)
        : [],
      coverImageUrl:     input?.coverImageUrl || null,
      authorBio:         BlogSubmissionsService._normalizeAuthorBio(input?.authorBio),
      aiVerdict:         null,
      editorialNotes:    '',
      newsletterMonth:   null,
      publishedBlogId:   null,
      manualReviewRequested: false,
      createdAt:         now,
      submittedAt:       null,
      acceptedAt:        null,
      publishedAt:       null,
      updatedAt:         now
    };
    await this.col.insertOne(doc);
    return doc;
  }

  async updateDraft(user, id, input) {
    await this._ensureIndexes();
    const oid = BlogSubmissionsService.toObjectId(id);
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!oid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const existing = await this.col.findOne({ _id: oid, authorId: uid });
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![STATUS.DRAFT, STATUS.RETURNED, STATUS.AI_FAILED].includes(existing.status)) {
      const e = new Error('Submission cannot be edited in its current status');
      e.code = 'NOT_EDITABLE';
      throw e;
    }

    const patch = { updatedAt: new Date() };
    if (input?.title !== undefined)             patch.title = String(input.title).slice(0, 140);
    if (input?.bodyHtml !== undefined)          patch.bodyHtml = String(input.bodyHtml);
    if (input?.suggestedCategory !== undefined) patch.suggestedCategory = String(input.suggestedCategory).slice(0, 80);
    if (input?.suggestedKeywords !== undefined) {
      patch.suggestedKeywords = Array.isArray(input.suggestedKeywords)
        ? input.suggestedKeywords.map(k => String(k || '').trim()).filter(Boolean).slice(0, 5) : [];
    }
    if (input?.coverImageUrl !== undefined)     patch.coverImageUrl = input.coverImageUrl || null;
    if (input?.authorBio    !== undefined)      patch.authorBio = BlogSubmissionsService._normalizeAuthorBio(input.authorBio);
    // Returned / ai_failed → editing brings the post back into draft so the AI
    // counter resets on next submit (per spec: "resets attemptsAi to 0").
    if (existing.status === STATUS.RETURNED) patch.status = STATUS.DRAFT;

    await this.col.updateOne({ _id: oid }, { $set: patch });
    return this.col.findOne({ _id: oid });
  }

  async getOne(user, id) {
    await this._ensureIndexes();
    const oid = BlogSubmissionsService.toObjectId(id);
    if (!oid) return null;
    const doc = await this.col.findOne({ _id: oid });
    if (!doc) return null;
    const isOwner = String(doc.authorId) === String(user._id);
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      const e = new Error('Forbidden'); e.code = 'FORBIDDEN'; throw e;
    }
    return doc;
  }

  async listMine(user) {
    await this._ensureIndexes();
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!uid) return [];
    return this.col.find({ authorId: uid }).sort({ updatedAt: -1 }).toArray();
  }

  async listMyPublished(user) {
    await this._ensureIndexes();
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!uid) return [];
    return this.col.find({ authorId: uid, status: STATUS.PUBLISHED }).sort({ publishedAt: -1 }).toArray();
  }

  async listForAdmin({ status = null, page = 1, perPage = 30 } = {}) {
    await this._ensureIndexes();
    const filter = status
      ? { status }
      : { status: { $in: [STATUS.SUBMITTED, STATUS.AI_PASSED, STATUS.AI_FAILED, STATUS.RETURNED, STATUS.ACCEPTED] } };
    const cursor = this.col.find(filter).sort({ submittedAt: -1, updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage);
    const [items, total] = await Promise.all([cursor.toArray(), this.col.countDocuments(filter)]);
    return { items, total, page, perPage };
  }

  // ── state transitions ────────────────────────────────────────────────────

  /**
   * Member action — runs the AI check. Enforces quota on first submit and
   * the 3-attempt cap on retries.
   */
  /**
   * Member submit. Transitions directly to the admin review queue. No AI
   * check, no retry loop. Editorial review is fully manual.
   */
  async submit(user, id) {
    await this._ensureIndexes();
    const oid = BlogSubmissionsService.toObjectId(id);
    const uid = BlogSubmissionsService.toObjectId(user._id);
    if (!oid || !uid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const doc = await this.col.findOne({ _id: oid, authorId: uid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![STATUS.DRAFT, STATUS.AI_FAILED, STATUS.RETURNED].includes(doc.status)) {
      const e = new Error('Submission cannot be re-submitted in its current status');
      e.code = 'NOT_SUBMITTABLE';
      throw e;
    }
    if (!doc.title || !doc.bodyHtml) {
      const e = new Error('Submission must have a title and body');
      e.code = 'INCOMPLETE';
      throw e;
    }

    // Quota check applies only to the FIRST submit (no submittedAt yet) and
    // when transitioning from `returned` back through the queue.
    if (!doc.submittedAt || doc.status === STATUS.RETURNED) {
      await this.checkQuota(user);
    }

    const now = new Date();
    await this.col.updateOne({ _id: oid }, {
      $set: {
        status: STATUS.SUBMITTED,
        submittedAt: doc.submittedAt || now,
        updatedAt: now
      }
    });
    return this.col.findOne({ _id: oid });
  }

  // ── admin transitions ────────────────────────────────────────────────────

  async adminAccept(user, id) {
    await this._ensureIndexes();
    const oid = BlogSubmissionsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const doc = await this.col.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    // Admin can accept any submission that has been sent for review. Includes
    // the legacy ai_passed / ai_failed statuses for back-compat.
    if (![STATUS.SUBMITTED, STATUS.AI_PASSED, STATUS.AI_FAILED].includes(doc.status)) {
      const e = new Error('Submission is not in a state that can be accepted');
      e.code = 'INVALID_TRANSITION';
      throw e;
    }
    const now = new Date();
    await this.col.updateOne({ _id: oid }, {
      $set: {
        status: STATUS.ACCEPTED,
        acceptedAt: now,
        newsletterMonth: BlogSubmissionsService.computeNewsletterMonth(now),
        updatedAt: now
      }
    });
    return this.col.findOne({ _id: oid });
  }

  async adminReturn(user, id, editorialNotes) {
    await this._ensureIndexes();
    const notes = String(editorialNotes || '').trim();
    if (!notes) { const e = new Error('editorialNotes is required'); e.code = 'NOTES_REQUIRED'; throw e; }
    const oid = BlogSubmissionsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const doc = await this.col.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (![STATUS.SUBMITTED, STATUS.AI_PASSED, STATUS.AI_FAILED].includes(doc.status)) {
      const e = new Error('Submission is not in a state that can be returned');
      e.code = 'INVALID_TRANSITION';
      throw e;
    }
    await this.col.updateOne({ _id: oid }, {
      $set: {
        status: STATUS.RETURNED,
        editorialNotes: notes,
        attemptsAi: 0,
        updatedAt: new Date()
      }
    });
    return this.col.findOne({ _id: oid });
  }

  async adminReject(user, id, editorialNotes) {
    await this._ensureIndexes();
    const notes = String(editorialNotes || '').trim();
    if (!notes) { const e = new Error('editorialNotes is required'); e.code = 'NOTES_REQUIRED'; throw e; }
    const oid = BlogSubmissionsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    await this.col.updateOne({ _id: oid }, {
      $set: { status: STATUS.REJECTED, editorialNotes: notes, updatedAt: new Date() }
    });
    return this.col.findOne({ _id: oid });
  }

  async adminPublish(user, id) {
    await this._ensureIndexes();
    const oid = BlogSubmissionsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }

    const doc = await this.col.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (doc.status !== STATUS.ACCEPTED) {
      const e = new Error('Only accepted submissions can be published');
      e.code = 'INVALID_TRANSITION';
      throw e;
    }

    // Resolve the author byline.
    const usersCol = this.db.collection('users');
    const author = await usersCol.findOne({ _id: doc.authorId }, { projection: { email: 1, username: 1, fullName: 1 } });
    // Author display name comes from the submission's own author-bio block
    // first (the member can customise this per post), then falls back to the
    // account's full name / username.
    const bio = doc.authorBio || {};
    const authorName = bio.displayName || author?.fullName || author?.username || author?.email || 'Nexa member';

    // Create the public blog row (matching the existing schema in blogController.createBlog).
    const slug = await generateUniqueSlug(this.db, doc.title);
    const plain = String(doc.bodyHtml || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const blog = {
      _id: uuidv4(),
      slug,
      title: doc.title,
      content: doc.bodyHtml,
      excerpt: doc.aiVerdict?.suggestedMetaDescription || plain.slice(0, 200) + '…',
      category: doc.aiVerdict?.suggestedCategory || doc.suggestedCategory || 'General',
      tags: doc.aiVerdict?.suggestedKeywords || doc.suggestedKeywords || [],
      contentLanguage: 'mk',
      featuredImage: doc.coverImageUrl || null,
      status: 'published',
      promotedTool: 'legal_health_check',
      metaTitle: doc.title,
      metaDescription: doc.aiVerdict?.suggestedMetaDescription || plain.slice(0, 155),
      focusKeyword: (doc.aiVerdict?.suggestedKeywords || doc.suggestedKeywords || [])[0] || '',
      author: {
        id: doc.authorId,
        name: authorName,
        bio: bio.bio || '',
        photoUrl: bio.photoUrl || null,
        linkedinUrl: bio.linkedinUrl || '',
        contactEmail: bio.contactEmail || author?.email || ''
      },
      submissionId: doc._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      views: 0,
      likes: 0
    };
    await this.blogs.insertOne(blog);

    const now = new Date();
    await this.col.updateOne({ _id: oid }, {
      $set: {
        status: STATUS.PUBLISHED,
        publishedBlogId: blog._id,
        publishedAt: now,
        updatedAt: now
      }
    });
    return { submission: await this.col.findOne({ _id: oid }), blog };
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  /** ≤25 of month → next month; >25 → month after next. Returns 'YYYY-MM'. */
  /** Defensive normalization for the author-bio block. */
  static _normalizeAuthorBio(input) {
    const i = input || {};
    return {
      displayName:  String(i.displayName  || '').trim().slice(0, 120),
      contactEmail: String(i.contactEmail || '').trim().slice(0, 240),
      linkedinUrl:  String(i.linkedinUrl  || '').trim().slice(0, 240),
      photoUrl:     String(i.photoUrl     || '').trim().slice(0, 500) || null,
      bio:          String(i.bio          || '').trim().slice(0, 320)
    };
  }

  static computeNewsletterMonth(now = new Date()) {
    const d = new Date(now);
    const offset = d.getUTCDate() <= 25 ? 1 : 2;
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}

BlogSubmissionsService.STATUS = STATUS;
BlogSubmissionsService.QUOTA_BY_TIER = QUOTA_BY_TIER;
BlogSubmissionsService.COLLECTION = COLLECTION;

module.exports = BlogSubmissionsService;
