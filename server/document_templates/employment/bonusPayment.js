const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const moment = require('moment');

/**
 * Bonus Payment Document Template
 * Generates decision document for employee bonus payment based on Macedonian labor law
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateBonusPaymentDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС]';
  const companyManager = company?.manager || '[Управител]';
  
  // Employee and bonus data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeeWorkPosition = formData?.employeeWorkPosition || '[Работна позиција]';
  const bonusAmount = formData?.bonusAmount || '[Износ на бонус]';
  const bonusReason = formData?.bonusReason || '[Причина за бонус]';
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  
  const doc = new Document({
    sections: [{
      children: [
        // Header with legal basis
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на член 105 од Законот за работните односи (Службен весник на Република Македонија бр.167/15 - Пречистен текст), ${companyName}, со седиште на ул. ${companyAddress}, со ЕМБС ${companyNumber}, претставувано од Управителот ${companyManager} (во понатамошниот текст: „работодавач/от"), на ден ${decisionDate}, ја донесе следната:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        new Paragraph({ text: '' }),
        
        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'О Д Л У К А', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER
        }),
        
        // Document subtitle
        new Paragraph({
          children: [
            new TextRun({ text: 'за исплата на работна успешност - бонус', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER
        }),
        
        new Paragraph({ text: '' }),
        
        // Decision content
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на оваа одлука, на работникот ${employeeName}, вработен во ${companyName}, на работното место: ${employeeWorkPosition} во ${companyName}, му се определува и додаток на плата за работна успешност (бонус) во износ од ${bonusAmount} денари како нето износ.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        
        new Paragraph({ text: '' }),
        
        // Reasoning section title
        new Paragraph({
          children: [
            new TextRun({ text: 'Образложение', bold: true, italics: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        
        // Standard reasoning paragraph
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Правото на додаток на плата за работна успешност на работникот му се определува земајќи го предвид неговиот домаќински однос, придонесот во квалитетот и обемот на извршената работа, како и во согласност со индивидуалниот придонес на работникот за деловниот успех на работодавачот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED
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
          alignment: AlignmentType.JUSTIFIED
        }),
        
        new Paragraph({ text: '' }),
        
        // Distribution notice
        new Paragraph({
          children: [
            new TextRun({ text: 'Да се достави до: Работникот;' })
          ],
          alignment: AlignmentType.LEFT
        }),
        
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        
        // Signature table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '___________________________' })
                      ],
                      alignment: AlignmentType.LEFT
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: employeeName })
                      ],
                      alignment: AlignmentType.LEFT
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: '_________________________' })
                      ],
                      alignment: AlignmentType.RIGHT
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${companyName}, ${companyManager}` })
                      ],
                      alignment: AlignmentType.RIGHT
                    })
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                })
              ]
            })
          ]
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateBonusPaymentDoc;