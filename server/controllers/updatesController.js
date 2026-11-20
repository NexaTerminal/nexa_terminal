const { ObjectId } = require('mongodb');
const UserService = require('../services/userService');
const agentPosts = require('../services/agentPostService');
const profiles = require('../services/profileService');

/**
 * Terminal "Updates / Известувања" feed.
 *
 * Admin-authored, short, dated, optionally action-linked posts shown on the
 * member Dashboard. This replaces the old social/newsfeed surface, which only
 * re-rendered the public blog. Updates are member-only value: regulatory
 * changes, deadlines, "do this now" nudges that link straight into the product.
 *
 * Any logged-in user can like and comment; admins author the posts.
 *
 * Collection: `updates`
 *   { title, body, category, ctaLabel, ctaHref,
 *     status: 'published'|'draft', publishedAt, createdAt, updatedAt, authorId,
 *     authorAgent: ''|'legal'|'hr'|'marketing'|'insurance'|'accounting',
 *     likes: [ObjectId], comments: [{ _id, userId, authorName, content, createdAt,
 *                                     isAgent?, agent?, replyTo? }] }
 *
 * Character posts: `authorAgent` makes an AI Team character the author. A
 * comment on such a post gets an automatic short reply from that character
 * (async, capped per user/day, kill switch UPDATES_AI_REPLIES=off).
 *
 * Scheduling: a published post whose publishedAt is in the future stays hidden
 * from members until then — no cron needed.
 */

const COLLECTION = 'updates';
const AI_REPLIES = 'update_ai_replies';           // { userId, createdAt } — rate-limit ledger
const AI_REPLY_DAILY_CAP = 10;

// Members see only posts that are published AND due.
const liveFilter = () => ({ status: 'published', publishedAt: { $lte: new Date() } });

// Optional ISO/datetime string → Date | null | undefined (undefined = not sent).
function parsePublishAt(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function sanitize(body = {}) {
  const out = {};
  if (body.title !== undefined)    out.title    = String(body.title).trim();
  if (body.body !== undefined)     out.body     = String(body.body).trim();
  if (body.category !== undefined) out.category = String(body.category || '').trim();
  if (body.ctaLabel !== undefined) out.ctaLabel = String(body.ctaLabel || '').trim();
  if (body.ctaHref !== undefined)  out.ctaHref  = String(body.ctaHref || '').trim();
  if (body.status !== undefined)   out.status   = body.status === 'draft' ? 'draft' : 'published';
  if (body.authorAgent !== undefined) {
    out.authorAgent = agentPosts.isAgentKey(body.authorAgent) ? body.authorAgent : '';
  }
  return out;
}

const uid = (req) => String(req.user.id || req.user._id);

async function displayName(db, userId) {
  try {
    const user = await new UserService(db).findById(userId);
    return user?.companyInfo?.companyName
      || user?.userName
      || user?.officialEmail
      || 'Корисник';
  } catch {
    return 'Корисник';
  }
}

// Shape a stored doc for a list/card response (no heavy arrays, just counts + my-state).
function toCard(doc, myId) {
  const likes = doc.likes || [];
  return {
    _id: doc._id,
    title: doc.title,
    body: doc.body,
    category: doc.category || '',
    ctaLabel: doc.ctaLabel || '',
    ctaHref: doc.ctaHref || '',
    authorAgent: doc.authorAgent || '',
    publishedAt: doc.publishedAt,
    createdAt: doc.createdAt,
    likesCount: likes.length,
    commentsCount: (doc.comments || []).length,
    likedByMe: likes.some(id => String(id) === myId)
  };
}

// GET /api/updates — published updates for any logged-in user, newest first.
exports.list = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = req.app.locals.db;
    const myId = uid(req);
    const docs = await db.collection(COLLECTION)
      .find(liveFilter())
      .sort({ publishedAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 10, 50))
      .toArray();
    res.json({ items: docs.map(d => toCard(d, myId)) });
  } catch (error) {
    console.error('Error listing updates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/updates/:id — full update + comments (for the "read more" modal).
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const db = req.app.locals.db;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
    const doc = await db.collection(COLLECTION).findOne(
      isAdmin ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), ...liveFilter() }
    );
    if (!doc) return res.status(404).json({ message: 'Update not found' });

    const myId = uid(req);
    const comments = (doc.comments || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(cm => ({ ...cm, mine: String(cm.userId) === myId }));
    // Members with a (non-private) profile get a logo + link on their comments.
    const by = await profiles.bylines(db, comments.filter(c => !c.isAgent).map(c => c.userId)).catch(() => new Map());
    for (const cm of comments) {
      const b = !cm.isAgent && by.get(String(cm.userId));
      if (b) { cm.authorSlug = b.slug; cm.authorAvatar = b.avatarUrl; }
    }

    res.json({ item: { ...toCard(doc, myId), comments } });
  } catch (error) {
    console.error('Error fetching update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/updates/admin — every update (any status) for the admin console.
exports.adminList = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const items = await db.collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ items });
  } catch (error) {
    console.error('Error listing updates (admin):', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/updates — admin only.
exports.create = async (req, res) => {
  try {
    const data = sanitize(req.body);
    if (!data.title || !data.body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }
    const db = req.app.locals.db;
    const now = new Date();
    const status = data.status || 'published';
    const publishAt = parsePublishAt(req.body.publishAt);
    const doc = {
      title: data.title,
      body: data.body,
      category: data.category || '',
      ctaLabel: data.ctaLabel || '',
      ctaHref: data.ctaHref || '',
      authorAgent: data.authorAgent || '',
      status,
      authorId: new ObjectId(uid(req)),
      // Draft keeps the chosen date (applied on publish); published uses it or now.
      publishedAt: publishAt || (status === 'published' ? now : null),
      createdAt: now,
      updatedAt: now,
      likes: [],
      comments: []
    };
    const result = await db.collection(COLLECTION).insertOne(doc);
    res.status(201).json({ item: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/updates/:id — admin only.
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const db = req.app.locals.db;
    const existing = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Update not found' });

    const data = sanitize(req.body);
    data.updatedAt = new Date();
    // publishAt: a date → (re)schedule; '' → "no schedule" (publish now if it
    // was still pending); omitted → keep, stamping now on first publish.
    const publishAt = parsePublishAt(req.body.publishAt);
    const now = new Date();
    const pending = existing.publishedAt && existing.publishedAt > now;
    if (publishAt) {
      data.publishedAt = publishAt;
    } else if (publishAt === null && pending) {
      data.publishedAt = now;
    } else if (data.status === 'published' && existing.status !== 'published' && !pending) {
      data.publishedAt = now;
    }

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    );
    res.json({ item: result.value });
  } catch (error) {
    console.error('Error updating update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/updates/:id — admin only.
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const db = req.app.locals.db;
    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Update deleted' });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/updates/:id/like — any logged-in user toggles their like.
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const db = req.app.locals.db;
    const myId = new ObjectId(uid(req));

    const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ message: 'Update not found' });

    const liked = (doc.likes || []).some(x => String(x) === String(myId));
    const op = liked ? { $pull: { likes: myId } } : { $addToSet: { likes: myId } };
    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) }, op, { returnDocument: 'after' }
    );
    res.json({ likesCount: (result.value.likes || []).length, likedByMe: !liked });
  } catch (error) {
    console.error('Error liking update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/updates/:id/comments — any logged-in user adds a comment.
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Comment content is required' });
    if (content.length > 2000) return res.status(400).json({ message: 'Comment too long' });

    const db = req.app.locals.db;
    const myId = uid(req);
    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(myId),
      authorName: await displayName(db, myId),
      content,
      createdAt: new Date()
    };

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ message: 'Update not found' });

    const agent = result.value.authorAgent;
    const replyPending = !!agent && await canAgentReply(db, myId);
    res.status(201).json({
      comment: { ...comment, mine: true },
      commentsCount: (result.value.comments || []).length,
      replyPending,
      replyAgent: replyPending ? agent : ''
    });
    if (replyPending) {
      agentReply(db, result.value, comment).catch(e => console.warn('[updates] agent reply failed:', e.message));
    }
  } catch (error) {
    console.error('Error commenting on update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/updates/:id/comments/:commentId — comment author or admin.
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const db = req.app.locals.db;
    const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ message: 'Update not found' });

    const comment = (doc.comments || []).find(c => String(c._id) === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = String(comment.userId) === uid(req);
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own comment' });
    }

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $pull: { comments: { _id: new ObjectId(commentId) } } },
      { returnDocument: 'after' }
    );
    // A member's comment takes the character's reply to it along.
    const cleaned = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $pull: { comments: { replyTo: new ObjectId(commentId) } } },
      { returnDocument: 'after' }
    );
    if (cleaned.value) result.value = cleaned.value;
    res.json({ commentsCount: (result.value.comments || []).length });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Character posts: drafting + automatic replies ───────────────────────────

// POST /api/updates/admin/draft — admin: { agent, source, hint } → draft fields.
exports.draft = async (req, res) => {
  try {
    const { agent, source, hint } = req.body || {};
    if (!agentPosts.isAgentKey(agent)) return res.status(400).json({ message: 'Избери лик.' });
    if (!String(source || '').trim()) return res.status(400).json({ message: 'Внеси извор.' });
    const draft = await agentPosts.draftPost({ agent, source, hint });
    if (!draft || !draft.title || !draft.body) {
      return res.status(502).json({ message: 'Нацртот не успеа. Обиди се повторно.' });
    }
    res.json({ draft });
  } catch (error) {
    console.error('Error drafting update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

let aiRepliesIndexed = false;
async function canAgentReply(db, userId) {
  if (process.env.UPDATES_AI_REPLIES === 'off') return false;
  try {
    const col = db.collection(AI_REPLIES);
    if (!aiRepliesIndexed) {
      aiRepliesIndexed = true;
      col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2 * 86400 }).catch(() => {});
    }
    const since = new Date(Date.now() - 86400000);
    const used = await col.countDocuments({ userId: String(userId), createdAt: { $gte: since } });
    return used < AI_REPLY_DAILY_CAP;
  } catch {
    return false;
  }
}

// Generate the character's reply and append it to the thread (fire-and-forget).
async function agentReply(db, post, comment) {
  const agent = post.authorAgent;
  await db.collection(AI_REPLIES).insertOne({ userId: String(comment.userId), createdAt: new Date() });
  const earlier = (post.comments || []).filter(c => String(c._id) !== String(comment._id));
  const content = await agentPosts.replyToComment({ agent, post, comment: comment.content, earlier });
  if (!content) return;
  await db.collection(COLLECTION).updateOne(
    { _id: post._id },
    { $push: { comments: {
      _id: new ObjectId(),
      userId: null,
      isAgent: true,
      agent,
      authorName: agentPosts.agentName(agent),
      replyTo: comment._id,
      content,
      createdAt: new Date()
    } } }
  );
}
