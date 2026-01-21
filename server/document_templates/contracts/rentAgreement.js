const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, PageBreak } = require('docx');
const moment = require('moment');
const { formatMKD } = require('../../utils/documentUtils');

function generateRentAgreementDoc(formData, user, company) {
  // Company data (if landlord is company) - using the standardized field mapping
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Contract data with defaults
  const contractDate = formData?.contractDate ? moment(formData.contractDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const contractTown = formData?.contractTown || '[Град]';
  const userRole = formData?.userRole || 'landlord'; // 'landlord' or 'tenant'
  const otherPartyType = formData?.otherPartyType || 'individual'; // 'individual' or 'company'
  
  // Determine landlord and tenant data based on user role
  let landlordName, landlordAddress, landlordId, landlordIdType, landlordManager;
  let tenantName, tenantAddress, tenantId, tenantIdType, tenantManager;
  
  if (userRole === 'landlord') {
    // User's company is the landlord
    landlordName = companyName;
    landlordAddress = companyAddress;
    landlordId = companyTaxNumber;
    landlordIdType = 'Даночен број';
    landlordManager = companyManager;
    
    // Other party is the tenant
    if (otherPartyType === 'individual') {
      tenantName = formData?.otherPartyName || '[Име на закупец]';
      tenantAddress = formData?.otherPartyAddress || '[Адреса на закупец]';
      tenantId = formData?.otherPartyPIN || '[ЕМБГ на закупец]';
      tenantIdType = 'ЕМБГ';
      tenantManager = '';
    } else {
      tenantName = formData?.otherPartyCompanyName || '[Име на закупец компанија]';
      tenantAddress = formData?.otherPartyCompanyAddress || '[Адреса на закупец компанија]';
      tenantId = formData?.otherPartyCompanyTaxNumber || '[Даночен број на закупец]';
      tenantIdType = 'Даночен број';
      tenantManager = formData?.otherPartyCompanyManager || '[Управител на закупец]';
    }
  } else {
    // User's company is the tenant
    tenantName = companyName;
    tenantAddress = companyAddress;
    tenantId = companyTaxNumber;
    tenantIdType = 'Даночен број';
    tenantManager = companyManager;
    
    // Other party is the landlord
    if (otherPartyType === 'individual') {
      landlordName = formData?.otherPartyName || '[Име на закуподавач]';
      landlordAddress = formData?.otherPartyAddress || '[Адреса на закуподавач]';
      landlordId = formData?.otherPartyPIN || '[ЕМБГ на закуподавач]';
      landlordIdType = 'ЕМБГ';
      landlordManager = '';
    } else {
      landlordName = formData?.otherPartyCompanyName || '[Име на закуподавач компанија]';
      landlordAddress = formData?.otherPartyCompanyAddress || '[Адреса на закуподавач компанија]';
      landlordId = formData?.otherPartyCompanyTaxNumber || '[Даночен број на закуподавач]';
      landlordIdType = 'Даночен број';
      landlordManager = formData?.otherPartyCompanyManager || '[Управител на закуподавач]';
    }
  }
  
  // Property data
  const propertyAddress = formData?.propertyAddress || '[Адреса на имот]';
  const cadastralParcelNumber = formData?.cadastralParcelNumber || '[Број на катастарска парцела]';
  const cadastralMunicipality = formData?.cadastralMunicipality || '[Катастарска општина]';
  const propertySheetNumber = formData?.propertySheetNumber || '[Број на имотен лист]';
  const propertySize = formData?.propertySize || '[Површина]';
  const propertyType = formData?.propertyType || '[Недвижен имот]';
  const buildingNumber = formData?.buildingNumber || '[Број на зграда]';
  const propertyPurpose = formData?.propertyPurpose || '[Намена на објектот]';
  const entrance = formData?.entrance || '[Влез]';
  const floor = formData?.floor || '[Кат]';
  const apartmentNumber = formData?.apartmentNumber || '[Број]';
  const specificPurpose = formData?.specificPurpose || '[Намена на посебен дел]';
  
  // Rent data
  const rentAmount = formatMKD(formData?.rentAmount, { fallback: '[Износ на закупнина]', includeCurrency: false });
  const rentPaymentDeadline = formData?.rentPaymentDeadline || 'до 5-ти во месецот за тековниот месец';
  const includesVAT = formData?.includesVAT ? 'со' : 'без';

  // Deposit data
  const requiresDeposit = formData?.requiresDeposit || false;
  const depositAmount = formatMKD(formData?.depositAmount, { fallback: '[Износ на депозит]', includeCurrency: false });
  
  // Duration data
  const durationType = formData?.durationType || 'определено'; // 'определено' or 'неопределено'
  const durationValue = formData?.durationValue || '[Времетраење]';
  const endDate = formData?.endDate ? moment(formData.endDate).format('DD.MM.YYYY') : '';
  
  // Special obligations
  const requiresInsurance = formData?.requiresInsurance || false;
  const allowsQuarterlyInspection = formData?.allowsQuarterlyInspection || false;
  const hasAnnualIncrease = formData?.hasAnnualIncrease || false;
  
  // Bank details
  const bankAccount = formData?.bankAccount || '[Број на жиро сметка]';
  const bankName = formData?.bankName || '[Име на банка]';

  // Handover minutes data
  const handoverDate = formData?.handoverDate ? moment(formData.handoverDate).format('DD.MM.YYYY') : contractDate;
  const propertyConditionNotes = formData?.propertyConditionNotes || '____________________________________________________________________________________________________________________________________________________________________';
  const isFurnished = formData?.isFurnished || false;

  const children = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Contract introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${contractDate} година, во ${contractTown} помеѓу:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Landlord party
    new Paragraph({
      children: [
        new TextRun({
          text: landlordManager
            ? `1. ${landlordName}, со ${landlordIdType} ${landlordId} на адреса: ул. ${landlordAddress}, претставувано од Управителот ${landlordManager}, како Закуподавач`
            : `1. ${landlordName}, со ${landlordIdType} ${landlordId} на адреса: ул. ${landlordAddress}, како Закуподавач`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "и", size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    
    // Tenant party
    new Paragraph({
      children: [
        new TextRun({
          text: tenantManager
            ? `2. ${tenantName}, со ${tenantIdType} ${tenantId} на адреса: ул. ${tenantAddress}, претставувано од Управителот ${tenantManager}, како Закупец`
            : `2. ${tenantName}, со ${tenantIdType} ${tenantId} на адреса: ул. ${tenantAddress}, како Закупец`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 1 - Subject
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Предмет на овој Договор е издавање под закуп на недвижен имот во ${contractTown}, кој е во сопственост на закуподавецот, а е подробно опишан во Имотен лист број ${propertySheetNumber} за КО ${cadastralMunicipality}, со следните карактеристики:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Недвижен имот, лоциран на КП ${cadastralParcelNumber}, дел ${buildingNumber}, адреса ул. ${propertyAddress}, број на зграда/објект ${buildingNumber}, намена на зграда ${propertyPurpose}, влез ${entrance}, кат ${floor}, број ${apartmentNumber} намена на посебен дел од зграда ${specificPurpose}, во површина од ${propertySize}м2.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 2 - Duration
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: durationType === 'определено'
            ? `Закуподавецот му го дава на закупецот горецитираниот недвижен имот под закуп на определено време од ${durationValue}, сметано од ${contractDate} година${endDate ? ` до ${endDate} година` : ''}.`
            : `Закуподавецот му го дава на закупецот горецитираниот недвижен имот под закуп на неопределено време, сметано од ${contractDate} година.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Доколку двете договорени страни имаат заеднички интерес, договорот можат да го продолжат со Анекс на овој Договор или со нов Договор.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
   
    
    // Article 3 - Rent
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Висината на месечната закупнина ќе изнесува ЕУР ${rentAmount} Евра ${includesVAT} ДДВ, во денарска противвредност според средниот курс на НБРМ на денот на издавањето на фактурата.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупецот се обврзува закупнината да ја исплаќа на жиро сметка број ${bankAccount}, депонент на ${bankName} Банка на име на Закуподавачот.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупнината ќе се плаќа во период од ${rentPaymentDeadline}.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
  ];

  // Add deposit clause if required
  if (requiresDeposit) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
          text: `Закупецот е обврзан да плати депозит во висина од ЕУР ${depositAmount} Евра пред засновање на користењето на просторот. Депозитот ќе биде вратен на закупецот по истекот на договорот, доколку нема причинети штети на просторот.`,
          size: 22
        }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `За времетраењето на овој договор, закупнината може да се промени врз основа на иницијатива на закуподавецот, а ќе се утврди со анекс на овој договор.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 4 - Utilities
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Трошоците за тековно одржување на деловниот простор предмет на овој Договор (електрична енергија, вода, парно, телефон и други комунални давачки) ќе ги плаќа закупецот и истите ќе му ги дава на увид на закуподавачот на секој 10-ти во месецот.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 5 - Restrictions
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупецот нема право во текот на договорниот однос да го отстапува или да го дава во подзакуп на трети лица деловниот простор што со овој договор му е даден на користење, без посебна писмена согласност дадена од закуподавачот.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуполримачот нема право без согласност на закуподавачот да извршува никакви инвестициони зафати кои би ја нарушиле сегашната состојба на издадениот простор.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 6 - Obligations
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавачот е должен да го предаде просторот во исправна состојба.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавецот му гарантира на Закупецот непречено користење на деловниот простор што му го дава под закуп.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуполримачот е должен со внимание на добар домаќин и добар стопанственик да го употребува предметниот недвижен имот само за неговите предвидени деловни активности и по престанувањето на овој договор да го предаде записнички во уредна состојба, во спротивно ќе одговара за причинетата штета.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
  );

  // Add special obligations if any
  const specialObligations = [];
  
  if (requiresInsurance) {
    specialObligations.push('Закупецот е обврзан да го осигури просторот од пожар, поплави и други слични ризици.');
  }
  
  if (allowsQuarterlyInspection) {
    specialObligations.push('Закупецот е обврзан тримесечно да овозможи инспекција на просторот од страна на закуподавачот.');
  }
  
  if (hasAnnualIncrease) {
    specialObligations.push('Закупнината се зголемува секоја година во јануари, за индексот на официјалниот индекс на потрошувачките цени на Државниот завод за статистика.');
  }

  if (specialObligations.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Посебни обврски:", bold: true, size: 22 }),
        ],
        alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 },
    })
    );
    
    specialObligations.forEach((obligation, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}) ${obligation}`,
              size: 22
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 },
        })
      );
    });
    
    children.push(new Paragraph({ text: "" }));
  }

  children.push(
    // Article 7 - Termination
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор може да се раскине со взаемна согласност на договорните страни.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавачот може веднаш еднострано да го раскине договорот доколку закуполримачот не ја извршува редовно својата обврска од член 3 од овој Договор.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја од договорените страни може еднострано да го раскине договорот, со отказен рок од 2 (два) месеци.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 8 - Good faith
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорените страни изјавуваат дека овој договор го склучуваат при чиста совест, здрав разум, непринудувани од никого, па истиот го признаваат и своерачно го потпишуваат.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 9 - Dispute resolution
    new Paragraph({
      children: [
        new TextRun({ text: "Член 9", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите спорови што ќе настанат по овој договор ќе се решаваат спогодбено меѓу договорените страни, а во случај на спор надлежен е Основниот Граѓански Суд во ${contractTown}.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    
    // Article 10 - Copies
    new Paragraph({
      children: [
        new TextRun({ text: "Член 10", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор е составен во 4 (четири) примероци, по два за секоја договорена страна.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),

    // Contract parties heading
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОРНИ СТРАНИ", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),

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
            // Left cell - Landlord signature
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
                  children: [new TextRun({ text: "ЗАКУПОДАВАЧ:", size: 22 })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 200, line: 276 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: "___________________________", size: 22 })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0, line: 276 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: landlordName, size: 22 })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 300, line: 276 }
                }),
              ],
            }),
            // Right cell - Tenant signature
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
                  children: [new TextRun({ text: "ЗАКУПЕЦ:", size: 22 })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 200, line: 276 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: "___________________________", size: 22 })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0, line: 276 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: tenantName, size: 22 })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 300, line: 276 }
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // ===== PAGE BREAK BEFORE HANDOVER MINUTES =====
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    }),

    // ===== HANDOVER MINUTES (ЗАПИСНИК ЗА ПРИМОПРЕДАВАЊЕ) =====
    new Paragraph({
      children: [
        new TextRun({
          text: `На ден ${handoverDate} година, договорните страни од Договорот за закуп на недвижен имот од ${contractDate}, и тоа:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: landlordManager
            ? `1. ${landlordName}, со ${landlordIdType}: ${landlordId}, со адреса на ул. ${landlordAddress}, во натамошниот текст како ЗАКУПОДАВЕЦ, и`
            : `1. ${landlordName}, со ${landlordIdType}: ${landlordId}, со адреса на ул. ${landlordAddress}, во натамошниот текст како ЗАКУПОДАВЕЦ, и`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: tenantManager
            ? `2. ${tenantName}, со ${tenantIdType}: ${tenantId}, со адреса во ${tenantAddress}, во натамошниот текст како ЗАКУПЕЦ`
            : `2. ${tenantName}, со ${tenantIdType}: ${tenantId}, со адреса во ${tenantAddress}, во натамошниот текст како ЗАКУПЕЦ`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `го составија и се согласија на следниот:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),

    // Handover Minutes Title
    new Paragraph({
      children: [
        new TextRun({ text: "ЗАПИСНИК", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 10, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "за примопредавање на недвижен имот предмет на договор за закуп", bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50, line: 276 },
    }),
    new Paragraph({ text: "" }),

    // Handover confirmation
    new Paragraph({
      children: [
        new TextRun({
          text: `Врз основа на овој записник, Закупецот и Закуподавачот потврдуваат дека недвижниот имот опишан со горенаведениот договор, и тоа:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Недвижен имот, подробно опишан во Имотен лист број ${propertySheetNumber} за КО ${cadastralMunicipality}, на ден ${handoverDate} година е уредно предаден во владение од Закуподавачот на Закупецот.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" })
  );

  // Add furnished clause if applicable
  if (isFurnished) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Станот е предаден целосно опремен со мебел и апарати за домаќинство.`,
            size: 22
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 },
      }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавачот на закупецот му предава _______________ клучеви за влез во недвижниот имот.`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Согласно горенаведеното, се заведува следната состојба на денот на предавањето:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),

    // Meter readings
    new Paragraph({
      children: [
        new TextRun({
          text: `состојба на мерно броило на ЕВН за потрошена електрична енергија: _______________`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `состојба на мерно броило на водовод за потрошена вода: _______________`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),

    // Property condition notes
    new Paragraph({
      children: [
        new TextRun({
          text: `Забелешки за состојба на недвижниот имот, апаратите и/или мебелот:`,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: propertyConditionNotes,
          size: 22
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупецот може и дополнително да даде забелешки за скриени недостатоци, во разумен рок.`,
          size: 22,
          italics: true
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),

    // Date and location
    new Paragraph({
      children: [
        new TextRun({
          text: `Во ${contractTown}, на ${handoverDate} година`,
          size: 22
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 },
    }),

    // Handover signatures - simple line format
    new Paragraph({
      children: [
        new TextRun({ text: "ПРЕДАЛ", size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________", size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: landlordName, size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "ПРИМИЛ", size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________", size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: tenantName, size: 22 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    })
  );

  const sections = [{ children }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateRentAgreementDoc;