/**
 * Promoted Tools Configuration
 *
 * Define all tools that can be promoted at the end of blog posts.
 * Each tool has text content + optional video for quick learning.
 */

// Placeholder video for tools without dedicated videos yet
const PLACEHOLDER_VIDEO = 'https://www.youtube.com/watch?v=WG9Z0NadFJg';

export const PROMOTED_TOOLS = [
  // ============ HEALTH CHECKS ============
  {
    id: 'legal_health_check',
    name: 'Правен Здравствен Преглед',
    description: 'Проверете дали вашата компанија е усогласена со законските регулативи. Направете 360° преглед и добијте акционен план за елиминирање на сите законски ризици.',
    icon: '⚖️',
    link: '/terminal/legal-health-check',
    category: 'legal',
    ctaText: 'Направи бесплатна проверка',
    videoUrl: 'https://www.youtube.com/watch?v=98R2bDGKbgc'
  },
  {
    id: 'marketing_health_check',
    name: 'Маркетинг Здравствен Преглед',
    description: 'Анализирајте ја вашата маркетинг стратегија и добијте персонализирани препораки за подобрување на резултатите.',
    icon: '📈',
    link: '/terminal/marketing-health-check',
    category: 'marketing',
    ctaText: 'Анализирај го мојот маркетинг',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'cyber_health_check',
    name: 'Сајбер Безбедност Преглед',
    description: 'Проверете ја безбедноста на вашите дигитални системи и заштитете го вашиот бизнис од сајбер закани.',
    icon: '🛡️',
    link: '/terminal/cyber-health-check',
    category: 'technology',
    ctaText: 'Направи безбедносна проверка',
    videoUrl: PLACEHOLDER_VIDEO
  },

  // ============ AI ASSISTANTS ============
  {
    id: 'ai_legal_assistant',
    name: 'AI Правен Асистент',
    description: 'Добијте инстантна јасност за македонските закони 24/7. Нашиот АИ асистент цитира релевантни закони и судска пракса.',
    icon: '🤖',
    link: '/terminal/ai-chat',
    category: 'legal',
    ctaText: 'Прашај го AI асистентот',
    videoUrl: 'https://www.youtube.com/watch?v=IbTsGXAXHdY'
  },
  {
    id: 'ai_marketing_assistant',
    name: 'AI Маркетинг Стратег',
    description: 'Добијте персонализирани маркетинг совети за вашиот бизнис. AI консултантот ќе ви помогне да изградите стратегија.',
    icon: '💡',
    link: '/terminal/marketing-ai',
    category: 'marketing',
    ctaText: 'Разговарај со AI стратег',
    videoUrl: PLACEHOLDER_VIDEO
  },

  // ============ DOCUMENT CATEGORIES ============
  {
    id: 'employment_documents',
    name: 'Документи за Вработување',
    description: 'Генерирајте договори за вработување, одлуки и други документи за помалку од 60 секунди. Целосно усогласени со македонското законодавство.',
    icon: '📄',
    link: '/terminal/auto-documents',
    category: 'legal',
    ctaText: 'Креирај документ',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg'
  },
  {
    id: 'gdpr_documents',
    name: 'GDPR Документи',
    description: 'Подгответе ја вашата компанија за заштита на лични податоци со професионални документи и политики.',
    icon: '🔒',
    link: '/terminal/auto-documents',
    category: 'legal',
    ctaText: 'Генерирај GDPR документи',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'business_contracts',
    name: 'Деловни Договори',
    description: 'Договори за соработка, NDA, договори за услуги и повеќе. Стандардизирани професионални шаблони готови за употреба.',
    icon: '🤝',
    link: '/terminal/auto-documents',
    category: 'legal',
    ctaText: 'Креирај договор',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg'
  },
  {
    id: 'company_documents',
    name: 'Документи за Компании',
    description: 'Одлуки, акти и документи за управување со компанија. Генерирајте професионални документи за помалку од минута.',
    icon: '🏢',
    link: '/terminal/auto-documents',
    category: 'business',
    ctaText: 'Генерирај документ',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg'
  },

  // ============ SPECIFIC EMPLOYMENT DOCUMENTS ============
  {
    id: 'employment_agreement',
    name: 'Договор за Вработување',
    description: 'Генерирајте професионален договор за вработување усогласен со Законот за работни односи. Сите задолжителни елементи вклучени.',
    icon: '📝',
    link: '/terminal/auto-documents/employment-agreement',
    category: 'employment',
    ctaText: 'Креирај договор за вработување',
    videoUrl: 'https://www.youtube.com/watch?v=WG9Z0NadFJg'
  },
  {
    id: 'termination_decision',
    name: 'Одлука за Престанок на Работен Однос',
    description: 'Генерирајте правно валидна одлука за престанок на работен однос. Усогласено со сите законски барања.',
    icon: '📋',
    link: '/terminal/auto-documents/termination-decision-due-to-duration',
    category: 'employment',
    ctaText: 'Креирај одлука за престанок',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'termination_agreement',
    name: 'Спогодба за Престанок',
    description: 'Договорен престанок на работен однос со заемна согласност. Заштитете ги интересите на двете страни.',
    icon: '🤝',
    link: '/terminal/auto-documents/termination-agreement',
    category: 'employment',
    ctaText: 'Креирај спогодба',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'annual_leave_decision',
    name: 'Одлука за Годишен Одмор',
    description: 'Генерирајте одлука за годишен одмор согласно законските норми. Брзо и едноставно.',
    icon: '🏖️',
    link: '/terminal/auto-documents/annual-leave-decision',
    category: 'employment',
    ctaText: 'Креирај одлука за одмор',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'warning_letter',
    name: 'Писмена Опомена',
    description: 'Документирајте дисциплински мерки со правилно формулирана писмена опомена. Заштитете се од идни спорови.',
    icon: '⚠️',
    link: '/terminal/auto-documents/warning-letter',
    category: 'employment',
    ctaText: 'Креирај опомена',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'employment_confirmation',
    name: 'Потврда за Вработување',
    description: 'Издајте официјална потврда за вработување за вашите вработени. За банки, амбасади и други институции.',
    icon: '✅',
    link: '/terminal/auto-documents/confirmation-of-employment',
    category: 'employment',
    ctaText: 'Креирај потврда',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'bonus_decision',
    name: 'Одлука за Бонус',
    description: 'Формализирајте исплата на бонуси и награди со правилна документација. Транспарентност и усогласеност.',
    icon: '💰',
    link: '/terminal/auto-documents/bonus-decision',
    category: 'employment',
    ctaText: 'Креирај одлука за бонус',
    videoUrl: PLACEHOLDER_VIDEO
  },

  // ============ SPECIFIC CONTRACTS ============
  {
    id: 'nda_agreement',
    name: 'Договор за Доверливост (NDA)',
    description: 'Заштитете ги вашите деловни тајни со професионален NDA договор. Двојазична верзија достапна.',
    icon: '🔐',
    link: '/terminal/auto-documents/nda',
    category: 'contracts',
    ctaText: 'Креирај NDA',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'services_contract',
    name: 'Договор за Услуги',
    description: 'Професионален договор за деловна соработка и услуги. Јасно дефинирани обврски и права.',
    icon: '📃',
    link: '/terminal/auto-documents/services-contract',
    category: 'contracts',
    ctaText: 'Креирај договор за услуги',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'loan_agreement',
    name: 'Договор за Заем',
    description: 'Формализирајте позајмици меѓу физички или правни лица. Сите потребни клаузули вклучени.',
    icon: '💳',
    link: '/terminal/auto-documents/loan-agreement',
    category: 'contracts',
    ctaText: 'Креирај договор за заем',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'rent_agreement',
    name: 'Договор за Закуп',
    description: 'Договор за закуп на деловен простор или опрема. Целосно усогласен со македонското право.',
    icon: '🏠',
    link: '/terminal/auto-documents/rent-agreement',
    category: 'contracts',
    ctaText: 'Креирај договор за закуп',
    videoUrl: PLACEHOLDER_VIDEO
  },

  // ============ COMPANY DECISIONS ============
  {
    id: 'dividend_decision',
    name: 'Одлука за Дивиденда',
    description: 'Формализирајте распределба на добивка со правилна корпоративна одлука.',
    icon: '📊',
    link: '/terminal/auto-documents/dividend-payment-decision',
    category: 'company',
    ctaText: 'Креирај одлука за дивиденда',
    videoUrl: PLACEHOLDER_VIDEO
  },
  {
    id: 'annual_accounts',
    name: 'Одлука за Годишна Сметка',
    description: 'Усвојување на годишна сметка и финансиски извештаи. Задолжителен документ за секоја компанија.',
    icon: '📈',
    link: '/terminal/auto-documents/annual-accounts-adoption',
    category: 'company',
    ctaText: 'Креирај одлука',
    videoUrl: PLACEHOLDER_VIDEO
  },

  // ============ FREE COURSES ============
  {
    id: 'course_udel_vo_drushtvo',
    name: 'Курс: Удел во трговско друштво',
    description: 'Бесплатен курс за разбирање на уделот во друштвото, права на сопствениците, процедури за стекнување и пренесување на удел.',
    icon: '🎓',
    link: '/terminal/education/course/udel-vo-drushtvo',
    category: 'courses',
    ctaText: 'Започни бесплатен курс',
    videoUrl: null
  },
  {
    id: 'course_izvrsuvanje_nedviznosti',
    name: 'Курс: Извршување врз недвижности',
    description: 'Бесплатен курс за постапката на извршување врз недвижности - од прибелешка до намирување на доверителите.',
    icon: '🎓',
    link: '/terminal/education/course/izvrsuvanje-nedviznosti',
    category: 'courses',
    ctaText: 'Започни бесплатен курс',
    videoUrl: "https://www.youtube.com/watch?v=IrgddYz1bQM"
  },
  {
    id: 'all_courses',
    name: 'Сите бесплатни курсеви',
    description: 'Пристапете до сите бесплатни едукативни курсеви за право, бизнис и инвестиции. Учете во ваше време, без обврски.',
    icon: '📚',
    link: '/terminal/education',
    category: 'courses',
    ctaText: 'Види ги сите курсеви',
    videoUrl: null
  },

  // ============ NO PROMOTION ============
  {
    id: 'none',
    name: 'Без промоција',
    description: 'Не прикажувај промотивен банер на крајот од статијата.',
    icon: '❌',
    link: null,
    category: null,
    ctaText: null,
    videoUrl: null
  }
];

/**
 * Get promoted tool by ID
 * @param {string} toolId - The tool ID
 * @returns {Object|null} The tool object or null if not found
 */
export const getPromotedToolById = (toolId) => {
  return PROMOTED_TOOLS.find(tool => tool.id === toolId) || null;
};

/**
 * Get tools by category
 * @param {string} category - The category to filter by
 * @returns {Array} Array of tools in that category
 */
export const getToolsByCategory = (category) => {
  return PROMOTED_TOOLS.filter(tool => tool.category === category);
};

/**
 * Get all tools grouped by category for admin dropdown
 * @returns {Object} Tools grouped by category
 */
export const getToolsGroupedByCategory = () => {
  const groups = {
    'Здравствени Прегледи': [],
    'AI Асистенти': [],
    'Бесплатни Курсеви': [],
    'Категории Документи': [],
    'Вработување - Специфични': [],
    'Договори - Специфични': [],
    'Компаниски Одлуки': [],
    'Друго': []
  };

  PROMOTED_TOOLS.forEach(tool => {
    if (tool.id === 'none') {
      groups['Друго'].push(tool);
    } else if (tool.id.includes('health_check')) {
      groups['Здравствени Прегледи'].push(tool);
    } else if (tool.id.includes('ai_')) {
      groups['AI Асистенти'].push(tool);
    } else if (tool.category === 'courses') {
      groups['Бесплатни Курсеви'].push(tool);
    } else if (['employment_documents', 'gdpr_documents', 'business_contracts', 'company_documents'].includes(tool.id)) {
      groups['Категории Документи'].push(tool);
    } else if (tool.category === 'employment') {
      groups['Вработување - Специфични'].push(tool);
    } else if (tool.category === 'contracts') {
      groups['Договори - Специфични'].push(tool);
    } else if (tool.category === 'company') {
      groups['Компаниски Одлуки'].push(tool);
    } else {
      groups['Друго'].push(tool);
    }
  });

  return groups;
};

export default PROMOTED_TOOLS;
