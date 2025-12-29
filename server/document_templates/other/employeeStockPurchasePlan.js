const { Document, Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');
const moment = require('moment');

/**
 * Employee Stock Purchase Plan Document Template
 * Generates comprehensive ESPP document for Macedonian companies based on U.S./International ESPP standards
 * Adapted to Macedonian corporate law (Закон за трговски друштва)
 * Template parameters: (formData, user, company) - CRITICAL ORDER
 */
function generateEmployeeStockPurchasePlanDoc(formData, user, company) {
  // Company data with defaults
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyNumber = company?.companyTaxNumber || company?.taxNumber || '[ЕМБС на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';

  // Extract jurisdiction from company address (city) or use default
  const jurisdiction = companyAddress.includes('Скопје') ? 'Скопје, Република Северна Македонија' :
                       companyAddress.includes('Битола') ? 'Битола, Република Северна Македонија' :
                       companyAddress.includes('Охрид') ? 'Охрид, Република Северна Македонија' :
                       'Република Северна Македонија';

  // Ownership type - акции (stocks) or удели (shares)
  // Default to акции if not specified or empty string
  const ownershipType = (formData?.ownershipType && formData.ownershipType !== '') ? formData.ownershipType : 'акции';
  const isShares = ownershipType === 'удели'; // true for ДОО/ДООЕЛ, false for АД

  // Conditional terminology based on ownership type
  const ownershipTerm = isShares ? 'удели' : 'акции'; // shares vs stocks
  const ownershipTermSingular = isShares ? 'удел' : 'акција';
  const ownershipTermGenitive = isShares ? 'удели' : 'акции';
  const buyingVerb = isShares ? 'стекнување' : 'купување';
  const assemblyTerm = isShares ? 'Собранието на членови' : 'Собранието на акционери';
  const ownersTerm = isShares ? 'членови' : 'акционери';

  // Plan basic information
  const effectiveDate = formData?.effectiveDate ? moment(formData.effectiveDate).format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');

  // Build purpose text from selected checkboxes
  const purposeParts = [];
  if (formData?.purposeOwnership) purposeParts.push(`да им овозможи на вработените да станат сопственици на ${ownershipTerm} на компанијата`);
  if (formData?.purposeMotivation) purposeParts.push('да ги мотивира вработените');
  if (formData?.purposeRetention) purposeParts.push('да ги задржи квалитетните кадри');
  if (formData?.purposeAlignment) purposeParts.push(`да ги усогласи интересите на вработените со ${ownersTerm}те`);
  if (formData?.purposeReward) purposeParts.push('да ги наградува вработените за успехот на компанијата');
  if (formData?.purposeAttract) purposeParts.push('да привлече нови квалитетни кадри');

  const purpose = purposeParts.length > 0
    ? purposeParts.join(', ')
    : `да им овозможи на вработените можност да станат сопственици на ${ownershipTerm} на компанијата преку системот на ${buyingVerb} ${ownershipTerm} по поволни услови`;

  // Eligibility criteria
  const minimumServiceMonths = formData?.minimumServiceMonths || '3';
  const minimumWorkHours = formData?.minimumWorkHours || '20';

  // Plan parameters - conditional based on ownership type
  const maximumShares = isShares
    ? (formData?.maximumSharesPercentage ? `${formData.maximumSharesPercentage}%` : '[Процент на удели]')
    : (formData?.maximumSharesNumber || '[Број на акции]');

  const purchasePricePercentage = formData?.purchasePricePercentage || '85';
  const offeringPeriodMonths = formData?.offeringPeriodMonths || '6';
  const enrollmentDates = formData?.enrollmentDates || '1 февруари и 1 август';
  const maxPayrollDeductionPercentage = formData?.maxPayrollDeductionPercentage || '20';

  // Plan duration
  const termPeriod = formData?.termPeriod || '[Времетраење во години/месеци]';
  const termUnit = formData?.termUnit || 'години';

  // Committee information
  const committeeName = formData?.committeeName || 'Одборот за наградување';
  const allowsCashContributions = formData?.allowsCashContributions === 'да' || formData?.allowsCashContributions === true;

  const doc = new Document({
    sections: [{
      children: [
        // Document title
        new Paragraph({
          children: [
            new TextRun({
              text: `ПЛАН ЗА ${buyingVerb.toUpperCase()} ${ownershipTerm.toUpperCase()} ОД СТРАНА НА ВРАБОТЕНИ`,
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
              text: isShares ? '(Employee Share Purchase Plan)' : '(Employee Stock Purchase Plan)',
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
              text: `Овој план е донесен на ${effectiveDate} од страна на ${companyName}, ${jurisdiction}, со седиште на ${companyAddress}, ЕМБС ${companyNumber}, (во понатамошниот текст: „Компанијата") и одобрен од ${assemblyTerm}, со цел да им обезбеди на вработените во Компанијата можност да стекнуваат ${ownershipTerm} од Компанијата преку посебен договор и постапка иницирана од Компанијата врз основа на овој план и утврдените критериуми.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Планот е следниот (поимите со големи букви користени во овој план, покraj горенаведените, се дефинирани во секцијата „ДЕФИНИЦИИ"):',
              italics: true
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Article 1: Purpose
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 1', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ЦЕЛ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Целта на овој план е ${purpose}. Планот има за цел да ги мотивира вработените преку директна финансиска партиципација во долгорочниот успех на Компанијата, да ги задржи квалитетните кадри и да ја зајакне нивната лојалност кон Компанијата.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 2: Administration
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 2', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'АДМИНИСТРАЦИЈА НА ПЛАНОТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '2.1. Администрација од страна на одборот', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Овој план ќе го администрира ${committeeName} (во понатамошниот текст: „Одборот"). Одборот е овластен да го толкува планот, да донесува правила, насоки и формулари кои ги смета за соодветни за имплементација на планот, и да донесува сите други политички одлуки поврзани со работењето на планот.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '2.2. Процедури на одборот', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Органите на управување можат да именуваат дополнителни членови во Одборот, да заменуваат постоечки членови и да пополнуваат празни места. Одборот избира претседател од своите членови, може да одржува состаноци во време и на начин што го смета за соодветен, и донесува одлуки со мнозинство на своите членови.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 3: Eligibility
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 3', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'УСЛОВИ ЗА УЧЕСТВО', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '3.1. Квалификувани вработени', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Вработените во Компанијата ќе бидат квалификувани да учествуваат во планот (секој, „Квалификуван вработен") доколку го исполнуваат следново:`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `   а) се вработени во Компанијата најмалку ${minimumServiceMonths} месеци;`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `   б) редовно работат минимум ${minimumWorkHours} часа неделно.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '3.2. Привремени измени на дефиницијата', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Пред датумот на запишување, Одборот може привремено да ја измени дефиницијата на Квалификуван вработен за да вклучи или исклучи вработени врз основа на различни критериуми (минимален работен стаж, работни часови, високо компензирани вработени и сл.).'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 4: Participation
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 4', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'УЧЕСТВО', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '4.1. Поднесување на пријава за учество', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Квалификуван вработен може да учествува во овој план со пополнување на пријава за учество со одобрување на одбивања од плата. Одбивањата од платата на секој учесник ќе започнат на првата исплата на плата по датумот на запишување и ќе завршат на последниот датум на исплата во периодот на понудата за кој важи неговото/нејзиното одобрување.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 5: Offering Periods
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 5', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПЕРИОДИ НА ПОНУДА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '5.1. Временско траење на периодите на понуда', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Овој план ќе се имплементира преку последователни периоди на понуда, секој со времетраење од приближно ${offeringPeriodMonths} месеци, започнувајќи на ${enrollmentDates} секоја година, или на друг датум што ќе го определи Одборот.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 6: Payroll Deductions
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 6', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ОДБИВАЊА ОД ПЛАТА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '6.1. Избор на износ на одбивање', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Кога учесникот ќе ја поднесе својата пријава за учество, тој/таа избира одбивања од платата да се вршат во износ помал од ${maxPayrollDeductionPercentage}% од платата што учесникот ја добива на секој ден на исплата на плата за време на периодот на понудата, и тоа само во цели проценти.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '6.2. Сметки на учесниците', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Придонесите на учесникот ќе бидат кредитирани на неговата/нејзината сметка според овој план. Учесникот не може да врши дополнителни уплати на својата сметка.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 7: Tax Withholding
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 7', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ДАНОЧНО ЗАДРЖУВАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Во моментот на извршување на опцијата, целосно или делумно, или во моментот кога се отуѓуваат акциите издадени според планот, учесникот мора да обезбеди соодветни средства за даночни обврски на Компанијата. Компанијата може да задржи од платата на учесникот било кој износ неопходен за да ги исполни своите обврски за даночно задржување.'
          })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 8: Purchase of Shares
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 8', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'КУПУВАЊЕ НА АКЦИИ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '8.1. Автоматско купување', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Освен ако учесникот не се повлече од планот, на датумот на извршување опцијата на учесникот за купување акции автоматски ќе стапи на сила, и максималниот број на целосни акции предмет на опцијата ќе биде купен за учесникот по применливата цена на купување со акумулираните одбивања од платата од сметката на учесникот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '8.2. Цена на купување', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Цената на купување е еднаква на ${purchasePricePercentage}% од пазарната вредност на акцијата на Компанијата на датумот на запишување или на датумот на извршување, која и да е пониска. Ова обезбедува дисконтна цена за вработените и ги поттикнува да учествуваат во планот.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `8.3. ${isShares ? 'Минимален процент' : 'Фракциони акции'}`, bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: isShares
                ? 'Минималниот процент на удели кој може да се стекне според овој план е утврден од страна на Компанијата. Било кои одбивања од плата акумулирани во сметката на учесникот кои не се доволни за стекнување на минималниот процент ќе останат во сметката на учесникот за следниот период на понуда.'
                : 'Никакви фракциони акции на Компанијата нема да бидат купени според овој план. Било кои одбивања од плата акумулирани во сметката на учесникот кои не се доволни за купување на целосна акција ќе останат во сметката на учесникот за следниот период на понуда.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 9: Stock Subject to Plan
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 9', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'АКЦИИ ПРЕДМЕТ НА ПЛАНОТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `9.1. ${isShares ? 'Максимален процент на удели' : 'Максимален број на акции'}`, bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: isShares
                ? `Максималниот процент на удели на Компанијата кој ќе биде достапен за стекнување според овој план изнесува ${maximumShares} од вкупните удели. Овој процент подлежи на одобрување од ${assemblyTerm}.`
                : `Максималниот број на акции на Компанијата кои ќе бидат достапни за стекнување според овој план изнесува ${maximumShares} обични акции. Овој број подлежи на прилагодување при промени во капитализацијата на Компанијата.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: `9.2. Регистрација на ${ownershipTerm}`, bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Компанијата ќе ${isShares ? 'ги запише' : 'ги регистрира'} сите ${ownershipTerm} кои се стекнуваат од учесник според овој план на името на учесникот или на името на учесникот и неговиот/нејзиниот сопруг/сопруга.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 10: Withdrawal
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 10', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПОВЛЕКУВАЊЕ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '10.1. Право на повлекување', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Учесник може да ги повлече сите, но не помалку од сите, придонесите кредитирани на неговата/нејзината сметка и сè уште не употребени за извршување на неговата/нејзината опција во секое време со поднесување на писмено известување за повлекување до Компанијата или следејќи електронска или друга постапка за повлекување пропишана од Одборот.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '10.2. Прекинување на опцијата', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'По приемот на известувањето за повлекување на учесникот, Компанијата веднаш ќе му ги исплати на тој учесник сите придонеси кредитирани на неговата/нејзината сметка, опцијата на учесникот за тековниот период автоматски ќе биде прекината, и нема да се вршат понатамошни придонеси за купување акции за време на периодот на понудата.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 11: Adjustments
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 11', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ПРИЛАГОДУВАЊА', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '11.1. Промени во капитализација', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Одборот ќе пропорционално ги прилагоди максималниот број акции што секој учесник може да ги купи во секој период на понудата, цената по акција, и бројот на акции на Компанијата покриени со секоја опција според овој план која сè уште не е извршена за да се земат предвид зголемувањата или намалувањата во бројот на издадени акции што произлегуваат од поделба на акции, обратна поделба на акции, акциски дивиденд, комбинација, рекласификација на акции, или било кое друго зголемување или намалување на бројот на акции извршено без Компанијата да добие надоместок.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '11.2. Распуштање или ликвидација', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Во случај на предложено распуштање или ликвидација на Компанијата, Одборот ќе го скрати периодот на понудата што е во тек со поставување на нов датум на извршување така што периодот на понудата ќе заврши непосредно пред завршувањето на предложеното распуштање или ликвидација.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '11.3. Спојување или продажба на средства', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Во случај на предложена продажба на сите или суштински сите средства на Компанијата, или спојување на Компанијата со или во друго правно лице, секоја издадена опција ќе биде презумена или заменета со еквивалентна опција од страна на следбениот правен субјект. Доколку следбеникот одбие да презуме или замени опција, Одборот ќе го скрати периодот на понудата што е во тек со поставување на нов датум на извршување.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 12: Term of Plan
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 12', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ВРЕМЕТРАЕЊЕ НА ПЛАНОТ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '12.1. Датум на стапување во сила', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Овој план влегува во сила на ${effectiveDate} година, што е порано од датумот кога Одборот го усвојува овој план, или акционерите на Компанијата го одобруваат овој план.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '12.2. Времетраење', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Овој план ќе продолжи за период од ${termPeriod} ${termUnit}, освен ако не биде прекинат порано.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 13: Amendment or Termination
        new Paragraph({
          children: [
            new TextRun({ text: 'Член 13', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ИЗМЕНИ ИЛИ ПРЕКИН', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '13.1. Право на изменување', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Одборот може да го измени, суспендира или прекине овој план, или било кој дел од овој план, од било која причина. Доколку планот биде прекинат, Одборот може да избере да ги прекине сите периоди на понуда што се во тек веднаш или при завршувањето на купувањето на акции на следниот датум на извршување, или да дозволи периодите на понуда да истечат според нивните услови.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '13.2. Измени без согласност на акционери', bold: true })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Без согласност на акционерите и без оглед на тоа дали правата на било кој учесник можат да се сметаат за негативно погодени, Одборот може да ги промени периодите на понуда, да ја ограничи фреквенцијата или бројот на промени во износот задржан за време на период на понуда, да воспостави курс на размена применлив за износите задржани во валута различна од американски долари, и да воспостави такви други ограничувања или постапки што Одборот ги смета за соодветни кои се конзистентни со овој план.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        // Article 14: Cash Contributions (if applicable)
        ...(allowsCashContributions ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Член 14', bold: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: 'ГОТОВИНСКИ ПРИДОНЕСИ', bold: true })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Квалификувани вработени можат да учествуваат во овој план преку готовински придонеси наместо одбивања од плата доколку одбивањата од плата не се дозволени според применливото локално законодавство, Одборот утврди дека готовинските придонеси се дозволени и Одборот експлицитно дозволува готовински придонеси.'
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 400, line: 276 }
          })
        ] : []),

        // Article 15/16: Definitions
        new Paragraph({
          children: [
            new TextRun({ text: allowsCashContributions ? 'Член 15' : 'Член 14', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'ДЕФИНИЦИИ', bold: true })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '„Одбор" значи одборот на директори на Компанијата или негов овластен делегат.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '„Работен ден" значи ден различен од сабота, недела или било кој друг ден кога главните банки во Република Северна Македонија не се отворени за работа.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Придонеси" значи одбивањата од плата и други дополнителни уплати што Компанијата може да им дозволи на учесниците да ги вршат за финансирање на извршувањето на опциите доделени според овој план.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '„Квалификуван вработен" е дефиниран во Член 3.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Вработен" значи било кое лице, вклучувајќи и службеник, вработено од страна на Компанијата.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Датум на запишување" значи првиот работен ден на или по ${enrollmentDates} од секоја година.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Датум на извршување" значи датумот приближно ${offeringPeriodMonths} месеци по датумот на запишување на период на понуда.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '„Пазарна вредност" значи затворената продажна цена на обичните акции на Компанијата на берзата со најголем обем на тргување со акциите на Компанијата на последниот работен ден пред датумот на одредувањето.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Период на понуда" значи периодите од приближно ${offeringPeriodMonths} месеци за време на кои опција доделена според овој план може да биде извршена, започнувајќи на првиот работен ден на или по ${enrollmentDates} од секоја година, и завршувајќи на датумот на извршување приближно ${offeringPeriodMonths} месеци подоцна.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '„Учесник" е дефиниран во Член 4.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `„Цена на купување" значи износ еднаков на ${purchasePricePercentage}% од пазарната вредност на акцијата на Компанијата на датумот на запишување или на датумот на извршување, која и да е пониска.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        }),

        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),

        // Signatures
        new Paragraph({
          children: [
            new TextRun({ text: 'За Компанијата:' })
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
            new TextRun({ text: companyName })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: companyManager })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateEmployeeStockPurchasePlanDoc;
