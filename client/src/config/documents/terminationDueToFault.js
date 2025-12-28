import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination Due to Fault by Employee Document Configuration
 * Simplified legal document based on Articles 81 and 82 of Macedonia Labor Law
 * Only two inputs required: article selection and factual situation description
 */

// Article 81 cases - WITH 30-day notice period
export const ARTICLE_81_CASES = [
  {
    value: 'article_81_case_1',
    label: 'Член 81, точка 1 - не ги почитува работниот ред и дисциплина',
    shortLabel: 'Член 81, точка 1',
    description: 'Не ги почитува работниот ред и дисциплина според правилата пропишани од страна на работодавачот',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_2',
    label: 'Член 81, точка 2 - не ги извршува или несовесно ги извршува работните обврски', 
    shortLabel: 'Член 81, точка 2',
    description: 'Не ги извршува или несовесно и ненавремено ги извршува работните обврски',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_3',
    label: 'Член 81, точка 3 - не се придржува кон прописите за вршење на работите',
    shortLabel: 'Член 81, точка 3',
    description: 'Не се придржува кон прописите што важат за вршење на работите на работното место',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_4',
    label: 'Член 81, точка 4 - не се придржува на работното време и распоредот',
    shortLabel: 'Член 81, точка 4',
    description: 'Не се придржува на работното време, распоредот и користењето на работното време',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_5',
    label: 'Член 81, точка 5 - не побара отсуство или не го извести работодавачот',
    shortLabel: 'Член 81, точка 5',
    description: 'Не побара отсуство или навремено писмено не го извести работодавачот за отсуството од работа',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_6',
    label: 'Член 81, точка 6 - не го извести работодавачот за отсуство поради болест',
    shortLabel: 'Член 81, точка 6',
    description: 'Поради болест или оправдани причини отсуствува од работа, а за тоа во рок од 48 часа, писмено не го извести работодавачот',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_7',
    label: 'Член 81, точка 7 - не постапува совесно со средствата за работа',
    shortLabel: 'Член 81, точка 7',
    description: 'Со средствата за работа не постапува совесно или во согласност со техничките упатства за работа',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_8',
    label: 'Член 81, точка 8 - не го извести работодавачот за штета или грешка',
    shortLabel: 'Член 81, точка 8',
    description: 'Настане штета, грешка во работењето или загуба, а за тоа веднаш не го извести работодавачот',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_9',
    label: 'Член 81, точка 9 - не ги почитува прописите за заштита при работа',
    shortLabel: 'Член 81, точка 9',
    description: 'Не ги почитува прописите за заштита при работа или не ги одржува средствата и опремата за заштита при работа',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_10',
    label: 'Член 81, точка 10 - предизвикува неред и насилнички се однесува',
    shortLabel: 'Член 81, точка 10',
    description: 'Предизвикува неред и насилнички се однесува за време на работата',
    noticeRequired: true,
    noticePeriod: 30
  },
  {
    value: 'article_81_case_11',
    label: 'Член 81, точка 11 - незаконски ги користи средствата на работодавачот',
    shortLabel: 'Член 81, точка 11',
    description: 'Незаконски или неовластето ги користи средствата на работодавачот',
    noticeRequired: true,
    noticePeriod: 30
  }
];

// Article 82 cases - WITHOUT notice period (immediate termination)
export const ARTICLE_82_CASES = [
  {
    value: 'article_82_case_1',
    label: 'Член 82, точка 1 - неоправдано изостанок од работа',
    shortLabel: 'Член 82, точка 1',
    description: 'Неоправдано изостане од работа три последователни работни дена или пет работни дена во текот на една година',
    noticeRequired: false,
    noticePeriod: 0
  },
  {
    value: 'article_82_case_2',
    label: 'Член 82, точка 2 - злоупотреба на боледувањето',
    shortLabel: 'Член 82, точка 2',
    description: 'Го злоупотреби боледувањето',
    noticeRequired: false,
    noticePeriod: 0
  },
  {
    value: 'article_82_case_3',
    label: 'Член 82, точка 3 - не се придржува кон прописите за здравствена заштита',
    shortLabel: 'Член 82, точка 3',
    description: 'Не се придржува кон прописите за здравствена заштита, заштита при работа, пожар, експлозија, штетно дејствување на отрови и други опасни материи и ги повредува прописите за заштита на животната средина',
    noticeRequired: false,
    noticePeriod: 0
  },
  {
    value: 'article_82_case_4',
    label: 'Член 82, точка 4 - внесува или употребува алкохол и наркотични средства',
    shortLabel: 'Член 82, точка 4',
    description: 'Внесува, употребува или е под дејство на алкохол и наркотични средства',
    noticeRequired: false,
    noticePeriod: 0
  },
  {
    value: 'article_82_case_5',
    label: 'Член 82, точка 5 - стори кражба или предизвика штета',
    shortLabel: 'Член 82, точка 5',
    description: 'Стори кражба или во врска со работата намерно или од крајно невнимание предизвика штета на работодавачот',
    noticeRequired: false,
    noticePeriod: 0
  },
  {
    value: 'article_82_case_6',
    label: 'Член 82, точка 6 - оддаде деловна, службена или државна тајна',
    shortLabel: 'Член 82, точка 6',
    description: 'Оддаде деловна, службена или државна тајна',
    noticeRequired: false,
    noticePeriod: 0
  }
];

// Combined article cases for dropdown
export const ALL_ARTICLE_CASES = [
  ...ARTICLE_81_CASES,
  ...ARTICLE_82_CASES
];

export const terminationDueToFaultConfig = {
  documentType: 'terminationDueToFault',
  apiEndpoint: 'termination-due-to-fault',
  fileName: null, // Will be auto-generated

  // Single step form - extremely simplified
  steps: [
    {
      id: 1,
      title: 'Одлука за Престанок Поради Вина на Работникот',
      description: 'Изберете го соодветниот член и случај од ЗРО и опишете ја фактичката ситуација',
      requiredFields: [],  // All fields optional
      legalGuidance: 'Внесувањето во полињата е опционо и не е задолжително. Можете да генерирате празен документ за рачно пополнување или да внесете само основни податоци.'
    }
  ],

  // Simplified form fields - only 2 inputs
  fields: {
    // Optional employee name for document header
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: false,
      helpText: 'Опционо: Можете да го внесете името или да го оставите празно за рачно внесување'
    },

    // Optional job position
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: false,
      helpText: 'Опционо: Работната позиција како што е наведена во договорот за вработување'
    },

    // Article and case selection (main legal basis)
    articleCase: {
      name: 'articleCase',
      type: 'select',
      label: 'Член и случај од Законот за работни односи',
      required: false,
      options: ALL_ARTICLE_CASES,
      helpText: 'Изберете го соодветниот член и случај според повредата. Ако не сте сигурни, оставете го празно за рачно пополнување.'
    },

    // Optional factual situation description
    factualSituation: {
      name: 'factualSituation',
      type: 'textarea',
      label: 'Опис на фактичката ситуација',
      placeholder: 'Опишете ја фактичката ситуација што довела до повредата. Пример 1: На ден 15.03.2024, работникот не се појави на работа без претходно известување...; Пример 2: Работникот не ги почитуваше прописите за заштита при работа на ден 20.04.2024 и спротивно на упаствата...',
      required: false,
      rows: 6,
      maxLength: 2000,
      helpText: 'Важно: Опишаната фактичка состојба мора да биде реална и детално наведена. Сите околности кои се наведени во овој дел мора да бидат специфично посочени зошто претставуваат забрането дејствие на работникот и истите да можат да бидат докажани преку документација, снимки, маил, сведоци или друга форма на докази. Овој дел е од исклучителна важност и претставува фактичката состојба која доведува до законитост или противзаконитост на отказот на работникот.'
    }
  },

  // Minimal validation
  validationRules: [],

  // Initial form data - minimal set
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    articleCase: '',
    factualSituation: ''
  }
};

export default terminationDueToFaultConfig;