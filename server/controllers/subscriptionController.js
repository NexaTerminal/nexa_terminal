/**
 * Subscription Controller — user + admin endpoints.
 *
 * User flows:
 *   GET  /api/subscription/me
 *   POST /api/subscription/request-approval  { plan, cycle }            ← Subscribe CTA
 *   POST /api/subscription/request-invoice   { plan, cycle, billingEmail? } ← Email-Invoice CTA
 *
 * Both POST endpoints share the same backend effect; the difference is the
 * email subject line and `triggeredBy` audit field.
 */

const Joi = require('joi');
const subscriptionEmails = require('../emails/subscriptionEmails');
const { PLANS, isValidPlan } = require('../constants/roles');

const PLAN_VALUES = Object.values(PLANS);

const requestSchema = Joi.object({
  plan:  Joi.string().valid(...PLAN_VALUES).required(),
  cycle: Joi.string().valid('monthly', 'quarterly', 'annual').required(),
  billingEmail: Joi.string().email().allow('', null)
});

const invoiceSchema = Joi.object({
  plan:  Joi.string().valid(...PLAN_VALUES).required(),
  cycle: Joi.string().valid('monthly', 'quarterly', 'annual').required(),
  billingEmail: Joi.string().email().allow('', null)
});

const approveSchema = Joi.object({
  plan:  Joi.string().valid(...PLAN_VALUES).required(),
  cycle: Joi.string().valid('monthly', 'quarterly', 'annual').required(),
  invoiceNumber: Joi.string().trim().max(64).allow('', null),
  practiceAreas: Joi.array().items(Joi.string()).optional(),
  cities: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(500).allow('', null)
});

const rejectSchema = Joi.object({ reason: Joi.string().max(500).allow('', null) });
const extendSchema = Joi.object({ days: Joi.number().integer().min(1).max(365).required() });

class SubscriptionController {
  constructor({ subscriptionService, emailService, auditLoggingService, proInvoicesService }) {
    this.subscriptionService = subscriptionService;
    this.emailService = emailService;
    this.auditLoggingService = auditLoggingService;
    this.proInvoicesService = proInvoicesService || null;
  }

  // ----------------- user-facing ----------------- //

  /** GET /api/subscription/me — includes effective status (handles sub-seat → parent).
   * Backfills the trial for users who predate the subscription system or whose
   * trial wasn't initialized at signup. `startTrial` is idempotent. */
  async getMine(req, res) {
    try {
      const isOwnAccount = req.user.role !== 'admin' && req.user.role !== 'sub_seat';
      const noTrial      = !req.user.subscription?.status;
      let user = req.user;
      if (isOwnAccount && noTrial) {
        try {
          user = await this.subscriptionService.startTrial(req.user._id);
        } catch (e) {
          console.warn('[subscription/me] backfill startTrial failed:', e.message);
        }
      }
      const eff = await this.subscriptionService.effectiveStatus(user);
      res.json({
        success: true,
        subscription: {
          status: eff.status,
          source: eff.source,
          endsAt: eff.endsAt,
          plan: eff.plan,
          cycle: eff.cycle,
          graceEndsAt: eff.graceEndsAt,
          graceUsed:   eff.graceUsed,
          ownSubscription: user.subscription || null
        }
      });
    } catch (err) {
      console.error('[subscription/me] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** POST /api/subscription/request-approval */
  async requestApproval(req, res) {
    return this._handleRequest(req, res, 'subscribe', requestSchema);
  }

  /** POST /api/subscription/request-invoice */
  async requestInvoice(req, res) {
    return this._handleRequest(req, res, 'invoice', invoiceSchema);
  }

  async _handleRequest(req, res, triggeredBy, schema) {
    try {
      const { error, value } = schema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      // If the user account has no email yet (some signups only use username),
      // and the request supplies a billingEmail, save it on the user record
      // so future reminders / invoices can reach them.
      if (value.billingEmail && !req.user.email) {
        try {
          const db = req.app.locals.db || req.app.locals.database;
          await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: { email: value.billingEmail, updatedAt: new Date() } }
          );
        } catch (e) { console.error('persist billingEmail failed:', e.message); }
      }

      const { user: updated, graceGranted } = await this.subscriptionService.requestApproval(req.user._id, {
        plan: value.plan,
        cycle: value.cycle,
        billingEmail: value.billingEmail || null,
        triggeredBy
      });

      const recipientEmail = value.billingEmail || updated.email;
      // Legacy "Инструкции за плаќање" email removed — the pro-invoice email
      // (sent below) already contains the bank details, amount and PDF
      // attachment, so a second message would just duplicate it.

      // Generate & email pro-invoice PDF (skip admin platform users).
      // Don't await — fire-and-log so a PDF/email failure never blocks the
      // subscribe response.
      if (this.proInvoicesService && updated.role !== 'admin' && recipientEmail) {
        this._issueAndEmailProInvoice(updated, value, recipientEmail)
          .catch(e => console.error('pro-invoice generation failed:', e.message));
      }

      const adminTpl = subscriptionEmails.adminApprovalNeeded({
        userEmail: updated.email,
        userName:  updated.fullName || updated.username,
        plan: value.plan,
        cycle: value.cycle
      }, 'mk');
      this.emailService.sendEmail(process.env.ADMIN_EMAIL || 'info@nexa.mk', adminTpl.subject, adminTpl.html)
        .catch(e => console.error('admin notify failed:', e.message));

      res.json({
        success: true,
        subscription: updated.subscription,
        graceGranted: !!graceGranted,
        graceEndsAt: graceGranted?.endsAt || updated.subscription?.gracePeriod?.endsAt || null
      });
    } catch (err) {
      console.error(`[subscription/${triggeredBy}] error:`, err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * Allocate a pro-invoice number, render the PDF, email it with the
   * attachment, and record `emailedAt` on the invoice row.
   * Called fire-and-forget from `_handleRequest`.
   */
  async _issueAndEmailProInvoice(user, requestValue, recipientEmail) {
    const { renderProInvoicePdf } = require('../services/proInvoicePdf');
    const { proInvoiceEmail }      = require('../emails/proInvoiceEmail');

    const invoice = await this.proInvoicesService.createForUser(
      user,
      requestValue.plan,
      requestValue.cycle,
      requestValue.billingEmail || user.email
    );

    const pdfBuffer = await renderProInvoicePdf(invoice);
    const { subject, html } = proInvoiceEmail(invoice);
    const filename = `profaktura-${String(invoice.number).replace(/\//g, '-')}.pdf`;

    const result = await this.emailService.sendEmail(recipientEmail, subject, html, {
      attachments: [{ filename, content: pdfBuffer }]
    });

    if (result?.success) {
      const messageId = result.data?.id || result.data?.messageId || null;
      await this.proInvoicesService.markEmailed(invoice._id, messageId);
    }
    return invoice;
  }

  // ----------------- admin-facing ----------------- //

  async listPending(req, res) {
    try {
      const items = await this.subscriptionService.listPendingApprovals();
      res.json({ success: true, items: items.map(this._projectUser) });
    } catch (err) {
      console.error('[admin/subscriptions/pending] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async listAll(req, res) {
    try {
      const { status, plan, page = 1, pageSize = 50 } = req.query;
      const q = {};
      if (status) q['subscription.status'] = status;
      if (plan)   q['subscription.plan']   = plan;
      const col = this.subscriptionService.users;
      const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
      const [items, total] = await Promise.all([
        col.find(q).sort({ 'subscription.endsAt': 1 }).skip(skip).limit(parseInt(pageSize)).toArray(),
        col.countDocuments(q)
      ]);
      res.json({ success: true, items: items.map(this._projectUser), total, page: parseInt(page) });
    } catch (err) {
      console.error('[admin/subscriptions/list] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async approve(req, res) {
    try {
      const { error, value } = approveSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });
      if (!isValidPlan(value.plan)) return res.status(400).json({ success: false, message: 'Invalid plan' });

      const updated = await this.subscriptionService.approve(req.params.userId, {
        ...value,
        approvedBy: req.user._id
      });

      const tpl = subscriptionEmails.subscriptionApproved({
        name: updated.fullName || updated.username,
        plan: value.plan,
        cycle: value.cycle,
        endsAt: updated.subscription.endsAt,
        invoiceNumber: value.invoiceNumber
      }, updated.language || 'mk');
      this.emailService.sendEmail(updated.email, tpl.subject, tpl.html)
        .catch(e => console.error('approve-email failed:', e.message));

      if (this.auditLoggingService?.log) {
        try {
          await this.auditLoggingService.log({
            actorId: req.user._id, action: 'subscription.approve',
            targetUserId: updated._id, meta: { plan: value.plan, cycle: value.cycle, endsAt: updated.subscription.endsAt }
          });
        } catch (e) { /* non-critical */ }
      }

      res.json({ success: true, user: this._projectUser(updated) });
    } catch (err) {
      console.error('[admin/subscriptions/approve] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async reject(req, res) {
    try {
      const { value } = rejectSchema.validate(req.body || {});
      const updated = await this.subscriptionService.reject(req.params.userId, value || {});
      const tpl = subscriptionEmails.subscriptionRejected(
        { name: updated.fullName || updated.username, reason: value?.reason },
        updated.language || 'mk'
      );
      this.emailService.sendEmail(updated.email, tpl.subject, tpl.html)
        .catch(e => console.error('reject-email failed:', e.message));
      res.json({ success: true, user: this._projectUser(updated) });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async extend(req, res) {
    try {
      const { error, value } = extendSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });
      const updated = await this.subscriptionService.extend(req.params.userId, value.days);
      res.json({ success: true, user: this._projectUser(updated) });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async suspend(req, res) {
    try {
      await this.subscriptionService.suspend(req.params.userId, { reason: req.body?.reason });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  _projectUser(u) {
    if (!u) return null;
    return {
      _id: u._id,
      email: u.email,
      fullName: u.fullName || null,
      username: u.username || null,
      role: u.role,
      subscription: u.subscription || null,
      superUser: u.superUser || null,
      parentSuperUserId: u.parentSuperUserId || null,
      createdAt: u.createdAt || null
    };
  }
}

module.exports = SubscriptionController;
