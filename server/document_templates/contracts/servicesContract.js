const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

/**
 * Services Contract Template (Договор за услуги)
 * Based on Macedonian Law Articles 619-648 (Contract for Work - Договор за дело)
 * Generates professional service agreement with comprehensive legal compliance
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateServicesContractDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Contract parties data
  const userRole = formData?.userRole || 'давател';

  // Determine which party is which based on user's role
  let providerName, providerAddress, providerTaxNumber, providerManager;
  let clientName, clientAddress, clientTaxNumber, clientManager;

  if (userRole === 'давател') {
    // User's company is the service provider
    providerName = companyName;
    providerAddress = companyAddress;
    providerTaxNumber = companyTaxNumber;
    providerManager = companyManager;

    // Other party is the client
    clientName = formData?.clientName || '[Име на корисник]';
    clientAddress = formData?.clientAddress || '[Адреса на корисник]';
    clientTaxNumber = formData?.clientTaxNumber || '[Даночен број на корисник]';
    clientManager = formData?.clientManager || '[Управител на корисник]';
  } else {
    // User's company is the client
    clientName = companyName;
    clientAddress = companyAddress;
    clientTaxNumber = companyTaxNumber;
    clientManager = companyManager;

    // Other party is the provider
    providerName = formData?.providerName || '[Име на давател]';
    providerAddress = formData?.providerAddress || '[Адреса на давател]';
    providerTaxNumber = formData?.providerTaxNumber || '[Даночен број на давател]';
    providerManager = formData?.providerManager || '[Управител на давател]';
  }

  // Contract basic data
  const contractDate = formData?.contractDate ? moment(formData.contractDate).format('DD.MM.YYYY') : '[Датум]';
  const contractLocation = formData?.contractLocation || '[Место]';

  // Service description
  const serviceType = formData?.serviceType || '[Вид на услуга]';
  const serviceDescription = formData?.serviceDescription || '[Опис на услуга]';
  const deliverables = formData?.deliverables || '[Очекувани резултати]';

  // Execution details
  const startDate = formData?.startDate ? moment(formData.startDate).format('DD.MM.YYYY') : '[Почеток]';
  const deadline = formData?.deadline ? moment(formData.deadline).format('DD.MM.YYYY') : '[Рок]';
  const deadlineExtensionAllowed = formData?.deadlineExtensionAllowed || false;
  const executionLocation = formData?.executionLocation || 'според договор';
  const supervisionRights = formData?.supervisionRights || 'periodic';

  const supervisionText = {
    'full': 'Корисникот има право на целосен надзор и може да надгледува во секое време за време на извршувањето на работите, без да го попречува нормалното одвивање на работниот процес.',
    'periodic': 'Корисникот има право на периодичен надзор при договорени контролни точки за проверка на напредокот и квалитетот на работата.',
    'final': 'Корисникот ќе изврши инспекција само по завршувањето на работата, без надзор за време на извршувањето.'
  };

  // Payment structure
  const paymentStructure = formData?.paymentStructure || 'fixed';
  const totalAmount = formData?.totalAmount ? `${parseInt(formData.totalAmount).toLocaleString('mk-MK')},00` : '[Износ]';
  const hourlyRate = formData?.hourlyRate ? `${parseInt(formData.hourlyRate).toLocaleString('mk-MK')},00` : '[Стапка]';
  const estimatedHours = formData?.estimatedHours || '[Часови]';
  const maxBudget = formData?.maxBudget ? `${parseInt(formData.maxBudget).toLocaleString('mk-MK')},00` : null;
  const advancePayment = formData?.advancePayment || false;
  const advancePaymentPercentage = formData?.advancePaymentPercentage || '30';
  const paymentDeadline = formData?.paymentDeadline || '30';
  const bankAccount = formData?.bankAccount || '[Број на сметка]';
  const bankName = formData?.bankName || '[Банка]';
  const includesVAT = formData?.includesVAT ? 'со вклучен ДДВ' : 'без ДДВ';
  const latePaymentPenalty = formData?.latePaymentPenalty || '0.3';

  // Milestones (if applicable)
  const numberOfMilestones = parseInt(formData?.numberOfMilestones) || 0;
  const milestones = [];
  if (paymentStructure === 'milestone-based' && numberOfMilestones > 0) {
    for (let i = 1; i <= numberOfMilestones; i++) {
      milestones.push({
        description: formData?.[`milestone${i}Description`] || `[Фаза ${i}]`,
        percentage: formData?.[`milestone${i}Percentage`] || '0',
        amount: formData?.[`milestone${i}Amount`] ? `${parseInt(formData[`milestone${i}Amount`]).toLocaleString('mk-MK')},00` : '[Износ]'
      });
    }
  }

  // Materials
  const materialProvider = formData?.materialProvider || 'provider';
  const materialsDescription = formData?.materialsDescription || '';
  const materialsCostIncluded = formData?.materialsCostIncluded || false;

  const materialProviderText = {
    'provider': 'Давателот на услуга ги обезбедува сите потребни материјали, опрема и алатки за извршување на работата согласно Член 620-621 од Законот за облигациони односи и одговара за нивниот квалитет и соодветност.',
    'client': 'Корисникот на услугата ги обезбедува сите потребни материјали според спецификациите на давателот на услуга. Давателот на услуга не одговара за квалитетот на материјалите обезбедени од корисникот, освен ако не го предупреди корисникот дека истите се несоодветни.',
    'mixed': 'Материјалите се обезбедуваат заеднички од двете страни според следната распределба:',
    'none': 'Оваа услуга не бара материјали (интелектуална или консултантска работа).'
  };

  // Quality and acceptance
  const qualityStandards = formData?.qualityStandards || '[Стандарди за квалитет]';
  const acceptanceProcedure = formData?.acceptanceProcedure || 'written-protocol';
  const inspectionPeriod = formData?.inspectionPeriod || '14';
  const warrantyPeriod = formData?.warrantyPeriod || '6';
  const defectRemedies = formData?.defectRemedies || ['repair', 'price-reduction', 'termination'];

  const acceptanceProcedureText = {
    'written-protocol': 'Страните составуваат писмен записник за примопредавање во кој се констатира состојбата на извршената работа согласно Член 633 од Законот за облигациони односи.',
    'inspection-approval': 'Корисникот врши детална инспекција и доставува писмено одобрение за прифаќање на работата.',
    'email-confirmation': 'Корисникот го потврдува примањето и прифаќањето на работата преку електронска пошта.',
    'automatic': `Доколку корисникот не достави писмени приговори во рок од ${inspectionPeriod} дена од примопредавањето, работата се смета за прифатена.`
  };

  const remedyLabels = {
    'repair': 'Отстранување на недостатоците (поправка)',
    'price-reduction': 'Намалување на цената сразмерно на недостатоците',
    'redo': 'Повторно извршување на работата',
    'termination': 'Раскинување на договорот и враќање на цената'
  };

  // Termination
  const terminationNotice = formData?.terminationNotice || '15';
  const terminationForBreach = formData?.terminationForBreach || false;
  const confidentiality = formData?.confidentiality || false;
  const disputeResolution = formData?.disputeResolution || 'court';

  const disputeResolutionText = {
    'court': `Сите спорови што произлегуваат од овој договор ќе бидат решавани пред надлежен суд во ${contractLocation}.`,
    'arbitration': 'Сите спорови ќе бидат решавани преку арбитража согласно Законот за трговска арбитража.',
    'mediation-first': 'Страните се обврзуваат прво да се обидат да го решат спорот преку медијација, а доколку медијацијата не успее во рок од 30 дена, спорот ќе се решава пред надлежен суд.'
  };

  // Build document paragraphs
  const children = [
    // Document title
    new Paragraph({
      children: [
        new TextRun({
          text: 'ДОГОВОР ЗА УСЛУГИ',
          bold: true,
          size: 28
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: '(Contract for Services)',
          italics: true,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Contract introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${contractDate} година, во ${contractLocation}, помеѓу:`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Party 1 - Service Provider
    new Paragraph({
      children: [
        new TextRun({ text: '1. ', bold: true }),
        new TextRun({ text: providerName, bold: true }),
        new TextRun({
          text: `, со седиште на ул. ${providerAddress}, со даночен број ${providerTaxNumber}, претставувано од ${providerManager} (во понатамошниот текст: „Давател на услуга"), од една страна, и`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Party 2 - Client
    new Paragraph({
      children: [
        new TextRun({ text: '2. ', bold: true }),
        new TextRun({ text: clientName, bold: true }),
        new TextRun({
          text: `, со седиште на ул. ${clientAddress}, со даночен број ${clientTaxNumber}, претставувано од ${clientManager} (во понатамошниот текст: „Корисник на услугата"), од друга страна.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // SECTION I: ПРЕДМЕТ НА ДОГОВОРОТ
    new Paragraph({
      children: [
        new TextRun({
          text: 'I. ПРЕДМЕТ НА ДОГОВОРОТ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 1
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 1', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ОПИС НА УСЛУГАТА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Давателот на услуга се обврзува да изведе следната услуга за корисникот согласно Член 619 од Законот за облигациони односи:`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Вид на услуга: ${serviceType}`,
          bold: true
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: serviceDescription
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Очекуваните резултати/испораки се:',
          bold: true
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: deliverables
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // SECTION II: РОКОВИ ЗА ИЗВРШУВАЊЕ
    new Paragraph({
      children: [
        new TextRun({
          text: 'II. РОКОВИ ЗА ИЗВРШУВАЊЕ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 2
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 2', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПОЧЕТОК И ЗАВРШУВАЊЕ НА РАБОТИТЕ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Давателот на услуга ќе ги започне работите на ден ${startDate} година и ќе ги заврши најдоцна до ${deadline} година, согласно Член 626 од Законот за облигациони односи (правилно и навремено извршување).`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    })
  ];

  if (deadlineExtensionAllowed) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Рокот за завршување може да се продолжи со писмена согласност на двете страни во случај на објективни причини (виша сила, значителни промени во обемот на работа, доцнење на корисникот со обезбедување на материјали или информации).'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );
  }

  if (executionLocation && executionLocation !== 'според договор') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Работите се изведуваат на следната локација: ${executionLocation}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  } else {
    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      })
    );
  }

  // SECTION III: ПРАВА НА НАДЗОР
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'III. ПРАВА НА НАДЗОР И СОРАБОТКА',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 3
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 3', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'НАДЗОР НА КОРИСНИКОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Согласно Член 622 од Законот за облигациони односи, корисникот на услугата има право на надзор при извршувањето на работата како следува:'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: supervisionText[supervisionRights] || supervisionText['periodic']
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  // SECTION IV: НАДОМЕСТОК И ПЛАЌАЊЕ
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'IV. НАДОМЕСТОК И УСЛОВИ НА ПЛАЌАЊЕ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 4
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 4', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПРЕСМЕТКА НА НАДОМЕСТОКОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  // Payment structure specific paragraphs
  if (paymentStructure === 'fixed') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Вкупниот надоместок за извршување на услугата изнесува фиксен износ од ${totalAmount} денари ${includesVAT}, согласно Член 642 од Законот за облигациони односи.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );

    if (advancePayment) {
      const calculatedAdvance = formData?.totalAmount
        ? `${parseInt((formData.totalAmount * parseInt(advancePaymentPercentage)) / 100).toLocaleString('mk-MK')},00`
        : '[Аванс]';

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Корисникот ќе исплати аванс од ${advancePaymentPercentage}% (${calculatedAdvance} денари) при потпишување на договорот, а остатокот по завршување и примопредавање на работата.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        })
      );
    }
  }

  if (paymentStructure === 'time-based') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Надоместокот се пресметува според временска основа како следува:'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `• Часовна стапка: ${hourlyRate} денари по час`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100, line: 276 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `• Проценет број на часови: ${estimatedHours} часа`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100, line: 276 }
      })
    );

    if (formData?.estimatedHours && formData?.hourlyRate) {
      const estimatedTotal = `${parseInt(formData.estimatedHours * formData.hourlyRate).toLocaleString('mk-MK')},00`;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• Проценета вкупна вредност: ${estimatedTotal} денари`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        })
      );
    }

    if (maxBudget) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Договорен е максимален буџет од ${maxBudget} денари кој не може да се надмине без писмена согласност на корисникот.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        })
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Конечниот износ ќе се пресмета врз основа на реално работените часови, евидентирани во работни извештаи потпишани од двете страни.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );
  }

  if (paymentStructure === 'milestone-based' && milestones.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Надоместокот се исплаќа согласно следните фази на извршување:'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );

    milestones.forEach((milestone, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Фаза ${index + 1}: ${milestone.description}`,
              bold: true
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Износ: ${milestone.amount} денари (${milestone.percentage}% од вкупната вредност)`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        })
      );
    });
  }

  // Article 5 - Payment terms
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 5', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'НАЧИН НА ПЛАЌАЊЕ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Плаќањето се врши преку банкарски трансфер на трансакциска сметка број ${bankAccount}, депонент на ${bankName}, во рок од ${paymentDeadline} дена од датумот на издавање на фактурата.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `За задоцнето плаќање, корисникот е должен да плати казнена камата во износ од ${latePaymentPenalty}% дневно согласно Законот за финансиска дисциплина.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    })
  );

  // SECTION V: МАТЕРИЈАЛИ
  if (materialProvider !== 'none') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'V. МАТЕРИЈАЛИ И РЕСУРСИ',
            bold: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Article 6
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 6', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'ОБЕЗБЕДУВАЊЕ НА МАТЕРИЈАЛИ', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: materialProviderText[materialProvider] || materialProviderText['provider']
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );

    if (materialsDescription) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: materialsDescription
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        })
      );
    }

    if (materialProvider === 'provider' && materialsCostIncluded) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Трошоците за материјали се веќе вклучени во договорениот надоместок.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        })
      );
    } else if (materialProvider === 'provider' && !materialsCostIncluded) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Материјалите се фактурираат одделно според реална потрошувачка со документирани докази.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        })
      );
    } else {
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 }
        })
      );
    }
  }

  // SECTION VI: КВАЛИТЕТ И ПРИМОПРЕДАВАЊЕ
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'VI. КВАЛИТЕТ И ПРИМОПРЕДАВАЊЕ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 7
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 7', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'СТАНДАРДИ ЗА КВАЛИТЕТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Давателот на услуга се согласува дека работата ќе ја изведе според следните стандарди за квалитет и професионалност, согласно Член 626 од Законот за облигациони односи:'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: qualityStandards
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 8
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 8', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПРИМОПРЕДАВАЊЕ И ИНСПЕКЦИЈА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'По завршувањето на работата, примопредавањето се врши на следниот начин:'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: acceptanceProcedureText[acceptanceProcedure] || acceptanceProcedureText['written-protocol']
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 9
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 9', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'НЕДОСТАТОЦИ И ГАРАНЦИЈА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Корисникот е должен видливите недостатоци да ги пријави во рок од ${inspectionPeriod} дена од примопредавањето согласно Член 634-635 од Законот за облигациони односи.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Давателот на услуга дава гаранција за квалитетот на работата во период од ${warrantyPeriod} месеци од денот на примопредавањето и одговара за скриени недостатоци откриени во овој период согласно Член 637-640 од Законот за облигациони односи.`
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'При утврдени материјални недостатоци, корисникот има право на:',
          bold: true
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    })
  );

  // Add remedy options
  const selectedRemedies = Array.isArray(defectRemedies) ? defectRemedies : ['repair', 'price-reduction', 'termination'];
  selectedRemedies.forEach(remedy => {
    if (remedyLabels[remedy]) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${remedyLabels[remedy]}`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 276 }
        })
      );
    }
  });

  children.push(
    new Paragraph({
      text: '',
      spacing: { after: 400 }
    })
  );

  // SECTION VII: ВРЕМЕТРАЕЊЕ И РАСКИНУВАЊЕ
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'VII. ВРЕМЕТРАЕЊЕ И РАСКИНУВАЊЕ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 10
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 10', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ТРАЕЊЕ НА ДОГОВОРОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој договор влегува во сила на денот на потпишување и важи до целосното извршување на договорените обврски или до негово раскинување согласно овој договор.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 11
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 11', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'РАСКИНУВАЊЕ НА ДОГОВОРОТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Согласно Член 648 од Законот за облигациони односи, корисникот на услугата има право да го раскине овој договор и пред завршувањето на работата, со обврска да ја плати завршената работа и да го надомести пропуштениот добив на давателот на услуга.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    })
  );

  if (terminationNotice) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `При раскинување, страната која раскинува е должна да достави писмено известување ${terminationNotice} дена однапред.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 300, line: 276 }
      })
    );
  }

  if (terminationForBreach) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Во случај на суштествена повреда на договорните обврски од страна на една од страните (вклучувајќи неплаќање, голема задоцнување, грубо кршење на стандарди), другата страна има право на итно раскинување на договорот со писмено известување.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  } else {
    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      })
    );
  }

  // SECTION VIII: ЗАВРШНИ ОДРЕДБИ
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'VIII. ЗАВРШНИ ОДРЕДБИ',
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // Article 12
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 12', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ДОВЕРЛИВОСТ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  );

  if (confidentiality) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Давателот на услуга се обврзува дека ќе ги чува како строго доверливи сите деловни информации, податоци и документи на корисникот до кои доаѓа при извршување на услугата, и нема да ги открива на трети лица без претходна писмена согласност на корисникот.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Страните не преземаат посебни обврски за доверливост освен оние што произлегуваат од општите правни прописи.'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      })
    );
  }

  // Article 13
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 13', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ВИША СИЛА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Ниту една од страните не е одговорна за неизвршување или задоцнување во извршувањето на обврските предизвикани од настани на виша сила (елементарни непогоди, војна, епидемии, владини мерки) кои се надвор од нивната разумна контрола.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 14
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 14', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'РЕШАВАЊЕ НА СПОРОВИ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: disputeResolutionText[disputeResolution] || disputeResolutionText['court']
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 15
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 15', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ПРИМЕНЛИВО ПРАВО', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој договор се толкува и применува согласно законите на Република Северна Македонија, особено Законот за облигациони односи (Членови 619-648 - Договор за дело).'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 16
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 16', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'ИЗМЕНИ И ДОПОЛНУВАЊА', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Измени и дополнувања на овој договор можат да се вршат само со писмен анекс потпишан од двете страни.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Article 17
    new Paragraph({
      children: [
        new TextRun({ text: 'Член 17', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'БРОЈ НА ПРИМЕРОЦИ', bold: true })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'Овој договор е составен во 2 (два) истоветни примероци, по еден за секоја договорна страна.'
        })
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600, line: 276 }
    }),

    // Signature section
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор е потпишан од двете страни на ден ${contractDate} година.`,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600, line: 276 }
    }),

    // Provider signature
    new Paragraph({
      children: [
        new TextRun({ text: 'ЗА ДАВАТЕЛОТ НА УСЛУГА:' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '___________________________' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: providerName })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: providerManager })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 }
    }),

    // Client signature
    new Paragraph({
      children: [
        new TextRun({ text: 'ЗА КОРИСНИКОТ НА УСЛУГАТА:' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '___________________________' })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: clientName })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: clientManager })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 }
    })
  );

  const sections = [{ children }];
  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateServicesContractDoc;
