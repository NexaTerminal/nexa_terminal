'use strict';

/**
 * User activity aggregator — pure read. Builds a chronological list of
 * events for a single user by gathering timestamps from collections we
 * already write to (no new fields, no new writes).
 *
 * Each event: { at: Date, type, label, meta?: object }
 */

const { ObjectId } = require('mongodb');

const toObjectId = (v) => {
  if (v instanceof ObjectId) return v;
  if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
  return null;
};

// Helper to read up to N rows from a collection safely (returns [] on error /
// missing collection).
async function readSafe(db, name, filter, projection, limit = 100) {
  try {
    return await db.collection(name)
      .find(filter, { projection })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}

class UserActivityService {
  constructor(db) {
    this.db = db;
  }

  async getActivity(userId, { limit = 200 } = {}) {
    const uid = toObjectId(userId);
    if (!uid) throw new Error('Invalid user id.');

    const user = await this.db.collection('users').findOne({ _id: uid });
    if (!user) return [];

    const events = [];
    const push = (at, type, label, meta) => {
      if (!at) return;
      events.push({ at: new Date(at), type, label, ...(meta ? { meta } : {}) });
    };

    // ── Account lifecycle (from the user doc itself) ──────────────────
    push(user.createdAt, 'account.created', 'Регистриран корисник');
    if (user.emailVerifiedAt) push(user.emailVerifiedAt, 'account.emailVerified', 'Е-поштата е потврдена');
    if (user.lastLogin && Math.abs(new Date(user.lastLogin) - new Date(user.createdAt)) > 60000) {
      push(user.lastLogin, 'account.lastLogin', 'Последна најава');
    }

    // ── Subscription lifecycle ────────────────────────────────────────
    const s = user.subscription || {};
    if (s.startedAt)    push(s.startedAt,    'sub.started',  `Пробен период започнат (${s.cycle || 'trial'})`);
    if (s.requestedAt)  push(s.requestedAt,  'sub.requested',`Барање за план: ${s.requestedPlan || s.plan || '—'} ${s.requestedCycle || s.cycle || ''}`);
    if (s.approvedAt)   push(s.approvedAt,   'sub.approved', `План одобрен: ${s.plan || '—'}`);
    if (s.gracePeriod?.startedAt) push(s.gracePeriod.startedAt, 'sub.grace', 'Грејс период активиран');

    // ── Pro-invoices ──────────────────────────────────────────────────
    const proInvoices = await readSafe(this.db, 'proInvoices',
      { userId: uid },
      { number: 1, status: 1, amounts: 1, issuedAt: 1, emailedAt: 1 },
      30
    );
    for (const inv of proInvoices) {
      push(inv.issuedAt, 'invoice.issued',
        `Профактура издадена бр. ${inv.number} · ${inv.amounts?.mkd || 0} ден`,
        { number: inv.number, status: inv.status });
      if (inv.emailedAt) push(inv.emailedAt, 'invoice.emailed', `Профактура испратена ${inv.number}`);
    }

    // ── Admin-curated invoices (payments confirmed) ──────────────────
    const invoices = await readSafe(this.db, 'invoices',
      { userId: uid },
      { invoiceNumber: 1, paymentDate: 1, amount: 1, createdAt: 1 },
      30
    );
    for (const i of invoices) {
      push(i.paymentDate || i.createdAt, 'invoice.paid',
        `Уплата запишана · бр. ${i.invoiceNumber || '—'} · ${i.amount || 0} EUR`);
    }

    // ── Document generations ──────────────────────────────────────────
    const gens = await readSafe(this.db, 'template_generations',
      { userId: uid },
      { templateName: 1, documentType: 1, createdAt: 1 },
      80
    );
    for (const g of gens) {
      push(g.createdAt, 'doc.generated',
        `Документ генериран: ${g.templateName || g.documentType || '—'}`);
    }

    // ── Compliance assessments ────────────────────────────────────────
    for (const col of ['lhcAssessments', 'mhcAssessments', 'chcAssessments', 'hhcAssessments']) {
      const rows = await readSafe(this.db, col,
        { userId: uid },
        { category: 1, percentage: 1, createdAt: 1 },
        20
      );
      for (const r of rows) {
        push(r.createdAt, 'compliance.report',
          `Извештај за усогласеност: ${r.category || col.replace('Assessments','')} (${r.percentage ?? '—'}%)`);
      }
    }

    // ── Blog submissions ──────────────────────────────────────────────
    const subs = await readSafe(this.db, 'blogSubmissions',
      { authorId: uid },
      { title: 1, status: 1, createdAt: 1, submittedAt: 1, publishedAt: 1 },
      30
    );
    for (const b of subs) {
      push(b.createdAt, 'blog.drafted', `Нацрт за блог: ${b.title || '(без наслов)'}`);
      if (b.submittedAt) push(b.submittedAt, 'blog.submitted', `Прилог поднесен: ${b.title || '(без наслов)'}`);
      if (b.publishedAt) push(b.publishedAt, 'blog.published', `Блог објавен: ${b.title || '(без наслов)'}`);
    }

    // ── Inquiry signals (expressed interest) ──────────────────────────
    const signals = await readSafe(this.db, 'inquirySignals',
      { userId: uid },
      { status: 1, createdAt: 1, inquiryId: 1 },
      30
    );
    for (const sig of signals) {
      push(sig.createdAt, 'lead.interest', `Изразен интерес за случај${sig.status === 'approved' ? ' (одобрено)' : ''}`);
    }

    // ── Topics Q&A submissions ────────────────────────────────────────
    const topics = await readSafe(this.db, 'topicSubmissions',
      { userId: uid },
      { status: 1, requestedAt: 1, submittedAt: 1, publishedAt: 1 },
      30
    );
    for (const t of topics) {
      if (t.requestedAt) push(t.requestedAt, 'topic.requested', 'Барано отворање на Q&A тема');
      if (t.submittedAt) push(t.submittedAt, 'topic.submitted', 'Q&A одговор поднесен');
      if (t.publishedAt) push(t.publishedAt, 'topic.published', 'Q&A одговор објавен');
    }

    // ── Admin audit log entries that target this user ────────────────
    const audits = await readSafe(this.db, 'audit_logs',
      { 'target.userId': uid },
      { type: 1, at: 1, actor: 1 },
      30
    );
    const TYPE_LABEL = {
      USER_HARD_DELETE:   'Корисникот е избришан од админ',
      USER_RESET_PASSWORD:'Лозинка ресетирана од админ',
      USER_ROLE_CHANGE:   'Улогата е променета од админ',
      USER_SUSPEND:       'Корисникот е суспендиран',
      USER_REACTIVATE:    'Корисникот е реактивиран'
    };
    for (const a of audits) {
      push(a.at, `admin.${(a.type || '').toLowerCase()}`,
        TYPE_LABEL[a.type] || `Админ акција: ${a.type || '—'}`);
    }

    // Sort + cap.
    events.sort((a, b) => b.at.getTime() - a.at.getTime());
    return events.slice(0, limit);
  }
}

module.exports = UserActivityService;
