/**
 * Subscription Service — state machine + business rules.
 *
 * Lifecycle:  trial → pending_approval → active → (renew) | suspended | cancelled
 *
 * Grace period (one-time, lifetime per account):
 *   When a user shows payment intent (clicks Subscribe / Email-Invoice) but
 *   trial expires before admin approval, a 3-day grace window is granted.
 *   The flag `subscription.gracePeriod.used` is burned forever the first time
 *   grace is granted — there is no reset.
 *
 * Sub-seats carry no own subscription; their effective state is the parent's.
 */

const { ObjectId } = require('mongodb');
const {
  ROLES,
  SUBSCRIPTION_STATUSES,
  PLANS,
  PLAN_SEATS,
  PLAN_TO_ROLE,
  CYCLES,
  DURATION_DAYS,
  GRACE_DAYS,
  PLAN_PRICES,
  isValidPlan,
  isValidCycle
} = require('../constants/roles');

const HISTORY_COLLECTION = 'subscription_history';

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));
const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};
const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
};

const EMPTY_GRACE = Object.freeze({
  used: false,
  startedAt: null,
  endsAt: null,
  triggeredBy: null
});

class SubscriptionService {
  constructor(database) {
    if (!database) throw new Error('SubscriptionService requires a database');
    this.db = database;
    this.users = database.collection('users');
    this.history = database.collection(HISTORY_COLLECTION);
  }

  async ensureIndexes() {
    await this.users.createIndex({ 'subscription.status': 1, 'subscription.endsAt': 1 });
    await this.users.createIndex({ 'subscription.gracePeriod.endsAt': 1 });
    await this.users.createIndex({ parentSuperUserId: 1 });
    await this.history.createIndex({ userId: 1, startedAt: -1 });
  }

  // -------------------------------------------------------- read helpers ----

  async getUser(userId) {
    return this.users.findOne({ _id: toObjectId(userId) });
  }

  /** True iff grace exists, was granted, and hasn't yet expired. */
  isInGrace(user) {
    const g = user?.subscription?.gracePeriod;
    if (!g || !g.endsAt) return false;
    return new Date(g.endsAt) > new Date();
  }

  /**
   * Resolve a user's effective subscription state (handles sub_seat → parent).
   * Returns { status, source, endsAt, plan, cycle, graceEndsAt, graceUsed }.
   */
  async effectiveStatus(user) {
    if (!user) return { status: null, source: 'self' };
    if (user.role === ROLES.ADMIN) {
      return { status: SUBSCRIPTION_STATUSES.ACTIVE, source: 'self', endsAt: null, plan: null, cycle: null, graceEndsAt: null, graceUsed: false };
    }
    if (user.role === ROLES.SUB_SEAT && user.parentSuperUserId) {
      const parent = await this.getUser(user.parentSuperUserId);
      if (!parent) return { status: SUBSCRIPTION_STATUSES.SUSPENDED, source: 'parent', endsAt: null, plan: null, cycle: null, graceEndsAt: null, graceUsed: false };
      return this._project(parent, 'parent');
    }
    return this._project(user, 'self');
  }

  _project(user, source) {
    const sub = user.subscription || {};
    const grace = sub.gracePeriod || EMPTY_GRACE;
    return {
      status: sub.status || SUBSCRIPTION_STATUSES.SUSPENDED,
      source,
      endsAt: sub.endsAt || null,
      plan:   sub.plan   || null,
      cycle:  sub.cycle  || null,
      graceEndsAt: grace.endsAt || null,
      graceUsed:   !!grace.used
    };
  }

  /**
   * Single rule: access is granted iff trial/active is unexpired OR grace is active.
   * Used by subscriptionGuard and by the frontend banner.
   */
  async hasFeatureAccess(user) {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;

    const resolved = user.role === ROLES.SUB_SEAT
      ? await this.getUser(user.parentSuperUserId)
      : user;
    if (!resolved) return false;

    const sub = resolved.subscription || {};
    const now = new Date();
    const inTrial  = sub.status === SUBSCRIPTION_STATUSES.TRIAL  && sub.endsAt && new Date(sub.endsAt) > now;
    const inActive = sub.status === SUBSCRIPTION_STATUSES.ACTIVE && sub.endsAt && new Date(sub.endsAt) > now;
    const inGrace  = this.isInGrace(resolved);
    return inTrial || inActive || inGrace;
  }

  // -------------------------------------------------------- state transitions ----

  /**
   * Start a trial. Idempotent: no-op if already initialized.
   */
  async startTrial(userId) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    if (user.subscription?.status) return user;

    const now = new Date();
    const endsAt = addDays(now, DURATION_DAYS.trial);
    const subscription = {
      plan: null,
      cycle: CYCLES.TRIAL,
      status: SUBSCRIPTION_STATUSES.TRIAL,
      startedAt: now,
      endsAt,
      durationDays: DURATION_DAYS.trial,
      autoRenew: false,
      amountEur: 0,
      invoiceNumber: null,
      approvedBy: null,
      approvedAt: null,
      remindersSent: [],
      notes: null,
      requestedAt: null,
      requestedPlan: null,
      requestedCycle: null,
      gracePeriod: { ...EMPTY_GRACE }
    };
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: { subscription, updatedAt: now } }
    );
    return { ...user, subscription };
  }

  /**
   * Atomically grant the one-time grace period. Returns true only if grace
   * was actually granted on THIS call (race-safe via $eq: false guard).
   */
  async grantGracePeriod(userId, { triggeredBy } = {}) {
    const now = new Date();
    const endsAt = addDays(now, GRACE_DAYS);
    const r = await this.users.updateOne(
      {
        _id: toObjectId(userId),
        $or: [
          { 'subscription.gracePeriod': { $exists: false } },
          { 'subscription.gracePeriod.used': false },
          { 'subscription.gracePeriod.used': { $exists: false } }
        ]
      },
      {
        $set: {
          'subscription.gracePeriod': {
            used: true,
            startedAt: now,
            endsAt,
            triggeredBy: triggeredBy || null
          },
          updatedAt: now
        }
      }
    );
    return r.modifiedCount > 0 ? { grantedAt: now, endsAt } : null;
  }

  /**
   * User requests a paid plan (Subscribe path or Email-Invoice path).
   * - During trial → pending_approval, NO grace (trial still grants access).
   * - Post-trial   → pending_approval + auto-grant grace (if not yet used).
   *
   * triggeredBy values: 'subscribe' | 'invoice' | 'modal'
   */
  async requestApproval(userId, { plan, cycle, triggeredBy = 'subscribe', billingEmail = null }) {
    if (!isValidPlan(plan))  throw new Error(`Invalid plan: ${plan}`);
    if (!isValidCycle(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const update = {
      'subscription.status': SUBSCRIPTION_STATUSES.PENDING_APPROVAL,
      'subscription.requestedAt': now,
      'subscription.requestedPlan': plan,
      'subscription.requestedCycle': cycle,
      'subscription.requestedTriggeredBy': triggeredBy,
      'subscription.billingEmail': billingEmail,
      updatedAt: now
    };
    if (!user.subscription) {
      update['subscription'] = {
        plan: null, cycle: null,
        status: SUBSCRIPTION_STATUSES.PENDING_APPROVAL,
        startedAt: null, endsAt: null, durationDays: null,
        autoRenew: false, amountEur: 0,
        invoiceNumber: null, approvedBy: null, approvedAt: null,
        remindersSent: [], notes: null,
        requestedAt: now, requestedPlan: plan, requestedCycle: cycle,
        requestedTriggeredBy: triggeredBy, billingEmail,
        gracePeriod: { ...EMPTY_GRACE }
      };
      // Wipe the field-path keys to avoid collision
      delete update['subscription.status'];
      delete update['subscription.requestedAt'];
      delete update['subscription.requestedPlan'];
      delete update['subscription.requestedCycle'];
      delete update['subscription.requestedTriggeredBy'];
      delete update['subscription.billingEmail'];
    }
    await this.users.updateOne({ _id: toObjectId(userId) }, { $set: update });

    // If user is past trial endsAt and grace not yet used → grant it.
    const trialExpired = user.subscription?.status === SUBSCRIPTION_STATUSES.TRIAL &&
                         user.subscription?.endsAt && new Date(user.subscription.endsAt) <= now;
    const noActiveSub  = !user.subscription?.endsAt || new Date(user.subscription.endsAt) <= now;
    const graceUnused  = !user.subscription?.gracePeriod?.used;

    let graceGranted = null;
    if ((trialExpired || (user.subscription?.status === SUBSCRIPTION_STATUSES.SUSPENDED)) && noActiveSub && graceUnused) {
      graceGranted = await this.grantGracePeriod(userId, { triggeredBy });
    }

    return { user: await this.getUser(userId), graceGranted };
  }

  /**
   * Same as requestApproval but with a different audit triggeredBy default.
   * Backend behavior identical; the difference is messaging at the email layer.
   */
  async requestInvoice(userId, { plan, cycle, billingEmail }) {
    return this.requestApproval(userId, { plan, cycle, billingEmail, triggeredBy: 'invoice' });
  }

  /**
   * Admin approves a pending subscription. Activates immediately.
   * Sets role from PLAN_TO_ROLE; sets seatLimit from PLAN_SEATS.
   * If this is an UPGRADE on an already-active subscription, preserves endsAt;
   * otherwise endsAt = approvalDate + duration.
   */
  async approve(userId, { plan, cycle, invoiceNumber, approvedBy, practiceAreas, cities, notes }) {
    if (!isValidPlan(plan))   throw new Error(`Invalid plan: ${plan}`);
    if (!isValidCycle(cycle)) throw new Error(`Invalid cycle: ${cycle}`);

    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const durationDays = DURATION_DAYS[cycle];
    const newRole      = PLAN_TO_ROLE[plan];
    const newSeatLimit = PLAN_SEATS[plan];
    const amountEur    = PLAN_PRICES[plan]?.[cycle] ?? 0;

    // Upgrade case: user is currently active on the same role (admin → admin upgrade).
    // Preserve endsAt; just bump plan + seatLimit + amount.
    const isUpgrade =
      user.subscription?.status === SUBSCRIPTION_STATUSES.ACTIVE &&
      user.subscription?.endsAt && new Date(user.subscription.endsAt) > now &&
      newRole === ROLES.ADMIN_USER &&
      (user.role === ROLES.ADMIN_USER);

    const endsAt = isUpgrade ? user.subscription.endsAt : addDays(now, durationDays);

    const subscription = {
      plan, cycle,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      startedAt: isUpgrade ? user.subscription.startedAt : now,
      endsAt,
      durationDays: isUpgrade ? user.subscription.durationDays : durationDays,
      autoRenew: false,
      amountEur,
      invoiceNumber: invoiceNumber || null,
      approvedBy: approvedBy ? toObjectId(approvedBy) : null,
      approvedAt: now,
      remindersSent: isUpgrade ? (user.subscription.remindersSent || []) : [],
      notes: notes || null,
      requestedAt: user.subscription?.requestedAt || null,
      requestedPlan: null,
      requestedCycle: null,
      requestedTriggeredBy: null,
      billingEmail: user.subscription?.billingEmail || null,
      // Grace history is preserved across renewals and upgrades — never reset.
      gracePeriod: user.subscription?.gracePeriod || { ...EMPTY_GRACE }
    };

    const userUpdate = {
      role: newRole,
      subscription,
      updatedAt: now
    };

    // Admin-user role → ensure superUser sub-doc with the plan's seat limit.
    if (newRole === ROLES.ADMIN_USER) {
      userUpdate.superUser = {
        ...(user.superUser || {}),
        seatLimit: newSeatLimit,
        practiceAreas: Array.isArray(practiceAreas) ? practiceAreas : (user.superUser?.practiceAreas || []),
        cities:        Array.isArray(cities)        ? cities        : (user.superUser?.cities        || []),
        topicsSlotsPerQuarter: user.superUser?.topicsSlotsPerQuarter ?? 2,
        blogPostsPerMonth:     user.superUser?.blogPostsPerMonth     ?? 1,
        lastAssignedAt:        user.superUser?.lastAssignedAt        ?? null
      };
    }

    await this.users.updateOne({ _id: toObjectId(userId) }, { $set: userUpdate });

    // Always log to history (both new periods and upgrades).
    await this.history.insertOne({
      userId: toObjectId(userId),
      plan, cycle, durationDays,
      amountEur,
      startedAt: now,
      endsAt,
      approvedBy: approvedBy ? toObjectId(approvedBy) : null,
      approvedAt: now,
      invoiceNumber: invoiceNumber || null,
      paidVia: 'bank_transfer',
      status: isUpgrade ? 'upgrade' : 'active',
      notes: notes || null
    });

    return this.getUser(userId);
  }

  async reject(userId, { reason }) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    const now = new Date();
    const stillInTrial = user.subscription?.cycle === CYCLES.TRIAL &&
                         user.subscription?.endsAt && new Date(user.subscription.endsAt) > now;
    const newStatus = stillInTrial ? SUBSCRIPTION_STATUSES.TRIAL : SUBSCRIPTION_STATUSES.SUSPENDED;
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: {
        'subscription.status': newStatus,
        'subscription.requestedAt': null,
        'subscription.requestedPlan': null,
        'subscription.requestedCycle': null,
        'subscription.requestedTriggeredBy': null,
        'subscription.notes': reason ? `[rejected] ${reason}` : null,
        updatedAt: now
      } }
    );
    return this.getUser(userId);
  }

  async suspend(userId, { reason } = {}) {
    const now = new Date();
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: {
        'subscription.status': SUBSCRIPTION_STATUSES.SUSPENDED,
        updatedAt: now,
        ...(reason ? { 'subscription.notes': reason } : {})
      } }
    );
    await this.history.updateMany(
      { userId: toObjectId(userId), status: 'active' },
      { $set: { status: 'expired', endsAt: now } }
    );
    return { affectedSubSeats: 0 };
  }

  async extend(userId, days) {
    if (typeof days !== 'number' || days <= 0) throw new Error('Invalid days');
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    if (!user.subscription) throw new Error('User has no subscription');
    const base = user.subscription.endsAt && new Date(user.subscription.endsAt) > new Date()
      ? new Date(user.subscription.endsAt) : new Date();
    const endsAt = addDays(base, days);
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: { 'subscription.endsAt': endsAt, 'subscription.status': SUBSCRIPTION_STATUSES.ACTIVE, updatedAt: new Date() } }
    );
    return this.getUser(userId);
  }

  async cancel(userId) {
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $set: { 'subscription.status': SUBSCRIPTION_STATUSES.CANCELLED, updatedAt: new Date() } }
    );
    return this.getUser(userId);
  }

  // -------------------------------------------------------- reminder logic ----

  computeDueReminder(user) {
    if (!user || !user.subscription || !user.subscription.endsAt) return null;
    const status = user.subscription.status;
    if (![SUBSCRIPTION_STATUSES.TRIAL, SUBSCRIPTION_STATUSES.ACTIVE].includes(status)) return null;

    const days = daysUntil(user.subscription.endsAt);
    const sentTypes = new Set((user.subscription.remindersSent || []).map(r => r.type));

    if (status === SUBSCRIPTION_STATUSES.TRIAL) {
      if (days <= 2 && days > 0  && !sentTypes.has('trial-2d'))      return { type: 'trial-2d', daysRemaining: days };
      if (days <= 0              && !sentTypes.has('trial-expired')) return { type: 'trial-expired', daysRemaining: 0 };
    } else {
      if (days <= 14 && days > 3 && !sentTypes.has('paid-14d'))      return { type: 'paid-14d', daysRemaining: days };
      if (days <= 3  && days > 0 && !sentTypes.has('paid-3d'))       return { type: 'paid-3d',  daysRemaining: days };
      if (days <= 0              && !sentTypes.has('paid-expired'))  return { type: 'paid-expired', daysRemaining: 0 };
    }
    return null;
  }

  /** Returns expiring-grace candidates whose graceEndsAt is past. */
  async listExpiredGrace() {
    return this.users.find({
      'subscription.gracePeriod.used': true,
      'subscription.gracePeriod.endsAt': { $lte: new Date() },
      'subscription.status': SUBSCRIPTION_STATUSES.PENDING_APPROVAL
    }).toArray();
  }

  async markReminderSent(userId, type) {
    await this.users.updateOne(
      { _id: toObjectId(userId) },
      { $push: { 'subscription.remindersSent': { at: new Date(), type } } }
    );
  }

  async listUpcomingExpiries({ withinDays = 30 } = {}) {
    const upper = addDays(new Date(), withinDays);
    return this.users.find({
      'subscription.status': { $in: [SUBSCRIPTION_STATUSES.TRIAL, SUBSCRIPTION_STATUSES.ACTIVE] },
      'subscription.endsAt': { $ne: null, $lte: upper }
    }).toArray();
  }

  async listPendingApprovals() {
    return this.users.find({
      'subscription.status': SUBSCRIPTION_STATUSES.PENDING_APPROVAL
    }).sort({ 'subscription.requestedAt': 1 }).toArray();
  }
}

module.exports = SubscriptionService;
module.exports.HISTORY_COLLECTION = HISTORY_COLLECTION;
module.exports.daysUntil = daysUntil;
module.exports.addDays = addDays;
