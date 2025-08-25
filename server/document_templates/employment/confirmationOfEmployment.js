const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = require('docx');
const moment = require('moment');

function generateConfirmationOfEmploymentDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
  const companyManager = company?.manager || '[Управител]';
  const certificateDate = formData.certificateDate ? moment(formData.certificateDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const employeeName = formData.employeeName || '[Име на вработен]';
  const employeeAddress = formData.employeeAddress || '[Адреса на вработен]';
  const employeePIN = formData.employeePIN || '[ЕМБГ]';
  const jobPosition = formData.jobPosition || '[Работно место]';
  const agreementDurationType = formData.agreementDurationType || '[Тип на договор]';
  const definedDuration = formData.definedDuration || '';

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `Врз основа на одредбите од Законот за работните односи, ${companyName} со седиште на ул. ${companyAddress}, Република Северна Македонија, со ЕМБС ${companyNumber}, претставувано од ${companyManager}, како работодавач, на ден ${certificateDate} година, ја донесе следната:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "ПОТВРДА", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "за работен однос на работник", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Со оваа потврда, ${companyName} потврдува дека работникот ${employeeName} со адреса на живеење ул.${employeeAddress}, ЕМБГ ${employeePIN}, е во редовен работен однос и е ангажиран на работно место „${jobPosition}“.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот за вработување со работникот е склучен на ${agreementDurationType}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
  ];

  if (definedDuration) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `и тоа до ${definedDuration} година, до кога е и важноста на оваа потврда. Доколку договорот е продолжен, ќе биде издадена и дополнителна потврда соодветна на времетраењето на таквиот договор.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Оваа потврда претставува соодветен доказ за работниот однос на горенаведениот работник и истата може да биде искористена пред државни органи, државни институции и сите други државни и/или приватни правни лица.",
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "За Друштвото" }),
      ],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({ text: "" }),
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "" })],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
            new TableCell({
              children: [
                new Paragraph({ text: "_________________________", alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `${companyName} ${companyManager}`, alignment: AlignmentType.RIGHT }),
              ],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
          ],
        }),
      ],
      width: { size: 100, type: 'pct' },
      borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return { doc };
}

module.exports = generateConfirmationOfEmploymentDoc; 