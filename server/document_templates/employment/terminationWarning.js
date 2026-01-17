const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

/**
 * Generate Termination Warning Document
 * Creative integration of variables into legal text structure
 * Based on Macedonian Labor Law disciplinary procedures
 */
function generateTerminationWarningDoc(formData, user, company) {
  // Extract company information with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract form data with fallbacks
  const employeeName = formData?.employeeName || '[Име на работник]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  const workTaskFailure = formData?.workTaskFailure || '[Обврска која не е исполнета]';
  const employeeWrongDoing = formData?.employeeWrongDoing || '[Постапување спротивно на обврската]';
  
  // Handle dates for calculations and formatting
  const decisionDateObj = formData?.decisionDate ? moment(formData.decisionDate) : moment();
  const fixingDeadlineObj = formData?.fixingDeadline ? moment(formData.fixingDeadline) : moment().add(15, 'days');
  
  const decisionDate = decisionDateObj.format('DD.MM.YYYY');
  const fixingDeadline = fixingDeadlineObj.format('DD.MM.YYYY');
  
  const currentDate = moment().format('DD.MM.YYYY');

  const sections = [{
      children: [
        // Header section with company information
        // new Paragraph({
        //   children: [
        //     new TextRun({ text: companyName, bold: true, size: 24 })
        //   ],
        //   alignment: AlignmentType.CENTER,
        //   spacing: { after: 200 }
        // }),
        
        // new Paragraph({
        //   children: [
        //     new TextRun({ text: `Седиште: ${companyAddress}`, size: 20 }),
        //     new TextRun({ text: `\nЕМБС: ${companyNumber}`, size: 20 })
        //   ],
        //   alignment: AlignmentType.CENTER,
        //   spacing: { after: 400 }
        // }),

        // Document title
        // new Paragraph({
        //   children: [
        //     new TextRun({ text: 'ПРЕДУПРЕДУВАЊЕ', bold: true, size: 28 })
        //   ],
        //   alignment: AlignmentType.CENTER,
        //   spacing: { after: 200 }
        // }),

        // new Paragraph({
        //   children: [
        //     new TextRun({ text: 'пред откажување на договор за вработување', bold: true, size: 24 })
        //   ],
        //   alignment: AlignmentType.CENTER,
        //   spacing: { after: 400 }
        // }),

        // Document number and date - creatively integrated
        // new Paragraph({
        //   children: [
        //     new TextRun({ text: `Бр. _____ од ${decisionDate} година`, bold: false })
        //   ],
        //   alignment: AlignmentType.LEFT,
        //   spacing: { after: 300, line: 276 }
        // }),

        // Main content - creative integration of variables
        new Paragraph({
          children: [
            new TextRun({
              text: `Врз основа на член 77 од Законот за работни односи („Службен весник на Република Македонија" бр. 167/15, 27/16), а во врска со утврдени неправилности во работата и однесувањето на вработениот `,
              bold: false
            }),
            new TextRun({ text: employeeName, bold: true }),
            new TextRun({
              text: `, вработен на работната позиција `,
              bold: false
            }),
            new TextRun({ text: jobPosition, bold: true }),
            new TextRun({
              text: ` кај ${companyName}, му се издава ова:`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // ПРЕДУПРЕДУВАЊЕ section
        new Paragraph({
          children: [
            new TextRun({ text: 'ПРЕДУПРЕДУВАЊЕ', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300, line: 276 }
        }),

        // Creative narrative integration of the violation
        new Paragraph({
          children: [
            new TextRun({
              text: `Со ова предупредување Ве известуваме дека на ден ${decisionDate} година, врз основа на спроведена анализа и утврдени факти, констатирано е дека како вработен кај ${companyName} не ја исполнувате Вашата основна работна обврска која се состои во `,
              bold: false
            }),
            new TextRun({ text: workTaskFailure, bold: true, underline: {} }),
            new TextRun({
              text: `.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Detailed description of the wrongdoing - creatively woven
        new Paragraph({
          children: [
            new TextRun({
              text: `Конкретно, утврдено е дека Вашето постапување се манифестира преку `,
              bold: false
            }),
            new TextRun({ text: employeeWrongDoing, bold: true, underline: {} }),
            new TextRun({
              text: `, што претставува сериозно отстапување од стандардите на работење и професионалното однесување кои се очекуваат од вработен на Вашата позиција во ${companyName}.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Legal basis - creatively referenced
        new Paragraph({
          children: [
            new TextRun({
              text: `Ваквото постапување претставува повреда на работните обврски утврдени со Договорот за вработување како и општите начела на работната дисциплина и лојалност кон работодавачот, што согласно член 75 од Законот за работни односи може да биде основ за престанок на работниот однос по пат на откажување.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Warning and deadline - creatively integrated
        new Paragraph({
          children: [
            new TextRun({
              text: `Со оглед на сериозноста на ситуацијата, а во духот на фер и правичен пристап кон работните односи, ${companyName} Ве предупредува дека доколку не се преземат соодветни мерки за исправка на наведеното неправилно однесување во рок од `,
              bold: false
            }),
            new TextRun({ text: `${fixingDeadlineObj.diff(decisionDateObj, 'days')} дена`, bold: true }),
            new TextRun({
              text: ` сметано од денот на приемот на ова предупредување (најдоцна до ${fixingDeadline} година), ќе бидат преземени сите законски дозволени мерки, вклучувајќи и иницирање постапка за откажување на Договорот за вработување.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Expectations for improvement - creative integration
        new Paragraph({
          children: [
            new TextRun({
              text: `Во рамките на наведениот рок, од Вас се очекува целосно да ги исправите идентификуваните недостатоци во однос на `,
              bold: false
            }),
            new TextRun({ text: workTaskFailure, bold: true }),
            new TextRun({
              text: `, како и да преземете конкретни чекори за елиминирање на условите кои довеле до `,
              bold: false
            }),
            new TextRun({ text: employeeWrongDoing, bold: true }),
            new TextRun({
              text: `.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Professional development opportunity
        new Paragraph({
          children: [
            new TextRun({
              text: `${companyName} останува отворена за конструктивен дијалог и соработка во процесот на подобрување на Вашите работни перформанси. Ве повикуваме да ги искористите расположливите ресурси за професионален развој и да побарате поддршка од непосредното раководство доколку е потребна дополнителна насока или обука.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Final warning
        new Paragraph({
          children: [
            new TextRun({
              text: `Ова предупредување се издава во согласност со член 77 од Законот за работни односи и ќе биде чувано во Вашето персонално досие. Подвлекуваме дека неисполнувањето на барањата содржани во ова предупредување во предвидениот рок може да резултира со иницирање постапка за откажување на работниот однос без дополнително известување.`,
              bold: false
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: `Скопје, ${currentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300, line: 276 }
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

        // Legal notice
        new Paragraph({ text: '', spacing: { after: 300 } }),
        
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Правна поука: Согласно член 77 став 4 од Законот за работни односи, работникот има право на приговор против ова предупредување во рок од 8 дена од денот на приемот, до работодавачот.`, 
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
    }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateTerminationWarningDoc;