import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Mediation Agreement Document Configuration
 * Comprehensive configuration matching backend controller requirements
 * Based on Civil Code Articles 869-882 (Macedonian Law of Obligations)
 * Complex conditional logic based on user role (mediator/client) and client type (natural/legal)
 */
export const mediationAgreementConfig = {
  documentType: 'mediationAgreement',
  apiEndpoint: 'mediation-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Ваша улога и основни информации за договорот',
      requiredFields: ['agreementDate', 'userRole']
    },
    {
      id: 2,
      title: 'Информации за договорните страни',
      description: 'Податоци за другата договорна страна и контакт информации',
      requiredFields: [] // Will be determined dynamically
    },
    {
      id: 3,
      title: 'Предмет на посредување',
      description: 'Тип на посредување и детали за услугите',
      requiredFields: ['agreementDuration', 'territoryScope', 'typeOfMediation', 'specificContractType']
    },
    {
      id: 4,
      title: 'Финансиски услови',
      description: 'Провизија, надоместок и трошоци',
      requiredFields: ['commissionRate', 'commissionCalculation', 'paymentTiming']
    },
    {
      id: 5,
      title: 'Правни услови',
      description: 'Доверливост, известувања и решавање на спорови',
      requiredFields: ['confidentialityPeriod', 'earlyTerminationNoticePeriod', 'disputeResolution']
    }
  ],

  // Form fields configuration
  fields: {
    // ===== STEP 1: BASIC INFORMATION =====
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договор',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за посредување. Овој датум претставува почетокот на обврските согласно членови 869-882 од Законот за облигациони односи.'
    },
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Ваша улога во договорот',
      options: [
        { value: '', label: 'Изберете ја вашата улога' },
        { value: 'mediator', label: 'Посредник (јас давам услуги на посредување)' },
        { value: 'client', label: 'Налогодавец (јас барам услуги на посредување)' }
      ],
      required: true,
      helpText: 'Согласно член 869 од ЗОО, изберете дали вашата компанија е посредник што дава услуги или налогодавец што бара услуги на посредување. Ова влијае на структурата на договорот и финансиските одредби.'
    },

    // ===== STEP 2: PARTY INFORMATION =====
    // Client Type Selection (only for user role = client)
    clientType: {
      name: 'clientType',
      type: 'select',
      label: 'Тип на вашата компанија како налогодавец',
      options: [
        { value: '', label: 'Изберете тип' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'legal', label: 'Правно лице (компанија)' }
      ],
      required: false, // Will be conditionally required
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Ако сте налогодавец, изберете дали барате услугите како физичко лице или правно лице. Ова влијае на потребните документи за идентификација согласно законските барања.'
    },

    // Client Type Selection (only for user role = mediator)
    clientTypeForMediator: {
      name: 'clientTypeForMediator',
      type: 'select',
      label: 'Тип на налогодавецот',
      options: [
        { value: '', label: 'Изберете тип на налогодавец' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'legal', label: 'Правно лице (компанија)' }
      ],
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      helpText: 'Изберете дали налогодавецот што бара ваши услуги е физичко лице или правно лице. Ова определува кои податоци ќе треба да ги внесете подолу.'
    },

    // === FIELDS FOR WHEN USER IS MEDIATOR ===
    // Natural Client Fields
    naturalClientName: {
      name: 'naturalClientName',
      type: 'text',
      label: 'Име и презиме на налогодавецот',
      placeholder: 'пр. Марко Петровски',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете го целосното име и презиме на физичкото лице како што е наведено во личната карта. Ова е правно обврзувачки податок за договорот.'
    },
    naturalClientAddress: {
      name: 'naturalClientAddress',
      type: 'text',
      label: 'Адреса на живеење на налогодавецот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете ја адресата на живеење (улица, број, град) според личната карта. Адресата е потребна за правна валидност на договорот и за испраќање на официјални известувања.'
    },
    naturalClientPin: {
      name: 'naturalClientPin',
      type: 'text',
      label: 'ЕМБГ на налогодавецот',
      placeholder: 'пр. 1234567890123',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ бројот (точно 13 цифри) како што е наведен во личната карта. ЕМБГ е законски задолжителен за идентификација на физички лица во договорни односи.'
    },
    naturalClientPhone: {
      name: 'naturalClientPhone',
      type: 'text',
      label: 'Телефонски број на налогодавецот',
      placeholder: 'пр. 070 123 456',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете го телефонскиот број за контакт. Овој број е потребен за комуникација и известувања согласно член 875 од ЗОО.'
    },
    naturalClientEmail: {
      name: 'naturalClientEmail',
      type: 'email',
      label: 'Е-пошта на налогодавецот',
      placeholder: 'пр. marko.petrovski@example.com',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете ја е-пошта адресата за официјална комуникација и испраќање на известувања согласно договорот.'
    },

    // Legal Client Fields
    legalClientName: {
      name: 'legalClientName',
      type: 'text',
      label: 'Име на компанијата налогодавец',
      placeholder: 'пр. ДОО Иновација Солушенс',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го целосното официјално име на компанијата како што е регистрирана во Централниот регистар на Република Северна Македонија.'
    },
    legalClientAddress: {
      name: 'legalClientAddress',
      type: 'text',
      label: 'Адреса на седиште на компанијата налогодавец',
      placeholder: 'пр. ул. Македонија бр. 456, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете ја адресата на седиштето како што е регистрирана во Централниот регистар. Оваа адреса е правно обврзувачка за испраќање на официјални документи.'
    },
    legalClientTaxNumber: {
      name: 'legalClientTaxNumber',
      type: 'text',
      label: 'Даночен број (ЕДБ) на компанијата налогодавец',
      placeholder: 'пр. 4567890',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го даночниот број (ЕДБ) како што е регистриран во Управата за јавни приходи. ЕДБ е задолжителен за правна валидност на договорот со правни лица.'
    },
    legalClientManager: {
      name: 'legalClientManager',
      type: 'text',
      label: 'Управител/Директор на компанијата налогодавец',
      placeholder: 'пр. Ана Стојановска',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го името на овластеното лице (управител/директор) кое ја застапува компанијата при склучување на договорот согласно законот и статутот.'
    },
    legalClientPhone: {
      name: 'legalClientPhone',
      type: 'text',
      label: 'Телефонски број на компанијата налогодавец',
      placeholder: 'пр. 02 123 456',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го телефонскиот број на компанијата за официјална комуникација и известувања согласно договорот.'
    },
    legalClientEmail: {
      name: 'legalClientEmail',
      type: 'email',
      label: 'Е-пошта на компанијата налогодавец',
      placeholder: 'пр. kontakt@inovacija.com.mk',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете ја официјалната е-пошта адреса на компанијата за правна комуникација и известувања.'
    },

    // === FIELDS FOR WHEN USER IS CLIENT (Mediator company info) ===
    mediatorCompanyName: {
      name: 'mediatorCompanyName',
      type: 'text',
      label: 'Име на компанијата посредник',
      placeholder: 'пр. ДОО Посредување Експерт',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го целосното официјално име на компанијата што ви дава услуги на посредување како што е регистрирана во Централниот регистар на РСМ.'
    },
    mediatorCompanyAddress: {
      name: 'mediatorCompanyAddress',
      type: 'text',
      label: 'Адреса на седиште на посредникот',
      placeholder: 'пр. ул. Центар бр. 789, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете ја адресата на седиштето на компанијата посредник како што е регистрирана во трговскиот регистар. Оваа адреса е правно обврзувачка за договорот.'
    },
    mediatorCompanyTaxNumber: {
      name: 'mediatorCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број (ЕДБ) на посредникот',
      placeholder: 'пр. 7891234',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го даночниот број (ЕДБ) на компанијата посредник како што е регистриран во Управата за јавни приходи. Овој број е потребен за правна валидност на договорот.'
    },
    mediatorCompanyManager: {
      name: 'mediatorCompanyManager',
      type: 'text',
      label: 'Управител/Директор на посредникот',
      placeholder: 'пр. Петар Николовски',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го името на овластеното лице (управител/директор) кое ја застапува компанијата посредник при склучување на договорот.'
    },
    mediatorCompanyPhone: {
      name: 'mediatorCompanyPhone',
      type: 'text',
      label: 'Телефонски број на посредникот',
      placeholder: 'пр. 02 987 654',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го телефонскиот број на компанијата посредник за официјална комуникација и известувања согласно членовите 874-875 од ЗОО.'
    },
    mediatorCompanyEmail: {
      name: 'mediatorCompanyEmail',
      type: 'email',
      label: 'Е-пошта на посредникот',
      placeholder: 'пр. kontakt@posreduvanje.com.mk',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете ја официјалната е-пошта адреса на компанијата посредник за правна комуникација и известувања.'
    },

    // Contact fields for user's own company
    mediatorPhone: {
      name: 'mediatorPhone',
      type: 'text',
      label: 'Телефонски број на вашата компанија (посредник)',
      placeholder: 'пр. 02 123 456',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      helpText: 'Внесете го телефонскиот број на вашата компанија за контакт со налогодавецот.'
    },
    mediatorEmail: {
      name: 'mediatorEmail',
      type: 'email',
      label: 'Е-пошта на вашата компанија (посредник)',
      placeholder: 'пр. kontakt@vasafirma.com.mk',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      helpText: 'Внесете ја е-пошта адресата на вашата компанија за официјална комуникација.'
    },
    clientPhone: {
      name: 'clientPhone',
      type: 'text',
      label: 'Телефонски број на вашата компанија (налогодавец)',
      placeholder: 'пр. 02 123 456',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го телефонскиот број на вашата компанија за контакт со посредникот.'
    },
    clientEmail: {
      name: 'clientEmail',
      type: 'email',
      label: 'Е-пошта на вашата компанија (налогодавец)',
      placeholder: 'пр. kontakt@vasafirma.com.mk',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете ја е-пошта адресата на вашата компанија за официјална комуникација.'
    },

    // ===== STEP 3: MEDIATION SUBJECT =====
    agreementDuration: {
      name: 'agreementDuration',
      type: 'text',
      label: 'Времетраење на договорот',
      placeholder: 'пр. 12 месеци, 1 година, неопределено време',
      required: true,
      helpText: 'Внесете го времетраењето на договорот за посредување. Согласно член 872 од ЗОО, налогодавецот може да го отповика налогот во секое време, но договорното време е важно за утврдување на правата и обврските.'
    },
    territoryScope: {
      name: 'territoryScope',
      type: 'text',
      label: 'Територијален опсег на посредување',
      placeholder: 'пр. Република Северна Македонија, град Скопје, регион Пелагонија',
      required: true,
      helpText: 'Наведете на која територија ќе се извршува посредувањето. Ова е важно за определување на обемот на работа и одговорностите на посредникот согласно договорот.'
    },
    typeOfMediation: {
      name: 'typeOfMediation',
      type: 'select',
      label: 'Тип на посредување',
      options: [
        { value: '', label: 'Изберете тип на посредување' },
        { value: 'Продажба на недвижен имот', label: 'Продажба на недвижен имот' },
        { value: 'Продажба на движен имот', label: 'Продажба на движен имот' },
        { value: 'Изнајмување на простор', label: 'Изнајмување на простор' },
        { value: 'Деловно посредување', label: 'Деловно посредување' },
        { value: 'Вработување', label: 'Вработување (агенција за вработување)' },
        { value: 'Финансиско посредување', label: 'Финансиско посредување' },
        { value: 'Друго', label: 'Друго (наведете во опис)' }
      ],
      required: true,
      helpText: 'Согласно член 869 од ЗОО, изберете го типот на посредување. Различни типови имаат различни правни импликации и обврски за посредникот.'
    },
    specificContractType: {
      name: 'specificContractType',
      type: 'text',
      label: 'Специфичен тип на договор за посредување',
      placeholder: 'пр. Договор за продажба на деловен простор, Договор за изнајмување на канцеларија',
      required: true,
      helpText: 'Согласно член 869 од ЗОО, прецизирајте го специфичниот тип на договор што посредникот ќе го бара и поврзува со трето лице. Ова е предметот на посредувањето.'
    },
    targetContractValueRange: {
      name: 'targetContractValueRange',
      type: 'text',
      label: 'Очекувана вредност на договорот (опционо)',
      placeholder: 'пр. од 50.000 до 100.000 денари, над 500.000 денари',
      required: false,
      helpText: 'Наведете го очекуваниот опсег на вредност на договорот што ќе се посредува. Ова влијае на пресметката на провизијата и е корисно за определување на обемот на работа.'
    },

    // ===== STEP 4: FINANCIAL TERMS =====
    commissionRate: {
      name: 'commissionRate',
      type: 'number',
      label: 'Стапка на провизија (%)',
      placeholder: 'пр. 5',
      required: true,
      min: 0.1,
      max: 50,
      step: 0.1,
      helpText: 'Согласно членови 878-879 од ЗОО, внесете ја стапката на провизија во проценти (0.1% - 50%). Посредникот има право на надоместок дури и кога тоа не е договорено, но препорачуваме прецизно утврдување.'
    },
    commissionCalculation: {
      name: 'commissionCalculation',
      type: 'select',
      label: 'Начин на пресметка на провизија',
      options: [
        { value: '', label: 'Изберете начин на пресметка' },
        { value: 'Процент од вредноста на договорот', label: 'Процент од вредноста на договорот' },
        { value: 'Фиксен износ', label: 'Фиксен износ' },
        { value: 'Комбинирано (процент + фиксен)', label: 'Комбинирано (процент + фиксен износ)' },
        { value: 'Прогресивна стапка', label: 'Прогресивна стапка според вредност' }
      ],
      required: true,
      helpText: 'Изберете го начинот на пресметка на провизијата. Согласно член 878 од ЗОО, провизијата обично се определува во процент од вредноста на договорот или како фиксен износ.'
    },
    fixedCommissionAmount: {
      name: 'fixedCommissionAmount',
      type: 'number',
      label: 'Фиксен износ на провизија (денари)',
      placeholder: 'пр. 10000',
      required: false,
      conditional: { field: 'commissionCalculation', value: 'Фиксен износ' },
      min: 0,
      helpText: 'Ако е избрана фиксна провизија, внесете го точниот износ во денари. Овој износ се плаќа независно од вредноста на посредуваниот договор.'
    },
    minimumCommission: {
      name: 'minimumCommission',
      type: 'number',
      label: 'Минимална провизија (денари) (опционо)',
      placeholder: 'пр. 5000',
      required: false,
      min: 0,
      helpText: 'Можете да утврдите минимален износ на провизија. Ова гарантира дека посредникот ќе добие барем овој износ, дури и ако процентот дава помал износ.'
    },
    maximumCommission: {
      name: 'maximumCommission',
      type: 'number',
      label: 'Максимална провизија (денари) (опционо)',
      placeholder: 'пр. 100000',
      required: false,
      min: 0,
      helpText: 'Можете да утврдите максимален износ на провизија. Ова ограничува колку посредникот може да наплати, дури и ако процентот дава поголем износ.'
    },
    paymentTiming: {
      name: 'paymentTiming',
      type: 'select',
      label: 'Време на плаќање на провизијата',
      options: [
        { value: '', label: 'Изберете време на плаќање' },
        { value: 'Веднаш по склучување на договорот', label: 'Веднаш по склучување на договорот' },
        { value: 'По потпишување на договорот', label: 'По потпишување на договорот' },
        { value: 'По исполнување на договорот', label: 'По исполнување на договорот' },
        { value: 'Во рок од 7 дена по склучување', label: 'Во рок од 7 дена по склучување' },
        { value: 'Во рок од 15 дена по склучување', label: 'Во рок од 15 дена по склучување' },
        { value: 'Во рок од 30 дена по склучување', label: 'Во рок од 30 дена по склучување' }
      ],
      required: true,
      helpText: 'Согласно член 878 од ЗОО, правото на провизија настанува со склучување на договорот. Прецизирајте кога точно ќе се изврши плаќањето на провизијата.'
    },

    // Cost Reimbursement
    costReimbursement: {
      name: 'costReimbursement',
      type: 'checkbox',
      label: 'Надомест на трошоци за посредникот',
      required: false,
      helpText: 'Согласно член 880 од ЗОО, трошоците се надоместуваат само ако е тоа договорено. Штиклирајте ако посредникот има право на надомест на трошоци покрај провизијата.'
    },
    travelCostsIncluded: {
      name: 'travelCostsIncluded',
      type: 'checkbox',
      label: 'Вклучени патни трошоци',
      required: false,
      conditional: { field: 'costReimbursement', value: true },
      helpText: 'Штиклирајте ако надоместокот опфаќа патни трошоци (превоз, гориво, паркинг) што посредникот ги прави при извршување на услугите.'
    },
    advertisementCostsIncluded: {
      name: 'advertisementCostsIncluded',
      type: 'checkbox',
      label: 'Вклучени трошоци за рекламирање',
      required: false,
      conditional: { field: 'costReimbursement', value: true },
      helpText: 'Штиклирајте ако надоместокот опфаќа трошоци за рекламирање, маркетинг и промоција на предметот на посредување.'
    },
    legalConsultationCostsIncluded: {
      name: 'legalConsultationCostsIncluded',
      type: 'checkbox',
      label: 'Вклучени трошоци за правни консултации',
      required: false,
      conditional: { field: 'costReimbursement', value: true },
      helpText: 'Штиклирајте ако надоместокот опфаќа трошоци за правни консултации и советување поврзани со посредувањето.'
    },

    // ===== STEP 5: LEGAL TERMS =====
    confidentialityPeriod: {
      name: 'confidentialityPeriod',
      type: 'select',
      label: 'Период на доверливост',
      options: [
        { value: '', label: 'Изберете период' },
        { value: '1 година', label: '1 година' },
        { value: '2 години', label: '2 години' },
        { value: '3 години', label: '3 години (препорачано)' },
        { value: '5 години', label: '5 години' },
        { value: 'Неограничено', label: 'Неограничено време' }
      ],
      required: true,
      helpText: 'Согласно член 876 од ЗОО, посредникот мора да ги чува како строго доверливи сите информации добиени од налогодавецот. Изберете го периодот на доверливост по истекот на договорот.'
    },
    mediatorDiaryRequired: {
      name: 'mediatorDiaryRequired',
      type: 'checkbox',
      label: 'Дневник на посредување (законски задолжително)',
      required: false,
      defaultValue: true,
      helpText: 'Согласно член 877 од ЗОО, посредникот е ЗАКОНСКИ ОБВРЗАН да води дневник на посредување и да издава потврди за извршените активности. Ова поле е штиклирано стандардно и не се препорачува неговото исклучување.'
    },
    writtenAuthorizationForPerformance: {
      name: 'writtenAuthorizationForPerformance',
      type: 'checkbox',
      label: 'Писмено овластување за примање исполнување',
      required: false,
      helpText: 'Согласно член 871 од ЗОО, штиклирајте ако посредникот има писмено овластување да прима исполнување во име на налогодавецот. Без ова овластување, посредникот нема право да прима исполнување.'
    },
    exclusiveMediation: {
      name: 'exclusiveMediation',
      type: 'checkbox',
      label: 'Ексклузивно посредување',
      required: false,
      helpText: 'Штиклирајте ако посредникот работи исклучиво за овој налогодавец во рамките на договорениот предмет. Ова значи дека посредникот не смее да работи за конкуренти или на слични предмети.'
    },
    dualRepresentationAllowed: {
      name: 'dualRepresentationAllowed',
      type: 'checkbox',
      label: 'Дозволено двојно застапување',
      required: false,
      helpText: 'Согласно член 881 од ЗОО, штиклирајте ако посредникот може да ги застапува двете страни во истата трансакција. Во тој случай, провизијата се дели попола помеѓу страните.'
    },
    earlyTerminationNoticePeriod: {
      name: 'earlyTerminationNoticePeriod',
      type: 'select',
      label: 'Период на известување за предвремено раскинување',
      options: [
        { value: '', label: 'Изберете период' },
        { value: 'Без известување', label: 'Без известување (во секое време)' },
        { value: '7 дена', label: '7 дена' },
        { value: '15 дена', label: '15 дена' },
        { value: '30 дена', label: '30 дена' },
        { value: '60 дена', label: '60 дена' }
      ],
      required: true,
      helpText: 'Согласно член 872 од ЗОО, налогодавецот може да го отповика налогот во секое време. Изберете го периодот на известување што треба да се даде пред раскинувањето (ако е применливо).'
    },
    disputeResolution: {
      name: 'disputeResolution',
      type: 'select',
      label: 'Начин на решавање на спорови',
      options: [
        { value: '', label: 'Изберете начин' },
        { value: 'Суд во Скопје', label: 'Надлежен суд во Скопје' },
        { value: 'Стопанска комора - Арбитража', label: 'Арбитража при Стопанска комора' },
        { value: 'Медијација пред судски постапки', label: 'Медијација пред судски постапки' },
        { value: 'Месно надлежен суд', label: 'Месно надлежен суд според седиштето' }
      ],
      required: true,
      helpText: 'Изберете како ќе се решаваат евентуалните спорови што произлегуваат од договорот. Применливо е законодавството на РСМ, особено членови 869-882 од Законот за облигациони односи.'
    }
  },

  // Initial form data
  initialFormData: {
    agreementDate: '',
    userRole: '',
    clientType: '',
    clientTypeForMediator: '',

    // Mediator fields (when user is client)
    mediatorCompanyName: '',
    mediatorCompanyAddress: '',
    mediatorCompanyTaxNumber: '',
    mediatorCompanyManager: '',
    mediatorCompanyPhone: '',
    mediatorCompanyEmail: '',

    // Client natural person fields (when user is mediator)
    naturalClientName: '',
    naturalClientAddress: '',
    naturalClientPin: '',
    naturalClientPhone: '',
    naturalClientEmail: '',

    // Client legal entity fields (when user is mediator)
    legalClientName: '',
    legalClientAddress: '',
    legalClientTaxNumber: '',
    legalClientManager: '',
    legalClientPhone: '',
    legalClientEmail: '',

    // User's own company contact fields
    mediatorPhone: '',
    mediatorEmail: '',
    clientPhone: '',
    clientEmail: '',

    // Mediation subject
    agreementDuration: '',
    territoryScope: 'Република Северна Македонија',
    typeOfMediation: 'Продажба на недвижен имот',
    specificContractType: '',
    targetContractValueRange: '',

    // Financial terms
    commissionRate: '',
    commissionCalculation: 'Процент од вредноста на договорот',
    fixedCommissionAmount: '',
    minimumCommission: '',
    maximumCommission: '',
    paymentTiming: 'По исполнување на договорот',

    // Cost reimbursement
    costReimbursement: false,
    travelCostsIncluded: false,
    advertisementCostsIncluded: false,
    legalConsultationCostsIncluded: false,

    // Legal terms
    confidentialityPeriod: '3 години',
    mediatorDiaryRequired: true,
    writtenAuthorizationForPerformance: false,
    exclusiveMediation: false,
    dualRepresentationAllowed: false,
    earlyTerminationNoticePeriod: 'Без известување',
    disputeResolution: 'Суд во Скопје'
  },

  // Validation rules
  validationRules: [
    // Step 1: Basic Information
    { field: 'agreementDate', type: VALIDATION_TYPES.REQUIRED, label: 'Датум на договор' },
    { field: 'agreementDate', type: VALIDATION_TYPES.DATE, label: 'Датум на договор' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED, label: 'Ваша улога' },

    // Step 2: Party Information
    // Client type required when user is client
    { field: 'clientType', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Тип на компанија', condition: { field: 'userRole', value: 'client' } },

    // Mediator company fields (when user is client)
    { field: 'mediatorCompanyName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyTaxNumber', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Даночен број на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyManager', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Управител на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyPhone', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Телефон на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyEmail', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Е-пошта на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-пошта на посредник' },

    // Client type selection for mediator
    { field: 'clientTypeForMediator', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Тип на налогодавец', condition: { field: 'userRole', value: 'mediator' } },

    // Natural client validations (when user is mediator)
    { field: 'naturalClientName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на налогодавец', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на налогодавец', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientPin', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'ЕМБГ на налогодавец', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientPin', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на налогодавец' },
    { field: 'naturalClientPhone', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Телефон на налогодавец', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientEmail', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Е-пошта на налогодавец', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-пошта на налогодавец' },

    // Legal client validations (when user is mediator)
    { field: 'legalClientName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на налогодавец компанија', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на налогодавец компанија', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientTaxNumber', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Даночен број на налогодавец', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientManager', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Управител на налогодавец', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientPhone', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Телефон на налогодавец', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientEmail', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Е-пошта на налогодавец', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-пошта на налогодавец' },

    // User's own company contact fields
    { field: 'mediatorPhone', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Телефон на вашата компанија', condition: { field: 'userRole', value: 'mediator' } },
    { field: 'mediatorEmail', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Е-пошта на вашата компанија', condition: { field: 'userRole', value: 'mediator' } },
    { field: 'mediatorEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-пошта на вашата компанија' },
    { field: 'clientPhone', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Телефон на вашата компанија', condition: { field: 'userRole', value: 'client' } },
    { field: 'clientEmail', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Е-пошта на вашата компанија', condition: { field: 'userRole', value: 'client' } },
    { field: 'clientEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-пошта на вашата компанија' },

    // Step 3: Mediation Subject
    { field: 'agreementDuration', type: VALIDATION_TYPES.REQUIRED, label: 'Времетраење на договорот' },
    { field: 'territoryScope', type: VALIDATION_TYPES.REQUIRED, label: 'Територијален опсег' },
    { field: 'typeOfMediation', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на посредување' },
    { field: 'specificContractType', type: VALIDATION_TYPES.REQUIRED, label: 'Специфичен тип на договор' },

    // Step 4: Financial Terms
    { field: 'commissionRate', type: VALIDATION_TYPES.REQUIRED, label: 'Стапка на провизија' },
    { field: 'commissionRate', type: VALIDATION_TYPES.NUMBER, label: 'Стапка на провизија' },
    { field: 'commissionCalculation', type: VALIDATION_TYPES.REQUIRED, label: 'Начин на пресметка' },
    { field: 'fixedCommissionAmount', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Фиксен износ', condition: { field: 'commissionCalculation', value: 'Фиксен износ' } },
    { field: 'fixedCommissionAmount', type: VALIDATION_TYPES.NUMBER, label: 'Фиксен износ' },
    { field: 'minimumCommission', type: VALIDATION_TYPES.NUMBER, label: 'Минимална провизија' },
    { field: 'maximumCommission', type: VALIDATION_TYPES.NUMBER, label: 'Максимална провизија' },
    { field: 'paymentTiming', type: VALIDATION_TYPES.REQUIRED, label: 'Време на плаќање' },

    // Step 5: Legal Terms
    { field: 'confidentialityPeriod', type: VALIDATION_TYPES.REQUIRED, label: 'Период на доверливост' },
    { field: 'earlyTerminationNoticePeriod', type: VALIDATION_TYPES.REQUIRED, label: 'Период на известување' },
    { field: 'disputeResolution', type: VALIDATION_TYPES.REQUIRED, label: 'Решавање на спорови' }
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId, formData = {}) => {
  const fieldsByStep = {
    1: ['agreementDate', 'userRole'],
    2: [],
    3: ['agreementDuration', 'territoryScope', 'typeOfMediation', 'specificContractType', 'targetContractValueRange'],
    4: ['commissionRate', 'commissionCalculation', 'fixedCommissionAmount', 'minimumCommission', 'maximumCommission', 'paymentTiming', 'costReimbursement', 'travelCostsIncluded', 'advertisementCostsIncluded', 'legalConsultationCostsIncluded'],
    5: ['confidentialityPeriod', 'mediatorDiaryRequired', 'writtenAuthorizationForPerformance', 'exclusiveMediation', 'dualRepresentationAllowed', 'earlyTerminationNoticePeriod', 'disputeResolution']
  };

  // Dynamic step 2 fields based on user role
  if (stepId === 2) {
    if (formData.userRole === 'client') {
      // Add client type selection first
      fieldsByStep[2].push('clientType');
      // Add mediator company fields
      fieldsByStep[2].push('mediatorCompanyName', 'mediatorCompanyAddress', 'mediatorCompanyTaxNumber', 'mediatorCompanyManager', 'mediatorCompanyPhone', 'mediatorCompanyEmail');
      // Add user's own contact fields
      fieldsByStep[2].push('clientPhone', 'clientEmail');
    } else if (formData.userRole === 'mediator') {
      // Add client type selection
      fieldsByStep[2].push('clientTypeForMediator');
      // Add client fields based on client type
      if (formData.clientTypeForMediator === 'natural') {
        fieldsByStep[2].push('naturalClientName', 'naturalClientAddress', 'naturalClientPin', 'naturalClientPhone', 'naturalClientEmail');
      } else if (formData.clientTypeForMediator === 'legal') {
        fieldsByStep[2].push('legalClientName', 'legalClientAddress', 'legalClientTaxNumber', 'legalClientManager', 'legalClientPhone', 'legalClientEmail');
      }
      // Add user's own contact fields
      fieldsByStep[2].push('mediatorPhone', 'mediatorEmail');
    }
  }

  return fieldsByStep[stepId]?.map(fieldName => mediationAgreementConfig.fields[fieldName]).filter(Boolean) || [];
};
