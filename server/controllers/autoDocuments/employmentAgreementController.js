const { Packer } = require('docx');
const generateEmploymentAgreementDoc = require('../../document_templates/employment/employmentAgreement');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }

    // Basic validation - only check if formData exists
    if (!formData) {
      return res.status(400).json({ message: 'Form data is required.' });
    }

    // Ensure workTasks is an array (even if empty)
    if (!formData.workTasks) {
      formData.workTasks = [];
    } else if (!Array.isArray(formData.workTasks)) {
      formData.workTasks = [formData.workTasks];
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