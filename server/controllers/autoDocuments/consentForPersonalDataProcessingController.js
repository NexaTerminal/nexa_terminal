const { Packer } = require('docx');
const generateConsentForPersonalDataProcessingDoc = require('../../document_templates/personalDataProtection/consentForPersonalDataProcessing');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    if (!formData || !formData.employeeName || !formData.employeeAddress || !formData.employeeWorkPosition) {
      return res.status(400).json({ message: 'Missing required employee fields.' });
    }
    console.log('formData:', formData);
    console.log('user:', user);
    console.log('companyInfo:', user.companyInfo);
    const { doc } = generateConsentForPersonalDataProcessingDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename="consent_for_personal_data.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate; 