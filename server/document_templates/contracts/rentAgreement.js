const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel } = require('docx');
const moment = require('moment');

function generateRentAgreementDoc(formData, user, company) {
  // Company data (if landlord is company) - using the standardized field mapping
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.taxNumber || '[Даночен број]';
  const companyManager = company?.manager || '[Управител]';
  
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
  const propertyType = formData?.propertyType || '[Тип на објект]';
  const buildingNumber = formData?.buildingNumber || '[Број на зграда]';
  const propertyPurpose = formData?.propertyPurpose || '[Намена на објектот]';
  const entrance = formData?.entrance || '[Влез]';
  const floor = formData?.floor || '[Кат]';
  const apartmentNumber = formData?.apartmentNumber || '[Број]';
  const specificPurpose = formData?.specificPurpose || '[Намена на посебен дел]';
  
  // Rent data
  const rentAmount = formData?.rentAmount || '[Износ на закупнина]';
  const rentPaymentDeadline = formData?.rentPaymentDeadline || 'до 5-ти во месецот за тековниот месец';
  const includesVAT = formData?.includesVAT ? 'со' : 'без';
  
  // Deposit data
  const requiresDeposit = formData?.requiresDeposit || false;
  const depositAmount = formData?.depositAmount || '[Износ на депозит]';
  
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

  const children = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОР", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ЗА ЗАКУП НА НЕДВИЖЕН ИМОТ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    
    // Contract introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${contractDate} година, во ${contractTown} помеѓу:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Landlord party
    new Paragraph({
      children: [
        new TextRun({
          text: landlordManager 
            ? `${landlordName}, со ${landlordIdType} ${landlordId} на адреса: ул. ${landlordAddress}, претставувано од Управителот ${landlordManager}, како Закуподавач`
            : `${landlordName}, со ${landlordIdType} ${landlordId} на адреса: ул. ${landlordAddress}, како Закуподавач`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "и" }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    
    // Tenant party
    new Paragraph({
      children: [
        new TextRun({
          text: tenantManager
            ? `${tenantName}, со ${tenantIdType} ${tenantId} на адреса: ул. ${tenantAddress}, претставувано од Управителот ${tenantManager}, како Закупец`
            : `${tenantName}, со ${tenantIdType} ${tenantId} на адреса: ул. ${tenantAddress}, како Закупец`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 1 - Subject
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Предмет на овој Договор е издавање под закуп на недвижен имот во ${contractTown}, кој е во сопственост на закуподавецот, а е подробно опишан во Имотен лист број ${propertySheetNumber} за КО ${cadastralMunicipality}, со следните карактеристики:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${propertyType}, лоциран на КП ${cadastralParcelNumber}, дел ${buildingNumber}, адреса ул. ${propertyAddress}, број на зграда/објект ${buildingNumber}, намена на зграда ${propertyPurpose}, влез ${entrance}, кат ${floor}, број ${apartmentNumber} намена на посебен дел од зграда ${specificPurpose}, во површина од ${propertySize}м2.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 2 - Duration
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: durationType === 'определено'
            ? `Закуподавецот му го дава на закупецот горецитираниот недвижен имот под закуп на определено време од ${durationValue}, сметано од ${contractDate} година${endDate ? ` до ${endDate} година` : ''}.`
            : `Закуподавецот му го дава на закупецот горецитираниот недвижен имот под закуп на неопределено време, сметано од ${contractDate} година.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Доколку двете договорени страни имаат заеднички интерес, договорот можат да го продолжат со Анекс на овој Договор или со нов Договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорните страни потврдуваат дека закуподавачот му го има предадено во владение на закупецот недвижниот имот пред денот на потпишување на овој Договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 3 - Rent
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Висината на месечната закупнина ќе изнесува ЕУР ${rentAmount},00 Евра ${includesVAT} ДДВ, во денарска противвредност според средниот курс на НБРМ на денот на издавањето на фактурата.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупецот се обврзува закупнината да ја исплаќа на жиро сметка број ${bankAccount}, депонент на ${bankName} Банка на име на Закуподавачот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупнината ќе се плаќа во период од ${rentPaymentDeadline}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
  ];

  // Add deposit clause if required
  if (requiresDeposit) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Закупецот е обврзан да плати депозит во висина од ЕУР ${depositAmount},00 Евра пред засновање на користењето на просторот. Депозитот ќе биде вратен на закупецот по истекот на договорот, доколку нема причинети штети на просторот.`,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `За времетраењето на овој договор, закупнината може да се промени врз основа на иницијатива на закуподавецот, а ќе се утврди со анекс на овој договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 4 - Utilities
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Трошоците за тековно одржување на деловниот простор предмет на овој Договор (електрична енергија, вода, парно, телефон и други комунални давачки) ќе ги плаќа закупецот и истите ќе му ги дава на увид на закуподавачот на секој 10-ти во месецот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 5 - Restrictions
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закупецот нема право во текот на договорниот однос да го отстапува или да го дава во подзакуп на трети лица деловниот простор што со овој договор му е даден на користење, без посебна писмена согласност дадена од закуподавачот.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуполримачот нема право без согласност на закуподавачот да извршува никакви инвестициони зафати кои би ја нарушиле сегашната состојба на издадениот простор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 6 - Obligations
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавачот е должен да го предаде просторот во исправна состојба.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавецот му гарантира на Закупецот непречено користење на деловниот простор што му го дава под закуп.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуполримачот е должен со внимание на добар домаќин и добар стопанственик да го употребува предметниот недвижен имот само за неговите предвидени деловни активности и по престанувањето на овој договор да го предаде записнички во уредна состојба, во спротивно ќе одговара за причинетата штета.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
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
          new TextRun({ text: "Посебни обврски:", bold: true }),
        ],
        alignment: AlignmentType.LEFT,
      })
    );
    
    specialObligations.forEach((obligation, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}) ${obligation}`,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    });
    
    children.push(new Paragraph({ text: "" }));
  }

  children.push(
    // Article 7 - Termination
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор може да се раскине со взаемна согласност на договорните страни.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Закуподавачот може веднаш еднострано да го раскине договорот доколку закуполримачот не ја извршува редовно својата обврска од член 3 од овој Договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја од договорените страни може еднострано да го раскине договорот, со отказен рок од 2 (два) месеци.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 8 - Good faith
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорените страни изјавуваат дека овој договор го склучуваат при чиста совест, здрав разум, непринудувани од никого, па истиот го признаваат и своерачно го потпишуваат.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 9 - Dispute resolution
    new Paragraph({
      children: [
        new TextRun({ text: "Член 9", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите спорови што ќе настанат по овој договор ќе се решаваат спогодбено меѓу договорените страни, а во случај на спор надлежен е Основниот Граѓански Суд во ${contractTown}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 10 - Copies
    new Paragraph({
      children: [
        new TextRun({ text: "Член 10", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор е составен во 4 (четири) примероци, по два за секоја договорена страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    
    // Contract parties heading
    new Paragraph({
      children: [
        new TextRun({ text: "ДОГОВОРНИ СТРАНИ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    
    // Signatures table
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "ЗАКУПОДАВАЧ", bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "_____________________" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: landlordName }),
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
                    new TextRun({ text: "ЗАКУПЕЦ", bold: true }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "_____________________" }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: tenantName }),
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

module.exports = generateRentAgreementDoc;