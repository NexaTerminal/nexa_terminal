/**
 * Bilingual email templates for the subscription lifecycle.
 *
 * Every function returns { subject, html }.
 * Pass `language` ('mk' | 'en'); defaults to MK (primary market).
 *
 * Templates intentionally minimal and brand-neutral. Visual polish later.
 */

const PORTAL_URL = process.env.PORTAL_URL || 'https://nexa.mk';
const SUPPORT_EMAIL = 'info@nexa.mk';

const wrap = (lang, title, bodyHtml, ctaUrl, ctaLabel) => {
  const dir = 'ltr';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#1F2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;background:#F7F8FA;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E6E8EC;border-radius:12px;padding:36px;">
        <tr><td>
          <div style="font-size:13px;color:#1E4DB7;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:18px;">Nexa</div>
          <h1 style="font-size:22px;color:#0B1220;margin:0 0 14px;letter-spacing:-0.02em;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#1F2937;">${bodyHtml}</div>
          ${ctaUrl ? `<div style="margin:28px 0 8px;"><a href="${ctaUrl}" style="display:inline-block;background:#0B1220;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">${ctaLabel}</a></div>` : ''}
          <hr style="border:none;border-top:1px solid #E6E8EC;margin:32px 0 18px;"/>
          <div style="font-size:12px;color:#6B7280;line-height:1.5;">
            ${lang === 'mk'
              ? `Прашања? Пишете на <a href="mailto:${SUPPORT_EMAIL}" style="color:#1E4DB7;">${SUPPORT_EMAIL}</a>.`
              : `Questions? Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#1E4DB7;">${SUPPORT_EMAIL}</a>.`}
          </div>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#9CA3AF;margin-top:18px;">© 2026 Nexa · NEKSA AMD DOOEL Skopje</div>
    </td></tr>
  </table>
</body></html>`;
};

const fmtDate = (d, lang) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString(lang === 'mk' ? 'mk-MK' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Public-facing tier labels (two-tier model — Basic + Pro).
const planLabel = (plan, lang) => {
  if (plan === 'pro')      return lang === 'mk' ? 'Nexa Про'   : 'Nexa Pro';
  if (plan === 'basic')    return lang === 'mk' ? 'Nexa Основен' : 'Nexa Basic';
  // legacy fallbacks
  if (plan === 'admin_5')  return lang === 'mk' ? 'Nexa Про' : 'Nexa Pro';
  if (plan === 'admin_10') return lang === 'mk' ? 'Nexa Про' : 'Nexa Pro';
  if (plan === 'admin')    return lang === 'mk' ? 'Nexa Про' : 'Nexa Pro';
  if (plan === 'standard') return lang === 'mk' ? 'Nexa Основен' : 'Nexa Basic';
  return plan || '';
};

// Short tier word for promo CTA copy ("30 дена Pro").
const tierWord = (plan, lang) => {
  const isBasic = plan === 'basic' || plan === 'standard';
  if (isBasic) return lang === 'mk' ? 'Основен' : 'Basic';
  return lang === 'mk' ? 'Про' : 'Pro';
};

// Nexa 3.0 EUR prices — must match server/constants/roles.js PLAN_PRICES.
const PLAN_PRICES = {
  standard: { monthly: 19, quarterly: 49,  annual: 179 },
  admin_5:  { monthly: 39, quarterly: 99,  annual: 359 },
  admin_10: { monthly: 59, quarterly: 149, annual: 549 }
};
const priceOf = (plan, cycle) => PLAN_PRICES[plan]?.[cycle] ?? null;

const BANK_DETAILS = {
  beneficiary: process.env.BANK_BENEFICIARY || 'NEKSA AMD DOOEL Skopje',
  iban:        process.env.BANK_IBAN        || 'MK0000000000000000000',
  swift:       process.env.BANK_SWIFT       || 'XXXXXXMK22',
  bank:        process.env.BANK_NAME        || 'Your Bank, Skopje',
  taxId:       process.env.COMPANY_TAX_ID   || 'MK000000000'
};

const cycleLabel = (cycle, lang) => {
  const map = lang === 'mk'
    ? { monthly: 'месечно', quarterly: 'квартално', annual: 'годишно' }
    : { monthly: 'monthly', quarterly: 'quarterly', annual: 'annual' };
  return map[cycle] || cycle || '';
};

// ---------- subscription request + approval ----------

const subscriptionPending = ({ name, plan, cycle }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Го примивме вашето барање — на чекање';
    const body = `<p>Здраво ${name || ''},</p>
<p>Го примивме вашето барање за <strong>${planLabel(plan, 'mk')}</strong> (${cycleLabel(cycle, 'mk')}).</p>
<p>Откако ќе ја потврдиме уплатата, ќе ја активираме претплатата и ќе ви испратиме потврда. Обично трае до 2 работни дена.</p>`;
    return { subject: title, html: wrap('mk', title, body) };
  }
  const title = 'We received your request — pending approval';
  const body = `<p>Hi ${name || ''},</p>
<p>We received your request for the <strong>${planLabel(plan, 'en')}</strong> (${cycleLabel(cycle, 'en')}).</p>
<p>Once we confirm your payment, we'll activate the subscription and send a receipt. This usually takes up to 2 business days.</p>`;
  return { subject: title, html: wrap('en', title, body) };
};

