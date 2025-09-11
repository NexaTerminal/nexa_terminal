const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel } = require('docx');
const moment = require('moment');

function generateNDADoc(formData, user, company) {
  // Company data with defaults - using the standardized field mapping
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕДБ број]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Form data with defaults
  const agreementDate = formData?.agreementDate ? moment(formData.agreementDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const secondPartyName = formData?.secondPartyName || '[Име на втората договорна страна]';
  const secondPartyAddress = formData?.secondPartyAddress || '[Адреса на втората договорна страна]';
  const secondPartyTaxNumber = formData?.secondPartyTaxNumber || '';
  const secondPartyPin = formData?.secondPartyPin || '';
  const secondPartyManager = formData?.secondPartyManager || '';
  const isNaturalPerson = formData?.isNaturalPerson || false;
  const isLegalEntity = formData?.isLegalEntity || false;
  const agreementDuration = formData?.agreementDuration || '2';
  const contactEmail = formData?.contactEmail || '';
  const agreementType = formData?.agreementType || 'bilateral';
  const additionalTerms = formData?.additionalTerms || '';
  
  // Generate second party description based on type
  let secondPartyDescription;
  if (isNaturalPerson) {
    secondPartyDescription = `${secondPartyName}, со адреса на живеење ${secondPartyAddress}${secondPartyPin ? `, со ЕМБГ ${secondPartyPin}` : ''}`;
  } else if (isLegalEntity) {
    secondPartyDescription = `${secondPartyName}, со седиште на ${secondPartyAddress}${secondPartyTaxNumber ? `, со ЕДБ ${secondPartyTaxNumber}` : ''}${secondPartyManager ? `, претставувано од Управител ${secondPartyManager}` : ''}`;
  } else {
    secondPartyDescription = `${secondPartyName}${secondPartyAddress ? `, со седиште на ${secondPartyAddress}` : ''}${secondPartyTaxNumber ? `, со ЕДБ ${secondPartyTaxNumber}` : ''}`;
  }

  const children = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: "Договор за доверливост", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "на информации", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    
    // Introduction
    new Paragraph({
      children: [
        new TextRun({
          text: `Склучен на ден ${agreementDate} година, помеѓу:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // First Party
    new Paragraph({
      children: [
        new TextRun({
          text: `1. ${companyName}, со седиште на ${companyAddress}, со ЕДБ ${companyTaxNumber}, претставувано од Управител ${companyManager} (во натамошниот текст: Прва договорна страна);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "и" }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    
    // Second Party
    new Paragraph({
      children: [
        new TextRun({
          text: `2. ${secondPartyDescription} (во натамошниот текст: Втора договорна страна);`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Заеднички именувани како \"Договорни/те страни\"" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Purpose
    new Paragraph({
      children: [
        new TextRun({
          text: `При што целта на овој договор е да се утврдат принципи и правила за размена и споделување на информации во врска со Договорните страни (во натамошниот текст: „Доверливи информации") кои што ќе ги обелоденат во текот на нивните преговори, како и во текот на нивната меѓусебна деловна соработка, а во врска со развојот на производи.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Во таа смисла, договорните страни се согласија за следното:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    // Definitions Section
    new Paragraph({
      children: [
        new TextRun({ text: "Дефиниции", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `За целите на овој договор, ќе се користат следниве дефиниции:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `„Доверливи информации" - сите информации или / и документи од комерцијална вредност, особено технички информации, технолошки, организациски, финансиски и сите податоци споделени и разменети помеѓу договорните страни, вклучувајќи информации за компании, знаење, процедури, архитектонски и механички проекции, дизајн, пазари, клиенти, деловни партнери, производи, стратегија, имот, обврски, цени, профит, вработени, агенти и дистрибутери и други информации без ограничување откриени или доставени, без разлика дали усно, во писмена форма, преку е-пошта или преку други медиуми и уреди, во врска со која било од договорните страни или нивните клиенти или деловни партнери, a чие откривање може да предизвикана штета на која било од доворните страни, нивните клиенти или деловни партнери.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `„Трета страна" - секое физичко лице, правно лице, корпоративно тело, некорпоративно тело или кое било друго лице, кое не е договорна страна, ниту претставник на која било од страните.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `„Претставник" - во однос на секоја договорна страна - член на раководството на договорната страна (без разлика дали е одбор на директори, надзорен одбор, управител) како и вработен, подизведувач или советник, градежни фирми, архитектонски бироа, вклучително и правни и финансиски советници чиј обем на активност е или ќе биде поврзан со соработка или комуникација со секоја или со двете договорни страни. За целите на Договорот, секое лице што комуницира со другата страна преку е-пошта domain на договорните страни, се смета за Претставник на соодветната страна. Договорните страни гарантираат дека нивните претставници се должни да ги штитат доверливите информации во согласност со опсегот на овој договор.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    
    // CONFIDENTIALITY Section
    new Paragraph({
      children: [
        new TextRun({ text: "ДОВЕРЛИВОСТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 1
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорните страните признаваат дека неовластено откривање на доверливи информации што ги прекршуваат одредбите на овој договор може да предизвика значителна штета на интересите и деловните активности на договорната страна, како и на нивните клиенти или деловни партнери. Секоја страна се согласува да ја задржи довербата и да не ги открива доверливите информации за целото времетраење на овој договор и по неговото раскинување и се согласува:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `a) да не ги открива доверливите информации на која било трета страна, со исклучок на трети лица, надлежни институции и други надлежни правни и физички лица, како и нивни претставници кои се строго ангажирани за потребите на страните, т.е. чиј ангажман е неопходен за постигнување на потребите на страните и кои се поврзани со обемот на планираната соработка или со нејзината изведба;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `b) да не ги користи доверливите информации, на директен или индиректен начин, за други цели, освен оние што се строго поврзани со обемот на планираната соработка или со нејзината изведба;`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Горенаведените одредби се применливи, освен ако:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `a) oткривањето на доверливи информации е потребно според македонското право, а неоткривањето може да ја изложи страната обврзана со доверливост на кривична или граѓанска одговорност или,`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `b) откривањето на доверливи информации е потребно или неопходно за да се заштитат интересите на секоја договорна страна во судска или административна постапка,`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `c) во таков случај договорните страни, веднаш откако ќе бидат информирани за можна должност или потреба за откривање на доверливи информации и колку што е можно пред тоа откривање, да ги преземат сите разумни чекори за навремено и доволно меѓусебно известување за истото.`,
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
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Информациите доставени, споделени или разменети од страните претставуваат Доверливи информации, освен за:`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `a) Информациите кои се веќе познати или се дел од јавниот домен пред времето на нивно објавување од страна на Договорните страни, а страните или нивните претставници не се одговорни за таквото откривање / објавување,`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `b) Информации веќе познати или кои ќе им бидат познати на договорните страни за време на преговорите за соработка од страна на извор различен од другата договорна страна, без никакво кршење на одредбите од овој договор или законите што се во сила.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Првата договорна страна не е ограничена на деловна соработка со клиенти што може самостојно да ги стекне, вклучувајќи ги и постојните или потенцијалните деловни партнери на Втората договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `За да се избегне секаква сомнеж, оваа слобода ќе биде ограничена само во однос на оние постојни или потенцијални деловни партнери на Втората договорна страна (i) со кои Првата договорна страна е директно запознаена од Втората Договорна Страна, (ii) за чиј однос со Втората договорна страна, Првата договорна страна станала свесна единствено како резултат на соработката меѓу страните, или (iii) со кои Втората договорна страна има тековен деловен дијалог или преговори во времето на таков контакт.`,
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
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја договорна страна се обврзува да го задржи истиот стандард на грижа за заштита на таквите доверливи информации на другата договорна страна, на начинот на кој што страните вообичаено го користат за зачувување и заштита на сопствените доверливи информации. Така, секоја страна гарантира соодветна заштита од неовластено откривање, копирање или употреба на доверливи информации.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Овластеното откривање на доверливи информации е ограничено на оние претставници на договорната страна, кои имаат неопходна потреба истите да ги знаат со цел да се спроведе деловната соработка и извршувањето на договорените работи помеѓу договорните страни.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Втората договорна страна се обврзува дека нема без знаење на првата договорна страна да стапи во контакт и при тоа да заснова деловна соработка во врска со извршување на механички работи со било кои претставници, деловни партнери, поизведувачи, клиенти, како и било кои други физички и правни лица со кои првата договорна страна има воспоставено деловна соработка.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Доколку втората договорна страна има намeра да ги преземе погоре опишаните дејствија, мора за тоа уредно да ја извести првата договорна страна. Првата договорна страна по добиеното известување треба да даде своја согласност пред да се воспостави било каква деловна соработка помеѓу нејзините претставници, клиенти и/или деловни партнери и втората договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // INTELLECTUAL PROPERTY RIGHTS Section
    new Paragraph({
      children: [
        new TextRun({ text: "ПРАВА ОД ИНТЕЛЕКТУАЛНА СОПСТВЕНОСТ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 4
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја Договорна страна задржува сопственост врз сите права на интелектуална сопственост, знаење, трговски тајни и сопствени информации кои таа ги поседувала пред склучувањето на овој Договор или кои ги развива независно од Доверливите информации на другата Договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја нова интелектуална сопственост која произлегува од, се темели на или е развиена со користење на Доверливите информации на една Договорна страна, останува исклучива сопственост на таа Договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Ништо во овој Договор не може да се толкува како пренос, доделување или отстапување на права на интелектуална сопственост од една Договорна страна на другата, освен доколку тоа не е посебно договорено во писмена форма.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `За избегнување на сомнеж, секоја Договорна страна останува слободна самостојно да развива и произведува сопствени производи, доколку таквите активности се вршат без користење на интелектуалната сопственост, знаењето или Доверливите информации на другата Договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `За да се избегне секаков сомнеж, договорните страни се согласни дека Првата договорна страна (Добавувачот) ќе биде слободна самостојно да развива и произведува свои производи, под услов таквите активности да се спроведуваат без употреба на интелектуална сопственост, знаење или доверливи информации на Втората договорна страна. Сепак, оваа слобода нема да се прошири на развој или производство на производи кои се во директна конкуренција со асортиманот на производи на Втората договорна страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    // LIABILITY Section
    new Paragraph({
      children: [
        new TextRun({ text: "ОДГОВОРНОСТ ЗА ШТЕТА", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 5
    new Paragraph({
      children: [
        new TextRun({ text: "Член 5", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја договорна страна е целосно одговорна за каква било штета предизвикана на другата страна или на клиентите или деловните партнери на таа страна поради повреда на условите на овој договор, вклучително и за каква било штета предизвикана со дејствијата на Претставниците на договорната страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 6
    new Paragraph({
      children: [
        new TextRun({ text: "Член 6", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Секое известување и изјава во согласност со овој Договор ќе биде направено во писмена форма и испратено преку курирски услуги или преку препорачана пошта на адресите на договорните страни наведени во насловот на овој договор${contactEmail ? ` или на адресите за е-пошта определена меѓу договорните страни: ${contactEmail}` : ' или на адресите за е-пошта определена меѓу договорните страни'}.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // TRANSITIONAL AND FINAL PROVISIONS
    new Paragraph({
      children: [
        new TextRun({ text: "ПРЕОДНИ И ЗАВРШНИ ОДРЕДБИ", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({ text: "" }),
    
    // Article 7
    new Paragraph({
      children: [
        new TextRun({ text: "Член 7", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сите измени и дополнувања на Договорот ќе се направат во писмена форма, во спротивно ќе бидат ништовни и неважечки.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Секој спор или побарување што произлегува или е во врска со овој Договор, вклучително и валидноста, невалидноста, кршењето или раскинувањето на истиот, што не може ефикасно да се реши со преговори, ќе се реши во согласност со важечкото законодавство на Република Северна Македонија.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    // Article 8
    new Paragraph({
      children: [
        new TextRun({ text: "Член 8", bold: true }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Договорот е склучен на определено време од ${agreementDuration} (години), сметано од денот на неговото потпишување.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Секоја договорна страна има право да го раскине овој договор, без отказен рок, со испраќање на писмено известување до другата страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Обврска за доверливост во врска со доверливите информации објавени во времетраењето на овој Договор ќе продолжи да има важност по неговото раскинување, односно престанување за максималниот период дозволен со закон, но не пократок од 5 (пет) години од неговото раскинување / престанување.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `За избегнување на сомнеж, со овој Договор не се воспоставуваат никакви обврски за неконкуренција, ограничувања во однос на деловна соработка со трети лица, ниту пак обврски за претходна согласност од другата Договорна страна. Такви одредби, доколку бидат договорени, ќе бидат предмет на посебни преговори и ќе бидат вклучени во идниот договор за снабдување или соработка.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој договор e склучен во 2 (два) примероци, по 1 (еден) примерок за секоја страна.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: `Овој Договор е составен на англиски и македонски јазик. Во случај на каков било судир, недоследност или двосмисленост помеѓу јазичните верзии, англиската верзија ќе има предност и ќе се применува.`,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" })
  ];

  // Add additional terms if provided
  if (additionalTerms && additionalTerms.trim() !== '') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "ДОПОЛНИТЕЛНИ УСЛОВИ", bold: true }),
        ],
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: additionalTerms,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    // First Party signature
    new Paragraph({
      children: [
        new TextRun({ text: "ПРВА ДОГОВОРНА СТРАНА:" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: companyName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Управител ${companyManager}` }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 }
    }),

    // Second Party signature
    new Paragraph({
      children: [
        new TextRun({ text: "ВТОРА ДОГОВОРНА СТРАНА:" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "___________________________" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: secondPartyName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 }
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return { doc };
}

module.exports = generateNDADoc;