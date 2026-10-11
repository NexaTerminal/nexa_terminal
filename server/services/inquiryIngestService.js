'use strict';

/**
 * inquiryIngestService — turns an inbound satellite email into an anonymized,
 * auto-posted inquiry (+ visitor opt-out email). The ONLY intake path is Resend:
 *   - real-time: the `email.received` webhook calls processReceivedEvent(emailId)
 *   - backstop:  admin „pull recent" calls fetchAndProcessRecent() (Receiving API)
 *
 * All outbound mail here (opt-out + admin notice) is sent FROM info@nexa.mk via the
 * shared Resend client in emailService. Per-message errors are swallowed so one bad
 * email never stops a batch; dedup is enforced by a unique index on messageId.
 */

const cfg = require('../config/resendInboundConfig');
const emailService = require('./emailService');
const inquiryEmailExtractor = require('./inquiryEmailExtractor');
const InquiriesService = require('./inquiriesService');
const inquiryEmails = require('../emails/inquiryEmails');

const APP_URL = () => process.env.CLIENT_URL || process.env.APP_URL || 'https://nexa.mk';
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/** Normalize a Resend "from"/"to" (string or {name,email}) to a bare address. */
function addrOf(v) {
  if (!v) return '';
  if (typeof v === 'string') { const m = v.match(EMAIL_RE); return m ? m[0] : v; }
  if (Array.isArray(v)) return addrOf(v[0]);
  if (typeof v === 'object') return v.email || v.address || '';
  return '';
}

/** Best-effort plain text from a Resend received-email object. */
function bodyOf(mail) {
  if (mail.text && String(mail.text).trim()) return String(mail.text);
  const html = mail.html || '';
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function headerValue(mail, name) {
  const h = mail.headers;
  if (!h) return '';
  if (Array.isArray(h)) {
    const hit = h.find((x) => (x.name || '').toLowerCase() === name.toLowerCase());
    return hit ? hit.value : '';
  }
  return h[name] || h[name.toLowerCase()] || '';
}

/**
 * Core: create an anonymized inquiry from one parsed email and notify the visitor.
 * @returns {Promise<'posted'|'skipped_sender'|'no_contact'|'duplicate'|'failed'>}
 */
async function processInboundEmail({ messageId, from, replyTo, subject, bodyText }, db) {
  if (!cfg.isAllowedSender(from)) return 'skipped_sender';

  const svc = new InquiriesService(db);
  try {
    const draft = await inquiryEmailExtractor.extractFromEmail(bodyText || subject || '');
    const source = cfg.sourceForSender(from) || draft.source || null;
    // Reply-To is the visitor on forwarded site mail; fall back to AI extraction.
    if (!draft.inquirerEmail && replyTo) {
      const m = String(replyTo).match(EMAIL_RE);
      if (m) draft.inquirerEmail = m[0];
    }

    const inquiry = await svc.createFromEmail(draft, { messageId, source });
    await sendRemoveEmail(svc, inquiry);
    return 'posted';
  } catch (err) {
    if (err.code === 'NO_CONTACT') { await notifyAdminNoContact({ from, subject }); return 'no_contact'; }
    if (err.code === 11000 || /duplicate key/i.test(err.message)) return 'duplicate';
    console.warn('[inquiryIngest] message failed:', err.message);
    return 'failed';
  }
}

/** Webhook path: fetch the full email by id, then process it. */
async function processReceivedEvent(emailId, db) {
  const resend = emailService.getResendClient();
  if (!resend) throw new Error('Resend client not configured');
  const res = await resend.emails.receiving.get(emailId);
  const mail = res?.data || res;
  if (!mail) throw new Error('received email not found');
  return processInboundEmail({
    messageId: mail.id || emailId,
    from: addrOf(mail.from),
    replyTo: addrOf(mail.reply_to) || headerValue(mail, 'Reply-To'),
    subject: mail.subject || '',
    bodyText: bodyOf(mail),
  }, db);
}

/** Backstop: pull recent received emails and process any not already ingested. */
async function fetchAndProcessRecent(db) {
  if (!cfg.ENABLED) return { ok: false, error: 'not enabled' };
  const resend = emailService.getResendClient();
  if (!resend) return { ok: false, error: 'resend not configured' };

  let list;
  try {
    const res = await resend.emails.receiving.list({ limit: cfg.MAX_RECENT });
    list = res?.data?.data || res?.data || [];
  } catch (e) {
    return { ok: false, error: e.message };
  }

  const counts = { posted: 0, skipped_sender: 0, no_contact: 0, duplicate: 0, failed: 0 };
  for (const item of (Array.isArray(list) ? list : [])) {
    const from = addrOf(item.from);
    if (!cfg.isAllowedSender(from)) { counts.skipped_sender += 1; continue; }
    try {
      const outcome = await processReceivedEvent(item.id, db);
      counts[outcome] = (counts[outcome] || 0) + 1;
    } catch (e) {
      counts.failed += 1;
      console.warn('[inquiryIngest] recent item failed:', e.message);
    }
  }
  return { ok: true, fetched: (Array.isArray(list) ? list.length : 0), ...counts };
}

async function sendRemoveEmail(svc, inquiry) {
  if (!inquiry.inquirerEmail) return;
  try {
    const removeUrl = `${APP_URL()}/api/public/inquiry/remove/${inquiry.removeToken}`;
    const t = inquiryEmails.inquiryAutoPostedNotice(
      { name: inquiry.inquirerName, topic: inquiry.topic, removeUrl },
      inquiry.language
    );
    await emailService.sendEmail(inquiry.inquirerEmail, t.subject, t.html, { from: cfg.FROM });
    await svc.markConsentEmailSent(inquiry._id);
  } catch (e) {
    console.warn('[inquiryIngest] remove-email failed:', e.message);
  }
}

async function notifyAdminNoContact({ from, subject }) {
  try {
    await emailService.sendEmail(
      cfg.NOTIFY_EMAIL,
      'Барање без контакт — рачна обработка',
      `<p>Пристигна е-пошта од сателитски сајт без препознаена контакт е-пошта на клиентот, па не е авто-објавена.</p>
       <p><strong>Од:</strong> ${from || '—'}<br/><strong>Наслов:</strong> ${subject || '—'}</p>
       <p>Обработете ја рачно преку „Внеси ново барање" (AI помош).</p>`,
      { from: cfg.FROM }
    );
  } catch (e) {
    console.warn('[inquiryIngest] no-contact notify failed:', e.message);
  }
}

module.exports = { processInboundEmail, processReceivedEvent, fetchAndProcessRecent };
