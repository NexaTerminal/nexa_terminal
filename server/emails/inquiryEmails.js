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

module.exports = { inquiryAcknowledged, inquiryAcknowledgedNotChosen };
