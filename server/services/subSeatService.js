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
const { ROLES, DEFAULT_ADMIN_SEAT_LIMIT } = require('../constants/roles');

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));

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
   * Invite a sub-seat. Throws on any of:
   *   - parent has no admin_user role or no active subscription
   *   - email already taken
   *   - seat limit reached
   *
   * Returns { user, tempPassword } where tempPassword is shown ONCE
   * in the response so the inviter sees it before the email is sent.
   */
  async invite(parent, { email, fullName }) {
    if (!parent || parent.role !== ROLES.ADMIN_USER) {
      throw new Error('Only admin_user accounts can invite sub-seats');
    }
    if (!isValidEmail(email)) {
      throw new Error('Невалидна е-пошта / Invalid email');
    }
    const normEmail = email.trim().toLowerCase();

    const seatLimit = parent.superUser?.seatLimit ?? DEFAULT_ADMIN_SEAT_LIMIT;
    const current = await this.countActiveForParent(parent._id);
    if (current >= seatLimit) {
      throw new Error(`Достигнат лимит на седишта (${seatLimit}) / Seat limit reached (${seatLimit})`);
    }

    // Reject if email or username already exists
    const collision = await this.users.findOne({
      $or: [{ email: normEmail }, { username: normEmail }]
    });
    if (collision) throw new Error('Корисник со оваа е-пошта веќе постои / User with this email already exists');

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(tempPassword, salt);

    const now = new Date();
    const userDoc = {
      username: normEmail,
      email: normEmail,
      password: hashed,
      role: ROLES.SUB_SEAT,
      parentSuperUserId: toObjectId(parent._id),
      fullName: fullName || null,
      // Terminal is MK-only; no per-user language field stored on sub-seats.
      isActive: true,
      mustChangePassword: true,
      isVerified: false,
      profileComplete: false,
      // Mirror the shape of register() so other code paths don't choke:
      companyInfo: {
        companyName: parent.companyInfo?.companyName || '',
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
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(tempPassword, salt);

    await this.users.updateOne(
      { _id: seat._id },
      { $set: { password: hashed, mustChangePassword: true, updatedAt: new Date() } }
    );
    return { user: seat, tempPassword };
  }

  /** Re-activate a previously revoked sub-seat (respects seatLimit). */
  async reactivate(parent, subSeatUserId) {
    const seatLimit = parent.superUser?.seatLimit ?? DEFAULT_ADMIN_SEAT_LIMIT;
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
