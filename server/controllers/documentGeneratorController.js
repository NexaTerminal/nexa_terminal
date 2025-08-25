const { Packer } = require('docx');
const templates = require('../document_templates');

exports.generateDocument = async (req, res) => {
  try {
    const { documentType, formData } = req.body;
    const user = req.user;

    if (!user || !user.companyInfo) {
      return res.status(400).json({ message: 'User or company info missing.' });
    }

    // Dynamically get the template function
    const templateFn = templates[documentType];
    if (!templateFn) {
      return res.status(400).json({ message: 'Unknown document type.' });
    }

    // Generate docx
    const { doc, filenameSuffix } = templateFn(formData, user, user.companyInfo);
    const buffer = await Packer.toBuffer(doc);

    const safeFilename = `${documentType}_${Date.now()}.docx`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating document', error: error.message });
  }
}; 