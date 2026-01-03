const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Annual Leave Bonus Decision Document Template
 * Generates decision document for annual leave bonus payment (standard amount)
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateAnnualLeaveBonusDecisionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Form data
  const annualLeaveYear = formData?.annualLeaveYear || new Date().getFullYear().toString();
  const bonusAmount = formData?.bonusAmount ?
    `${parseInt(formData.bonusAmount).toLocaleString('mk-MK')},00 денари` :
    '[Износ на регрес]';
  const paymentDate = formData?.paymentDate ?
    moment(formData.paymentDate).format('DD.MM.YYYY') :
    '[Датум на исплата]';
  const decisionDate = formData?.decisionDate ?
    moment(formData.decisionDate).format('DD.MM.YYYY') :
    moment().format('DD.MM.YYYY');

  const sections = [{
      children: [
        // Legal basis header
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на член 35 од Општиот колективен договор за приватниот сектор од областа на стопанството ${companyName} со адреса на ул. ${companyAddress}, претставувано од страна на Управителот ${companyManager} на ${decisionDate} година, донесе`
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
              text: 'За исплата на регрес за годишен одмор',
              bold: true,
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Main content paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `На вработените им се исплаќа регрес за користење годишен одмор за ${annualLeaveYear} година, во висина од ${bonusAmount}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Payment date paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Регресот за годишен одмор ќе се исплати ${paymentDate} година.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Eligibility criteria paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: `Право на регрес за годишен одмор имаат работниците кои се стекнале со право на користење годишен одмор и кои ќе се стекнат со тоа право во текот на ${annualLeaveYear} година.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Funding source paragraph
        new Paragraph({
          children: [
            new TextRun({
              text: 'Средствата за исплата на регресот ќе се обезбедат од тековното работење.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600 }
        }),

        // Distribution notice
        new Paragraph({
          children: [
            new TextRun({ text: 'Одлуката да се достави до:' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- Финансиската служба;' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- Архивата' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 600 }
        }),

        // Company signature section
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName }),
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
    }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateAnnualLeaveBonusDecisionDoc;