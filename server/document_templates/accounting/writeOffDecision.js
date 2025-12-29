const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const moment = require('moment');

/**
 * Write-off Decision Document Template
 * Generates decision for write-off of receivables or liabilities
 * Based on accounting best practices and positive legal provisions
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateWriteOffDecisionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Одговорно лице]';

  // Extract city from company address (take last part after comma, or use full address)
  const city = companyAddress.includes(',') ? companyAddress.split(',').pop().trim() : companyAddress;

  // Form data
  const writeOffType = formData?.writeOffType || 'ПОБАРУВАЊА';
  const writeOffItems = formData?.writeOffItems || [];
  const date = formData?.date ? moment(formData.date) : moment();

  // Determine type text for document
  const typeText = writeOffType === 'ПОБАРУВАЊА' ? 'побарувања' : 'обврски';
  const typeDescription = writeOffType === 'ПОБАРУВАЊА'
    ? 'побарувања'
    : 'обврски';

  // Table borders configuration
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  };

  // Create table rows for write-off items
  const tableRows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: writeOffType === 'ПОБАРУВАЊА' ? 'Побарување од' : 'Обврска кон',
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: tableBorders,
          width: { size: 50, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Износ', bold: true })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: tableBorders,
          width: { size: 25, type: WidthType.PERCENTAGE }
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Евидентирано на с-ка', bold: true })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: tableBorders,
          width: { size: 25, type: WidthType.PERCENTAGE }
        })
      ]
    }),
    // Data rows
    ...writeOffItems.map(item => {
      const partnerName = item.partnerName || '[Партнер]';
      const amount = item.amount ? `${parseFloat(item.amount).toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} денари` : '[Износ]';
      const accountNumber = item.accountNumber || '[Сметка]';

      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: partnerName })],
                alignment: AlignmentType.LEFT
              })
            ],
            borders: tableBorders
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: amount })],
                alignment: AlignmentType.RIGHT
              })
            ],
            borders: tableBorders
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: accountNumber })],
                alignment: AlignmentType.CENTER
              })
            ],
            borders: tableBorders
          })
        ]
      });
    })
  ];

  const doc = new Document({
    sections: [{
      children: [
          new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на Законот за данокот на добивка и останатата даночна регулатива, Друштвото ${companyName} со седиште на улица ${companyAddress}, на ден ${date.format('DD.MM.YYYY')} донесува следнава:`,
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),
        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'ОДЛУКА ЗА ОТПИС', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Main introduction paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на позитивните законски одредби и најдобрите расположиви проценки темелени на досегашните искуства, раководните лица на ${companyName} со седиште на улица ${companyAddress} од Скопје, Р. Македонија, донесоа одлука за отпис на на сметки кои по својата економска суштина се ${typeDescription}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Legal basis paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: writeOffType === 'ПОБАРУВАЊА'
                ? 'Одлуката се донесува врз основа на фактот што од овие побарувања не е разумно да се очекуваат идни економски користи, односно врз основа на очекуваната ненаплатливост на побарувањата.'
                : 'Обврските се отпишуваат заради застареност.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Distribution instruction
        new Paragraph({
          children: [
            new TextRun({
              text: 'Одлуката да се достави и проследи до сите служби и надворешни деловни партнери (клиенти и добавувачи) кои се тангирани за понатамошна обработка.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Table with write-off items
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          }
        }),

        // Spacing after table
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 600 }
        }),

        // Date and location
        new Paragraph({
          children: [
            new TextRun({ text: `${city}  ${date.format('DD.MM.YYYY')}` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400, line: 276 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: "Одговорно лице:" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateWriteOffDecisionDoc;
