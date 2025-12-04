const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, PageBreak } = require('docx');
const moment = require('moment');

function generateMandatoryBonusDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]'; 
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Form data with defaults
  const decisionDate = formData?.decisionDate ? moment(formData.decisionDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  const year = formData?.year || new Date().getFullYear().toString();
  const amount = formData?.amount || '[Износ]';
  const employeesRepresentative = formData?.employeesRepresentative || '[Претставник на вработените]';
  
  // Parse union data (format: "Name|Address")
  const unionData = formData?.employeeUnion ? formData.employeeUnion.split('|') : ['[Назив на синдикат]', '[Адреса на синдикат]'];
  const employeeUnion = unionData[0] || '[Назив на синдикат]';
  const employeeUnionAddress = unionData[1] || '[Адреса на синдикат]';

  const children = [
    // ===== DOCUMENT 1: DECISION FOR ANNUAL LEAVE BONUS =====
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Врз основа на член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13) ${companyName}, со седиште на ${companyAddress}, со Даночен број ${companyTaxNumber}, претставувано од Управителот ${companyManager} (во натамошниот текст "работодавец"), Скопје на ден ${decisionDate} година, ја донесе следната:`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ОДЛУКА", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "за исплата на регресот за годишен одмор", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `На сите вработени во ${companyName}, им се утврдува право на исплата на регрес за годишен одмор за ${year} година, во висина на надомест од ${amount},00 денари по вработен.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Регресот за годишен одмор ќе биде исплаќан на секој вработен пооделно во зависност од исполнување на условот од 6 месеци работа во календарска година (01.01.${year} – 31.12.${year}) кај работодавачот, а ќе биде исплатен најдоцна до 31.12.${year} година.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ОБРАЗЛОЖЕНИЕ", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: "Оваа Одлуката е донесена согласно Законот, со што работодавачот ја исполнува обврската за исплата на регрес за годишен одмор на вработените кои се вработени најмалку 6 месеци во друштвото."
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: "Согласно член 35 од Општиот колективен договор за приватниот сектор од областа на стопанството е утврдено дека Кај работодавачите кај кои настанале потешкотии во работењето, ценејќи ја економско - финансиската состојба на работодавачот, по задолжителна предходна консултација со синдикатот на ниво на гранка односно оддел, со спогодба потпишана од работодавачот и репрезентативната синдикална организација може да се утврди регрес за годишен одмор во помал износ од износот утврден со овој колективен договор."
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Во текот на ${year} година, во ${companyName} беше остварен негативен финансиски резултат и друштвото во моментот на донесување на оваа одлука е со потешкотии во работењето.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Прилог: Финансиски / сметководствен извештај;" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Од оваа причина, претставникот на вработените, лицето ${employeesRepresentative} по овластување и согласност од страна на вработените, со работодавачот потпиша спогодба за исплата на регрес за годишен одмор за ${year} година во износ утврден како во диспозитивот на оваа одлука.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Прилог: Спогодба помеѓу работодавач и вработени;" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Со донесената одлука се запознаени сите вработени и оваа одлуката стапува во сила со денот на нејзиното донесување." }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: `${decisionDate} година.` }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500, line: 276 }
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
        new TextRun({ text: companyName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: companyManager }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    }),

    // ===== PAGE BREAK TO DOCUMENT 2 =====
    new Paragraph({
      children: [new PageBreak()],
    }),

    // ===== DOCUMENT 2: MINUTES FOR EMPLOYEE REPRESENTATIVE SELECTION =====
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Врз основа на член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13), по одржаниот состанок на ${decisionDate} година вработените во ${companyName}, со седиште на ${companyAddress}, со Даночен број ${companyTaxNumber}, на ден ${decisionDate} година, се составува следниот:`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ЗАПИСНИК", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "за избор на претставник на вработените за преговори и договарање на висина на регрес за годишен одмор", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `1. Вработените во ${companyName} се состанаа со цел избор на претставник на вработените за преговори и договарање на висина на регрес за годишен одмор и утврдување на минимално прифатлив износ за регрес на годишен одмор кај работодавачот. Учесници на состанокот во смисла на применливите законски одредби беа само лица кои во моментот на одржување на овој состанок се вработени кај работодавачот, без оглед на времето поминато на работа кај работодавачот.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `2. Врз основа на член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13), вработените во ${companyName}, со седиште на ${companyAddress}, со Даночен број ${companyTaxNumber}, со мнозинство од гласови од вработените во друштвото кои имаат работа во друштвото повеќе од шест месеци во ${year} година, на ден ${decisionDate} ја донесоја следната:`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ОДЛУКА", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "За избор на претставник на вработените за преговори и договарање на висина на регрес за годишен одмор", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Врз основа на оваа одлука, се избира лицето:" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: `- ${employeesRepresentative}`, bold: true }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: `за претставник на вработените во ${companyName}.`, bold: true }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: "Претставникот на вработените од член 1 е овластен во име на сите вработени да потпиши со работодавачот спогодба за исплата на регрес за годишен одмор во износ помал од пропишаниот со Општиот колективен договор за приватниот сектор од областа на стопанството."
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Претставникот на вработените од член 1 е овластен во име на вработените да преговара и со работодавачот да постигне спогодба за исплата на регрес за годишен одмор во износ од ${amount},00 денари по вработен.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Оваа одлука влегува во сила на денот на нејзиното донесување и претставува волја на вработените во ${companyName}.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Потписи на вработени кои избираат претставник:", bold: true }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "________________________________" }),
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Име и презиме, краток потпис на вработен" }),
      ],
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "________________________________" }),
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Име и презиме, краток потпис на вработен" }),
      ],
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Прилог: листа на вработени од АВРМ", bold: true }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),

    // ===== PAGE BREAK TO DOCUMENT 3 =====
    new Paragraph({
      children: [new PageBreak()],
    }),

    // ===== DOCUMENT 3: AGREEMENT BETWEEN EMPLOYER AND EMPLOYEES =====
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Врз основа на член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13), на ден ${decisionDate} година, договорните страни:`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `1. ${companyName}, со седиште на ${companyAddress}, со Даночен број ${companyTaxNumber}, претставувано од Управителот ${companyManager}, во својство на работодавач`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `2. Вработените во ${companyName}, претставувани од претставникот ${employeesRepresentative}.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ја потпишаа следната:" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "СПОГОДБА", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `КАДЕ ШТО: ${companyName} во текот на ${year} година работеше со негативен финансиски резултат и друштвото во моментот на потпишување на оваа одлука е со потешкотии во работењето;`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `КАДЕ ШТО: Кај Работодавачот, ${companyName} нема формирано синдикат по што оваа спогодба е потпишана од страна на избран претставник од страна на вработените;`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `КАДЕ ШТО: Вработените поради потешкотиите во работењето во текот на ${year} година, се согласни на име регрес на годишен одмор да примат помал износ;`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 1", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Предмет на оваа спогодба е утврдување на помал износ на регрес за годишен одмор." }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 2", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Кај работодавачот ${companyName} за ${year} година, на сите вработени кои се стекнале со право на регрес за годишен одмор согласно применливиот колективен договор, ќе биде исплатен износ од ${amount},00 денари на име регрес за годишен одмор.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 3", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `Износот утврден во член 2 на оваа спогодба ќе биде исплатен најдоцна до 31.12.${year} година.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Член 4", bold: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Оваа одлука ја претставува волјата на договорните страни и со истата одделно се запознати сите вработени кај работодавачот." }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "За работодавачот:" }),
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
        new TextRun({ text: companyName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: companyManager }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "За претставникот:" }),
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
        new TextRun({ text: employeesRepresentative }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    }),

    // ===== PAGE BREAK TO DOCUMENT 4 =====
    new Paragraph({
      children: [new PageBreak()],
    }),

    // ===== DOCUMENT 4: REQUEST FOR CONSULTATION WITH UNION =====
    new Paragraph({
      children: [
        new TextRun({ text: "ДО" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: employeeUnion }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: employeeUnionAddress }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "ОД:" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: `${companyName},` }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: companyAddress }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: "ПРЕДМЕТ: Барање за консултација со синдикат на ниво на гранка согласно член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13)", 
          bold: true 
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Почитувани," }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: `${companyName} е работодавач кој во текот на ${year} година имаше потешкотии во работењето од финансиски аспект.`
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Од оваа причина, по претходна консултација со претставникот на вработените, беше донесена Одлука за исплата на регрес за годишен одмор во помал износ од предвидениот." }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ 
          text: "Во согласност со член 35 став 1 алинеја 7 од Општиот колективен договор за приватниот сектор од областа на стопанството (Сл.весник на РМ 88/09...189/13), пред постапување согласно дадената одлука, бараме од Вас како синдикат на ниво на гранка да се даде мислење / консултација по однос на донесената одлука."
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Прилог: Одлука за исплата на регресот за годишен одмор;" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Записник и Одлука за избор на претставник на вработените за преговори и договарање на висина на регрес за годишен одмор;" }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Со почит," }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300, line: 276 }
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: `${decisionDate} година.` }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 500, line: 276 }
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
        new TextRun({ text: companyName }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: 276 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: companyManager }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300, line: 276 }
    }),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return doc;
}

module.exports = generateMandatoryBonusDoc;