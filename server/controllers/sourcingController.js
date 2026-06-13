const { ObjectId } = require('mongodb');

/**
 * Sourcing / RFQ ("Барање за понуди") — manual brokering intake.
 *
 * A verified company posts a need (product/service). We store it and email
 * info@nexa.mk with the full details (incl. who they are, so the admin can work
 * it). The brokering itself is manual: the admin requests offers from suppliers
 * showing only as much about the buyer as the buyer chose (full / context /
 * anonymous), and informs the buyer within the wait window they selected.
 *
 * No offers are guaranteed — that's stated in the terms gate ('tender' feature)
 * and reiterated on the form.
 */

const COLLECTION = 'sourcing_requests';
const INFO_EMAIL = process.env.SOURCING_EMAIL || 'info@nexa.mk';

const TYPES = ['product', 'service'];
const DISCLOSURE = ['full', 'context', 'anonymous'];
const DISCLOSURE_MK = {
  full: 'Целосно (име на фирмата)',
  context: 'Само дејност и регион',
  anonymous: 'Анонимно (ништо)'
};
const TYPE_MK = { product: 'Производ', service: 'Услуга' };

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

exports.createRequest = async (req, res) => {
  try {
    const b = req.body || {};
    const type = TYPES.includes(b.type) ? b.type : null;
    const category = (b.category || '').toString().trim();
    const description = (b.description || '').toString().trim();
    const region = (b.region || '').toString().trim();
    const budget = (b.budget || '').toString().trim();
    const waitDays = parseInt(b.waitDays, 10);
    const disclosure = DISCLOSURE.includes(b.disclosure) ? b.disclosure : null;

    if (!type) return res.status(400).json({ success: false, message: 'Изберете тип (производ/услуга).' });
    if (!category) return res.status(400).json({ success: false, message: 'Изберете категорија.' });
    if (description.length < 10) return res.status(400).json({ success: false, message: 'Внесете подетален опис (најмалку 10 знаци).' });
    if (!(waitDays >= 1 && waitDays <= 60)) return res.status(400).json({ success: false, message: 'Изберете рок (денови).' });
    if (!disclosure) return res.status(400).json({ success: false, message: 'Изберете колку да прикажеме за Вас.' });

    const db = req.app.locals.db;
    const user = req.user;
    const ci = user.companyInfo || {};
    const company = {
      companyName: ci.companyName || '',
      email: user.email || '',
      taxNumber: ci.companyTaxNumber || ci.taxNumber || '',
      address: ci.companyAddress || ci.address || '',
      manager: ci.companyManager || ci.manager || ''
    };

    const doc = {
      userId: user._id instanceof ObjectId ? user._id : new ObjectId(String(user._id || user.id)),
      company,
      type, category, description, region, budget, waitDays, disclosure,
      status: 'new',
      createdAt: new Date()
    };
    const { insertedId } = await db.collection(COLLECTION).insertOne(doc);

    // Email the admin with EVERYTHING (admin needs the real identity to work it).
    try {
      const emailService = req.app.locals.emailService;
      if (emailService) {
        const adminHtml = `
          <h2>Ново барање за понуди</h2>
          <p><strong>Тип:</strong> ${esc(TYPE_MK[type])}<br/>
          <strong>Категорија:</strong> ${esc(category)}<br/>
          <strong>Рок (бара одговор за):</strong> ${waitDays} дена<br/>
          <strong>Откривање кон добавувачи:</strong> ${esc(DISCLOSURE_MK[disclosure])}</p>
          <p><strong>Опис:</strong><br/>${esc(description).replace(/\n/g, '<br/>')}</p>
          ${region ? `<p><strong>Регион/град:</strong> ${esc(region)}</p>` : ''}
          ${budget ? `<p><strong>Буџет/количина:</strong> ${esc(budget)}</p>` : ''}
          <hr/>
          <h3>Барател (само за внатрешна употреба)</h3>
          <p><strong>Фирма:</strong> ${esc(company.companyName) || '—'}<br/>
          <strong>Е-пошта:</strong> ${esc(company.email) || '—'}<br/>
          <strong>ЕДБ:</strong> ${esc(company.taxNumber) || '—'}<br/>
          <strong>Адреса:</strong> ${esc(company.address) || '—'}</p>
          <p style="color:#888">ID: ${insertedId}</p>`;
        await emailService.sendEmail(INFO_EMAIL, `Ново барање за понуди — ${category}`, adminHtml);

        // Confirmation to the buyer.
        if (company.email) {
          const userHtml = `
            <h2>Вашето барање е примено</h2>
            <p>Го примивме Вашето барање за понуди (${esc(TYPE_MK[type])} — ${esc(category)}).
            Нашиот тим ќе се обиде да обезбеди понуди од релевантни добавувачи и ќе Ве
            извести во рок од <strong>${waitDays} дена</strong>.</p>
            <p>Ве потсетуваме: ова е барање за понуди, не нарачка. Не гарантираме дека ќе
            пристигнат понуди.</p>
            <p>Со почит,<br/>Nexa</p>`;
          await emailService.sendEmail(company.email, 'Nexa — Вашето барање за понуди е примено', userHtml);
        }
      }
    } catch (e) {
      console.warn('[sourcing] email failed (request still saved):', e.message);
    }

    return res.json({ success: true, id: insertedId.toString(), waitDays });
  } catch (err) {
    console.error('[sourcing] createRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Грешка при поднесување на барањето.' });
  }
};
