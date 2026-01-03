const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');
const { formatMKD } = require('../../utils/documentUtils');

function generateMediationAgreementDoc(formData, user, company) {
  // Company data with defaults - using the standardized field mapping
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕДБ број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Form data with defaults - Enhanced for comprehensive legal compliance
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');

  // Basic agreement details
  const agreementDuration = formData?.agreementDuration || '[Времетраење на договорот]';
  const territoryScope = formData?.territoryScope || '[Територијален опсег]';

  // Service details
  const typeOfMediation = formData?.typeOfMediation || '[Тип на посредување]';
  const specificContractType = formData?.specificContractType || '[Специфичен тип на договор]';
  const targetContractValueRange = formData?.targetContractValueRange || '[Очекувана вредност]';

  // Financial terms
  const commissionRate = formData?.commissionRate || '[Стапка на комисија]';
  const commissionCalculation = formData?.commissionCalculation || '[Начин на пресметка]';
  const fixedCommissionAmount = formData?.fixedCommissionAmount ? formatMKD(formData.fixedCommissionAmount, { includeCurrency: false }) : '';
  const minimumCommission = formData?.minimumCommission ? formatMKD(formData.minimumCommission, { includeCurrency: false }) : '';
  const maximumCommission = formData?.maximumCommission ? formatMKD(formData.maximumCommission, { includeCurrency: false }) : '';
  const paymentTiming = formData?.paymentTiming || '[Време на плаќање]';

  // Legal terms
  const costReimbursement = formData?.costReimbursement || false;
  const travelCostsIncluded = formData?.travelCostsIncluded || false;
  const advertisementCostsIncluded = formData?.advertisementCostsIncluded || false;
  const legalConsultationCostsIncluded = formData?.legalConsultationCostsIncluded || false;
  const confidentialityPeriod = formData?.confidentialityPeriod || '3 години';
  const mediatorDiaryRequired = formData?.mediatorDiaryRequired !== false; // Default true
  const writtenAuthorizationForPerformance = formData?.writtenAuthorizationForPerformance || false;
  const exclusiveMediation = formData?.exclusiveMediation || false;
  const dualRepresentationAllowed = formData?.dualRepresentationAllowed || false;
  const earlyTerminationNoticePeriod = formData?.earlyTerminationNoticePeriod || 'Без известување';
  const disputeResolution = formData?.disputeResolution || 'Суд во Скопје';

  // Conditional role-based data mapping
  const isMediator = formData?.userRole === 'mediator';
  const isClient = formData?.userRole === 'client';
  const isClientNatural = formData?.clientType === 'natural' || formData?.clientTypeForMediator === 'natural';
  const isClientLegal = formData?.clientType === 'legal' || formData?.clientTypeForMediator === 'legal';

  // Enhanced mediator and client information mapping
  let mediatorName, mediatorAddress, mediatorTaxNumber, mediatorManager, mediatorPhone, mediatorEmail;
  let clientName, clientAddress, clientTaxNumber, clientPin, clientManager, clientPhone, clientEmail;

  if (isMediator) {
    // User's company is the mediator
    mediatorName = companyName;
    mediatorAddress = companyAddress;
    mediatorTaxNumber = companyTaxNumber;
    mediatorManager = companyManager;
    mediatorPhone = formData?.mediatorPhone || '[Телефон на посредникот]';
    mediatorEmail = formData?.mediatorEmail || '[Е-пошта на посредникот]';

    // Client data from form
    if (isClientNatural) {
      clientName = formData?.naturalClientName || '[Име на клиентот]';
      clientAddress = formData?.naturalClientAddress || '[Адреса на клиентот]';
      clientPin = formData?.naturalClientPin || '[ЕМБГ на клиентот]';
      clientPhone = formData?.naturalClientPhone || '[Телефон на клиентот]';
      clientEmail = formData?.naturalClientEmail || '[Е-пошта на клиентот]';
      clientTaxNumber = '';
      clientManager = '';
    } else {
      clientName = formData?.legalClientName || '[Име на клиентот]';
      clientAddress = formData?.legalClientAddress || '[Адреса на клиентот]';
      clientTaxNumber = formData?.legalClientTaxNumber || '[ЕДБ на клиентот]';
      clientManager = formData?.legalClientManager || '[Управител на клиентот]';
      clientPhone = formData?.legalClientPhone || '[Телефон на клиентот]';
      clientEmail = formData?.legalClientEmail || '[Е-пошта на клиентот]';
      clientPin = '';
    }
  } else {
    // User's company is the client
    clientName = companyName;
    clientAddress = companyAddress;
    clientTaxNumber = companyTaxNumber;
    clientManager = companyManager;
    clientPhone = formData?.clientPhone || '[Телефон на клиентот]';
    clientEmail = formData?.clientEmail || '[Е-пошта на клиентот]';
    clientPin = '';

    // Mediator data from form
    mediatorName = formData?.mediatorCompanyName || '[Име на посредникот]';
    mediatorAddress = formData?.mediatorCompanyAddress || '[Адреса на посредникот]';
    mediatorTaxNumber = formData?.mediatorCompanyTaxNumber || '[ЕДБ на посредникот]';
    mediatorManager = formData?.mediatorCompanyManager || '[Управител на посредникот]';
    mediatorPhone = formData?.mediatorCompanyPhone || '[Телефон на посредникот]';
    mediatorEmail = formData?.mediatorCompanyEmail || '[Е-пошта на посредникот]';
  }


  // Generate enhanced party descriptions based on role and type
  let mediatorDescription = `${mediatorName}, со седиште на ${mediatorAddress}, со ЕДБ ${mediatorTaxNumber}, претставувано од Управител ${mediatorManager}, телефон: ${mediatorPhone}, е-пошта: ${mediatorEmail}`;

  let clientDescription;
  if (isClientNatural) {
    clientDescription = `${clientName}, со адреса на живеење ${clientAddress}, со ЕМБГ ${clientPin}, телефон: ${clientPhone}, е-пошта: ${clientEmail}`;
  } else {
    clientDescription = `${clientName}, со седиште на ${clientAddress}, со ЕДБ ${clientTaxNumber}, претставувано од ${clientManager}, телефон: ${clientPhone}, е-пошта: ${clientEmail}`;
  }

  const children = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР ЗА ПОСРЕДУВАЊЕ", bold: true, size: 32 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),

    // Legal basis reference
    new Paragraph({
      children: [
        new TextRun({
          text: "(според членови 869-882 од Законот за облигациони односи)",
          italic: true,
          size: 20
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 },
    }),

    // Introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${agreementDate} година за време од ${agreementDuration}, со територијален опсег: ${territoryScope}, помеѓу:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // First Party - Based on user role
    new Paragraph({
      children: [
        new TextRun({ text: "1. ПОСРЕДНИК:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${mediatorDescription}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "(во натамошниот текст: \"Посредникот\")" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 },
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "и", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),

    // Second Party
    new Paragraph({
      children: [
        new TextRun({ text: isClientNatural ? "2. НАЛОГОДАВЕЦ (физичко лице):" : "2. НАЛОГОДАВЕЦ (правно лице):", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${clientDescription}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "(во натамошниот текст: \"Налогодавецот\")" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 },
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "Заеднички именувани како \"Договорните страни\"", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 },
    }),

    // Legal preamble
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорните страни, врз основа на членови 869-882 од Законот за облигациони односи, се договорија за следното:`,
          bold: true
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500 },
    }),

    // Article 1 - Definition and Subject (Art. 869)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ДЕФИНИЦИЈА И ПРЕДМЕТ НА ДОГОВОРОТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 869 од ЗОО, со овој договор за посредување Посредникот се обврзува да го најде и поврзе Налогодавецот со трето лице за склучување на договор од типот: ${specificContractType}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Типот на посредување: ${typeOfMediation}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Очекувана вредност на договорот: ${targetContractValueRange}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 2 - Territory and Duration
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ТЕРИТОРИЈАЛЕН ОПСЕГ И ВРЕМЕТРАЕЊЕ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Посредувањето ќе се извршува на територијата: ${territoryScope}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот се склучува за период од ${agreementDuration}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 872 од ЗОО, Налогодавецот може да го отповика налогот во секое време${earlyTerminationNoticePeriod !== 'Без известување' ? ` со известување од ${earlyTerminationNoticePeriod}` : ''}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 3 - Obligations of Mediator (Art. 874-877)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ОБВРСКИ НА ПОСРЕДНИКОТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно членови 874-877 од ЗОО, Посредникот се обврзува:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `a) Да ги извршува услугите на посредување со грижата на добар деловен човек (член 874);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `b) Да го известува Налогодавецот за сите околности од кои зависи успехот на посредувањето (член 875);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `c) Да одговара за штета предизвикана со своја вина, за работа со деловно неспособни лица и за повреда на доверливост (член 876);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `d) Да води дневник на посредување и да издава потврди за извршените активности (член 877);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `e) Да ги чува како строго доверливи сите информации добиени од Налогодавецот за период од ${confidentialityPeriod};`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `f) ${exclusiveMediation ? 'Да работи исклучиво за овој Налогодавец во рамките на договорениот предмет;' : 'Да не работи против интересите на Налогодавецот (член 882);'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 4 - Rights and Obligations of Principal (Art. 872-873, 878-882)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ПРАВА И ОБВРСКИ НА НАЛОГОДАВЕЦОТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Налогодавецот има право:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `a) Да го отповика налогот во секое време (член 872);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `b) Да не биде обврзан да преговара или склучи договор со најденото лице (член 873);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `c) Да бара информации за сите релевантни околности (член 875).`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Налогодавецот се обврзува:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `a) Да ја плати договорената провизија согласно член 878-879 од ЗОО;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `b) Да обезбеди сите потребни информации и документи за извршување на услугите;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `c) ${costReimbursement ? 'Да ги надомести договорените трошоци (член 880);' : 'Не е обврзан за надомест на трошоци (член 880);'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `d) Да соработува со Посредникот при извршување на услугите.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 5 - Commission Structure (Art. 878-881)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ПРОВИЗИЈА И НАДОМЕСТОК", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно членови 878-879 од ЗОО, Посредникот има право на надоместок дури и кога тоа не е договорено.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Провизијата се пресметува: ${commissionCalculation}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Стапка на провизија: ${commissionRate}% од вредноста на договорот`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    ...(fixedCommissionAmount ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Фиксен износ: ${fixedCommissionAmount} денари`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 },
      })
    ] : []),
    ...(minimumCommission ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Минимална провизија: ${minimumCommission} денари`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 },
      })
    ] : []),
    ...(maximumCommission ? [
      new Paragraph({
        children: [
          new TextRun({
            text: `Максимална провизија: ${maximumCommission} денари`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 },
      })
    ] : []),
    new Paragraph({
      children: [
        new TextRun({
          text: `Времето на плаќање: ${paymentTiming}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${dualRepresentationAllowed ? 'Согласно член 881, ако Посредникот ги застапува двете страни, провизијата се дели попола.' : 'Посредникот работи исклучиво за Налогодавецот.'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 6 - Cost Reimbursement (Art. 880)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "НАДОМЕСТ НА ТРОШОЦИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 880 од ЗОО, ${costReimbursement ? 'Посредникот има право на надомест на трошоци.' : 'трошоците се надоместуваат само ако е тоа договорено.'} Договорени се следните трошоци:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `• Патни трошоци: ${travelCostsIncluded ? 'ДА' : 'НЕ'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `• Трошоци за рекламирање: ${advertisementCostsIncluded ? 'ДА' : 'НЕ'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `• Правни консултации: ${legalConsultationCostsIncluded ? 'ДА' : 'НЕ'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 7 - Authorization and Documentation (Art. 871, 877)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ОВЛАСТУВАЊЕ И ДОКУМЕНТАЦИЈА", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 871 од ЗОО, ${writtenAuthorizationForPerformance ? 'Посредникот има писмено овластување да прима исполнување.' : 'Посредникот нема право да прима исполнување без специјално писмено овластување.'}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 877 од ЗОО, Посредникот е обврзан да води дневник на посредување и да издава потврди за извршените активности.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 8 - Termination and Loss of Compensation Rights (Art. 872, 882)
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "РАСКИНУВАЊЕ И ГУБЕЊЕ НА ПРАВОТО НА НАДОМЕСТОК", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 872 од ЗОО, Налогодавецот може да го отповика налогот во секое време${earlyTerminationNoticePeriod !== 'Без известување' ? ` со известување од ${earlyTerminationNoticePeriod}` : ''}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно член 882 од ЗОО, Посредникот го губи правото на надоместок ако работи против интересите на Налогодавецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),


    // Article 9 - Dispute Resolution
    new Paragraph({
      children: [
        new TextRun({ text: "Член 9", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "РЕШАВАЊЕ НА СПОРОВИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите спорови што произлегуваат од овој договор ќе се решаваат пред: ${disputeResolution}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Применливо е законодавството на Република Северна Македонија, особено одредбите од членови 869-882 од Законот за облигациони односи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 },
    }),

    // Article 10 - Final Provisions
    new Paragraph({
      children: [
        new TextRun({ text: "Член 10", bold: true, size: 24 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ЗАВРШНИ ОДРЕДБИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите измени и дополнувања на договорот мора да се направат во писмена форма и да бидат потпишани од двете страни.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `За сè што не е уредено со овој договор, применуваат се одредбите од Законот за облигациони односи на Република Северна Македонија.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот е составен во 2 (два) истоветни примероци, по еден за секоја договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот влегува во сила со потпишувањето од двете страни.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500 },
    })
  ];

  // Enhanced signatures section with proper formatting
  children.push(
    // Date and place of signing
    new Paragraph({
      children: [
        new TextRun({ text: `Место и датум: Скопје, ${agreementDate}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),

    // Mediator signature
    new Paragraph({
      children: [
        new TextRun({ text: "ЗА ПОСРЕДНИКОТ:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: mediatorName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Управител: ${mediatorManager}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Телефон: ${mediatorPhone}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Е-пошта: ${mediatorEmail}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 }
    }),

    // Client signature
    new Paragraph({
      children: [
        new TextRun({ text: "ЗА НАЛОГОДАВЕЦОТ:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: clientName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    ...(isClientNatural ? [
      new Paragraph({
        children: [
          new TextRun({ text: `ЕМБГ: ${clientPin}` }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 }
      })
    ] : [
      new Paragraph({
        children: [
          new TextRun({ text: `Управител: ${clientManager}` }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 }
      })
    ]),
    new Paragraph({
      children: [
        new TextRun({ text: `Телефон: ${clientPhone}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Е-пошта: ${clientEmail}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    })
  );

  const sections = [{
    children,
    properties: {
      page: {
        margin: {
          top: 1440,    // 1 inch
          right: 1440,  // 1 inch
          bottom: 1440, // 1 inch
          left: 1440,   // 1 inch
        },
      },
    },
  }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateMediationAgreementDoc;