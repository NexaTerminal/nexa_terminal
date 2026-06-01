'use strict';

/**
 * Render an A4 pro-invoice PDF (MK, Cyrillic, MKD only) for a saved
 * proInvoices row. Returns a Promise<Buffer>.
 *
 * Uses pdfkit + bundled DejaVu Sans fonts (already in /server/fonts/).
 * Nexa logo from /server/assets/nexa-logo.png.
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
// Macedonian thousands separator is a dot. 1169 → "1.169", 3629 → "3.629".
const fmtMkd = (n) => Number(n || 0).toLocaleString('mk-MK').replace(/\s/g, '.');

const CYCLE_LABEL = { monthly: 'Месечна', quarterly: 'Квартална', annual: 'Годишна' };

async function renderProInvoicePdf(invoice) {
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

      // ── Top: logo (left) + status badge (right) ──────────────────────
      let cursorY = 50;
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, left, cursorY, { height: 32 });
      }
      const status = invoice.status === 'paid'      ? 'ПЛАТЕНА'
                   : invoice.status === 'cancelled' ? 'ОТКАЖАНА'
                   :                                   'НЕПЛАТЕНА';
      const badgeColor = invoice.status === 'paid'      ? '#15803D'
                       : invoice.status === 'cancelled' ? '#B91C1C'
                       :                                   '#92400E';
      doc.font('mk-bold').fontSize(10).fillColor(badgeColor)
         .text(status, left, cursorY + 10, { width: pageW, align: 'right' });

      // ── Title block ──────────────────────────────────────────────────
      cursorY = 100;
      doc.font('mk-bold').fontSize(22).fillColor('#0B1220')
         .text('ПРОФАКТУРА', left, cursorY);
      cursorY = doc.y + 6;

      doc.font('mk').fontSize(10.5).fillColor('#475569');
      doc.text(`Број: ${invoice.number}`, left, cursorY);
      cursorY = doc.y + 1;
      doc.text(`Датум на издавање: ${fmtDate(invoice.issuedAt)}`, left, cursorY);
      cursorY = doc.y + 1;
      doc.text(`Рок на плаќање: ${fmtDate(invoice.dueAt)}  (3 дена)`, left, cursorY);
      cursorY = doc.y + 14;

      // Divider
      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#E5E7EB').lineWidth(0.8).stroke();
      cursorY += 14;

      // ── Two-column issuer / buyer ────────────────────────────────────
      const colGap = 28;
      const colW = (pageW - colGap) / 2;
      const colLeftX  = left;
      const colRightX = left + colW + colGap;

      const drawParty = (title, party, x, y) => {
        doc.font('mk-bold').fontSize(9).fillColor('#94a3b8')
           .text(title, x, y, { width: colW });
        let cy = doc.y + 4;
        // Use small font + tighter line height for the name to avoid wrapping
        // pushing into the next line.
        doc.font('mk-bold').fontSize(11.5).fillColor('#0B1220')
           .text(party.name || party.companyName || '—', x, cy, {
             width: colW, lineGap: 1
           });
        cy = doc.y + 6;
        doc.font('mk').fontSize(10).fillColor('#334155');
        if (party.address && party.address !== '—') {
          doc.text(party.address, x, cy, { width: colW });
          cy = doc.y + 1;
        }
        if (party.taxNumber && party.taxNumber !== '—') {
          doc.text(`Даночен бр.: ${party.taxNumber}`, x, cy, { width: colW });
          cy = doc.y + 1;
        }
        if (party.email && party.email !== '—') {
          doc.text(`Е-пошта: ${party.email}`, x, cy, { width: colW });
          cy = doc.y + 1;
        }
        if (party.manager) {
          doc.text(`Управител: ${party.manager}`, x, cy, { width: colW });
          cy = doc.y + 1;
        }
        return cy;
      };

      const yLeft  = drawParty('ИЗДАВАЧ', invoice.issuer || {}, colLeftX,  cursorY);
      const yRight = drawParty('КУПУВАЧ', invoice.buyer  || {}, colRightX, cursorY);
      cursorY = Math.max(yLeft, yRight) + 22;

      // ── Line items table (MKD only) ──────────────────────────────────
      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#0B1220').lineWidth(1).stroke();
      cursorY += 10;

      // Column geometry: description | qty | amount (MKD).
      const colDescX = left;
      const colQtyX  = right - 180;
      const colAmtX  = right - 110;
      const colAmtW  = 110;
      const colQtyW  = 60;

      doc.font('mk-bold').fontSize(9).fillColor('#94a3b8');
      doc.text('Опис на услугата', colDescX, cursorY, { width: colQtyX - colDescX - 8 });
      doc.text('Кол.',              colQtyX,  cursorY, { width: colQtyW, align: 'right' });
      doc.text('Износ (MKD)',       colAmtX,  cursorY, { width: colAmtW, align: 'right' });
      cursorY = doc.y + 8;

      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#E5E7EB').lineWidth(0.6).stroke();
      cursorY += 10;

      doc.font('mk').fontSize(11).fillColor('#0B1220');
      const planLine = `Nexa претплата — ${invoice.planLabel || invoice.planCode} (${CYCLE_LABEL[invoice.cycle] || invoice.cycle})`;
      doc.text(planLine, colDescX, cursorY, { width: colQtyX - colDescX - 8 });
      // Right-align the quantity & amount at the same baseline as the description
      doc.text('1', colQtyX, cursorY, { width: colQtyW, align: 'right' });
      doc.text(`${fmtMkd(invoice.amounts?.mkd)} ден`, colAmtX, cursorY, { width: colAmtW, align: 'right' });
      cursorY = Math.max(doc.y, cursorY + 14) + 14;

      // ── Total ────────────────────────────────────────────────────────
      doc.moveTo(left, cursorY).lineTo(right, cursorY)
         .strokeColor('#0B1220').lineWidth(1).stroke();
      cursorY += 12;

      doc.font('mk-bold').fontSize(12).fillColor('#0B1220')
         .text('ВКУПНО ЗА ПЛАЌАЊЕ', colDescX, cursorY);
      doc.font('mk-bold').fontSize(14).fillColor('#0B1220')
         .text(`${fmtMkd(invoice.amounts?.mkd)} ден`, colAmtX, cursorY - 1, {
           width: colAmtW, align: 'right'
         });
      cursorY = Math.max(doc.y, cursorY + 18) + 28;

      // ── Bank details block ───────────────────────────────────────────
      const issuer = invoice.issuer || {};
      doc.font('mk-bold').fontSize(9).fillColor('#94a3b8')
         .text('БАНКАРСКИ ПОДАТОЦИ ЗА УПЛАТА', left, cursorY);
      cursorY = doc.y + 6;

      doc.font('mk').fontSize(10).fillColor('#334155');
      const labelX = left;
      const valueX = left + 130;
      const rowH = 14;
      const bankLine = (label, value) => {
        doc.font('mk').fontSize(10).fillColor('#94a3b8').text(label, labelX, cursorY, { width: 120 });
        doc.font('mk').fontSize(10).fillColor('#0B1220').text(value, valueX, cursorY, { width: right - valueX });
        cursorY = Math.max(doc.y, cursorY + rowH);
      };
      bankLine('Банка:',            issuer.bankName    || '—');
      bankLine('Број на сметка:',   issuer.bankAccount || '—');
      bankLine('Назив на корисник:', issuer.name       || '—');
      bankLine('Цел на дознака:',   `Уплата по профактура бр. ${invoice.number}`);
      cursorY += 8;

      // ── VAT note ─────────────────────────────────────────────────────
      doc.font('mk').fontSize(9.5).fillColor('#475569')
         .text(issuer.vatNote || '', left, cursorY, { width: pageW });
      cursorY = doc.y + 18;

      // ── Footer (always at the bottom) ────────────────────────────────
      const footTop = doc.page.height - doc.page.margins.bottom - 56;
      doc.moveTo(left, footTop).lineTo(right, footTop)
         .strokeColor('#E5E7EB').lineWidth(0.6).stroke();
      doc.font('mk').fontSize(9).fillColor('#475569')
         .text(
           'По уплата на овој износ, оригинална фактура ќе биде испратена по електронска пошта и на адресата на компанијата.',
           left, footTop + 10, { width: pageW, align: 'center' }
         );
      doc.font('mk').fontSize(8.5).fillColor('#94a3b8')
         .text(
           `Профактурата важи 3 дена од денот на издавање. По уплата, претплатата се активира автоматски.`,
           left, footTop + 30, { width: pageW, align: 'center' }
         );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { renderProInvoicePdf };
