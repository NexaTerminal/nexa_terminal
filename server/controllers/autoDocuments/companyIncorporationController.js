const { createDocumentController } = require('../../utils/baseDocumentController');
const generateCompanyIncorporationDoc = require('../../document_templates/centralRegister/companyIncorporation');

/**
 * Company Incorporation Controller (Централен регистар — „Основање на фирма").
 *
 * Assembles the full incorporation pack (constitutive doc + statutory statements +
 * POAs + ЗП образец) into one .docx with page breaks. Validation is warning-based
 * (non-blocking) — the user may generate a draft with gaps; warnings are logged.
 */

const REQUIRED_FIELDS = []; // none hard-required; warnings handled below

const validateFunction = (formData) => {
  const warnings = [];
  const isDooel = (formData?.companyForm || 'dooel').toLowerCase() === 'dooel';
  const founders = Array.isArray(formData?.foundersList) ? formData.foundersList.filter(Boolean) : [];

  if (founders.length === 0) warnings.push('Не е внесен ниту еден основач.');
  if (isDooel && founders.length > 1) warnings.push('ДООЕЛ може да има само еден основач — изберете ДОО за повеќе основачи.');
  if (!isDooel && founders.length === 1) warnings.push('ДОО бара двајца или повеќе основачи — изберете ДООЕЛ за еден основач.');

  // Capital minimum (EUR 5.000)
  const capNum = parseFloat(String(formData?.capitalEUR || '').replace(/\./g, '').replace(',', '.'));
  if (!isNaN(capNum) && capNum < 5000) warnings.push('Основната главнина не може да биде помала од ЕУР 5.000 (законски минимум).');

  // Foreign natural persons need passport/ID + country
  founders.forEach((f, i) => {
    if (f.personType === 'natural_foreign' && (!f.idNumber || !f.country)) {
      warnings.push(`Основач #${i + 1} е странско лице — потребен е број на пасош/лична карта и државјанство.`);
    }
  });

  // Non-monetary needs an appraiser
  if ((formData?.contributionType || '').toLowerCase() === 'non_monetary' && !formData?.appraiser) {
    warnings.push('Кај непаричен влог наведете овластен проценувач.');
  }

  if (warnings.length) console.log('[osnovanje-firma] Warnings:', warnings.join(' | '));
  return { isValid: true, warnings };
};

const companyIncorporationController = createDocumentController({
  templateFunction: generateCompanyIncorporationDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'osnovanje-firma',
  validateFunction
});

module.exports = companyIncorporationController;
