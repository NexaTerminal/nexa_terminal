/**
 * Bilingual MK/EN email templates for blog submission lifecycle.
 *
 * Three triggers:
 *   - blogSubmissionReceived      → on first transition out of draft (after AI check completes)
 *   - blogReturnedForRevision     → on admin "return"
 *   - blogAcceptedScheduled       → on admin "accept"
 */

const wrap = (title, bodyHtml) => `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#0B1220; line-height:1.55; max-width:560px; margin:0 auto; padding:24px;">
  <h2 style="margin:0 0 16px; font-size:20px; color:#0B1220;">${title}</h2>
  ${bodyHtml}
  <p style="margin-top:32px; font-size:12px; color:#94a3b8;">Nexa Terminal · nexa.mk</p>
</body></html>`;

const MY_SUBMISSIONS_URL = 'https://nexa.mk/terminal/marketing-hub?tab=blog';

const blogSubmissionReceived = ({ name, title }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Прилогот „${title}" е примен`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Го примивме Вашиот прилог „<strong>${title}</strong>".</p>
        <p>Уредничкиот тим ќе го прегледа рачно. Ако се потребни измени, ќе бидете
        контактирани на е-пошта; ако сè е во ред, прилогот ќе биде објавен под Ваше име.</p>
        <p>Може да го следите статусот на <a href="${MY_SUBMISSIONS_URL}">Мои прилози</a>.</p>
      `)
    };
  }
  return {
    subject: `Submission "${title}" received`,
    html: wrap(`Hi ${name || ''},`, `
      <p>We received your article "<strong>${title}</strong>".</p>
      <p>The editorial team will review it manually. If changes are needed we'll email
      you; otherwise it will be published under your name.</p>
      <p>You can track status at <a href="${MY_SUBMISSIONS_URL}">My articles</a>.</p>
    `)
  };
};

// Sent to the editorial inbox when a member submits an article for review.
const blogSubmissionAdminNotice = ({ authorName, title, reviewUrl }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Нов прилог за преглед — „${title}"`,
      html: wrap('Нов прилог во редот за преглед', `
        <p><strong>${authorName || 'Член'}</strong> поднесе прилог „<strong>${title}</strong>" за уреднички преглед.</p>
        <p><a href="${reviewUrl}" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Отвори го редот за преглед →</a></p>
      `)
    };
  }
  return {
    subject: `New article for review — "${title}"`,
    html: wrap('New article in the review queue', `
      <p><strong>${authorName || 'A member'}</strong> submitted "<strong>${title}</strong>" for editorial review.</p>
      <p><a href="${reviewUrl}" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Open the review queue →</a></p>
    `)
  };
};

const blogRejected = ({ name, title, editorialNotes }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const safeNotes = String(editorialNotes || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
  if (lang === 'mk') {
    return {
      subject: `Прилогот „${title}" не е прифатен`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>По уредничкиот преглед, Вашиот прилог „<strong>${title}</strong>" овојпат не е прифатен за објавување.</p>
        ${safeNotes ? `<div style="background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; padding:12px 14px; margin:14px 0; font-size:14px;"><strong>Образложение:</strong><br/>${safeNotes}</div>` : ''}
        <p>Слободно поднесете нов прилог кога сакате — Вашата месечна квота останува достапна.</p>
      `)
    };
  }
  return {
    subject: `Submission "${title}" was not accepted`,
    html: wrap(`Hi ${name || ''},`, `
      <p>After editorial review, your article "<strong>${title}</strong>" was not accepted for publication this time.</p>
      ${safeNotes ? `<div style="background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; padding:12px 14px; margin:14px 0; font-size:14px;"><strong>Reason:</strong><br/>${safeNotes}</div>` : ''}
      <p>You're welcome to submit a new article any time — your monthly quota remains available.</p>
    `)
  };
};

const blogPublished = ({ name, title, publicUrl }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Објавено — „${title}"`,
      html: wrap(`Честитки ${name || ''},`, `
        <p>Вашиот прилог „<strong>${title}</strong>" е објавен на јавниот блог под Ваше име.</p>
        ${publicUrl ? `<p><a href="${publicUrl}" style="display:inline-block; background:#15803D; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Отвори ја објавата →</a></p>
        <p style="font-size:13px; color:#475569;"><strong>Сподели на LinkedIn:</strong> <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}">отвори LinkedIn споделувач</a></p>` : ''}
        <p>Благодариме за придонесот.</p>
      `)
    };
  }
  return {
    subject: `Published — "${title}"`,
    html: wrap(`Congratulations ${name || ''},`, `
      <p>Your article "<strong>${title}</strong>" is now live on the public blog under your name.</p>
      ${publicUrl ? `<p><a href="${publicUrl}" style="display:inline-block; background:#15803D; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Open the post →</a></p>
      <p style="font-size:13px; color:#475569;"><strong>Share on LinkedIn:</strong> <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}">open share dialog</a></p>` : ''}
      <p>Thank you for contributing.</p>
    `)
  };
};

const blogReturnedForRevision = ({ name, title, editorialNotes }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const safeNotes = String(editorialNotes || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
  if (lang === 'mk') {
    return {
      subject: `Прилогот „${title}" е вратен на доработка`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Уредничкиот тим го прегледа Вашиот прилог „<strong>${title}</strong>" и побара доработки.</p>
        <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:12px 14px; margin:14px 0; font-size:14px;">
          <strong>Белешки:</strong><br/>${safeNotes}
        </div>
        <p>Отворете го прилогот во Терминалот, направете ги предложените измени и поднесете повторно.</p>
        <p><a href="https://nexa.mk/terminal/marketing-hub?tab=blog" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Отвори ги моите поднесувања →</a></p>
      `)
    };
  }
  return {
    subject: `Submission "${title}" returned for revision`,
    html: wrap(`Hi ${name || ''},`, `
      <p>The editorial team reviewed your article "<strong>${title}</strong>" and requested revisions.</p>
      <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:12px 14px; margin:14px 0; font-size:14px;">
        <strong>Notes:</strong><br/>${safeNotes}
      </div>
      <p>Open the submission in the Terminal, apply the suggested changes, and resubmit.</p>
      <p><a href="https://nexa.mk/terminal/marketing-hub?tab=blog" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Open my submissions →</a></p>
    `)
  };
};

const blogAcceptedScheduled = ({ name, title, newsletterMonth, publicUrl }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Прилогот „${title}" е прифатен`,
      html: wrap(`Честитки ${name || ''},`, `
        <p>Вашиот прилог „<strong>${title}</strong>" е прифатен и е закажан за билтенот за <strong>${newsletterMonth}</strong>.</p>
        ${publicUrl ? `<p>По објавувањето ќе биде достапен на <a href="${publicUrl}">${publicUrl}</a>.</p>` : ''}
        <p>Благодариме за придонесот.</p>
      `)
    };
  }
  return {
    subject: `Submission "${title}" accepted`,
    html: wrap(`Congratulations ${name || ''},`, `
      <p>Your article "<strong>${title}</strong>" has been accepted and scheduled for the <strong>${newsletterMonth}</strong> newsletter.</p>
      ${publicUrl ? `<p>After publication it will be available at <a href="${publicUrl}">${publicUrl}</a>.</p>` : ''}
      <p>Thank you for contributing.</p>
    `)
  };
};

module.exports = {
  blogSubmissionReceived,
  blogSubmissionAdminNotice,
  blogReturnedForRevision,
  blogAcceptedScheduled,
  blogRejected,
  blogPublished
};
