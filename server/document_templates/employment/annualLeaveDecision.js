const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateAnnualLeaveDecisionDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС]';
  const companyManager = company?.manager || '[Управител]';
  const employeeName = formData.employeeName || '[Име на вработен]';
  const annualLeaveYear = formData.annualLeaveYear || '[Година]';
  const annualLeaveStart = formData.annualLeaveStart ? moment(formData.annualLeaveStart).format('DD.MM.YYYY') : '[Почеток на одмор]';
  const annualLeaveEnd = formData.annualLeaveEnd ? moment(formData.annualLeaveEnd).format('DD.MM.YYYY') : '[Крај на одмор]';
  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 137, член 138 став 1 и член 139 од Законот за работните односи (Службен Весник на РМ бр. 167/2016 – Пречистен текст; 27/2016 и 135/2016) Работодавачот ${companyName}, со седиште на ул. ${companyAddress}, со ЕМБС ${companyNumber}, претсавувано од Управител ${companyManager}, на ден ${currentDate} година, го донесе следното:`, bold: false })
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
            new TextRun({ text: 'за користење годишен одмор', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `На работникот ${employeeName}, вработен во ${companyName}, му се одобрува користење на годишен одмор за ${annualLeaveYear} година.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Работникот ќе го користи годишниот одмор почнувајќи од ${annualLeaveStart} година, до ${annualLeaveEnd} година.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Работникот е должен да се јави на работа по завршувањето на годишниот одмор.' })
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
        new Paragraph({
          children: [
            new TextRun({ text: `Во согласност со потребите на работниот процес, Работодавачот ${companyName} претсавуван преку Управител ${companyManager}, а врз основа на Барање за годишен одмор од работникот ${employeeName}, одлучи како  во диспозитивот на  решението.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Правото и времетраењето на годишниот одмор е утврдено во согласност со одредбите од Законот за работни односи, актите на работодавачот и потребите на процесот на работа.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Правна поука: Против ова Решение работникот има право на приговор, во рок од осум дена од приемот на Решението.' })
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
            new TextRun({ text: '-работникот' })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '-архива' })
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
        new Paragraph({
          children: [
            new TextRun({ text: 'За работодавачот', bold: false })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: companyName, bold: false })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '_____________________', bold: false })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Управител ${companyManager}`, bold: false })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'ОД:', bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${employeeName},`, bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `вработен во ${companyName},`, bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'ДО:', bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${companyName},`, bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `со седиште на ул. ${companyAddress},`, bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Барање за користење на денови од годишен одмор од ${annualLeaveYear} година`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Јас долупотпишаниот ${employeeName}, барам од менаџментот на мојот работодавач - ${companyName}, да ми одобри користење на годишен одмор со времетраење од ${annualLeaveStart} година, до ${annualLeaveEnd} година.` })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Со ова барање истовремено потврдувам дека сум запознат со околноста дека годишниот одмор се користи земајќи ги предвид моите лични потреби, како и потребите на работниот процес. Во зависност од работниот процес, запознат сум дека единствено по донесување на Решение за користење на годишен одмор од страна на работодавачот, можам оправдано да отсуствувам од работа.' })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Со почит,', bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${currentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: '_____________________', bold: false })
          ],
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({
          children: [
            new TextRun({ text: employeeName, bold: false })
          ],
          alignment: AlignmentType.RIGHT
        })
      ]
    }]
  });
  return { doc };
}

module.exports = generateAnnualLeaveDecisionDoc; 