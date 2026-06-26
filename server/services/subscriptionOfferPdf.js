'use strict';

/**
 * Render an A4 "subscription offer" pro-invoice (MK, Cyrillic, MKD) that lists
 * ALL THREE billing cycles for the buyer's signed-up tier, so the trial user
 * can pick a period and pay by bank transfer immediately. Returns Promise<Buffer>.
 *
 * Unlike proInvoicePdf.js this does NOT consume an official invoice number —
 * the binding фактура is issued after payment, once the cycle is known.
 *
 * Reuses the same fonts / logo / issuer block as the numbered proforma so the
 * two documents look consistent.
 *
 * @param {object} offer
 *   offer.buyer      — { companyName, address, taxNumber, email, manager }
 *   offer.issuer     — same shape as proInvoices ISSUER (bankName, bankAccount…)
 *   offer.planLabel  — e.g. 'Про'
 *   offer.options    — [{ cycle, label, eur, mkd }]  (monthly, quarterly, annual)
 *   offer.reference  — payment "цел на дознака" string
 *   offer.trialEndsAt — Date the promo access lapses
 */

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const FONT_REGULAR = path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf');
const FONT_BOLD    = path.join(__dirname, '..', 'fonts', 'DejaVuSans-Bold.ttf');
const LOGO_PATH    = path.join(__dirname, '..', 'assets', 'nexa-logo.png');

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${dt.getFullYear()}`;
};
const fmtMkd = (n) => Number(n || 0).toLocaleString('mk-MK').replace(/\s/g, '.');

async function renderSubscriptionOfferPdf(offer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('mk',      FONT_REGULAR);
      doc.registerFont('mk-bold', FONT_BOLD);
      doc.font('mk');

      const left  = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const pageW = right - left;

      // ── Top: logo + badge ────────────────────────────────────────────
      let cursorY = 50;
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, left, cursorY, { height: 32 });
      }
      doc.font('mk-bold').fontSize(10).fillColor('#1E4DB7')
         .text('ПОНУДА', left, cursorY + 10, { width: pageW, align: 'right' });

      // ── Title ────────────────────────────────────────────────────────
      cursorY = 100;
      doc.font('mk-bold').fontSize(22).fillColor('#0B1220')
         .text('ПОНУДА ЗА ПРЕТПЛАТА', left, cursorY);
      cursorY = doc.y + 6;

      doc.font('mk').fontSize(10.5).fillColor('#475569');
      doc.text(`Тарифа: Nexa ${offer.planLabel || ''}`, left, cursorY);
      cursorY = doc.y + 1;
      doc.text(`Датум: ${fmtDate(new Date())}`, left, cursorY);
      cursorY = doc.y + 1;
      if (offer.trialEndsAt) {
        doc.text(`Вашиот бесплатен пристап завршува: ${fmtDate(offer.trialEndsAt)}`, left, cursorY);
        cursorY = doc.y + 1;
      }
      cursorY += 13;

      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#E5E7EB').lineWidth(0.8).stroke();
      cursorY += 14;

      // ── Issuer / buyer ───────────────────────────────────────────────
      const colGap = 28;
      const colW = (pageW - colGap) / 2;
      const colRightX = left + colW + colGap;

      const drawParty = (title, party, x, y) => {
        doc.font('mk-bold').fontSize(9).fillColor('#94a3b8').text(title, x, y, { width: colW });
        let cy = doc.y + 4;
        doc.font('mk-bold').fontSize(11.5).fillColor('#0B1220')
           .text(party.name || party.companyName || '—', x, cy, { width: colW, lineGap: 1 });
        cy = doc.y + 6;
        doc.font('mk').fontSize(10).fillColor('#334155');
        if (party.address && party.address !== '—')   { doc.text(party.address, x, cy, { width: colW }); cy = doc.y + 1; }
        if (party.taxNumber && party.taxNumber !== '—'){ doc.text(`Даночен бр.: ${party.taxNumber}`, x, cy, { width: colW }); cy = doc.y + 1; }
        if (party.email && party.email !== '—')        { doc.text(`Е-пошта: ${party.email}`, x, cy, { width: colW }); cy = doc.y + 1; }
        return cy;
      };

      const yLeft  = drawParty('ИЗДАВАЧ', offer.issuer || {}, left,       cursorY);
      const yRight = drawParty('КУПУВАЧ', offer.buyer  || {}, colRightX,  cursorY);
      cursorY = Math.max(yLeft, yRight) + 22;

      // ── Options table: period | amount ───────────────────────────────
      doc.font('mk-bold').fontSize(11).fillColor('#0B1220')
         .text('Изберете период на претплата', left, cursorY);
      cursorY = doc.y + 10;

      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#0B1220').lineWidth(1).stroke();
      cursorY += 10;

      const colAmtX = right - 150;
      const colAmtW = 150;
      doc.font('mk-bold').fontSize(9).fillColor('#94a3b8');
      doc.text('Период', left, cursorY, { width: colAmtX - left - 8 });
      doc.text('Износ за уплата (MKD)', colAmtX, cursorY, { width: colAmtW, align: 'right' });
      cursorY = doc.y + 8;
      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#E5E7EB').lineWidth(0.6).stroke();
      cursorY += 10;

      (offer.options || []).forEach((opt) => {
        doc.font('mk').fontSize(11.5).fillColor('#0B1220')
           .text(opt.label, left, cursorY, { width: colAmtX - left - 8 });
        doc.font('mk-bold').fontSize(11.5).fillColor('#0B1220')
           .text(`${fmtMkd(opt.mkd)} ден`, colAmtX, cursorY, { width: colAmtW, align: 'right' });
        cursorY = Math.max(doc.y, cursorY + 14) + 10;
      });

      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#0B1220').lineWidth(1).stroke();
      cursorY += 16;

      // ── How it works note ────────────────────────────────────────────
      doc.font('mk').fontSize(10).fillColor('#334155').text(
        'Уплатете го износот за саканиот период на сметката подолу. Со примање на уплатата, ' +
        'соодветната претплата се активира и Ви испраќаме оригинална фактура по е-пошта.',
        left, cursorY, { width: pageW }
      );
      cursorY = doc.y + 18;

      // ── Bank block ───────────────────────────────────────────────────
      const issuer = offer.issuer || {};
      doc.font('mk-bold').fontSize(9).fillColor('#94a3b8')
         .text('БАНКАРСКИ ПОДАТОЦИ ЗА УПЛАТА', left, cursorY);
      cursorY = doc.y + 6;

      const valueX = left + 130;
      const rowH = 14;
      const bankLine = (label, value) => {
        doc.font('mk').fontSize(10).fillColor('#94a3b8').text(label, left, cursorY, { width: 120 });
        doc.font('mk').fontSize(10).fillColor('#0B1220').text(value, valueX, cursorY, { width: right - valueX });
        cursorY = Math.max(doc.y, cursorY + rowH);
      };
      bankLine('Банка:',             issuer.bankName    || '—');
      bankLine('Број на сметка:',    issuer.bankAccount || '—');
      bankLine('Назив на корисник:', issuer.name        || '—');
      bankLine('Цел на дознака:',    offer.reference || 'Уплата за Nexa претплата');
      cursorY += 8;

      doc.font('mk').fontSize(9.5).fillColor('#475569')
         .text(issuer.vatNote || '', left, cursorY, { width: pageW });

      // ── Footer ───────────────────────────────────────────────────────
      const footTop = doc.page.height - doc.page.margins.bottom - 40;
      doc.moveTo(left, footTop).lineTo(right, footTop)
         .strokeColor('#E5E7EB').lineWidth(0.6).stroke();
      doc.font('mk').fontSize(9).fillColor('#475569')
         .text(
           'Прашања околу уплатата? Пишете на info@nexa.mk — тука сме да помогнеме.',
           left, footTop + 12, { width: pageW, align: 'center' }
         );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { renderSubscriptionOfferPdf };
