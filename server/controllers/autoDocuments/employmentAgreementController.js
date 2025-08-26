const { Packer } = require('docx');
const generateEmploymentAgreementDoc = require('../../document_templates/employment/employmentAgreement');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }

    // Validate required fields
    const requiredFields = [
      'employeeName', 
      'employeeAddress', 
      'employeePIN', 
      'jobPosition', 
      'workTasks', 
      'netSalary', 
      'agreementDate'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    // Validate work tasks array
    if (!Array.isArray(formData.workTasks) || formData.workTasks.length === 0 || !formData.workTasks[0]) {
      return res.status(400).json({ message: 'At least one work task is required.' });
    }

    // Conditional validation
    if (formData.placeOfWork === 'Друго место' && !formData.otherWorkPlace) {
      return res.status(400).json({ message: 'Other work place must be specified when selected.' });
    }

    if (formData.agreementDurationType === 'определено времетраење' && !formData.definedDuration) {
      return res.status(400).json({ message: 'Duration must be specified for fixed-term agreements.' });
    }

    if (formData.dailyWorkTime === 'other' && !formData.otherWorkTime) {
      return res.status(400).json({ message: 'Custom work time must be specified when selected.' });
    }

    if (formData.concurrentClause && !formData.concurrentClauseInput) {
      return res.status(400).json({ message: 'Concurrent clause details must be provided when enabled.' });
    }

    const { doc } = generateEmploymentAgreementDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Disposition', 'attachment; filename="employment-agreement.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate;