const { Packer } = require('docx');
const generateTerminationAgreementDoc = require('../../document_templates/employment/terminationAgreement');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    if (!formData || !formData.employeeName || !formData.employeePIN || !formData.employeeAddress || !formData.endDate) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const { doc } = generateTerminationAgreementDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename="termination-agreement.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate; 