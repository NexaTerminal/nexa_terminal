const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel } = require('docx');
const moment = require('moment');

function generateEmploymentAgreementDoc(formData, user, company) {
  // Company data
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyNumber = company?.taxNumber || '[ЕМБС/Единствен број на компанија]';
  const companyManager = company?.manager || '[Управител]';
  
  // Employee data
  const employeeName = formData.employeeName || '[Име на вработен]';
  const employeeAddress = formData.employeeAddress || '[Адреса на вработен]';
  const employeePIN = formData.employeePIN || '[ЕМБГ]';
  const jobPosition = formData.jobPosition || '[Работно место]';
  const workTasks = formData.workTasks || [];
  const netSalary = formData.netSalary || '[Плата]';
  const placeOfWork = formData.otherWorkPlace || formData.placeOfWork || 'просториите на седиштето на работодавачот';
  const agreementDate = formData.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const agreementDurationType = formData.agreementDurationType || 'неопределено времетраење.';
  const definedDuration = formData.definedDuration ? moment(formData.definedDuration).format('DD.MM.YYYY') : '';
  const dailyWorkTime = formData.otherWorkTime || formData.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';
  const concurrentClauseInput = formData.concurrentClauseInput || '';

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
  workTasks.forEach(task => {
    if (task.trim()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `- ${task}`,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  });

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
    
    // Article 5 - Salary
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true }),
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
    
    // Article 6
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true }),
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
    
    // Section IV - Rights and Obligations
    new Paragraph({
      children: [
        new TextRun({ text: "IV. ПРАВА И ДОЛЖНОСТИ НА РАБОТНИОТ ОДНОС", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 9
    new Paragraph({
      children: [
        new TextRun({ text: "Член 9", bold: true }),
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
          text: `(2) Да му обезбеди на работникот нормални услови за извршување на доделените работни обврски и сите потребни средства и работна опрема со цел да му овозможи на работникот да ги исполнува своите обврски и да се овозможи слободен пристап до просториите за време на работното време.`,
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
    new Paragraph({ text: "" }),
  );

  // Add concurrent clause if provided
  if (formData.concurrentClause && concurrentClauseInput) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "VII. ЗАБРАНА ЗА КОНКУРЕНЦИЈА", bold: true }),
        ],
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Член 12", bold: true }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `За времетраењето или по завршувањето на овој работен однос, а најдоцна за период од ${concurrentClauseInput}, работникот не смее да се јави како основач, таен содружник, партнер, управител, одговорно лице, вработен, надворешен соработник или на друг начин ангажирано лице во трговско друштво формирано во државата или надвор од неа, кое врши иста или слична дејност со дејноста работодавачот.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Доколку работникот постапи спротивно на ставот 1 од овој договор истиот се согласува да исплати договорна казна во висина од 12 бруто месечни плати кои ги добивал за време на работниот однос кај работодавачот.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({ text: "" })
    );
  }

  // Final provisions
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "XI. СТАПУВАЊЕ НА СИЛА", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "Член 22", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот за вработување се склучува во писмена форма во два примероци, еден за работникот и еден за потребите на работодавачот.`,
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

  return { doc };
}

module.exports = generateEmploymentAgreementDoc;