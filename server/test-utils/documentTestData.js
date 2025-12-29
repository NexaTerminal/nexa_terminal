/**
 * Realistic Test Data for All 40 Automated Documents
 * Includes complete form data with proper Macedonian context
 */

// Common test data patterns
const commonData = {
  employeeNames: ['Марко Петровски', 'Ана Стојановска', 'Горан Николовски'],
  addresses: ['ул. Александар Македонски 15, Скопје', 'ул. Гоце Делчев 23, Битола', 'ул. Климент Охридски 5, Охрид'],
  cities: ['Скопје', 'Битола', 'Охрид', 'Прилеп', 'Тетово'],
  embg: '2305985450012', // Valid 13-digit EMBG
  amounts: ['50.000', '75.500', '120.000'],
  dates: {
    past: '2024-01-15',
    current: '2024-06-15',
    future: '2024-12-31'
  },
  banks: 'Комерцијална банка АД Скопје',
  bankAccount: '200-0000012345678-91'
};

// EMPLOYMENT & HR DOCUMENTS (13)

const testData = {
  // 1. Termination Warning
  'termination-warning': {
    employeeName: 'Марко Петровски',
    jobPosition: 'Административен референт',
    workTaskFailure: 'Недостаток на точност при обработка на документи, повеќекратно доцнење на рокови за завршување на задачи, неточно внесување на податоци',
    employeeWrongDoing: 'Повеќекратно неисполнување на работните обврски согласно Член 25 од Договорот за вработување',
    decisionDate: '2024-06-15',
    fixingDeadline: '2024-07-15'
  },

  // 2. Warning Letter
  'warning-letter': {
    employeeName: 'Ана Стојановска',
    employeeWrongDoing: 'Неовластено отсуство од работа',
    rulesNotRespected: 'Правилник за работа',
    articleNumber: '15'
  },

  // 3. Confirmation of Employment
  'confirmation-of-employment': {
    employeeName: 'Горан Николовски',
    employeePIN: commonData.embg,
    employeeAddress: 'ул. Александар Македонски 15, Скопје',
    jobPosition: 'Маркетинг менаџер',
    agreementDurationType: 'неопределено време'
  },

  // 4. Disciplinary Action
  'disciplinary-action': {
    employeeName: 'Марија Тодорова',
    jobPosition: 'Продажен советник',
    sanctionAmount: '25',
    sanctionPeriod: '3',
    sanctionDate: '2024-06-15',
    workTaskFailure: 'Неисполнување на месечни продажни цели во временски период од 3 месеци',
    employeeWrongDoing: 'Неисполнување на основните работни обврски согласно договорот за вработување',
    employeeWrongdoingDate: '2024-05-15'
  },

  // 5. Employment Agreement
  'employment-agreement': {
    employeeName: 'Дејан Арсовски',
    employeePIN: commonData.embg,
    employeeAddress: 'ул. Партизанска 42, Скопје',
    jobPosition: 'Софтверски инженер',
    workTasks: 'Развој на веб апликации, одржување на постоечки системи, документација',
    education: 'Висока стручна спрема',
    certification: 'Диплома по информатички технологии',
    salary: '80.000',
    probationPeriod: '3',
    annualLeaveDays: '20',
    workingHours: '40',
    agreementDate: '2024-01-15',
    employmentStartDate: '2024-02-01',
    durationType: 'неопределено време',
    hasConcurrentClause: true,
    concurrentDuration: '12',
    concurrentDescription: 'Забрана за работа кај директни конкуренти во истата индустрија'
  },

  // 6. Employment Annex
  'employment-annex': {
    agreementNo: 'ДВ-2024-045',
    annexDate: '2024-06-15',
    employeeName: 'Ивана Костова',
    employeePIN: commonData.embg,
    employeeAddress: 'ул. Илинденска 78, Скопје',
    changeType: 'плата',
    newSalary: '95.000',
    salaryChangeReason: 'Унапредување и зголемување на одговорностите'
  },

  // 7. Termination by Employee Request
  'termination-by-employee-request': {
    employeeName: 'Петар Јованов',
    employeePin: commonData.embg,
    employeeAddress: 'ул. Кеј 13 Ноември 25, Скопје',
    jobPosition: 'Финансиски аналитичар',
    requestDate: '2024-06-01',
    employmentEndDate: '2024-06-30',
    terminationReason: 'Прифаќање на нова работна позиција во друга компанија',
    contractStartDate: '2023-01-15'
  },

  // 8. Termination Personal Reasons
  'termination-personal-reasons': {
    employeeName: 'Елена Ристова',
    employeePin: commonData.embg,
    employeeAddress: 'ул. Партизанска 89, Битола',
    jobPosition: 'HR координатор',
    contractStartDate: '2022-03-01',
    terminationDate: '2024-07-31',
    personalReasonDescription: 'Селидба во друг град поради семејни причини',
    documentDate: '2024-06-15'
  },

  // 9. Termination Due to Age Limit
  'termination-due-to-age-limit': {
    employeeName: 'Благој Тошевски',
    employeePin: commonData.embg,
    decisionDate: '2024-06-15',
    employmentEndDate: '2024-08-31'
  },

  // 10. Termination Due to Fault
  'termination-due-to-fault': {
    employeeName: 'Кристијан Ангеловски',
    employeePin: commonData.embg,
    employeeAddress: 'ул. Кузман Јосифоски 12, Скопје',
    jobPosition: 'Складиштен работник',
    terminationReason: 'article82',
    article82Case: '2',
    documentDate: '2024-06-15',
    terminationDate: '2024-06-15',
    justificationDescription: 'Неовластено присвојување на средства на работодавачот'
  },

  // 11. Termination Decision Due to Duration
  'termination-decision-due-to-duration': {
    employeeName: 'Соња Димитриевска',
    jobPosition: 'Проектен координатор',
    employmentEndDate: '2024-08-31',
    decisionDate: '2024-06-15',
    agreementDate: '2023-09-01'
  },

  // 12. Termination Agreement
  'termination-agreement': {
    employeeName: 'Владимир Тасевски',
    employeePIN: commonData.embg,
    employeeAddress: 'ул. Димитрие Чуповски 34, Скопје',
    endDate: '2024-07-15'
  },

  // 13. Annual Leave Decision
  'annual-leave-decision': {
    employeeName: 'Милена Јовановска',
    employeePosition: 'Сметководител',
    annualLeaveStart: '2024-08-01',
    annualLeaveEnd: '2024-08-20',
    annualLeaveYear: '2024'
  },

  // BONUS & COMPENSATION DOCUMENTS (6)

  // 14. Bonus Payment
  'bonus-payment': {
    employeeName: 'Дарко Стојановски',
    employeeWorkPosition: 'Продажен менаџер',
    bonusAmount: '75.000',
    bonusReason: 'Успешна реализација на годишна продажна цел'
  },

  // 15. Bonus Decision
  'bonus-decision': {
    employeeName: 'Татјана Петрова',
    employeeWorkPosition: 'Тимски координатор',
    bonusAmount: '50.000',
    bonusReason: 'Исклучителни резултати во тековниот квартал'
  },

  // 16. Mandatory Bonus
  'mandatory-bonus': {
    decisionDate: '2024-06-01',
    year: '2024',
    amount: '6.000',
    employeesRepresentative: 'Стевче Илиевски',
    employeeUnion: 'ССМ - Сојуз на синдикатите на Македонија'
  },

  // 17. Annual Leave Bonus
  'annual-leave-bonus': {
    annualLeaveYear: '2024',
    bonusAmount: '8.000',
    paymentDate: '2024-07-15',
    decisionDate: '2024-06-15'
  },

  // 18. Unpaid Leave Decision
  'unpaid-leave-decision': {
    employeeName: 'Игор Миленковски',
    unpaidLeaveDuration: '2',
    startingDate: '2024-07-01'
  },

  // 19. Death Compensation Decision
  'death-compensation-decision': {
    employeeName: 'Весна Ангеловска',
    familyMember: 'сопруг',
    compensationAmount: '150.000',
    decisionDate: '2024-06-15',
    paymentDate: '2024-06-30'
  },

  // CONTRACTS & AGREEMENTS (14)

  // 20. Rent Agreement
  'rent-agreement': {
    contractDate: '2024-06-15',
    contractTown: 'Скопје',
    userRole: 'landlord',
    otherPartyType: 'company',
    otherPartyCompanyName: 'Логистик Солушнс ДООЕЛ',
    otherPartyCompanyAddress: 'ул. Индустриска 45, Скопје',
    otherPartyCompanyTaxNumber: '4080023456789',
    otherPartyCompanyManager: 'Зоран Здравковски',
    propertyAddress: 'ул. Скопска 123, Скопје',
    cadastralParcelNumber: '1234/5',
    cadastralMunicipality: 'Кисела Вода',
    propertySheetNumber: 'ИЛ-678',
    propertySize: '120',
    propertyType: 'деловен простор',
    buildingNumber: '123',
    entrance: 'А',
    floor: '2',
    apartmentNumber: '5',
    specificPurpose: 'канцеларии',
    rentAmount: '25.000',
    rentPaymentDeadline: '5',
    durationType: 'неопределен',
    bankAccount: commonData.bankAccount,
    bankName: commonData.banks,
    propertyPurpose: 'деловен'
  },

  // 21. Vehicle Sale Purchase Agreement
  'vehicle-sale-purchase-agreement': {
    userRole: 'продавач',
    contractDate: '2024-06-15',
    placeOfSigning: 'Скопје',
    competentCourt: 'Основен суд Скопје 1 Скопје',
    otherPartyType: 'физичко лице',
    otherPartyName: 'Томислав Ристевски',
    otherPartyPIN: commonData.embg,
    otherPartyAddress: 'ул. Партизанска 56, Скопје',
    vehicleType: 'патничко возило',
    vehicleBrand: 'Volkswagen Golf 7',
    chassisNumber: 'WVW1234567890123',
    productionYear: '2018',
    registrationNumber: 'SK 1234 АБ',
    price: '650.000',
    paymentMethod: 'еднократно'
  },

  // 22. Mediation Agreement
  'mediation-agreement': {
    agreementDate: '2024-06-15',
    userRole: 'mediator',
    agreementDuration: '12 месеци',
    territoryScope: 'Република Северна Македонија',
    clientTypeForMediator: 'legal',
    legalClientName: 'Трговија Плус ДООЕЛ',
    legalClientAddress: 'ул. Илинденска 89, Скопје',
    legalClientTaxNumber: '4080034567890',
    legalClientManager: 'Бобан Трајковски',
    legalClientPhone: '+389 70 345 678',
    legalClientEmail: 'kontakt@trgovijaplus.mk',
    typeOfMediation: 'commercial',
    specificContractType: 'Комерцијални спорови и преговори',
    commissionRate: '5',
    commissionCalculation: 'percentage',
    paymentTiming: 'after_success',
    confidentialityPeriod: '24 месеци',
    earlyTerminationNoticePeriod: '30 дена',
    disputeResolution: 'mediation'
  },

  // 23. Debt Assumption Agreement
  'debt-assumption-agreement': {
    contractDate: '2024-06-15',
    contractTown: 'Скопје',
    userRole: 'creditor',
    originalDebtorType: 'company',
    originalDebtorCompanyName: 'Градба Инженеринг ДООЕЛ',
    originalDebtorCompanyAddress: 'ул. Партизанска 123, Скопје',
    originalDebtorCompanyTaxNumber: '4080045678901',
    originalDebtorCompanyManager: 'Драган Костовски',
    otherPartyType: 'company',
    assumingPartyCompanyName: 'Финанси Груп ДОО',
    assumingPartyCompanyAddress: 'ул. Даме Груев 45, Скопје',
    assumingPartyCompanyTaxNumber: '4080056789012',
    assumingPartyCompanyManager: 'Никола Петковски',
    debtAmount: '500000',
    debtCurrency: 'МКД',
    debtDescription: 'Неплатени фактури за градежни материјали',
    assumptionType: 'full',
    releaseOriginalDebtor: false
  },

  // 24. SaaS Agreement
  'saas-agreement': {
    agreementDate: '2024-06-15',
    effectiveDateType: 'датум на склучување',
    userRole: 'давател',
    clientName: 'Маркетинг Плус ДООЕЛ',
    clientAddress: 'ул. Скопска 234, Скопје',
    clientTaxNumber: '4080067890123',
    clientManager: 'Андреја Ивановски',
    serviceName: 'Cloud Document Management System',
    serviceDescription: 'Целосно автоматизиран систем за управување со документи во cloud',
    subscriptionFee: '15.000',
    paymentDay: '5',
    bankAccount: commonData.bankAccount,
    bankName: commonData.banks
  },

  // 25. Master Services Agreement
  'master-services-agreement': {
    agreementDate: '2024-06-15',
    effectiveDateType: 'датум на склучување',
    userRole: 'давател',
    clientName: 'Технолошки Решенија ДООЕЛ',
    clientAddress: 'ул. Илинденска 156, Скопје',
    clientTaxNumber: '4080078901234',
    clientManager: 'Весна Костовска',
    serviceType: 'ИТ услуги',
    serviceDescription: 'Информатички услуги вклучувајќи развој на софтвер, систем интеграција, техничка поддршка',
    serviceScope: 'согласно дефинирани SOW документи',
    paymentTerms: 'net 30 денови',
    currency: 'денари',
    paymentMethod: 'банкарски трансфер',
    feeStructure: 'часовна стапка',
    feeAmount: '2.500 денари по час',
    hoursLimit: '160 часа месечно',
    overtimeRate: '1.5x',
    serviceDeliveryTerms: 'според спецификациите во SOW',
    serviceLocation: 'remote и on-site според потреба',
    durationType: 'неопределено',
    terminationNoticePeriod: '30 денови',
    qualityStandards: 'ISO 9001 стандарди за квалитет',
    liabilityLimitType: 'месечен износ'
  },

  // 26. NDA (Non-Disclosure Agreement)
  'nda': {
    agreementDate: '2024-06-15',
    partyType: 'правно лице',
    otherPartyCompanyName: 'Иновации ДООЕЛ',
    otherPartyCompanyAddress: 'ул. Партизанска 200, Скопје',
    otherPartyCompanyTaxNumber: '4080089012345',
    otherPartyCompanyManager: 'Стефан Николовски',
    agreementDuration: '24 месеци'
  },

  // 27-33. Additional contracts continued...
  'employee-damages-statement': {
    employeeName: 'Никола Стојковски',
    employeePIN: commonData.embg,
    employeeAddress: 'ул. Даме Груев 78, Скопје',
    jobPosition: 'Магационер',
    damageDate: '2024-06-01',
    damageDescription: 'Оштетување на палетен виљушкар при товарање',
    damageAmount: '45.000',
    statementDate: '2024-06-15'
  },

  // ORGANIZATIONAL & ADMINISTRATIVE (7)

  // 28. Organization Act
  'organization-act': {
    documentDate: '2024-06-15',
    positions: [
      {
        title: 'Генерален директор',
        reports: 'Собрание на членови',
        responsibilities: 'Целокупно управување со компанијата',
        numberOfEmployees: '1'
      },
      {
        title: 'Финансиски директор',
        reports: 'Генерален директор',
        responsibilities: 'Финансиско управување и сметководство',
        numberOfEmployees: '3'
      }
    ]
  },

  // 29. Invoice Signing Authorization
  'invoice-signing-authorization': {
    articleNumber: '12',
    authorizedPerson: 'Марија Ристовска',
    branchLocation: 'Скопје - централа',
    position: 'Финансиски менаџер',
    effectiveDate: '2024-07-01',
    companyManager: 'Марко Петровски',
    date: '2024-06-15',
    city: 'Скопје'
  },

  // 30. Write-Off Decision
  'write-off-decision': {
    writeOffType: 'ПОБАРУВАЊА',
    responsiblePerson: 'Драган Велковски',
    date: '2024-06-15',
    writeOffItems: [
      {
        partnerName: 'Клиент ДООЕЛ',
        amount: '25.000',
        accountNumber: '1200'
      },
      {
        partnerName: 'Купувач АД',
        amount: '15.500',
        accountNumber: '1210'
      }
    ]
  },

  // 31. Dividend Payment Decision
  'dividend-payment-decision': {
    decisionDate: '2024-06-15',
    accumulatedProfitYear: '2023',
    accumulatedProfitAmount: '500.000',
    currentProfitYear: '2024',
    currentProfitAmount: '350.000',
    totalDividendAmount: '200.000',
    paymentYear: '2024',
    chairman: 'Борис Николоски',
    shareholdersList: [
      {
        shareholderName: 'Марко Петровски',
        grossDividendAmount: '100.000'
      },
      {
        shareholderName: 'Ана Стојановска',
        grossDividendAmount: '100.000'
      }
    ]
  },

  // 32. Annual Accounts Adoption
  'annual-accounts-adoption': {
    articleNumber: '25',
    meetingDate: '2024-06-15',
    year: '2023',
    managerName: 'Марко Петровски',
    city: 'Скопје',
    date: '2024-06-15',
    chairman: 'Горан Јованоски',
    revenues: '1.500.000',
    expenses: '1.200.000',
    taxOnExpenses: '45.000'
  },

  // 33. Cash Register Maximum Decision
  'cash-register-maximum-decision': {
    companyManager: 'Марко Петровски',
    year: '2024',
    amount: '50.000',
    decisionDate: '2024-06-15'
  },

  // DATA PROTECTION & PRIVACY (4)

  // 34. Consent for Personal Data Processing
  'consent-for-personal-data-processing': {
    employeeName: 'Тамара Андоновска',
    employeeAddress: 'ул. Климент Охридски 45, Скопје',
    employeeWorkPosition: 'Администратор за човечки ресурси'
  },

  // 35. GDPR Company Politics
  'gdpr-company-politics': {
    primaryBusinessActivity: 'Консалтинг услуги',
    dataProcessingComplexity: 'средна',
    personalDataCategories: ['Податоци за идентификација', 'Податоци за контакт'],
    hasDedicatedDPO: true,
    companyDPO: 'Јелена Костова',
    dpoIsInternal: true,
    companyDPOemail: 'dpo@nexa.mk',
    companyDPOphone: '070-123-456',
    responsibleDepartment: 'Правен оддел',
    companyEmail: 'contact@nexa.mk',
    businessHours: '09:00 - 17:00',
    preferredContactLanguages: 'македонски, англиски',
    usesCentralizedRegistry: true,
    staffTrainingLevel: 'редовна едукација за сите вработени',
    policyUpdateFrequency: 'годишно',
    complianceMonitoring: 'квартално'
  },

  // 36. Politics for Data Protection
  'politics-for-data-protection': {
    dataGroups: 'Вработени, Клиенти, Добавувачи'
  },

  // 37. Procedure for Estimation
  'procedure-for-estimation': {
    dpiaDate: '2024-06-15',
    assessmentType: 'Општа проценка на ризик',
    processingPurpose: 'Обработка на податоци за вработени за целите на човечки ресурси',
    dataSubjects: ['employees'],
    dataCategories: ['basic_data', 'contact_data', 'financial_data'],
    protectionLevel: 'висока',
    probability: 'ниска',
    impactLevel: 'умерено',
    riskLevel: 'низок',
    technicalMeasures: ['encryption', 'access_control', 'backup', 'firewall'],
    organizationalMeasures: ['access_policies', 'training', 'audits', 'incident_response'],
    responsiblePerson: 'Марко Петровски',
    reviewFrequency: 'годишно',
    implementationTimeline: '6 месеци',
    consultationRequired: false
  },

  // OTHER DOCUMENTS (2)

  // 38. Employee Stock Purchase Plan
  'employee-stock-purchase-plan': {
    effectiveDate: '2024-07-01',
    ownershipType: 'акции',
    planName: 'ESPP 2024',
    purposeOwnership: true,
    purposeMotivation: true,
    purposeRetention: true,
    purposeAlignment: false,
    purposeRecruitment: false,
    purposeCompetitiveness: false,
    eligibilityCriteria: 'Сите вработени со полно работно време',
    minimumServiceMonths: '6',
    minimumWorkHours: '30',
    maximumSharesNumber: '10000',
    purchasePricePercentage: '85',
    offeringPeriodMonths: '12',
    maxPayrollDeductionPercentage: '15',
    vestingSchedule: '3 години',
    termDuration: '5',
    termUnit: 'години',
    allowsCashContributions: false,
    taxObligations: 'Даночни обврски согласно важечкото законодавство',
    adjustmentsPolicy: 'Автоматско прилагодување при промени во акционерската структура'
  },

  // 39. Business Secret Rulebook (personalDataRulebook)
  'business-secret-rulebook': {
    additionalProtections: {
      physicalAccess: true,
      digitalSecurity: true,
      employeeTraining: true,
      auditTrail: false
    }
  }
};

module.exports = testData;
