const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Cash Register Maximum Decision Document Template
 * Generates decision for setting cash register maximum limits
 * Based on Article 20 of the Payment Transactions Law
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateCashRegisterMaximumDecisionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = formData?.companyManager || company?.companyManager || company?.manager || '[Управител]';

  // Form data
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const year = formData?.year || new Date().getFullYear().toString();
  const amount = formData?.amount ? `${parseInt(formData.amount).toLocaleString('mk-MK')},00` : '[Износ]';

  const doc = new Document({
    sections: [{
      children: [
        // Header with legal basis
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на член 20 од Законот за платниот промет, ${companyName}, ${companyAddress}, претставувани од Управителот ${companyManager} на ден ${decisionDate} година, донесе`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'О Д Л У К А', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        // Document subtitle
        new Paragraph({
          children: [
            new TextRun({
              text: `за благајнички максимум за ${year} година`,
              bold: true,
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Article 1
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Се утврдува благајнички максимум за ${year} година во износ од ${amount} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 2
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Сите парични средства од дневниот пазар примени во готово по која и да било основа се уплатуваат на трансакциската сметка кај носителот на платен промет, истиот ден, а најдоцна наредниот работен ден од денот на наплатата.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 3
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Оваа одлука се применува од денот на донесувањето.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 4
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Со стапување во сила на оваа одлука, престанува да важи Одлуката за благајнички максимум.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: "Управителот:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateCashRegisterMaximumDecisionDoc;
