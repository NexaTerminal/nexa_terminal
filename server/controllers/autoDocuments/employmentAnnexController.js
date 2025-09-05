const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateEmploymentAnnexDoc = require('../../document_templates/employment/employmentAnnex');

/**
 * Employment Annex Controller
 * Uses the base controller factory for common functionality
 * Handles employment agreement amendments and modifications
 */

// Define required fields for employment annex
const REQUIRED_FIELDS = [
  'employeeName',
  'employeePIN',
  'employeeAddress',
  'agreementNo',
  'annexDate',
  'changeType'
];

/**
 * Custom validation function for employment annex
 */
const validateEmploymentAnnex = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee PIN (EMBG) - exactly 13 digits
  if (!validators.nonEmpty(formData.employeePIN)) {
    missing.push('ЕМБГ на работникот');
  } else if (!validators.pin(formData.employeePIN)) {
    errors.employeePIN = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  // Validate employee address
  if (!validators.nonEmpty(formData.employeeAddress)) {
    missing.push('Адреса на работникот');
  }

  // Validate original agreement number
  if (!validators.nonEmpty(formData.agreementNo)) {
    missing.push('Број на оригиналниот договор');
  }

  // Validate annex date
  if (!validators.nonEmpty(formData.annexDate)) {
    missing.push('Датум на анекс');
  } else if (!validators.date(formData.annexDate)) {
    errors.annexDate = 'Внесете валиден датум за анексот';
  }

  // Validate change type
  if (!validators.nonEmpty(formData.changeType)) {
    missing.push('Тип на измена');
  } else {
    const validChangeTypes = ['agreementDuration', 'basicSalary', 'jobPosition', 'otherAgreementChange'];
    if (!validChangeTypes.includes(formData.changeType)) {
      errors.changeType = 'Неважечки тип на измена';
    }
  }

  // Validate change-specific fields based on change type
  if (formData.changeType === 'agreementDuration') {
    // Validate duration type selection
    if (!validators.nonEmpty(formData.durationType)) {
      missing.push('Тип на времетраење');
    } else {
      const validDurationTypes = ['indefinite', 'definite'];
      if (!validDurationTypes.includes(formData.durationType)) {
        errors.durationType = 'Неважечки тип на времетраење';
      }
    }
    
    // Only validate end date if definite duration is selected
    if (formData.durationType === 'definite') {
      if (!validators.nonEmpty(formData.endDate)) {
        missing.push('Нов датум на престанок');
      } else if (!validators.date(formData.endDate)) {
        errors.endDate = 'Внесете валиден датум на престанок';
      } else {
        // Validate that end date is in the future
        const endDateObj = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (endDateObj <= today) {
          errors.endDate = 'Датумот на престанок мора да биде во иднина';
        }
      }
    }
    
    // Validate changed article for duration
    if (!validators.nonEmpty(formData.durationChangedArticle)) {
      missing.push('Член кој се менува (времетраење)');
    }
  }

  if (formData.changeType === 'basicSalary') {
    if (!validators.nonEmpty(formData.newBasicSalary)) {
      missing.push('Нова основна плата');
    } else if (!validators.number(formData.newBasicSalary) || parseFloat(formData.newBasicSalary) <= 0) {
      errors.newBasicSalary = 'Внесете валидна сума за основната плата (поголема од 0)';
    }
    
    // Validate changed article for salary
    if (!validators.nonEmpty(formData.salaryChangedArticle)) {
      missing.push('Член кој се менува (плата)');
    }
  }

  if (formData.changeType === 'jobPosition') {
    if (!validators.nonEmpty(formData.newJobPosition)) {
      missing.push('Нова работна позиција');
    }
    
    if (!validators.nonEmpty(formData.newJobTasks)) {
      missing.push('Нови работни задачи');
    }
    
    // Validate changed article for position
    if (!validators.nonEmpty(formData.positionChangedArticle)) {
      missing.push('Член кој се менува (позиција)');
    }
  }

  if (formData.changeType === 'otherAgreementChange') {
    if (!validators.nonEmpty(formData.changedArticle)) {
      missing.push('Член кој се менува');
    }
    if (!validators.nonEmpty(formData.otherAgreementChangeContent)) {
      missing.push('Нов текст на членот');
    }
  }

  // Check if company information is available
  if (!company || !company.companyName) {
    errors.company = 'Информациите за компанијата не се пополнети. Ве молиме пополнете ги во профилот.';
    missing.push('Информации за компанијата');
  }

  // Check required company fields
  if (company) {
    if (!company.companyName || company.companyName.trim() === '') {
      missing.push('Име на компанијата');
    }
    if (!company.address || company.address.trim() === '') {
      missing.push('Адреса на компанијата');
    }
    if (!company.taxNumber || company.taxNumber.trim() === '') {
      missing.push('ЕМБС на компанијата');
    }
    if (!company.manager || company.manager.trim() === '') {
      missing.push('Управител на компанијата');
    }
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    message: missing.length > 0 ? `Недостасуваат задолжителни полиња: ${missing.join(', ')}` : null
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessEmploymentAnnexData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.annexDate) {
    processed.annexDate = new Date(processed.annexDate).toISOString().split('T')[0];
  }
  
  if (processed.endDate) {
    processed.endDate = new Date(processed.endDate).toISOString().split('T')[0];
  }

  // Clean PIN field - remove any spaces
  if (processed.employeePIN) {
    processed.employeePIN = processed.employeePIN.replace(/\s/g, '');
  }

  // Format salary as number if provided
  if (processed.newBasicSalary) {
    processed.newBasicSalary = parseFloat(processed.newBasicSalary).toFixed(0);
  }

  return processed;
};

// Create the employment annex controller using the base factory
const employmentAnnexController = createDocumentController({
  templateFunction: generateEmploymentAnnexDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'анекс-договор-вработување',
  validateFunction: validateEmploymentAnnex,
  preprocessFunction: preprocessEmploymentAnnexData
});

module.exports = employmentAnnexController;