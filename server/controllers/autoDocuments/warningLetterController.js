const { Packer } = require('docx');
const generateWarningLetterDoc = require('../../document_templates/employment/warningLetter');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    
    // Validate user and company info
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    
    // Validate required fields (simplified compared to disciplinary action)
    const requiredFields = ['employeeName', 'warningDate', 'employeeWrongDoing', 'rulesNotRespected', 'articleNumber'];
    const missingFields = requiredFields.filter(field => !formData || !formData[field] || (typeof formData[field] === 'string' && !formData[field].trim()));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields.', 
        missingFields: missingFields 
      });
    }
    
    // Generate document
    const { doc } = generateWarningLetterDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    
    // Set response headers and send file
    res.setHeader('Content-Disposition', 'attachment; filename="warning_letter_employee.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate;