const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateWarningLetterDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС]';
  const companyManager = company?.manager || '[Управител]';
  
  // Employee and warning data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const warningDate = formData?.warningDate ? moment(formData.warningDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const employeeWrongDoing = formData?.employeeWrongDoing || '[Постапување на работникот]';
  const rulesNotRespected = formData?.rulesNotRespected || '[Правила кои не се почитуваат]';
  const articleNumber = formData?.articleNumber || '[Број на член]';
  
  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 180 од Законот за работни односи, работодавачот ${companyName}, со седиште на ул. ${companyAddress}, ЕМБС: ${companyNumber}, на ден ${warningDate} година, издава следната:` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'О П О М Е Н А', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'до вработен', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `До: ${employeeName}` })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Ве опоменуваме дека со Вашето постапување од ${warningDate} година кога ${employeeWrongDoing}, се утврди дека не се придржувате кон ${rulesNotRespected}.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Ваквото постапување претставува повреда на работната дисциплина и неисполнување на работните обврски согласно член ${articleNumber} од Договорот за вработување, како и согласно внатрешните правила и процедури на Друштвото.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Со оваа опомена Ве известуваме дека вакво постапување е неприфатливо и дека во идина треба строго да се придржувате кон сите работни обврски и интерни правила на Друштвото.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ве потсетуваме дека повторни прекршоци на работната дисциплина можат да резултираат со изрекување на дисциплински мерки, согласно Законот за работни односи и интерните правила на Друштвото.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Очекуваме дека оваа опомена ќе биде доволна за подобрување на Вашето однесување и почитување на работните обврски.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Примерок од оваа опомена се чува во Вашиот личен досие.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `${currentDate} година` })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Потпис на работникот:' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '____________________' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${employeeName}` })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'За работодавачот' })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '_____________________' })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Управител ${companyManager}` })
          ],
          alignment: AlignmentType.RIGHT
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateWarningLetterDoc;