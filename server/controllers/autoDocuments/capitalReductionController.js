const { createDocumentController } = require('../../utils/baseDocumentController');
const generateCapitalReductionDoc = require('../../document_templates/centralRegister/capitalReduction');

/**
 * Capital Reduction Controller (Централен регистар — „Намалување на основна главнина").
 *
 * Assembles the full TWO-PHASE capital-reduction pack (чл. 261–263 ЗТД) into one
 * .docx: Phase I (намера, dated today) + Phase II (спроведување, dated today + 91
 * days), with every decision, statutory statement, consolidated act, book of shares
 * and POA. Validation is warning-based (non-blocking) — the user may generate a
 * draft with gaps; warnings are logged.
 */

const REQUIRED_FIELDS = []; // none hard-required; warnings handled below

const parseMKD = (v) => parseInt(String(v == null ? '' : v).split(',')[0].replace(/\D/g, '') || '0', 10) || 0;

const validateFunction = (formData) => {
  const warnings = [];
  const form = (formData?.companyForm || 'doo').toLowerCase();
  const shareholders = Array.isArray(formData?.shareholdersList) ? formData.shareholdersList.filter((s) => s && s.name) : [];

  if (shareholders.length === 0) warnings.push('Не е внесен ниту еден содружник.');
  if (form === 'dooel' && shareholders.length > 1) warnings.push('ДООЕЛ може да има само еден содружник — изберете ДОО за повеќе содружници.');
  if (form === 'doo' && shareholders.length === 1) warnings.push('ДОО бара двајца или повеќе содружници — изберете ДООЕЛ за еден содружник.');

  const totalCurrent = shareholders.reduce((a, s) => a + parseMKD(s.currentContributionMKD), 0);
  const totalNew = shareholders.reduce((a, s) => a + parseMKD(s.newContributionMKD), 0);
  if (totalNew >= totalCurrent) warnings.push('Новата основна главнина мора да биде помала од тековната — проверете ги влоговите (намалување).');

  if (!formData?.managerName) warnings.push('Не е внесен управител — потребен е за изјавите по чл. 263 и чл. 32.');

  // Phase II references the Службен весник publication of the intent decision.
  if (!formData?.gazetteNumber || !formData?.gazetteDate) {
    warnings.push('Бројот/датумот на Службен весник не се внесени — ќе се прикажат како [број]/[датум] во документите од Фаза II.');
  }

  // Personal-data companion needs at least one new address.
  const pdOn = formData?.includePersonalDataChange === 'да' || formData?.includePersonalDataChange === true;
  if (pdOn && !shareholders.some((s) => s.newAddress && s.newAddress.trim())) {
    warnings.push('Избрана е промена на лични податоци, но ниту еден содружник нема внесена нова адреса.');
  }

  if (warnings.length) console.log('[namaluvanje-glavnina] Warnings:', warnings.join(' | '));
  return { isValid: true, warnings };
};

const capitalReductionController = createDocumentController({
  templateFunction: generateCapitalReductionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'namaluvanje-osnovna-glavnina',
  validateFunction
});

module.exports = capitalReductionController;
