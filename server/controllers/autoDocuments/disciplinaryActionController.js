const { Packer } = require('docx');
const generateDisciplinaryActionDoc = require('../../document_templates/employment/disciplinaryAction');

async function generate(req, res) {
  try {
    const { formData } = req.body;
    const user = req.user;
    
    // Validate user and company info
    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }
    
    // Validate required fields
    const requiredFields = ['employeeName', 'jobPosition', 'sanctionAmount', 'sanctionPeriod', 'workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate'];
    const missingFields = requiredFields.filter(field => !formData || !formData[field] || (typeof formData[field] === 'string' && !formData[field].trim()));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields.', 
        missingFields: missingFields 
      });
    }
    
    // Validate sanction amount (must be <= 15%)
    const sanctionAmount = parseInt(formData.sanctionAmount);
    if (sanctionAmount > 15) {
      return res.status(400).json({ 
        message: 'Sanction amount cannot exceed 15% of net salary.' 
      });
    }
    
    // Validate sanction period (must be <= 6 months)
    const sanctionPeriod = parseInt(formData.sanctionPeriod);
    if (sanctionPeriod > 6) {
      return res.status(400).json({ 
        message: 'Sanction period cannot exceed 6 months.' 
      });
    }
    
    // Generate document
    const { doc } = generateDisciplinaryActionDoc(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);
    
    // Set response headers and send file
    res.setHeader('Content-Disposition', 'attachment; filename="disciplinary_action.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}

module.exports = generate;