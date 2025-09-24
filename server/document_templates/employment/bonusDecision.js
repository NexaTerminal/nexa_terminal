const { Document, Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');
const moment = require('moment');

/**
 * Bonus Decision Document Template
 * Generates comprehensive decision document for various types of employee bonuses
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateBonusDecisionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Employee and bonus data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeeWorkPosition = formData?.employeeWorkPosition || '[Работна позиција]';
  const bonusType = formData?.bonusType || 'работна успешност';
  const bonusAmount = formData?.bonusAmount ? `${parseInt(formData.bonusAmount).toLocaleString('mk-MK')},00 денари` : '[Износ на бонус]';
  const bonusReason = formData?.bonusReason || '[Причина за бонус]';
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const effectiveDate = formData?.effectiveDate ? moment(formData.effectiveDate).format('DD.MM.YYYY') : decisionDate;
  const bonusPeriod = formData?.bonusPeriod || '';
  const isRecurring = formData?.isRecurring || false;
  const criteria = formData?.criteria || '';

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
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'О Д Л У К А', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Document subtitle - dynamic based on bonus type
        new Paragraph({
          children: [
            new TextRun({
              text: `за доделување бонус за ${bonusType}`,
              bold: true,
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Article 1 - Main decision
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Со оваа одлука, на работникот ${employeeName}, вработен во ${companyName}, на работното место: ${employeeWorkPosition}, му се доделува бонус за ${bonusType} во износ од ${bonusAmount} како нето износ.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Article 2 - Effective date and period
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Оваа одлука влегува во сила на ден ${effectiveDate}${bonusPeriod ? ` и се однесува на периодот: ${bonusPeriod}` : ''}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Article 3 - Criteria (if provided)
        ...(criteria ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Член 3', bold: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Критериумите за доделување на бонусот се: ${criteria}.`
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
          })
        ] : []),

        // Article for recurring bonus (if applicable)
        ...(isRecurring ? [
          new Paragraph({
            children: [
              new TextRun({ text: `Член ${criteria ? '4' : '3'}`, bold: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Овој бонус се доделува на редовна основа според политиките на компанијата и може да биде предмет на ревизија врз основа на перформансите и деловните резултати.'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400 }
          })
        ] : []),

        // Final article - Application
        new Paragraph({
          children: [
            new TextRun({
              text: `Член ${criteria && isRecurring ? '5' : criteria || isRecurring ? '4' : '3'}`,
              bold: true
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Оваа одлука се применува веднаш и се доставува до работникот за известување.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600 }
        }),

        // Reasoning section title
        new Paragraph({
          children: [
            new TextRun({ text: 'Образложение', bold: true, italics: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        // Standard reasoning paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: 'Правото на бонус на работникот му се определува земајќи го предвид неговиот домаќински однос, придонесот во квалитетот и обемот на извршената работа, како и во согласност со индивидуалниот придонес на работникот за деловниот успех на работодавачот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),

        // Custom reasoning if provided
        ...(bonusReason && bonusReason !== '[Причина за бонус]' ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Конкретно, бонусот се доделува заради: ${bonusReason}.`
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
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
          spacing: { after: 400 }
        }),

        // Distribution notice
        new Paragraph({
          children: [
            new TextRun({ text: 'Да се достави до: Работникот;' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 600 }
        }),

        // Employee signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работникот:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: employeeName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Employer signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работодавачот:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateBonusDecisionDoc;