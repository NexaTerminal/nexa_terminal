const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateDeathCompensationDecisionDoc(formData, user, company) {
  // CRITICAL: Extract company data from user.companyInfo parameter
  // Company parameter MUST come from user.companyInfo in controller
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  const decisionDate = formData.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const employeeName = formData.employeeName || '[Име на вработен]';
  const familyMember = formData.familyMember || '[Член на семејно домаќинство]';
  const compensationAmount = formData.compensationAmount || '[Износ]';
  const paymentDate = formData.paymentDate ? moment(formData.paymentDate).format('DD.MM.YYYY') : '[Датум на исплата]';

  // Convert compensation amount to proper denars format (1.000,00 денари)
  const formatCurrency = (amount) => {
    if (!amount) return '[Износ] денари';
    // Remove any existing formatting
    const cleanAmount = amount.toString().replace(/[^\d]/g, '');
    if (!cleanAmount) return '[Износ] денари';

    // Convert to number and format
    const num = parseInt(cleanAmount);
    return `${num.toLocaleString('mk-MK')},00 денари`;
  };

  const formattedAmount = formatCurrency(compensationAmount);

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `Врз основа на член 35 од Општиот колективен договор за приватниот сектор од областа на стопанството, ${companyName} со адреса на ул. ${companyAddress}, претставувано од страна на Управителот ${companyManager} на ${decisionDate} година, донесе`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "О Д Л У К А", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "за исплата на надомест во случај на смрт", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "на член на семејно домаќинство", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `На работникот ${employeeName} му се исплаќа надомест во случај на смрт на член на семејно домаќинство – ${familyMember}, во висина од две месечни просечни нето плати исплатени во Република Македонија во последните три месеци, односно ${formattedAmount}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Надоместот на работникот ќе му се исплати по донесувањето на одлуката, односно на ${paymentDate} година.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "Одлуката да се достави до:" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "- Финансиската служба;" }),
      ],
      alignment: AlignmentType.LEFT,
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "- работникот и" }),
      ],
      alignment: AlignmentType.LEFT,
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "- Архивата" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "Управител" }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200, line: 276 }
    }),

    // Signature section - using simple line format
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
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return { doc };
}

module.exports = generateDeathCompensationDecisionDoc;