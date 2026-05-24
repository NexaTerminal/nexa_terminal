/**
 * Lead Routing Service — picks an admin_user for an inbound lead.
 *
 * pickAssignee(lead, candidates) is a PURE function and unit-testable
 * without a database. tryAutoAssign(lead) is the database-bound wrapper.
 *
 * Selection rules (NEXA_2.0_CONTEXT.md §6.3, adapted to admin_user role):
 *   1. Filter to candidates where:
 *      - role = admin_user
 *      - subscription.status = 'active'
 *      - superUser.practiceAreas overlap lead.practiceArea (or candidate's
 *        practiceAreas is empty, treated as "any")
 *      - superUser.cities includes lead.city OR cities is empty (any-city)
 *   2. Round-robin: among the filtered candidates, prefer the one with the
 *      OLDEST superUser.lastAssignedAt (null treated as "never" = oldest).
 *   3. Tie-break deterministically on _id.
 */

const { ObjectId } = require('mongodb');
const { ROLES } = require('../constants/roles');

function pickAssignee(lead, candidates) {
  if (!lead || !Array.isArray(candidates) || candidates.length === 0) return null;

  const wantArea = lead.practiceArea;
  const wantCity = (lead.city || '').trim().toLowerCase();

  const matching = candidates.filter((c) => {
    if (!c) return false;
    if (c.role !== ROLES.ADMIN_USER) return false;
    if (c.subscription?.status !== 'active') return false;

    const areas = c.superUser?.practiceAreas || [];
    const cities = (c.superUser?.cities || []).map(s => String(s).toLowerCase());

    const areaOk = !areas.length || areas.includes(wantArea);
    const cityOk = !wantCity || !cities.length || cities.includes(wantCity);
    return areaOk && cityOk;
  });

  if (matching.length === 0) return null;

  matching.sort((a, b) => {
    const aT = a.superUser?.lastAssignedAt ? new Date(a.superUser.lastAssignedAt).getTime() : 0;
    const bT = b.superUser?.lastAssignedAt ? new Date(b.superUser.lastAssignedAt).getTime() : 0;
    if (aT !== bT) return aT - bT;        // oldest first
    return String(a._id).localeCompare(String(b._id)); // deterministic tie-break
  });

  return matching[0];
}

class LeadRoutingService {
  constructor({ leadsService, usersCollection, emailService, io }) {
    if (!leadsService || !usersCollection) {
      throw new Error('LeadRoutingService requires leadsService and usersCollection');
    }
    this.leadsService = leadsService;
    this.users = usersCollection;
    this.emailService = emailService || null;
    this.io = io || null;
  }

  async tryAutoAssign(lead) {
    if (!lead) return null;
    const candidates = await this.users.find({
      role: ROLES.ADMIN_USER,
      'subscription.status': 'active'
    }).toArray();

    const chosen = pickAssignee(lead, candidates);
    if (!chosen) return null;

    const now = new Date();
    const updated = await this.leadsService.updateById(lead._id, {
      assignedSuperUserId: chosen._id,
      assignedAt: now,
      status: 'assigned'
    });
    await this.users.updateOne(
      { _id: chosen._id },
      { $set: { 'superUser.lastAssignedAt': now } }
    );

    // Best-effort email + socket emit
    if (this.emailService && chosen.email) {
      try {
        const lang = chosen.language || 'mk';
        const subject = lang === 'mk'
          ? `Нов клиент е насочен до вас — ${updated.practiceArea}`
          : `New lead assigned to you — ${updated.practiceArea}`;
        const p = updated.payload || {};
        const html = `<p>${lang === 'mk' ? 'Добивте нов клиент.' : 'You have a new lead.'}</p>
<p><strong>${lang === 'mk' ? 'Извор' : 'Source'}:</strong> ${updated.sourceSite}<br/>
<strong>${lang === 'mk' ? 'Област' : 'Practice area'}:</strong> ${updated.practiceArea}<br/>
<strong>${lang === 'mk' ? 'Град' : 'City'}:</strong> ${updated.city || '—'}<br/>
<strong>${lang === 'mk' ? 'Име' : 'Name'}:</strong> ${p.name || '—'}<br/>
<strong>${lang === 'mk' ? 'Е-пошта' : 'Email'}:</strong> ${p.email || '—'}<br/>
<strong>${lang === 'mk' ? 'Телефон' : 'Phone'}:</strong> ${p.phone || '—'}</p>
<p>${(p.message || '').replace(/\n/g, '<br/>')}</p>`;
        await this.emailService.sendEmail(chosen.email, subject, html);
      } catch (e) { console.error('[leadRouting] email failed:', e.message); }
    }

    if (this.io) {
      try { this.io.to(`user_${chosen._id}`).emit('lead:assigned', updated); }
      catch (e) { console.error('[leadRouting] emit failed:', e.message); }
    }

    return updated;
  }

  /** Daily cron: emit lead:stale for leads assigned > 72h without progression. */
  async markStaleLeads() {
    const cutoff = new Date(Date.now() - 72 * 3600 * 1000);
    const stale = await this.leadsService.col.find({
      status: 'assigned',
      assignedAt: { $lt: cutoff }
    }).limit(200).toArray();
    for (const lead of stale) {
      if (this.io) {
        try { this.io.emit('lead:stale', { leadId: lead._id, since: lead.assignedAt }); }
        catch (e) { /* swallow */ }
      }
    }
    return stale.length;
  }
}

module.exports = LeadRoutingService;
module.exports.pickAssignee = pickAssignee;
