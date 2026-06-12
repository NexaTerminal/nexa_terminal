const { createDocumentController } = require('../../utils/baseDocumentController');
const generateCompanyChangesDoc = require('../../document_templates/centralRegister/companyChanges');

/**
 * Company Changes Controller (Централен регистар — „Промени во фирма").
 *
 * Dynamic document package: assembles the decisions + statutory statements +
 * power of attorney required to register the selected company changes in the
 * Trade Register, into one .docx with page breaks.
 *
 * Validation is intentionally warning-based (non-blocking) per MASTER §6/§7 —
 * the user may generate a draft even with gaps; warnings surface in the
 * missing-fields modal rather than blocking generation.
 */

const REQUIRED_FIELDS = []; // none hard-required; warnings handled below

/**
 * Non-blocking validation. Returns { isValid: true } always, but logs warnings.
 * (baseDocumentController only blocks when isValid === false.)
 */
const validateFunction = (formData) => {
  const warnings = [];
  const changes = Array.isArray(formData?.changes) ? formData.changes : [];

  if (changes.length === 0) {
    warnings.push('Не е избрана ниту една промена.');
  }

  const form = (formData?.companyForm || 'dooel').toLowerCase();
  const shareholders = Array.isArray(formData?.shareholdersList) ? formData.shareholdersList.filter(Boolean) : [];
  if (form === 'dooel' && shareholders.length > 1) {
    warnings.push('ДООЕЛ може да има само еден содружник — проверете ја содружничката структура.');
  }

  // Foreign physical persons require passport + citizenship
  shareholders.forEach((s, i) => {
    const foreign = s.isForeign === true || s.isForeign === 'да' || s.isForeign === 'yes';
    if (foreign && s.entityType !== 'legal' && (!s.idNumber || !s.citizenship)) {
      warnings.push(`Содружник #${i + 1} е странско лице — потребен е број на пасош и државјанство.`);
    }
  });

  // M5 (share transfer) cascade checks (MASTER §6)
  if (changes.includes('M5')) {
    const transferorWithdraws = formData?.m5TransferorWithdraws !== 'не';
    const transfereeIsNew = formData?.m5TransfereeIsNew === 'да';

    // Transferor who was also a manager and is leaving → manager change needed
    const transferor = shareholders.find((s) => (s.name || '').trim().toLowerCase() === (formData?.m5TransferorName || '').trim().toLowerCase());
    if (transferorWithdraws && transferor && (transferor.isAlsoManager === 'да' || transferor.isAlsoManager === true) && !changes.includes('M4')) {
      warnings.push('Отстапувачот е и управител и истапува — додадете и „Промена на управител" (M4).');
    }

    // ДООЕЛ gaining a second owner → must become ДОО
    if (form === 'dooel' && transfereeIsNew && !transferorWithdraws) {
      warnings.push('ДООЕЛ не може да има два содружника — формата треба да премине во ДОО (сменете ја формата во чекор 2).');
    }

    // ДОО dropping to a single owner → must rename to ДООЕЛ (trigger M1)
    if (form === 'doo' && transferorWithdraws && shareholders.length <= 2 && !changes.includes('M1')) {
      warnings.push('По преносот Друштвото може да остане со еден содружник — називот мора да се смени од ДОО во ДООЕЛ (додадете „Промена на назив" — M1).');
    }
  }

  if (warnings.length) {
    console.log('[promeni-vo-firma] Warnings:', warnings.join(' | '));
  }
  return { isValid: true, warnings };
};

const companyChangesController = createDocumentController({
  templateFunction: generateCompanyChangesDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'promeni-vo-firma',
  validateFunction
});

module.exports = companyChangesController;
