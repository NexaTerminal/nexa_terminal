const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

/**
 * Generate Termination by Employee Request Document
 * Based on Article 71 of the Macedonian Labor Law
 * Creative integration of variables into legal decision structure
 */
function generateTerminationByEmployeeRequestDoc(formData, user, company) {
  // Extract company information with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract form data with fallbacks
  const employeeName = formData?.employeeName || '[Име на работник]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  const requestNumber = formData?.requestNumber || '[Број на барање]';
  
  // Handle dates for calculations and formatting
  const requestDateObj = formData?.requestDate ? moment(formData.requestDate) : moment();
  const employmentEndDateObj = formData?.employmentEndDate ? moment(formData.employmentEndDate) : moment().add(30, 'days');
  const decisionDateObj = formData?.decisionDate ? moment(formData.decisionDate) : moment();
  
  const requestDate = requestDateObj.format('DD.MM.YYYY');
  const employmentEndDate = employmentEndDateObj.format('DD.MM.YYYY');
  const decisionDate = decisionDateObj.format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        // Legal basis and opening statement
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на член 71 ст. 1 од Законот за работните односи, (Службен весник на Република Македонија бр. 167/15 Пречистен текст и подоцнежните измени на законот), работодавачот - `, 
              bold: false 
            }),
            new TextRun({ text: companyName, bold: true }),
            new TextRun({ 
              text: `, со седиште на `, 
              bold: false 
            }),
            new TextRun({ text: companyAddress, bold: true }),
            new TextRun({ 
              text: `, претставуван преку Управителот `, 
              bold: false 
            }),
            new TextRun({ text: companyManager, bold: true }),
            new TextRun({ 
              text: `, на ${decisionDate} година, го донесе следното:`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'РЕШЕНИЕ', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'За престанок на работен однос', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Main content - employee request details
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Работникот `, 
              bold: false 
            }),
            new TextRun({ text: employeeName, bold: true }),
            new TextRun({ 
              text: `, на работно место `, 
              bold: false 
            }),
            new TextRun({ text: jobPosition, bold: true }),
            new TextRun({ 
              text: ` поднесе барање бр. `, 
              bold: false 
            }),
            new TextRun({ text: requestNumber, bold: true }),
            new TextRun({ 
              text: ` од ${requestDate} година со кое бара да му престане работниот однос заклучно со ${employmentEndDate} година.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Notice period compliance
        new Paragraph({
          children: [
            new TextRun({ 
              text: `От денот на поднесување на барањето на работникот до денот на донесување на ова Решение изминат е отказниот рок договорен со Договорот за вработување, што согласно Законот за работните односи претставува отказниот рок кој работникот е должен да го почитува.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Legal compliance statement
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Со оглед на тоа што се исполнети условите за престанок на работниот однос предвидени во чл.71 ст.1 од Законот, се одлучи како во диспозитивот на ова Решение.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Legal instruction section
        new Paragraph({
          children: [
            new TextRun({ text: 'Правна поука:', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ 
              text: `Против ова решение работникот има право на приговор во рок од 8 дена од приемот на истото до Управниот орган на друштвото (надлежниот орган на друштвото).`, 
              bold: true 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Decision date
        new Paragraph({
          children: [
            new TextRun({ text: `${decisionDate} година.`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 600 }
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
        }),

      ]
    }]
  });

  return { doc };
}

module.exports = generateTerminationByEmployeeRequestDoc;