// Saved cold-email copy variants for the admin Send-invite modal.
// Each template is a reusable {name, subject, body, language} owned by the
// admin who created it. Not tied to a promo code — the code travels in the URL
// at send time, so one saved variant works across every campaign.

const { ObjectId } = require('mongodb');

const COLLECTION = 'cold_email_templates';
const MAX_NAME = 120;
const MAX_SUBJECT = 300;
const MAX_BODY = 20000;

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));
const clean = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));

class ColdEmailTemplateService {
  constructor(db) {
    this.col = db.collection(COLLECTION);
  }

  async ensureIndexes() {
    await this.col.createIndex({ createdBy: 1, updatedAt: -1 });
  }

  /** All variants owned by this admin, most-recently-updated first. */
  async list(userId) {
    return this.col.find({ createdBy: toId(userId) }).sort({ updatedAt: -1 }).toArray();
  }

  async create(userId, { name, subject, body, language }) {
    const now = new Date();
    const doc = {
      createdBy: toId(userId),
      name: clean(name, MAX_NAME) || 'Без име',
      subject: clean(subject, MAX_SUBJECT),
      body: clean(body, MAX_BODY),
      language: language === 'en' ? 'en' : 'mk',
      createdAt: now,
      updatedAt: now
    };
    const { insertedId } = await this.col.insertOne(doc);
    return { ...doc, _id: insertedId };
  }

  /** Update an owned variant; returns null if not found / not owned. */
  async update(userId, id, { name, subject, body, language }) {
    const $set = { updatedAt: new Date() };
    if (name !== undefined) $set.name = clean(name, MAX_NAME) || 'Без име';
    if (subject !== undefined) $set.subject = clean(subject, MAX_SUBJECT);
    if (body !== undefined) $set.body = clean(body, MAX_BODY);
    if (language !== undefined) $set.language = language === 'en' ? 'en' : 'mk';
    const r = await this.col.findOneAndUpdate(
      { _id: toId(id), createdBy: toId(userId) },
      { $set },
      { returnDocument: 'after' }
    );
    return r.value || null;
  }

  async remove(userId, id) {
    const { deletedCount } = await this.col.deleteOne({ _id: toId(id), createdBy: toId(userId) });
    return deletedCount === 1;
  }
}

module.exports = ColdEmailTemplateService;
