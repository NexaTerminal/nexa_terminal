/**
 * Admin-User Controller — endpoints for an admin_user managing their sub-seats.
 * Mounted under `/api/admin-user/...` and gated by `requireAdminUser`.
 *
 * (Lead inbox, dashboard summary, and topics/blog endpoints come in later slices.)
 */

const Joi = require('joi');
const subscriptionEmails = require('../emails/subscriptionEmails');

// Language field intentionally absent — invite emails are always Macedonian.
// Any `language` field in the body is silently dropped to avoid extension/proxy
// interception that reacts to the 'mk' value.
const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().trim().max(120).allow('', null)
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
        seats: { used: 0, limit: u.superUser?.seatLimit ?? 5 },
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
      const limit = req.user.superUser?.seatLimit ?? 5;
      const used = seats.filter(s => s.isActive !== false).length;
      res.json({ success: true, seats, limit, used });
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

      const { user, tempPassword } = await this.subSeatService.invite(req.user, value);

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
}

module.exports = AdminUserController;
