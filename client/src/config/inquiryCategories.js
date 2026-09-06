// Single source of truth for inquiry (lead) categories on the client.
// Keys MUST mirror INQUIRY_CATEGORIES in server/constants/inquiryEnums.js.
export const CATEGORY_LABEL = {
  labor:          'Работни односи',
  property:       'Сопственост и недвижности',
  insurance:      'Осигурување',
  company:        'Фирми',
  citizenship:    'Државјанство',
  residence:      'Регулирање на престој',
  tax:            'Даноци',
  family:         'Семејно право',
  inheritance:    'Наследување',
  ip:             'Авторско право и интелектуална сопственост',
  administrative: 'Административни постапки',
  other_legal:    'Друго (правно)',
  legal_questions: 'Друго - правни прашања'
};

// Ordered list of category keys — drives every picker/filter.
export const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABEL);
