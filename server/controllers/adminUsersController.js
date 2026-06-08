/**
 * Admin-side user management controller.
 *
 * Scoped to the new "All users" page at /terminal/admin/all-users.
 * Focused on the role/subscription/sub-seat lens — leaves the legacy
 * EnhancedManageUsers controller (adminController.js) untouched.
 *
 * Endpoints (all require isAdmin):
 *   GET    /api/admin/all-users           list with filters
 *   GET    /api/admin/all-users/:id       full detail incl. sub-seats list (if admin_user) / parent (if sub_seat)
 *   POST   /api/admin/all-users/:id/reset-password
 *   POST   /api/admin/all-users/:id/change-role
 */

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Joi = require('joi');
const { ROLES, PLANS, PLAN_SEATS, isValidPlan } = require('../constants/roles');

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));

const generateTempPassword = () => {
  const bytes = crypto.randomBytes(6).toString('hex');
  return `${bytes.slice(0,4)}-${bytes.slice(4,8)}-${bytes.slice(8,12)}`;
};

const projectUser = (u) => ({
  _id: u._id,
  email: u.email || null,
  username: u.username || null,
  fullName: u.fullName || null,
  role: u.role || null,
  isAdmin: u.isAdmin === true,
  isActive: u.isActive !== false,
  mustChangePassword: u.mustChangePassword === true,
  companyInfo: u.companyInfo ? {
    companyName: u.companyInfo.companyName || null
  } : null,
  subscription: u.subscription ? {
    plan: u.subscription.plan,
    cycle: u.subscription.cycle,
    status: u.subscription.status,
    endsAt: u.subscription.endsAt,
    requestedAt: u.subscription.requestedAt,
    requestedPlan: u.subscription.requestedPlan,
    requestedCycle: u.subscription.requestedCycle,
    gracePeriod: u.subscription.gracePeriod || null,
    invoiceNumber: u.subscription.invoiceNumber || null
  } : null,
  superUser: u.superUser ? {
    seatLimit: u.superUser.seatLimit
  } : null,
  parentSuperUserId: u.parentSuperUserId || null,
  createdAt: u.createdAt || null,
  updatedAt: u.updatedAt || null
});

const changeRoleSchema = Joi.object({
  newRole: Joi.string().valid(ROLES.REGULAR, ROLES.STANDARD_USER, ROLES.ADMIN_USER).required(),
  plan:    Joi.string().valid(...Object.values(PLANS)).optional(),  // required when promoting to admin_user
  seatLimit: Joi.number().integer().min(1).max(50).optional()
});

class AdminUsersController {
  constructor({ subscriptionService, emailService, auditLoggingService }) {
    this.subscriptionService = subscriptionService || null;
    this.emailService = emailService || null;
    this.auditLoggingService = auditLoggingService || null;
  }

  // ---------- LIST ----------

  /** GET /api/admin/all-users?q=&role=&status=&page=&pageSize= */
  async list(req, res) {
    try {
      const db = req.app.locals.db || req.app.locals.database;
      const users = db.collection('users');

      const { q, role, status, page = 1, pageSize = 25 } = req.query;
      const query = {};
      if (role)   query.role = role;
      if (status) query['subscription.status'] = status;
      if (q && q.trim().length) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { email: rx }, { username: rx }, { fullName: rx },
          { 'companyInfo.companyName': rx }
        ];
      }

      const skip = Math.max(0, (parseInt(page) - 1) * parseInt(pageSize));
      const [items, total] = await Promise.all([
        users.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(pageSize)).toArray(),
        users.countDocuments(query)
      ]);

      res.json({
        success: true,
        items: items.map(projectUser),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } catch (err) {
      console.error('[admin/all-users list] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** GET /api/admin/all-users/:id — incl. parent (if sub_seat) and sub-seats (if admin_user) */
  async getOne(req, res) {
    try {
      const db = req.app.locals.db || req.app.locals.database;
      const users = db.collection('users');
      const user = await users.findOne({ _id: toObjectId(req.params.id) });
      if (!user) return res.status(404).json({ success: false, message: 'Корисникот не е пронајден' });

      const out = { user: projectUser(user) };

      if (user.role === ROLES.ADMIN_USER) {
        const subSeats = await users.find(
          { parentSuperUserId: user._id, role: ROLES.SUB_SEAT },
          { projection: { password: 0 } }
        ).sort({ createdAt: -1 }).toArray();
        out.subSeats = subSeats.map(projectUser);
      }
      if (user.role === ROLES.SUB_SEAT && user.parentSuperUserId) {
        const parent = await users.findOne({ _id: user.parentSuperUserId }, { projection: { password: 0 } });
        if (parent) out.parent = projectUser(parent);
      }

      res.json({ success: true, ...out });
    } catch (err) {
      console.error('[admin/all-users get] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ---------- PASSWORD RESET ----------

  /** POST /api/admin/all-users/:id/reset-password */
  async resetPassword(req, res) {
    try {
      const db = req.app.locals.db || req.app.locals.database;
      const users = db.collection('users');
      const user = await users.findOne({ _id: toObjectId(req.params.id) });
      if (!user) return res.status(404).json({ success: false, message: 'Корисникот не е пронајден' });

      // Don't allow resetting another admin's password through this route.
      if (user.role === ROLES.ADMIN || user.isAdmin === true) {
        return res.status(403).json({ success: false, message: 'Не може да се ресетира лозинка на админ преку оваа алатка.' });
      }

      const tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(tempPassword, salt);

      await users.updateOne(
        { _id: user._id },
        { $set: { password: hashed, mustChangePassword: true, updatedAt: new Date() } }
      );

      // Best-effort email — fire and forget.
      if (this.emailService && user.email) {
        const subject = 'Нова привремена лозинка за Nexa';
        const html = `
<p>Здраво ${user.fullName || user.username || ''},</p>
<p>Лозинката за вашата Nexa сметка е ресетирана од администраторот. Најавете се со привремената лозинка подолу — ќе биде побарано да поставите своја при првото најавување.</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0;">
  <tr><td><strong>Е-пошта:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${user.email}</td></tr>
  <tr><td><strong>Привремена лозинка:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${tempPassword}</td></tr>
</table>
<p>Ако ова не сте го побарале, пишете ни веднаш на info@nexa.mk.</p>`;
        this.emailService.sendEmail(user.email, subject, html)
          .catch(e => console.error('reset-password email failed:', e.message));
      }

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'user.password_reset',
            targetUserId: user._id, meta: {}
          });
        } catch (e) { /* non-critical */ }
      }

      res.json({ success: true, tempPassword });
    } catch (err) {
      console.error('[admin/all-users reset-password] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ---------- CHANGE ROLE ----------

  /** POST /api/admin/all-users/:id/change-role  body: { newRole, plan?, seatLimit? } */
  async changeRole(req, res) {
    try {
      const { error, value } = changeRoleSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      const db = req.app.locals.db || req.app.locals.database;
      const users = db.collection('users');
      const user = await users.findOne({ _id: toObjectId(req.params.id) });
      if (!user) return res.status(404).json({ success: false, message: 'Корисникот не е пронајден' });

      // Guardrails
      const currentRole = user.role;
      const { newRole, plan, seatLimit } = value;

      if (newRole === currentRole) {
        return res.status(400).json({ success: false, message: 'Корисникот веќе има таа улога.' });
      }
      if (currentRole === ROLES.ADMIN || user.isAdmin === true) {
        return res.status(403).json({ success: false, message: 'Не може да се менува улогата на админ.' });
      }
      if (currentRole === ROLES.SUB_SEAT || newRole === ROLES.SUB_SEAT) {
        return res.status(400).json({ success: false, message: 'Под-седишта се поканат само од admin_user — не може да се менува улогата овде.' });
      }

      // Downgrade admin_user → standard_user: must have zero active sub-seats.
      if (currentRole === ROLES.ADMIN_USER && newRole === ROLES.STANDARD_USER) {
        const activeSeats = await users.countDocuments({
          parentSuperUserId: user._id,
          role: ROLES.SUB_SEAT,
          isActive: { $ne: false }
        });
        if (activeSeats > 0) {
          return res.status(400).json({
            success: false,
            message: `Не може да се деградира — има ${activeSeats} активни под-седишта. Прво отповикајте ги.`
          });
        }
      }

      // Promote → admin_user: require a plan so we can seed seatLimit.
      const updates = { role: newRole, updatedAt: new Date() };
      if (newRole === ROLES.ADMIN_USER) {
        if (!plan || !plan.startsWith('admin')) {
          return res.status(400).json({ success: false, message: 'При промовирање во admin_user, мора да изберете admin план (admin_5 или admin_10).' });
        }
        const resolvedSeats = typeof seatLimit === 'number' ? seatLimit : (PLAN_SEATS[plan] || 5);
        updates.superUser = {
          ...(user.superUser || {}),
          seatLimit: resolvedSeats,
          practiceAreas: user.superUser?.practiceAreas || [],
          cities:        user.superUser?.cities        || [],
          topicsSlotsPerQuarter: user.superUser?.topicsSlotsPerQuarter ?? 2,
          blogPostsPerMonth:     user.superUser?.blogPostsPerMonth     ?? 1,
          lastAssignedAt:        user.superUser?.lastAssignedAt        ?? null
        };
      }

      await users.updateOne({ _id: user._id }, { $set: updates });

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'user.role_change',
            targetUserId: user._id, meta: { from: currentRole, to: newRole, plan: plan || null }
          });
        } catch (e) { /* non-critical */ }
      }

      const updated = await users.findOne({ _id: user._id });
      res.json({ success: true, user: projectUser(updated) });
    } catch (err) {
      console.error('[admin/all-users change-role] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/all-users/:id/activity
   *
   * Aggregates a chronological event timeline for a single user from the
   * collections we already write to (no schema changes / no new writes).
   */
  async getActivity(req, res) {
    try {
      const db = req.app.locals.db || req.app.locals.database;
      const UserActivityService = require('../services/userActivityService');
      const svc = new UserActivityService(db);
      const events = await svc.getActivity(req.params.id, { limit: 200 });
      res.json({ success: true, events });
    } catch (err) {
      console.error('[admin/all-users activity] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/all-users/:id/hard-delete
   *
   * Cascading delete. Requires the admin to confirm by typing the target
   * user's username (or email) in `confirm` — defense against fat-finger
   * mistakes. Platform owners and other admins are not deletable here.
   */
  async hardDelete(req, res) {
    try {
      const db = req.app.locals.db || req.app.locals.database;
      const targetId = req.params.id;
      const { confirm } = req.body || {};

      const target = await db.collection('users').findOne({ _id: toObjectId(targetId) });
      if (!target) {
        return res.status(404).json({ success: false, message: 'Корисникот не е пронајден.' });
      }

      // Confirmation phrase must match username (case-insensitive) OR email.
      const expected = (target.username || target.email || '').toLowerCase();
      const provided = String(confirm || '').trim().toLowerCase();
      if (!expected || provided !== expected) {
        return res.status(400).json({
          success: false,
          code: 'CONFIRM_REQUIRED',
          message: `За потврда, внесете го корисничкото име: "${target.username || target.email}"`
        });
      }

      // Platform owner whitelist check (defensive — service rechecks too).
      try {
        const { isPlatformOwnerEmail } = require('../services/platformOwnerService');
        if (target.email && isPlatformOwnerEmail(target.email)) {
          return res.status(403).json({
            success: false,
            code: 'PLATFORM_OWNER',
            message: 'Не можете да избришете платформа сопственик.'
          });
        }
      } catch (_) { /* service optional */ }

      const UserDeletionService = require('../services/userDeletionService');
      const svc = new UserDeletionService(db);
      const result = await svc.deleteUserCascading(targetId, {
        actingAdminId: req.user?._id
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      const map = {
        NOT_FOUND:            404,
        CANNOT_DELETE_ADMIN:  403,
        CANNOT_DELETE_SELF:   400
      };
      const status = map[err.code] || 500;
      console.error('[admin/all-users hard-delete] error:', err);
      return res.status(status).json({ success: false, code: err.code, message: err.message });
    }
  }
}

module.exports = AdminUsersController;
