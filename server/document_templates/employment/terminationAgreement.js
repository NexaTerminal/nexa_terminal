const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = require('docx');
const moment = require('moment');

function generateTerminationAgreementDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
  const companyManager = company?.manager || '[Управител]';
  const currentDate = moment().format('DD.MM.YYYY');

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 62 став 1 точка 4 и член 69 од Законот за работни односи (Сл. Весник на РМ бр. 167/15 – Пречистен текст), на ден ${endDate} година, се склучи:`, bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'СПОГОДБА ЗА ПРЕСТАНОК НА РАБОТЕН ОДНОС', bold: true, margin: { top: 100 } })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Склучена помеѓу:`, bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `1. ${companyName}, со седиште на ул. ${companyAddress}, ЕМБС: ${companyNumber}, Република Северна Македонија (во понатамошниот текст: Работодавачот); и`, bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `2. ${employeeName}, со ЕМБГ ${employeePIN}, со адреса ${employeeAddress} (во понатамошниот текст: Работникот)`, bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Врз основа на член 69 став 1 од Законот за работните односи, страните заеднички се согласија да го раскинат договорот за вработување сметано од ${endDate} година. Последниот работен ден на Работникот е ${endDate} година.`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'На денот на склучувањето на оваа Спогодба, Работникот ќе го врати на Работодавачот сето она што Работодавачот го обезбедил на Работникот за извршување на неговите должности. Работникот нема право да задржи било какви оригинали или копии во било каква форма.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Работникот потврдува дека ги има добиено сите износи кои Работодавачот треба да му ги исплати согласно Договорот за вработување до датумот на оваа Спогодба. Сите побарувања на Работникот во однос на работниот однос и Договорот за вработување се подмирени и Работникот потврдува дека нема никакви побарувања кон Работодавачот или кон било која од подружниците на Работодавачот.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'До денот на престанување на работниот однос, Работникот е обврзан целосно да ги предаде сите документи, ствари, опрема и инвентар, кои му беа дадени за време на извршувањето на обврските кај Работодавачот.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Работникот се обврзува сите доверливи информации и документи стекнати за време на извршувањето на задачите за време на работниот однос кај Работодавачот да не ги користи за себе или да не ги достави до трета страна.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Работникот се согласува и изјавува дека:', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- По престанокот на работниот однос, нема да шири негативни или навредувачки изјави поврзани со работата кај Работодавачот;', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- Нема да пренесува на трети лица сознанија или податоци кои претставуваат деловна тајна;', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- Нема никакви побарувања кон Работодавачот, моментални или идни, врз основа на Договорот за вработување или друг акт на Работодавачот, вклучувајќи, но не ограничувајќи се на: нефер/погрешно отпуштање, конструктивно отпуштање, дискриминација по било која основа;', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '- Нема основ за поведување постапки пред надлежни судови или други органи за прашања поврзани со работниот однос.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 7', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'На денот на склучување на оваа Спогодба, Работникот потврдува дека Работодавачот му ги враќа сите документи кои му припаѓаат, вклучително, но не ограничувајќи се на сертификати и дипломи кои се дел од личното досие на Работникот кај Работодавачот.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 8', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Со потпишувањето на оваа Спогодба, Работодавачот го ослободува Работникот од обврската на доаѓање на работа од ${endDate}.`, bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 9', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Неважноста на поединечни одредби на оваа Спогодба нема да влијае на валидноста на останатите одредби. Страните се согласни да ги заменат неважечките одредби со важечки кои најмногу одговараат на почетната цел.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 10', bold: true })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Согласно член 69 од Законот за работни односи, Работникот е запознат со последиците од спогодбеното раскинување на работниот однос, односно дека истиот не може да остварува права по основ на осигурување во случај на невработеност согласно член 67 од Законот за вработување и осигурување во случај на невработеност.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Со потпишувањето на оваа Спогодба, страните изјавуваат дека внимателно ја прочитале и ја разбираат содржината и правните последици и дека истите се во согласност со нивните желби.', bold: false })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: '' }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Работодавач', alignment: AlignmentType.CENTER })],
                  verticalAlign: 'center',
                  borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Работник (потпис, цело име и презиме, своерачно датум)', alignment: AlignmentType.CENTER })],
                  verticalAlign: 'center',
                  borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: '________________', alignment: AlignmentType.CENTER })], borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } } }),
                new TableCell({ children: [new Paragraph({ text: '________________', alignment: AlignmentType.CENTER })], borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } } })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: `${companyName}`, alignment: AlignmentType.CENTER })], borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } } }),
                new TableCell({ children: [new Paragraph({ text: `${employeeName}`, alignment: AlignmentType.CENTER })], borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } } })
              ]
            })
          ],
          width: { size: 100, type: 'pct' },
          borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
        })
      ]
    }]
  });
  return { doc };
}

module.exports = generateTerminationAgreementDoc; 