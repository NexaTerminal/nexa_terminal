import personalDataGroups from '../../data/personalDataGroups.json';

export const politicsForDataProtectionConfig = {
  title: 'Политика за заштита на лични податоци',
  description: 'Создавање на политика за заштита на лични податоци со избор на применливи категории податоци',
  
  fields: {
    effectiveDate: {
      name: 'effectiveDate',
      type: 'date',
      label: 'Датум на влегување во сила',
      required: false,
      helpText: 'Изберете го датумот кога политиката за заштита на лични податоци официјално ќе влезе во сила во вашата компанија. Ова е правно значајниот датум за почеток на примена на политиката.'
    },
    
    dataGroups: {
      name: 'dataGroups',
      type: 'checkbox-group',
      label: 'Категории на лични податоци кои ги обработува компанијата',
      required: false,
      options: personalDataGroups.map(group => ({
        value: group,
        label: group.type,
        description: group.description
      })),
      helpText: 'Изберете ги категориите на лични податоци кои вашата компанија ги обработува во рамките на својата деловна активност. Оваа информација е задолжителна за правилно дефинирање на обемот на политиката според GDPR и домашната легислатива за заштита на лични податоци.'
    }
  },

  steps: [
    {
      title: 'Основни информации за политиката',
      description: 'Дефинирање на основните параметри на политиката за заштита на лични податоци',
      fields: ['effectiveDate', 'dataGroups']
    }
  ],

  validation: {
    effectiveDate: [],
    dataGroups: []
  }
};