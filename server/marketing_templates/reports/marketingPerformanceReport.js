const { Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const moment = require('moment');

/**
 * Marketing Performance Report Generator
 * Generates a comprehensive marketing performance report with automated calculations
 * and extensive narrative content
 */
function generateMarketingPerformanceReport(formData, user, company) {
  // ============================================
  // DATA EXTRACTION
  // ============================================
  const companyName = formData.companyName || company?.companyName || '[Име на компанија]';
  const reportPeriodType = formData.reportPeriodType || 'Месечен';
  const industry = formData.industry || '[Индустрија]';
  const companySize = formData.companySize || '[Големина]';
  const marketingTeamSize = formData.marketingTeamSize || '0';

  // Auto-generate dates
  let dateFrom, dateTo, periodName;
  const today = moment();

  if (reportPeriodType === 'Квартален') {
    const currentQuarter = today.quarter();
    const currentYear = today.year();
    let prevQuarter, prevYear;
    if (currentQuarter === 1) {
      prevQuarter = 4;
      prevYear = currentYear - 1;
    } else {
      prevQuarter = currentQuarter - 1;
      prevYear = currentYear;
    }
    const quarterStartMonth = (prevQuarter - 1) * 3;
    dateFrom = moment().year(prevYear).month(quarterStartMonth).startOf('month').format('DD.MM.YYYY');
    dateTo = moment().year(prevYear).month(quarterStartMonth + 2).endOf('month').format('DD.MM.YYYY');
    periodName = `Q${prevQuarter} ${prevYear}`;
  } else {
    dateFrom = moment().subtract(1, 'month').startOf('month').format('DD.MM.YYYY');
    dateTo = moment().subtract(1, 'month').endOf('month').format('DD.MM.YYYY');
    periodName = moment().subtract(1, 'month').format('MMMM YYYY');
  }

  // Budget data
  const totalBudget = parseFloat(formData.totalBudget) || 0;
  const actualSpent = parseFloat(formData.actualSpent) || 0;
  const executionType = formData.executionType || '[Тип]';
  const budgetSatisfaction = formData.budgetAllocationSatisfaction || '';
  const primaryChannel = formData.primaryChannel || '';

  // Marketing channels
  const marketingChannels = formData.marketingChannels || [];
  const channelCount = marketingChannels.length;

  // Performance data
  const totalLeads = parseInt(formData.totalLeads) || 0;
  const leadQuality = formData.leadQuality || '';
  const totalSales = parseInt(formData.totalSales) || 0;
  const estimatedRevenue = parseFloat(formData.estimatedRevenue) || 0;
  const websiteTrafficChange = formData.websiteTrafficChange || '';
  const socialMediaEngagement = formData.socialMediaEngagement || '';
  const emailPerformance = formData.emailPerformance || '';
  const brandAwarenessImpact = formData.brandAwarenessImpact || '';

  // Goals data
  const mainGoal = formData.mainGoal || '[Цел]';
  const secondaryGoal = formData.secondaryGoal || '';
  const goalAchievement = formData.goalAchievement || '[Остварување]';
  const challenges = formData.challenges || [];
  const overallRating = formData.overallRating || '3';
  const nextPeriodFocus = formData.nextPeriodFocus || '';
  const recommendedActions = formData.recommendedActions || [];

  // ============================================
  // AUTOMATED CALCULATIONS
  // ============================================

  // Budget calculations
  const budgetUtilization = totalBudget > 0 ? ((actualSpent / totalBudget) * 100).toFixed(1) : 0;
  const budgetVariance = totalBudget - actualSpent;
  const budgetVariancePercent = totalBudget > 0 ? (((totalBudget - actualSpent) / totalBudget) * 100).toFixed(1) : 0;

  // Performance calculations
  const costPerLead = totalLeads > 0 ? (actualSpent / totalLeads).toFixed(0) : 0;
  const costPerSale = totalSales > 0 ? (actualSpent / totalSales).toFixed(0) : 0;
  const conversionRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : 0;
  const roi = actualSpent > 0 && estimatedRevenue > 0 ? (((estimatedRevenue - actualSpent) / actualSpent) * 100).toFixed(1) : null;
  const revenuePerLead = totalLeads > 0 && estimatedRevenue > 0 ? (estimatedRevenue / totalLeads).toFixed(0) : 0;

  // Efficiency score (1-10 based on multiple factors)
  let efficiencyScore = 5;
  if (parseFloat(conversionRate) > 20) efficiencyScore += 2;
  else if (parseFloat(conversionRate) > 10) efficiencyScore += 1;
  else if (parseFloat(conversionRate) < 5) efficiencyScore -= 1;

  if (roi && parseFloat(roi) > 200) efficiencyScore += 2;
  else if (roi && parseFloat(roi) > 100) efficiencyScore += 1;
  else if (roi && parseFloat(roi) < 0) efficiencyScore -= 2;

  if (goalAchievement === 'Надмината' || goalAchievement === 'Целосно остварена') efficiencyScore += 1;
  else if (goalAchievement === 'Неостварена') efficiencyScore -= 2;

  efficiencyScore = Math.max(1, Math.min(10, efficiencyScore));

  // Efficiency score description
  let efficiencyDescription;
  if (efficiencyScore >= 8) {
    efficiencyDescription = 'извонредно ефикасни';
  } else if (efficiencyScore >= 6) {
    efficiencyDescription = 'ефикасни';
  } else if (efficiencyScore >= 4) {
    efficiencyDescription = 'умерено ефикасни';
  } else {
    efficiencyDescription = 'под очекувањата во однос на ефикасност';
  }

  // Budget status interpretation
  let budgetStatus, budgetInterpretation, budgetAnalysis;
  if (parseFloat(budgetUtilization) < 70) {
    budgetStatus = 'значително под планираното';
    budgetInterpretation = 'Ниската искористеност на буџетот може да укажува на неколку фактори: потешкотии во извршувањето на планираните активности, преамбициозно буџетирање, или пропуштени можности за маркетинг активности.';
    budgetAnalysis = 'Препорачуваме детална анализа на причините за ниската искористеност и преалоцирање на преостанатите средства во понатамошни кампањи или тестирање на нови канали.';
  } else if (parseFloat(budgetUtilization) < 80) {
    budgetStatus = 'под планираното';
    budgetInterpretation = 'Постои можност за поагресивни маркетинг активности со преостанатите средства.';
    budgetAnalysis = 'Овој буџетски резултат укажува на конзервативен пристап кон трошењето, што може да биде позитивно од аспект на финансиска дисциплина, но истовремено може да значи пропуштени можности за раст.';
  } else if (parseFloat(budgetUtilization) > 110) {
    budgetStatus = 'над планираното';
    budgetInterpretation = 'Прекорачувањето на буџетот може да биде индикатор за непланирани можности кои биле искористени, но исто така може да укажува на недоволно прецизно планирање.';
    budgetAnalysis = 'Препорачуваме преглед на буџетската дисциплина и идентификување на причините за прекорачувањето. Важно е да се разбере дали дополнителните трошоци генерирале пропорционален поврат.';
  } else if (parseFloat(budgetUtilization) > 100) {
    budgetStatus = 'малку над планираното';
    budgetInterpretation = 'Минималното прекорачување на буџетот е прифатливо доколку резултатите го оправдуваат.';
    budgetAnalysis = 'Ова ниво на искористеност укажува на активно извршување на маркетинг плановите со мала флексибилност за искористување на дополнителни можности.';
  } else {
    budgetStatus = 'во рамки на планираното';
    budgetInterpretation = 'Буџетот е искористен ефикасно, што укажува на добро планирање и контрола на трошоците.';
    budgetAnalysis = 'Оваа искористеност демонстрира добра финансиска дисциплина и способност за точно прогнозирање на потребите. Ова е позитивен индикатор за зрелоста на маркетинг операциите.';
  }

  // Channel strategy interpretation
  let channelStrategy, channelAnalysis, channelRiskAssessment;
  if (channelCount === 0) {
    channelStrategy = 'не е дефинирана';
    channelAnalysis = 'Без јасно дефинирани маркетинг канали, тешко е да се мерат и оптимизираат маркетинг активностите. Препорачуваме итно дефинирање на канална стратегија базирана на целната публика и деловните цели.';
    channelRiskAssessment = 'Отсуството на дефинирана канална стратегија претставува значаен ризик за ефективноста на маркетинг инвестициите.';
  } else if (channelCount === 1) {
    channelStrategy = 'едноканална';
    channelAnalysis = `Фокусирањето на еден канал (${marketingChannels[0] || primaryChannel}) овозможува длабока експертиза и оптимизација, но носи ризик од зависност од еден извор на leads и клиенти.`;
    channelRiskAssessment = 'Едноканалниот пристап може да биде ефективен за компании со ограничени ресурси, но препорачуваме постепена диверзификација за намалување на ризикот од промени во ефективноста на каналот.';
  } else if (channelCount <= 3) {
    channelStrategy = 'фокусирана повеќеканална';
    channelAnalysis = `Со ${channelCount} активни канали (${marketingChannels.join(', ')}), компанијата има добар баланс помеѓу фокус и диверзификација. Овој пристап овозможува доволна експертиза на секој канал додека се намалува зависноста од еден извор.`;
    channelRiskAssessment = 'Оваа стратегија претставува здрав баланс помеѓу ризик и можности, овозможувајќи компарација на перформансите помеѓу каналите и информирана оптимизација.';
  } else {
    channelStrategy = 'широка повеќеканална';
    channelAnalysis = `Со ${channelCount} активни канали, компанијата има широк маркетинг присуство. Ова овозможува достапување до различни сегменти на публиката преку различни допирни точки.`;
    channelRiskAssessment = 'Широката повеќеканална стратегија бара внимателно следење на ROI по канал. Постои ризик од распределување на ресурсите претенко, што може да резултира со субоптимални резултати на повеќе канали наместо одлични резултати на неколку клучни канали.';
  }

  // Conversion analysis
  let conversionAnalysis, conversionContext, conversionActionPlan;
  if (parseFloat(conversionRate) >= 25) {
    conversionAnalysis = 'Стапката на конверзија е извонредна и значително над индустрискиот просек.';
    conversionContext = 'Оваа висока стапка на конверзија укажува на одличен квалитет на генерираните leads и/или исклучително ефективен продажен процес. Компанијата успешно привлекува квалификувани потенцијални клиенти кои се подготвени за купување.';
    conversionActionPlan = 'Препорачуваме анализа на факторите кои придонесуваат за оваа висока стапка со цел нивно задржување и репликација. Размислете за зголемување на волуменот на leads со задржување на квалитетот.';
  } else if (parseFloat(conversionRate) >= 15) {
    conversionAnalysis = 'Стапката на конверзија е многу добра и над просекот за повеќето индустрии.';
    conversionContext = 'Овој резултат демонстрира ефективна маркетинг стратегија која привлекува релевантна публика и добра координација помеѓу маркетинг и продажба.';
    conversionActionPlan = 'За понатамошно подобрување, препорачуваме имплементација на lead scoring систем и A/B тестирање на продажните материјали.';
  } else if (parseFloat(conversionRate) >= 10) {
    conversionAnalysis = 'Стапката на конверзија е добра и во рамките на очекувањата за повеќето B2B индустрии.';
    conversionContext = 'Овој резултат укажува на солидна маркетинг функција, но постои простор за оптимизација на процесот на квалификација на leads и продажниот процес.';
    conversionActionPlan = 'Препорачуваме имплементација на lead nurturing програма и подобрување на квалификационите критериуми за leads.';
  } else if (parseFloat(conversionRate) >= 5) {
    conversionAnalysis = 'Стапката на конверзија е просечна со значителен простор за подобрување.';
    conversionContext = 'Овој резултат може да укажува на несовпаѓање помеѓу маркетинг пораките и продажниот процес, или на привлекување на публика која не е целосно квалификувана.';
    conversionActionPlan = 'Итно препорачуваме ревизија на целната публика, подобрување на процесот на квалификација на leads, и зајакнување на соработката помеѓу маркетинг и продажба.';
  } else {
    conversionAnalysis = 'Стапката на конверзија е под очекувањата и бара итна интервенција.';
    conversionContext = 'Ниската стапка на конверзија укажува на фундаментални проблеми во маркетинг-продажна координација, квалитетот на leads, или продажниот процес.';
    conversionActionPlan = 'Препорачуваме итна ревизија на целокупниот маркетинг и продажен процес, вклучувајќи анализа на причините за губење на leads, ревизија на целната публика, и евалуација на продажните техники.';
  }

  // ROI interpretation
  let roiAnalysis = '', roiContext = '', roiImplication = '';
  if (roi) {
    if (parseFloat(roi) > 300) {
      roiAnalysis = 'Повратот на инвестиција е исклучителен и далеку над индустриските стандарди.';
      roiContext = 'Овој резултат укажува на извонредно ефективна маркетинг стратегија или можно потценување на вистинскиот потенцијал на маркетинг буџетот.';
      roiImplication = 'Со ваков ROI, компанијата треба сериозно да размисли за зголемување на маркетинг инвестициите бидејќи дополнителното вложување би можело да генерира значителен дополнителен приход.';
    } else if (parseFloat(roi) > 200) {
      roiAnalysis = 'Повратот на инвестиција е извонреден, со секој вложен денар генерирајќи повеќе од три денари приход.';
      roiContext = 'Овој резултат демонстрира високо ефективна маркетинг стратегија и добро таргетирање на публиката.';
      roiImplication = 'Препорачуваме одржување на тековната стратегија и евалуација на можностите за скалирање на најуспешните кампањи.';
    } else if (parseFloat(roi) > 100) {
      roiAnalysis = 'Повратот на инвестиција е одличен, со секој вложен денар генерирајќи повеќе од два денара приход.';
      roiContext = 'Оваа стапка на ROI е над просечната за повеќето индустрии и укажува на ефективно користење на маркетинг буџетот.';
      roiImplication = 'Маркетинг активностите јасно придонесуваат за деловниот раст и инвестицијата е оправдана.';
    } else if (parseFloat(roi) > 50) {
      roiAnalysis = 'Повратот на инвестиција е позитивен и задоволителен.';
      roiContext = 'Маркетинг активностите генерираат позитивен поврат, иако постои простор за оптимизација.';
      roiImplication = 'Препорачуваме фокус на оптимизација на најуспешните канали и кампањи за подобрување на вкупниот ROI.';
    } else if (parseFloat(roi) > 0) {
      roiAnalysis = 'Повратот на инвестиција е позитивен, но под оптималното ниво.';
      roiContext = 'Иако маркетингот не губи пари, ниската маргина на поврат укажува на потреба од оптимизација.';
      roiImplication = 'Потребна е детална анализа на трошоците по канал и кампања за идентификување на областите каде што може да се подобри ефективноста.';
    } else {
      roiAnalysis = 'Повратот на инвестиција е негативен, што значи дека маркетинг активностите тековно губат пари.';
      roiContext = 'Ова е критична состојба која бара итна интервенција. Негативниот ROI може да биде привремен (во случај на brand building активности), но мора внимателно да се следи.';
      roiImplication = 'Препорачуваме итна ревизија на маркетинг стратегијата, суспендирање на неефективните кампањи, и преалокација на буџетот кон докажано ефективни активности.';
    }
  }

  // Digital performance analysis
  let webTrafficAnalysis = '', socialAnalysis = '', emailAnalysis = '', brandAnalysis = '';

  if (websiteTrafficChange) {
    if (websiteTrafficChange.includes('+50%') || websiteTrafficChange.includes('+25-50%')) {
      webTrafficAnalysis = `Веб сообраќајот бележи значително зголемување (${websiteTrafficChange}), што укажува на ефективна дигитална маркетинг стратегија. Ова зголемување создава поголем базен на потенцијални клиенти и подобрува можностите за конверзија.`;
    } else if (websiteTrafficChange.includes('+10-25%') || websiteTrafficChange.includes('+1-10%')) {
      webTrafficAnalysis = `Веб сообраќајот бележи умерено зголемување (${websiteTrafficChange}). Иако трендот е позитивен, постои простор за поагресивни активности за привлекување на сообраќај, вклучувајќи SEO оптимизација и content маркетинг.`;
    } else if (websiteTrafficChange === 'Без промена') {
      webTrafficAnalysis = 'Веб сообраќајот останува стагнантен, што може да укажува на заситеност на постоечките канали или недоволна инвестиција во активности за привлекување на нов сообраќај.';
    } else {
      webTrafficAnalysis = `Веб сообраќајот бележи намалување (${websiteTrafficChange}), што е загрижувачки тренд. Потребна е итна анализа на причините и превземање на корективни мерки за подобрување на онлајн видливоста.`;
    }
  }

  if (socialMediaEngagement) {
    if (socialMediaEngagement === 'Високо') {
      socialAnalysis = 'Ангажираноста на социјалните мрежи е на високо ниво, што укажува на релевантна содржина и активна заедница. Оваа ангажираност е вредна не само за директни конверзии, туку и за градење на бренд свесност и лојалност.';
    } else if (socialMediaEngagement === 'Средно') {
      socialAnalysis = 'Ангажираноста на социјалните мрежи е на средно ниво. Постои простор за подобрување преку поангажирачка содржина, интерактивни формати (анкети, прашања, live сесии), и поконзистентно објавување.';
    } else if (socialMediaEngagement === 'Ниско') {
      socialAnalysis = 'Ангажираноста на социјалните мрежи е ниска, што може да укажува на несоодветна содржина за целната публика или недоволна активност. Препорачуваме ревизија на content стратегијата и анализа на конкурентските практики.';
    }
  }

  if (emailPerformance && emailPerformance !== 'Не се користи') {
    if (emailPerformance === 'Над просек') {
      emailAnalysis = 'Email маркетингот покажува резултати над индустрискиот просек, што укажува на добро сегментирана листа, релевантна содржина и оптимални времиња на испраќање. Email останува еден од најефективните канали за директна комуникација.';
    } else if (emailPerformance === 'Просечно') {
      emailAnalysis = 'Email маркетингот постигнува просечни резултати. Постои потенцијал за подобрување преку персонализација, подобра сегментација, и A/B тестирање на subject lines и содржина.';
    } else if (emailPerformance === 'Под просек') {
      emailAnalysis = 'Email маркетингот е под просечните стандарди. Препорачуваме ревизија на листата (чистење на неактивни контакти), подобрување на содржината, и евалуација на техничките аспекти (deliverability, mobile optimization).';
    }
  }

  if (brandAwarenessImpact && brandAwarenessImpact !== 'Не се мери') {
    if (brandAwarenessImpact === 'Значително зголемување') {
      brandAnalysis = 'Маркетинг активностите значително ја зголемиле свесноста за брендот. Ова е стратешки важен резултат кој може да не се рефлектира веднаш во продажби, но гради основа за долгорочен раст и лојалност на клиентите.';
    } else if (brandAwarenessImpact === 'Умерено зголемување') {
      brandAnalysis = 'Забележано е умерено зголемување на свесноста за брендот. Препорачуваме продолжување на brand building активностите со фокус на конзистентност на пораките и визуелниот идентитет.';
    } else if (brandAwarenessImpact === 'Минимално влијание') {
      brandAnalysis = 'Влијанието врз бренд свесноста е минимално. Ова може да укажува на потреба од поголема инвестиција во awareness кампањи или преоценување на креативниот пристап.';
    }
  }

  // Goal achievement analysis
  let goalAnalysis, goalContext, goalImplication;
  switch (goalAchievement) {
    case 'Надмината':
      goalAnalysis = 'Примарната маркетинг цел е надмината, што претставува исклучителен резултат.';
      goalContext = 'Надминувањето на поставените цели укажува на или конзервативно поставени цели или извонредна изведба. Важно е да се анализира кои фактори придонеле за овој успех за да се реплицираат во иднина.';
      goalImplication = 'Овој резултат треба да послужи како основа за поставување на поамбициозни цели во следниот период, земајќи ги предвид научените лекции.';
      break;
    case 'Целосно остварена':
      goalAnalysis = 'Примарната маркетинг цел е целосно остварена, демонстрирајќи добро планирање и извршување.';
      goalContext = 'Целосното остварување на целите укажува на зрела маркетинг функција со добра способност за прогнозирање и извршување. Тимот успешно ги претворил плановите во резултати.';
      goalImplication = 'Препорачуваме документирање на успешните практики и размислување за постепено зголемување на целите во следниот период.';
      break;
    case 'Делумно остварена':
      goalAnalysis = 'Примарната маркетинг цел е делумно остварена, што укажува на позитивен напредок со простор за подобрување.';
      goalContext = 'Делумното остварување може да биде резултат на нереалистични цели, неочекувани пазарни услови, или недостатоци во извршувањето. Важно е да се идентификуваат специфичните причини за неполното остварување.';
      goalImplication = 'Препорачуваме детална анализа на факторите кои придонеле за јазот помеѓу целите и резултатите, и адаптација на стратегијата или целите за следниот период.';
      break;
    case 'Минимално остварена':
      goalAnalysis = 'Примарната маркетинг цел е минимално остварена, што укажува на значителни предизвици во извршувањето или поставувањето на целите.';
      goalContext = 'Минималното остварување бара сериозна ревизија на маркетинг пристапот. Потребно е да се разбере дали проблемот е во стратегијата, тактиките, ресурсите, или надворешните фактори.';
      goalImplication = 'Итно препорачуваме работилница за идентификување на коренските причини и развој на акциски план за подобрување во следниот период.';
      break;
    case 'Неостварена':
      goalAnalysis = 'Примарната маркетинг цел не е остварена, што претставува критична состојба која бара итна интервенција.';
      goalContext = 'Неостварувањето на целите може да има повеќе причини: нереалистични очекувања, недоволни ресурси, неефективна стратегија, или значителни надворешни пречки. Важно е да се избегне обвинување и да се фокусираме на учење.';
      goalImplication = 'Препорачуваме итен преглед на маркетинг стратегијата со вклучување на релевантните стејкхолдери. Можеби е потребна фундаментална промена на пристапот.';
      break;
    default:
      goalAnalysis = 'Не е можно да се оцени остварувањето на целта поради недостаток на информации.';
      goalContext = '';
      goalImplication = '';
  }

  // Overall rating analysis
  const ratingLabels = { '5': 'Одлично', '4': 'Многу добро', '3': 'Добро', '2': 'Задоволително', '1': 'Незадоволително' };
  const ratingLabel = ratingLabels[overallRating] || 'Добро';

  let ratingAnalysis, ratingContext, ratingOutlook;
  switch (overallRating) {
    case '5':
      ratingAnalysis = 'Маркетинг активностите во анализираниот период заслужуваат оценка одлично, што претставува највисока можна оценка.';
      ratingContext = 'Оваа оценка рефлектира извонредни резултати на повеќе фронтови: ефективно користење на буџетот, успешно постигнување на целите, и позитивно влијание врз клучните метрики. Тимот демонстрирал висока компетентност и посветеност.';
      ratingOutlook = 'Предизвикот за следниот период е одржување на ова ниво на перформанс и идентификување на можности за понатамошен раст без компромитирање на квалитетот.';
      break;
    case '4':
      ratingAnalysis = 'Маркетинг активностите се оценуваат како многу добри, што укажува на солидни резултати со мал простор за подобрување.';
      ratingContext = 'Оваа оценка рефлектира успешно извршување на повеќето маркетинг иницијативи со одредени области каде што може да се постигне дополнително подобрување. Генералниот тренд е позитивен.';
      ratingOutlook = 'Фокусот за следниот период треба да биде на идентификување и адресирање на специфичните области за подобрување за достигнување на врвна оценка.';
      break;
    case '3':
      ratingAnalysis = 'Маркетинг активностите се оценуваат како добри, што укажува на задоволителни резултати со значителен простор за подобрување.';
      ratingContext = 'Оваа средна оценка сугерира дека основните маркетинг функции работат, но не на оптимално ниво. Постојат области каде што резултатите се под очекувањата.';
      ratingOutlook = 'За следниот период, препорачуваме фокус на две до три специфични области за подобрување наместо обид за подобрување на сè истовремено.';
      break;
    case '2':
      ratingAnalysis = 'Маркетинг активностите се оценуваат како задоволителни, што укажува на резултати под очекувањата.';
      ratingContext = 'Оваа оценка сигнализира потреба од сериозна ревизија на маркетинг пристапот. Повеќето метрики веројатно се под целите, а ефективноста на инвестициите е под оптималното ниво.';
      ratingOutlook = 'Итно е потребна детална анализа на причините за слабите резултати и развој на конкретен акциски план за подобрување.';
      break;
    case '1':
      ratingAnalysis = 'Маркетинг активностите се оценуваат како незадоволителни, што претставува критична состојба.';
      ratingContext = 'Оваа најниска оценка укажува на фундаментални проблеми во маркетинг функцијата. Резултатите се значително под очекувањата на повеќе фронтови.';
      ratingOutlook = 'Препорачуваме итна интервенција вклучувајќи можеби надворешна консултација, ревизија на стратегијата, и преоценување на ресурсите и компетенциите.';
      break;
  }

  // Challenges analysis
  let challengesAnalysis = '';
  if (challenges.length > 0 && !challenges.includes('Нема значајни предизвици')) {
    const challengeCount = challenges.length;
    challengesAnalysis = `Во анализираниот период се идентификувани ${challengeCount} значајни предизвици кои влијаеле на маркетинг активностите. `;

    if (challenges.includes('Ограничен буџет')) {
      challengesAnalysis += 'Буџетските ограничувања претставувале значаен предизвик, лимитирајќи ја можноста за тестирање на нови канали и скалирање на успешните кампањи. ';
    }
    if (challenges.includes('Недостаток на ресурси')) {
      challengesAnalysis += 'Недостатокот на човечки ресурси влијаел на способноста за извршување на сите планирани активности со потребниот квалитет. ';
    }
    if (challenges.includes('Силна конкуренција')) {
      challengesAnalysis += 'Зголемената конкуренција на пазарот ги зголемила трошоците за аквизиција и го отежнала диференцирањето. ';
    }
    if (challenges.includes('Технички проблеми')) {
      challengesAnalysis += 'Техничките проблеми предизвикале прекини или намалена ефективност на одредени кампањи. ';
    }
    if (challenges.includes('Промени во алгоритми')) {
      challengesAnalysis += 'Промените во алгоритмите на платформите влијаеле на органскиот reach и ефективноста на платените кампањи. ';
    }
    challengesAnalysis += 'Овие предизвици треба да бидат адресирани во планирањето за следниот период.';
  } else {
    challengesAnalysis = 'Во анализираниот период не се идентификувани значајни предизвици кои би влијаеле негативно на маркетинг активностите. Ова укажува на добра подготовка, реалистично планирање, и ефективно менаџирање на потенцијалните пречки. Сепак, препорачуваме континуирано следење на потенцијалните ризици и предизвици.';
  }

  // Generate automated recommendations based on data
  const autoRecommendations = [];

  if (parseFloat(conversionRate) < 10) {
    autoRecommendations.push('Имплементирајте lead scoring систем за подобар квалитет на leads и поефективна алокација на продажните ресурси.');
  }
  if (parseFloat(budgetUtilization) < 70) {
    autoRecommendations.push('Искористете го преостанатиот буџет за тестирање на нови канали, формати, или зголемување на фреквенцијата на докажано успешните кампањи.');
  }
  if (channelCount < 3 && totalBudget > 50000) {
    autoRecommendations.push('Со вашиот буџет, диверзификацијата на маркетинг каналите може да донесе подобри резултати и да го намали ризикот од зависност од еден канал.');
  }
  if (socialMediaEngagement === 'Ниско' || socialMediaEngagement === 'Средно') {
    autoRecommendations.push('Инвестирајте во креирање на поангажирачка содржина за социјалните мрежи, вклучувајќи видео содржина, интерактивни постови, и user-generated content.');
  }
  if (websiteTrafficChange && (websiteTrafficChange.includes('-') || websiteTrafficChange === 'Без промена')) {
    autoRecommendations.push('Зајакнете ја SEO стратегијата и инвестирајте во content маркетинг за органско зголемување на веб сообраќајот.');
  }
  if (goalAchievement === 'Неостварена' || goalAchievement === 'Минимално остварена') {
    autoRecommendations.push('Ревидирајте ги процесите за поставување цели и обезбедете дека целите се SMART (Specific, Measurable, Achievable, Relevant, Time-bound).');
  }
  if (roi && parseFloat(roi) < 50) {
    autoRecommendations.push('Спроведете детална ROI анализа по канал и кампања за идентификување и елиминирање на неефективните активности.');
  }
  if (leadQuality === 'Низок' || leadQuality === 'Мешан') {
    autoRecommendations.push('Подобрете ги критериумите за квалификација на leads и размислете за имплементација на lead nurturing програма.');
  }

  // Generation metadata
  const generationDate = moment().format('DD.MM.YYYY');
  const generationTime = moment().format('HH:mm');

  // ============================================
  // DOCUMENT GENERATION
  // ============================================

  const children = [
    // Title
    new Paragraph({
      children: [new TextRun({ text: 'МАРКЕТИНГ ПЕРФОРМАНС ИЗВЕШТАЈ', bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `${reportPeriodType} извештај за периодот ${dateFrom} - ${dateTo}`, size: 24, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),

    // ========== EXECUTIVE SUMMARY ==========
    new Paragraph({
      children: [new TextRun({ text: '1. ИЗВРШНО РЕЗИМЕ', bold: true, size: 28 })],
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Овој извештај претставува сеопфатна анализа на маркетинг активностите на ${companyName} за периодот од ${dateFrom} до ${dateTo}. Компанијата оперира во секторот ${industry} и спаѓа во категоријата ${companySize} вработени. Маркетинг функцијата е поддржана од ${marketingTeamSize === '0' ? 'надворешни соработници без посветен интерен тим' : 'тим од ' + marketingTeamSize + ' лица'}, при што извршувањето на активностите е ${executionType.toLowerCase()}.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Во анализираниот период, од вкупно планираниот буџет од ${totalBudget.toLocaleString('mk-MK')} МКД, реално се потрошени ${actualSpent.toLocaleString('mk-MK')} МКД, што претставува ${budgetUtilization}% искористеност. Буџетот е ${budgetStatus}. Маркетинг активностите резултирале со генерирање на ${totalLeads} потенцијални клиенти (leads), од кои ${totalSales} се конвертирале во реални продажби, давајќи стапка на конверзија од ${conversionRate}%.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  ];

  // Add ROI summary if available
  if (roi) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Проценетиот приход од маркетинг активностите изнесува ${estimatedRevenue.toLocaleString('mk-MK')} МКД, што резултира со поврат на инвестиција (ROI) од ${roi}%. ${parseFloat(roi) >= 0 ? 'Маркетинг инвестицијата генерира позитивен поврат.' : 'Тековно, маркетинг инвестицијата не генерира позитивен поврат, што бара итна интервенција.'}`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({
      text: `Примарната маркетинг цел за овој период беше ${mainGoal.toLowerCase()}, која е ${goalAchievement.toLowerCase()}. Вкупната оценка на маркетинг перформансите е ${ratingLabel.toLowerCase()} (${overallRating}/5), со скор на ефикасност од ${efficiencyScore}/10. Ова укажува дека маркетинг активностите во овој период беа ${efficiencyDescription}.`
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 300 }
  }));

  // ========== COMPANY PROFILE ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '2. ПРОФИЛ НА КОМПАНИЈА', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `${companyName} е компанија која оперира во секторот ${industry}. Според бројот на вработени, компанијата спаѓа во категоријата ${companySize}, што има импликации за маркетинг стратегијата и достапните ресурси.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: marketingTeamSize === '0'
          ? 'Компанијата тековно нема посветен интерен маркетинг тим. Маркетинг активностите се извршуваат преку надворешни соработници, агенции, или како дополнителна одговорност на други позиции. Овој модел има свои предности во однос на флексибилност и пристап до различни експертизи, но може да претставува предизвик за конзистентност и брзина на реакција.'
          : `Маркетинг функцијата е поддржана од интерен тим составен од ${marketingTeamSize} лица. Ова овозможува директна контрола над маркетинг активностите, побрза комуникација, и подлабоко разбирање на компанијата и производите.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Извршувањето на маркетинг активностите е организирано како ${executionType.toLowerCase()}. ${
          executionType === 'Целосно интерно' ? 'Интерното извршување обезбедува целосна контрола и конзистентност, но може да биде ограничено од интерните компетенции.' :
          executionType === 'Целосно екстерно' ? 'Екстерното извршување овозможува пристап до специјализирана експертиза и скалабилност, но бара внимателен менаџмент на односите со добавувачите.' :
          'Комбинираниот пристап овозможува баланс помеѓу интерната контрола и надворешната експертиза, што е оптимално за повеќето средни компании.'
        }`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    })
  );

  // ========== BUDGET ANALYSIS ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '3. БУЏЕТСКА АНАЛИЗА', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '3.1 Преглед на буџетска искористеност', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `За анализираниот период, планираниот маркетинг буџет изнесуваше ${totalBudget.toLocaleString('mk-MK')} МКД. Од овој износ, реално се потрошени ${actualSpent.toLocaleString('mk-MK')} МКД, што претставува искористеност од ${budgetUtilization}%. Варијансата помеѓу планираното и реалното трошење изнесува ${budgetVariance >= 0 ? '+' : ''}${budgetVariance.toLocaleString('mk-MK')} МКД, односно ${budgetVariancePercent}% ${budgetVariance >= 0 ? 'под' : 'над'} буџетот.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '3.2 Интерпретација на буџетски резултати', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Буџетот е ${budgetStatus}. ${budgetInterpretation}`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: budgetAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (budgetSatisfaction) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Субјективната оценка за задоволството од распределбата на буџетот помеѓу различните канали и активности е: ${budgetSatisfaction.toLowerCase()}. Оваа оценка треба да се земе предвид при планирањето на буџетската алокација за следниот период.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }));
  }

  // ========== MARKETING CHANNELS ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '4. МАРКЕТИНГ КАНАЛИ И СТРАТЕГИЈА', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '4.1 Преглед на каналната стратегија', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Компанијата применува ${channelStrategy} маркетинг стратегија со вкупно ${channelCount} активни канали. ${channelAnalysis}`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: channelRiskAssessment
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (marketingChannels.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '4.2 Активни маркетинг канали', bold: true, size: 24 })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: `Во анализираниот период, активно се користеле следните маркетинг канали: ${marketingChannels.join(', ')}. Секој од овие канали има свои специфични карактеристики, целна публика, и очекуван поврат на инвестиција.`
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }

  if (primaryChannel) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Примарниот маркетинг канал, односно каналот со најголема инвестиција, е ${primaryChannel}. Овој канал е избран како приоритет врз основа на претходните резултати, карактеристиките на целната публика, или стратешките цели на компанијата. Перформансите на овој канал имаат најголемо влијание врз вкупните маркетинг резултати.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }));
  }

  // ========== PERFORMANCE METRICS ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '5. АНАЛИЗА НА ПЕРФОРМАНСИ', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '5.1 Генерирање на потенцијални клиенти (Leads)', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Во анализираниот период, маркетинг активностите генерирале вкупно ${totalLeads} потенцијални клиенти (leads). Со вкупно потрошени ${actualSpent.toLocaleString('mk-MK')} МКД, просечната цена по lead (Cost Per Lead - CPL) изнесува ${costPerLead} МКД. Оваа метрика е клучна за оценување на ефективноста на маркетинг активностите во привлекување на потенцијални клиенти.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (leadQuality) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Квалитетот на генерираните leads е оценет како ${leadQuality.toLowerCase()}. ${
          leadQuality === 'Висок' ? 'Високиот квалитет на leads укажува на добро таргетирање и релевантни маркетинг пораки кои привлекуваат вистинската публика.' :
          leadQuality === 'Мешан' ? 'Мешаниот квалитет сугерира потреба од подобрување на критериумите за квалификација и можеби преоценување на таргетирањето.' :
          'Нискиот квалитет на leads е загрижувачки и бара итна ревизија на таргетирањето, пораките, и каналите.'
        }`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '5.2 Конверзија и продажби', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Од вкупно ${totalLeads} генерирани leads, ${totalSales} се конвертирале во реални продажби. Ова резултира со стапка на конверзија од ${conversionRate}%, додека просечната цена по аквизиција (Cost Per Acquisition - CPA) изнесува ${costPerSale} МКД.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: conversionAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: conversionContext
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: conversionActionPlan
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  // ROI Section
  if (roi) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '5.3 Поврат на инвестиција (ROI)', bold: true, size: 24 })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: `Проценетиот приход генериран од маркетинг активностите изнесува ${estimatedRevenue.toLocaleString('mk-MK')} МКД. Со вкупна инвестиција од ${actualSpent.toLocaleString('mk-MK')} МКД, повратот на инвестиција (ROI) изнесува ${roi}%. Дополнително, просечниот приход по генериран lead изнесува ${revenuePerLead} МКД.`
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: roiAnalysis
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: roiContext
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: roiImplication
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      }),
    );
  }

  // Digital Performance
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '5.4 Дигитални перформанси', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Дигиталното присуство и онлајн перформансите се клучни индикатори за современите маркетинг активности. Следува анализа на клучните дигитални метрики за анализираниот период.'
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (webTrafficAnalysis) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: webTrafficAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  if (socialAnalysis) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: socialAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  if (emailAnalysis) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: emailAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  if (brandAnalysis) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: brandAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({
      text: `Врз основа на сите анализирани фактори, вкупниот скор на маркетинг ефикасност изнесува ${efficiencyScore} од 10 можни поени. Овој скор го рефлектира комбинираното влијание на конверзијата, ROI, и остварувањето на целите.`
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 300 }
  }));

  // ========== GOALS ANALYSIS ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '6. АНАЛИЗА НА ЦЕЛИ', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '6.1 Поставени цели и остварување', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Примарната маркетинг цел за анализираниот период беше: ${mainGoal}. Оваа цел беше избрана како главен фокус на маркетинг активностите и претставува главен критериум за оценување на успешноста.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (secondaryGoal) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Покрај примарната цел, како секундарна цел беше поставена: ${secondaryGoal}. Секундарната цел служи како дополнителен фокус и помага во холистичка оценка на маркетинг перформансите.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }));
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '6.2 Оценка на остварувањето', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Степенот на остварување на примарната цел е оценет како: ${goalAchievement}.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: goalAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: goalContext
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: goalImplication
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }),
  );

  // ========== CHALLENGES ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '7. ИДЕНТИФИКУВАНИ ПРЕДИЗВИЦИ', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: challengesAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (challenges.length > 0 && !challenges.includes('Нема значајни предизвици')) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Листа на идентификувани предизвици:', bold: true })],
        spacing: { after: 100 }
      })
    );
    challenges.forEach((challenge, index) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}. ${challenge}` })],
        spacing: { after: 50 }
      }));
    });
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'Адресирањето на овие предизвици треба да биде приоритет во планирањето за следниот период. За секој предизвик, препорачуваме развој на конкретен акциски план со одговорни лица и временска рамка.'
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 150, after: 300 }
    }));
  }

  // ========== OVERALL ASSESSMENT ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '8. ОПШТА ОЦЕНКА', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Вкупна оценка: ${overallRating}/5 - ${ratingLabel}`, bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 250 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: ratingAnalysis
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: ratingContext
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: ratingOutlook
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 }
    }),
  );

  // ========== RECOMMENDATIONS ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '9. ПРЕПОРАКИ ЗА СЛЕДНИОТ ПЕРИОД', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '9.1 Стратешки приоритет', bold: true, size: 24 })],
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Примарниот фокус за следниот период треба да биде: ${nextPeriodFocus}. Овој приоритет е определен врз основа на анализата на тековните резултати, идентификуваните предизвици, и стратешките цели на компанијата.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
  );

  if (recommendedActions.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '9.2 Избрани акции за имплементација', bold: true, size: 24 })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'Врз основа на анализата, следните акции се препорачани за имплементација во следниот период. За секоја акција треба да се дефинира одговорно лице, временска рамка, и критериуми за успех.'
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 150 }
      })
    );
    recommendedActions.forEach((action, index) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}. ${action}` })],
        spacing: { after: 50 }
      }));
    });
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  if (autoRecommendations.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '9.3 Автоматски генерирани препораки', bold: true, size: 24 })],
        spacing: { after: 150 }
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'Следните препораки се автоматски генерирани врз основа на анализата на податоците во овој извештај. Овие препораки треба да се разгледаат и приоритизираат во контекст на специфичните услови и стратегија на компанијата.'
        })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 150 }
      })
    );
    autoRecommendations.forEach((rec, index) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}. ${rec}` })],
        spacing: { after: 50 }
      }));
    });
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // ========== CONCLUSION ==========
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '10. ЗАКЛУЧОК', bold: true, size: 28 })],
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Маркетинг активностите на ${companyName} за периодот ${dateFrom} - ${dateTo} се оценуваат со оценка ${ratingLabel.toLowerCase()} (${overallRating}/5). Овој извештај обезбедува сеопфатен преглед на инвестициите, резултатите, и ефективноста на маркетинг функцијата.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Од финансиски аспект, од вкупно планираниот буџет од ${totalBudget.toLocaleString('mk-MK')} МКД, искористени се ${budgetUtilization}%, што е ${budgetStatus}. Маркетинг активностите генерирале ${totalLeads} потенцијални клиенти со стапка на конверзија од ${conversionRate}%, резултирајќи во ${totalSales} реални продажби.${roi ? ` Повратот на инвестиција (ROI) изнесува ${roi}%, што е ${parseFloat(roi) > 100 ? 'над' : parseFloat(roi) > 0 ? 'позитивен но под' : 'негативен, под'} очекувањата.` : ''}`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Примарната цел (${mainGoal}) е ${goalAchievement.toLowerCase()}, ${goalAchievement === 'Надмината' || goalAchievement === 'Целосно остварена' ? 'што претставува успешен резултат.' : goalAchievement === 'Делумно остварена' ? 'што укажува на простор за подобрување.' : 'што бара сериозна ревизија на стратегијата.'} За следниот период, препорачуваме примарен фокус на: ${nextPeriodFocus.toLowerCase()}.`
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Овој извештај треба да послужи како основа за информирано донесување одлуки и континуирано подобрување на маркетинг функцијата. Препорачуваме редовно следење на клучните метрики и периодична ревизија на стратегијата врз основа на добиените резултати и промените во пазарните услови.'
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'За дополнителни информации или појаснувања во врска со овој извештај, ве молиме контактирајте го маркетинг тимот или одговорното лице за маркетинг активности.'
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 400 }
    }),
  );

  // Footer
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(60) })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Документ генериран на: ${generationDate} во ${generationTime}`, size: 20, italics: true })],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Генерирано со: Nexa Terminal - Marketing Automation', size: 20, italics: true })],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Сите права задржани. Овој документ е доверлив и наменет исклучиво за интерна употреба.', size: 18, italics: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100 }
    }),
  );

  const sections = [{ children }];
  const doc = new Document({ sections });

  return { doc, sections };
}

module.exports = generateMarketingPerformanceReport;
