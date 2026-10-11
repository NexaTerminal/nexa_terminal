'use strict';

/**
 * Public, token-secured inquiry endpoints (no auth, mounted BEFORE CSRF).
 *
 * GET /api/public/inquiry/remove/:token — the opt-out link in the auto-post
 * notice email. The visitor clicks it to pull their enquiry off the board. Token
 * is an unguessable per-inquiry secret (InquiriesService.createFromEmail). We
 * return a tiny HTML page (not JSON) since it's opened in a browser.
 */

const express = require('express');
const InquiriesService = require('../services/inquiriesService');

const router = express.Router();

const page = (title, body) => `<!DOCTYPE html>
<html lang="mk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0B1220;max-width:520px;margin:48px auto;padding:0 20px;line-height:1.55;">
  <h2 style="font-size:20px;">${title}</h2>
  ${body}
  <p style="margin-top:28px;font-size:12px;color:#94a3b8;">Nexa Terminal · nexa.mk</p>
</body></html>`;

router.get('/remove/:token', async (req, res) => {
  try {
    const svc = new InquiriesService(req.app.locals.db);
    const result = await svc.removeByInquirer(req.params.token);
    if (!result.ok) {
      return res.status(404).send(page('Барањето не е пронајдено',
        '<p>Линкот е невалиден или истечен. Ако сакате да не контактирате, одговорете на е-поштата.</p>'));
    }
    return res.status(200).send(page('Вашето барање е отстрането',
      `<p>Готово — Вашето барање${result.topic ? ` „${result.topic}"` : ''} е отстрането и веќе не е видливо за професионалци.</p>
       <p>Ви благодариме. Ако се предомислите, слободно обратете ни се повторно.</p>`));
  } catch (e) {
    console.error('[publicInquiry.remove] error:', e.message);
    return res.status(500).send(page('Настана грешка', '<p>Обидете се повторно подоцна.</p>'));
  }
});

module.exports = router;
