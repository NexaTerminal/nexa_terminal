const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const moment = require('moment');
const { formatMKD } = require('../../utils/documentUtils');

/**
 * Bonus Payment Document Template
 * Generates decision document for employee bonus payment based on Macedonian labor law
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateBonusPaymentDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Employee and bonus data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeeWorkPosition = formData?.employeeWorkPosition || '[Работна позиција]';
  const bonusAmount = formatMKD(formData?.bonusAmount, { fallback: '[Износ на бонус]', includeCurrency: false });
  const bonusReason = formData?.bonusReason || '[Причина за бонус]';
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  
  // Build sections array for both DOCX and HTML preview
  const sections = [{
    children: [
      // Header with legal basis
      new Paragraph({
        children: [
          new TextRun({
            text: `Врз основа на член 105 од Законот за работните односи (Службен весник на Република Македонија бр.167/15 - Пречистен текст), ${companyName}, со седиште на ${companyAddress}, со ЕМБС ${companyNumber}, претставувано од Управителот ${companyManager} (во понатамошниот текст: „работодавач/от"), на ден ${decisionDate}, ја донесе следната:`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 276 }
      }),

      new Paragraph({ text: '' }),

      // Document title
      new Paragraph({
        children: [
          new TextRun({ text: 'О Д Л У К А', bold: true, size: 28 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { line: 276 }
      }),

      // Document subtitle
      new Paragraph({
        children: [
          new TextRun({ text: 'за исплата на работна успешност - бонус', bold: true, size: 24 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { line: 276 }
      }),

      new Paragraph({ text: '' }),

      // Decision content
      new Paragraph({
        children: [
          new TextRun({
            text: `Врз основа на оваа одлука, на работникот ${employeeName}, вработен во ${companyName}, на работното место: ${employeeWorkPosition} во ${companyName}, му се определува и додаток на плата за работна успешност (бонус) во износ од ${bonusAmount} денари како нето износ.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 276 }
      }),

      new Paragraph({ text: '' }),

      // Reasoning section title
      new Paragraph({
        children: [
          new TextRun({ text: 'Образложение', bold: true, italics: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { line: 276 }
      }),

      // Standard reasoning paragraph
      new Paragraph({
        children: [
          new TextRun({
            text: 'Правото на додаток на плата за работна успешност на работникот му се определува земајќи го предвид неговиот домаќински однос, придонесот во квалитетот и обемот на извршената работа, како и во согласност со индивидуалниот придонес на работникот за деловниот успех на работодавачот.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 276 }
      }),

      // Custom reasoning if provided
      ...(bonusReason && bonusReason !== '[Причина за бонус]' ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `Конкретно, бонусот се доделува заради: ${bonusReason}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        })
      ] : []),

      // Conclusion
      new Paragraph({
        children: [
          new TextRun({
            text: 'Следствено на погоре наведеното, работодавачот одлучи како во диспозитивот на оваа Одлука.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 276 }
      }),

      new Paragraph({ text: '' }),

      // Distribution notice
      new Paragraph({
        children: [
          new TextRun({ text: 'Да се достави до: Работникот;' })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { line: 276 }
      }),

      new Paragraph({ text: '' }),
      new Paragraph({ text: '' }),

      // // Employee signature
      // new Paragraph({
      //   children: [
      //     new TextRun({ text: "За работникот:" }),
      //   ],
      //   alignment: AlignmentType.LEFT,
      //   spacing: { after: 200 }
      // }),
      // new Paragraph({
      //   children: [
      //     new TextRun({ text: "___________________________" }),
      //   ],
      //   alignment: AlignmentType.LEFT,
      //   spacing: { after: 0 }
      // }),
      // new Paragraph({
      //   children: [
      //     new TextRun({ text: employeeName }),
      //   ],
      //   alignment: AlignmentType.LEFT,
      //   spacing: { after: 400 }
      // }),

      // Employer signature
      new Paragraph({
        children: [
          new TextRun({ text: "За работодавачот:" }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "___________________________" }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: companyManager }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 300 }
      })
    ]
  }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateBonusPaymentDoc;