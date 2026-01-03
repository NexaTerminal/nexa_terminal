const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateDebtAssumptionAgreementDoc(formData, user, company) {
  // Company data (always using the standardized field mapping)
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.taxNumber || '[Даночен број]';
  const companyManager = company?.manager || '[Управител]';

  // Contract data with defaults
  const contractDate = formData?.contractDate ? moment(formData.contractDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const contractTown = formData?.contractTown || '[Град]';
  const userRole = formData?.userRole || 'debtor'; // 'debtor' (должник), 'creditor' (доверител), or 'third_party' (трето лице)
  const otherPartyType = formData?.otherPartyType || 'individual'; // 'individual' or 'company'

  // Determine roles based on user's position in the debt assumption
  let originalCreditorName, originalCreditorAddress, originalCreditorId, originalCreditorIdType, originalCreditorManager;
  let originalDebtorName, originalDebtorAddress, originalDebtorId, originalDebtorIdType, originalDebtorManager;
  let assumingPartyName, assumingPartyAddress, assumingPartyId, assumingPartyIdType, assumingPartyManager;

  if (userRole === 'creditor') {
    // User's company is the original creditor
    originalCreditorName = companyName;
    originalCreditorAddress = companyAddress;
    originalCreditorId = companyTaxNumber;
    originalCreditorIdType = 'Даночен број';
    originalCreditorManager = companyManager;

    // Original debtor data
    if (formData?.originalDebtorType === 'individual') {
      originalDebtorName = formData?.originalDebtorName || '[Име на првичен должник]';
      originalDebtorAddress = formData?.originalDebtorAddress || '[Адреса на првичен должник]';
      originalDebtorId = formData?.originalDebtorPIN || '[ЕМБГ на првичен должник]';
      originalDebtorIdType = 'ЕМБГ';
      originalDebtorManager = '';
    } else {
      originalDebtorName = formData?.originalDebtorCompanyName || '[Име на првична должничка компанија]';
      originalDebtorAddress = formData?.originalDebtorCompanyAddress || '[Адреса на првична должничка компанија]';
      originalDebtorId = formData?.originalDebtorCompanyTaxNumber || '[Даночен број на првична должничка компанија]';
      originalDebtorIdType = 'Даночен број';
      originalDebtorManager = formData?.originalDebtorCompanyManager || '[Управител на првична должничка компанија]';
    }

    // Assuming party data (the one taking over the debt)
    if (otherPartyType === 'individual') {
      assumingPartyName = formData?.assumingPartyName || '[Име на преземач на долг]';
      assumingPartyAddress = formData?.assumingPartyAddress || '[Адреса на преземач на долг]';
      assumingPartyId = formData?.assumingPartyPIN || '[ЕМБГ на преземач на долг]';
      assumingPartyIdType = 'ЕМБГ';
      assumingPartyManager = '';
    } else {
      assumingPartyName = formData?.assumingPartyCompanyName || '[Име на компанија преземач на долг]';
      assumingPartyAddress = formData?.assumingPartyCompanyAddress || '[Адреса на компанија преземач на долг]';
      assumingPartyId = formData?.assumingPartyCompanyTaxNumber || '[Даночен број на компанија преземач на долг]';
      assumingPartyIdType = 'Даночен број';
      assumingPartyManager = formData?.assumingPartyCompanyManager || '[Управител на компанија преземач на долг]';
    }
  } else if (userRole === 'debtor') {
    // User's company is the original debtor
    originalDebtorName = companyName;
    originalDebtorAddress = companyAddress;
    originalDebtorId = companyTaxNumber;
    originalDebtorIdType = 'Даночен број';
    originalDebtorManager = companyManager;

    // Original creditor data
    if (formData?.originalCreditorType === 'individual') {
      originalCreditorName = formData?.originalCreditorName || '[Име на доверител]';
      originalCreditorAddress = formData?.originalCreditorAddress || '[Адреса на доверител]';
      originalCreditorId = formData?.originalCreditorPIN || '[ЕМБГ на доверител]';
      originalCreditorIdType = 'ЕМБГ';
      originalCreditorManager = '';
    } else {
      originalCreditorName = formData?.originalCreditorCompanyName || '[Име на довериталска компанија]';
      originalCreditorAddress = formData?.originalCreditorCompanyAddress || '[Адреса на довериталска компанија]';
      originalCreditorId = formData?.originalCreditorCompanyTaxNumber || '[Даночен број на довериталска компанија]';
      originalCreditorIdType = 'Даночен број';
      originalCreditorManager = formData?.originalCreditorCompanyManager || '[Управител на довериталска компанија]';
    }

    // Assuming party data
    if (otherPartyType === 'individual') {
      assumingPartyName = formData?.assumingPartyName || '[Име на преземач на долг]';
      assumingPartyAddress = formData?.assumingPartyAddress || '[Адреса на преземач на долг]';
      assumingPartyId = formData?.assumingPartyPIN || '[ЕМБГ на преземач на долг]';
      assumingPartyIdType = 'ЕМБГ';
      assumingPartyManager = '';
    } else {
      assumingPartyName = formData?.assumingPartyCompanyName || '[Име на компанија преземач на долг]';
      assumingPartyAddress = formData?.assumingPartyCompanyAddress || '[Адреса на компанија преземач на долг]';
      assumingPartyId = formData?.assumingPartyCompanyTaxNumber || '[Даночен број на компанија преземач на долг]';
      assumingPartyIdType = 'Даночен број';
      assumingPartyManager = formData?.assumingPartyCompanyManager || '[Управител на компанија преземач на долг]';
    }
  } else {
    // User's company is the assuming party (third party taking over the debt)
    assumingPartyName = companyName;
    assumingPartyAddress = companyAddress;
    assumingPartyId = companyTaxNumber;
    assumingPartyIdType = 'Даночен број';
    assumingPartyManager = companyManager;

    // Original creditor data
    if (formData?.originalCreditorType === 'individual') {
      originalCreditorName = formData?.originalCreditorName || '[Име на доверител]';
      originalCreditorAddress = formData?.originalCreditorAddress || '[Адреса на доверител]';
      originalCreditorId = formData?.originalCreditorPIN || '[ЕМБГ на доверител]';
      originalCreditorIdType = 'ЕМБГ';
      originalCreditorManager = '';
    } else {
      originalCreditorName = formData?.originalCreditorCompanyName || '[Име на довериталска компанија]';
      originalCreditorAddress = formData?.originalCreditorCompanyAddress || '[Адреса на довериталска компанија]';
      originalCreditorId = formData?.originalCreditorCompanyTaxNumber || '[Даночен број на довериталска компанија]';
      originalCreditorIdType = 'Даночен број';
      originalCreditorManager = formData?.originalCreditorCompanyManager || '[Управител на довериталска компанија]';
    }

    // Original debtor data
    if (formData?.originalDebtorType === 'individual') {
      originalDebtorName = formData?.originalDebtorName || '[Име на првичен должник]';
      originalDebtorAddress = formData?.originalDebtorAddress || '[Адреса на првичен должник]';
      originalDebtorId = formData?.originalDebtorPIN || '[ЕМБГ на првичен должник]';
      originalDebtorIdType = 'ЕМБГ';
      originalDebtorManager = '';
    } else {
      originalDebtorName = formData?.originalDebtorCompanyName || '[Име на првична должничка компанија]';
      originalDebtorAddress = formData?.originalDebtorCompanyAddress || '[Адреса на првична должничка компанија]';
      originalDebtorId = formData?.originalDebtorCompanyTaxNumber || '[Даночен број на првична должничка компанија]';
      originalDebtorIdType = 'Даночен број';
      originalDebtorManager = formData?.originalDebtorCompanyManager || '[Управител на првична должничка компанија]';
    }
  }

  // Debt details
  const debtAmount = formData?.debtAmount || '[Износ на долг]';
  const debtCurrency = formData?.debtCurrency || 'МКД';
  const debtDescription = formData?.debtDescription || '[Опис на должничката обврска]';
  const originalContractDate = formData?.originalContractDate ? moment(formData.originalContractDate).format('DD.MM.YYYY') : '[Датум на првичен договор]';
  const originalContractNumber = formData?.originalContractNumber || '[Број на првичен договор]';
  const dueDate = formData?.dueDate ? moment(formData.dueDate).format('DD.MM.YYYY') : '[Датум на доспевање]';

  // Assumption terms
  const assumptionType = formData?.assumptionType || 'full'; // 'full' or 'partial'
  const releaseOriginalDebtor = formData?.releaseOriginalDebtor !== undefined ? formData.releaseOriginalDebtor : true;
  const additionalConditions = formData?.additionalConditions || '';

  const children = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ЗА ПРЕЗЕМАЊЕ НА ДОЛГ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),

    // Contract introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${contractDate} година, во ${contractTown}, помеѓу следните договорни страни:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Original Creditor
    new Paragraph({
      children: [
        new TextRun({ text: "1) ДОВЕРИТЕЛ:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: originalCreditorManager
            ? `${originalCreditorName}, со ${originalCreditorIdType} ${originalCreditorId}, на адреса: ул. ${originalCreditorAddress}, претставувано од Управителот ${originalCreditorManager}`
            : `${originalCreditorName}, со ${originalCreditorIdType} ${originalCreditorId}, на адреса: ул. ${originalCreditorAddress}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Original Debtor
    new Paragraph({
      children: [
        new TextRun({ text: "2) ПРВИЧЕН ДОЛЖНИК:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: originalDebtorManager
            ? `${originalDebtorName}, со ${originalDebtorIdType} ${originalDebtorId}, на адреса: ул. ${originalDebtorAddress}, претставувано од Управителот ${originalDebtorManager}`
            : `${originalDebtorName}, со ${originalDebtorIdType} ${originalDebtorId}, на адреса: ул. ${originalDebtorAddress}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // Assuming Party
    new Paragraph({
      children: [
        new TextRun({ text: "3) ПРЕЗЕМАЧ НА ДОЛГ:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: assumingPartyManager
            ? `${assumingPartyName}, со ${assumingPartyIdType} ${assumingPartyId}, на адреса: ул. ${assumingPartyAddress}, претставувано од Управителот ${assumingPartyManager}`
            : `${assumingPartyName}, со ${assumingPartyIdType} ${assumingPartyId}, на адреса: ул. ${assumingPartyAddress}`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500 }
    }),

    // Article 1 - Subject
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Предмет на договорот", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Предмет на овој договор е преземањето на должничката обврска од страна на Преземачот на долг кон Доверителот, која произлегува од ${debtDescription}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Должничката обврска е настаната врз основа на договор ${originalContractNumber ? `број ${originalContractNumber} ` : ''}од ${originalContractDate} година, склучен помеѓу Доверителот и Првичниот должник.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 2 - Debt Amount
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Износ на долгот", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Вкупниот износ на должничката обврска што се презема изнесува ${debtAmount} ${debtCurrency === 'МКД' ? 'денари' : debtCurrency === 'EUR' ? 'евра' : debtCurrency}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Рокот за исплата на должничката обврска е ${dueDate} година.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 3 - Type of Assumption
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Вид на преземање", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: assumptionType === 'full'
            ? `Преземачот на долг го презема целокупниот долг од Првичниот должник кон Доверителот.`
            : `Преземачот на долг презема дел од должничката обврска, при што Првичниот должник останува одговорен за остатокот од должничката обврска.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 4 - Release of Original Debtor
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Ослободување на првичниот должник", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: releaseOriginalDebtor
            ? `Со склучувањето на овој договор, Првичниот должник се ослободува од должничката обврска кон Доверителот, а целосната одговорност за исполнување на обврската преминува на Преземачот на долг.`
            : `Првичниот должник не се ослободува од должничката обврска и останува солидарно одговорен со Преземачот на долг за исполнување на обврската кон Доверителот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 5 - Obligations of Assuming Party
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Обврски на преземачот", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Преземачот на долг се обврзува:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Да ја исплати должничката обврска во договорениот рок и под договорените услови;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Да ги почитува сите услови и обврски од првичниот договор;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Да го известува Доверителот за секоја промена на своите податоци релевантни за овој договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
  ];

  // Article 6 - Rights and Warranties
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Права и гаранции", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Доверителот има право да бара директна исплата од Преземачот на долг без претходно барање од Првичниот должник.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Преземачот на долг гарантира дека поседува доволно средства за исполнување на обврската и дека нема правни пречки за склучување на овој договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 7 - Notification and Communications
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Известувања и комуникации", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите известувања поврзани со овој договор ќе се вршат писмено на адресите наведени во договорот или на електронска пошта доколку страните се согласат.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Промената на адресите мора да се пријави во рок од 15 дена од настанувањето на промената.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Article 8 - Consequences of Default
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Последици од неисполнување", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Во случај на неисполнување на обврските од страна на Преземачот на долг, Доверителот има право на:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `1) Наплата на казнена камата согласно Законот за облигационите односи;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `2) Раскинување на договорот и барање на целосната отштета;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `3) Принудно извршување преку надлежните органи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    })
  );

  // Add additional conditions if any
  if (additionalConditions && additionalConditions.trim()) {
    children.push(
      // Article 9 - Additional Conditions
      new Paragraph({
        children: [
          new TextRun({ text: "Член 9", bold: true }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, line: 276 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Дополнителни услови", bold: true }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200, line: 276 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: additionalConditions,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      })
    );
  }

  // Final articles - update article numbers based on whether additional conditions exist
  const finalArticleOffset = additionalConditions && additionalConditions.trim() ? 3 : 2;

  children.push(
    // Good Faith Article
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${7 + finalArticleOffset}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Добрата вера", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорните страни изјавуваат дека овој договор го склучуваат при чиста совест, здрав разум, непринудувани од никого, па истиот го признаваат и своерачно го потпишуваат.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Dispute Resolution Article
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${8 + finalArticleOffset}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Решавање на спорови", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите спорови што ќе настанат од овој договор или во врска со него ќе се решаваат спогодбено меѓу договорените страни, а во случај на неуспех надлежен е Основниот Граѓански Суд во ${contractTown}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Applicable Law Article
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${9 + finalArticleOffset}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Применливо право", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `На овој договор се применува Законот за облигационите односи на Република Северна Македонија и другите релевантни прописи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),

    // Copies Article
    new Paragraph({
      children: [
        new TextRun({ text: `Член ${10 + finalArticleOffset}`, bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Примероци", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор е составен во 6 (шест) примероци, по два за секоја договорена страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 600 }
    }),

    // Contract parties heading
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОРНИ СТРАНИ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),

    // Signatures in table format
    new Paragraph({
      children: [
        new TextRun({ text: "ДОВЕРИТЕЛ:", bold: true }),
        new TextRun({ text: "\t\t\t\t" }),
        new TextRun({ text: "ПРВИЧЕН ДОЛЖНИК:", bold: true }),
        new TextRun({ text: "\t\t\t\t" }),
        new TextRun({ text: "ПРЕЗЕМАЧ НА ДОЛГ:", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "______________________" }),
        new TextRun({ text: "\t\t" }),
        new TextRun({ text: "______________________" }),
        new TextRun({ text: "\t\t" }),
        new TextRun({ text: "______________________" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: originalCreditorManager
            ? `${originalCreditorName}\n${originalCreditorManager}`
            : originalCreditorName
        }),
        new TextRun({ text: "\t\t" }),
        new TextRun({
          text: originalDebtorManager
            ? `${originalDebtorName}\n${originalDebtorManager}`
            : originalDebtorName
        }),
        new TextRun({ text: "\t\t" }),
        new TextRun({
          text: assumingPartyManager
            ? `${assumingPartyName}\n${assumingPartyManager}`
            : assumingPartyName
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    })
  );

  const sections = [{ children }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateDebtAssumptionAgreementDoc;