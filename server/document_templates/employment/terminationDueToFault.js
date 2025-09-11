const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = require('docx');
const moment = require('moment');

// Article 81 case descriptions from legal text
const ARTICLE_81_CASES = {
  '1': 'не ги почитува работниот ред и дисциплина според правилата пропишани од страна на работодавачот',
  '2': 'не ги извршува или несовесно и ненавремено ги извршува работните обврски',
  '3': 'не се придржува кон прописите што важат за вршење на работите на работното место',
  '4': 'не се придржува на работното време, распоредот и користењето на работното време',
  '5': 'не побара отсуство или навремено писмено не го извести работодавачот за отсуството од работа',
  '6': 'поради болест или оправдани причини отсуствува од работа, а за тоа во рок од 48 часа, писмено не го извести работодавачот',
  '7': 'со средствата за работа не постапува совесно или во согласност со техничките упатства за работа',
  '8': 'настане штета, грешка во работењето или загуба, а за тоа веднаш не го извести работодавачот',
  '9': 'не ги почитува прописите за заштита при работа или не ги одржува средствата и опремата за заштита при работа',
  '10': 'предизвикува неред и насилнички се однесува за време на работата',
  '11': 'незаконски или неовластето ги користи средствата на работодавачот'
};

// Article 82 case descriptions from legal text
const ARTICLE_82_CASES = {
  '1': 'неоправдано изостане од работа три последователни работни дена или пет работни дена во текот на една година',
  '2': 'го злоупотреби боледувањето',
  '3': 'не се придржува кон прописите за здравствена заштита, заштита при работа, пожар, експлозија, штетно дејствување на отрови и други опасни материи и ги повредува прописите за заштита на животната средина',
  '4': 'внесува, употребува или е под дејство на алкохол и наркотични средства',
  '5': 'стори кражба или во врска со работата намерно или од крајно невнимание предизвика штета на работодавачот',
  '6': 'оддаде деловна, службена или државна тајна'
};

/**
 * Generate Simplified Termination Due to Fault Document
 * Based on Articles 81 and 82 of Macedonia Labor Law
 * Ultra-simplified version with optional fields for manual completion
 */
