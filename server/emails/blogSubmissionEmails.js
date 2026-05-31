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

const blogSubmissionReceived = ({ name, title, pass, issuesCount }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const verdict = pass
      ? 'Прелиминарната AI проверка помина успешно. Сега ќе ја прегледа уредничкиот тим.'
      : `AI проверката пронајде ${issuesCount} ставка/и за подобрување. Прегледајте ги во Терминалот и доработете го прилогот.`;
    return {
      subject: `Прилогот „${title}" е примен`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Го примивме Вашиот прилог „<strong>${title}</strong>".</p>
        <p>${verdict}</p>
        <p>Може да го следите статусот на <a href="https://nexa.mk/terminal/blogs/my-submissions">Мои поднесувања</a>.</p>
      `)
    };
  }
  const verdictEn = pass
    ? 'The preliminary AI check passed. The editorial team will review next.'
    : `The AI check flagged ${issuesCount} item(s) to address. Review them in the Terminal and revise the article.`;
  return {
    subject: `Submission "${title}" received`,
    html: wrap(`Hi ${name || ''},`, `
      <p>We received your article "<strong>${title}</strong>".</p>
      <p>${verdictEn}</p>
      <p>You can track status at <a href="https://nexa.mk/terminal/blogs/my-submissions">My submissions</a>.</p>
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
        <p><a href="https://nexa.mk/terminal/blogs/my-submissions" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Отвори ги моите поднесувања →</a></p>
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
      <p><a href="https://nexa.mk/terminal/blogs/my-submissions" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Open my submissions →</a></p>
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
  blogReturnedForRevision,
  blogAcceptedScheduled
};
