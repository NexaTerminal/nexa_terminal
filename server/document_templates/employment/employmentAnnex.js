const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

/**
 * Format number with Macedonian formatting (thousand separators and decimals)
 * Example: 60000 -> "60.000,00"
 */
function formatMacedonianNumber(number) {
  if (!number || isNaN(number)) return number;
  
  const num = parseFloat(number);
  return num.toLocaleString('mk-MK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Get change type description in Macedonian
 */
function getChangeTypeDescription(changeType) {
  switch (changeType) {
    case 'basicSalary':
      return 'промена на плата';
    case 'agreementDuration':
      return 'промена на времетраење';
    case 'jobPosition':
      return 'промена на работна позиција';
    case 'otherAgreementChange':
    default:
      return 'друга измена';
  }
}

/**
 * Generate Employment Annex Document
 * Creative integration of variables into legal annex structure
 * Based on Macedonian Labor Law employment agreement amendments
 */
function generateEmploymentAnnexDoc(formData, user, company) {
  // Extract company information with fallbacks
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.manager || '[Управител]';
  
  // Extract form data with fallbacks
  const employeeName = formData?.employeeName || '[Име на работник]';
  const employeePIN = formData?.employeePIN || '[ЕМБГ на работник]';
  const employeeAddress = formData?.employeeAddress || '[Адреса на работник]';
  const agreementNo = formData?.agreementNo || '[Број на договор]';
  const changeType = formData?.changeType || 'otherAgreementChange';
  
  // Handle dates
  const annexDateObj = formData?.annexDate ? moment(formData.annexDate) : moment();
  const annexDate = annexDateObj.format('DD.MM.YYYY');
  
  // Duration change specific data
  const durationType = formData?.durationType || '';
  const endDate = formData?.endDate ? moment(formData.endDate).format('DD.MM.YYYY') : '';
  const durationChangedArticle = formData?.durationChangedArticle || '';
  
  // Salary change specific data
  const newBasicSalary = formData?.newBasicSalary || '';
  const formattedSalary = newBasicSalary ? formatMacedonianNumber(newBasicSalary) : '';
  const salaryChangedArticle = formData?.salaryChangedArticle || '';
  
  // Position change specific data
  const newJobPosition = formData?.newJobPosition || '';
  const newJobTasks = formData?.newJobTasks || '';
  const positionChangedArticle = formData?.positionChangedArticle || '';
  
  // Other change specific data
  const changedArticle = formData?.changedArticle || '';
  const otherAgreementChangeContent = formData?.otherAgreementChangeContent || '';
  
  // Get the appropriate article number and change description
  let articleNumber = '';
  let changeDescription = getChangeTypeDescription(changeType);
  
  switch (changeType) {
    case 'agreementDuration':
      articleNumber = durationChangedArticle;
      break;
    case 'basicSalary':
      articleNumber = salaryChangedArticle;
      break;
    case 'jobPosition':
      articleNumber = positionChangedArticle;
      break;
    case 'otherAgreementChange':
    default:
      articleNumber = changedArticle;
      break;
  }
  
  const currentDate = moment().format('DD.MM.YYYY');

  // Build the document sections
  const children = [];

  // Document header
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'АНЕКС', bold: true, size: 28 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `кон ДОГОВОР ЗА ВРАБОТУВАЊЕ БР. ${agreementNo}`, bold: true, size: 22 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Introduction paragraph
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Склучен во Скопје на ${annexDate} година, помеѓу:`, bold: true })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    })
  );

  // Employer information
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '1. ', bold: false }),
        new TextRun({ text: companyName, bold: true }),
        new TextRun({ text: ` со седиште на ул. ${companyAddress}, Република Северна Македонија, со ЕМБС ${companyNumber}, претставувано од `, bold: false }),
        new TextRun({ text: companyManager, bold: true }),
        new TextRun({ text: ', како работодавач (во понатамошниот текст: "Работодавачот"); и', bold: false })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    })
  );

  // Employee information
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '2. ', bold: false }),
        new TextRun({ text: employeeName, bold: true }),
        new TextRun({ text: ` со адреса на живеење на ул. ${employeeAddress} со ЕМБГ ${employeePIN}, како работник (во натамошниот текст: "Работник")`, bold: false })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400 }
    })
  );

  // Content based on change type
  if (changeType === 'agreementDuration') {
    // Agreement duration change
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 1', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Врз основа на овој анекс, се изменува ${articleNumber} од Договорот за вработување бр. ${agreementNo}, кој се однесува на ${changeDescription}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 2', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    if (durationType === 'indefinite') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Договорот за вработување се склучува на неопределено време.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        })
      );
    } else if (durationType === 'definite' && endDate) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Договорот за вработување се склучува на определено време и ќе престане на ${endDate} година.`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        })
      );
    }
  }

  if (changeType === 'basicSalary') {
    // Basic salary change
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 1', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Врз основа на овој анекс, се изменува ${articleNumber} од Договорот за вработување бр. ${agreementNo}, кој се однесува на ${changeDescription}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 2', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Основната плата на работникот ќе изнесува ${formattedSalary} денари месечно.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );
  }

  if (changeType === 'jobPosition') {
    // Job position change
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 1', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Врз основа на овој анекс, се изменува ${articleNumber} од Договорот за вработување бр. ${agreementNo}, кој се однесува на ${changeDescription}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 2', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Работникот ќе ги извршува работите и работните задачи за позицијата ${newJobPosition}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );

    // Add job tasks if provided
    if (newJobTasks && newJobTasks.trim()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Работните задачи и обврски се: ${newJobTasks}`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        })
      );
    }
  }

  if (changeType === 'otherAgreementChange') {
    // Other agreement change
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 1', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Врз основа на овој анекс, се изменува ${articleNumber} од Договорот за вработување бр. ${agreementNo}, кој се однесува на ${changeDescription}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 2', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Новиот текст на ${articleNumber}, сега ќе гласи ${otherAgreementChangeContent}.`, bold: false })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300 }
      })
    );
  }

  // Determine next article number based on content
  let nextArticleNumber = 3;
  if (changeType === 'jobPosition' && newJobTasks && newJobTasks.trim()) {
    nextArticleNumber = 4; // Job position with tasks adds an extra article
  }

  // Standard closing articles
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${nextArticleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Останатите одредби од Договорот за вработување помеѓу работникот и работодавачот остануваат непроменети.', bold: false })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    })
  );

  nextArticleNumber++;

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${nextArticleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'За се што не е предвидено со овој Анекс ќе се применуваат одредбите од Законот за работните односи и останатите позитивни прописи.', bold: false })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    })
  );

  nextArticleNumber++;

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${nextArticleNumber}`, bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Овој Анекс е составен во 2 (два) примероци, по 1 (еден) примерок за секоја договорна страна.', bold: false })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400 }
    })
  );

  // Signature section
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Скопје, ${currentDate} година`, bold: false })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 }
    })
  );

  // Signature table
  children.push(
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ 
                  text: 'Работодавач', 
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 }
                }),
                new Paragraph({ 
                  text: '________________', 
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 }
                }),
                new Paragraph({ 
                  text: `${companyName} ${companyManager}`, 
                  alignment: AlignmentType.CENTER
                })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
            new TableCell({
              children: [
                new Paragraph({ 
                  text: 'Работник', 
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 }
                }),
                new Paragraph({ 
                  text: '________________', 
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 100 }
                }),
                new Paragraph({ 
                  text: employeeName, 
                  alignment: AlignmentType.CENTER
                })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    })
  );

  const doc = new Document({
    sections: [{
      children: children
    }]
  });

  return { doc };
}

module.exports = generateEmploymentAnnexDoc;