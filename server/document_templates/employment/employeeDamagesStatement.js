const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');
const moment = require('moment');

function generateEmployeeDamagesStatementDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  
  // Employee and statement data
  const employeeName = formData?.employeeName || '[Име на работник]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const damages = formData?.damages || '[Опис на штетата]';
  const amount = formData?.amount || '[Износ]';

  const sections = [{
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Јас долупотпишаниот, ${employeeName}, вработен на работна позиција ${jobPosition} кај работодавачот ${companyName}, ${companyAddress}, на ден ${decisionDate} година, ја давам следната:` })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'И З Ј А В А', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'за согласност за намалување на плата поради предизвикана штета', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на оваа изјава, потврдувам дека со моите дејствија извршени за време на вршење на работните задачи - и тоа: ${damages}, сум му предизвикал материјална штета на мојот работодавач ${companyName}. Истовремено, потврдувам и изјавувам дека износот на ваквата штета е ${amount},00 денари.` })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Согласно на ова, а со цел да не се отпочне судска постапка против мене за обештетување на мојот работодавач, согласен сум од износот на нето плата кој треба да го примам во идина, да ми биде задржан износ од ${amount}.` })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Потврдувам дека оваа изјава ја давам без присила и со единствена цел да не биде отпочната судска постапка против мене за предизвиканата материјална штета.' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Забелешка:' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Ваквата изјава се дава врз основа на член 111 од Законот за работните односи и се дава во услови кога материјалната штета – побарувањето на работодавачот е настанато, за што потврдува и работникот со давање на ваква изјава.' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `${decisionDate} година.` })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        // Employee signature
        new Paragraph({
          children: [
            new TextRun({ text: "___________________________" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: employeeName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Правна основа:' })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { line: 276 }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Задржување и порамнување на исплаќањето на платата', bold: true })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 111', bold: true })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '(1) Работодавачот може да го задржи исплаќањето на платата само во законски определените случаи. Сите одредби на договорот за вработување, кои определуваат други начини на задржување на исплатата, се ништовни.' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '(2) Работодавачот не смее своите побарувања кон работникот без негова писмена согласност да ги порамни со својата обврска за исплата на платата.' })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '(3) Работникот не смее да даде согласност од ставот (2) на овој член пред настанувањето на побарувањето на работодавачот.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        })
      ]
    }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateEmployeeDamagesStatementDoc;