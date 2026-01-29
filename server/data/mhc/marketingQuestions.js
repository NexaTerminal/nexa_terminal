// Marketing Health Check Questions - Macedonian
// Industry-aware marketing assessment questionnaire

const ANSWER_TYPES = {
  CHOICE: 'choice',
  SCALE: 'scale'
};

// Industry definitions with display names
const INDUSTRIES = {
  services: { id: 'services', name: 'Услуги', description: 'Консултантски услуги, агенции, професионални услуги' },
  manufacturing: { id: 'manufacturing', name: 'Производство / Фабрика', description: 'Производствени компании, private label, фабрики' },
  retail: { id: 'retail', name: 'Трговија на мало / големо', description: 'Продавници, дистрибуција, малопродажба' },
  hospitality: { id: 'hospitality', name: 'Угостителство / Туризам', description: 'Ресторани, хотели, туристички агенции' },
  construction: { id: 'construction', name: 'Градежништво / Инженеринг', description: 'Градежни компании, архитекти, инженери' },
  startup: { id: 'startup', name: 'Стартап / SaaS', description: 'Технолошки стартапи, софтверски компании' },
  other: { id: 'other', name: 'Друго', description: 'Останати индустрии' }
};

// Industry multipliers for each question category
// Higher = more relevant for that industry
const INDUSTRY_WEIGHTS = {
  strategy: { services: 1.2, manufacturing: 1.0, retail: 1.0, hospitality: 1.1, construction: 0.9, startup: 1.3, other: 1.0 },
  brand: { services: 1.3, manufacturing: 0.9, retail: 1.1, hospitality: 1.2, construction: 0.8, startup: 1.2, other: 1.0 },
  website: { services: 1.2, manufacturing: 1.0, retail: 1.3, hospitality: 1.2, construction: 1.0, startup: 1.4, other: 1.0 },
  social_media: { services: 1.3, manufacturing: 0.6, retail: 1.2, hospitality: 1.4, construction: 0.7, startup: 1.2, other: 1.0 },
  content: { services: 1.2, manufacturing: 0.7, retail: 1.0, hospitality: 1.1, construction: 0.8, startup: 1.3, other: 1.0 },
  trust_signals: { services: 1.4, manufacturing: 1.1, retail: 1.2, hospitality: 1.3, construction: 1.2, startup: 1.1, other: 1.0 },
  b2b_channels: { services: 1.0, manufacturing: 1.5, retail: 0.8, hospitality: 0.6, construction: 1.3, startup: 0.9, other: 1.0 },
  local_presence: { services: 1.0, manufacturing: 0.7, retail: 1.4, hospitality: 1.3, construction: 1.1, startup: 0.5, other: 1.0 },
  execution: { services: 1.1, manufacturing: 1.0, retail: 1.0, hospitality: 1.0, construction: 1.0, startup: 1.2, other: 1.0 }
};

