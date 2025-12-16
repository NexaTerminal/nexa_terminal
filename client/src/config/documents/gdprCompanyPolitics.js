const gdprCompanyPoliticsConfig = {
  documentName: 'Политика за администрирање со правата на субјектите на персонални податоци',
  documentType: 'gdprCompanyPolitics',
  endpoint: '/auto-documents/gdpr-company-politics',
  category: 'personalDataProtection',
  description: 'Комплетна политика за администрирање со правата на субјектите на персонални податоци според ЗЗЛП со прилагодување според дејноста на компанијата.',
  apiEndpoint: 'gdpr-company-politics',

  isMultiStep: true,
  steps: [
    {
      id: 'companyProcessing',
      title: 'Основи на обработка',
      description: 'Основни информации за обработката на податоци во вашата компанија'
    },
    {
      id: 'dataTypesRights',
      title: 'Типови податоци и права',
      description: 'Категории податоци кои ги обработувате и права кои ги обезбедувате'
    },
    {
      id: 'submissionProcedures',
      title: 'Постапки за поднесување',
      description: 'Начини на кои субјектите можат да поднесуваат барања'
    },
    {
      id: 'contactInfo',
      title: 'Контакт информации',
      description: 'ОФЗЛП информации и контакт детали'
    },
    {
      id: 'implementation',
      title: 'Имплементација и усогласеност',
      description: 'Обука, мониторинг и ажурирање на политиката'
    }
  ],

  fields: {
    // Basic document information
    adoptionDate: {
      name: 'adoptionDate',
      type: 'date',
      label: 'Датум на усвојување на политиката',
      step: 'companyProcessing',
      required: false,
      helpText: 'Внесете го датумот кога политиката е официјално усвоена од компанијата. Ако не се внесе датум, автоматски ќе се користи денешниот датум. Датумот се користи во правната основа на документот.'
    },

    companyEmail: {
      name: 'companyEmail',
      type: 'email',
      label: 'Контакт е-пошта за ЗЗЛП барања',
      step: 'contactInfo',
      required: false,
      helpText: 'Внесете ја е-поштата каде што субјектите можат да поднесуваат барања за остварување на правата. Ако не се внесе, ќе се користи општ пример формат.'
    },

    companyDPO: {
      name: 'companyDPO',
      type: 'text',
      label: 'Име на ОФЗЛП (Офицер за заштита на лични податоци)',
      step: 'contactInfo',
      dependsOn: { field: 'hasDedicatedDPO', value: true },
      helpText: 'Внесете го целото име на ОФЗЛП. Според член 37 од ЗЗЛП, ОФЗЛП мора да има соодветна стручност и да биде достапен за контакт со субјектите на податоци.'
    },

    companyDPOemail: {
      name: 'companyDPOemail',
      type: 'email',
      label: 'Е-пошта на ОФЗЛП',
      step: 'contactInfo',
      dependsOn: { field: 'hasDedicatedDPO', value: true },
      helpText: 'Внесете ја е-поштата на ОФЗЛП. Ова е директниот контакт за прашања поврзани со заштита на лични податоци и е задолжителен според член 38 од ЗЗЛП.'
    },

    companyDPOphone: {
      name: 'companyDPOphone',
      type: 'text',
      label: 'Телефонски број на ОФЗЛП',
      step: 'contactInfo',
      dependsOn: { field: 'hasDedicatedDPO', value: true },
      helpText: 'Внесете го телефонскиот број на ОФЗЛП во формат +389 XX XXX XXX. Телефонскиот контакт е важен за итни случаи и брза комуникација со субјектите.'
    },

    // Step 1: Company Processing Basics
    primaryBusinessActivity: {
      name: 'primaryBusinessActivity',
      type: 'select',
      label: 'Примарна деловна активност',
      step: 'companyProcessing',
      required: true,
      options: [
        { value: 'Трговија и услуги', label: 'Трговија и услуги' },
        { value: 'Производство', label: 'Производство' },
        { value: 'Финансиски услуги', label: 'Финансиски услуги' },
        { value: 'Здравствени услуги', label: 'Здравствени услуги' },
        { value: 'Образование', label: 'Образование' },
        { value: 'ИТ и технологија', label: 'ИТ и технологија' },
        { value: 'Човечки ресурси', label: 'Човечки ресурси' },
        { value: 'Маркетинг и реклами', label: 'Маркетинг и реклами' }
      ],
      helpText: 'Изберете ја примарната деловна активност на вашата компанија. Ова ќе влијае на содржината на политиката и специфичните барања за вашиот сектор според ЗЗЛП.'
    },

    dataProcessingComplexity: {
      name: 'dataProcessingComplexity',
      type: 'select',
      label: 'Сложеност на обработка на податоци',
      step: 'companyProcessing',
      required: true,
      options: [
        { value: 'Едноставно', label: 'Едноставно (основни контакт податоци)' },
        { value: 'Средно', label: 'Средно (клиентски профили и историја)' },
        { value: 'Комплексно', label: 'Комплексно (аналитика и профилирање)' },
        { value: 'Високо комплексно', label: 'Високо комплексно (автоматски одлуки и специјални податоци)' }
      ],
      helpText: 'Оценете ја сложеноста на обработката на податоци во вашата компанија. Ова влијае на рок овите за одговор и заштитните мерки кои мора да се применат според Правилникот 266/24.'
    },

    processesSpecialCategories: {
      name: 'processesSpecialCategories',
      type: 'checkbox',
      label: 'Обработувам специјални категории персонални податоци',
      step: 'companyProcessing',
      helpText: 'Означете доколку обработувате специјални категории како што се здравствени, биометриски, генетски податоци или податоци за политички мислења. За овие податоци се применуваат засилени заштитни мерки според член 9 од ЗЗЛП.'
    },

    usesAutomatedDecisionMaking: {
      name: 'usesAutomatedDecisionMaking',
      type: 'checkbox',
      label: 'Користам автоматизирано донесување одлуки',
      step: 'companyProcessing',
      helpText: 'Означете доколку користите автоматизирани системи за донесување одлуки кои влијаат на поединци (кредитни одлуки, вработување, ценовни одлуки). Според член 22 од ЗЗЛП, субјектите имаат право на човечка интервенција.'
    },

    performsDirectMarketing: {
      name: 'performsDirectMarketing',
      type: 'checkbox',
      label: 'Извршувам директни маркетиншки активности',
      step: 'companyProcessing',
      helpText: 'Означете доколку извршувате директен маркетинг преку е-маил, SMS, телефонски повици или пошта. За директен маркетинг субјектите имаат апсолутно право на приговор според член 21 од ЗЗЛП.'
    },

    hasInternationalTransfers: {
      name: 'hasInternationalTransfers',
      type: 'checkbox',
      label: 'Извршувам меѓународни трансфери на podatоци',
      step: 'companyProcessing',
      helpText: 'Означете доколку трансферирате персонални податоци надвор од Северна Македонија или ЕУ. За меѓународните трансфери мора да имате соодветни заштитни мерки според глава V од ЗЗЛП.'
    },

    // Step 2: Data Types & Rights Configuration
    personalDataCategories: {
      name: 'personalDataCategories',
      type: 'multiSelect',
      label: 'Категории персонални податоци',
      step: 'dataTypesRights',
      required: true,
      options: [
        { value: 'Основни идентификациски', label: 'Основни идентификациски податоци' },
        { value: 'Финансиски', label: 'Финансиски податоци' },
        { value: 'Здравствени', label: 'Здравствени податоци' },
        { value: 'Биометриски', label: 'Биометриски податоци' },
        { value: 'Локациски', label: 'Локациски податоци' },
        { value: 'Онлајн идентификатори', label: 'Онлајн идентификатори' },
        { value: 'Професионални', label: 'Професионални податоци' }
      ],
      helpText: 'Изберете ги сите категории персонални податоци кои ги обработува вашата компанија. Ова е битно за дефинирање на точните права кои ќе им се обезбедат на субјектите според член 13-14 од ЗЗЛП.'
    },

    sensitiveDataProcessing: {
      name: 'sensitiveDataProcessing',
      type: 'multiSelect',
      label: 'Специјални категории податоци (доколку се обработуваат)',
      step: 'dataTypesRights',
      dependsOn: { field: 'processesSpecialCategories', value: true },
      options: [
        { value: 'Здравствени информации', label: 'Здравствени информации' },
        { value: 'Биометриски податоци', label: 'Биометриски податоци' },
        { value: 'Генетски податоци', label: 'Генетски податоци' },
        { value: 'Политички мислења', label: 'Политички мислења' },
        { value: 'Верски уверувања', label: 'Верски уверувања' },
        { value: 'Сексуален живот', label: 'Сексуален живот и ориентација' },
        { value: 'Криминални осуди', label: 'Криминални осуди и прекршоци' }
      ],
      helpText: 'Изберете ги специјалните категории податоци доколку ги обработувате. За овие податоци се потребни дополнителни заштитни мерки и експлицитна согласност според член 9 од ЗЗЛП.'
    },

    dataPortabilityApplicable: {
      name: 'dataPortabilityApplicable',
      type: 'checkbox',
      label: 'Правото на портабилност е применливо',
      step: 'dataTypesRights',
      helpText: 'Означете доколку обработувате податоци врз основа на согласност или договор и на автоматизиран начин. Во овој случај, субјектите имаат право да ги добијат податоцие во структуриран формат според член 20 од ЗЗЛП.'
    },

    sharesDataWithThirdParties: {
      name: 'sharesDataWithThirdParties',
      type: 'checkbox',
      label: 'Споделувам податоци со трети страни',
      step: 'dataTypesRights',
      helpText: 'Означете доколку споделувате персонални податоци со други компании, институции или провајдери. Ова создава обврска за известување на третите страни за промени според член 19 од ЗЗЛП.'
    },

    typicalDataRecipients: {
      name: 'typicalDataRecipients',
      type: 'multiSelect',
      label: 'Типични реципиенти на податоци',
      step: 'dataTypesRights',
      dependsOn: { field: 'sharesDataWithThirdParties', value: true },
      options: [
        { value: 'ИТ провајдери', label: 'ИТ провајдери' },
        { value: 'Сметководители', label: 'Сметководители' },
        { value: 'Правни советници', label: 'Правни советници' },
        { value: 'Маркетиншки агенции', label: 'Маркетиншки агенции' },
        { value: 'Логистички партнери', label: 'Логистички партнери' },
        { value: 'Финансиски институции', label: 'Финансиски институции' },
        { value: 'Владини органи', label: 'Владини органи' }
      ],
      helpText: 'Изберете ги типичните реципиенти со кои споделувате податоци. Ова ќе се вклучи во политиката за транспарентност кон субјектите на податоци според член 13-14 од ЗЗЛП.'
    },

    // Step 3: Submission & Response Procedures
    allowEmailSubmission: {
      name: 'allowEmailSubmission',
      type: 'checkbox',
      label: 'Дозволувам поднесување преку е-пошта',
      step: 'submissionProcedures',
      helpText: 'Означете доколку субјектите можат да поднесуваат барања преку електронска пошта. Ова е најчест и најефикасен начин за комуникација со субјектите на податоци.'
    },

    allowPostalSubmission: {
      name: 'allowPostalSubmission',
      type: 'checkbox',
      label: 'Дозволувам поднесување преку пошта',
      step: 'submissionProcedures',
      helpText: 'Означете доколку прифаќате барања испратени преку регуларна или препорачана пошта. Ова е важно за субјекти кои немаат пристап до дигитални канали.'
    },

    allowInPersonSubmission: {
      name: 'allowInPersonSubmission',
      type: 'checkbox',
      label: 'Дозволувам лично поднесување',
      step: 'submissionProcedures',
      helpText: 'Означете доколку субјектите можат лично да дојдат во вашите канцеларии за поднесување на барања. Ова е корисно за комплексни барања или кога е потребна дополнителна верификација.'
    },

    allowOnlinePortalSubmission: {
      name: 'allowOnlinePortalSubmission',
      type: 'checkbox',
      label: 'Дозволувам поднесување преку онлајн портал',
      step: 'submissionProcedures',
      helpText: 'Означете доколку имате специјален онлајн портал или систем за поднесување на барања. Ова обезбедува структуриран и автоматизиран процес на прием на барања.'
    },

    identityVerificationLevel: {
      name: 'identityVerificationLevel',
      type: 'select',
      label: 'Ниво на верификација на идентитет',
      step: 'submissionProcedures',
      required: true,
      options: [
        { value: 'Основно', label: 'Основно (само име и адреса)' },
        { value: 'Стандардно', label: 'Стандардно (ID документ за сите барања)' },
        { value: 'Засилено', label: 'Засилено (нотаризирана документација за специјални податоци)' },
        { value: 'Максимално', label: 'Максимално (лична верификација за сите барања)' }
      ],
      helpText: 'Изберете го нивото на верификација на идентитетот. Повисокото ниво обезбедува подобра заштита, но може да создаде пречки за субјектите. Мора да биде пропорционално со ризикот според член 25 од ЗЗЛП.'
    },

    standardResponseTime: {
      name: 'standardResponseTime',
      type: 'select',
      label: 'Стандардно време за одговор',
      step: 'submissionProcedures',
      required: true,
      options: [
        { value: '15 дена', label: '15 дена (за сите барања)' },
        { value: '30 дена', label: '30 дена (за сите барања)' },
        { value: 'Варијабилно според типот', label: 'Варијабилно според типот (15-30 дена)' }
      ],
      helpText: 'Изберете го стандардното време за одговор на барањата. Законот дозволува до 30 дена, а за исправки до 15 дена. Пократкото време покажува поголема посветеност на заштитата на податоци.'
    },

    complexRequestExtension: {
      name: 'complexRequestExtension',
      type: 'checkbox',
      label: 'Дозволувам продолжување за комплексни барања',
      step: 'submissionProcedures',
      helpText: 'Означете доколку за комплексни барања може да се продолжи рокот за дополнителни 30-60 дена. Ова е дозволено според член 12 од ЗЗЛП, но мора да се извести субјектот за причините.'
    },

    // Step 4: Contact & DPO Information
    hasDedicatedDPO: {
      name: 'hasDedicatedDPO',
      type: 'checkbox',
      label: 'Имам назначено Офицер за заштита на лични податоци (ОФЗЛП)',
      step: 'contactInfo',
      helpText: 'Означете доколку имате назначено ОФЗЛП. Според член 37 од ЗЗЛП, одредени организации мора задолжително да назначат ОФЗЛП (јавни органи, обработка во голем обем, специјални категории).'
    },

    dpoIsInternal: {
      name: 'dpoIsInternal',
      type: 'radio',
      label: 'ОФЗЛП е интерен вработен',
      step: 'contactInfo',
      dependsOn: { field: 'hasDedicatedDPO', value: true },
      options: [
        { value: true, label: 'Да, интерен вработен' },
        { value: false, label: 'Не, надворешен консултант' }
      ],
      helpText: 'Изберете дали ОФЗЛП е вработен во компанијата или е надворешен консултант. И двете опции се валидни според член 37 од ЗЗЛП, важно е да има потребната стручност и независност.'
    },

    responsibleDepartment: {
      name: 'responsibleDepartment',
      type: 'select',
      label: 'Одговорен оддел/лице',
      step: 'contactInfo',
      required: true,
      options: [
        { value: 'Правен оддел', label: 'Правен оддел' },
        { value: 'Човечки ресурси', label: 'Човечки ресурси' },
        { value: 'ИТ оддел', label: 'ИТ оддел' },
        { value: 'Административен оддел', label: 'Административен оддел' },
        { value: 'Посебен оддел за приватност', label: 'Посебен оддел за приватност' },
        { value: 'Раководство', label: 'Раководство' }
      ],
      helpText: 'Изберете го одделот или лицето одговорно за обработка на барањата на субјектите. Ова лице/оддел мора да биде обучено за ЗЗЛП барањата и да има овластување за дејствување.'
    },

    businessHours: {
      name: 'businessHours',
      type: 'select',
      label: 'Работно време за контакт',
      step: 'contactInfo',
      options: [
        { value: '08:00-16:00, понеделник-петок', label: '08:00-16:00, понеделник-петок' },
        { value: '09:00-17:00, понеделник-петок', label: '09:00-17:00, понеделник-петок' },
        { value: 'Прошири викенди', label: 'Понеделник-петок + викенди' },
        { value: '24/7 за итни случаи', label: '24/7 достапност за итни случаи' }
      ],
      helpText: 'Изберете го работното време кога субјектите можат да ве контактираат. Јасното дефинирање на работното време помага во управувањето на очекувањата на субјектите.'
    },

    preferredContactLanguages: {
      name: 'preferredContactLanguages',
      type: 'multiSelect',
      label: 'Јазици за комуникација',
      step: 'contactInfo',
      options: [
        { value: 'Македонски', label: 'Македонски' },
        { value: 'Албански', label: 'Албански' },
        { value: 'Англиски', label: 'Англиски' },
        { value: 'Српски', label: 'Српски' }
      ],
      helpText: 'Изберете ги јазиците на кои можете да комуницирате со субјектите. Македонскиот јазик е задолжителен, додатните јазици ја подобруваат достапноста на услугите.'
    },

    // Step 5: Implementation & Compliance
    usesCentralizedRegistry: {
      name: 'usesCentralizedRegistry',
      type: 'checkbox',
      label: 'Користам централизиран регистар за барања',
      step: 'implementation',
      helpText: 'Означете доколку водите централизиран регистар на сите барања од субјектите. Ова е препорачана пракса за следење на роковите и обезбедување отчетност според принципот од член 5 од ЗЗЛП.'
    },

    staffTrainingLevel: {
      name: 'staffTrainingLevel',
      type: 'select',
      label: 'Ниво на едукација на персоналот',
      step: 'implementation',
      required: true,
      options: [
        { value: 'Основна едукација', label: 'Основна едукација за клучни лица' },
        { value: 'Редовни обуки', label: 'Редовни обуки за сите вработени' },
        { value: 'Специјализирани обуки', label: 'Специјализирани обуки по одделения' },
        { value: 'Сертифицирани обуки', label: 'Сертифицирани GDPR обуки' }
      ],
      helpText: 'Изберете го нивото на едукација за заштита на податоци. Соодветната обука е клучна за успешна имплементација на политиката и усогласеност со член 32 од ЗЗЛП за безбедност.'
    },

    policyUpdateFrequency: {
      name: 'policyUpdateFrequency',
      type: 'select',
      label: 'Честота на ажурирање на политиката',
      step: 'implementation',
      required: true,
      options: [
        { value: 'Годишно', label: 'Годишно' },
        { value: 'На секои 2 години', label: 'На секои 2 години' },
        { value: 'При промена на законодавство', label: 'При промени во законодавството' },
        { value: 'При промени во работењето', label: 'При значајни промени во работењето' }
      ],
      helpText: 'Изберете колку често ќе ја ревидирате и ажурирате политиката. Редовното ажурирање обезбедува усогласеност со новите законски барања и промени во работењето на компанијата.'
    },

    complianceMonitoring: {
      name: 'complianceMonitoring',
      type: 'select',
      label: 'Мониторинг на усогласеноста',
      step: 'implementation',
      required: true,
      options: [
        { value: 'Самооценување', label: 'Самооценување од интерен персонал' },
        { value: 'Интерни проверки', label: 'Редовни интерни проверки' },
        { value: 'Надворешни аудити', label: 'Надворешни GDPR аудити' },
        { value: 'Континуиран мониторинг', label: 'Континуиран мониторинг со софтвер' }
      ],
      helpText: 'Изберете го начинот на мониторинг на усогласеноста со политиката и ЗЗЛП. Редовниот мониторинг е дел од принципот на отчетност и помага во превенција на прекршоци.'
    },

    // Conditional fields for marketing activities
    marketingChannels: {
      name: 'marketingChannels',
      type: 'multiSelect',
      label: 'Канали за директен маркетинг',
      step: 'dataTypesRights',
      dependsOn: { field: 'performsDirectMarketing', value: true },
      options: [
        { value: 'Електронска пошта', label: 'Електронска пошта' },
        { value: 'SMS/телефонски повици', label: 'SMS и телефонски повици' },
        { value: 'Директна пошта', label: 'Директна пошта' },
        { value: 'Социјални мрежи', label: 'Социјални мрежи' },
        { value: 'Веб реклами', label: 'Веб реклами' }
      ],
      helpText: 'Изберете ги каналите кои ги користите за директен маркетинг. За секој канал постојат специфични законски барања во ЗЗЛП и Законот за електронски комуникации.'
    },

    // Conditional fields for automated decisions
    automatedDecisionTypes: {
      name: 'automatedDecisionTypes',
      type: 'multiSelect',
      label: 'Типови автоматизирани одлуки',
      step: 'dataTypesRights',
      dependsOn: { field: 'usesAutomatedDecisionMaking', value: true },
      options: [
        { value: 'Кредитни одлуки', label: 'Кредитни одлуки' },
        { value: 'Вработување/селекција', label: 'Вработување и селекција' },
        { value: 'Ценовни одлуки', label: 'Ценовни одлуки' },
        { value: 'Препораки за производи', label: 'Препораки за производи' },
        { value: 'Процена на ризик', label: 'Процена на ризик' },
        { value: 'Фрод детекција', label: 'Детекција на измама' }
      ],
      helpText: 'Изберете ги типовите автоматизирани одлуки кои ги донесувате. За секој тип мора да обезбедите заштитни механизми, право на објаснување и човечка интервенција според член 22 од ЗЗЛП.'
    }
  },

  validation: {
    validateStep: (stepId, formData) => {
      const errors = {};
      const step = gdprCompanyPoliticsConfig.steps.find(s => s.id === stepId);

      // Get fields for current step
      const stepFields = Object.values(gdprCompanyPoliticsConfig.fields)
        .filter(field => field.step === stepId);

      // Validate required fields
      stepFields.forEach(field => {
        if (field.required && (!formData[field.name] || formData[field.name] === '')) {
          errors[field.name] = `${field.label} е задолжително поле`;
        }

        // Special validation for multi-step dependencies
        if (field.dependsOn) {
          const dependencyValue = formData[field.dependsOn.field];
          if (dependencyValue === field.dependsOn.value && field.required &&
              (!formData[field.name] || formData[field.name] === '')) {
            errors[field.name] = `${field.label} е задолжително кога е избрано ${field.dependsOn.field}`;
          }
        }
      });

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    },

    validateComplete: (formData) => {
      let allErrors = {};
      let isCompletelyValid = true;

      // Validate all steps
      gdprCompanyPoliticsConfig.steps.forEach(step => {
        const stepValidation = gdprCompanyPoliticsConfig.validation.validateStep(step.id, formData);
        if (!stepValidation.isValid) {
          isCompletelyValid = false;
          allErrors = { ...allErrors, ...stepValidation.errors };
        }
      });

      // Business logic validation
      if (!formData.allowEmailSubmission && !formData.allowPostalSubmission &&
          !formData.allowInPersonSubmission && !formData.allowOnlinePortalSubmission) {
        allErrors.submissionMethods = 'Мора да изберете најмалку еден начин за поднесување на барања';
        isCompletelyValid = false;
      }

      return {
        isValid: isCompletelyValid,
        errors: allErrors,
        warnings: [],
        missing: []
      };
    }
  }
};

export default gdprCompanyPoliticsConfig;