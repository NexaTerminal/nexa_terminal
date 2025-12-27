const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

function generateTerminationDecisionDueToDurationDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract form data
  const employeeName = formData?.employeeName || '[Име на вработен]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  const employmentEndDate = formData?.employmentEndDate ? moment(formData.employmentEndDate).format('DD.MM.YYYY') : '[Датум на престанок]';
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : '[Датум на одлука]';
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : '[Датум на договор]';

  const doc = new Document({
    sections: [{
      children: [
        // Header paragraph with legal basis
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на член 46, член 62 став 1 точка 1 и член 64 од Законот за работните односи, (Службен весник на Република Македонија бр. 167/15 Пречистен текст и подоцнежните измени на законот), работодавачот, ${companyName}, со седиште на ${companyAddress}, претставувано од ${companyManager}, на ден ${decisionDate} година, ја донесе следната:`,
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),
        
        // Title - ОДЛУКА
        new Paragraph({
          children: [
            new TextRun({ text: 'ОДЛУКА', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        
        // Subtitle
        new Paragraph({
          children: [
            new TextRun({ text: 'за престанок на Договорот за вработување поради истек на времето за кое бил склучен', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300, line: 276 }
        }),
        
        // Main content paragraph
        new Paragraph({
          children: [
            new TextRun({ 
              text: `На вработениот ${employeeName}, вработен на работна позиција ${jobPosition}, на ден ${employmentEndDate} година, му престанува работниот однос поради истек на времето на договорот за вработување.`,
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),
        
        // Образложение title
        new Paragraph({
          children: [
            new TextRun({ text: 'Образложение', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),
        
        // First paragraph of explanation
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${companyName}, како работодавач и ${employeeName}, како работник, на ден ${agreementDate} година, склучија Договор за вработување на определено време (во понатамошниот текст: Договорот).`,
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),
        
        // Second paragraph
        new Paragraph({
          children: [
            new TextRun({ text: 'Согласно Договорот, е наведено дека истиот е склучен на определено времетраење.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),
        
        // Third paragraph - legal reference
        new Paragraph({
          children: [
            new TextRun({ text: 'Согласно на ова, а врз основа на член 64 од Законот за работните односи со кој е предвидено дека:', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),
        
        // Legal provision quote
        new Paragraph({
          children: [
            new TextRun({ 
              text: 'Договорот за вработување на определено работно време престанува да важи со изминувањето на рокот за којшто бил склучен, односно кога договорената работа е завршена или со престанувањето на причината заради којашто бил склучен.',
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),
        
        // Concluding paragraph
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на горенаведеното, вработениот се ослободува од обврската за извршување на работи и работни задачи во корист на работодавачот после ${employmentEndDate} година.`,
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),
        
        // Date
        new Paragraph({
          children: [
            new TextRun({ text: `${decisionDate} година.`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),
        
        // Signature
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName }),
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

module.exports = generateTerminationDecisionDueToDurationDoc;