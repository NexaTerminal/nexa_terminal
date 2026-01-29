import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Marketing Performance Report Configuration
 * Enhanced with more select inputs and automated calculations
 */
export const marketingPerformanceReportConfig = {
  documentType: 'marketingPerformanceReport',
  apiEndpoint: 'marketing-documents/performance-report',
  fileName: null,

  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Внесете ги основните податоци за извештајот',
      requiredFields: ['reportPeriodType', 'companyName', 'industry', 'companySize', 'marketingTeamSize']
    },
    {
      id: 2,
      title: 'Маркетинг канали и буџет',
      description: 'Изберете ги каналите и внесете буџетски податоци',
      requiredFields: ['totalBudget', 'actualSpent', 'executionType']
    },
    {
      id: 3,
      title: 'Перформанси и резултати',
      description: 'Внесете ги резултатите од маркетинг активностите',
      requiredFields: ['totalLeads', 'totalSales', 'websiteTrafficChange', 'socialMediaEngagement']
    },
    {
      id: 4,
      title: 'Цели и оценка',
      description: 'Оценете го остварувањето на целите',
      requiredFields: ['mainGoal', 'goalAchievement', 'overallRating', 'nextPeriodFocus']
    }
  ],

  fields: {
    // Step 1: Basic Information
    reportPeriodType: {
      name: 'reportPeriodType',
      type: 'select',
      label: 'Период на извештај',
      required: true,
      step: 1,
      options: [
        { value: '', label: 'Изберете период' },
        { value: 'Месечен', label: 'Месечен' },
        { value: 'Квартален', label: 'Квартален' }
      ],
      helpText: 'Датумите се генерираат автоматски според избраниот период.'
    },
    companyName: {
      name: 'companyName',
      type: 'text',
      label: 'Име на компанија',
      placeholder: 'пр. Nexa Solutions ДООЕЛ',
      required: true,
      step: 1
    },
    industry: {
      name: 'industry',
      type: 'select',
      label: 'Индустрија',
      required: true,
      step: 1,
      options: [
        { value: '', label: 'Изберете индустрија' },
        { value: 'Е-трговија', label: 'Е-трговија' },
        { value: 'SaaS / Софтвер', label: 'SaaS / Софтвер' },
        { value: 'Професионални услуги', label: 'Професионални услуги' },
        { value: 'Производство', label: 'Производство' },
        { value: 'Угостителство и туризам', label: 'Угостителство и туризам' },
        { value: 'Здравство', label: 'Здравство' },
        { value: 'Образование', label: 'Образование' },
        { value: 'Финансии и осигурување', label: 'Финансии и осигурување' },
        { value: 'Недвижности', label: 'Недвижности' },
        { value: 'Друго', label: 'Друго' }
      ]
    },
    companySize: {
      name: 'companySize',
      type: 'select',
      label: 'Големина на компанија',
      required: true,
      step: 1,
      options: [
        { value: '', label: 'Изберете големина' },
        { value: '1-10', label: 'Микро (1-10 вработени)' },
        { value: '11-50', label: 'Мала (11-50 вработени)' },
        { value: '51-250', label: 'Средна (51-250 вработени)' },
        { value: '250+', label: 'Голема (250+ вработени)' }
      ]
    },
    marketingTeamSize: {
      name: 'marketingTeamSize',
      type: 'select',
      label: 'Големина на маркетинг тим',
      required: true,
      step: 1,
      options: [
        { value: '', label: 'Изберете големина' },
        { value: '0', label: 'Без посветен тим' },
        { value: '1', label: '1 лице' },
        { value: '2-3', label: '2-3 лица' },
        { value: '4-10', label: '4-10 лица' },
        { value: '10+', label: '10+ лица' }
      ]
    },

    // Step 2: Channels and Budget
    marketingChannels: {
      name: 'marketingChannels',
      type: 'checkbox-group',
      label: 'Користени маркетинг канали',
      required: false,
      step: 2,
      options: [
        { value: 'Facebook Ads', label: 'Facebook Ads' },
        { value: 'Instagram Ads', label: 'Instagram Ads' },
        { value: 'Google Ads (Search)', label: 'Google Ads (Search)' },
        { value: 'Google Ads (Display)', label: 'Google Ads (Display)' },
        { value: 'LinkedIn Ads', label: 'LinkedIn Ads' },
        { value: 'TikTok Ads', label: 'TikTok Ads' },
        { value: 'Email маркетинг', label: 'Email маркетинг' },
        { value: 'SEO', label: 'SEO' },
        { value: 'Content маркетинг', label: 'Content маркетинг' },
        { value: 'Influencer маркетинг', label: 'Influencer маркетинг' },
        { value: 'Affiliate маркетинг', label: 'Affiliate маркетинг' },
        { value: 'Offline реклами', label: 'Offline реклами' }
      ],
      helpText: 'Изберете ги сите канали што беа активни во периодот.'
    },
    primaryChannel: {
      name: 'primaryChannel',
      type: 'select',
      label: 'Примарен канал (најголем буџет)',
      required: false,
      step: 2,
      options: [
        { value: '', label: 'Изберете канал' },
        { value: 'Facebook Ads', label: 'Facebook Ads' },
        { value: 'Instagram Ads', label: 'Instagram Ads' },
        { value: 'Google Ads', label: 'Google Ads' },
        { value: 'LinkedIn Ads', label: 'LinkedIn Ads' },
        { value: 'Email маркетинг', label: 'Email маркетинг' },
        { value: 'SEO', label: 'SEO' },
        { value: 'Content маркетинг', label: 'Content маркетинг' }
      ]
    },
    totalBudget: {
      name: 'totalBudget',
      type: 'number',
      label: 'Планиран буџет (МКД)',
      placeholder: 'пр. 100000',
      required: true,
      step: 2,
      min: 0
    },
    actualSpent: {
      name: 'actualSpent',
      type: 'number',
      label: 'Реално потрошено (МКД)',
      placeholder: 'пр. 85000',
      required: true,
      step: 2,
      min: 0
    },
    executionType: {
      name: 'executionType',
      type: 'select',
      label: 'Извршител на активности',
      required: true,
      step: 2,
      options: [
        { value: '', label: 'Изберете тип' },
        { value: 'Внатрешен тим', label: 'Внатрешен тим' },
        { value: 'Надворешна агенција', label: 'Надворешна агенција' },
        { value: 'Фриленсер', label: 'Фриленсер' },
        { value: 'Комбинирано', label: 'Комбинирано' }
      ]
    },
    budgetAllocationSatisfaction: {
      name: 'budgetAllocationSatisfaction',
      type: 'select',
      label: 'Задоволство од распределба на буџет',
      required: false,
      step: 2,
      options: [
        { value: '', label: 'Изберете оценка' },
        { value: 'Многу задоволни', label: 'Многу задоволни' },
        { value: 'Задоволни', label: 'Задоволни' },
        { value: 'Неутрални', label: 'Неутрални' },
        { value: 'Незадоволни', label: 'Незадоволни' },
        { value: 'Многу незадоволни', label: 'Многу незадоволни' }
      ]
    },

    // Step 3: Performance Results
    totalLeads: {
      name: 'totalLeads',
      type: 'number',
      label: 'Вкупно генерирани leads',
      placeholder: 'пр. 150',
      required: true,
      step: 3,
      min: 0
    },
    leadQuality: {
      name: 'leadQuality',
      type: 'select',
      label: 'Квалитет на leads',
      required: false,
      step: 3,
      options: [
        { value: '', label: 'Изберете квалитет' },
        { value: 'Висок', label: 'Висок (>50% квалификувани)' },
        { value: 'Среден', label: 'Среден (25-50% квалификувани)' },
        { value: 'Низок', label: 'Низок (<25% квалификувани)' }
      ]
    },
    totalSales: {
      name: 'totalSales',
      type: 'number',
      label: 'Реализирани продажби',
      placeholder: 'пр. 25',
      required: true,
      step: 3,
      min: 0
    },
    estimatedRevenue: {
      name: 'estimatedRevenue',
      type: 'number',
      label: 'Приход од маркетинг активности (МКД)',
      placeholder: 'пр. 500000',
      required: false,
      step: 3,
      min: 0
    },
    websiteTrafficChange: {
      name: 'websiteTrafficChange',
      type: 'select',
      label: 'Промена на веб сообраќај',
      required: true,
      step: 3,
      options: [
        { value: '', label: 'Изберете промена' },
        { value: '+50% или повеќе', label: 'Зголемување +50% или повеќе' },
        { value: '+25-50%', label: 'Зголемување +25-50%' },
        { value: '+10-25%', label: 'Зголемување +10-25%' },
        { value: '+1-10%', label: 'Зголемување +1-10%' },
        { value: 'Без промена', label: 'Без значајна промена' },
        { value: '-1-10%', label: 'Намалување -1-10%' },
        { value: '-10% или повеќе', label: 'Намалување -10% или повеќе' }
      ]
    },
    socialMediaEngagement: {
      name: 'socialMediaEngagement',
      type: 'select',
      label: 'Ниво на social media engagement',
      required: true,
      step: 3,
      options: [
        { value: '', label: 'Изберете ниво' },
        { value: 'Многу високо', label: 'Многу високо (>5% engagement rate)' },
        { value: 'Високо', label: 'Високо (3-5% engagement rate)' },
        { value: 'Средно', label: 'Средно (1-3% engagement rate)' },
        { value: 'Ниско', label: 'Ниско (<1% engagement rate)' },
        { value: 'Не се мери', label: 'Не се мери / Не е применливо' }
      ]
    },
    emailPerformance: {
      name: 'emailPerformance',
      type: 'select',
      label: 'Перформанси на email кампањи',
      required: false,
      step: 3,
      options: [
        { value: '', label: 'Изберете перформанс' },
        { value: 'Одлични', label: 'Одлични (>25% open rate, >5% CTR)' },
        { value: 'Добри', label: 'Добри (15-25% open rate, 2-5% CTR)' },
        { value: 'Просечни', label: 'Просечни (10-15% open rate, 1-2% CTR)' },
        { value: 'Под просек', label: 'Под просек (<10% open rate, <1% CTR)' },
        { value: 'Не се користи', label: 'Не се користи email маркетинг' }
      ]
    },
    brandAwarenessImpact: {
      name: 'brandAwarenessImpact',
      type: 'select',
      label: 'Влијание врз препознатливост на бренд',
      required: false,
      step: 3,
      options: [
        { value: '', label: 'Изберете влијание' },
        { value: 'Значително зголемување', label: 'Значително зголемување' },
        { value: 'Умерено зголемување', label: 'Умерено зголемување' },
        { value: 'Минимално влијание', label: 'Минимално влијание' },
        { value: 'Без промена', label: 'Без забележителна промена' },
        { value: 'Не се мери', label: 'Не се мери' }
      ]
    },

    // Step 4: Goals and Rating
    mainGoal: {
      name: 'mainGoal',
      type: 'select',
      label: 'Примарна маркетинг цел',
      required: true,
      step: 4,
      options: [
        { value: '', label: 'Изберете цел' },
        { value: 'Генерирање leads', label: 'Генерирање leads' },
        { value: 'Директна продажба', label: 'Директна продажба' },
        { value: 'Бренд свесност', label: 'Бренд свесност' },
        { value: 'Задржување клиенти', label: 'Задржување клиенти' },
        { value: 'Лансирање производ/услуга', label: 'Лансирање производ/услуга' },
        { value: 'Зголемување веб сообраќај', label: 'Зголемување веб сообраќај' },
        { value: 'Градење email листа', label: 'Градење email листа' }
      ]
    },
    secondaryGoal: {
      name: 'secondaryGoal',
      type: 'select',
      label: 'Секундарна маркетинг цел',
      required: false,
      step: 4,
      options: [
        { value: '', label: 'Изберете цел (опционално)' },
        { value: 'Генерирање leads', label: 'Генерирање leads' },
        { value: 'Директна продажба', label: 'Директна продажба' },
        { value: 'Бренд свесност', label: 'Бренд свесност' },
        { value: 'Задржување клиенти', label: 'Задржување клиенти' },
        { value: 'Лансирање производ/услуга', label: 'Лансирање производ/услуга' },
        { value: 'Зголемување веб сообраќај', label: 'Зголемување веб сообраќај' },
        { value: 'Градење email листа', label: 'Градење email листа' }
      ]
    },
    goalAchievement: {
      name: 'goalAchievement',
      type: 'select',
      label: 'Степен на остварување на примарната цел',
      required: true,
      step: 4,
      options: [
        { value: '', label: 'Изберете степен' },
        { value: 'Надмината', label: 'Надмината (>120% од целта)' },
        { value: 'Целосно остварена', label: 'Целосно остварена (100-120%)' },
        { value: 'Делумно остварена', label: 'Делумно остварена (50-99%)' },
        { value: 'Минимално остварена', label: 'Минимално остварена (25-49%)' },
        { value: 'Неостварена', label: 'Неостварена (<25%)' }
      ]
    },
    challenges: {
      name: 'challenges',
      type: 'checkbox-group',
      label: 'Главни предизвици во периодот',
      required: false,
      step: 4,
      options: [
        { value: 'Висока цена по клик (CPC)', label: 'Висока цена по клик (CPC)' },
        { value: 'Низок reach', label: 'Низок reach / досег' },
        { value: 'Слаба конверзија', label: 'Слаба конверзија' },
        { value: 'Низок engagement', label: 'Низок engagement' },
        { value: 'Недоволен буџет', label: 'Недоволен буџет' },
        { value: 'Недостаток на содржина', label: 'Недостаток на содржина' },
        { value: 'Технички проблеми', label: 'Технички проблеми' },
        { value: 'Силна конкуренција', label: 'Силна конкуренција' },
        { value: 'Недостаток на ресурси', label: 'Недостаток на човечки ресурси' },
        { value: 'Нема значајни предизвици', label: 'Нема значајни предизвици' }
      ]
    },
    overallRating: {
      name: 'overallRating',
      type: 'select',
      label: 'Општа оценка на маркетинг активностите',
      required: true,
      step: 4,
      options: [
        { value: '', label: 'Изберете оценка' },
        { value: '5', label: '5 - Одлично' },
        { value: '4', label: '4 - Многу добро' },
        { value: '3', label: '3 - Добро' },
        { value: '2', label: '2 - Задоволително' },
        { value: '1', label: '1 - Незадоволително' }
      ]
    },
    nextPeriodFocus: {
      name: 'nextPeriodFocus',
      type: 'select',
      label: 'Приоритет за следниот период',
      required: true,
      step: 4,
      options: [
        { value: '', label: 'Изберете приоритет' },
        { value: 'Зголемување на буџет', label: 'Зголемување на буџет' },
        { value: 'Оптимизација на постоечки канали', label: 'Оптимизација на постоечки канали' },
        { value: 'Тестирање нови канали', label: 'Тестирање нови канали' },
        { value: 'Подобрување на конверзија', label: 'Подобрување на конверзија' },
        { value: 'Креирање повеќе содржина', label: 'Креирање повеќе содржина' },
        { value: 'Автоматизација', label: 'Автоматизација на процеси' },
        { value: 'Градење на тим', label: 'Градење на маркетинг тим' },
        { value: 'Задржување на статус кво', label: 'Задржување на тековната стратегија' }
      ]
    },
    recommendedActions: {
      name: 'recommendedActions',
      type: 'checkbox-group',
      label: 'Препорачани акции за следниот период',
      required: false,
      step: 4,
      options: [
        { value: 'A/B тестирање', label: 'Воведување A/B тестирање' },
        { value: 'Ретаргетинг кампањи', label: 'Поставување ретаргетинг кампањи' },
        { value: 'Landing page оптимизација', label: 'Оптимизација на landing pages' },
        { value: 'Email автоматизација', label: 'Email автоматизација' },
        { value: 'SEO подобрувања', label: 'SEO подобрувања' },
        { value: 'Видео содржина', label: 'Повеќе видео содржина' },
        { value: 'Influencer соработки', label: 'Influencer соработки' },
        { value: 'CRM интеграција', label: 'CRM интеграција' }
      ]
    }
  },

  validationRules: [
    { field: 'reportPeriodType', type: VALIDATION_TYPES.REQUIRED, label: 'Период на извештај' },
    { field: 'companyName', type: VALIDATION_TYPES.REQUIRED, label: 'Име на компанија' },
    { field: 'industry', type: VALIDATION_TYPES.REQUIRED, label: 'Индустрија' },
    { field: 'companySize', type: VALIDATION_TYPES.REQUIRED, label: 'Големина на компанија' },
    { field: 'marketingTeamSize', type: VALIDATION_TYPES.REQUIRED, label: 'Големина на маркетинг тим' },
    { field: 'totalBudget', type: VALIDATION_TYPES.REQUIRED, label: 'Вкупен буџет' },
    { field: 'actualSpent', type: VALIDATION_TYPES.REQUIRED, label: 'Реално потрошено' },
    { field: 'executionType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на извршување' },
    { field: 'totalLeads', type: VALIDATION_TYPES.REQUIRED, label: 'Број на leads' },
    { field: 'totalSales', type: VALIDATION_TYPES.REQUIRED, label: 'Број на продажби' },
    { field: 'websiteTrafficChange', type: VALIDATION_TYPES.REQUIRED, label: 'Промена на веб сообраќај' },
    { field: 'socialMediaEngagement', type: VALIDATION_TYPES.REQUIRED, label: 'Social media engagement' },
    { field: 'mainGoal', type: VALIDATION_TYPES.REQUIRED, label: 'Главна цел' },
    { field: 'goalAchievement', type: VALIDATION_TYPES.REQUIRED, label: 'Остварување на целта' },
    { field: 'overallRating', type: VALIDATION_TYPES.REQUIRED, label: 'Општа оценка' },
    { field: 'nextPeriodFocus', type: VALIDATION_TYPES.REQUIRED, label: 'Приоритет за следен период' }
  ],

  initialFormData: {
    reportPeriodType: '',
    companyName: '',
    industry: '',
    companySize: '',
    marketingTeamSize: '',
    marketingChannels: [],
    primaryChannel: '',
    totalBudget: '',
    actualSpent: '',
    executionType: '',
    budgetAllocationSatisfaction: '',
    totalLeads: '',
    leadQuality: '',
    totalSales: '',
    estimatedRevenue: '',
    websiteTrafficChange: '',
    socialMediaEngagement: '',
    emailPerformance: '',
    brandAwarenessImpact: '',
    mainGoal: '',
    secondaryGoal: '',
    goalAchievement: '',
    challenges: [],
    overallRating: '',
    nextPeriodFocus: '',
    recommendedActions: [],
    acceptTerms: false
  }
};

export default marketingPerformanceReportConfig;
