/**
 * Annual Leave Bonus Decision Configuration
 * Form configuration for generating annual leave bonus decisions
 */

export const annualLeaveBonusDecisionConfig = {
  steps: [
    {
      title: 'Основни информации за одлуката',
      fields: [
        {
          name: 'annualLeaveYear',
          type: 'select',
          label: 'Година за која се исплаќа регресот',
          required: true,
          options: [
            { value: '2024', label: '2024' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' }
          ],
          helpText: 'Изберете ја календарската година за која се донесува одлуката за исплата на регрес за годишен одмор. Регресот се исплаќа еднаш годишно според член 35 од Општиот колективен договор.'
        },
        {
          name: 'bonusAmount',
          type: 'number',
          label: 'Износ на регрес (во денари)',
          required: true,
          min: 1,
          helpText: 'Внесете го износот на регресот за годишен одмор во денари. Според Општиот колективен договор, регресот не смее да биде помал од 40% од просечната национална плата. Се препорачува консултирање со сметководител за точен износ.'
        },
        {
          name: 'paymentDate',
          type: 'date',
          label: 'Датум на исплата',
          required: true,
          helpText: 'Внесете го планираниот датум кога ќе се изврши исплатата на регресот. Регресот се исплаќа еднаш во текот на годината според колективниот договор.'
        },
        {
          name: 'decisionDate',
          type: 'date',
          label: 'Датум на донесување на одлуката',
          required: true,
          helpText: 'Внесете го датумот кога се донесува оваа одлука. Ова е официјалниот датум на одлуката што ќе се појави во документот и служи за правни цели.'
        }
      ]
    }
  ],

  // Validation rules
  validation: {
    required: ['annualLeaveYear', 'bonusAmount', 'paymentDate', 'decisionDate'],

    custom: {
      bonusAmount: (value) => {
        if (!value || value < 1) {
          return 'Износот на регресот мора да биде поголем од 0 денари';
        }
        return null;
      },

      paymentDate: (value, formData) => {
        if (!value) return null;

        const paymentDate = new Date(value);
        const decisionDate = formData.decisionDate ? new Date(formData.decisionDate) : null;

        if (decisionDate && paymentDate < decisionDate) {
          return 'Датумот на исплата не може да биде пред датумот на донесување на одлуката';
        }

        return null;
      }
    }
  },

  // API configuration
  apiEndpoint: 'annual-leave-bonus',
  documentName: 'Одлука за исплата на регрес за годишен одмор',
  fileName: 'odluka_za_isplata_na_regres_za_godisen_odmor'
};