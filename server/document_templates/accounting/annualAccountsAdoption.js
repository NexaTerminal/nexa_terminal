const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Annual Accounts Adoption Decision Document Template
 * Generates decision for adoption of annual accounts, financial statements and annual report
 * Based on Article 215 paragraph 1 point 1 of the Law on Trading Companies
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateAnnualAccountsAdoptionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';

  // Form data
  const articleNumber = formData?.articleNumber || '[Број на член]';
  const meetingDate = formData?.meetingDate ? moment(formData.meetingDate).format('DD.MM.YYYY') : '[Датум]';
  const year = formData?.year || '[Година]';
  const managerName = formData?.managerName || '[Име на управител]';
  const city = formData?.city || 'Скопје';
  const date = formData?.date ? moment(formData.date).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const chairman = formData?.chairman || '[Претседавач]';

  // Financial amounts - format as Macedonian currency (1.000,00 денари)
  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('mk-MK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const revenues = formatAmount(formData?.revenues || 0);
  const expenses = formatAmount(formData?.expenses || 0);
  const profitBeforeTax = formatAmount(formData?.profitBeforeTax || 0);
  const taxOnExpenses = formatAmount(formData?.taxOnExpenses || 0);
  const profitAfterTax = formatAmount(formData?.profitAfterTax || 0);

  const doc = new Document({
    sections: [{
      children: [
        // Legal basis header
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на член 215 став 1 точка 1) од ЗТД - кај друштвото со ограничена одговорност, и член ${articleNumber} од Договорот за друштвото (односно Статутот), на седницата одржана на ${meetingDate} година донесе`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title - spaced letters
        new Paragraph({
          children: [
            new TextRun({ text: 'О Д Л У К А', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        // Subtitle line 1
        new Paragraph({
          children: [
            new TextRun({ text: 'за усвојување на годишната сметка, финансиските извештаи и годишниот извештај' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100, line: 276 }
        }),

        // Subtitle line 2
        new Paragraph({
          children: [
            new TextRun({ text: `за работење за ${year} година на ${companyName}` })
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
              text: `Се усвојува годишната сметка, финансиските извештаи и годишниот извештај за работењето на друштвото за ${year} на ${companyName} со остварен финансиски резултат од работењето:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Financial results table (numbered list)
        new Paragraph({
          children: [
            new TextRun({ text: `1) Остварени приходи` }),
            new TextRun({ text: `                                    ${revenues} денари` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 150, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `2) Остварени расходи` }),
            new TextRun({ text: `                                    ${expenses} денари` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 150, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `3) Остварена добивка пред оданочување (1 - 2)` }),
            new TextRun({ text: `          ${profitBeforeTax} денари` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 150, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `4) Данок на непризнаени расходи` }),
            new TextRun({ text: `                         ${taxOnExpenses} денари` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 150, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `5) Остварена добивка по оданочување (3 - 4)` }),
            new TextRun({ text: `          ${profitAfterTax} денари` })
          ],
          alignment: AlignmentType.LEFT,
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
              text: `Се одобрува работата на Управителот ${managerName}, (членовите на одборот на директорите, односно управниот и надзорниот одбор) во тековната година.`
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
            new TextRun({ text: 'Составен дел на оваа одлука е:' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        // Bullet point list
        new Paragraph({
          children: [
            new TextRun({ text: '• Билансот на успехот и Билансот на состојбата,' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '• Одлуката за одобрување на работата на управителот (на одборот на директорите, односно управниот и надзорниот одбор);' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '• Одлуката за распоредување на добивката (или покривање на загуба);' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '• Одлука за плаќање на дивиденда' })
          ],
          alignment: AlignmentType.LEFT,
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
            new TextRun({ text: 'Оваа одлука влегува во сила со денот на донесувањето.' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: `${city}  ${date}` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '                        М.П     Собир на содружниците' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `Претседавач: ${chairman}` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '______________________' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateAnnualAccountsAdoptionDoc;
