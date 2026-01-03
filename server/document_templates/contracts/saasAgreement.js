const { Document, Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');
const moment = require('moment');

/**
 * Software as a Service Agreement Template
 * Generates professional SaaS agreement in Macedonian language
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateSaasAgreementDoc(formData, user, company) {
  // Company data with defaults
  const providerName = company?.companyName || '[Име на давател]';
  const providerAddress = company?.companyAddress || company?.address || '[Адреса на давател]';
  const providerTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број на давател]';
  const providerManager = company?.companyManager || company?.manager || '[Управител на давател]';

  // Contract parties data
  const userRole = formData?.userRole || 'давател';

  // Determine which party is which based on user's role
  let serviceProvider, serviceProviderAddress, serviceProviderTaxNumber, serviceProviderManager;
  let client, clientAddress, clientTaxNumber, clientManager;

  if (userRole === 'давател') {
    // User's company is the service provider
    serviceProvider = providerName;
    serviceProviderAddress = providerAddress;
    serviceProviderTaxNumber = providerTaxNumber;
    serviceProviderManager = providerManager;

    // Other party is the client
    client = formData?.clientName || '[Име на клиент]';
    clientAddress = formData?.clientAddress || '[Адреса на клиент]';
    clientTaxNumber = formData?.clientTaxNumber || '[Даночен број на клиент]';
    clientManager = formData?.clientManager || '[Управител на клиент]';
  } else {
    // User's company is the client
    client = providerName;
    clientAddress = providerAddress;
    clientTaxNumber = providerTaxNumber;
    clientManager = providerManager;

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
  const serviceName = formData?.serviceName || '[Назив на услуга]';
  const serviceDescription = formData?.serviceDescription || '[Опис на услуга]';
  const serviceURL = formData?.serviceURL || '[URL адреса]';

  // Financial terms
  const subscriptionFee = formData?.subscriptionFee
    ? `${parseInt(formData.subscriptionFee).toLocaleString('mk-MK')},00`
    : '[Износ]';
  const currency = formData?.currency || 'денари';
  const paymentDay = formData?.paymentDay || '[ден]';
  const includesVAT = formData?.includesVAT === true ? 'со вклучен ДДВ' : 'без ДДВ';

  // Bank account details
  const bankAccount = formData?.bankAccount || '[Број на сметка]';
  const bankName = formData?.bankName || '[Име на банка]';

  // Service level details
  const systemAvailability = formData?.systemAvailability || '98';
  const supportHours = formData?.supportHours || 'работни часови';

  // Contract duration
  const durationType = formData?.durationType || 'неопределено';
  const durationMonths = formData?.durationMonths || '12';
  const endDate = formData?.endDate ? moment(formData.endDate).format('DD.MM.YYYY') : '';

  const durationText = durationType === 'определено' && endDate
    ? `определен период до ${endDate}`
    : 'неопределен период';

  // Termination notice
  const terminationNoticeDays = formData?.terminationNoticeDays || '30';

  const sections = [{
      children: [
        // Document title
        new Paragraph({
          children: [
            new TextRun({
              text: 'ДОГОВОР ЗА СОФТВЕР КАКО УСЛУГА',
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
              text: '(Software as a Service Agreement)',
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
              text: '(Поимите со главна буква употребени во овој договор, покрај горенаведените, се дефинирани во одделот „ДЕФИНИЦИИ".)'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 600, line: 276 }
        }),

        // Article 1 - Grant of License
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ДОДЕЛУВАЊЕ НА ЛИЦЕНЦА ЗА ПРИСТАП И КОРИСТЕЊЕ НА УСЛУГАТА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Давателот на услуга со ова го овластува Клиентот, вклучувајќи ги сите овластени корисници на Клиентот, со неексклузивна, непреносива, лиценца без можност за сублиценцирање, без надоместок (royalty-free), и светска лиценца за пристап и користење на ${serviceName} – ${serviceDescription} (во понатамошниот текст: „Услугата") исклучиво за внатрешните деловни операции на Клиентот, во согласност со условите и политиките на Давателот на услуга наведени на ${serviceURL}.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 2 - Support Services
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'УСЛУГИ НА ПОДДРШКА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Почетна поддршка', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `За период од 12 месеци од Датумот на склучување, и на сопствен трошок на Давателот на услуга, Давателот на услуга ќе му обезбеди на Клиентот:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `а) телефонска или електронска поддршка во текот на ${supportHours} на Давателот на услуга со цел да му помогне на Клиентот да лоцира и коригира проблеми со Услугата и секој поврзан софтвер, и`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'б) интернет систем за поддршка генерално достапен седум дена во неделата, 24 часа на ден.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Обновена поддршка', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'По почетниот период од 12 месеци поддршка, Клиентот може да избере да ги обнови услугите на поддршка на Давателот на услуга за дополнителни периоди од 12 месеци, според тековните цени на услуги на Давателот на услуга.'
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
            new TextRun({ text: 'НАДОМЕСТОЦИ И ПЛАЌАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Претплатен надоместок', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Клиентот ќе му плати на Давателот на услуга месечен претплатен надоместок во износ од ${subscriptionFee} ${currency} ${includesVAT} (во понатамошниот текст: „Претплатен надоместок") за услугите обезбедени согласно овој договор.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Рок и начин на плаќање', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Клиентот ќе го плати Претплатниот надоместок на Давателот на услуга до ${paymentDay}-ти во месецот, преку директен трансфер на достапни средства, на следната сметка:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `Број на сметка: ${bankAccount}` })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `Банка: ${bankName}` })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Данок на додадена вредност', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Износите за плаќање согласно овој договор не вклучуваат даноци освен ако е поинаку наведено, а страната која е одговорна за плаќање на данокот согласно важечкото законодавство ќе ги плати сите применливи данoци.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Камата за задоцнето плаќање', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Секој износ кој не е платен на време ќе носи камата од датумот на доспевање до исплата по стапка еднаква на 1% месечно (12.68% годишно) или максималниот дозволен износ според законот, во зависност од тоа кој е помал.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 4 - Service Levels
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'НИВОА НА УСЛУГА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Применливи нивоа', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Давателот на услуга ќе ја обезбеди Услугата на Клиентот со системска достапност од најмалку ${systemAvailability}% во текот на секој календарски месец.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Одржување на системот', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Давателот на услуга може да ја стави Услугата офлајн за закажано одржување за кое му обезбедил распред на Клиентот во писмена форма (иако ова време на закажано одржување нема да се смета како системска достапност), и може да го промени распоредот на одржување со едномесечно писмено известување до Клиентот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 5 - Term and Termination
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'РОКОВИ И РАСКИНУВАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Времетраење на договорот', bold: true })
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
            new TextRun({ text: 'Раскинување', bold: true })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Секоја страна може да го раскине овој договор со писмено известување од ${terminationNoticeDays} дена до другата страна. Во случај на суштествено кршење на договорот од страна на една од страните, другата страна има право на итно раскинување со писмено известување.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 6 - Confidentiality
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true })
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
            new TextRun({
              text: 'Двете страни се согласуваат да ги чуваат како доверливи сите информации добиени од другата страна во текот на траењето на овој договор. Доверливите информации нема да бидат откриени на трети страни без претходна писмена согласност од страната која ги обезбедила информациите, освен ако тоа не е потребно согласно закон или судска наредба.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 7 - Intellectual Property
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 7', bold: true })
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
            new TextRun({
              text: 'Сите права на интелектуална сопственост во врска со Услугата, вклучувајќи но не ограничувајќи се на патенти, авторски права, трговски марки и деловни тајни, остануваат исклучива сопственост на Давателот на услуга. Клиентот не стекнува никакви права на сопственост врз Услугата, освен ограниченото право на користење утврдено со овој договор.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 8 - Limitation of Liability
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 8', bold: true })
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
            new TextRun({
              text: 'Ниту една од страните нема да биде одговорна за штети што се далечни или спекулативни, или кои разумно не можеле да се предвидат при склучувањето на овој договор. Максималната одговорност на Давателот на услуга согласно овој договор нема да ги надмине надоместоците платени од Клиентот во текот на 12 месеци што му претходат на датумот на настанување на штетата.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 9 - Force Majeure
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 9', bold: true })
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
              text: 'Страната нема да биде одговорна за неизвршување или задоцнување во извршувањето на овој договор за периодот во кој таквото неизвршување или задоцнување е надвор од разумната контрола на страната, материјално влијае врз извршувањето на нејзините обврски според овој договор, и разумно не можело да се предвиди или спречи.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 10 - Entire Agreement
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 10', bold: true })
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
              text: 'Овој договор претставува целосно разбирање помеѓу страните во врска со предметот на договорот и ги заменува сите претходни договори, разговори и разбирања, усмени или писмени, помеѓу страните во врска со истиот предмет.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 11 - Amendments
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 11', bold: true })
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
              text: 'Овој договор може да се измени или дополни само со писмен документ потпишан од двете страни.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 12 - Governing Law
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 12', bold: true })
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
              text: 'Овој договор ќе се толкува и применува во согласност со законите на Република Северна Македонија. Сите спорови што произлегуваат од овој договор ќе бидат решавани пред надлежен суд во Скопје.'
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
            new TextRun({ text: serviceProvider })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: serviceProviderManager })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Client signature
        new Paragraph({
          children: [
            new TextRun({ text: 'За Клиентот:' })
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
            new TextRun({ text: client })
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
      ]
    }];

  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateSaasAgreementDoc;
