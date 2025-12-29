const { Document, Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');
const moment = require('moment');

/**
 * Master Services Agreement Template
 * Generates professional Master Services Agreement in Macedonian language
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateMasterServicesAgreementDoc(formData, user, company) {
  // Company data with defaults
  const userCompanyName = company?.companyName || '[Име на компанија]';
  const userCompanyAddress = company?.companyAddress || company?.address || '[Адреса]';
  const userCompanyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број]';
  const userCompanyManager = company?.companyManager || company?.manager || '[Управител]';

  // User role determines party assignment
  const userRole = formData?.userRole || 'давател';

  // Determine which party is which based on user's role
  let serviceProvider, serviceProviderAddress, serviceProviderTaxNumber, serviceProviderManager;
  let client, clientAddress, clientTaxNumber, clientManager;

  if (userRole === 'давател') {
    // User's company is the service provider
    serviceProvider = userCompanyName;
    serviceProviderAddress = userCompanyAddress;
    serviceProviderTaxNumber = userCompanyTaxNumber;
    serviceProviderManager = userCompanyManager;

    // Other party is the client
    client = formData?.clientName || '[Име на клиент]';
    clientAddress = formData?.clientAddress || '[Адреса на клиент]';
    clientTaxNumber = formData?.clientTaxNumber || '[Даночен број на клиент]';
    clientManager = formData?.clientManager || '[Управител на клиент]';
  } else {
    // User's company is the client
    client = userCompanyName;
    clientAddress = userCompanyAddress;
    clientTaxNumber = userCompanyTaxNumber;
    clientManager = userCompanyManager;

    // Other party is the service provider
    serviceProvider = formData?.providerName || '[Име на давател]';
    serviceProviderAddress = formData?.providerAddress || '[Адреса на давател]';
    serviceProviderTaxNumber = formData?.providerTaxNumber || '[Даночен број на давател]';
    serviceProviderManager = formData?.providerManager || '[Управител на давател]';
  }

  // Agreement data
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : '[Датум]';
  const effectiveDateType = formData?.effectiveDateType || 'датум на склучување';
  const specificEffectiveDate = formData?.specificEffectiveDate ? moment(formData.specificEffectiveDate).format('DD.MM.YYYY') : '';

  const effectiveDateText = effectiveDateType === 'специфичен датум' && specificEffectiveDate
    ? specificEffectiveDate
    : 'денот на потпишување од страна на двете договорни страни';

  // Service details
  const serviceType = formData?.serviceType || '[Вид на услуга]';
  const serviceDescription = formData?.serviceDescription || '[Опис на услуга]';
  const serviceScope = formData?.serviceScope || '[Обем на услуга]';

  // Financial terms
  const paymentTerms = formData?.paymentTerms || 'net 30 денови';
  const currency = formData?.currency || 'денари';
  const paymentMethod = formData?.paymentMethod || 'банкарски трансфер';

  // Fee structure (optional fields)
  const feeStructure = formData?.feeStructure || '';
  const feeAmount = formData?.feeAmount || '';
  const hoursLimit = formData?.hoursLimit || '';
  const overtimeRate = formData?.overtimeRate || '';

  // Service delivery
  const serviceDeliveryTerms = formData?.serviceDeliveryTerms || '[Услови за испорака]';
  const serviceLocation = formData?.serviceLocation || '[Локација]';

  // Contract duration
  const durationType = formData?.durationType || 'неопределено';
  const durationMonths = formData?.durationMonths || '12';
  const endDate = formData?.endDate ? moment(formData.endDate).format('DD.MM.YYYY') : '';

  const durationText = durationType === 'определено' && endDate
    ? `определен период до ${endDate}`
    : 'неопределен период';

  // Termination notice
  const terminationNoticePeriod = formData?.terminationNoticePeriod || '30 денови';

  // Quality standards
  const qualityStandards = formData?.qualityStandards || 'индустриски стандарди за квалитет';

  // Liability limit
  const liabilityLimitType = formData?.liabilityLimitType || 'месечен износ';

  const doc = new Document({
    sections: [{
      children: [
        // Document title
        new Paragraph({
          children: [
            new TextRun({
              text: 'РАМКОВЕН ДОГОВОР ЗА УСЛУГИ',
              bold: true,
              size: 32
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '(Master Services Agreement)',
              italics: true,
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }),

        // Introduction
        new Paragraph({
          children: [
            new TextRun({
              text: `Овој договор е склучен на ден ${agreementDate} година (во понатамошниот текст: „Датум на склучување") помеѓу:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Party A - Service Provider
        new Paragraph({
          children: [
            new TextRun({ text: '1. ', bold: true }),
            new TextRun({ text: serviceProvider, bold: true }),
            new TextRun({
              text: `, со седиште на ул. ${serviceProviderAddress}, со даночен број ${serviceProviderTaxNumber}, претставувано од ${serviceProviderManager} (во понатамошниот текст: „Давател на услуга"), од една страна, и`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        // Party B - Client
        new Paragraph({
          children: [
            new TextRun({ text: '2. ', bold: true }),
            new TextRun({ text: client, bold: true }),
            new TextRun({
              text: `, со седиште на ул. ${clientAddress}, со даночен број ${clientTaxNumber}, претставувано од ${clientManager} (во понатамошниот текст: „Клиент"), од друга страна.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Давателот на услуга и Клиентот заедно се нарекуваат „Страни", а одделно „Страна".'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Article 1 - Scope of Services
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПРЕДМЕТ НА ДОГОВОРОТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '1.1. Предмет на услуга', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Давателот на услуга се согласува да му обезбеди на Клиентот ${serviceType}, која вклучува ${serviceDescription}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '1.2. Обем на услуги', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Детални спецификации на секоја индивидуална услуга ќе бидат утврдени преку посебни налози за работа (Statement of Work - SOW) кои се составен дел на овој договор.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '1.3. Налози за работа', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Секој налог за работа (SOW) ќе содржи: (а) детален опис на услугите што ќе се извршат; (б) временски рок за извршување; (в) цена и услови на плаќање; (г) критериуми за прием; и (д) други релевантни услови специфични за таа услуга.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 2 - Service Delivery
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ИСПОРАКА НА УСЛУГИ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '2.1. Локација и услови', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Услугите ќе се извршуваат ${serviceLocation}, како место на извршување на услугите.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '2.2. Стандарди за квалитет', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Давателот на услуга се согласува да ги извршува сите услуги согласно ${qualityStandards} и во согласност со сите применливи закони и прописи на Република Северна Македонија.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '2.3. Прием на услуги', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Клиентот има право на 7 (седум) работни дена по завршувањето на услугите за проверка и прием. Доколку Клиентот не достави писмен приговор во овој период, услугите се сметаат за примени.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 3 - Fees and Payment
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'НАДОМЕСТОК И ПЛАЌАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '3.1. Цени и надоместок', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Цените за услугите ќе бидат утврдени во соодветните наредби за работа (SOW). Сите цени се изразени во ${currency} и не вклучуваат данок на додадена вредност (ДДВ), освен ако поинаку не е наведено.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: feeStructure ? 200 : 300, line: 276 }
        }),

        // Conditional fee structure paragraph
        ...(feeStructure && feeStructure !== '' ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Структурата на надоместок за услугите е дефинирана како ${feeStructure}${feeAmount ? `, со износ од ${feeAmount}` : ''}.`
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: hoursLimit ? 200 : 300, line: 276 }
          })
        ] : []),

        // Conditional hours limit paragraph
        ...(hoursLimit && hoursLimit !== '' ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Максималниот број на часови изнесува ${hoursLimit}${overtimeRate && overtimeRate !== '' ? `, со стапка за прекувремена работа од ${overtimeRate}` : ''}.`
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300, line: 276 }
          })
        ] : []),

        new Paragraph({
          children: [
            new TextRun({ text: '3.2. Услови за плаќање', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Плаќањето ќе се изврши ${paymentTerms} од датумот на издавање на фактурата, преку ${paymentMethod} на сметката наведена во фактурата.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '3.3. Доцнење во плаќањето', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Во случај на доцнење во плаќањето, Клиентот е должен да плати законска затезна камата согласно важечките прописи на Република Северна Македонија. Давателот на услуга има право да ги суспендира услугите доколку плаќањето задоцни повеќе од 15 дена.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 4 - Intellectual Property
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ИНТЕЛЕКТУАЛНА СОПСТВЕНОСТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '4.1. Претходна интелектуална сопственост', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Секоја страна задржува сопственост врз својата претходна интелектуална сопственост. Претходна интелектуална сопственост значи сите патенти, авторски права, трговски марки, деловни тајни и друга интелектуална сопственост што постоела пред склучувањето на овој договор.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '4.2. Нова интелектуална сопственост', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Секоја нова интелектуална сопственост создадена од страна на Давателот на услуга во текот на извршувањето на услугите станува сопственост на Клиентот, освен ако поинаку не е договорено во посебна наредба за работа (SOW).'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 5 - Confidentiality
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true })
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
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '5.1. Обврска за чување на доверливост', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Двете страни се согласуваат да ги чуваат како доверливи сите информации добиени од другата страна во текот на траењето на овој договор, вклучувајќи но не ограничувајќи се на деловни планови, финансиски информации, технички податоци и маркетинг стратегии.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '5.2. Исклучоци', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Обврската за доверливост не се применува на информации кои: (а) се јавно достапни; (б) биле познати на страната пред откривањето; (в) легално се добиени од трета страна; или (г) мора да се откријат согласно закон или судска наредба.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 6 - Warranties and Representations
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ГАРАНЦИИ И ИЗЈАВИ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '6.1. Гаранции на Давателот', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Давателот на услуга гарантира дека: (а) услугите ќе се извршуваат професионално и квалитетно; (б) има потребни дозволи и лиценци; (в) нема да го прекрши правото на интелектуална сопственост на трети лица; и (г) ќе постапува согласно сите применливи закони и прописи.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '6.2. Гаранции на Клиентот', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Клиентот гарантира дека: (а) има право да склучи овој договор; (б) ќе обезбеди навремено плаќање; (в) ќе обезбеди сите потребни информации и соработка; и (г) нема да злоупотреби услуги или резултати од услугите.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 7 - Limitation of Liability
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 7', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ОГРАНИЧУВАЊЕ НА ОДГОВОРНОСТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '7.1. Ограничување на износот', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Максималната одговорност на Давателот на услуга за сите побарувања што произлегуваат од овој договор, без оглед на основот на побарувањето, не може да го надмине ${liabilityLimitType === 'месечен износ' ? 'месечниот' : 'годишниот'} износ платен од страна на Клиентот за услугите во период од 12 месеци пред настанот што предизвикал штета.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '7.2. Исклучување на посредна штета', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Ниту една од страните не е одговорна за посредна, специјална, казнена или последователна штета, вклучувајќи изгубена добивка, загуба на податоци или прекин на работењето, дури и ако била известена за можноста од таква штета.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 8 - Indemnification
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 8', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ОБЕШТЕТУВАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Давателот на услуга се согласува да го обештети и заштити Клиентот од сите побарувања, загуби и трошоци (вклучувајќи разумни трошоци за правна помош) кои произлегуваат од: (а) прекршување на гаранциите дадени во овој договор; (б) кршење на правата на интелектуална сопственост на трети лица; или (в) небрежност или намерно дејствие на Давателот на услуга.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 9 - Term and Termination
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 9', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ВРЕМЕТРАЕЊЕ И РАСКИНУВАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '9.1. Времетраење', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Овој договор влегува во сила на ${effectiveDateText} и ќе остане во сила на ${durationText}, освен ако не биде раскинат порано согласно одредбите на овој договор.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '9.2. Раскинување со известување', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Секоја страна може да го раскине овој договор со писмено известување од ${terminationNoticePeriod} до другата страна, без наведување на причина. Активните наредби за работа (SOW) ќе останат во сила и ќе се завршат согласно нивните услови.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '9.3. Раскинување поради повреда', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Секоја страна може веднаш да го раскине овој договор со писмено известување доколку другата страна материјално ја прекрши било која одредба од овој договор и не ја исправи таквата повреда во рок од 15 дена по писменото известување за повредата.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 10 - Force Majeure
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 10', bold: true })
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
              text: 'Ниту една од страните не ќе биде одговорна за неизвршување или задоцнето извршување на своите обврски доколку тоа е предизвикано од околности надвор од нејзината разумна контрола, вклучувајќи но не ограничувајќи се на природни катастрофи, војна, тероризам, штрајкови, владини ограничувања, епидемии или прекин на комуникациските или транспортните системи.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 11 - Independent Contractors
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 11', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'НЕЗАВИСНИ ДОГОВОРНИ СТРАНИ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Страните се независни договорни страни и ништо во овој договор не создава партнерство, заеднички претпријатие, агенција или работодавач-вработен однос меѓу страните. Ниту една страна нема овластување да ја обврзува другата страна без нејзина претходна писмена согласност.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 12 - Assignment
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 12', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПРЕНЕСУВАЊЕ НА ПРАВА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Ниту една од страните не може да ги пренесе своите права или обврски од овој договор на трета страна без претходна писмена согласност од другата страна, освен во случај на спојување, припојување или продажба на суштински дел од бизнисот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 13 - Amendments
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 13', bold: true })
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
              text: 'Овој договор може да се измени или дополни само со писмен документ потпишан од двете страни. Усмени договори или изјави не се обврзувачки.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 14 - Notices
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 14', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ИЗВЕСТУВАЊА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Сите известувања и други комуникации во врска со овој договор мора да бидат во писмена форма и да се достават лично, преку регистрирана пошта или електронска пошта на адресите наведени во воведниот дел на овој договор.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 15 - Entire Agreement
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 15', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ЦЕЛОСЕН ДОГОВОР', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Овој договор, заедно со наредбите за работа (SOW), претставува целосно разбирање помеѓу страните во врска со предметот на договорот и ги заменува сите претходни договори, разговори и разбирања, усмени или писмени.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 16 - Governing Law and Jurisdiction
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 16', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПРИМЕНЛИВО ПРАВО И НАДЛЕЖНОСТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Овој договор ќе се толкува и применува во согласност со Законот за облигациони односи и другите закони на Република Северна Македонија. Сите спорови што произлегуваат од овој договор ќе бидат решавани пред надлежен суд во Скопје.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Signatures section
        new Paragraph({
          children: [
            new TextRun({
              text: `Овој договор е потпишан од двете страни на ден ${agreementDate} година.`,
              bold: true
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600, line: 276 }
        }),

        // Service Provider signature
        new Paragraph({
          children: [
            new TextRun({ text: 'За Давателот на услуга:' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '___________________________' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: serviceProvider })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: serviceProviderManager })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Client signature
        new Paragraph({
          children: [
            new TextRun({ text: 'За Клиентот:' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '___________________________' })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: client })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: clientManager })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateMasterServicesAgreementDoc;
