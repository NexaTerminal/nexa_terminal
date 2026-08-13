/**
 * Admin-User Controller — endpoints for an admin_user managing their sub-seats.
 * Mounted under `/api/admin-user/...` and gated by `requireAdminUser`.
 *
 * (Lead inbox, dashboard summary, and topics/blog endpoints come in later slices.)
 */

const Joi = require('joi');
const subscriptionEmails = require('../emails/subscriptionEmails');
const { seatLimitFor } = require('../services/subSeatService');
const { PRACTICE_AREAS, capForArea } = require('../constants/roles');
const providerCapService = require('../services/providerCapService');

// De-merge Phase 4 — a Pro provider edits which practice areas + cities they
// want leads for. Areas must be from the enum; caps are enforced server-side.
const providerProfileSchema = Joi.object({
  practiceAreas: Joi.array().items(Joi.string().valid(...PRACTICE_AREAS)).max(PRACTICE_AREAS.length).default([]),
  cities: Joi.array().items(Joi.string().trim().max(60)).max(30).default([])
}).unknown(false);

// Language field intentionally absent — invite emails are always Macedonian.
// `companyMode` is no longer chosen by the caller — the seat type (co-worker vs
// client) is DERIVED from the inviter's tier in SubSeatService. Any companyMode
// in the body is accepted-but-ignored for backward compatibility.
const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().trim().max(120).allow('', null),
  companyMode: Joi.string().valid('shared', 'independent').optional()
}).unknown(false);   // unknown fields rejected — keeps the surface clean

class AdminUserController {
  constructor({ subSeatService, emailService, auditLoggingService, leadsService, usersCollection }) {
    this.subSeatService = subSeatService;
    this.emailService = emailService;
    this.auditLoggingService = auditLoggingService;
    this.leadsService = leadsService || null;
    this.users = usersCollection || null;
  }

  /** GET /api/admin-user/me — summary tile data for the dashboard. */
  async getSummary(req, res) {
    try {
      const u = req.user;
      const summary = {
        user: {
          _id: u._id,
          email: u.email,
          fullName: u.fullName || u.username,
          companyName: u.companyInfo?.companyName || null
        },
        subscription: u.subscription || null,
        superUser: u.superUser || null,
        seats: { used: 0, limit: seatLimitFor(u) },
        leads: { open: 0, contacted: 0, won: 0 }
      };
      if (this.subSeatService) {
        summary.seats.used = await this.subSeatService.countActiveForParent(u._id);
      }
      if (this.leadsService) {
        const open = await this.leadsService.col.countDocuments({
          assignedSuperUserId: u._id, status: { $in: ['assigned', 'new'] }
        });
        const contacted = await this.leadsService.col.countDocuments({
          assignedSuperUserId: u._id, status: 'contacted'
        });
        const won = await this.leadsService.col.countDocuments({
          assignedSuperUserId: u._id, status: 'won'
        });
        const available = await this.leadsService.col.countDocuments({
          status: 'offered', offeredTo: u._id
        });
        summary.leads = { open, contacted, won, available };
      }
      res.json({ success: true, summary });
    } catch (err) {
      console.error('[admin-user/me] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** GET /api/admin-user/seats */
  async listSeats(req, res) {
    try {
      const seats = await this.subSeatService.listForParent(req.user._id);
      const limit = seatLimitFor(req.user);
      const used = seats.filter(s => s.isActive !== false).length;
      const seatType = req.user.role === 'admin_user' ? 'client' : 'coworker';
      res.json({ success: true, seats, limit, used, seatType });
    } catch (err) {
      console.error('[admin-user/seats list] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** POST /api/admin-user/seats  body: { email, fullName, language } */
  async inviteSeat(req, res) {
    try {
      const { error, value } = inviteSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      // A locked / suspended owner cannot provision seats — needs active access.
      const subSvc = req.app.locals.subscriptionService;
      if (subSvc && req.user.role !== 'admin') {
        const hasAccess = await subSvc.hasFeatureAccess(req.user);
        if (!hasAccess) {
          return res.status(402).json({
            success: false, code: 'SUBSCRIPTION_REQUIRED',
            message: 'Активирајте го пристапот за да поканите под-корисници.'
          });
        }
      }

      const { user, tempPassword } = await this.subSeatService.invite(req.user, {
        email: value.email,
        fullName: value.fullName
      });

      // Send invite email — always Macedonian.
      const tpl = subscriptionEmails.subSeatInvite({
        name: value.fullName || value.email,
        parentName: req.user.companyInfo?.companyName || req.user.fullName || req.user.username,
        email: value.email,
        tempPassword
      }, 'mk');

      this.emailService.sendEmail(value.email, tpl.subject, tpl.html)
        .catch(e => console.error('subseat-invite email failed:', e.message));

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'sub_seat.invite',
            targetUserId: user._id, meta: { email: value.email }
          });
        } catch (e) { /* non-critical */ }
      }

      res.status(201).json({
        success: true,
        seat: { _id: user._id, email: user.email, fullName: user.fullName, isActive: user.isActive },
        tempPassword // shown once to the inviter so they can copy
      });
    } catch (err) {
      console.error('[admin-user/seats invite] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** DELETE /api/admin-user/seats/:id */
  async revokeSeat(req, res) {
    try {
      const seat = await this.subSeatService.revoke(req.user._id, req.params.id);
      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'sub_seat.revoke',
            targetUserId: seat._id, meta: {}
          });
        } catch (e) { /* non-critical */ }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** POST /api/admin-user/seats/:id/reset-password */
  async resetSeatPassword(req, res) {
    try {
      const { user, tempPassword } = await this.subSeatService.resetPassword(req.user, req.params.id);

      // Best-effort: send the seat a fresh credentials email.
      try {
        const subscriptionEmails = require('../emails/subscriptionEmails');
        const tpl = subscriptionEmails.subSeatInvite({
          name: user.fullName || user.email,
          parentName: req.user.companyInfo?.companyName || req.user.fullName || req.user.username,
          email: user.email,
          tempPassword
        }, user.language || 'mk');
        await this.emailService.sendEmail(user.email, '[Password reset] ' + tpl.subject, tpl.html);
      } catch (e) { console.error('reset-password email failed:', e.message); }

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'sub_seat.password_reset',
            targetUserId: user._id, meta: {}
          });
        } catch (e) { /* non-critical */ }
      }
      res.json({ success: true, tempPassword });
    } catch (err) {
      console.error('[admin-user/seats reset-password] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** POST /api/admin-user/seats/:id/reactivate */
  async reactivateSeat(req, res) {
    try {
      await this.subSeatService.reactivate(req.user, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin-user/provider-profile
   * Returns the caller's current practice areas + cities, plus per-area cap
   * status (count / cap / full) so the editor can disable full areas the
   * caller doesn't already hold.
   */
  async getProviderProfile(req, res) {
    try {
      const su = req.user.superUser || {};
      const mine = su.practiceAreas || [];
      const areas = [];
      for (const area of PRACTICE_AREAS) {
        // eslint-disable-next-line no-await-in-loop
        const count = this.users
          ? await providerCapService.countActiveProvidersInArea(this.users, area, { excludeUserId: req.user._id })
          : 0;
        const cap = capForArea(area);
        const held = mine.includes(area);
        areas.push({ area, count, cap, held, full: cap > 0 && count >= cap && !held });
      }
      res.json({
        success: true,
        profile: { practiceAreas: mine, cities: su.cities || [] },
        areas
      });
    } catch (err) {
      console.error('[admin-user/provider-profile GET] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/admin-user/provider-profile  body: { practiceAreas[], cities[] }
   * Enforces the founding-cohort cap: an area the caller does NOT already hold
   * cannot be added once it is full. Areas already held may be kept.
   */
  async updateProviderProfile(req, res) {
    try {
      const { error, value } = providerProfileSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      const current = req.user.superUser?.practiceAreas || [];
      const desired = [...new Set(value.practiceAreas)];
      const added = desired.filter((a) => !current.includes(a));

      // Only newly added areas are cap-checked (excluding self, which is moot
      // for added areas but keeps the query consistent).
      const blocked = this.users
        ? await providerCapService.fullAreas(this.users, added, { excludeUserId: req.user._id })
        : [];
      if (blocked.length) {
        return res.status(409).json({
          success: false,
          code: 'AREA_CAP_REACHED',
          message: 'Некои области се пополнети и не можат да се додадат во моментов.',
          areas: blocked
        });
      }

      const cities = [...new Set((value.cities || []).map((c) => c.trim()).filter(Boolean))];
      const nextSuperUser = {
        ...(req.user.superUser || {}),
        practiceAreas: desired,
        cities,
        topicsSlotsPerQuarter: req.user.superUser?.topicsSlotsPerQuarter ?? 2,
        blogPostsPerMonth:     req.user.superUser?.blogPostsPerMonth     ?? 2,
        lastAssignedAt:        req.user.superUser?.lastAssignedAt        ?? null
      };
      if (this.users) {
        await this.users.updateOne({ _id: req.user._id }, { $set: { superUser: nextSuperUser } });
      }

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'provider.profile_updated',
            targetUserId: req.user._id, meta: { practiceAreas: desired, cities }
          });
        } catch (e) { /* non-critical */ }
      }

      res.json({ success: true, profile: { practiceAreas: desired, cities } });
    } catch (err) {
      console.error('[admin-user/provider-profile PUT] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminUserController;
