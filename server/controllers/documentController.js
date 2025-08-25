const { ObjectId } = require('mongodb');
const { Packer } = require('docx');
const { getUserAndCompanyForDocument, saveDocumentRecord } = require('../utils/documentUtils');
const { generateConsentForPersonalDataProcessingDoc } = require('../document_templates/personalDataProtection/consentForPersonalDataProcessing');

// A map to associate document types with their generation functions
const documentGeneratorMap = {
  'consent-personal-data': generateConsentForPersonalDataProcessingDoc,
};

// Generic document generation controller
exports.generateDocument = async (req, res) => {
  const { userId, formData } = req.body;
  const { documentType } = req.params;
  const db = req.db;

  if (!userId || !formData) {
    return res.status(400).json({ message: 'User ID and form data are required.' });
  }

  const generateDoc = documentGeneratorMap[documentType];
  if (!generateDoc) {
    return res.status(404).json({ message: 'Document type not found.' });
  }

  try {
    const { user, company } = await getUserAndCompanyForDocument(db, userId);
    const doc = await generateDoc(user, company, formData);
    const buffer = await Packer.toBuffer(doc);

    await saveDocumentRecord(db, userId, {
      documentType: documentType,
      fileName: `${documentType}-${Date.now()}.docx`,
      formData: formData,
    });

    res.setHeader('Content-Disposition', `attachment; filename=${documentType}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(`Error generating ${documentType} document:`, error);
    res.status(500).json({ message: `Failed to generate document: ${error.message}` });
  }
};

// Get all documents for the current user
exports.getAllDocuments = async (req, res) => {
  const db = req.db;
  const userId = req.user.id;

  try {
    const documents = await db.collection('documents').find({ userId: new ObjectId(userId) }).toArray();
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents.' });
  }
};

// Get a single document by its ID
exports.getDocumentById = async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const document = await db.collection('documents').findOne({ _id: new ObjectId(id) });
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }
    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Failed to fetch document.' });
  }
};

// Delete a document by its ID
exports.deleteDocument = async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.collection('documents').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Document not found.' });
    }
    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document.' });
  }
};
