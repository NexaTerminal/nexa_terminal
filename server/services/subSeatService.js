/**
 * SubSeatService — provision and manage team members ("sub-seats") owned
 * by an admin_user. Mirrors the existing user creation pattern from
 * authController.register but skips password choice (we generate a temp).
 *
 * Sub-seat permissions:
 *   - Inherit parent's subscription status (handled by SubscriptionService.effectiveStatus)
 *   - Can use documents, AI chat, contract analysis, health checks
 *   - CANNOT access marketplace, social, offer requests, admin pages, super-user dashboard
 *   - Permission denial is enforced by `subSeatGuard` middleware at the route level
 *
 * Seat-limit is enforced on insert based on the parent's superUser.seatLimit.
 */

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ROLES, PLAN_SEATS } = require('../constants/roles');

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));

// Two-tier, exclusive sub-user model:
//   Basic (standard_user) → 'coworker' seats (shared company), max 3
//   Pro   (admin_user)    → 'client'   seats (own company),    max 25
// The seat type is derived from the parent's role — callers cannot choose it.
const seatTypeFor = (parent) =>
  parent.role === ROLES.ADMIN_USER ? 'client' : 'coworker';

const seatLimitFor = (parent) => {
  if (parent.role === ROLES.ADMIN_USER)    return parent.superUser?.seatLimit ?? PLAN_SEATS.pro;   // 25
  if (parent.role === ROLES.STANDARD_USER) return PLAN_SEATS.basic;                                 // 3
  return 0;
};

/** Generate a memorable-but-secure temp password: 4 random words + 4 digits. */
const generateTempPassword = () => {
  // Hex bytes → 12-char temp pass like "a3f4-b7c2-9e1d". Random, copyable.
  const bytes = crypto.randomBytes(6).toString('hex');
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}`;
};

const isValidEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

class SubSeatService {
  constructor(database) {
    if (!database) throw new Error('SubSeatService requires a database');
    this.db = database;
    this.users = database.collection('users');
  }

  /** List all sub-seats for a given parent admin_user. */
  async listForParent(parentUserId) {
    return this.users.find(
      { parentSuperUserId: toObjectId(parentUserId), role: ROLES.SUB_SEAT },
      { projection: { password: 0, tempPassword: 0 } }
    ).sort({ createdAt: -1 }).toArray();
  }

  /** Active seat count (excludes deactivated). */
  async countActiveForParent(parentUserId) {
    return this.users.countDocuments({
      parentSuperUserId: toObjectId(parentUserId),
      role: ROLES.SUB_SEAT,
      isActive: { $ne: false }
    });
  }

  /**
   * Invite a sub-seat. The seat TYPE is derived from the parent's role:
   *   - Basic (standard_user) → 'coworker' (shared company), max 3
   *   - Pro   (admin_user)    → 'client'   (own company),    max 25
   * Callers cannot choose the type — this enforces tier exclusivity.
   *
   * Throws on: invalid parent role, bad email, seat limit reached, email taken.
   * Returns { user, tempPassword } where tempPassword is shown ONCE.
   */
  async invite(parent, { email, fullName }) {
    if (!parent || (parent.role !== ROLES.ADMIN_USER && parent.role !== ROLES.STANDARD_USER)) {
      throw new Error('Only Basic or Pro accounts can invite sub-users');
    }
    if (!isValidEmail(email)) {
      throw new Error('Невалидна е-пошта / Invalid email');
    }
    const normEmail = email.trim().toLowerCase();

    const seatType   = seatTypeFor(parent);                       // 'coworker' | 'client'
    const companyMode = seatType === 'client' ? 'independent' : 'shared';

    const seatLimit = seatLimitFor(parent);
    const current = await this.countActiveForParent(parent._id);
    if (current >= seatLimit) {
      const noun = seatType === 'client' ? 'клиенти' : 'соработници';
      throw new Error(`Достигнат лимит на ${noun} (${seatLimit}) / Seat limit reached (${seatLimit})`);
    }

    // Reject if email or username already exists
    const collision = await this.users.findOne({
      $or: [{ email: normEmail }, { username: normEmail }]
    });
    if (collision) throw new Error('Корисник со оваа е-пошта веќе постои / User with this email already exists');

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(tempPassword, salt);

    const now = new Date();
    const userDoc = {
      username: normEmail,
      email: normEmail,
      password: hashed,
      role: ROLES.SUB_SEAT,
      seatType,
      parentSuperUserId: toObjectId(parent._id),
      fullName: fullName || null,
      // Terminal is MK-only; no per-user language field stored on sub-seats.
      isActive: true,
      mustChangePassword: true,
      // Co-workers inherit the parent's verified company; clients are vouched
      // for by the Pro account (no separate per-client verification).
      isVerified: true,
      profileComplete: companyMode === 'shared',
      // 'shared'      → uses the parent's company info (co-worker)
      // 'independent' → has its own company info, filled by the Pro per client
      companyMode,
      // For 'shared' seats: copy parent's companyInfo so legacy code that reads
      // user.companyInfo keeps working. Updates to the parent's profile propagate
      // to all shared seats automatically (see userController.updateProfile).
      // For 'independent' seats: blank skeleton — CompanyInfoPrompt will collect.
      companyInfo: companyMode === 'shared'
        ? { ...(parent.companyInfo || {}) }
        : {
            companyName: '',
            companyAddress: '',
            companyTaxNumber: '',
            companyManager: '',
            businessActivity: '',
            website: '',
            industry: '',
            companySize: '',
            role: '',
            description: '',
            crnNumber: '',
            phone: '',
            companyPIN: '',
            contactEmail: '',
            facebook: '',
            linkedin: '',
            missionStatement: '',
            companyLogo: ''
          },
      // Sub-seats carry no subscription of their own; gated transitively.
      subscription: null,
      createdAt: now,
      updatedAt: now,
      invitedBy: toObjectId(parent._id),
      invitedAt: now
    };

    const result = await this.users.insertOne(userDoc);
    return {
      user: { ...userDoc, _id: result.insertedId, password: undefined },
      tempPassword
    };
  }

  /** Revoke (deactivate) a sub-seat. Soft delete — preserves audit/data. */
  async revoke(parentUserId, subSeatUserId) {
    const result = await this.users.findOneAndUpdate(
      {
        _id: toObjectId(subSeatUserId),
        parentSuperUserId: toObjectId(parentUserId),
        role: ROLES.SUB_SEAT
      },
      { $set: { isActive: false, revokedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result?.value) throw new Error('Sub-seat not found or not owned by this admin');
    return result.value;
  }

  /**
   * Generate a fresh temp password for an existing sub-seat. Returns the new
   * temp password (shown once to the inviter). Marks the user as requiring
   * password change on next login.
   */
  async resetPassword(parent, subSeatUserId) {
    const seat = await this.users.findOne({
      _id: toObjectId(subSeatUserId),
      parentSuperUserId: toObjectId(parent._id),
      role: ROLES.SUB_SEAT
    });
    if (!seat) throw new Error('Sub-seat not found or not owned by this admin');

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(tempPassword, salt);

    await this.users.updateOne(
      { _id: seat._id },
      { $set: { password: hashed, mustChangePassword: true, updatedAt: new Date() } }
    );
    return { user: seat, tempPassword };
  }

  /** Re-activate a previously revoked sub-seat (respects seatLimit). */
  async reactivate(parent, subSeatUserId) {
    const seatLimit = seatLimitFor(parent);
    const current = await this.countActiveForParent(parent._id);
    if (current >= seatLimit) {
      throw new Error(`Seat limit reached (${seatLimit})`);
    }
    const result = await this.users.findOneAndUpdate(
      {
        _id: toObjectId(subSeatUserId),
        parentSuperUserId: toObjectId(parent._id),
        role: ROLES.SUB_SEAT
      },
      { $set: { isActive: true, revokedAt: null, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result?.value) throw new Error('Sub-seat not found');
    return result.value;
  }
}

module.exports = SubSeatService;
module.exports.generateTempPassword = generateTempPassword;
module.exports.seatTypeFor = seatTypeFor;
module.exports.seatLimitFor = seatLimitFor;
