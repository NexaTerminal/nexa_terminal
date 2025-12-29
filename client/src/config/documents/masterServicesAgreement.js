import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Master Services Agreement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Follows established patterns from SaaS Agreement and other contract documents
 */
export const masterServicesAgreementConfig = {
  documentType: 'masterServicesAgreement',
  apiEndpoint: 'master-services-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за договорните страни и датум на договорот',
      requiredFields: ['agreementDate', 'userRole']
    },
    {
      id: 2,
      title: 'Податоци за другата страна',
      description: 'Информации за клиентот или давателот на услуга',
      requiredFields: []
    },
    {
      id: 3,
      title: 'Опис на услугата',
      description: 'Детали за видот, обемот и локацијата на услугата',
      requiredFields: ['serviceType', 'serviceDescription', 'serviceScope']
    },
    {
      id: 4,
      title: 'Финансиски услови',
      description: 'Услови за плаќање и валута',
      requiredFields: ['paymentTerms', 'currency', 'paymentMethod']
    },
    {
      id: 5,
      title: 'Испорака и квалитет',
      description: 'Услови за испорака, локација и стандарди за квалитет',
      requiredFields: ['serviceDeliveryTerms', 'serviceLocation']
    },
    {
      id: 6,
      title: 'Времетраење и раскинување',
      description: 'Времетраење на договорот, отказен рок и одговорност',
      requiredFields: ['durationType']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договорот',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се склучува рамковниот договор за услуги. Овој датум ќе биде наведен како „Датум на склучување" и претставува почеток на рамковната соработка согласно Законот за облигациони односи.'
    },
    effectiveDateType: {
      name: 'effectiveDateType',
      type: 'select',
      label: 'Датум на влегување во сила',
      placeholder: 'Изберете датум на влегување во сила',
      required: true,
      options: [
        { value: 'датум на склучување', label: 'Денот на потпишување (стандардно)' },
        { value: 'специфичен датум', label: 'Специфичен датум (внеси подолу)' }
      ],
      helpText: 'Изберете кога договорот станува правно важечки. Стандардно, рамковниот договор важи од датумот на потпишување. Ако имате договорено поинакво, изберете „Специфичен датум" и внесете го конкретниот датум.'
    },
    specificEffectiveDate: {
      name: 'specificEffectiveDate',
      type: 'date',
      label: 'Специфичен датум на влегување во сила',
      placeholder: '',
      required: false,
      condition: (formData) => formData.effectiveDateType === 'специфичен датум',
      helpText: 'Внесете го конкретниот датум кога рамковниот договор треба да влезе во сила, доколку тој е различен од датумот на склучување. Овој датум мора да биде во иднина или идентичен со датумот на склучување согласно член 69 од Законот за облигациони односи.'
    },
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија е',
      placeholder: 'Изберете улога',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'давател', label: 'Давател на услуга (Provider)' },
        { value: 'клиент', label: 'Клиент (Client)' }
      ],
      helpText: 'Изберете дали вашата компанија е давател на услуги (обезбедува услугата) или клиент (користи услугата). Податоците за другата страна ќе ги внесете во следниот чекор. Оваа информација е критична за правилна распределба на договорните обврски според Законот за облигациони односи.'
    },

    // Step 2: Other Party Information
    clientName: {
      name: 'clientName',
      type: 'text',
      label: 'Име на клиентот',
      placeholder: 'пр. ДОО Технологија Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото правно име на компанијата-клиент која ги користи вашите услуги, точно како што е запишано во Централниот регистар на Република Северна Македонија. Точноста на правното име е задолжителна за правна валидност на договорот.'
    },
    clientAddress: {
      name: 'clientAddress',
      type: 'text',
      label: 'Адреса на седиште на клиентот',
      placeholder: 'пр. Даме Груев 12, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете ја целата адреса на седиштето на клиентот (улица, број, град, поштенски број) според податоците од Централниот регистар. Оваа адреса се користи за правни известувања согласно член 260 од ЗОО.'
    },
    clientTaxNumber: {
      name: 'clientTaxNumber',
      type: 'text',
      label: 'Даночен број на клиентот',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го единствениот даночен број на клиентот (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод. Овој број е задолжителен за фактурирање и даночно известување.'
    },
    clientManager: {
      name: 'clientManager',
      type: 'text',
      label: 'Управител/директор на клиентот',
      placeholder: 'пр. Петар Петровски',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-клиент (обично управител или извршен директор) според Решението за запишување во Централниот регистар. Ова лице потпишува договорот со правна важност.'
    },
    providerName: {
      name: 'providerName',
      type: 'text',
      label: 'Име на давателот на услуга',
      placeholder: 'пр. ДОО Услуги ДООЕЛ Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го целото правно име на компанијата која обезбедува услуги, точно како што е запишано во Централниот регистар на Република Северна Македонија. Точноста на правното име е задолжителна за правна валидност на договорот.'
    },
    providerAddress: {
      name: 'providerAddress',
      type: 'text',
      label: 'Адреса на седиште на давателот',
      placeholder: 'пр. Партизанска 25, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете ја целата адреса на седиштето на давателот на услуга (улица, број, град, поштенски број) според податоците од Централниот регистар. Оваа адреса се користи за правни известувања согласно член 260 од ЗОО.'
    },
    providerTaxNumber: {
      name: 'providerTaxNumber',
      type: 'text',
      label: 'Даночен број на давателот',
      placeholder: 'пр. 4030987654321',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го единствениот даночен број на давателот на услуга (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод. Овој број е задолжителен за фактурирање и даночно известување.'
    },
    providerManager: {
      name: 'providerManager',
      type: 'text',
      label: 'Управител/директор на давателот',
      placeholder: 'пр. Ана Ивановска',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-давател на услуга (обично управител или извршен директор) според Решението за запишување во Централниот регистар. Ова лице потпишува договорот со правна важност.'
    },

    // Step 3: Service Description
    serviceType: {
      name: 'serviceType',
      type: 'select',
      label: 'Вид на услуга',
      placeholder: 'Изберете вид на услуга',
      required: true,
      options: [
        { value: '0', label: 'Изберете услуга' },
        { value: 'Консултантски услуги', label: 'Консултантски услуги' },
        { value: 'ИТ услуги', label: 'ИТ услуги' },
        { value: 'Маркетинг услуги', label: 'Маркетинг услуги' },
        { value: 'Дизајн услуги', label: 'Дизајн услуги' },
        { value: 'Правни услуги', label: 'Правни услуги' },
        { value: 'Сметководствени услуги', label: 'Сметководствени услуги' },
        { value: 'Инженерски услуги', label: 'Инженерски услуги' },
        { value: 'Образовни услуги', label: 'Образовни услуги' },
        { value: 'Транспортни услуги', label: 'Транспортни услуги' },
        { value: 'Одржување и сервисирање', label: 'Одржување и сервисирање' },
        { value: 'Технички услуги', label: 'Технички услуги' },
        { value: 'Истражување и развој', label: 'Истражување и развој' },
        { value: 'Производни услуги', label: 'Производни услуги' },
        { value: 'Дистрибуција и логистика', label: 'Дистрибуција и логистика' },
        { value: 'Управување со проекти', label: 'Управување со проекти' },
        { value: 'Друго', label: 'Друго (наведи подолу)' }
      ],
      helpText: 'Изберете ја општата категорија на услугите кои се предмет на овој рамковен договор. Оваа категоризација помага во дефинирање на природата на обврските и специфичните законски стандарди што се применуваат според Законот за облигациони односи.'
    },
    serviceDescription: {
      name: 'serviceDescription',
      type: 'textarea',
      label: 'Детален опис на услугата',
      placeholder: 'пр. професионални консултантски услуги вклучувајќи стратешко планирање, процесна оптимизација и имплементација на деловни решенија',
      required: true,
      rows: 4,
      maxLength: 2000,
      helpText: 'Опишете ги детално услугите што се обезбедуваат согласно овој рамковен договор. Овој опис дефинира што точно е предмет на договорот и помага во толкување на договорните обврски според член 44 од Законот за облигациони односи. Што попрецизен опис, толку подобра правна заштита.'
    },
    serviceScope: {
      name: 'serviceScope',
      type: 'select',
      label: 'Обем на услуги',
      placeholder: 'Изберете обем',
      required: true,
      options: [
        { value: 'според потреба (ad-hoc)', label: 'Според потреба (Ad-hoc)' },
        { value: 'неделен обем (часовно)', label: 'Неделен обем (часовно)' },
        { value: 'месечен обем (часовно)', label: 'Месечен обем (часовно)' },
        { value: 'проектен обем', label: 'Проектен обем (по проект)' },
        { value: 'фиксен месечен обем', label: 'Фиксен месечен обем (стандарден пакет)' },
        { value: 'флексибилен обем', label: 'Флексибилен обем (променлив)' },
        { value: 'целосен обем (full-time)', label: 'Целосен обем (Full-time еквивалент)' },
        { value: 'делумен обем (part-time)', label: 'Делумен обем (Part-time)' }
      ],
      helpText: 'Изберете го начинот на кој се определува обемот на услугите во рамките на овој договор. Обемот може да биде фиксиран, флексибилен или базиран на конкретни проекти. Ова влијае на начинот на наплата и договорните обврски согласно членови 519-551 од ЗОО за договор за дело/услуга.'
    },

    // Step 4: Financial Terms
    paymentTerms: {
      name: 'paymentTerms',
      type: 'select',
      label: 'Услови за плаќање',
      placeholder: 'Изберете услови',
      required: true,
      options: [
        { value: 'net 15 денови', label: 'Net 15 денови (15 дена по фактура)' },
        { value: 'net 30 денови', label: 'Net 30 денови (30 дена по фактура)' },
        { value: 'net 45 денови', label: 'Net 45 денови (45 дена по фактура)' },
        { value: 'net 60 денови', label: 'Net 60 денови (60 дена по фактура)' },
        { value: 'net 90 денови', label: 'Net 90 денови (90 дена по фактура)' },
        { value: 'по испорака', label: 'По испорака (веднаш)' },
        { value: 'аванс 50%', label: 'Аванс 50% + остаток по испорака' },
        { value: 'аванс 30%', label: 'Аванс 30% + остаток по испорака' },
        { value: 'месечно фактурирање', label: 'Месечно фактурирање (на крај од месец)' }
      ],
      helpText: 'Изберете го рокот за плаќање на фактурите издадени согласно овој договор. Стандардниот деловен рок е 30 дена согласно Законот за финансиска дисциплина. Подолги рокови може да бараат посебно договарање. Ова влијае на кеш флоу и финансиско планирање.'
    },
    currency: {
      name: 'currency',
      type: 'select',
      label: 'Валута',
      placeholder: 'Изберете валута',
      required: true,
      options: [
        { value: 'денари', label: 'Денари (MKD)' },
        { value: 'евра', label: 'Евра (EUR)' },
        { value: 'долари', label: 'Долари (USD)' }
      ],
      helpText: 'Изберете ја валутата во која се врши плаќањето на услугите. За договори со странски компании обично се користат евра или долари, додека за домашни договори се користат денари. Валутата влијае на даночното известување и девизното работење согласно Законот за девизно работење.'
    },
    paymentMethod: {
      name: 'paymentMethod',
      type: 'select',
      label: 'Начин на плаќање',
      placeholder: 'Изберете начин',
      required: true,
      options: [
        { value: 'банкарски трансфер', label: 'Банкарски трансфер (преку банка)' },
        { value: 'еПлаќање', label: 'еПлаќање (онлајн плаќање)' },
        { value: 'чек', label: 'Чек (банкарски чек)' },
        { value: 'меѓународен трансфер', label: 'Меѓународен трансфер (SWIFT)' },
        { value: 'готовина', label: 'Готовина (за износи до законски лимит)' }
      ],
      helpText: 'Изберете го начинот на кој ќе се вршат плаќањата согласно овој договор. Стандардниот начин е банкарски трансфер. Готовински плаќања се ограничени на 5.000 денари дневно согласно Законот за платниот промет. Начинот на плаќање влијае на евиденцијата и трошоците.'
    },
    feeStructure: {
      name: 'feeStructure',
      type: 'select',
      label: 'Структура на надоместок',
      placeholder: 'Изберете структура',
      required: false,
      options: [
        { value: '', label: 'Не се специфицира (ќе се дефинира во SOW)' },
        { value: 'фиксен износ по проект', label: 'Фиксен износ по проект' },
        { value: 'месечен паушал', label: 'Месечен паушал (фиксен месечен износ)' },
        { value: 'часовна стапка', label: 'Часовна стапка (плаќање по час)' },
        { value: 'дневна стапка', label: 'Дневна стапка (day rate)' },
        { value: 'комбинирано', label: 'Комбинирано (паушал + додатни часови)' },
        { value: 'по резултат', label: 'По резултат (перформанс-базирано)' }
      ],
      helpText: 'Изберете како се пресметува надоместокот за услугите. Може да биде фиксен износ, месечен паушал, почасовно, или комбинација. Ако не се специфицира, конкретните износи ќе се дефинираат во посебните SOW (Statement of Work) документи за секој проект.'
    },
    feeAmount: {
      name: 'feeAmount',
      type: 'text',
      label: 'Износ на надоместок (опционално)',
      placeholder: 'пр. 50000, 150.000, 5000 по час',
      required: false,
      condition: (formData) => formData.feeStructure && formData.feeStructure !== '',
      helpText: 'Внесете го износот на надоместокот доколку е применливо (без валута). За месечен паушал внесете месечен износ, за часовна стапка внесете износ по час, за проект внесете вкупен износ. Ова поле е опционално - конкретните износи може да се дефинираат и во SOW документите.'
    },
    hoursLimit: {
      name: 'hoursLimit',
      type: 'text',
      label: 'Максимален број на часови (опционално)',
      placeholder: 'пр. 160 часа месечно, 40 часа неделно',
      required: false,
      condition: (formData) => formData.feeStructure === 'часовна стапка' || formData.feeStructure === 'месечен паушал' || formData.feeStructure === 'комбинирано',
      helpText: 'Наведете го максималниот број на часови вклучени во договорот (месечно, неделно или вкупно). Ова е важно за паушални аранжмани каде што е вклучен определен број часови, или за часовна наплата со договорен лимит. Надминувањето на лимитот може да биде предмет на доплата.'
    },
    overtimeRate: {
      name: 'overtimeRate',
      type: 'select',
      label: 'Стапка за прекувремена работа (опционално)',
      placeholder: 'Изберете стапка',
      required: false,
      condition: (formData) => formData.hoursLimit && formData.hoursLimit !== '',
      options: [
        { value: '', label: 'Не се применува' },
        { value: '1.25x', label: '1.25x (25% зголемување)' },
        { value: '1.5x', label: '1.5x (50% зголемување - стандардно)' },
        { value: '2x', label: '2x (двојно - удвоена стапка)' },
        { value: 'исто како редовно', label: 'Исто како редовното (без доплата)' },
        { value: 'според договор', label: 'Според посебен договор' }
      ],
      helpText: 'Изберете ја стапката за наплата на часови над договорениот лимит. Стандардно е 1.5x (50% зголемување) согласно практиката од Законот за работни односи. Доколку прекувремената работа не се наплаќа посебно, изберете "исто како редовно". Ова обезбедува јасност за дополнителните трошоци.'
    },

    // Step 5: Service Delivery
    serviceDeliveryTerms: {
      name: 'serviceDeliveryTerms',
      type: 'select',
      label: 'Услови за испорака на услуги',
      placeholder: 'Изберете услови',
      required: true,
      options: [
        { value: 'на локација на клиентот', label: 'На локација на клиентот' },
        { value: 'на локација на давателот', label: 'На локација на давателот' },
        { value: 'ремоутли (on-site)', label: 'Ремоутли (Online/Remote)' },
        { value: 'хибридно (комбинирано)', label: 'Хибридно (комбинирано)' },
        { value: 'на трета локација', label: 'На трета локација (наведи подолу)' },
        { value: 'според SOW', label: 'Според индивидуални SOW (Statement of Work)' }
      ],
      helpText: 'Изберете каде и како ќе се извршуваат услугите. Локацијата на извршување влијае на трошоците, логистиката и даночните обврски. За сложени проекти, услугите може да се дефинираат детално во посебни SOW документи (наредби за работа).'
    },
    serviceLocation: {
      name: 'serviceLocation',
      type: 'text',
      label: 'Конкретна локација за услуги',
      placeholder: 'пр. Канцеларии на клиентот, Скопје или Ремоутли преку онлајн платформа',
      required: true,
      helpText: 'Наведете ја конкретната локацијата или начинот на кој услугите ќе се извршуваат. За физички локации наведете град и евентуално адреса. За ремоутли работа наведете платформата. Јасна дефиниција на локацијата помага во избегнување недоразбирања и дефинира одговорности за трошоци за патување.'
    },
    qualityStandards: {
      name: 'qualityStandards',
      type: 'select',
      label: 'Стандарди за квалитет',
      placeholder: 'Изберете стандарди',
      required: false,
      options: [
        { value: 'индустриски стандарди за квалитет', label: 'Индустриски стандарди (општо прифатени)' },
        { value: 'ISO 9001 стандарди', label: 'ISO 9001 стандарди за квалитет' },
        { value: 'ISO 27001 стандарди', label: 'ISO 27001 стандарди за информациска безбедност' },
        { value: 'договорени специфични критериуми', label: 'Договорени специфични критериуми' },
        { value: 'најдобри практики во индустријата', label: 'Најдобри практики во индустријата (Best Practices)' },
        { value: 'законски и регулаторни барања', label: 'Законски и регулаторни барања' }
      ],
      helpText: 'Изберете ги стандардите за квалитет што ќе се применуваат при извршување на услугите. Јасно дефинирани стандарди помагаат во проценка на квалитетот и обезбедуваат основа за евентуални приговори согласно членови 527-530 од ЗОО за недостатоци во извршувањето.'
    },

    // Step 6: Duration and Termination
    durationType: {
      name: 'durationType',
      type: 'select',
      label: 'Времетраење на договорот',
      placeholder: 'Изберете времетраење',
      required: true,
      options: [
        { value: 'неопределено', label: 'Неопределено време (се раскинува со отказ)' },
        { value: 'определено', label: 'Определено време (наведи краен датум)' }
      ],
      helpText: 'Изберете дали рамковниот договор е на неопределено време (важи додека не се раскине) или на определено време (важи до конкретен датум). За долгорочни соработки обично се користи неопределено време со можност за отказ согласно член 272 од Законот за облигациони односи.'
    },
    durationMonths: {
      name: 'durationMonths',
      type: 'select',
      label: 'Времетраење во месеци',
      placeholder: 'Изберете период',
      required: false,
      condition: (formData) => formData.durationType === 'определено',
      options: [
        { value: '6', label: '6 месеци' },
        { value: '12', label: '12 месеци (1 година)' },
        { value: '24', label: '24 месеци (2 години)' },
        { value: '36', label: '36 месеци (3 години)' },
        { value: '48', label: '48 месеци (4 години)' },
        { value: '60', label: '60 месеци (5 години)' }
      ],
      helpText: 'Изберете го времетраењето на рамковниот договор доколку е на определено време. По истекот на овој период, договорот автоматски престанува да важи согласно член 116 од ЗОО. Обично се користи 12 или 24 месеци за рамковни договори за услуги.'
    },
    endDate: {
      name: 'endDate',
      type: 'date',
      label: 'Краен датум на договорот',
      placeholder: '',
      required: false,
      condition: (formData) => formData.durationType === 'определено',
      helpText: 'Внесете го конкретниот датум кога рамковниот договор престанува да важи. Овој датум треба да биде во иднина и да одговара со избраното времетраење во месеци. По овој датум, договорот автоматски престанува согласно член 116 од Законот за облигациони односи.'
    },
    terminationNoticePeriod: {
      name: 'terminationNoticePeriod',
      type: 'select',
      label: 'Отказен рок',
      placeholder: 'Изберете рок',
      required: false,
      options: [
        { value: '15 денови', label: '15 денови (кусо известување)' },
        { value: '30 денови', label: '30 денови (стандардно)' },
        { value: '45 денови', label: '45 денови' },
        { value: '60 денови', label: '60 денови (долго известување)' },
        { value: '90 денови', label: '90 денови (многу долго известување)' }
      ],
      helpText: 'Изберете го периодот на известување потребен за редовно раскинување на договорот (без причина). Стандардниот отказен рок е 30 дена согласно Законот за облигациони односи. Подолг отказен рок обезбедува повеќе време за трансфер на работа и финализација на активните проекти.'
    },
    liabilityLimitType: {
      name: 'liabilityLimitType',
      type: 'select',
      label: 'Ограничување на одговорност',
      placeholder: 'Изберете тип',
      required: false,
      options: [
        { value: 'месечен износ', label: 'Месечен износ (последните 12 месеци)' },
        { value: 'годишен износ', label: 'Годишен износ (вкупен износ за година)' }
      ],
      helpText: 'Изберете го начинот на кој се ограничува максималната одговорност на давателот на услуга за штети. Обично се ограничува на износот платен во последните 12 месеци. Ова ограничување е вообичаена практика во договори за услуги и помага во управување со ризикот согласно членови 141-189 од ЗОО за надоместок на штета.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1
    {
      field: 'agreementDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на склучување на договорот'
    },
    {
      field: 'effectiveDateType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на влегување во сила'
    },
    {
      field: 'userRole',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вашата улога во договорот'
    },

    // Step 3
    {
      field: 'serviceType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вид на услуга'
    },
    {
      field: 'serviceDescription',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Детален опис на услугата'
    },
    {
      field: 'serviceScope',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Обем на услуги'
    },

    // Step 4
    {
      field: 'paymentTerms',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Услови за плаќање'
    },
    {
      field: 'currency',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Валута'
    },
    {
      field: 'paymentMethod',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Начин на плаќање'
    },

    // Step 5
    {
      field: 'serviceDeliveryTerms',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Услови за испорака на услуги'
    },
    {
      field: 'serviceLocation',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Конкретна локација за услуги'
    },

    // Step 6
    {
      field: 'durationType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Времетраење на договорот'
    }
  ],

  // Initial form data
  initialFormData: {
    agreementDate: '',
    effectiveDateType: 'датум на склучување',
    specificEffectiveDate: '',
    userRole: '',
    clientName: '',
    clientAddress: '',
    clientTaxNumber: '',
    clientManager: '',
    providerName: '',
    providerAddress: '',
    providerTaxNumber: '',
    providerManager: '',
    serviceType: '',
    serviceDescription: '',
    serviceScope: '',
    paymentTerms: 'net 30 денови',
    currency: 'денари',
    paymentMethod: 'банкарски трансфер',
    feeStructure: '',
    feeAmount: '',
    hoursLimit: '',
    overtimeRate: '',
    serviceDeliveryTerms: '',
    serviceLocation: '',
    qualityStandards: 'индустриски стандарди за квалитет',
    durationType: 'неопределено',
    durationMonths: '12',
    endDate: '',
    terminationNoticePeriod: '30 денови',
    liabilityLimitType: 'месечен износ',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['agreementDate', 'effectiveDateType', 'specificEffectiveDate', 'userRole'],
    2: ['clientName', 'clientAddress', 'clientTaxNumber', 'clientManager', 'providerName', 'providerAddress', 'providerTaxNumber', 'providerManager'],
    3: ['serviceType', 'serviceDescription', 'serviceScope'],
    4: ['paymentTerms', 'currency', 'paymentMethod', 'feeStructure', 'feeAmount', 'hoursLimit', 'overtimeRate'],
    5: ['serviceDeliveryTerms', 'serviceLocation', 'qualityStandards'],
    6: ['durationType', 'durationMonths', 'endDate', 'terminationNoticePeriod', 'liabilityLimitType']
  };

  return fieldsByStep[stepId]?.map(fieldName => masterServicesAgreementConfig.fields[fieldName]) || [];
};

export default masterServicesAgreementConfig;
