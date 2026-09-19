const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Format number with thousand separators (European style: 1.000)
 */
const formatMoney = (value) => {
  if (!value) return '';
  const num = parseInt(String(value).replace(/\./g, ''), 10);
  if (isNaN(num)) return value;
  return num.toLocaleString('de-DE');
};

/**
 * Convert a small number of months to Macedonian words (with grammatical суфикс)
 */
const monthsToText = (months) => {
  const n = parseInt(months, 10);
  if (isNaN(n)) return '';
  const words = { 1: 'еден', 2: 'два', 3: 'три', 4: 'четири', 5: 'пет', 6: 'шест' };
  const word = words[n] || String(n);
  return n === 1 ? `1 (${word}) месец` : `${n} (${word}) месеци`;
};

function generateEmploymentAgreementDoc(formData, user, company) {
  // Company data with defaults - using the standardized field mapping
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Employee data with defaults
  const employeeName = formData?.employeeName || '[Име на вработен]';
  const employeeAddress = formData?.employeeAddress || '[Адреса на вработен]';
  const employeePIN = formData?.employeePIN || '[ЕМБГ]';
  const jobPosition = formData?.jobPosition || '[Работно место]';
  const workTasks = formData?.workTasks || [];
  // Use formatted salary if available, otherwise format here
  const netSalary = formData?.netSalaryFormatted || formatMoney(formData?.netSalary) || '[Плата]';
  const placeOfWork = formData?.otherWorkPlace || formData?.placeOfWork || 'просториите на седиштето на работодавачот';
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const agreementDurationType = formData?.agreementDurationType || 'неопределено времетраење.';
  const definedDuration = formData?.definedDuration ? moment(formData.definedDuration).format('DD.MM.YYYY') : '';
  const dailyWorkTime = formData?.otherWorkTime || formData?.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';
  const concurrentClauseInput = formData?.concurrentClauseInput || '';
  // Use duration text (months/years) instead of date
  const concurrentClauseDurationText = formData?.concurrentClauseDurationText || '';
  // Use formatted compensation if available
  const concurrentClauseCompensation = formData?.concurrentClauseCompensationFormatted || formatMoney(formData?.concurrentClauseCompensation) || '';

  // --- New dynamic fields ---
  const isFixedTerm = !!agreementDurationType && agreementDurationType.indexOf('неопределено') === -1 && agreementDurationType.indexOf('определено') !== -1;
  const fixedTermReason = formData?.fixedTermReason || '';

  const employmentType = formData?.employmentType || 'полно'; // 'полно' | 'неполно'
  const isPartTime = employmentType === 'неполно';
  const weeklyHours = formData?.weeklyHours || '20';

  const annualLeaveDays = formData?.annualLeaveDays || '20';
  const noticePeriodDays = formData?.noticePeriodDays || '30';

  const hasProbation = !!formData?.probationPeriod;
  const probationDurationText = hasProbation ? monthsToText(formData?.probationDuration || '3') : '';

  const isRemoteWork = !!formData?.remoteWork;

  // Optional clauses default to ON (only excluded when explicitly false)
  const includeIPClause = formData?.includeIPClause !== false;
  const includeConfidentialityClause = formData?.includeConfidentialityClause !== false;
  const includeMedicalClause = formData?.includeMedicalClause !== false;

  // --- Dynamic numbering helpers (articles renumber automatically) ---
  let articleCounter = 0;
  let sectionCounter = 0;
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];

  const articleHeading = () => new Paragraph({
    children: [new TextRun({ text: `Член ${++articleCounter}`, bold: true })],
    alignment: AlignmentType.CENTER,
  });
  const sectionHeading = (title) => new Paragraph({
    children: [new TextRun({ text: `${ROMAN[++sectionCounter]}. ${title}`, bold: true })],
    alignment: AlignmentType.LEFT,
  });
  const p = (text) => new Paragraph({ children: [new TextRun({ text })], alignment: AlignmentType.JUSTIFIED });
  const blank = () => new Paragraph({ text: '' });

  const children = [
    // Header
    new Paragraph({
      children: [
        new TextRun({
          text: `Во согласност со членовите 13 став 1, 14, 15 и 28 од Законот за работни односи (Службен весник на Република Македонија бр. 167/15 Пречистен текст и подоцнежните измени на законот), помеѓу:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    blank(),

    // Parties
    p(`1. ${companyName} со седиште на ул. ${companyAddress}, Република Северна Македонија, со ЕМБС ${companyNumber}, претставувано од ${companyManager} (во понатамошниот текст: Работодавачот); и`),
    blank(),
    p(`2. ${employeeName} со адреса на живеење на ул. ${employeeAddress} со ЕМБГ ${employeePIN}`),
    blank(),
    p(`На ${agreementDate} година (во натамошниот текст "работник"), се склучи следниот:`),
    blank(),

    // Title
    new Paragraph({
      children: [new TextRun({ text: 'ДОГОВОР ЗА ВРАБОТУВАЊЕ', bold: true })],
      alignment: AlignmentType.CENTER,
    }),
    blank(),

    // Section I - General Provisions
    sectionHeading('ОПШТИ ОДРЕДБИ'),
    blank(),

    // Article - Purpose
    articleHeading(),
    p(`Овој договор го уредува засновањето на работниот однос, правата и обврските што произлегуваат од работниот однос во согласност со Законот за работни односи на Република Северна Македонија и одговорностите на работодавецот ${companyName} и работникот.`),
    blank(),

    // Article - Entry into force
    articleHeading(),
    p(`1) Овој договор стапува на сила на ${agreementDate} година.`),
    blank(),

    // Article - Duration
    articleHeading(),
  ];

  // Duration text (with fixed-term reason support)
  const durationBase = agreementDurationType.replace(/\.$/, '');
  let durationText = `Договорот за вработување е склучен на ${durationBase}`;
  if (isFixedTerm && definedDuration) {
    durationText += `, заклучно до ${definedDuration} година`;
  }
  durationText += '.';
  children.push(p(durationText));
  if (isFixedTerm && fixedTermReason) {
    children.push(p(`Договорот се склучува на определено време поради ${fixedTermReason}, во согласност со Член 46 од Законот за работните односи.`));
  }
  children.push(blank());

  // Optional Article - Probation (Член 60 ЗРО)
  if (hasProbation) {
    children.push(
      articleHeading(),
      p(`Работникот се прима на работа со пробна работа во траење од ${probationDurationText}. За време на пробната работа работодавачот ја следи и оценува способноста на работникот за извршување на работните задачи.`),
      p(`Доколку работникот не ги задоволи очекувањата за време на пробната работа, работодавачот може да го откаже договорот за вработување со отказен рок од најмалку три работни дена, во согласност со Член 60 од Законот за работните односи.`),
      blank()
    );
  }

  // Article - Job position and tasks
  children.push(
    articleHeading(),
    p(`1) Работникот заснова работа за работно место ${jobPosition}.`),
    p(`2) Опис на работно место и работни задачи:`)
  );

  // Add work tasks
  if (workTasks && Array.isArray(workTasks) && workTasks.length > 0) {
    workTasks.forEach((task, index) => {
      const taskStr = task && task.toString ? task.toString() : String(task || '');
      if (taskStr && taskStr.trim && taskStr.trim().length > 0) {
        const punctuation = index === workTasks.length - 1 ? '.' : ';';
        children.push(p(`- ${taskStr.trim()}${punctuation}`));
      }
    });
  }

  children.push(
    p(`3) Во случаите утврдени со закон и со важечките колективни договори работникот е должен да извршува и други работни задачи, согласно со стручното оспособување на работникот, во согласност со упатствата на работодавецот.`),
    p(`4) Работодавачот има право да врши периодични оценувања на работата на работникот и да дава насоки за подобрување на неговата работа. За извршената работа, работодавачот може да му дава извештаји на работникот за неговото работење. Ваквиот извештај претставува основ за поттикнување на работникот за подобрување на неговата работа и може да се користи како основа за донесување одлуки во врска со неговото унапредување, доделување на повисока плата или продолжување односно прекинување на работниот однос.`),
    p(`5) Работникот изјавува и гарантира дека сите податоци, информации, документи, дипломи, сертификати, лиценци, квалификации и други докази за стручна оспособеност доставени во текот на постапката за вработување, вклучувајќи ги и податоците наведени во апликацијата за вработување и изјавите дадени на интервју, се вистинити, точни и целосни. Доколку се утврди дека работникот дал невистинити, неточни или нецелосни податоци, или премолчел суштествени информации релевантни за склучување на овој договор, работодавачот има право да го раскине договорот за вработување согласно со законските одредби за откажување на договорот поради кршење на работните обврски од страна на работникот, без обврска за исплата на отпремнина.`),
    blank(),

    // Article - Place of work
    articleHeading(),
    p(`Работникот ќе ги извршува своите должности што произлегуваат од овој договор во ${placeOfWork}.`),
    p(`Пристап до просториите на работодавецот по завршувањето на работното време е предмет на одобрување од Менаџментот на компанијата.`)
  );

  // Optional remote work regulation (Член 50 ЗРО)
  if (isRemoteWork) {
    children.push(
      p(`Дел од работните обврски работникот може да ги извршува од своето место на живеење, односно од далечина (работа од далечина), согласно Член 50 од Законот за работните односи.`),
      p(`Работодавачот и работникот се согласуваат за средствата за работа што ги обезбедува работодавачот, за надоместокот на трошоците непосредно поврзани со работата од дома (потрошувачка на електрична енергија, интернет и слично), како и за начинот на вршење надзор над извршувањето на работата. Работата од дома не го менува обемот на правата и обврските на работникот утврдени со овој договор.`)
    );
  }
  children.push(blank());

  // Section II - Salary
  children.push(
    sectionHeading('ПЛАТА'),
    blank(),
    articleHeading(),
    p(`Работникот има право на месечна основна плата во износ од ${netSalary},00 денари, без пресметани додатоци и надоместоци.`),
    p(`Исплатата на платата ќе се врши најдоцна до 15-ти следниот месец.`),
    blank(),

    // Section III - Working Time
    sectionHeading('РАБОТНО ВРЕМЕ И ЗАКОНСКО ОТСУСТВО'),
    blank(),
    articleHeading()
  );

  // Working time (full vs part-time)
  if (isPartTime) {
    children.push(
      p(`1) Договорот се заснова на неполно работно време со ${weeklyHours} работни часа неделно, со платена пауза сразмерна на договореното работно време, секоја работна недела со исклучок на одмор и на државните празници.`),
      p(`Работникот може да склучи договор за вработување со неполно работно време со повеќе работодавачи за да го оствари полното работно време, при што е должен да го усогласи работното време со сите работодавачи.`)
    );
  } else {
    children.push(
      p(`1) Договорот се заснова на полно работно време со 40 работни часа неделно, при што е вклучена платена 30 минутна пауза, секоја работна недела со исклучок на одмор и на државните празници.`)
    );
  }

  children.push(
    p(`2) Работното време на работникот ${dailyWorkTime}.`),
    blank(),

    // Article - Annual leave
    articleHeading(),
    p(`1) Работникот има право да ги остварува своите дневни и неделни одмори и паузи, како и статутарното право на годишен одмор во согласност со Законот за работни односи.`),
    p(`2) Работникот има право на годишен одмор од најмалку ${annualLeaveDays} работни денови, во согласност со интерните правила на работодавецот.`),
    p(`3) Годишниот одмор ќе се користи во согласност со планот за годишен одмор на работникот заснован според потребите на неговите работни обврски.`),
    blank(),

    // Article - Sick leave
    articleHeading(),
    p(`1) Работникот има право на законско боледување во согласност со Законот за работни односи на Република Северна Македонија.`),
    p(`2) Во случај на болест или онеспособеност за работа поради други причини, работникот е должен без одлагање, но не подоцна од утринските часови од првиот ден на отсуство од работа, да го извести работодавецот за причините и за очекуваното времетраење на отсуството.`),
    p(`3) Во случај на болест, работникот е должен да му достави на работодавецот лекарско уверение, како доказ за неспособност за работа, не подоцна од 8 дена од последниот ден на привремена спреченост за работа.`),
    blank(),

    // Section IV - Rights and Obligations
    sectionHeading('ПРАВА И ДОЛЖНОСТИ НА РАБОТНИОТ ОДНОС'),
    blank(),
    articleHeading(),
    p(`Работникот е должен да ги извршува следниве задачи:`),
    p(`1) Извршување на работата во согласност со описот на работното место, трудољубиво и квалитетно во време и местото кои се наведени во договорот за вработување во согласност со описот и природата на позицијата прифатени овде, дејствувајќи во согласност со упатствата на работодавецот, и во согласност со законските прописи и општо прифатените стандарди за задачите кои се извршуваат.`),
    p(`2) Работникот ќе биде должен совесно да ја извршува работата во врска со функцијата на работното место за кое работникот го прифатил договорот за вработување, за време на работното време и на локацијата утврдени за извршување на работата, почитувајќи ја организацијата на работата и дејноста на работодавецот.`),
    p(`3) Работникот се обврзува да биде лојален на работодавецот во зачувување на неговиот имиџ и репутација.`),
    p(`4) Работникот е должен да ги почитува и имплементира прописите за заштита при работа, да го заштити сопствениот живот и здравје, како и здравјето и животот на другите.`),
    p(`5) Работникот е должен да се воздржува од сите активности кои, со оглед на природата на работата што извршува кај работодавецот, може да предизвика штета или може да им наштети на интересите на работодачот.`),
    p(`6) Да го извести работодавецот за суштинските околности кои влијаат или можат да влијаат и да го попречат исполнувањето на неговите договорни обврски.`),
    p(`7) Веднаш да го извести работодавецот за појава на материјална штета или било каков недостиг, како и било каков ризик за неговата безбедност и здравје.`),
    p(`8) Да се грижи за опремата и други средства кои му се доделени за извршување на неговите службени должности.`),
    p(`9) Да му се овозможи на работодавецот да врши надзор над извршувањето на работите и да дава насоки кога е потребно.`),
    p(`10) Стриктно да ги следи интерните правила на работодавецот и да не ја попречува работата на другите вработени.`),
    p(`Работодавецот е должен:`),
    p(`(1) Да обезбеди работа на работникот во согласност со позицијата наведена во овој договор.`),
    p(`(2) Да му обезбеди на работникот нормални услови за извршување на доделените работни обврски и сите потребни средства и работна опрема со цел да му овозможи на работникот да ги исполнува своите обврски.`),
    p(`(3) Редовно плаќање на платата на работникот.`),
    p(`(4) Да прибира, обработува, користи и да комуницира со трети лица за личните податоци на работникот само ако е неопходно за остварување на правата и обврските на работниот однос.`),
    blank()
  );

  // Section - Intellectual Property Rights (optional)
  if (includeIPClause) {
    children.push(
      sectionHeading('ПРАВА ОД ИНТЕЛЕКТУАЛНА СОПСТВЕНОСТ'),
      blank(),
      articleHeading(),
      p(`1) За време на работата согласно овој договор работникот може во секое време да создаде, пишува, замисли, подобри, развие, открие или измисли било каква програма, производ, услуга, процес, систем, пронајдок или друга интелектуална сопственост.`),
      p(`2) Целокупната ваква интелектуална сопственост и авторски права безусловно ќе бидат сопственост на работодавецот.`),
      p(`3) Работникот ги пренесува на работодавецот сите права, овластувања и интереси на таквите права во Република Северна Македонија и на друго место.`),
      blank()
    );
  }

  // Section - Confidentiality (optional)
  if (includeConfidentialityClause) {
    children.push(
      sectionHeading('ДОВЕРЛИВОСТ'),
      blank(),
      articleHeading(),
      p(`1) Работникот не смее да користи за лични цели или да открива на трети лица податоци кои се сметаат за деловна тајна на работодавецот.`),
      p(`2) "Деловна тајна" вклучува сите доверливи информации кои се однесуваат на бизнисот или работите на компанијата, вклучувајќи детали за клиенти, цени, услови на работење, софтверски код, маркетинг планови, финансиски информации и сите информации за кои работникот треба да знае дека се доверливи.`),
      p(`3) Обврската за доверливост продолжува и по престанок на работниот однос.`),
      blank()
    );
  }

  // Section - Non-Competition (optional, existing)
  if (formData?.concurrentClause) {
    children.push(
      sectionHeading('ЗАБРАНА ЗА КОНКУРЕНЦИЈА'),
      blank(),
      articleHeading(),
      p(`По завршувањето на овој работен однос${concurrentClauseDurationText ? `, за период од ${concurrentClauseDurationText} по престанувањето на договорот за вработување` : ''}, работникот не смее да се јави како основач, партнер, управител, одговорно лице, вработен, надворешен соработник или на друг начин ангажирано лице во трговско друштво кое врши иста или слична дејност со дејноста на работодавецот.`)
    );

    if (concurrentClauseCompensation) {
      children.push(p(`Работодавачот се обврзува за времетраењето на оваа забрана месечно да му исплатува на работникот паричен надоместок во износ од ${concurrentClauseCompensation} денари.`));
    }
    if (concurrentClauseInput) {
      children.push(p(concurrentClauseInput));
    }
    children.push(
      p(`Доколку работникот постапи спротивно на одредбите од овој член, се согласува да му ја надомести штетата на работодавачот.`),
      blank()
    );
  }

  // Section - Termination
  children.push(
    sectionHeading('ПРЕСТАНОК НА РАБОТНИОТ ОДНОС'),
    blank(),
    articleHeading(),
    p(`Работниот однос може да престане со: откажување од страна на работодавецот, откажување од страна на работникот, спогодба помеѓу работодавецот и работникот, истек на времето за кое е склучен договорот за вработување на определено време, или со смрт на работникот.`),
    p(`Откажувањето се врши писмено со отказен рок од најмалку ${noticePeriodDays} дена.`),
    blank()
  );

  // Section - Medical Examinations (optional)
  if (includeMedicalClause) {
    children.push(
      sectionHeading('ЛЕКАРСКИ ПРЕГЛЕДИ'),
      blank(),
      articleHeading(),
      p(`Работникот е должен да се јави на периодични лекарски прегледи согласно со законските прописи и интерните правила на работодавецот.`),
      blank()
    );
  }

  // Section - Disciplinary Measures
  children.push(
    sectionHeading('ДИСЦИПЛИНСКА ОДГОВОРНОСТ'),
    blank(),
    articleHeading(),
    p(`За повреда на работните обврски утврдени со овој договор, работникот одговара дисциплински согласно со Законот за работни односи и интерните правила на работодавецот.`),
    p(`На работникот му се дадени на увид синте интерни акти, правилници, документирани процеси на работа и други насоки на работењето од страна на работодавачот и работникот е соодветно запознаен со истите. Дополнително, работникот потврдува дека е известен дека ваквата интерна документација е секогаш достапна и по негово барање.`),
    blank(),

    // Section - Entry into Force
    sectionHeading('СТАПУВАЊЕ НА СИЛА'),
    blank(),
    articleHeading(),
    p(`Договорот за вработување се склучува во писмена форма во два примероци, еден за работникот и еден за потребите на работодавецот.`),
    p(`Овој Договор е склучен во 2 (два) примероци, од кои еден за работникот, а еден за Работодавецот.`),
    blank(),
    blank(),

    // Symmetric signature table - professional format for two parties
    new Table({
      width: { size: 100, type: 'pct' },
      borders: {
        top: { style: 'none' },
        bottom: { style: 'none' },
        left: { style: 'none' },
        right: { style: 'none' },
        insideHorizontal: { style: 'none' },
        insideVertical: { style: 'none' },
      },
      rows: [
        new TableRow({
          children: [
            // Left cell - Employer signature
            new TableCell({
              width: { size: 50, type: 'pct' },
              borders: {
                top: { style: 'none' },
                bottom: { style: 'none' },
                left: { style: 'none' },
                right: { style: 'none' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'За работодавачот:' })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: '___________________________' })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: companyName })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: companyManager })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 300 },
                }),
              ],
            }),
            // Right cell - Employee signature
            new TableCell({
              width: { size: 50, type: 'pct' },
              borders: {
                top: { style: 'none' },
                bottom: { style: 'none' },
                left: { style: 'none' },
                right: { style: 'none' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'За работникот:' })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: '___________________________' })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: employeeName })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 300 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const sections = [{ children }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateEmploymentAgreementDoc;
