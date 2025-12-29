const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Invoice Signing Authorization Document Template
 * Generates authorization for invoice signing rights
 * Based on company founding agreement articles
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateInvoiceSigningAuthorizationDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса]';
  const companyTaxNumber = company?.taxNumber || '[ЕДБ]';

  // Extract city from company address (take first part before comma, or use full address)
  const city = companyAddress.includes(',') ? companyAddress.split(',').pop().trim() : companyAddress;

  // Form data
  const authorizedPerson = formData?.authorizedPerson || '[Име на овластено лице]';
  const position = formData?.position || '[Работно место]';
  const effectiveDate = formData?.effectiveDate ? moment(formData.effectiveDate).format('DD.MM.YYYY') : '[Датум]';
  const documentDate = formData?.date ? moment(formData.date).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        // Legal basis paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Друштвото ${companyName}, со седиште на ${companyAddress} и со ЕДБ ${company?.taxNumber || '[ЕДБ]'}, претставувано од Управителот ${companyManager}, на ден ${documentDate} година, го дава следново`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title - spaced letters
        new Paragraph({
          children: [
            new TextRun({ text: 'О В Л А С Т У В А Њ Е', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50, line: 276 }
        }),

        // Document subtitle
        new Paragraph({
          children: [
            new TextRun({
              text: 'за потпишување фактури',
              bold: true,
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Point 1
        new Paragraph({
          children: [
            new TextRun({
              text: `1) За потпишување на излезни фактури на друштвото ${companyName}, со седиште на ${companyAddress} и со ЕДБ ${company?.taxNumber || '[ЕДБ]'} го овластувам лицето ${authorizedPerson} распоредено на работно место ${position} (работно место кое согласно систематиацијата на работни места и договорот за вработување опфаќа и работни задачи поврзани со проверка на релевантната документација при издавањето на фактури).`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Point 2
        new Paragraph({
          children: [
            new TextRun({
              text: '2) Овластениот работник е должен пред потпишувањето на секоја фактура да изврши увид во документите врз основа кои е изготвената фактурата. Издадената фактура овластеното лице задолжително ја евидентира во сметководствената евиденција на друштвото.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Point 3
        new Paragraph({
          children: [
            new TextRun({
              text: '3) Овластениот работник е одговорен за секоја потпишана фактура за која ќе се утврди дека не е заснована на веродостојни документи.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Point 4
        new Paragraph({
          children: [
            new TextRun({
              text: `4) Ова овластување стапува на сила од ${effectiveDate} година (да се наведе датумот од кога се дава овластувањето).`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Signature section - simple line format
         new Paragraph({
          children: [
            new TextRun({ text: "За Друштвото" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 10, line: 276 }
        }),
               new Paragraph({
          children: [
            new TextRun({ text: `Управител ${companyManager}` }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200, line: 276 }
        }),
             new Paragraph({
          children: [
            new TextRun({ text: `Дата: ${documentDate}` }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        })

      ]
    }]
  });

  return { doc };
}

module.exports = generateInvoiceSigningAuthorizationDoc;
