/**
 * Bilingual MK/EN email templates for Topics Q&A authoring.
 */

const wrap = (title, body) => `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0B1220;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 16px;font-size:20px;">${title}</h2>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#94a3b8;">Nexa Terminal · nexa.mk</p>
</body></html>`;

const qaRequestReceived = ({ name, topic }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Барањето за тема е примено — „${topic}"`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Го примивме Вашето барање да ја отворите темата „<strong>${topic}</strong>".</p>
        <p>Уредничкиот тим ќе ја прегледа кандидатурата и ќе одговори најдоцна за неколку дена.</p>
      `)
    };
  }
  return {
    subject: `Request received — "${topic}"`,
    html: wrap(`Hi ${name || ''},`, `
      <p>We received your request to open topic "<strong>${topic}</strong>".</p>
      <p>The editorial team will review and reply within a few days.</p>
    `)
  };
};

// Member acknowledgement when they submit their answers for editorial review.
const qaSubmissionReceived = ({ name, topic, link }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Одговорите за „${topic}" се примени`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Ги примивме Вашите одговори за темата „<strong>${topic}</strong>".</p>
        <p>Уредничкиот тим ќе ги прегледа рачно. Ако се потребни доработки, ќе бидете
        известени; ако сè е во ред, темата ќе биде објавена под Ваше име.</p>
        ${link ? `<p><a href="${link}">Отвори ја темата →</a></p>` : ''}
      `)
    };
  }
  return {
    subject: `Answers for "${topic}" received`,
    html: wrap(`Hi ${name || ''},`, `
      <p>We received your answers for topic "<strong>${topic}</strong>".</p>
      <p>The editorial team will review them manually. If revisions are needed we'll let
      you know; otherwise it will be published under your name.</p>
      ${link ? `<p><a href="${link}">Open the topic →</a></p>` : ''}
    `)
  };
};

// Sent to the editorial inbox on a new request-to-open or a new answers submission.
const qaAdminNotice = ({ authorName, topic, reviewUrl, kind }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const mk = kind === 'request'
    ? { s: `Ново барање за тема — „${topic}"`, h: 'Ново барање за отворање тема', v: `бара да ја отвори темата` }
    : { s: `Нови одговори за преглед — „${topic}"`, h: 'Нови одговори во редот за преглед', v: `поднесе одговори за` };
  const en = kind === 'request'
    ? { s: `New topic request — "${topic}"`, h: 'New request to open a topic', v: `requested to open` }
    : { s: `New answers for review — "${topic}"`, h: 'New answers in the review queue', v: `submitted answers for` };
  if (lang === 'mk') {
    return {
      subject: mk.s,
      html: wrap(mk.h, `
        <p><strong>${authorName || 'Член'}</strong> ${mk.v} „<strong>${topic}</strong>".</p>
        <p><a href="${reviewUrl}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Отвори го редот за преглед →</a></p>
      `)
    };
  }
  return {
    subject: en.s,
    html: wrap(en.h, `
      <p><strong>${authorName || 'A member'}</strong> ${en.v} "<strong>${topic}</strong>".</p>
      <p><a href="${reviewUrl}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open the review queue →</a></p>
    `)
  };
};

const qaRequestApproved = ({ name, topic, scope, deadline, link }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const safeScope = String(scope || '').replace(/</g, '&lt;');
  if (lang === 'mk') {
    return {
      subject: `Темата „${topic}" Ви е доделена`,
      html: wrap(`Честитки ${name || ''},`, `
        <p>Темата „<strong>${topic}</strong>" сега е Ваша. Темата е заклучена за други автори додека работите на неа.</p>
        <p><strong>Опсег:</strong> ${safeScope}</p>
        <p><strong>Мек рок:</strong> ${deadline}</p>
        <p><a href="${link}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Започни ги одговорите →</a></p>
        <p style="font-size:12px;color:#64748b;">Може да зачувувате нацрти и да продолжите подоцна. Поднесете за преглед кога ќе бидете спремни.</p>
      `)
    };
  }
  return {
    subject: `Topic "${topic}" assigned to you`,
    html: wrap(`Congratulations ${name || ''},`, `
      <p>Topic "<strong>${topic}</strong>" is now yours. The topic is locked from other authors while you work on it.</p>
      <p><strong>Scope:</strong> ${safeScope}</p>
      <p><strong>Soft deadline:</strong> ${deadline}</p>
      <p><a href="${link}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Start answering →</a></p>
      <p style="font-size:12px;color:#64748b;">You can save drafts and continue later. Submit for review when you are ready.</p>
    `)
  };
};

const qaSubmissionReturned = ({ name, topic, editorialNotes, link }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const notes = String(editorialNotes || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
  if (lang === 'mk') {
    return {
      subject: `Темата „${topic}" е вратена на доработка`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Уредничкиот тим побара доработки за „<strong>${topic}</strong>".</p>
        <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:12px 14px;margin:12px 0;">
          <strong>Белешки:</strong><br/>${notes}
        </div>
        <p>Темата останува заклучена за Вас. Применете ги предлозите и поднесете повторно.</p>
        <p><a href="${link}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Отвори за уредување →</a></p>
      `)
    };
  }
  return {
    subject: `Topic "${topic}" returned for revision`,
    html: wrap(`Hi ${name || ''},`, `
      <p>The editorial team requested revisions on "<strong>${topic}</strong>".</p>
      <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:12px 14px;margin:12px 0;">
        <strong>Notes:</strong><br/>${notes}
      </div>
      <p>The topic remains locked to you. Apply the suggestions and resubmit.</p>
      <p><a href="${link}" style="display:inline-block;background:#0B1220;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open to edit →</a></p>
    `)
  };
};

// Admin declines the request to open the topic (before it was assigned).
const qaRequestDeclined = ({ name, topic, reason }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const safe = String(reason || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
  if (lang === 'mk') {
    return {
      subject: `Барањето за „${topic}" не е одобрено`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Вашето барање да ја отворите темата „<strong>${topic}</strong>" овојпат не е одобрено.</p>
        ${safe ? `<div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;margin:12px 0;"><strong>Образложение:</strong><br/>${safe}</div>` : ''}
        <p>Темата останува отворена — слободно побарајте друга тема од листата.</p>
      `)
    };
  }
  return {
    subject: `Request for "${topic}" was not approved`,
    html: wrap(`Hi ${name || ''},`, `
      <p>Your request to open topic "<strong>${topic}</strong>" was not approved this time.</p>
      ${safe ? `<div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;margin:12px 0;"><strong>Reason:</strong><br/>${safe}</div>` : ''}
      <p>The topic stays open — feel free to request another topic from the list.</p>
    `)
  };
};

// Admin rejects the submitted answers (terminal — not published).
const qaSubmissionRejected = ({ name, topic, editorialNotes }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  const safe = String(editorialNotes || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
  if (lang === 'mk') {
    return {
      subject: `Одговорите за „${topic}" не се прифатени`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>По уредничкиот преглед, Вашите одговори за „<strong>${topic}</strong>" не се прифатени за објавување.</p>
        ${safe ? `<div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;margin:12px 0;"><strong>Образложение:</strong><br/>${safe}</div>` : ''}
        <p>Темата повторно е отворена за други автори.</p>
      `)
    };
  }
  return {
    subject: `Answers for "${topic}" were not accepted`,
    html: wrap(`Hi ${name || ''},`, `
      <p>After editorial review, your answers for "<strong>${topic}</strong>" were not accepted for publication.</p>
      ${safe ? `<div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;margin:12px 0;"><strong>Reason:</strong><br/>${safe}</div>` : ''}
      <p>The topic is open again for other authors.</p>
    `)
  };
};

// Admin accepts the answers (queued for publication).
const qaSubmissionAccepted = ({ name, topic }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Одговорите за „${topic}" се прифатени`,
      html: wrap(`Честитки ${name || ''},`, `
        <p>Вашите одговори за „<strong>${topic}</strong>" се прифатени и наскоро ќе бидат објавени под Ваше име.</p>
        <p>Ќе добиете известување со линк штом темата стане јавна.</p>
      `)
    };
  }
  return {
    subject: `Answers for "${topic}" accepted`,
    html: wrap(`Congratulations ${name || ''},`, `
      <p>Your answers for "<strong>${topic}</strong>" have been accepted and will be published shortly under your name.</p>
      <p>You'll get a notification with the link once the topic goes live.</p>
    `)
  };
};

const qaSubmissionPublished = ({ name, topic, publicUrl }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    const shareText = encodeURIComponent(`Објавив експертски прилог за „${topic}" на Nexa Topics: ${publicUrl}`);
    return {
      subject: `Објавено — „${topic}"`,
      html: wrap(`Честитки ${name || ''},`, `
        <p>Вашиот експертски прилог за „<strong>${topic}</strong>" е објавен на Nexa Topics.</p>
        <p><a href="${publicUrl}" style="display:inline-block;background:#15803D;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Отвори јавна страница →</a></p>
        <p style="font-size:13px;color:#475569;"><strong>Сподели на LinkedIn:</strong> <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}&summary=${shareText}">отвори LinkedIn споделувач</a></p>
      `)
    };
  }
  const shareText = encodeURIComponent(`I published an expert Q&A on "${topic}" at Nexa Topics: ${publicUrl}`);
  return {
    subject: `Published — "${topic}"`,
    html: wrap(`Congratulations ${name || ''},`, `
      <p>Your expert Q&A on "<strong>${topic}</strong>" is live on Nexa Topics.</p>
      <p><a href="${publicUrl}" style="display:inline-block;background:#15803D;color:#FFF;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open public page →</a></p>
      <p style="font-size:13px;color:#475569;"><strong>Share on LinkedIn:</strong> <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}&summary=${shareText}">open share dialog</a></p>
    `)
  };
};

module.exports = {
  qaRequestReceived,
  qaSubmissionReceived,
  qaAdminNotice,
  qaRequestApproved,
  qaRequestDeclined,
  qaSubmissionReturned,
  qaSubmissionRejected,
  qaSubmissionAccepted,
  qaSubmissionPublished
};