function generateTerminationDueToFaultDoc(formData, user, company) {
  // Extract company information
  const companyName = company?.companyName || '[Име на компанија]';
  const companyAddress = company?.companyAddress || company?.address || '[Адреса на компанија]';
  const companyTaxNumber = company?.companyTaxNumber || company?.taxNumber || '[Даночен број на компанија]';
  const companyManager = company?.companyManager || company?.manager || '[Управител]';
  
  // Extract basic employee information (all optional)
  const employeeName = formData?.employeeName || '[Име и презиме на работникот]';
  const employeePIN = formData?.employeePIN || '[ЕМБГ на работникот]';
  const jobPosition = formData?.jobPosition || '[Работна позиција]';
  
  // Extract article case and factual situation
  const factualSituation = formData?.factualSituation || '[Опис на фактичката ситуација]';
  const articleType = formData?.articleType;
  const caseNumber = formData?.caseNumber;
  const applicableLegalArticle = formData?.applicableLegalArticle || '[Применлив член од ЗРО]';
  
  // Current date for document
  const currentDate = moment().format('DD.MM.YYYY');
  
  // Determine article intro text and case description
  let articleIntroText = '';
  let caseDescription = '';
  let noticePeriodText = '[со или без отказен рок]';
  
  if (articleType === '81' && caseNumber && ARTICLE_81_CASES[caseNumber]) {
    articleIntroText = `член 81 став 1 точка ${caseNumber} од Законот за работни односи („Службен весник на Република Северна Македонија" бр. 167/15, 27/16, 134/16, 120/18, 110/19, 90/20, 267/20, 151/21, 288/21)`;
    caseDescription = ARTICLE_81_CASES[caseNumber];
    noticePeriodText = 'со отказен рок од 30 (триесет) дена';
  } else if (articleType === '82' && caseNumber && ARTICLE_82_CASES[caseNumber]) {
    articleIntroText = `член 82 став 1 точка ${caseNumber} од Законот за работни односи („Службен весник на Република Северна Македонија" бр. 167/15, 27/16, 134/16, 120/18, 110/19, 90/20, 267/20, 151/21, 288/21)`;
    caseDescription = ARTICLE_82_CASES[caseNumber];
    noticePeriodText = 'без отказен рок (итно)';
  } else {
    articleIntroText = `${applicableLegalArticle} од Законот за работни односи („Службен весник на Република Северна Македонија" бр. 167/15, 27/16, 134/16, 120/18, 110/19, 90/20, 267/20, 151/21, 288/21)`;
    caseDescription = '[опис на случајот според избраниот член и точка]';
  }

  // Create the document
  const doc = new Document({
    sections: [{
      children: [
        // Document number and date (at the top)
        new Paragraph({
          children: [
            new TextRun({ text: `Бр. _____ од ${currentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        }),

        // Legal basis introduction with proper Macedonian format
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Согласно ${articleIntroText}, ${companyName}, со седиште на ${companyAddress}, застапувана од ${companyManager}, на ${currentDate} донесе следнава одлука:`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Document title
        new Paragraph({
          children: [
            new TextRun({ text: 'РЕШЕНИЕ', bold: true, size: 32 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'за откажување на договорот за вработување поради', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'кршење на работниот ред и дисциплина и работните обврски', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: '(причина на вина)', bold: true, size: 20 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Main decision
        new Paragraph({
          children: [
            new TextRun({ 
              text: `На работникот ${employeeName}, вработен во ${companyName}, на работното место: „${jobPosition}", МУ СЕ ОТКАЖУВА ДОГОВОРОТ ЗА ВРАБОТУВАЊЕ и му престанува работниот однос поради кршење на работниот ред и дисциплина и работните обврски ${noticePeriodText} од денот на приемот на ова решение.`, 
              bold: true 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // ОБРАЗЛОЖЕНИЕ section
        new Paragraph({
          children: [
            new TextRun({ text: 'О Б Р А З Л О Ж Е Н И Е', bold: true, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        // Employee relationship establishment
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Работникот ${employeeName} е ангажиран кај работодавачот врз основа на Договорот за вработување на работна позиција „${jobPosition}".`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),

        // Specific case description from legal text
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Во согласност со својата работна позиција и обврските кои произлегуваат од истата, работникот бил должен да ги исполнува своите работни обврски. Меѓутоа, спротивно на горенаведената обврска, утврдено е дека работникот: ${caseDescription}.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),

        // Include full article content if selected
        ...(articleType && caseNumber ? [
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Согласно член ${articleType} став 1 точка ${caseNumber} од Законот за работни односи, работодавачот може да му го откаже договорот за вработување на работникот доколку ${caseDescription}.`, 
                bold: false,
                italics: true 
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
          })
        ] : []),

        // Factual situation (if provided)
        ...(factualSituation && factualSituation !== '[Опис на фактичката ситуација]' ? [
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Фактичка ситуација: ${factualSituation}`, 
                bold: false 
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
          })
        ] : []),

        // Legal reasoning
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Врз основа на горенаведеното, а од причина што на работникот му беа дадени соодветни услови за работа и на јасен начин му беа претходно презентирани правилата на работодавачот, а истиот постапи спротивно на истите, работниот однос престанува поради вина на работникот.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),

        // Employment termination notice
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Согласно на ова, Договорот за вработување на работникот ќе се смета за престанат ${noticePeriodText === 'без отказен рок (итно)' ? 'итно од денот на приемот на ова решение' : 'во рок од 30 (триесет) дена по приемот на ова решение'} од страна на работникот, кога и работникот ќе биде одјавен од Агенцијата за вработување.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 300 }
        }),

        // Notice period requirements (only for Article 81)
        ...(articleType === '81' ? [
          new Paragraph({
            children: [
              new TextRun({ 
                text: `Работникот е должен да го почитува отказниот рок од 30 (триесет) дена и да се јавува на работа, освен доколку договорните страни не се договорат поинаку со писмена спогодба.`, 
                bold: false 
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 300 }
          })
        ] : []),

        // Final reasoning
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Следствено на горе наведено, работодавачот донесе Решение како во диспозитивот.`, 
              bold: false 
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Legal rights notice
        new Paragraph({
          children: [
            new TextRun({ 
              text: `Правна поука: Против ова Решение, Работникот има право на приговор во рок од 8 (осум) дена до Работодавачот.`, 
              bold: false,
              italics: true
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Signature section
        new Paragraph({
          children: [
            new TextRun({ text: `Скопје, ${currentDate} година`, bold: false })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Employee signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работникот:" }),
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
            new TextRun({ text: employeeName }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 }
        }),

        // Employer signature
        new Paragraph({
          children: [
            new TextRun({ text: "За работодавачот:" }),
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
            new TextRun({ text: companyManager }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 300 }
        })
      ]
    }]
  });

  return { doc };
}

module.exports = generateTerminationDueToFaultDoc;