const subscriptionApproved = ({ name, plan, cycle, endsAt, invoiceNumber }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Вашата претплата е активна';
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашата претплата за <strong>${planLabel(plan, 'mk')}</strong> (${cycleLabel(cycle, 'mk')}) е активна до <strong>${fmtDate(endsAt, 'mk')}</strong>.</p>
${invoiceNumber ? `<p>Број на фактура: <strong>${invoiceNumber}</strong></p>` : ''}`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/terminal`, 'Отвори терминал') };
  }
  const title = 'Your subscription is active';
  const body = `<p>Hi ${name || ''},</p>
<p>Your <strong>${planLabel(plan, 'en')}</strong> subscription (${cycleLabel(cycle, 'en')}) is active until <strong>${fmtDate(endsAt, 'en')}</strong>.</p>
${invoiceNumber ? `<p>Invoice number: <strong>${invoiceNumber}</strong></p>` : ''}`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/terminal`, 'Open the Terminal') };
};

const subscriptionRejected = ({ name, reason }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Вашето барање за претплата не е одобрено';
    const body = `<p>Здраво ${name || ''},</p>
<p>Не можевме да го одобриме вашето барање во моментов${reason ? `: <em>${reason}</em>` : '.'}</p>
<p>За појаснување или повторно поднесување, пишете ни на <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;
    return { subject: title, html: wrap('mk', title, body) };
  }
  const title = 'Your subscription request was not approved';
  const body = `<p>Hi ${name || ''},</p>
<p>We weren't able to approve your request${reason ? `: <em>${reason}</em>` : '.'}</p>
<p>For clarification or to resubmit, write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;
  return { subject: title, html: wrap('en', title, body) };
};

// ---------- paid renewal reminders ----------

const renewalIn14Days = ({ name, plan, cycle, endsAt }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Обнова за 14 дена';
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашата претплата за ${planLabel(plan, 'mk')} (${cycleLabel(cycle, 'mk')}) истекува на <strong>${fmtDate(endsAt, 'mk')}</strong>.</p>
<p>За да продолжите без прекин, пратете уплата за следниот период.</p>`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/pricing`, 'Обнови') };
  }
  const title = 'Renewal in 14 days';
  const body = `<p>Hi ${name || ''},</p>
<p>Your ${planLabel(plan, 'en')} subscription (${cycleLabel(cycle, 'en')}) ends on <strong>${fmtDate(endsAt, 'en')}</strong>.</p>
<p>To avoid interruption, send payment for the next period.</p>`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/pricing`, 'Renew') };
};

const renewalIn3Days = ({ name, plan, cycle, endsAt }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Последна потсетник — обнова за 3 дена';
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашата претплата истекува на <strong>${fmtDate(endsAt, 'mk')}</strong>. Ако не пристигне уплата, сметката ќе биде суспендирана.</p>`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/pricing`, 'Обнови сега') };
  }
  const title = 'Final reminder — renewal in 3 days';
  const body = `<p>Hi ${name || ''},</p>
<p>Your subscription ends on <strong>${fmtDate(endsAt, 'en')}</strong>. Without payment, the account will be suspended.</p>`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/pricing`, 'Renew now') };
};

const subscriptionSuspended = ({ name }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Сметката е суспендирана';
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашата претплата истече и сметката е суспендирана. Вашите податоци се сочувани. Контактирајте нé за обновување.</p>`;
    return { subject: title, html: wrap('mk', title, body, `mailto:${SUPPORT_EMAIL}`, 'Контактирај нé') };
  }
  const title = 'Account suspended';
  const body = `<p>Hi ${name || ''},</p>
<p>Your subscription has expired and the account is suspended. Your data is preserved. Contact us to renew.</p>`;
  return { subject: title, html: wrap('en', title, body, `mailto:${SUPPORT_EMAIL}`, 'Contact us') };
};

// ---------- payment instructions ----------
// Sent on both Subscribe and Email-Invoice paths.

const paymentInstructions = ({ name, plan, cycle, billingEmail, triggeredBy = 'subscribe' }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const price = priceOf(plan, cycle);
  const amountLine = price !== null ? `€${price}` : '—';
  const refLine = `NEXA-${plan}-${cycle}`.toUpperCase();

  if (lang === 'mk') {
    const title = 'Инструкции за плаќање';
    const body = `<p>Здраво ${name || ''},</p>
<p>Благодариме за изборот на <strong>${planLabel(plan, 'mk')}</strong> (${cycleLabel(cycle, 'mk')}).</p>
<p>За да ја активираме вашата претплата, направете уплата според следните инструкции:</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0 16px;">
  <tr><td><strong>Износ:</strong></td><td><strong style="font-size:18px;">${amountLine}</strong></td></tr>
  <tr><td><strong>Корисник:</strong></td><td>${BANK_DETAILS.beneficiary}</td></tr>
  <tr><td><strong>IBAN:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${BANK_DETAILS.iban}</td></tr>
  <tr><td><strong>SWIFT:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${BANK_DETAILS.swift}</td></tr>
  <tr><td><strong>Банка:</strong></td><td>${BANK_DETAILS.bank}</td></tr>
  <tr><td><strong>Даночен бр.:</strong></td><td>${BANK_DETAILS.taxId}</td></tr>
  <tr><td><strong>Повикување на:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${refLine}</td></tr>
</table>
<p><strong>Што следи?</strong> Откако ќе ја примиме уплатата (вообичаено 1–2 работни дена), вашата претплата ќе биде активирана автоматски и ќе добиете официјална фактура на е-пошта во рок од 48 часа.</p>
${triggeredBy === 'invoice'
  ? `<p><em>Имате 3 дена дополнителен пристап до Терминалот додека ја обработуваме уплатата.</em></p>`
  : ''}
${billingEmail ? `<p style="font-size:12px;color:#6B7280;">Фактурата ќе биде испратена на: ${billingEmail}</p>` : ''}`;
    return { subject: title, html: wrap('mk', title, body) };
  }
  const title = 'Payment instructions';
  const body = `<p>Hi ${name || ''},</p>
<p>Thanks for choosing the <strong>${planLabel(plan, 'en')}</strong> (${cycleLabel(cycle, 'en')}).</p>
<p>To activate your subscription, please send payment via the following details:</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0 16px;">
  <tr><td><strong>Amount:</strong></td><td><strong style="font-size:18px;">${amountLine}</strong></td></tr>
  <tr><td><strong>Beneficiary:</strong></td><td>${BANK_DETAILS.beneficiary}</td></tr>
  <tr><td><strong>IBAN:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${BANK_DETAILS.iban}</td></tr>
  <tr><td><strong>SWIFT:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${BANK_DETAILS.swift}</td></tr>
  <tr><td><strong>Bank:</strong></td><td>${BANK_DETAILS.bank}</td></tr>
  <tr><td><strong>Tax ID:</strong></td><td>${BANK_DETAILS.taxId}</td></tr>
  <tr><td><strong>Reference:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${refLine}</td></tr>
</table>
<p><strong>What's next?</strong> Once we receive payment (usually 1–2 business days), your subscription activates automatically and your official invoice is emailed within 48 hours.</p>
${triggeredBy === 'invoice'
  ? `<p><em>You have 3 days of extended access to the Terminal while we process payment.</em></p>`
  : ''}
${billingEmail ? `<p style="font-size:12px;color:#6B7280;">Invoice will be sent to: ${billingEmail}</p>` : ''}`;
  return { subject: title, html: wrap('en', title, body) };
};

// ---------- grace period begun ----------

const graceBegun = ({ name, endsAt }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const title = 'Имате 3 дена дополнителен пристап';
    const body = `<p>Здраво ${name || ''},</p>
<p>Ви даваме 3 дена дополнителен пристап до <strong>${fmtDate(endsAt, 'mk')}</strong> за да ја процесирате уплатата.</p>
<p>Ова е еднократна можност — после ова, сметката се суспендира додека не пристигне уплатата.</p>`;
    return { subject: title, html: wrap('mk', title, body) };
  }
  const title = "You have 3 days of extended access";
  const body = `<p>Hi ${name || ''},</p>
<p>We're giving you 3 days of extended access until <strong>${fmtDate(endsAt, 'en')}</strong> to process payment.</p>
<p>This is a one-time courtesy — after this window, the account is suspended until payment arrives.</p>`;
  return { subject: title, html: wrap('en', title, body) };
};

// ---------- sub-seat invitation ----------

const subSeatInvite = ({ name, parentName, email, tempPassword }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const loginUrl = `${PORTAL_URL}/login`;
  if (lang === 'mk') {
    const title = `Добредојдовте на Nexa — пристап преку ${parentName || 'вашата фирма'}`;
    const body = `<p>Здраво ${name || ''},</p>
<p>Добивте пристап до Nexa Терминалот од <strong>${parentName || 'вашата фирма'}</strong>.</p>
<p>Најавете се со:</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0 16px;">
  <tr><td><strong>Е-пошта:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${email}</td></tr>
  <tr><td><strong>Привремена лозинка:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${tempPassword}</td></tr>
</table>
<p>По првата најава, ќе бидете побарани да поставите нова лозинка.</p>
<p>Имате пристап до автоматизирани документи, AI помош и проверки за усогласеност. Маркетплејсот и социјалните функции се резервирани за главната сметка на вашата фирма.</p>`;
    return { subject: title, html: wrap('mk', title, body, loginUrl, 'Најави се') };
  }
  const title = `Welcome to Nexa — access via ${parentName || 'your firm'}`;
  const body = `<p>Hi ${name || ''},</p>
<p>You've been given access to the Nexa Terminal by <strong>${parentName || 'your firm'}</strong>.</p>
<p>Sign in with:</p>
<table cellpadding="6" style="background:#F7F8FA;border:1px solid #E6E8EC;border-radius:6px;font-size:14px;margin:8px 0 16px;">
  <tr><td><strong>Email:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${email}</td></tr>
  <tr><td><strong>Temp password:</strong></td><td style="font-family:ui-monospace,Menlo,monospace;">${tempPassword}</td></tr>
</table>
<p>After your first login you'll be prompted to set a new password.</p>
<p>You can use document automation, AI assistance, and compliance health checks. Marketplace and social features stay with your firm's main account.</p>`;
  return { subject: title, html: wrap('en', title, body, loginUrl, 'Sign in') };
};

// ---------- promo / sales code ----------

/**
 * Cold-outreach invitation carrying the hard-coded redeem deep link.
 * One link type, reusable across campaigns — the code travels in the URL.
 */
/**
 * Editable parts of the promo-invite email: subject + inner body (paragraph
 * HTML) + the CTA. The admin can override `subject`/`body` in the Send-invite
 * modal; `wrapInvite` re-assembles them into the final HTML.
 */
const promoInviteParts = ({ code, plan = 'pro', days = 30 }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const ctaUrl = `${PORTAL_URL}/redeem?code=${encodeURIComponent(code)}`;
  const tier = tierWord(plan, lang);
  const isPro = !(plan === 'basic' || plan === 'standard');
  const videoUrl = 'https://www.youtube.com/watch?v=gVbjhEwWaBc';
  // Small helper for a clean, evenly-spaced perks list inside the email body.
  const perkList = (items) =>
    `<ul style="margin:6px 0 18px;padding:0;list-style:none;">${items
      .map(p => `<li style="margin:0 0 8px;padding-left:22px;position:relative;">` +
        `<span style="position:absolute;left:0;top:0;color:#1E4DB7;font-weight:700;">✓</span>${p}</li>`)
      .join('')}</ul>`;

  if (lang === 'mk') {
    const subject = `Подарок за вас: ${days} дена Nexa ${tier} — бесплатно`;
    const perks = isPro
      ? ['Автоматско изготвување правни документи за неколку минути',
         'AI помошник за секојдневните прашања на вашата фирма',
         'Проверки за усогласеност и пристап до B2B мрежата']
      : ['Автоматско изготвување правни документи',
         'AI помошник и проверки за усогласеност',
         'Барање понуди и виртуелен саем'];
    const body = `<p>Здраво,</p>
<p>Јас сум дел од тимот на <strong>Nexa</strong> — платформа создадена да им го поедностави секојдневието на македонските фирми. Лично би сакале да ве поканиме да ја пробате <strong>Nexa ${tier}</strong>, без никаква обврска.</p>
<p>Еве што добивате со неколку клика:</p>
${perkList(perks)}
<p>Повеќе за многуте можности на Nexa, можете да видите на <a href="${videoUrl}" target="_blank" style="color:#1E4DB7;">овој видео линк</a>.</p>
<p>Кликнете на копчето подолу за да активирате <strong>${days} дена бесплатно</strong>. Ако сè уште немате сметка, ќе ве водиме низ брза регистрација, а кодот се применува автоматски.</p>
<p style="font-size:13.5px;color:#4b5563;">Сакате прво да видите каде стои вашата фирма? Направете ја нашата <a href="${PORTAL_URL}/proverka" style="color:#1E4DB7;">бесплатна проверка на усогласеност</a> — 10 прашања, 3 минути, без најава.</p>
<p style="margin-top:22px;">Со искрена почит,<br/><strong>Тимот на Nexa</strong></p>`;
    return { subject, body, ctaUrl, ctaLabel: `Активирај ${days} дена ${tier}` };
  }
  const subject = `A gift for you: ${days} days of Nexa ${tier} — free`;
  const perks = isPro
    ? ['Draft legal documents in minutes, automatically',
       'An AI assistant for your everyday business questions',
       'Compliance checks and access to the B2B network']
    : ['Automated legal document drafting',
       'AI assistant and compliance checks',
       'Offer requests and the virtual fair'];
  const body = `<p>Hi,</p>
<p>I'm part of the team at <strong>Nexa</strong> — a platform built to make day-to-day life simpler for businesses. We'd personally like to invite you to try <strong>Nexa ${tier}</strong>, with no strings attached.</p>
<p>Here's what you get in just a few clicks:</p>
${perkList(perks)}
<p>You can see more of what Nexa can do in <a href="${videoUrl}" target="_blank" style="color:#1E4DB7;">this short video</a>.</p>
<p>Click the button below to activate <strong>${days} days free</strong>. If you don't have an account yet, we'll walk you through a quick sign-up and the code applies automatically.</p>
<p style="font-size:13.5px;color:#4b5563;">Want to see where your company stands first? Take our <a href="${PORTAL_URL}/proverka" style="color:#1E4DB7;">free compliance check</a> — 10 questions, 3 minutes, no sign-in.</p>
<p style="margin-top:22px;">Warm regards,<br/><strong>The Nexa team</strong></p>`;
  return { subject, body, ctaUrl, ctaLabel: `Activate ${days} days of ${tier}` };
};

/** Assemble a (possibly admin-edited) invite draft into the final email HTML. */
const wrapInvite = ({ subject, body, ctaUrl, ctaLabel }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  return { subject, html: wrap(lang, subject, body, ctaUrl, ctaLabel) };
};

const promoInvite = (opts, language = 'mk') =>
  wrapInvite(promoInviteParts(opts, language), language);

/** Confirmation sent right after a code is successfully redeemed. */
const promoActivated = ({ name, plan, endsAt }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const tier = tierWord(plan, lang);
  if (lang === 'mk') {
    const title = `Вашиот ${tier} пристап е активен`;
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашиот <strong>${planLabel(plan, 'mk')}</strong> пристап е активиран со кодот и важи до <strong>${fmtDate(endsAt, 'mk')}</strong>.</p>
<p>За да ги користите сите функции, потврдете ја вашата фирма во Терминалот.</p>`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/terminal`, 'Отвори терминал') };
  }
  const title = `Your ${tier} access is active`;
  const body = `<p>Hi ${name || ''},</p>
<p>Your <strong>${planLabel(plan, 'en')}</strong> access has been activated with the code and is valid until <strong>${fmtDate(endsAt, 'en')}</strong>.</p>
<p>To use every feature, verify your company inside the Terminal.</p>`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/terminal`, 'Open the Terminal') };
};

// ---------- promo conversion nudges ----------

/** "Your free {tier} ends in 3 days" → convert to a paid plan. */
const promoEndingIn3Days = ({ name, plan = 'pro', endsAt }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const tier = tierWord(plan, lang);
  if (lang === 'mk') {
    const title = `Вашиот бесплатен ${tier} истекува за 3 дена`;
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашиот бесплатен пристап до <strong>Nexa ${tier}</strong> завршува на <strong>${fmtDate(endsAt, 'mk')}</strong>.</p>
<p>За да го задржите пристапот без прекин, изберете план и продолжете да работите без застој.</p>`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/pricing`, 'Изберете план') };
  }
  const title = `Your free ${tier} ends in 3 days`;
  const body = `<p>Hi ${name || ''},</p>
<p>Your free access to <strong>Nexa ${tier}</strong> ends on <strong>${fmtDate(endsAt, 'en')}</strong>.</p>
<p>To keep your access without interruption, pick a plan and carry on uninterrupted.</p>`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/pricing`, 'Choose a plan') };
};

/** "Your free {tier} has ended" → subscribe to restore access. */
const promoEnded = ({ name, plan = 'pro' }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const tier = tierWord(plan, lang);
  if (lang === 'mk') {
    const title = `Вашиот бесплатен ${tier} период заврши`;
    const body = `<p>Здраво ${name || ''},</p>
<p>Вашиот бесплатен период со <strong>Nexa ${tier}</strong> заврши. Вашите податоци се сочувани.</p>
<p>За да го вратите целосниот пристап, изберете план — продолжувате точно од таму каде што застанавте.</p>`;
    return { subject: title, html: wrap('mk', title, body, `${PORTAL_URL}/pricing`, 'Изберете план') };
  }
  const title = `Your free ${tier} period has ended`;
  const body = `<p>Hi ${name || ''},</p>
<p>Your free <strong>Nexa ${tier}</strong> period has ended. Your data is safe.</p>
<p>To restore full access, pick a plan — you'll continue right where you left off.</p>`;
  return { subject: title, html: wrap('en', title, body, `${PORTAL_URL}/pricing`, 'Choose a plan') };
};

// ---------- admin notification ----------

const adminApprovalNeeded = ({ userEmail, userName, plan, cycle }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const title = lang === 'mk' ? 'Ново барање за одобрување' : 'New subscription pending approval';
  const body = `<p>${userName || userEmail} — <strong>${planLabel(plan, lang)}</strong> (${cycleLabel(cycle, lang)})</p>
<p>${lang === 'mk' ? 'Прегледајте во админ контролната табла.' : 'Review in the admin dashboard.'}</p>`;
  return { subject: title, html: wrap(lang, title, body, `${PORTAL_URL}/terminal/admin/subscriptions`, lang === 'mk' ? 'Отвори опашка' : 'Open queue') };
};

module.exports = {
  subscriptionPending,
  subscriptionApproved,
  subscriptionRejected,
  renewalIn14Days,
  renewalIn3Days,
  subscriptionSuspended,
  adminApprovalNeeded,
  subSeatInvite,
  paymentInstructions,
  graceBegun,
  promoInvite,
  promoInviteParts,
  wrapInvite,
  promoActivated,
  promoEndingIn3Days,
  promoEnded
};
