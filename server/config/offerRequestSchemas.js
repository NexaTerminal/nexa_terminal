/**
 * Enhanced Offer Request and Provider Interest Schemas for Nexa Marketplace
 * Includes quality indicators, service-specific fields, and Macedonian status management
 */

const { ObjectId } = require('mongodb');

/**
 * Offer Request Schema with Quality Control
 */
const offerRequestSchema = {
  _id: ObjectId,

  // User Information
  userId: ObjectId, // Reference to requesting user

  // Request Details
  requestCategory: {
    type: String,
    enum: ['legal', 'other'],
    required: true
  }, // "legal" for Find a Lawyer, "other" for Request an Offer
  serviceType: String, // Dynamic based on active providers
  budgetRange: String, // MKD ranges: "до-25000", "25000-50000", etc.
  projectDescription: String, // 10-300 words validation
  projectType: String, // "еднократен" | "континуиран"
  timeline: String, // "до-1-недела", "до-1-месец", "до-3-месеци", "над-6-месеци"

  // Service-Specific Additional Fields (dynamic based on service type)
  serviceSpecificFields: {
    type: Object,
    default: {}
  },

  // Quality Control Indicators
  qualityIndicators: {
    wordCount: { type: Number, default: 0 },
    spamScore: { type: Number, default: 0 }, // 0-100 scale
    duplicateCheck: { type: Boolean, default: false },
    budgetScopeAlignment: { type: String, enum: ['good', 'questionable', 'poor'], default: 'good' },
    qualityScore: { type: Number, default: 0 } // Overall quality score 0-100
  },

  // Status Management (Macedonian)
  status: {
    type: String,
    enum: ['неверифицирано', 'верифицирано', 'испратено', 'одбиено'],
    default: 'неверифицирано'
  },

  // Privacy
  isAnonymous: { type: Boolean, default: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  verifiedAt: Date,

  // Admin Information
  verifiedBy: ObjectId, // Admin who verified/rejected
  adminNotes: String, // Admin comments

  // Provider Tracking
  sentTo: [ObjectId], // Array of provider IDs who received this request
  interestCount: { type: Number, default: 0 }, // Number of providers who expressed interest

  // Enhanced Provider Response Tracking
  providerResponses: [ObjectId], // Array of provider_interest IDs with responses

  // Response Statistics
  responseStats: {
    totalSent: { type: Number, default: 0 },
    totalResponded: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    declinedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },
    noResponseCount: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in hours
    lastResponseDate: Date
  },

  // Success Tracking
  connectionsMade: { type: Number, default: 0 },
  isResolved: { type: Boolean, default: false },

  // Client Communication Tracking
  clientNotifications: {
    totalNotificationsSent: { type: Number, default: 0 },
    lastNotificationDate: Date,
    providersIntroduced: [ObjectId] // Array of provider IDs introduced to client
  }
};

/**
 * Provider Interest Schema for Proposal Tracking
 */
const providerInterestSchema = {
  _id: ObjectId,

  // Relationship References
  requestId: ObjectId, // Reference to offer_requests
  providerId: ObjectId, // Reference to service_providers

  // Unique Token for Interest Expression
  interestToken: String, // Unique token for provider access
  tokenExpiry: Date, // Token expiration date

  // Enhanced Provider Response Fields

  // Legacy fields (maintained for backward compatibility)
  availability: {
    type: String,
    enum: ['да', 'не'],
    required: false // Made optional as we have new detailed fields
  },

  budgetAlignment: {
    type: String,
    enum: ['да', 'не', 'преговарачки'],
    required: false // Made optional as we have new detailed fields
  },

  proposal: {
    type: String,
    maxlength: 2000, // Increased from 500 to 2000 characters
    required: false // Made optional as we have new detailed fields
  },

  portfolio: String, // Optional portfolio/website link

  preferredContact: {
    type: String,
    enum: ['email', 'телефон', 'средба', 'двете'],
    default: 'email'
  },

  nextSteps: String, // What they propose as next steps

  // NEW ENHANCED RESPONSE FIELDS

  // Response Action Type
  responseType: {
    type: String,
    enum: ['accept', 'decline', 'unsubscribe'],
    required: true
  },

  // Budget Assessment
  budgetAccepted: {
    type: String,
    enum: ['yes', 'negotiable', 'no'],
    required: function() { return this.responseType === 'accept'; }
  },

  priceDetails: {
    type: String,
    maxlength: 500,
    required: function() { return this.responseType === 'accept' && this.budgetAccepted !== 'yes'; }
  },

  // Timeline Assessment
  timelineAcceptable: {
    type: String,
    enum: ['yes', 'with-adjustments', 'no'],
    required: function() { return this.responseType === 'accept'; }
  },

  timelineComment: {
    type: String,
    maxlength: 300,
    required: function() { return this.responseType === 'accept' && this.timelineAcceptable !== 'yes'; }
  },

  // Experience Assessment
  relevantExperience: {
    type: String,
    enum: ['yes', 'some', 'no'],
    required: function() { return this.responseType === 'accept'; }
  },

  experienceDetails: {
    type: String,
    maxlength: 800,
    required: function() { return this.responseType === 'accept'; }
  },

  // Approach Strategy (most important field)
  approachComment: {
    type: String,
    minlength: 100,
    maxlength: 2000,
    required: function() { return this.responseType === 'accept'; }
  },

  // Decline/Unsubscribe Reason
  declineReason: {
    type: String,
    enum: [
      'не-ми-одговара-буџетот',
      'не-ми-одговара-времето',
      'немам-искуство-со-ваквите-случаи',
      'моментално-сум-зафатен',
      'не-работам-со-ваков-тип-клиенти',
      'друго'
    ],
    required: function() { return this.responseType === 'decline'; }
  },

  declineComment: {
    type: String,
    maxlength: 300,
    required: function() { return this.responseType === 'decline' && this.declineReason === 'друго'; }
  },

  // Unsubscribe fields
  unsubscribeReason: {
    type: String,
    enum: [
      'премногу-барања',
      'не-се-релевантни',
      'променил-услуги',
      'не-работам-повеќе',
      'друго'
    ],
    required: function() { return this.responseType === 'unsubscribe'; }
  },

  unsubscribeComment: {
    type: String,
    maxlength: 200,
    required: function() { return this.responseType === 'unsubscribe' && this.unsubscribeReason === 'друго'; }
  },

  // SECURITY & TRACKING FIELDS

  // Security tracking (for fraud prevention)
  securityData: {
    ipAddress: String, // IP address of the response
    userAgent: String, // Browser user agent string
    submissionTimestamp: { type: Date, default: Date.now },
    tokenUsed: Boolean, // Whether token was successfully used
    responseSource: {
      type: String,
      enum: ['email-link', 'direct-access', 'mobile-app'],
      default: 'email-link'
    }
  },

  // Response validation
  responseValidation: {
    isValidToken: { type: Boolean, default: false },
    tokenExpiryCheck: { type: Boolean, default: false },
    duplicateResponseCheck: { type: Boolean, default: false },
    suspiciousActivity: { type: Boolean, default: false }
  },

  // Provider Contact Details (from service provider record)
  providerEmail: String,
  providerPhone: String,
  providerName: String,

  // Status Tracking
  status: {
    type: String,
    enum: ['изразен', 'прифатен', 'одбиен', 'истечен', 'declined', 'unsubscribed', 'responded'],
    default: 'изразен'
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  viewedByClient: { type: Boolean, default: false },
  clientResponseDate: Date,

  // Quality Indicators for Provider Response
  responseQuality: {
    completeness: { type: Number, default: 0 }, // 0-100
    relevance: { type: Number, default: 0 }, // 0-100
    professionalism: { type: Number, default: 0 } // 0-100
  }
};

/**
 * Service-Specific Field Configurations
 */
const SERVICE_SPECIFIC_FIELDS = {
  legal: {
    displayName: 'Правни услуги',
    additionalFields: [
      {
        key: 'legalMatter',
        label: 'Тип на правна материја',
        type: 'select',
        options: ['Договорно право', 'Работно право', 'Трговско право', 'Граѓанско право', 'Казнено право', 'Друго'],
        required: true
      },
      {
        key: 'urgency',
        label: 'Итност на случајот',
        type: 'select',
        options: ['Итно (до 3 дена)', 'Средно итно (до 1 недела)', 'Стандардно (до 1 месец)', 'Не е итно'],
        required: true
      },
      {
        key: 'documentsAvailable',
        label: 'Достапни документи',
        type: 'select',
        options: ['Сите потребни документи', 'Дел од документите', 'Нема документи', 'Не сум сигурен'],
        required: false
      }
    ]
  },

  accounting: {
    displayName: 'Сметководство',
    additionalFields: [
      {
        key: 'businessSize',
        label: 'Големина на бизнисот (вработени)',
        type: 'select',
        options: ['1-5 вработени', '6-20 вработени', '21-50 вработени', '51+ вработени'],
        required: true
      },
      {
        key: 'serviceFrequency',
        label: 'Честота на услугата',
        type: 'select',
        options: ['Еднократно', 'Месечно', 'Квартално', 'Годишно', 'По потреба'],
        required: true
      },
      {
        key: 'currentSoftware',
        label: 'Тековен сметководствен софтвер',
        type: 'text',
        placeholder: 'На пример: Excel, QuickBooks, SAP, итн.',
        required: false
      }
    ]
  },

  marketing: {
    displayName: 'Маркетинг',
    additionalFields: [
      {
        key: 'targetAudience',
        label: 'Целна група',
        type: 'text',
        placeholder: 'Опишете ја вашата целна група',
        required: true
      },
      {
        key: 'preferredChannels',
        label: 'Претпочитани маркетинг канали',
        type: 'multiselect',
        options: ['Социјални мрежи', 'Google реклами', 'SEO', 'Email маркетинг', 'Традиционални медиуми', 'Други'],
        required: true
      },
      {
        key: 'previousExperience',
        label: 'Претходно маркетинг искуство',
        type: 'select',
        options: ['Немам искуство', 'Основно искуство', 'Средно искуство', 'Напредно искуство'],
        required: false
      }
    ]
  },

  insurance: {
    displayName: 'Осигурување',
    additionalFields: [
      {
        key: 'insuranceType',
        label: 'Тип на осигурување',
        type: 'select',
        options: ['Деловно осигурување', 'Животно осигурување', 'Здравствено осигурување', 'Имотно осигурување', 'Автомобилско осигурување'],
        required: true
      },
      {
        key: 'currentCoverage',
        label: 'Тековна покриеност',
        type: 'select',
        options: ['Немам осигурување', 'Имам основно покритие', 'Имам комплетно покритие', 'Не сум сигурен'],
        required: false
      }
    ]
  },

  realestate: {
    displayName: 'Недвижен имот',
    additionalFields: [
      {
        key: 'propertyType',
        label: 'Тип на недвижност',
        type: 'select',
        options: ['Станови', 'Куќи', 'Деловен простор', 'Земјиште', 'Индустриски објекти'],
        required: true
      },
      {
        key: 'transactionType',
        label: 'Тип на трансакција',
        type: 'select',
        options: ['Купување', 'Продавање', 'Изнајмување', 'Оценување', 'Инвестирање'],
        required: true
      }
    ]
  },

  itsupport: {
    displayName: 'ИТ поддршка',
    additionalFields: [
      {
        key: 'techLevel',
        label: 'Техничко ниво на проблемот',
        type: 'select',
        options: ['Основно (корисничка поддршка)', 'Средно (системи и мрежи)', 'Напредно (развој и архитектура)', 'Не сум сигурен'],
        required: true
      },
      {
        key: 'systemsInvolved',
        label: 'Системи што се вклучени',
        type: 'text',
        placeholder: 'На пример: Windows, Mac, серверски системи, веб апликации',
        required: false
      }
    ]
  },

  other: {
    displayName: 'Друго',
    additionalFields: [
      {
        key: 'serviceCategory',
        label: 'Категорија на услугата',
        type: 'text',
        placeholder: 'Опишете го типот на услугата што ви треба',
        required: true
      }
    ]
  }
};

/**
 * MKD Budget Ranges with Euro Equivalents
 */
const BUDGET_RANGES = [
  {
    value: 'до-25000',
    label: 'До 25.000 МКД (€500)',
    mkd: { min: 0, max: 25000 },
    eur: { min: 0, max: 500 }
  },
  {
    value: '25000-50000',
    label: '25.000-50.000 МКД (€500-€1.000)',
    mkd: { min: 25000, max: 50000 },
    eur: { min: 500, max: 1000 }
  },
  {
    value: '50000-125000',
    label: '50.000-125.000 МКД (€1.000-€2.500)',
    mkd: { min: 50000, max: 125000 },
    eur: { min: 1000, max: 2500 }
  },
  {
    value: '125000-250000',
    label: '125.000-250.000 МКД (€2.500-€5.000)',
    mkd: { min: 125000, max: 250000 },
    eur: { min: 2500, max: 5000 }
  },
  {
    value: '250000-625000',
    label: '250.000-625.000 МКД (€5.000-€12.500)',
    mkd: { min: 250000, max: 625000 },
    eur: { min: 5000, max: 12500 }
  },
  {
    value: 'над-625000',
    label: 'Над 625.000 МКД (€12.500+)',
    mkd: { min: 625000, max: null },
    eur: { min: 12500, max: null }
  }
];

/**
 * Timeline Options in Macedonian
 */
const TIMELINE_OPTIONS = [
  { value: 'до-1-недела', label: 'До 1 недела' },
  { value: 'до-1-месец', label: 'До 1 месец' },
  { value: 'до-3-месеци', label: 'До 3 месеци' },
  { value: 'над-6-месеци', label: 'Над 6 месеци' }
];

/**
 * Project Type Options
 */
const PROJECT_TYPES = [
  { value: 'еднократен', label: 'Еднократен проект' },
  { value: 'континуиран', label: 'Континуирана соработка' }
];

/**
 * Validation Functions
 */
const validators = {
  /**
   * Validate offer request data
   */
  validateOfferRequest(requestData) {
    const errors = [];

    // Required field validation
    if (!requestData.requestCategory) errors.push('Категоријата на барањето е задолжителна');
    if (!['legal', 'other'].includes(requestData.requestCategory)) errors.push('Неважечка категорија на барање');
    if (!requestData.serviceType) errors.push('Типот на услуга е задолжителен');
    if (!requestData.budgetRange) errors.push('Буџетот е задолжителен');
    if (!requestData.projectDescription) errors.push('Описот на барањето е задолжителен');
    if (!requestData.projectType) errors.push('Типот на проект е задолжителен');
    if (!requestData.timeline) errors.push('Временскиот рок е задолжителен');

    // Word count validation (10-300 words)
    const wordCount = this.countWords(requestData.projectDescription);
    if (wordCount < 10) errors.push('Описот мора да содржи најмалку 10 збора');
    if (wordCount > 300) errors.push('Описот може да содржи максимум 300 збора');

    // Budget range validation
    const validBudgetRange = BUDGET_RANGES.find(range => range.value === requestData.budgetRange);
    if (!validBudgetRange) errors.push('Неважечки буџетски опсег');

    // Timeline validation
    const validTimeline = TIMELINE_OPTIONS.find(option => option.value === requestData.timeline);
    if (!validTimeline) errors.push('Неважечки временски рок');

    // Project type validation
    const validProjectType = PROJECT_TYPES.find(type => type.value === requestData.projectType);
    if (!validProjectType) errors.push('Неважечки тип на проект');

    return errors;
  },

  /**
   * Count words in text
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  /**
   * Calculate spam score (0-100, higher is more likely spam)
   */
  calculateSpamScore(text) {
    if (!text) return 0;

    let score = 0;
    const lowerText = text.toLowerCase();

    // Check for excessive capitalization
    const caps = text.match(/[A-Z]/g);
    if (caps && caps.length > text.length * 0.3) score += 20;

    // Check for excessive punctuation
    const punct = text.match(/[!?]{2,}/g);
    if (punct && punct.length > 0) score += 15;

    // Check for common spam phrases
    const spamPhrases = ['free money', 'quick cash', 'guarantee', '100%', 'risk free'];
    spamPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) score += 10;
    });

    // Check for URL patterns
    if (text.match(/https?:\/\/|www\./g)) score += 5;

    return Math.min(score, 100);
  },

  /**
   * Validate provider interest data
   */
  validateProviderInterest(interestData) {
    const errors = [];

    if (!interestData.availability) errors.push('Достапноста е задолжителна');
    if (!interestData.budgetAlignment) errors.push('Буџетското усогласување е задолжително');
    if (!interestData.proposal) errors.push('Предлогот е задолжителен');

    if (interestData.proposal && interestData.proposal.length > 500) {
      errors.push('Предлогот може да содржи максимум 500 карактери');
    }

    return errors;
  }
};

/**
 * Utility Functions
 */
const utils = {
  /**
   * Get service-specific fields for a service type
   */
  getServiceSpecificFields(serviceType) {
    return SERVICE_SPECIFIC_FIELDS[serviceType] || SERVICE_SPECIFIC_FIELDS.other;
  },

  /**
   * Get all budget ranges
   */
  getBudgetRanges() {
    return BUDGET_RANGES;
  },

  /**
   * Get timeline options
   */
  getTimelineOptions() {
    return TIMELINE_OPTIONS;
  },

  /**
   * Get project type options
   */
  getProjectTypes() {
    return PROJECT_TYPES;
  },

  /**
   * Generate quality indicators for a request
   */
  generateQualityIndicators(requestData) {
    const wordCount = validators.countWords(requestData.projectDescription);
    const spamScore = validators.calculateSpamScore(requestData.projectDescription);

    // Calculate overall quality score
    let qualityScore = 100;

    // Deduct for spam
    qualityScore -= spamScore * 0.5;

    // Deduct for too short description
    if (wordCount < 20) qualityScore -= 20;

    // Deduct for missing service-specific fields
    const serviceFields = this.getServiceSpecificFields(requestData.serviceType);
    const requiredFields = serviceFields.additionalFields.filter(field => field.required);
    const missingFields = requiredFields.filter(field =>
      !requestData.serviceSpecificFields || !requestData.serviceSpecificFields[field.key]
    );
    qualityScore -= missingFields.length * 10;

    return {
      wordCount,
      spamScore,
      duplicateCheck: false, // Will be implemented in service layer
      qualityScore: Math.max(0, Math.min(100, qualityScore))
    };
  },

  // Enhanced validation for provider responses
  validateProviderResponse: function(responseData) {
    const errors = [];

    // Required fields based on response type
    if (!responseData.responseType || !['accept', 'decline', 'unsubscribe'].includes(responseData.responseType)) {
      errors.push('Типот на одговор е задолжителен и мора да биде accept, decline или unsubscribe');
    }

    // Validation for acceptance responses
    if (responseData.responseType === 'accept') {
      if (!responseData.budgetAccepted || !['yes', 'negotiable', 'no'].includes(responseData.budgetAccepted)) {
        errors.push('Ставот кон буџетот е задолжителен за прифаќање');
      }

      if (responseData.budgetAccepted !== 'yes' && (!responseData.priceDetails || responseData.priceDetails.length < 10)) {
        errors.push('Детали за цената се задолжителни кога буџетот не е прифатен целосно');
      }

      if (!responseData.timelineAcceptable || !['yes', 'with-adjustments', 'no'].includes(responseData.timelineAcceptable)) {
        errors.push('Ставот кон временската рамка е задолжителен');
      }

      if (responseData.timelineAcceptable !== 'yes' && (!responseData.timelineComment || responseData.timelineComment.length < 10)) {
        errors.push('Коментар за временската рамка е задолжителен кога има потреба од прилагодувања');
      }

      if (!responseData.relevantExperience || !['yes', 'some', 'no'].includes(responseData.relevantExperience)) {
        errors.push('Релевантното искуство е задолжително поле');
      }

      if (!responseData.experienceDetails || responseData.experienceDetails.length < 20) {
        errors.push('Детали за искуството се задолжителни (минимум 20 карактери)');
      }

      if (!responseData.approachComment || responseData.approachComment.length < 100 || responseData.approachComment.length > 2000) {
        errors.push('Коментарот за пристапот е задолжителен (100-2000 карактери)');
      }
    }

    // Validation for decline responses
    if (responseData.responseType === 'decline') {
      if (!responseData.declineReason) {
        errors.push('Причината за одбивање е задолжителна');
      }

      if (responseData.declineReason === 'друго' && (!responseData.declineComment || responseData.declineComment.length < 5)) {
        errors.push('Коментар е потребен кога причината е "друго"');
      }
    }

    // Validation for unsubscribe responses
    if (responseData.responseType === 'unsubscribe') {
      if (!responseData.unsubscribeReason) {
        errors.push('Причината за отпишување е задолжителна');
      }

      if (responseData.unsubscribeReason === 'друго' && (!responseData.unsubscribeComment || responseData.unsubscribeComment.length < 5)) {
        errors.push('Коментар е потребен кога причината е "друго"');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Security validation for provider response tokens
  validateResponseToken: function(token, tokenData, requestData) {
    const validation = {
      isValidToken: false,
      tokenExpiryCheck: false,
      duplicateResponseCheck: false,
      suspiciousActivity: false,
      errors: []
    };

    // Token format validation
    if (!token || typeof token !== 'string' || token.length !== 64) {
      validation.errors.push('Невалиден формат на токен');
      return validation;
    }

    validation.isValidToken = true;

    // Token expiry check
    const now = new Date();
    const expiryDate = new Date(tokenData.tokenExpiry);

    if (now > expiryDate) {
      validation.errors.push('Токенот е истечен');
    } else {
      validation.tokenExpiryCheck = true;
    }

    // Duplicate response check
    if (tokenData.status && ['responded', 'declined', 'unsubscribed'].includes(tokenData.status)) {
      validation.errors.push('Веќе сте одговориле на ова барање');
    } else {
      validation.duplicateResponseCheck = true;
    }

    // Basic suspicious activity check
    const tokenAge = now - new Date(tokenData.createdAt);
    const responseSpeed = tokenAge / (1000 * 60); // minutes

    if (responseSpeed < 1) { // Response in less than 1 minute
      validation.suspiciousActivity = true;
      validation.errors.push('Премногу брз одговор - можна сомнителна активност');
    }

    return validation;
  }
};

module.exports = {
  schemas: {
    offerRequestSchema,
    providerInterestSchema
  },
  SERVICE_SPECIFIC_FIELDS,
  BUDGET_RANGES,
  TIMELINE_OPTIONS,
  PROJECT_TYPES,
  validators,
  utils
};