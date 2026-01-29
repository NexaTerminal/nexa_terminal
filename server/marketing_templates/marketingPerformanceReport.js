const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const moment = require('moment');

function generateMarketingPerformanceReportDoc(formData, user, company) {
  const companyName = company?.companyName || '[Име на компанија]';
  const industry = formData.industry || '[Индустрија]';

  // Period information
  const reportPeriodType = formData.reportPeriodType || 'Месечен';
  const dateFrom = formData.dateFrom ? moment(formData.dateFrom).format('DD.MM.YYYY') : '[Почетен датум]';
  const dateTo = formData.dateTo ? moment(formData.dateTo).format('DD.MM.YYYY') : '[Краен датум]';
  const currentDate = moment().format('DD.MM.YYYY');

  // Marketing channels
  const marketingChannels = formData.marketingChannels || [];
  const channelsList = marketingChannels.length > 0
    ? marketingChannels.join(', ')
    : '[Маркетинг канали]';
  const channelStrategy = marketingChannels.length > 1
    ? 'мулти-канална маркетинг стратегија'
    : 'фокусирана маркетинг стратегија';

  // Budget information
  const totalBudget = formData.totalBudget ? formatAmount(formData.totalBudget) : '[Планиран буџет]';
  const actualSpent = formData.actualSpent ? formatAmount(formData.actualSpent) : '[Потрошен буџет]';
  const executionType = formData.executionType || '[Тип на извршување]';

  // Calculate budget evaluation
  const budgetEvaluation = calculateBudgetEvaluation(
    parseAmount(formData.totalBudget),
    parseAmount(formData.actualSpent)
  );

  // Performance indicators
  const totalLeads = formData.totalLeads || '[Број на leads]';
  const totalSales = formData.totalSales || '[Број на продажби]';
  const estimatedRevenue = formData.estimatedRevenue ? formatAmount(formData.estimatedRevenue) : '[Приход]';

  // Optional metrics
  const costPerLead = formData.showCostPerLead && formData.costPerLead
    ? formatAmount(formData.costPerLead)
    : null;
  const costPerSale = formData.showCostPerSale && formData.costPerSale
    ? formatAmount(formData.costPerSale)
    : null;

  // Calculate efficiency evaluation
  const efficiencyEvaluation = calculateEfficiency(
    parseAmount(formData.actualSpent),
    formData.totalLeads,
    formData.totalSales
  );

  // Goal achievement
  const mainGoal = formData.mainGoal || '[Главна цел]';
  const goalAchievement = formData.goalAchievement || '[Остварување]';
  const goalEvaluation = evaluateGoalAchievement(goalAchievement, mainGoal);

  // Challenges
  const challenges = formData.challenges || [];
  const challengesList = challenges.length > 0 && !challenges.includes('Нема значајни проблеми')
    ? challenges
    : [];

  // Overall rating
  const overallRating = formData.overallRating || '[Оценка]';
  const ratingReasoning = getRatingReasoning(overallRating);

  const sections = [{
    children: [
      // Title
      new Paragraph({
        children: [
          new TextRun({ text: 'МАРКЕТИНГ ПЕРФОРМАНС ИЗВЕШТАЈ', bold: true, size: 32 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: `${reportPeriodType} извештај за периодот ${dateFrom} - ${dateTo}`, size: 24 })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),

      // Section 1: General Information
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 1', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Општи информации', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Компанијата ${companyName}, која работи во индустријата ${industry}, спроведе маркетинг активности во периодот од ${dateFrom} до ${dateTo}. Овој извештај дава преглед на постигнатите резултати, финансиските перформанси и идентификувани предизвици во текот на наведениот период.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 2: Marketing Channels
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 2', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Користени маркетинг канали', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Во текот на овој период, компанијата примени ${channelStrategy} користејќи ги следните канали: ${channelsList}. ${marketingChannels.length > 1 ? 'Мулти-каналниот пристап овозможи подобро допирање до целната публика низ различни точки на контакт.' : 'Фокусираната стратегија овозможи длабоко продирање во избраниот канал.'}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 3: Budget and Financial Overview
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 3', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Буџет и финансиски преглед', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Планираниот маркетинг буџет за овој период изнесуваше ${totalBudget} денари, додека вистинските трошоци изнесуваа ${actualSpent} денари. Маркетинг активностите беа реализирани ${executionType}. ${budgetEvaluation}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 4: Results and Performance
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 4', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Резултати и перформанси', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Маркетинг активностите генерираа вкупно ${totalLeads} leads и остварија ${totalSales} продажби, што резултираше со проценет приход од ${estimatedRevenue} денари.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 276 }
      }),

      // Optional metrics paragraphs
      ...(costPerLead ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `Цената по генериран lead изнесуваше ${costPerLead} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        })
      ] : []),

      ...(costPerSale ? [
        new Paragraph({
          children: [
            new TextRun({
              text: `Цената по остварена продажба изнесуваше ${costPerSale} денари.`
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        })
      ] : []),

      new Paragraph({
        children: [
          new TextRun({
            text: efficiencyEvaluation
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 5: Goal Achievement
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 5', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Остварување на маркетинг целите', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Главната маркетинг цел за овој период беше ${mainGoal}. Оценката на остварување на целта е: ${goalAchievement}. ${goalEvaluation}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 6: Identified Challenges
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 6', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Идентификувани предизвици', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      ...(challengesList.length > 0 ? [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Во текот на спроведувањето на маркетинг активностите, беа идентификувани следните предизвици:'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 276 }
        }),
        ...challengesList.map(challenge =>
          new Paragraph({
            children: [
              new TextRun({ text: `• ${challenge}` })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100, line: 276 }
          })
        ),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Овие предизвици бараат внимание и соодветни активности за подобрување на идните кампањи.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        })
      ] : [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Во текот на овој период не беа идентификувани значајни предизвици. Маркетинг активностите се спроведуваа непречено и без поголеми пречки.'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400, line: 276 }
        })
      ]),

      // Section 7: Overall Rating
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 7', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Општа оценка', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Општата оценка на маркетинг перформансот за овој период е: ${overallRating}. ${ratingReasoning}`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 276 }
      }),

      // Section 8: Conclusion
      new Paragraph({
        children: [
          new TextRun({ text: 'Член 8', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Заклучок', bold: true })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `Овој извештај дава целосна слика на маркетинг активностите на ${companyName} за периодот ${dateFrom} - ${dateTo}. Податоците и анализите содржани во овој документ треба да послужат како основа за донесување одлуки за идни маркетинг стратегии, буџетска алокација и оптимизација на маркетинг каналите. Континуираното следење и евалуација на маркетинг перформансот е клучно за постигнување на деловните цели.`
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 276 }
      }),

      // Signature section
      new Paragraph({
        children: [
          new TextRun({ text: `Датум на извештај: ${currentDate}` })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 400 }
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
          new TextRun({ text: company?.manager || '[Управител]' })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 }
      })
    ]
  }];

  const doc = new Document({ sections });
  return { doc };
}

// Helper functions
function formatAmount(value) {
  if (!value) return '0';
  const numericValue = String(value).replace(/\D/g, '');
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseAmount(value) {
  if (!value) return 0;
  return parseInt(String(value).replace(/\D/g, ''), 10);
}

function calculateBudgetEvaluation(planned, actual) {
  if (!planned || !actual) return 'Буџетот беше искористен согласно планот.';

  const percentage = (actual / planned) * 100;

  if (percentage < 90) {
    return 'Буџетот беше искористен под планираното ниво, што може да укажува на недоволна маркетинг активност или поефикасно користење на ресурсите.';
  } else if (percentage > 110) {
    return 'Буџетот беше надминат над планираното ниво, што бара анализа на причините за зголемените трошоци.';
  } else {
    return 'Буџетот беше искористен во рамките на планираното, што покажува добра финансиска контрола.';
  }
}

function calculateEfficiency(spent, leads, sales) {
  if (!spent || !leads) {
    return 'Ефикасноста на маркетинг активностите бара понатамошна анализа со повеќе податоци.';
  }

  const costPerLead = spent / leads;
  const conversionRate = sales && leads ? (sales / leads * 100).toFixed(2) : 0;

  let evaluation = '';

  if (costPerLead < 500) {
    evaluation += 'Цената по lead е ниска, што укажува на висока ефикасност. ';
  } else if (costPerLead < 1500) {
    evaluation += 'Цената по lead е во прифатливи рамки за индустријата. ';
  } else {
    evaluation += 'Цената по lead е висока, што бара оптимизација на каналите и стратегијата. ';
  }

  if (conversionRate > 0) {
    if (conversionRate > 5) {
      evaluation += `Стапката на конверзија од ${conversionRate}% е одлична.`;
    } else if (conversionRate > 2) {
      evaluation += `Стапката на конверзија од ${conversionRate}% е задоволителна.`;
    } else {
      evaluation += `Стапката на конверзија од ${conversionRate}% е ниска и бара подобрување.`;
    }
  }

  return evaluation;
}

function evaluateGoalAchievement(achievement, goal) {
  const evaluations = {
    'Неостварена': `Главната цел ${goal} не беше остварена во овој период. Потребна е ревизија на стратегијата и тактиките за подобрување на резултатите.`,
    'Делумно остварена': `Главната цел ${goal} беше делумно остварена. Постигнат е напредок, но има простор за подобрување и оптимизација.`,
    'Целосно остварена': `Главната цел ${goal} беше целосно остварена. Резултатите покажуваат успешна имплементација на маркетинг стратегијата.`
  };

  return evaluations[achievement] || 'Остварувањето на целта бара понатамошна евалуација.';
}

function getRatingReasoning(rating) {
  const reasonings = {
    'Слаба': 'Оваа оценка укажува на потреба од значителни подобрувања во маркетинг активностите, стратегијата и извршувањето.',
    'Задоволителна': 'Оваа оценка покажува дека маркетинг активностите се на прифатливо ниво, но постои простор за оптимизација и подобри резултати.',
    'Добра': 'Оваа оценка одразува солидни маркетинг перформанси со позитивни резултати и добра искористеност на ресурсите.',
    'Одлична': 'Оваа оценка одразува извонредни маркетинг перформанси со високо ефикасни кампањи и остварување на целите.'
  };

  return reasonings[rating] || 'Оценката одразува целокупната слика на маркетинг активностите.';
}

module.exports = generateMarketingPerformanceReportDoc;
