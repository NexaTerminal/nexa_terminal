/**
 * Leads Controller — inbound webhook + admin queue + manual assignment.
 *
 * Slice 4: manual assignment only. Auto-routing arrives in Slice 5.
 *
 * Email + Socket.io are best-effort: failures log and continue.
 */

const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { ROLES, PRACTICE_AREAS } = require('../constants/roles');

const inboundSchema = Joi.object({
  sourceSite:   Joi.string().valid('samodaprasham','immigration','macedoniancitizenship','company','iplaw','topics','nexa').required(),
  practiceArea: Joi.string().required(),
  city:         Joi.string().allow('', null),
  language:     Joi.string().valid('mk', 'en').default('mk'),
  payload:      Joi.object({
    name:    Joi.string().allow('', null),
    email:   Joi.string().email().allow('', null),
    phone:   Joi.string().allow('', null),
    subject: Joi.string().allow('', null),
    message: Joi.string().allow('', null),
    consent: Joi.boolean().truthy().required()
  }).unknown(true).required()
}).unknown(true);

const assignSchema = Joi.object({
  superUserId: Joi.string().required()
});

const offerSchema = Joi.object({
  superUserIds: Joi.array().items(Joi.string()).min(1).max(20).required()
});

const noteSchema = Joi.object({
  status: Joi.string().valid('new','assigned','contacted','won','lost','expired').optional(),
  note:   Joi.string().max(2000).optional()
});

class LeadsController {
  constructor({ leadsService, usersCollection, io, emailService, leadRoutingService }) {
    this.leadsService = leadsService;
    this.users = usersCollection;
    this.io = io || null;
    this.emailService = emailService;
    this.leadRoutingService = leadRoutingService || null;
  }

  // ---------------- inbound webhook ---------------- //

  /** POST /api/leads/inbound — HMAC-verified by middleware before reaching here. */
  async inbound(req, res) {
    try {
      const { error, value } = inboundSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      const lead = await this.leadsService.insert(value);

      // Emit to admin dashboard
      this._emit('lead:new', this._projectLead(lead));

      // Slice 5: auto-routing hook (no-op until leadRoutingService is wired).
      if (this.leadRoutingService) {
        try {
          const assigned = await this.leadRoutingService.tryAutoAssign(lead);
          if (!assigned) this._emit('lead:unassigned', this._projectLead(lead));
        } catch (e) {
          console.error('[leads.inbound] auto-route failed:', e.message);
        }
      }

      // 202 Accepted — assignment can happen out of band.
      return res.status(202).json({ success: true, leadId: lead._id });
    } catch (err) {
      console.error('[leads.inbound] error:', err);
      return res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // ---------------- admin queue ---------------- //

  /** GET /api/admin/leads?status=&practiceArea=&sourceSite=&page= */
  async listAdmin(req, res) {
    try {
      const { status, practiceArea, sourceSite, page = 1, pageSize = 25 } = req.query;
      const result = await this.leadsService.listByQuery(
        { status, practiceArea, sourceSite },
        { page: parseInt(page), pageSize: parseInt(pageSize) }
      );
      res.json({
        success: true,
        items: result.items.map(l => this._projectLead(l)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      });
    } catch (err) {
      console.error('[admin/leads list] error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** GET /api/admin/leads/:id */
  async getOneAdmin(req, res) {
    try {
      const lead = await this.leadsService.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, lead });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** POST /api/admin/leads/:id/assign  body: { superUserId } */
  async assignAdmin(req, res) {
    try {
      const { error, value } = assignSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      const targetUser = await this.users.findOne({ _id: new ObjectId(value.superUserId) });
      if (!targetUser) return res.status(400).json({ success: false, message: 'Target user not found' });
      if (targetUser.role !== ROLES.ADMIN_USER) {
        return res.status(400).json({ success: false, message: 'Target user is not an admin_user' });
      }

      const updated = await this.leadsService.updateById(req.params.id, {
        assignedSuperUserId: targetUser._id,
        assignedAt: new Date(),
        status: 'assigned'
      });
      if (!updated) return res.status(404).json({ success: false, message: 'Lead not found' });

      // Stamp the assignee's lastAssignedAt for round-robin fairness (Slice 5 will use this).
      await this.users.updateOne(
        { _id: targetUser._id },
        { $set: { 'superUser.lastAssignedAt': new Date() } }
      );

      // Best-effort email + in-app notification
      this._notifyAssignee(targetUser, updated).catch(e => console.error('notify failed:', e.message));
      this._emit('lead:assigned', this._projectLead(updated), `user_${targetUser._id}`);

      res.json({ success: true, lead: this._projectLead(updated) });
    } catch (err) {
      console.error('[admin/leads assign] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/leads/:id/offer — body: { superUserIds: [...] }
   * Posts the lead to a claim pool. First SU to claim wins.
   */
  async offerAdmin(req, res) {
    try {
      const { error, value } = offerSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      // Verify all targets are active admin_users
      const oids = value.superUserIds.map(id => new ObjectId(id));
      const candidates = await this.users.find({
        _id: { $in: oids },
        role: ROLES.ADMIN_USER,
        'subscription.status': { $in: ['active', 'trial'] }
      }).toArray();
      if (candidates.length === 0) {
        return res.status(400).json({ success: false, message: 'No eligible admin_users in the list' });
      }

      const lead = await this.leadsService.offer(req.params.id, candidates.map(c => c._id));

      // Notify each candidate (best-effort)
      for (const su of candidates) {
        this._notifyOffered(su, lead).catch(e => console.error('offer email failed:', e.message));
        this._emit('lead:offered', this._projectLead(lead), `user_${su._id}`);
      }

      res.json({ success: true, lead: this._projectLead(lead), offeredTo: candidates.length });
    } catch (err) {
      console.error('[admin/leads offer] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** POST /api/admin/leads/:id/dismiss — admin dismisses a junk/spam lead. */
  async dismissAdmin(req, res) {
    try {
      const updated = await this.leadsService.updateById(req.params.id, { status: 'dismissed' });
      if (!updated) return res.status(404).json({ success: false, message: 'Lead not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin-user/leads/:id/claim — admin_user claims an offered lead.
   * Atomic. Returns 409 if another SU already claimed it.
   */
  async claimMine(req, res) {
    try {
      const lead = await this.leadsService.claim(req.params.id, req.user._id);
      if (!lead) {
        return res.status(409).json({ success: false, code: 'ALREADY_CLAIMED', message: 'Лидот веќе го зеде друг член.' });
      }
      // Notify other offered SUs that the lead is gone
      for (const otherId of (lead.offeredTo || [])) {
        if (String(otherId) !== String(req.user._id)) {
          this._emit('lead:claimed-by-other', { leadId: lead._id }, `user_${otherId}`);
        }
      }
      // Stamp the assignee's lastAssignedAt for round-robin fairness.
      await this.users.updateOne(
        { _id: req.user._id },
        { $set: { 'superUser.lastAssignedAt': new Date() } }
      );
      res.json({ success: true, lead: this._projectLead(lead) });
    } catch (err) {
      console.error('[admin-user/leads claim] error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /** GET /api/admin-user/leads/available — leads currently offered to this user. */
  async listAvailableMine(req, res) {
    try {
      const { page = 1, pageSize = 25 } = req.query;
      const result = await this.leadsService.listAvailableFor(req.user._id, {
        page: parseInt(page), pageSize: parseInt(pageSize)
      });
      res.json({
        success: true,
        items: result.items.map(l => this._projectLead(l)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** GET /api/admin/leads/candidates?practiceArea=&city= — list admin_users matching */
  async listCandidates(req, res) {
    try {
      const { practiceArea, city } = req.query;
      const q = { role: ROLES.ADMIN_USER, 'subscription.status': 'active' };
      if (practiceArea) q['superUser.practiceAreas'] = practiceArea;
      const items = await this.users.find(q, {
        projection: { _id: 1, email: 1, fullName: 1, username: 1, 'superUser.practiceAreas': 1, 'superUser.cities': 1, 'superUser.lastAssignedAt': 1 }
      }).limit(50).toArray();
      // city filter is best-effort in-memory: empty cities array = any-city candidate
      const filtered = city ? items.filter(u =>
        !u.superUser?.cities?.length || u.superUser.cities.includes(city)
      ) : items;
      res.json({ success: true, candidates: filtered });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ---------------- admin-user (assignee) ---------------- //

  /** GET /api/admin-user/leads — list leads assigned to current admin_user */
  async listMine(req, res) {
    try {
      const { status, page = 1, pageSize = 25 } = req.query;
      const result = await this.leadsService.listByQuery(
        { status, assignedSuperUserId: req.user._id },
        { page: parseInt(page), pageSize: parseInt(pageSize) }
      );
      res.json({
        success: true,
        items: result.items.map(this._projectLead),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /** PATCH /api/admin-user/leads/:id  body: { status?, note? } */
  async updateMine(req, res) {
    try {
      const { error, value } = noteSchema.validate(req.body);
      if (error) return res.status(400).json({ success: false, message: error.message });

      const lead = await this.leadsService.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
      if (String(lead.assignedSuperUserId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Not your lead' });
      }

      const patch = {};
      if (value.status) patch.status = value.status;
      let updated = lead;
      if (Object.keys(patch).length > 0) {
        updated = await this.leadsService.updateById(lead._id, patch);
      }
      if (value.note) {
        await this.leadsService.appendNote(lead._id, { by: req.user._id, text: value.note });
        updated = await this.leadsService.findById(lead._id);
      }
      res.json({ success: true, lead: this._projectLead(updated) });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ---------------- helpers ---------------- //

  async _notifyOffered(candidate, lead) {
    if (!this.emailService || !candidate.email) return;
    const subject = `Нов лид е достапен — ${lead.practiceArea}`;
    const payload = lead.payload || {};
    const html = `
<p>Нов лид е достапен за земање. Прв што ќе го земе — го добива.</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0;">
  <tr><td><strong>Извор:</strong></td><td>${lead.sourceSite}</td></tr>
  <tr><td><strong>Област:</strong></td><td>${lead.practiceArea}</td></tr>
  <tr><td><strong>Град:</strong></td><td>${lead.city || '—'}</td></tr>
  <tr><td colspan="2"><strong>Кратка порака:</strong><br/>${(payload.message || '').replace(/\n/g, '<br/>').slice(0, 280)}${(payload.message || '').length > 280 ? '…' : ''}</td></tr>
</table>
<p><a href="${process.env.PORTAL_URL || 'https://nexa.mk'}/terminal/admin-user/leads?tab=available">Отвори ги достапните лиди во терминалот →</a></p>
<p style="font-size:12px;color:#6B7280;">Пораката е испратена до повеќе членови. Кој прв ќе ја земе, го добива клиентот.</p>`;
    await this.emailService.sendEmail(candidate.email, subject, html);
  }

  async _notifyAssignee(assignee, lead) {
    if (!this.emailService || !assignee.email) return;
    const lang = assignee.language || 'mk';
    const subject = lang === 'mk'
      ? `Нов клиент е насочен до вас — ${lead.practiceArea}`
      : `New lead assigned to you — ${lead.practiceArea}`;
    const payload = lead.payload || {};
    const html = `
<p>${lang === 'mk' ? 'Добивте нов клиент.' : 'You have a new lead.'}</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0;">
  <tr><td><strong>${lang === 'mk' ? 'Извор' : 'Source'}:</strong></td><td>${lead.sourceSite}</td></tr>
  <tr><td><strong>${lang === 'mk' ? 'Област' : 'Practice area'}:</strong></td><td>${lead.practiceArea}</td></tr>
  <tr><td><strong>${lang === 'mk' ? 'Град' : 'City'}:</strong></td><td>${lead.city || '—'}</td></tr>
  <tr><td><strong>${lang === 'mk' ? 'Име' : 'Name'}:</strong></td><td>${payload.name || '—'}</td></tr>
  <tr><td><strong>${lang === 'mk' ? 'Е-пошта' : 'Email'}:</strong></td><td>${payload.email || '—'}</td></tr>
  <tr><td><strong>${lang === 'mk' ? 'Телефон' : 'Phone'}:</strong></td><td>${payload.phone || '—'}</td></tr>
  <tr><td colspan="2"><strong>${lang === 'mk' ? 'Порака' : 'Message'}:</strong><br/>${(payload.message || '').replace(/\n/g, '<br/>')}</td></tr>
</table>
<p>${lang === 'mk' ? 'Контактирајте го клиентот директно.' : 'Contact the lead directly.'}</p>`;
    await this.emailService.sendEmail(assignee.email, subject, html);
  }

  _emit(event, data, room) {
    if (!this.io) return;
    try {
      if (room) this.io.to(room).emit(event, data);
      else this.io.emit(event, data);
    } catch (e) {
      console.error('[leads.emit] failed:', e.message);
    }
  }

  _projectLead(lead) {
    if (!lead) return null;
    return {
      _id: lead._id,
      sourceSite: lead.sourceSite,
      practiceArea: lead.practiceArea,
      city: lead.city,
      language: lead.language,
      status: lead.status,
      assignedSuperUserId: lead.assignedSuperUserId,
      assignedAt: lead.assignedAt,
      offeredTo: lead.offeredTo || [],
      offeredAt: lead.offeredAt || null,
      claimedBy: lead.claimedBy || null,
      claimedAt: lead.claimedAt || null,
      receivedAt: lead.receivedAt,
      notes: lead.notes,
      payload: lead.payload
    };
  }
}

module.exports = LeadsController;