const questions = [
  // ===== СТРАТЕГИЈА И ЦЕЛИ (q1-q6) =====
  {
    id: 'q1',
    category: 'strategy',
    text: 'Дали вашата компанија има јасно дефинирана цел за маркетингот (на пр. зголемување на продажба, градење доверба, привлекување партнери)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 1.0,
    options: [
      { value: 'a', text: 'Да, со јасни и мерливи цели', score: 4 },
      { value: 'b', text: 'Да, но општо и без конкретни показатели', score: 2 },
      { value: 'c', text: 'Делумно, повеќе интуитивно', score: 1 },
      { value: 'd', text: 'Не, немаме дефинирани цели', score: 0 }
    ]
  },
  {
    id: 'q2',
    category: 'strategy',
    text: 'Колку често го преиспитувате дали маркетинг активностите даваат резултат?',
    type: ANSWER_TYPES.SCALE,
    weight: 0.9,
    scaleDescription: '1 = никогаш, 10 = редовно и систематски'
  },
  {
    id: 'q3',
    category: 'strategy',
    text: 'Дали имате дефинирано кој е вашиот идеален клиент (целна група)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 1.0,
    options: [
      { value: 'a', text: 'Да, имаме детален профил на идеален клиент', score: 4 },
      { value: 'b', text: 'Да, но само на општо ниво', score: 2 },
      { value: 'c', text: 'Делумно, имаме идеја но не е документирано', score: 1 },
      { value: 'd', text: 'Не, продаваме на секој кој ќе дојде', score: 0 }
    ]
  },
  {
    id: 'q4',
    category: 'strategy',
    text: 'Дали маркетинг буџетот е планиран однапред или се трошат средства спонтано?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Имаме годишен/квартален буџет со јасна алокација', score: 4 },
      { value: 'b', text: 'Имаме приближен буџет, но не е строго дефиниран', score: 2 },
      { value: 'c', text: 'Трошиме кога ќе се појави потреба', score: 1 },
      { value: 'd', text: 'Немаме буџет за маркетинг', score: 0 }
    ]
  },
  {
    id: 'q5',
    category: 'strategy',
    text: 'Дали имате документирана маркетинг стратегија или план?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, имаме детален план со активности и рокови', score: 4 },
      { value: 'b', text: 'Имаме основен план, но не е детален', score: 2 },
      { value: 'c', text: 'Имаме идеи, но ништо не е напишано', score: 1 },
      { value: 'd', text: 'Не, работиме без план', score: 0 }
    ]
  },
  {
    id: 'q6',
    category: 'strategy',
    text: 'Колку добро ги познавате маркетинг активностите на вашите главни конкуренти?',
    type: ANSWER_TYPES.SCALE,
    weight: 0.7,
    scaleDescription: '1 = воопшто не ги следиме, 10 = редовно ги анализираме'
  },

  // ===== БРЕНД И ВИЗУЕЛЕН ИДЕНТИТЕТ (q7-q12) =====
  {
    id: 'q7',
    category: 'brand',
    text: 'Дали визуелниот идентитет (лого, бои, фонтови) е конзистентен на сите канали?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, целосно конзистентен', score: 4 },
      { value: 'b', text: 'Делумно, со мали отстапки', score: 2 },
      { value: 'c', text: 'Многу неконзистентен', score: 1 },
      { value: 'd', text: 'Немаме дефиниран визуелен идентитет', score: 0 }
    ]
  },
  {
    id: 'q8',
    category: 'brand',
    text: 'Дали јасно комуницирате што ве разликува од конкурентите?',
    type: ANSWER_TYPES.CHOICE,
    weight: 1.0,
    options: [
      { value: 'a', text: 'Да, многу јасно - нашите клиенти го знаат тоа', score: 4 },
      { value: 'b', text: 'Делумно, но не е конзистентно комуницирано', score: 2 },
      { value: 'c', text: 'Слабо, ни самите не сме сигурни', score: 1 },
      { value: 'd', text: 'Воопшто не', score: 0 }
    ]
  },
  {
    id: 'q9',
    category: 'brand',
    text: 'Дали имате дефиниран тон на комуникација (формален, пријателски, стручен)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Да, имаме јасни упатства за тон и стил', score: 4 },
      { value: 'b', text: 'Имаме идеја, но не е формализирано', score: 2 },
      { value: 'c', text: 'Тонот варира зависно од ситуацијата', score: 1 },
      { value: 'd', text: 'Не сме размислувале за тоа', score: 0 }
    ]
  },
  {
    id: 'q10',
    category: 'brand',
    text: 'Дали вашиот слоган/порака јасно кажува што нудите и за кого?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, веднаш е јасно', score: 4 },
      { value: 'b', text: 'Делумно јасно', score: 2 },
      { value: 'c', text: 'Преопшто или збунувачки', score: 1 },
      { value: 'd', text: 'Немаме слоган/порака', score: 0 }
    ]
  },
  {
    id: 'q11',
    category: 'brand',
    text: 'Колку сте задоволни од тоа како вашата компанија изгледа однадвор (визуелно и професионално)?',
    type: ANSWER_TYPES.SCALE,
    weight: 0.6,
    scaleDescription: '1 = многу незадоволни, 10 = целосно задоволни'
  },
  {
    id: 'q12',
    category: 'brand',
    text: 'Дали имате професионални материјали (визит карти, каталог, презентации)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Да, сè е професионално изработено и ажурирано', score: 4 },
      { value: 'b', text: 'Имаме некои, но не се сите ажурирани', score: 2 },
      { value: 'c', text: 'Имаме малку и се застарени', score: 1 },
      { value: 'd', text: 'Немаме такви материјали', score: 0 }
    ]
  },

  // ===== ВЕБ-СТРАНИЦА И ОНЛАЈН ПРИСУСТВО (q13-q19) =====
  {
    id: 'q13',
    category: 'website',
    text: 'Дали вашата веб-страница јасно објаснува што нудите во првите 5 секунди?',
    type: ANSWER_TYPES.CHOICE,
    weight: 1.0,
    options: [
      { value: 'a', text: 'Да, многу јасно', score: 4 },
      { value: 'b', text: 'Делумно јасно', score: 2 },
      { value: 'c', text: 'Тешко разбирливо', score: 1 },
      { value: 'd', text: 'Немаме веб-страница', score: 0 }
    ]
  },
  {
    id: 'q14',
    category: 'website',
    text: 'Колку е лесно потенцијален клиент да ве контактира преку веб-страницата?',
    type: ANSWER_TYPES.SCALE,
    weight: 0.9,
    scaleDescription: '1 = многу тешко, 10 = многу лесно (јасен контакт на секоја страница)'
  },
  {
    id: 'q15',
    category: 'website',
    text: 'Дали веб-страницата е оптимизирана за мобилни уреди?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, целосно прилагодена и брза', score: 4 },
      { value: 'b', text: 'Функционира, но не е перфектна', score: 2 },
      { value: 'c', text: 'Слабо, тешко се користи на мобилен', score: 1 },
      { value: 'd', text: 'Не знам / Немаме веб-страница', score: 0 }
    ]
  },
  {
    id: 'q16',
    category: 'website',
    text: 'Дали имате Google My Business профил со точни информации?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, целосно пополнет и редовно ажуриран', score: 4 },
      { value: 'b', text: 'Имаме, но не е секогаш ажуриран', score: 2 },
      { value: 'c', text: 'Имаме, но е нецелосен или застарен', score: 1 },
      { value: 'd', text: 'Немаме или не знаеме за тоа', score: 0 }
    ]
  },
  {
    id: 'q17',
    category: 'website',
    text: 'Колку често ја ажурирате содржината на веб-страницата?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Редовно (барем месечно)', score: 4 },
      { value: 'b', text: 'Повремено (неколку пати годишно)', score: 2 },
      { value: 'c', text: 'Ретко (еднаш годишно или помалку)', score: 1 },
      { value: 'd', text: 'Никогаш од кога е направена', score: 0 }
    ]
  },
  {
    id: 'q18',
    category: 'website',
    text: 'Дали следите колку посетители имате на веб-страницата (Google Analytics или слично)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.6,
    options: [
      { value: 'a', text: 'Да, редовно ги анализираме податоците', score: 4 },
      { value: 'b', text: 'Имаме поставено, но ретко гледаме', score: 2 },
      { value: 'c', text: 'Не сме сигурни дали имаме', score: 1 },
      { value: 'd', text: 'Не, не следиме', score: 0 }
    ]
  },
  {
    id: 'q19',
    category: 'website',
    text: 'Дали веб-страницата има SSL сертификат (https://) и изгледа безбедно?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Да, има https и изгледа професионално', score: 4 },
      { value: 'b', text: 'Има https, но дизајнот е застарен', score: 2 },
      { value: 'c', text: 'Не сум сигурен', score: 1 },
      { value: 'd', text: 'Нема https или немаме веб-страница', score: 0 }
    ]
  },

  // ===== СОЦИЈАЛНИ МРЕЖИ (q20-q25) =====
  {
    id: 'q20',
    category: 'social_media',
    text: 'На кои социјални мрежи е присутна вашата компанија?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Активни сме на 2-3 релевантни платформи', score: 4 },
      { value: 'b', text: 'Имаме профили, но само на една платформа сме активни', score: 2 },
      { value: 'c', text: 'Имаме профили, но ретко објавуваме', score: 1 },
      { value: 'd', text: 'Не сме присутни на социјални мрежи', score: 0 }
    ]
  },
  {
    id: 'q21',
    category: 'social_media',
    text: 'Дали имате план за објавување содржина (тематики, фреквенција)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, јасен план со календар на содржини', score: 4 },
      { value: 'b', text: 'Делумен план, но не секогаш го следиме', score: 2 },
      { value: 'c', text: 'Многу ретко планираме', score: 1 },
      { value: 'd', text: 'Објавуваме спонтано или воопшто не', score: 0 }
    ]
  },
  {
    id: 'q22',
    category: 'social_media',
    text: 'Каков тип на содржина најчесто објавувате?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Едукативна и корисна за нашата публика', score: 4 },
      { value: 'b', text: 'Комбинација од едукативна и промотивна', score: 3 },
      { value: 'c', text: 'Претежно промотивна (само за нас)', score: 1 },
      { value: 'd', text: 'Ретко или воопшто не објавуваме', score: 0 }
    ]
  },
  {
    id: 'q23',
    category: 'social_media',
    text: 'Колку брзо одговарате на пораки и коментари на социјалните мрежи?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Во рок од неколку часа', score: 4 },
      { value: 'b', text: 'Во рок од 1-2 дена', score: 2 },
      { value: 'c', text: 'Кога ќе се сетиме', score: 1 },
      { value: 'd', text: 'Ретко или никогаш', score: 0 }
    ]
  },
  {
    id: 'q24',
    category: 'social_media',
    text: 'Дали користите платена реклама на социјалните мрежи?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.6,
    options: [
      { value: 'a', text: 'Да, редовно со јасни цели', score: 4 },
      { value: 'b', text: 'Повремено, кога имаме кампања', score: 2 },
      { value: 'c', text: 'Пробавме, но без јасни резултати', score: 1 },
      { value: 'd', text: 'Не, само органски пораки', score: 0 }
    ]
  },
  {
    id: 'q25',
    category: 'social_media',
    text: 'Колку е ангажирана вашата публика (лајкови, коментари, споделувања)?',
    type: ANSWER_TYPES.SCALE,
    weight: 0.7,
    scaleDescription: '1 = многу ниска ангажираност, 10 = висока ангажираност'
  },

  // ===== СОДРЖИНА И КОМУНИКАЦИЈА (q26-q29) =====
  {
    id: 'q26',
    category: 'content',
    text: 'Дали креирате оригинална содржина (блог, видеа, водичи) за вашата публика?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, редовно создаваме корисна содржина', score: 4 },
      { value: 'b', text: 'Повремено, кога имаме време', score: 2 },
      { value: 'c', text: 'Ретко, само кога е неопходно', score: 1 },
      { value: 'd', text: 'Не создаваме сопствена содржина', score: 0 }
    ]
  },
  {
    id: 'q27',
    category: 'content',
    text: 'Дали содржината што ја креирате е насочена кон решавање на проблеми на клиентите?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, секогаш тргнуваме од потребите на клиентите', score: 4 },
      { value: 'b', text: 'Делумно, понекогаш е повеќе за нас', score: 2 },
      { value: 'c', text: 'Претежно е промотивна', score: 1 },
      { value: 'd', text: 'Не создаваме содржина', score: 0 }
    ]
  },
  {
    id: 'q28',
    category: 'content',
    text: 'Дали користите email маркетинг за комуникација со клиенти?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.6,
    options: [
      { value: 'a', text: 'Да, имаме редовен newsletter и автоматизација', score: 4 },
      { value: 'b', text: 'Имаме листа, но ретко испраќаме', score: 2 },
      { value: 'c', text: 'Собираме email-ови, но не ги користиме', score: 1 },
      { value: 'd', text: 'Не користиме email маркетинг', score: 0 }
    ]
  },
  {
    id: 'q29',
    category: 'content',
    text: 'Дали имате јасна порака која ја користите во сите комуникации?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, конзистентна порака насекаде', score: 4 },
      { value: 'b', text: 'Делумно, варира зависно од каналот', score: 2 },
      { value: 'c', text: 'Секој пат комуницираме различно', score: 1 },
      { value: 'd', text: 'Немаме дефинирана порака', score: 0 }
    ]
  },

  // ===== ДОВЕРБА И СОЦИЈАЛЕН ДОКАЗ (q30-q34) =====
  {
    id: 'q30',
    category: 'trust_signals',
    text: 'Дали имате јавно достапни препораки или мислења од клиенти?',
    type: ANSWER_TYPES.CHOICE,
    weight: 1.0,
    options: [
      { value: 'a', text: 'Да, на веб-страница и социјални мрежи', score: 4 },
      { value: 'b', text: 'Имаме неколку, но не се истакнати', score: 2 },
      { value: 'c', text: 'Имаме позитивни повратни информации, но не се јавни', score: 1 },
      { value: 'd', text: 'Немаме или не ги собираме', score: 0 }
    ]
  },
  {
    id: 'q31',
    category: 'trust_signals',
    text: 'Дали јасно комуницирате процес на соработка (што добива клиентот и кога)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, имаме јасен процес објаснет на веб или во материјали', score: 4 },
      { value: 'b', text: 'Делумно, објаснуваме кога ќе прашаат', score: 2 },
      { value: 'c', text: 'Секој клиент е различен, нема стандарден процес', score: 1 },
      { value: 'd', text: 'Не сме размислувале за тоа', score: 0 }
    ]
  },
  {
    id: 'q32',
    category: 'trust_signals',
    text: 'Дали имате студии на случај (case studies) или примери од успешни проекти?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, неколку детални примери со резултати', score: 4 },
      { value: 'b', text: 'Имаме портфолио, но без детали за резултати', score: 2 },
      { value: 'c', text: 'Спомнуваме референци, но без документација', score: 1 },
      { value: 'd', text: 'Немаме', score: 0 }
    ]
  },
  {
    id: 'q33',
    category: 'trust_signals',
    text: 'Дали редовно барате повратни информации (feedback) од клиентите?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Да, систематски по секој проект/продажба', score: 4 },
      { value: 'b', text: 'Понекогаш, кога се сетиме', score: 2 },
      { value: 'c', text: 'Само ако клиентот сам каже', score: 1 },
      { value: 'd', text: 'Не бараме feedback', score: 0 }
    ]
  },
  {
    id: 'q34',
    category: 'trust_signals',
    text: 'Дали имате приказ на сертификати, награди или партнерства кои градат доверба?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.6,
    options: [
      { value: 'a', text: 'Да, истакнати се на видливо место', score: 4 },
      { value: 'b', text: 'Имаме, но не се видливи', score: 2 },
      { value: 'c', text: 'Имаме малку, но не ги користиме', score: 1 },
      { value: 'd', text: 'Немаме такви елементи', score: 0 }
    ]
  },

  // ===== B2B КАНАЛИ И НАСТАНИ (q35-q37) - особено за производство/градежништво =====
  {
    id: 'q35',
    category: 'b2b_channels',
    text: 'Дали редовно учествувате на саеми, B2B настани или бизнис средби?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, редовно (барем 2-3 годишно)', score: 4 },
      { value: 'b', text: 'Повремено (еднаш годишно)', score: 2 },
      { value: 'c', text: 'Ретко, само кога има голем настан', score: 1 },
      { value: 'd', text: 'Не учествуваме на такви настани', score: 0 }
    ]
  },
  {
    id: 'q36',
    category: 'b2b_channels',
    text: 'Дали имате подготвени материјали за потенцијални деловни партнери (каталози, презентации, спецификации)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, професионални и ажурирани', score: 4 },
      { value: 'b', text: 'Имаме, но не се секогаш ажурирани', score: 2 },
      { value: 'c', text: 'Правиме по потреба', score: 1 },
      { value: 'd', text: 'Немаме такви материјали', score: 0 }
    ]
  },
  {
    id: 'q37',
    category: 'b2b_channels',
    text: 'Дали вашата онлајн презентација е насочена кон деловни клиенти (B2B)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Да, јасно се обраќаме на бизниси', score: 4 },
      { value: 'b', text: 'Делумно, имаме и B2B и B2C содржина', score: 2 },
      { value: 'c', text: 'Претежно за крајни потрошувачи', score: 1 },
      { value: 'd', text: 'Не е јасно дефинирано', score: 0 }
    ]
  },

  // ===== ЛОКАЛНО ПРИСУСТВО (q38-q40) - особено за угостителство/трговија =====
  {
    id: 'q38',
    category: 'local_presence',
    text: 'Дали вашите информации се ажурирани на Google Maps (локација, работно време, телефон)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, сè е точно и ажурирано', score: 4 },
      { value: 'b', text: 'Претежно точно, со мали застареност', score: 2 },
      { value: 'c', text: 'Не сме сигурни дали е точно', score: 1 },
      { value: 'd', text: 'Не сме на Google Maps или не знаеме', score: 0 }
    ]
  },
  {
    id: 'q39',
    category: 'local_presence',
    text: 'Дали клиентите лесно ве наоѓаат и препознаваат локално?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, имаме добра локална видливост', score: 4 },
      { value: 'b', text: 'Делумно, некои нè познаваат', score: 2 },
      { value: 'c', text: 'Слабо, повеќето не знаат за нас', score: 1 },
      { value: 'd', text: 'Не е релевантно за нашиот бизнис', score: 0 }
    ]
  },
  {
    id: 'q40',
    category: 'local_presence',
    text: 'Дали имате рецензии на Google или други платформи (TripAdvisor, Facebook)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, многу позитивни рецензии', score: 4 },
      { value: 'b', text: 'Имаме неколку, претежно позитивни', score: 2 },
      { value: 'c', text: 'Имаме малку или мешани рецензии', score: 1 },
      { value: 'd', text: 'Немаме рецензии', score: 0 }
    ]
  },

  // ===== ИЗВРШУВАЊЕ И ОДГОВОРНОСТ (q41-q45) =====
  {
    id: 'q41',
    category: 'execution',
    text: 'Дали маркетингот е одговорност на конкретна личност или е споредна активност?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Има јасна одговорност (интерно или надворешно)', score: 4 },
      { value: 'b', text: 'Делумна одговорност, дел од друга позиција', score: 2 },
      { value: 'c', text: 'Споредна активност, кога има време', score: 1 },
      { value: 'd', text: 'Никој конкретно не е одговорен', score: 0 }
    ]
  },
  {
    id: 'q42',
    category: 'execution',
    text: 'Колку добро знаете кои маркетинг активности носат реални резултати?',
    type: ANSWER_TYPES.SCALE,
    weight: 1.0,
    scaleDescription: '1 = воопшто не знаеме, 10 = точно знаеме што функционира'
  },
  {
    id: 'q43',
    category: 'execution',
    text: 'Дали следите метрики/показатели за маркетинг успех (посети, leads, продажби)?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.9,
    options: [
      { value: 'a', text: 'Да, редовно ги анализираме', score: 4 },
      { value: 'b', text: 'Делумно, некои показатели следиме', score: 2 },
      { value: 'c', text: 'Ретко, само генерален впечаток', score: 1 },
      { value: 'd', text: 'Не следиме метрики', score: 0 }
    ]
  },
  {
    id: 'q44',
    category: 'execution',
    text: 'Колку време неделно посветувате на маркетинг активности?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.7,
    options: [
      { value: 'a', text: 'Повеќе од 10 часа неделно', score: 4 },
      { value: 'b', text: '5-10 часа неделно', score: 3 },
      { value: 'c', text: '1-5 часа неделно', score: 2 },
      { value: 'd', text: 'Помалку од 1 час или воопшто', score: 0 }
    ]
  },
  {
    id: 'q45',
    category: 'execution',
    text: 'Дали имате процес за следење на потенцијални клиенти (leads) од маркетинг?',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.8,
    options: [
      { value: 'a', text: 'Да, имаме CRM или систем за следење', score: 4 },
      { value: 'b', text: 'Делумно, водиме евиденција рачно', score: 2 },
      { value: 'c', text: 'Повремено, кога ќе се сетиме', score: 1 },
      { value: 'd', text: 'Не следиме систематски', score: 0 }
    ]
  }
];

// Category display names
const categoryNames = {
  strategy: 'Стратегија и цели',
  brand: 'Бренд и визуелен идентитет',
  website: 'Веб-страница и онлајн присуство',
  social_media: 'Социјални мрежи',
  content: 'Содржина и комуникација',
  trust_signals: 'Доверба и социјален доказ',
  b2b_channels: 'B2B канали и настани',
  local_presence: 'Локално присуство',
  execution: 'Извршување и мерење'
};

// Maturity levels (qualitative, no percentages shown to user)
const maturityLevels = {
  veryLow: {
    threshold: 0,
    label: 'Низок степен на маркетинг основи',
    class: 'verylow',
    description: 'Маркетинг активностите се на почетно ниво со значителен простор за развој.'
  },
  low: {
    threshold: 25,
    label: 'Базичен но неструктуриран маркетинг',
    class: 'low',
    description: 'Постојат одредени маркетинг активности, но без јасна структура и систематичност.'
  },
  moderate: {
    threshold: 45,
    label: 'Умерено развиен маркетинг',
    class: 'moderate',
    description: 'Компанијата има основна маркетинг инфраструктура со простор за значително подобрување.'
  },
  good: {
    threshold: 60,
    label: 'Солидна маркетинг основа',
    class: 'good',
    description: 'Маркетинг функцијата е добро поставена со јасни процеси и активности.'
  },
  strong: {
    threshold: 75,
    label: 'Добро развиен маркетинг систем',
    class: 'strong',
    description: 'Компанијата има зрел маркетинг систем со конзистентни активности и резултати.'
  },
  excellent: {
    threshold: 90,
    label: 'Одличен маркетинг систем',
    class: 'excellent',
    description: 'Маркетинг функцијата е на високо ниво со одлична стратегија и извршување.'
  }
};

module.exports = {
  questions,
  INDUSTRIES,
  INDUSTRY_WEIGHTS,
  categoryNames,
  maturityLevels,
  ANSWER_TYPES
};
