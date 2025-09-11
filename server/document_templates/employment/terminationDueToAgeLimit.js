const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

/**
 * Generate Termination Due to Age Limit Decision Document
 * Based on Article 104 of Macedonian Labor Law
 * Professional legal document for age-based employment termination
 */
function generateTerminationDueToAgeLimitDoc(formData, user, company) {
  // Extract company information with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract form data with fallbacks
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeePin = formData?.employeePin || '[ЕМБГ на работник]';
  
  // Handle dates for calculations and formatting
  const decisionDateObj = formData?.decisionDate ? moment(formData.decisionDate) : moment();
  const employmentEndDateObj = formData?.employmentEndDate ? moment(formData.employmentEndDate) : moment();
  
  const decisionDate = decisionDateObj.format('DD.MM.YYYY');
  const employmentEndDate = employmentEndDateObj.format('DD.MM.YYYY');
  
  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        // Legal basis paragraph
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на чл. 104 од Законот за работни односи (Сл. Весник на РМ бр. 167/15 – Пречистен текст), работодавачот `, 
              bold: false 
            }),
            new TextRun({ text: companyName, bold: true }),
            new TextRun({ 
              text: `, со седиште на `, 
              bold: false 
            }),
            new TextRun({ text: companyAddress, bold: true }),
            new TextRun({ 
              text: `, со ЕМБС `, 
              bold: false 
            }),
            new TextRun({ text: companyNumber, bold: true }),
            new TextRun({ 
              text: `, претставувано од `, 
              bold: false 
            }),
            new TextRun({ text: companyManager, bold: true }),
            new TextRun({ 
              text: `, на ден `, 
              bold: false 
            }),
            new TextRun({ text: decisionDate, bold: true }),
            new TextRun({ 
              text: ` година, ја донесе следната:`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'РЕШЕНИЕ', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Document subtitle
        new Paragraph({
          children: [
            new TextRun({ text: 'за престанок за работен однос поради возраст', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Main decision content
        new Paragraph({
          children: [
            new TextRun({ 
              text: `На работникот `, 
              bold: false 
            }),
            new TextRun({ text: employeeName, bold: true }),
            new TextRun({ 
              text: ` со ЕМБГ `, 
              bold: false 
            }),
            new TextRun({ text: employeePin, bold: true }),
            new TextRun({ 
              text: `, вработен во `, 
              bold: false 
            }),
            new TextRun({ text: companyName, bold: true }),
            new TextRun({ 
              text: `, му престанува работниот однос во друштвото заклучно со `, 
              bold: false 
            }),
            new TextRun({ text: employmentEndDate, bold: true }),
            new TextRun({ 
              text: ` година, поради возраст.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Explanation section title
        new Paragraph({
          children: [
            new TextRun({ text: 'Образложение', bold: false, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        // Detailed explanation
        new Paragraph({
          children: [
            new TextRun({ 
              text: `На работникот `, 
              bold: false 
            }),
            new TextRun({ text: employeeName, bold: true }),
            new TextRun({ 
              text: ` му престанува работниот однос во `, 
              bold: false 
            }),
            new TextRun({ text: companyName, bold: true }),
            new TextRun({ 
              text: ` поради исполнување на возраст од 64 години и 15 години работен стаж врз основа на членот 104 од Законот за работни односи. Согласно на ова, работникот се здобива со право на пензија.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Legal remedy
        new Paragraph({
          children: [
            new TextRun({ 
              text: `ПРАВНА ПОУКА: Незадоволната странка на ова Решение има право на приговор до надлежниот орган во рок од 8 (осум) дена од денот на врачувањето.`, 
              bold: true 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Distribution list
        new Paragraph({
          children: [
            new TextRun({ text: 'ДОСТАВЕНО ДО:', bold: true })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- архива', bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '- работникот', bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Decision date
        new Paragraph({
          children: [
            new TextRun({ text: `Одлучено на: ${decisionDate} година.`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 600 }
        }),

        // Signature
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

module.exports = generateTerminationDueToAgeLimitDoc;