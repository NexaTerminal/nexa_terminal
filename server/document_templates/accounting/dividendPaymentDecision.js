const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign } = require('docx');
const moment = require('moment');

/**
 * Dividend Payment Decision Document Template
 * Generates decision for dividend payment to shareholders
 * Based on Article 490 of the Law on Trading Companies
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateDividendPaymentDecisionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Претседавач]';

  // Calculate years automatically
  const currentYear = new Date().getFullYear();
  const profitYear = currentYear - 1; // Previous year
  const paymentYear = currentYear; // Current year

  // Form data
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const profitAmount = formData?.profitAmount ? `${parseInt(formData.profitAmount).toLocaleString('mk-MK')},00` : '[Износ]';
  const totalDividendAmount = formData?.totalDividendAmount ? `${parseInt(formData.totalDividendAmount).toLocaleString('mk-MK')},00` : '[Вкупен износ]';

  // Shareholders list
  const shareholdersList = formData?.shareholdersList || [];

  // Create table rows for shareholders
  const tableRows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'бр', bold: true })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 10, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Име Презиме / Назив на содружник', bold: true })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 60, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Бруто износ на Дивиденда по содружник', bold: true })],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: VerticalAlign.CENTER,
          width: { size: 30, type: WidthType.PERCENTAGE }
        })
      ]
    })
  ];

  // Add shareholder rows
  shareholdersList.forEach((shareholder, index) => {
    const formattedAmount = shareholder.grossDividendAmount
      ? `${parseInt(shareholder.grossDividendAmount).toLocaleString('mk-MK')},00`
      : '0,00';

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: (index + 1).toString() })],
                alignment: AlignmentType.CENTER
              })
            ],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: shareholder.shareholderName || '' })],
                alignment: AlignmentType.LEFT
              })
            ],
            verticalAlign: VerticalAlign.CENTER
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: formattedAmount })],
                alignment: AlignmentType.RIGHT
              })
            ],
            verticalAlign: VerticalAlign.CENTER
          })
        ]
      })
    );
  });

  const doc = new Document({
    sections: [{
      children: [
        // Header with legal basis
        new Paragraph({
          children: [
            new TextRun({
              text: `Согласно член 490 од Законот за трговските друштва (Службен весник на РМ бр. 28/04), а во врска со Актот за основање на Друштво за ${companyName} со седиште на ул. ${companyAddress} Скопје, содружниците на ден ${decisionDate} година ја донесоа следната:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'ОДЛУКА ЗА ИСПЛАТА НА ДИВИДЕНДА', bold: true, size: 28 })
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
              text: `Содружниците на Друштвото ${companyName} одлучија да исплатат дивиденда од остварената добивка за ${profitYear} година во износ од ${profitAmount} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Вкупниот износ наменет за исплата на дивиденда изнесува ${totalDividendAmount} денари.`
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
              text: 'Износот на дивидендата, за секој содружник поединечно се утврдува врз основа на уделите во Друштвото, според Книгата на удели и Тековна состојба од друштвото од централниот регистар на РМ.'
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
              text: 'На секој содружник поединечно ќе му се исплати дел од дивидендата според нивните удели во друштвото според износите во следната табела:'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Shareholders table
        new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          }
        }),

        // Tax note below table
        new Paragraph({
          children: [
            new TextRun({
              text: '* Износите на дивиденда за исплата се во бруто износ, 10 % од бруто износот треба да се плати персонален данок на доход.',
              size: 20,
              italics: true
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400, before: 200, line: 276 }
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
              text: `Дивидендата ќе се ислати на транскациска сметка на содружниците во текот на ${paymentYear} годината.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 5
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Се задолжува управителот на Друштвото да ја спроведе одлуката.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 6
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Одлуката важи од денот на нејзиното донесување.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: "Претседавач:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "______________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateDividendPaymentDecisionDoc;
