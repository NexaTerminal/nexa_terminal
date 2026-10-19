// Weekly lead-digest service.
//
// Every Monday (see leadDigestScheduler) this emails the SAME newest 4–5 active
// leads from the Inquiry Board to every active Pro lawyer, as an anonymized
// teaser, to pull them back into the terminal. If there are ≤1 active leads the
// whole run is skipped (no "empty inbox" email).
//
// It sends NO billing/pilot content — it is the only outbound email to Pro
// lawyers under the free-Basic / invite-only-Pro model.

const { leadDigestEmail } = require('../emails/leadDigestEmail');

const INQUIRIES = 'inquiries';
const RUNS = 'lead_digest_runs';          // idempotency ledger (one doc per ISO week)
const MIN_LEADS = 2;                       // skip the run if fewer than this
const MAX_LEADS = 5;

// Active = still needs a lawyer. Excludes fully claimed + closed.
const ACTIVE_STATUSES = ['open', 'interest_received', 'partially_claimed'];

class LeadDigestService {
  constructor(db, emailService) {
    this.db = db;
    this.col = db.collection(INQUIRIES);
    this.runs = db.collection(RUNS);
    this.users = db.collection('users');
    this.emailService = emailService;
    this.portalUrl = (process.env.LEADS_PORTAL_URL || 'https://leads.nexa.mk').replace(/\/+$/, '');
  }

  // ISO-week key like "2026-W42" so a run is sent at most once per week.
  static weekKey(d = new Date()) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = dt.getUTCDay() || 7;        // Mon=1..Sun=7
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((dt - yearStart) / 86400000 + 1) / 7);
    return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  /** Newest active leads, anonymized (no client identity, no full summary). */
  async getActiveLeads(limit = MAX_LEADS) {
    const docs = await this.col
      .find({ status: { $in: ACTIVE_STATUSES } })
      .project({ topic: 1, city: 1, categories: 1, urgency: 1, postedAt: 1 })
      .sort({ postedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => ({
      topic: d.topic,
      city: d.city,
      categories: d.categories || [],
      urgency: d.urgency || 'standard',
      postedAt: d.postedAt || d._id.getTimestamp()
    }));
  }

  /** Active Pro lawyers with live access (not expired, not admin-suspended). */
  async getActiveProLawyers() {
    const now = new Date();
    return this.users.find({
      role: 'admin_user',
      isActive: { $ne: false },
      email: { $exists: true, $nin: [null, ''] },
      'subscription.status': 'active',
      $or: [
        { 'subscription.endsAt': null },
        { 'subscription.endsAt': { $gt: now } }
      ]
    }, { projection: { email: 1, fullName: 1, username: 1 } }).toArray();
  }

  /**
   * Build + send the weekly digest. Idempotent per ISO week.
   * @param {Date} now
   * @param {object} [opts] - { dryRun, force }
   */
  async sendWeeklyDigest(now = new Date(), { dryRun = false, force = false } = {}) {
    const weekKey = LeadDigestService.weekKey(now);

    if (!force && !dryRun) {
      const already = await this.runs.findOne({ weekKey });
      if (already) return { skipped: true, reason: 'already_sent', weekKey };
    }

    const leads = await this.getActiveLeads(MAX_LEADS);
    if (leads.length < MIN_LEADS) {
      return { skipped: true, reason: 'too_few_leads', leadCount: leads.length, weekKey };
    }

    const lawyers = await this.getActiveProLawyers();
    if (dryRun) {
      return { dryRun: true, weekKey, leadCount: leads.length, recipientCount: lawyers.length, leads };
    }

    let sent = 0;
    for (const lawyer of lawyers) {
      try {
        const { subject, html } = leadDigestEmail({
          name: lawyer.fullName || lawyer.username || '',
          leads,
          portalUrl: this.portalUrl,
          now
        });
        await this.emailService.sendEmail(lawyer.email, subject, html);
        sent++;
      } catch (e) {
        console.error('[LeadDigest] send failed for', String(lawyer._id), e.message);
      }
    }

    await this.runs.insertOne({
      weekKey, sentAt: new Date(), leadCount: leads.length, recipientCount: lawyers.length, sent
    });

    return { sent, recipientCount: lawyers.length, leadCount: leads.length, weekKey };
  }
}

module.exports = LeadDigestService;
