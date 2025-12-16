/**
 * Configuration for Procedure For Estimation Document (Процедура за проценка на влијанието)
 */

export const procedureForEstimationConfig = {
  documentType: 'procedureForEstimation',
  endpoint: '/auto-documents/procedure-for-estimation',
  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Дефинирајте ги основните информации за процедурата',
      fields: [
        {
          name: 'dpiaDate',
          label: 'Датум на донесување на процедурата',
          type: 'date',
          placeholder: 'Изберете датум',
          required: true,
          helpText: 'Внесете го датумот кога се донесува процедурата за проценка на влијанието врз заштитата на личните податоци. Овој датум ќе биде официјален датум на влегување во сила на процедурата.'
        },
        {
          name: 'assessmentType',
          label: 'Тип на проценка',
          type: 'select',
          options: [
            { value: 'systematic_evaluation', label: 'Систематска и обемна евалуација (профилирање)' },
            { value: 'special_categories', label: 'Обработка на посебни категории на лични податоци' },
            { value: 'systematic_monitoring', label: 'Систематско набљудување на јавно достапна област' },
            { value: 'new_technologies', label: 'Користење на нови технологии' },
            { value: 'data_combination', label: 'Комбинирање на податоци' },
            { value: 'location_tracking', label: 'Следење на локација или однесување' },
            { value: 'health_risk', label: 'Обработка која претставува висок ризик по здравјето' },
            { value: 'unique_identification', label: 'Обработка за цел на единствена идентификација' }
          ],
          required: true,
          helpText: 'Изберете го типот на проценка според природата на обработката на лични податоци во вашата компанија. Овој избор определува кои критериуми и мерки ќе се применуваат според ЗЗЛП.'
        }
      ]
    },
    {
      id: 2,
      title: 'Опфат на обработката',
      description: 'Дефинирајте го опфатот на процедурата за обработка',
      fields: [
        {
          name: 'processingPurpose',
          label: 'Цел на обработката',
          type: 'textarea',
          placeholder: 'Опишете ја конкретната и легитимната цел за обработка на личните податоци',
          required: true,
          helpText: 'Опишете ја конкретната, експлицитна и легитимна цел за која се обработуваат личните податоци. Целта мора да биде во согласност со дејноста на компанијата и законските основи предвидени во ЗЗЛП.'
        },
        {
          name: 'dataSubjects',
          label: 'Категории на субјекти на лични податоци',
          type: 'checkbox',
          options: [
            { value: 'employees', label: 'Вработени' },
            { value: 'candidates', label: 'Кандидати за работа' },
            { value: 'customers', label: 'Купувачи/клиенти' },
            { value: 'suppliers', label: 'Добавувачи' },
            { value: 'visitors', label: 'Посетители' },
            { value: 'contractors', label: 'Изведувачи' }
          ],
          helpText: 'Изберете ги категориите на лица чии лични податоци се обработуваат. Оваа класификација е задолжителна согласно член 30 од ЗЗЛП за евиденција на активности за обработка на податоци.'
        },
        {
          name: 'dataCategories',
          label: 'Категории на лични податоци',
          type: 'checkbox',
          options: [
            { value: 'basic_data', label: 'Основни податоци (име, адреса)' },
            { value: 'contact_info', label: 'Контакт информации' },
            { value: 'financial_data', label: 'Финансиски податоци' },
            { value: 'health_data', label: 'Здравствени податоци' },
            { value: 'biometric_data', label: 'Биометриски податоци' },
            { value: 'location_data', label: 'Податоци за локација' },
            { value: 'special_categories', label: 'Посебни категории податоци' }
          ],
          helpText: 'Изберете ги типовите на лични податоци кои се обработуваат. Посебните категории (здравствени, биометриски) бараат дополнителна заштита и оправдување според член 9 од ЗЗЛП.'
        }
      ]
    },
    {
      id: 3,
      title: 'Проценка на ризик',
      description: 'Извршете проценка на ризиците и влијанието',
      fields: [
        {
          name: 'protectionLevel',
          label: 'Ниво на потреба за заштита',
          type: 'select',
          options: [
            { value: '1', label: 'Ниско (1)' },
            { value: '2', label: 'Средно (2)' },
            { value: '3', label: 'Високо (3)' }
          ],
          required: true,
          helpText: 'Проценете го нивото на потреба за заштита врз основа на природата, обемот и контекстот на обработката. Високо ниво бара имплементација на дополнителни безбедносни мерки.'
        },
        {
          name: 'threats',
          label: 'Идентификувани закани',
          type: 'checkbox',
          options: [
            { value: 'unauthorized_access', label: 'Неовластен пристап' },
            { value: 'data_loss', label: 'Губење на податоци' },
            { value: 'data_alteration', label: 'Измена на податоци' },
            { value: 'technical_failure', label: 'Технички дефекти' },
            { value: 'cyber_attacks', label: 'Кибер напади' },
            { value: 'human_error', label: 'Човечка грешка' }
          ],
          helpText: 'Идентификувајте ги потенцијалните закани за безбедноста на личните податоци во вашиот систем. Оваа анализа е клучна за развивање на соодветни заштитни мерки.'
        },
        {
          name: 'probability',
          label: 'Веројатност за појава',
          type: 'select',
          options: [
            { value: '1', label: 'Ретко (1)' },
            { value: '2', label: 'Повремено (2)' },
            { value: '3', label: 'Често (3)' }
          ],
          required: true,
          helpText: 'Проценете ја веројатноста за појава на идентификуваните ризици. Оваа процена се користи за пресметка на севкупниот ризик и приоритизирање на заштитни мерки.'
        },
        {
          name: 'impactLevel',
          label: 'Ниво на влијание',
          type: 'select',
          options: [
            { value: '1', label: 'Ниско (1)' },
            { value: '2', label: 'Средно (2)' },
            { value: '3', label: 'Високо (3)' }
          ],
          required: true,
          helpText: 'Проценете го влијанието што би го имал ризикот доколку се материјализира. Високо влијание укажува на сериозни последици по правата и слободите на субјектите на податоци.'
        }
      ]
    },
    {
      id: 4,
      title: 'Мерки за ублажување',
      description: 'Дефинирајте мерки за ублажување на ризиците',
      fields: [
        {
          name: 'technicalMeasures',
          label: 'Технички мерки',
          type: 'checkbox',
          options: [
            { value: 'encryption', label: 'Енкрипција на податоци' },
            { value: 'access_control', label: 'Контрола на пристап' },
            { value: 'backup_systems', label: 'Системи за резервни копии' },
            { value: 'monitoring', label: 'Континуирано следење' },
            { value: 'firewalls', label: 'Firewall системи' },
            { value: 'antivirus', label: 'Антивирус заштита' }
          ],
          helpText: 'Изберете ги техничките мерки за заштита кои се веќе имплементирани или се планираат за имплементација. Овие мерки се задолжителни според член 32 од ЗЗЛП.'
        },
        {
          name: 'organizationalMeasures',
          label: 'Организациски мерки',
          type: 'checkbox',
          options: [
            { value: 'staff_training', label: 'Обука на персоналот' },
            { value: 'policies', label: 'Политики и процедури' },
            { value: 'regular_audits', label: 'Редовни ревизии' },
            { value: 'incident_response', label: 'План за одговор на инциденти' },
            { value: 'data_minimization', label: 'Минимизирање на податоци' },
            { value: 'retention_policy', label: 'Политика за чување' }
          ],
          helpText: 'Изберете ги организациските мерки за заштита на лични податоци. Овие мерки се еднакво важни како техничките и задолжително мора да бидат документирани и спроведувани.'
        },
        {
          name: 'implementation_timeline',
          label: 'Временска рамка за имплементација',
          type: 'select',
          options: [
            { value: '1_month', label: '1 месец' },
            { value: '3_months', label: '3 месеци' },
            { value: '6_months', label: '6 месеци' },
            { value: '1_year', label: '1 година' }
          ],
          required: true,
          helpText: 'Определете реалистична временска рамка за имплементација на сите идентификувани мерки за ублажување на ризиците. Рокот мора да биде пропорционален на сложеноста на мерките.'
        }
      ]
    },
    {
      id: 5,
      title: 'Документирање и следење',
      description: 'Дополнителни информации за документирање',
      fields: [
        {
          name: 'reviewFrequency',
          label: 'Фреквенција на преиспитување',
          type: 'select',
          options: [
            { value: 'quarterly', label: 'Квартално' },
            { value: 'semi_annual', label: 'Полугодишно' },
            { value: 'annual', label: 'Годишно' }
          ],
          required: true,
          helpText: 'Определете колку често ќе се преиспитува и ажурира процедурата. Почестите ревизии се препорачуваат за активности со висок ризик или кога се користат нови технологии.'
        },
        {
          name: 'responsiblePerson',
          label: 'Одговорно лице',
          type: 'text',
          placeholder: 'Име и позиција на одговорното лице',
          required: true,
          helpText: 'Внесете го името и позицијата на лицето одговорно за спроведување на процедурата. Ова може да биде офицерот за заштита на лични податоци или друго овластено лице во компанијата.'
        },
        {
          name: 'consultationRequired',
          label: 'Потребна консултација со АЗЛП',
          type: 'select',
          options: [
            { value: 'yes', label: 'Да' },
            { value: 'no', label: 'Не' }
          ],
          required: true,
          helpText: 'Изберете "Да" ако проценката покажува висок ризик кој не може да се ублажи со дополнителни мерки. Согласно член 36 од ЗЗЛП, во такви случаи е задолжителна претходна консултација со АЗЛП.'
        },
        {
          name: 'additionalNotes',
          label: 'Дополнителни забелешки',
          type: 'textarea',
          placeholder: 'Дополнителни информации или специфичности',
          required: false,
          helpText: 'Внесете дополнителни забелешки, специфичности или околности релевантни за процедурата што не се покриени во претходните полиња.'
        }
      ]
    }
  ]
};

/**
 * Get fields for a specific step
 */
export const getStepFields = (stepId) => {
  const step = procedureForEstimationConfig.steps.find(s => s.id === stepId);
  return step ? step.fields : [];
};

/**
 * Validate form data
 */
export const validateFormData = (formData) => {
  const errors = {};
  // Validation logic would go here
  return errors;
};

export default procedureForEstimationConfig;