'use strict';

/**
 * Cascading user deletion. Wipes the user row + every collection that
 * holds a reference to them, so re-using the same email later is clean.
 *
 * Safety rails (enforced at the controller layer):
 *   - Platform owners (whitelist in platformOwnerService) are never deletable.
 *   - The acting admin cannot delete themselves.
 *   - Other platform admins are NOT deletable through this endpoint.
 *
 * Returns a per-collection delete-count summary so the admin can verify
 * the wipe in the response.
 */

const { ObjectId } = require('mongodb');

const toObjectId = (v) => {
  if (v instanceof ObjectId) return v;
  if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
  return null;
};

/**
 * Each entry: [collection, filter-builder, label].
 *
 * filter-builder receives the userId (as ObjectId) and the user doc,
 * and returns the Mongo filter to apply for deletion.
 *
 * Intentionally KEPT (not wiped) for forensic / compliance reasons:
 *   - audit_logs        — admin actions, including this one
 *   - security_events / security_alerts / security_logs
 *   - activity_logs     — coarse-grain access trail
 */
const CASCADES = [
  // Sessions / verification
  ['emailVerifications',    (uid) => ({ userId: uid }),                'Email verification codes'],
  // Billing
  ['proInvoices',           (uid) => ({ userId: uid }),                'Pro-invoices (профактури)'],
  ['invoices',              (uid) => ({ userId: uid }),                'Invoices (Сметководство)'],
  ['credit_transactions',   (uid) => ({ userId: uid }),                'Credit history'],
  // Content
  ['blogs',                 (uid) => ({ $or: [{ 'author.id': uid }, { authorId: uid }, { userId: uid }] }), 'Published blogs'],
  ['custom_templates',      (uid) => ({ $or: [{ userId: uid }, { ownerId: uid }] }), 'Custom templates'],
  ['template_versions',     (uid) => ({ userId: uid }),                'Template versions'],
  ['template_generations',  (uid) => ({ userId: uid }),                'Doc generations'],
  ['documents',             (uid) => ({ userId: uid }),                'Generated documents'],
  ['shared_documents',      (uid) => ({ $or: [{ userId: uid }, { ownerId: uid }] }), 'Shared documents'],
  ['socialPosts',           (uid) => ({ $or: [{ userId: uid }, { authorId: uid }] }), 'Social feed posts'],
  // Network surfaces
  ['inquirySignals',        (uid) => ({ userId: uid }),                'Inquiry interest signals'],
  ['inquiryClaims',         (uid) => ({ userId: uid }),                'Inquiry claims'],
  ['inquiryEngagements',    (uid) => ({ userId: uid }),                'Inquiry engagements'],
  ['topicSubmissions',      (uid) => ({ userId: uid }),                'Topics Q&A submissions'],
  // Compliance reports
  ['lhcAssessments',        (uid) => ({ userId: uid }),                'LHC reports'],
  ['mhcAssessments',        (uid) => ({ userId: uid }),                'MHC reports'],
  ['chcAssessments',        (uid) => ({ userId: uid }),                'CHC reports'],
  ['hhcAssessments',        (uid) => ({ userId: uid }),                'HHC reports'],
  // Education
  ['courseProgress',        (uid) => ({ userId: uid }),                'Course progress'],
  // Chat
  ['chatbot_conversations', (uid) => ({ userId: uid }),                'Chatbot conversations'],
  ['chatbot_usage',         (uid) => ({ userId: uid }),                'Chatbot usage'],
  // Marketplace / providers
  ['provider_interests',    (uid) => ({ userId: uid }),                'Provider interests'],
  ['offer_requests',        (uid) => ({ userId: uid }),                'Offer requests'],
  ['service_providers',     (uid) => ({ userId: uid }),                'Service-provider records'],
  // Verification
  ['company_verifications', (uid) => ({ userId: uid }),                'Verification records'],
  // Investments / analytics
  ['investments',           (uid) => ({ userId: uid }),                'Investment records'],
  ['user_analytics',        (uid) => ({ userId: uid }),                'User analytics'],
  ['response_analytics',    (uid) => ({ userId: uid }),                'Response analytics'],
  // Notifications
  ['admin_notifications',   (uid) => ({ userId: uid }),                'Admin notifications'],
  ['admin_notification_preferences', (uid) => ({ userId: uid }),       'Notification prefs'],
];

class UserDeletionService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Cascading delete. Detaches sub-seats first (sets parentSuperUserId=null
   * and lowers role to standard_user) instead of cascading-delete them —
   * sub-seats can be real people and shouldn't disappear when the parent does.
   *
   * Returns:
   *   {
   *     deleted: true,
   *     username, email,
   *     counts: { collectionName: deletedCount, ... },
   *     subSeatsDetached: number
   *   }
   */
  async deleteUserCascading(userId, { actingAdminId } = {}) {
    const uid = toObjectId(userId);
    if (!uid) throw new Error('Invalid user id.');

    const usersCol = this.db.collection('users');
    const user = await usersCol.findOne({ _id: uid });
    if (!user) {
      const e = new Error('Корисникот не е пронајден.');
      e.code = 'NOT_FOUND';
      throw e;
    }
    if (user.role === 'admin') {
      const e = new Error('Не можете да избришете платформа админ преку оваа алатка.');
      e.code = 'CANNOT_DELETE_ADMIN';
      throw e;
    }
    if (actingAdminId && String(actingAdminId) === String(uid)) {
      const e = new Error('Не можете да го избришете сопствениот налог.');
      e.code = 'CANNOT_DELETE_SELF';
      throw e;
    }

    // 1) Detach (don't delete) any sub-seats belonging to this admin.
    let subSeatsDetached = 0;
    try {
      const r = await usersCol.updateMany(
        { parentSuperUserId: uid },
        { $set: { parentSuperUserId: null, role: 'standard_user', updatedAt: new Date() } }
      );
      subSeatsDetached = r.modifiedCount || 0;
    } catch (_) { /* collection / index variants — non-fatal */ }

    // 2) Cascade wipe every collection that holds a reference.
    const counts = {};
    for (const [name, filterBuilder, label] of CASCADES) {
      try {
        const col = this.db.collection(name);
        const filter = filterBuilder(uid, user);
        const r = await col.deleteMany(filter);
        if (r.deletedCount > 0) counts[name] = r.deletedCount;
      } catch (e) {
        // Collection might not exist in this env — keep going.
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[userDeletionService] wipe failed for ${name}: ${e.message}`);
        }
      }
    }

    // 3) Reset the per-year proInvoices counter is not needed — the next
    //    seq just keeps incrementing, leaving no number-gap that matters.

    // 4) Finally, the user row itself.
    await usersCol.deleteOne({ _id: uid });

    // 5) Audit log (best-effort). Keep this AFTER the wipe so we can prove
    //    the action even if intermediate steps fail.
    try {
      await this.db.collection('audit_logs').insertOne({
        type: 'USER_HARD_DELETE',
        actor: actingAdminId ? toObjectId(actingAdminId) : null,
        target: { userId: uid, email: user.email || null, username: user.username || null },
        counts,
        subSeatsDetached,
        at: new Date()
      });
    } catch (_) { /* audit collection optional */ }

    return {
      deleted: true,
      username: user.username || null,
      email: user.email || null,
      counts,
      subSeatsDetached
    };
  }
}

module.exports = UserDeletionService;
