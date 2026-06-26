'use strict';

function verificationCodeEmail(code) {
  const subject = `Nexa — Код за верификација: ${code}`;
  const html = `
<!doctype html>
<html lang="mk">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #0B1220; line-height: 1.55; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 10px; font-size: 20px;">Потврдете ја Вашата е-пошта</h2>
  <p style="font-size: 14px; color: #334155;">
    Внесете го следниов код во прозорецот за регистрација за да ја потврдите Вашата е-пошта
    и да ја активирате Вашата сметка:
  </p>

  <div style="margin: 22px 0; text-align: center;">
    <div style="display: inline-block; font-family: 'SF Mono', 'Menlo', monospace; font-size: 32px;
                font-weight: 700; letter-spacing: 0.16em; color: #0B1220;
                background: #F4F7FB; border: 1px solid #E2E8F0; border-radius: 12px;
                padding: 14px 22px;">
      ${code}
    </div>
  </div>

  <p style="font-size: 13px; color: #475569;">
    Кодот важи 30 минути. Ако не сте ја започнале регистрацијата, едноставно занемарете ја оваа порака.
  </p>
  <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 14px;">
    Nexa Terminal
  </p>
</body>
</html>`;
  return { subject, html };
}

module.exports = { verificationCodeEmail };
