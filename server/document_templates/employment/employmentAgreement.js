const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel } = require('docx');
const moment = require('moment');

function generateEmploymentAgreementDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
  const companyManager = company?.manager || '[Управител]';
  
  // Employee data with defaults
  const employeeName = formData?.employeeName || '[Име на вработен]';
  const employeeAddress = formData?.employeeAddress || '[Адреса на вработен]';
  const employeePIN = formData?.employeePIN || '[ЕМБГ]';
  const jobPosition = formData?.jobPosition || '[Работно место]';
  const workTasks = formData?.workTasks || [];
  const netSalary = formData?.netSalary || '[Плата]';
  const placeOfWork = formData?.otherWorkPlace || formData?.placeOfWork || 'просториите на седиштето на работодавачот';
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const agreementDurationType = formData?.agreementDurationType || 'неопределено времетраење.';
  const definedDuration = formData?.definedDuration ? moment(formData.definedDuration).format('DD.MM.YYYY') : '';
  const dailyWorkTime = formData?.otherWorkTime || formData?.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';
  const concurrentClauseInput = formData?.concurrentClauseInput || '';

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
    new Paragraph({ text: "" }),
    
    // Parties
    new Paragraph({
      children: [
        new TextRun({
          text: `1. ${companyName} со седиште на ул. ${companyAddress}, Република Северна Македонија, со ЕМБС ${companyNumber}, претставувано од ${companyManager} (во понатамошниот текст: Работодавачот); и`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2. ${employeeName} со адреса на живеење на ул. ${employeeAddress} со ЕМБГ ${employeePIN}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `На ${agreementDate} година (во натамошниот текст "работник"), се склучи следниот:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР ЗА ВРАБОТУВАЊЕ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    
    // Section I - General Provisions
    new Paragraph({
      children: [
        new TextRun({ text: "I. ОПШТИ ОДРЕДБИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 1
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор го уредува засновањето на работниот однос, правата и обврските што произлегуваат од работниот однос во согласност со Законот за работни односи на Република Северна Македонија и одговорностите на работодавецот ${companyName} и работникот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 2
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Овој договор стапува на сила на ${agreementDate} година.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 3
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот за вработување е склучен на ${agreementDurationType}${definedDuration ? `, и престанува да важи на ${definedDuration} година.` : ''}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 4
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Работникот заснова работа за работно место ${jobPosition}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Опис на работно место и работни задачи:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
  ];

  // Add work tasks
  if (workTasks && Array.isArray(workTasks)) {
    workTasks.forEach(task => {
      // More defensive check for task content
      const taskStr = task && task.toString ? task.toString() : String(task || '');
      if (taskStr && taskStr.trim && taskStr.trim().length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `- ${taskStr.trim()}`,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }
    });
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Во случаите утврдени со закон и со важечките колективни договори работникот е должен да извршува и други работни задачи, согласно со стручното оспособување на работникот, во согласност со упатствата на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 5 - Place of work
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работникот ќе ги извршува своите должности што произлегуваат од овој договор во ${placeOfWork}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Пристап до просториите на работодавецот по завршувањето на работното време е предмет на одобрување од Менаџментот на компанијата.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Section II - Salary
    new Paragraph({
      children: [
        new TextRun({ text: "II. ПЛАТА", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 6 - Salary
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работникот има право на месечна основна плата во износ од ${netSalary},00 денари, без пресметани додатоци и надоместоци.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Исплатата на платата ќе се врши најдоцна до 15-ти следниот месец.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Section III - Working Time
    new Paragraph({
      children: [
        new TextRun({ text: "III. РАБОТНО ВРЕМЕ И ЗАКОНСКО ОТСУСТВО", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 7
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Договорот се заснова на полно работно време со 40 работни часа неделно, при што е вклучена платена 30 минутна пауза, секоја работна недела со исклучок на одмор и на државните празници.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Работното време на работникот ${dailyWorkTime}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 8 - Annual leave
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Работникот има право да ги остварува своите дневни и неделни одмори и паузи, како и статутарното право на годишен одмор во согласност со Законот за работни односи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Работникот има право на годишен одмор од најмалку 20 работни денови, во согласност со интерните правила на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Годишниот одмор ќе се користи во согласност со планот за годишен одмор на работникот заснован според потребите на неговите работни обврски.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 9 - Sick leave
    new Paragraph({
      children: [
        new TextRun({ text: "Член 9", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Работникот има право на законско боледување во согласност со Законот за работни односи на Република Северна Македонија.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Во случај на болест или онеспособеност за работа поради други причини, работникот е должен без одлагање, но не подоцна од утринските часови од првиот ден на отсуство од работа, да го извести работодавецот за причините и за очекуваното времетраење на отсуството.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Во случај на болест, работникот е должен да му достави на работодавецот лекарско уверение, како доказ за неспособност за работа, не подоцна од 8 дена од последниот ден на привремена спреченост за работа.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Section IV - Rights and Obligations  
    new Paragraph({
      children: [
        new TextRun({ text: "IV. ПРАВА И ДОЛЖНОСТИ НА РАБОТНИОТ ОДНОС", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 10
    new Paragraph({
      children: [
        new TextRun({ text: "Член 10", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работникот е должен да ги извршува следниве задачи:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Извршување на работата во согласност со описот на работното место, трудољубиво и квалитетно во време и местото кои се наведени во договорот за вработување во согласност со описот и природата на позицијата прифатени овде, дејствувајќи во согласност со упатствата на работодавецот, и во согласност со законските прописи и општо прифатените стандарди за задачите кои се извршуваат.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Работникот ќе биде должен совесно да ја извршува работата во врска со функцијата на работното место за кое работникот го прифатил договорот за вработување, за време на работното време и на локацијата утврдени за извршување на работата, почитувајќи ја организацијата на работата и дејноста на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Работникот се обврзува да биде лојален на работодавецот во зачувување на неговиот имиџ и репутација.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `4) Работникот е должен да ги почитува и имплементира прописите за заштита при работа, да го заштити сопствениот живот и здравје, како и здравјето и животот на другите.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `5) Работникот е должен да се воздржува од сите активности кои, со оглед на природата на работата што извршува кај работодавецот, може да предизвика штета или може да им наштети на интересите на работодачот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `6) Да го извести работодавецот за суштинските околности кои влијаат или можат да влијаат и да го попречат исполнувањето на неговите договорни обврски.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `7) Веднаш да го извести работодавецот за појава на материјална штета или било каков недостиг, како и било каков ризик за неговата безбедност и здравје.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `8) Да се грижи за опремата и други средства кои му се доделени за извршување на неговите службени должности.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `9) Да му се овозможи на работодавецот да врши надзор над извршувањето на работите и да дава насоки кога е потребно.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `10) Стриктно да ги следи интерните правила на работодавецот и да не ја попречува работата на другите вработени.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работодавецот е должен:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `(1) Да обезбеди работа на работникот во согласност со позицијата наведена во овој договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `(2) Да му обезбеди на работникот нормални услови за извршување на доделените работни обврски и сите потребни средства и работна опрема со цел да му овозможи на работникот да ги исполнува своите обврски.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `(3) Редовно плаќање на платата на работникот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `(4) Да прибира, обработува, користи и да комуницира со трети лица за личните податоци на работникот само ако е неопходно за остварување на правата и обврските на работниот однос.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),

    // Section V - Intellectual Property Rights
    new Paragraph({
      children: [
        new TextRun({ text: "V. ПРАВА ОД ИНТЕЛЕКТУАЛНА СОПСТВЕНОСТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 11
    new Paragraph({
      children: [
        new TextRun({ text: "Член 11", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) За време на работата согласно овој договор работникот може во секое време да создаде, пишува, замисли, подобри, развие, открие или измисли било каква програма, производ, услуга, процес, систем, пронајдок или друга интелектуална сопственост.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Целокупната ваква интелектуална сопственост и авторски права безусловно ќе бидат сопственост на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Работникот ги пренесува на работодавецот сите права, овластувања и интереси на таквите права во Република Северна Македонија и на друго место.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),

    // Section VI - Confidentiality
    new Paragraph({
      children: [
        new TextRun({ text: "VI. ДОВЕРЛИВОСТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 12
    new Paragraph({
      children: [
        new TextRun({ text: "Член 12", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Работникот не смее да користи за лични цели или да открива на трети лица податоци кои се сметаат за деловна тајна на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) "Деловна тајна" вклучува сите доверливи информации кои се однесуваат на бизнисот или работите на компанијата, вклучувајќи детали за клиенти, цени, услови на работење, софтверски код, маркетинг планови, финансиски информации и сите информации за кои работникот треба да знае дека се доверливи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Обврската за доверливост продолжува и по престанок на работниот однос.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" })
  );

  // Add non-competition clause if specified
  if (formData?.concurrentClause && concurrentClauseInput) {
    children.push(
      // Section VII - Non-Competition
      new Paragraph({
        children: [
          new TextRun({ text: "VII. ЗАБРАНА ЗА КОНКУРЕНЦИЈА", bold: true }),
        ],
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({ text: "" }),
      
      // Article 13
      new Paragraph({
        children: [
          new TextRun({ text: "Член 13", bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `За времетраењето или по завршувањето на овој работен однос, а најдоцна за период од ${concurrentClauseInput}, работникот не смее да се јави како основач, партнер, управител, одговорно лице, вработен, надворешен соработник или на друг начин ангажирано лице во трговско друштво кое врши иста или слична дејност со дејноста на работодавецот.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Доколку работникот постапи спротивно на ставот 1 од овој член, се согласува да исплати договорна казна во висина од 12 бруто месечни плати.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    // Section VIII - Termination
    new Paragraph({
      children: [
        new TextRun({ text: "VIII. ПРЕСТАНОК НА РАБОТНИОТ ОДНОС", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 14
    new Paragraph({
      children: [
        new TextRun({ text: "Член 14", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работниот однос може да престане со: откажување од страна на работодавецот, откажување од страна на работникот, спогодба помеѓу работодавецот и работникот, истек на времето за кое е склучен договорот за вработување на определено време, или со смрт на работникот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Откажувањето се врши писмено со отказен рок од најмалку 30 дена.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),

    // Section IX - Medical Examinations
    new Paragraph({
      children: [
        new TextRun({ text: "IX. ЛЕКАРСКИ ПРЕГЛЕДИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 15
    new Paragraph({
      children: [
        new TextRun({ text: "Член 15", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Работникот е должен да се јави на периодични лекарски прегледи согласно со законските прописи и интерните правила на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),

    // Section X - Disciplinary Measures  
    new Paragraph({
      children: [
        new TextRun({ text: "X. ДИСЦИПЛИНСКА ОДГОВОРНОСТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 16
    new Paragraph({
      children: [
        new TextRun({ text: "Член 16", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `За повреда на работните обврски утврдени со овој договор, работникот одговара дисциплински согласно со Законот за работни односи и интерните правила на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),

    // Section XI - Entry into Force
    new Paragraph({
      children: [
        new TextRun({ text: "XI. СТАПУВАЊЕ НА СИЛА", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 17
    new Paragraph({
      children: [
        new TextRun({ text: "Член 17", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот за вработување се склучува во писмена форма во два примероци, еден за работникот и еден за потребите на работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој Договор е склучен во 2 (два) примероци, од кои еден за работникот, а еден за Работодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    
    // Signatures
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "ЗА РАБОТОДАВАЧОТ", bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "_________________________" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: companyName, bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Управител ${companyManager}`, bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "РАБОТНИК", bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "_________________________" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: employeeName, bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
            }),
          ],
        }),
      ],
      width: { size: 100, type: 'pct' },
      borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } }
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return doc;
}

module.exports = generateEmploymentAgreementDoc;