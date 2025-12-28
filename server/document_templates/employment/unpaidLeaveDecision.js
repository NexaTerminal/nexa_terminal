const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateUnpaidLeaveDecisionDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  const employeeName = formData.employeeName || '[Име на вработен]';
  const unpaidLeaveDuration = formData.unpaidLeaveDuration || '[Времетраење]';
  const startingDate = formData.startingDate ? moment(formData.startingDate).format('DD.MM.YYYY') : '[Почетен датум]';

  // Calculate return date: start date + duration in months + 1 day
  let startingWorkDate = '[Датум за враќање]';
  if (formData.startingDate && formData.unpaidLeaveDuration) {
    const returnDate = moment(formData.startingDate)
      .add(parseInt(formData.unpaidLeaveDuration), 'months')
      .add(1, 'day');
    startingWorkDate = returnDate.format('DD.MM.YYYY');
  }

  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на член 147 од Законот за работните односи, и ${companyName}, со адреса ${companyAddress}, претставувано од Управителот ${companyManager} на барање на работникот ${employeeName}, на ден ${currentDate} година ја донесе следната:`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'О Д Л У К А', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'за одобрување неплатено отсуство', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

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
              text: `На работникот ${employeeName} му се одобрува неплатено отсуство од работа во траење од ${unpaidLeaveDuration} ${parseInt(unpaidLeaveDuration) === 1 ? 'месец' : 'месеци'}, почнувајќи од ${startingDate} година.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `По завршувањето на неплатеното отсуство работникот има право и должност да се врати на работа на ${startingWorkDate} година. Доколку работникот не се јави на работа во определениот ден, се смета дека ја прекршил работната дисциплина и работниот ред.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

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
              text: 'За време на неплатеното отсуство, на работникот нема да му се исплатува надомест на плата и придонеси од плата.',
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

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
              text: 'За време на неплатеното отсуство, на работникот му мируваат правата и обврските од работен однос.',
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 500 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Примерок од одлуката да се достави до:', bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- работникот;', bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- архива', bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 500 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '___________________________', bold: false })
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: companyName, bold: false })
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `Управител ${companyManager}`, bold: false })
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300, line: 276 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateUnpaidLeaveDecisionDoc;