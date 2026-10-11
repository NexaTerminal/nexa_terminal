/**
 * Bilingual MK/EN email templates for the Inquiry Board.
 *
 * IMPORTANT: There is NO auto-generated introduction email from the system.
 * The operator (Martin) sends the introduction manually from their own
 * mailbox. These two templates are platform-side acknowledgements only.
 */

const wrap = (title, body) => `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0B1220;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 16px;font-size:20px;">${title}</h2>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#94a3b8;">Nexa Terminal · nexa.mk</p>
</body></html>`;

const inquiryAcknowledged = ({ name, topic, city }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Изразен интерес е примен — „${topic}"`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Го примивме Вашиот интерес за барањето „<strong>${topic}</strong>" · ${city}.</p>
        <p>Уредничкиот тим ќе ги разгледа сите интереси и ќе Ви одговори ако сте избрани за оваа материја.</p>
        <p>Сите Ваши интереси можете да ги следите во <a href="https://nexa.mk/terminal/leads">Терминалот → Барања → Мои изразени интереси</a>.</p>
      `)
    };
  }
  return {
    subject: `Interest received — "${topic}"`,
    html: wrap(`Hi ${name || ''},`, `
      <p>We received your interest in inquiry "<strong>${topic}</strong>" · ${city}.</p>
      <p>The editorial team will review all interest signals and respond if you are selected for this matter.</p>
      <p>Track all your claims at <a href="https://nexa.mk/terminal/leads">Terminal → Inquiries → My Claims</a>.</p>
    `)
  };
};

const inquiryAcknowledgedNotChosen = ({ name, topic }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Не сте избрани за „${topic}"`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Друг член беше одобрен за барањето „<strong>${topic}</strong>".</p>
        <p>Ќе продолжиме да објавуваме нови барања во Вашата област штом пристигнат.</p>
        <p>Може да ги следите новите барања во <a href="https://nexa.mk/terminal/leads">Терминалот → Барања</a>.</p>
      `)
    };
  }
  return {
    subject: `Not selected for "${topic}"`,
    html: wrap(`Hi ${name || ''},`, `
      <p>Another member was approved for inquiry "<strong>${topic}</strong>".</p>
      <p>We will continue to post new inquiries in your declared area as they arrive.</p>
      <p>Check new inquiries at <a href="https://nexa.mk/terminal/leads">Terminal → Inquiries</a>.</p>
    `)
  };
};

/**
 * Opt-out notice for an auto-ingested inquiry. The enquiry is already shared
 * (anonymized) with professionals; this gives the visitor a one-click „remove me".
 */
const inquiryAutoPostedNotice = ({ name, topic, removeUrl }, language = 'mk') => {
  const lang = language === 'en' ? 'en' : 'mk';
  if (lang === 'mk') {
    return {
      subject: `Вашето прашање е споделено со професионалци — „${topic}"`,
      html: wrap(`Здраво ${name || ''},`, `
        <p>Вашето прашање „<strong>${topic}</strong>" е споделено <strong>анонимно</strong> (без Вашето име и контакт) со проверени професионалци што може да ви помогнат. Ако некој е заинтересиран, ќе ве поврземе.</p>
        <p>Ако <strong>не</strong> сакате ова, кликнете за да го отстраните веднаш:</p>
        <p><a href="${removeUrl}" style="display:inline-block;padding:10px 18px;background:#0B1220;color:#fff;border-radius:6px;text-decoration:none;">Отстрани го моето барање</a></p>
        <p style="font-size:12px;color:#94a3b8;">Ако копчето не работи, отворете: ${removeUrl}</p>
      `)
    };
  }
  return {
    subject: `Your question was shared with professionals — "${topic}"`,
    html: wrap(`Hi ${name || ''},`, `
      <p>Your question "<strong>${topic}</strong>" has been shared <strong>anonymously</strong> (without your name or contact details) with vetted professionals who may help. If someone is interested, we'll connect you.</p>
      <p>If you do <strong>not</strong> want this, click to remove it right away:</p>
      <p><a href="${removeUrl}" style="display:inline-block;padding:10px 18px;background:#0B1220;color:#fff;border-radius:6px;text-decoration:none;">Remove my request</a></p>
      <p style="font-size:12px;color:#94a3b8;">If the button doesn't work, open: ${removeUrl}</p>
    `)
  };
};

module.exports = { inquiryAcknowledged, inquiryAcknowledgedNotChosen, inquiryAutoPostedNotice };
