const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

/**
 * Generate Termination Decision Due to Personal Reasons Document
 * Based on Macedonian Labor Law Article 77 - Personal reasons termination
 * Creates a professional decision document for terminating employment contract
 */
function generateTerminationPersonalReasonsDoc(formData, user, company) {
  // Extract company information with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract form data with fallbacks
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeePin = formData?.employeePin || '[ЕМБГ на работник]';
  const employeeAddress = formData?.employeeAddress || '[Адреса на работник]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  const personalReasonDescription = formData?.personalReasonDescription || '[Опис на лични причини]';
  
  // Handle dates for formatting
  const contractStartDateObj = formData?.contractStartDate ? moment(formData.contractStartDate) : moment();
  const terminationDateObj = formData?.terminationDate ? moment(formData.terminationDate) : moment();
  const documentDateObj = formData?.documentDate ? moment(formData.documentDate) : moment();
  
  const contractStartDate = contractStartDateObj.format('DD.MM.YYYY');
  const terminationDate = terminationDateObj.format('DD.MM.YYYY');
  const documentDate = documentDateObj.format('DD.MM.YYYY');
  const currentDate = moment().format('DD.MM.YYYY');
  
  // Calculate employment duration
  const employmentDurationMonths = terminationDateObj.diff(contractStartDateObj, 'months');
  const employmentDurationYears = Math.floor(employmentDurationMonths / 12);
  const remainingMonths = employmentDurationMonths % 12;

  const doc = new Document({
    sections: [{
      children: [
        // Document header with number and date
        new Paragraph({
          children: [
            new TextRun({ text: `Бр. _____ од ${documentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400, line: 276 }
        }),

        // Legal basis introduction
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на член 77 став 1 точка 1 од Законот за работни односи („Службен весник на Република Македонија" бр. 167/15, 27/16, 120/18, 110/19, 267/20 и 151/21), работодавачот `, 
              bold: false 
            }),
            new TextRun({ text: companyName, bold: true }),
            new TextRun({ 
              text: `, со седиште на ул. `, 
              bold: false 
            }),
            new TextRun({ text: companyAddress, bold: true }),
            new TextRun({ 
              text: `, со ЕМБС `, 
              bold: false 
            }),
            new TextRun({ text: companyNumber, bold: true }),
            new TextRun({ 
              text: `, претставувано од управителот `, 
              bold: false 
            }),
            new TextRun({ text: companyManager, bold: true }),
            new TextRun({ 
              text: `, на ден ${documentDate} година, ја донесе следната:`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'ОДЛУКА', bold: true, size: 28 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'за престанок на договор за вработување', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'од лични причини на страна на работникот', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400, line: 276 }
        }),

        // Decision content
        new Paragraph({
          children: [
            new TextRun({ 
              text: `На работникот `, 
              bold: false 
            }),
            new TextRun({ text: employeeName, bold: true }),
            new TextRun({ 
              text: `, со ЕМБГ `, 
              bold: false 
            }),
            new TextRun({ text: employeePin, bold: true }),
            new TextRun({ 
              text: `, со живеалиште на ул. `, 
              bold: false 
            }),
            new TextRun({ text: employeeAddress, bold: true }),
            new TextRun({ 
              text: `, вработен во ${companyName} на работната позиција `, 
              bold: false 
            }),
            new TextRun({ text: jobPosition, bold: true }),
            new TextRun({ 
              text: `, му престанува договорот за вработување од лични причини на страна на работникот, со датум `, 
              bold: false 
            }),
            new TextRun({ text: terminationDate, bold: true }),
            new TextRun({ 
              text: ` година.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Reasoning section
        new Paragraph({
          children: [
            new TextRun({ text: 'О Б Р А З Л О Ж Е Н И Е', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300, line: 276 }
        }),

        // Employment details
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Работникот ${employeeName} е вработен во ${companyName} врз основа на Договорот за вработување склучен на ден ${contractStartDate} година, на работната позиција ${jobPosition}. Вкупното време на работниот однос изнесува `, 
              bold: false 
            }),
            new TextRun({ 
              text: employmentDurationYears > 0 ? `${employmentDurationYears} години` : '', 
              bold: true 
            }),
            new TextRun({ 
              text: employmentDurationYears > 0 && remainingMonths > 0 ? ' и ' : '', 
              bold: false 
            }),
            new TextRun({ 
              text: remainingMonths > 0 ? `${remainingMonths} месеци` : '', 
              bold: true 
            }),
            new TextRun({ 
              text: `.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Personal reasons description
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Согласно барањето на работникот и утврдените лични причини кои се состојат во `, 
              bold: false 
            }),
            new TextRun({ text: personalReasonDescription, bold: true, underline: {} }),
            new TextRun({ 
              text: `, работодавачот одлучи да го прекине работниот однос со работникот со датум ${terminationDate} година.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Legal basis
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Согласно член 77 став 1 точка 1 од Законот за работни односи, договорот за вработување престанува по сила на закон кога работникот ќе наполни услови за стекнување право на старосна пензија или кога поради лични причини на страна на работникот, не може да ги извршува работните обврски. Во конкретниот случај, личните причини се утврдени и документирани согласно законските процедури.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Final obligations and rights
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Работникот има право на сите надоместоци и бенефиции до датумот на престанок на работниот однос, согласно Законот за работни односи, колективниот договор и интерниот правилник на работодавачот. Работодавачот ќе изврши конечно пресметување на сите потребни надоместоци во рок утврден со закон.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Legal notice for appeal
        new Paragraph({
          children: [
            new TextRun({ text: 'ПРАВНА ПОУКА', bold: true, size: 22 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ 
              text: `Против оваа одлука, работникот има право да поднесе тужба пред надлежниот суд во рок од 30 дена од денот на приемот на одлуката, согласно член 194 од Законот за работни односи.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Date and location
        new Paragraph({
          children: [
            new TextRun({ text: `Скопје, ${currentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400, line: 276 }
        }),

        // Employer signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работодавачот:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),
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
          spacing: { after: 400, line: 276 }
        }),

        // Employee signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работникот:" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 200, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: employeeName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
        }),

        // Administrative note
        new Paragraph({ text: '', spacing: { after: 400 } }),
        
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Забелешка: Оваа одлука се доставува до работникот, до надлежната организациона единица за човечки ресурси, до сметководствениот сектор за конечно пресметување, како и до архивата на работодавачот за чување во персоналното досие на работникот.`, 
              bold: false,
              italics: true,
              size: 18
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          border: {
            top: { style: 'single', size: 1 },
            bottom: { style: 'single', size: 1 },
            left: { style: 'single', size: 1 },
            right: { style: 'single', size: 1 }
          },
          indent: { left: 200, right: 200 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateTerminationPersonalReasonsDoc;