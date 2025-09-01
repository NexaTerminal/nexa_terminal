const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateDisciplinaryActionDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС]';
  const companyManager = company?.manager || '[Управител]';
  
  // Employee data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  
  // Sanction details
  const sanctionDate = formData?.sanctionDate ? moment(formData.sanctionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const sanctionAmount = formData?.sanctionAmount || '[Висина на казна]';
  const sanctionPeriod = formData?.sanctionPeriod || '[Период]';
  
  // Violation details
  const workTaskFailure = formData?.workTaskFailure || '[Запостави обврска]';
  const employeeWrongDoing = formData?.employeeWrongDoing || '[Постапување спротивно на обврска]';
  const employeeWrongdoingDate = formData?.employeeWrongdoingDate ? moment(formData.employeeWrongdoingDate).format('DD.MM.YYYY') : '[Датум на прекршок]';
  
  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 84, а во врска со член 81 од Законот за работни односи, Управителот на Друштвото ${companyName}, со седиште на ул. ${companyAddress}, ЕМБС: ${companyNumber}, на ден ${sanctionDate} година, го донесе следното:` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Р Е Ш Е Н И Е', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'за изрекување дисциплинска мерка - парична казна', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 179 и 180 од Законот за работни односи (Службен весник на РМ бр. 167/15 - Пречистен текст), работодавачот ${companyName}, претставуван од управителот ${companyManager}, на ден ${sanctionDate} година, го донесе следното решение:` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `На работникот ${employeeName}, работна позиција ${jobPosition}, му се изрекува дисциплинска мерка - парична казна во висина од ${sanctionAmount}% од нето плата, за период од ${sanctionPeriod} месец/и.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'О б р а з л о ж е н и е', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Работникот ${employeeName} има работна обврска: ${workTaskFailure}.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `На ден ${employeeWrongdoingDate} година, работникот постапил спротивно на работната обврска на следниот начин: ${employeeWrongDoing}.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Со ваквото постапување, работникот ја повредил работната дисциплина, поради што работодавачот смета дека е оправдано да му се изрече дисциплинска мерка.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'При одмерување висината на дисциплинската мерка, работодавачот ги зел предвид сите околности на случајот, тежината на повредата и досегашното однесување на работникот.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Согласно член 180 од Законот за работни односи, паричната казна не може да биде повисока од 15% од нето платата на работникот и не може да се наплатува подолго од 6 месеци.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Правна поука: Против ова решение работникот има право на приговор во рок од осум дена од денот на приемот на решението.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Доставено до:' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- работникот' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- личен досие' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- архива' })
          ],
          alignment: AlignmentType.LEFT
        }),
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

module.exports = generateDisciplinaryActionDoc;