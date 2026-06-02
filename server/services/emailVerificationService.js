'use strict';

/**
 * Email verification — 6-digit code with TTL + attempt limits.
 *
 * Collection: `emailVerifications`
 *   { userId, code, codeHash, attempts, sentAt, expiresAt, consumedAt }
 *
 * Code is stored hashed (sha256) to avoid leaking on a DB dump. Lifetime
 * is 30 minutes. Max 5 attempts; on the 6th the code is invalidated and
 * the user has to request a resend.
 */

const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const CODE_TTL_MS    = 30 * 60 * 1000;
const MAX_ATTEMPTS   = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const toObjectId = (v) => {
  if (v instanceof ObjectId) return v;
  if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
  return null;
};

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const genCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

class EmailVerificationService {
  constructor(db, emailService) {
    this.col = db.collection('emailVerifications');
    this.emailService = emailService;
  }

  async ensureIndexes() {
    await this.col.createIndex({ userId: 1 });
    await this.col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }

  /**
   * Issue (or re-issue) a verification code for the user. Enforces a
   * 60-second cooldown between sends.
   */
  async issueCode(user) {
    const uid = toObjectId(user._id);
    if (!uid) throw new Error('Invalid user id.');
    if (!user.email) throw new Error('User has no email to verify.');

    // Cooldown check: if we already issued a code within the last minute, reuse it.
    const existing = await this.col.findOne({ userId: uid, consumedAt: null }, { sort: { sentAt: -1 } });
    if (existing && Date.now() - new Date(existing.sentAt).getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(existing.sentAt).getTime())) / 1000);
      const e = new Error(`Почекајте ${waitSec}с пред нов код.`);
      e.code = 'COOLDOWN'; e.waitSec = waitSec;
      throw e;
    }

    // Invalidate any older outstanding codes for this user.
    await this.col.updateMany(
      { userId: uid, consumedAt: null },
      { $set: { consumedAt: new Date(), invalidatedReason: 'replaced' } }
    );

    const code = genCode();
    const now = new Date();
    const doc = {
      userId: uid,
      codeHash: sha256(code),
      attempts: 0,
      sentAt: now,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      consumedAt: null,
      email: user.email
    };
    await this.col.insertOne(doc);

    // Send the email (non-blocking from caller's POV — but we do await here
    // so the API can surface delivery errors).
    const { verificationCodeEmail } = require('../emails/verificationEmail');
    const tpl = verificationCodeEmail(code);
    await this.emailService.sendEmail(user.email, tpl.subject, tpl.html);

    return { sentAt: now, expiresAt: doc.expiresAt };
  }

  /**
   * Verify a submitted code. Returns { ok: boolean, reason?: string }.
   * On success, marks the code consumed.
   */
  async verifyCode(userId, code) {
    const uid = toObjectId(userId);
    if (!uid) return { ok: false, reason: 'INVALID_USER' };

    const record = await this.col.findOne(
      { userId: uid, consumedAt: null },
      { sort: { sentAt: -1 } }
    );
    if (!record) return { ok: false, reason: 'NO_CODE' };
    if (new Date(record.expiresAt) <= new Date()) return { ok: false, reason: 'EXPIRED' };
    if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };

    const submitted = sha256(String(code || '').trim());
    if (submitted !== record.codeHash) {
      await this.col.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return { ok: false, reason: 'MISMATCH', attemptsLeft: MAX_ATTEMPTS - (record.attempts + 1) };
    }

    await this.col.updateOne({ _id: record._id }, { $set: { consumedAt: new Date() } });
    return { ok: true };
  }
}

module.exports = EmailVerificationService;
