const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { ChatOpenAI } = require('@langchain/openai');
const TemplateStorageService = require('../services/templateStorageService');

// Configure multer for .docx uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.docx') {
    return cb(new Error('Дозволени се само .docx датотеки'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * Upload a .docx file and return HTML preview
 */
async function uploadTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Не е прикачена датотека' });
    }

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    // Convert to HTML preview using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const htmlPreview = result.value;

    // Decode filename properly (multer encodes non-ASCII as Latin-1)
    const decodedFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // Store original in GridFS
    const db = req.app.locals.db;
    const templateStorage = new TemplateStorageService(db);
    const originalFileId = await templateStorage.storeTemplate(buffer, {
      fileName: decodedFileName,
      userId: req.user._id || req.user.id,
      templateType: 'original'
    });

    // Clean up temp file
    fs.unlinkSync(filePath);

    res.json({
      originalFileId: originalFileId.toString(),
      originalFileName: decodedFileName,
      htmlPreview
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('❌ Error uploading template:', error);
    res.status(500).json({ error: 'Грешка при прикачување на датотеката' });
  }
}

/**
 * Save a template with field definitions (creates tagged .docx)
 */
async function createTemplate(req, res) {
  try {
    const { name, description, originalFileId, originalFileName, fields, htmlPreview, category } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name || !originalFileId || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Потребни се име, оригинална датотека и полиња' });
    }

    const db = req.app.locals.db;
    const templateStorage = new TemplateStorageService(db);

    // Load original .docx from GridFS
    const originalBuffer = await templateStorage.retrieveTemplate(originalFileId);

    // Inject tags into the .docx
    const taggedBuffer = injectTagsIntoDocx(originalBuffer, fields);

    // Store tagged .docx in GridFS
    const taggedFileId = await templateStorage.storeTemplate(taggedBuffer, {
      fileName: `tagged_${originalFileName || 'template.docx'}`,
      userId,
      templateType: 'tagged'
    });

    // Save template metadata to MongoDB
    const collection = db.collection('custom_templates');
    const template = {
      userId: new ObjectId(userId),
      name,
      description: description || '',
      originalFileName: originalFileName || 'template.docx',
      fileId: taggedFileId,
      originalFileId: new ObjectId(originalFileId),
      fields,
      htmlPreview: htmlPreview || '',
      category: category || '',
      currentVersion: 1,
      generationCount: 0,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(template);
    template._id = result.insertedId;

    res.status(201).json(template);
  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(500).json({ error: 'Грешка при креирање на шаблонот' });
  }
}

/**
 * List all templates for the current user
 */
async function listTemplates(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { category } = req.query;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const query = { userId: new ObjectId(userId) };
    if (category) query.category = category;

    const templates = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .project({ htmlPreview: 0 }) // Exclude large HTML from listing
      .toArray();

    res.json(templates);
  } catch (error) {
    console.error('❌ Error listing templates:', error);
    res.status(500).json({ error: 'Грешка при вчитување на шаблоните' });
  }
}

/**
 * Get a single template by ID
 */
async function getTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Шаблонот не е пронајден' });
    }

    res.json(template);
  } catch (error) {
    console.error('❌ Error getting template:', error);
    res.status(500).json({ error: 'Грешка при вчитување на шаблонот' });
  }
}

/**
 * Update a template
 */
async function updateTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { name, description, fields, category } = req.body;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');
    const versionsCollection = db.collection('template_versions');

    // Fetch existing template to access original file
    const existing = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });

    if (!existing) {
      return res.status(404).json({ error: 'Шаблонот не е пронајден' });
    }

    // Snapshot current state as a version before applying updates
    const currentVersion = existing.currentVersion || 1;
    await versionsCollection.insertOne({
      templateId: existing._id,
      version: currentVersion,
      userId: new ObjectId(userId),
      name: existing.name,
      description: existing.description,
      fields: existing.fields,
      fileId: existing.fileId,
      originalFileId: existing.originalFileId,
      htmlPreview: existing.htmlPreview,
      category: existing.category,
      createdAt: new Date()
    });

    const updateData = { updatedAt: new Date(), currentVersion: currentVersion + 1 };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    // If fields changed, re-generate the tagged .docx from the original
    if (fields !== undefined && Array.isArray(fields)) {
      updateData.fields = fields;

      const templateStorage = new TemplateStorageService(db);

      // Load original .docx and re-inject all tags
      const originalBuffer = await templateStorage.retrieveTemplate(existing.originalFileId);
      const taggedBuffer = injectTagsIntoDocx(originalBuffer, fields);

      // Don't delete old tagged file - it belongs to the version snapshot
      const newTaggedFileId = await templateStorage.storeTemplate(taggedBuffer, {
        fileName: `tagged_${existing.originalFileName || 'template.docx'}`,
        userId,
        templateType: 'tagged'
      });

      updateData.fileId = newTaggedFileId;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({ error: 'Грешка при ажурирање на шаблонот' });
  }
}

/**
 * Delete a template and its GridFS files
 */
async function deleteTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Шаблонот не е пронајден' });
    }

    // Delete GridFS files for current template
    const templateStorage = new TemplateStorageService(db);
    await templateStorage.deleteTemplate(template.fileId).catch(() => {});
    await templateStorage.deleteTemplate(template.originalFileId).catch(() => {});

    // Cascade delete version records and their GridFS files
    const versionsCollection = db.collection('template_versions');
    const versions = await versionsCollection.find({ templateId: template._id }).toArray();
    for (const version of versions) {
      if (version.fileId) await templateStorage.deleteTemplate(version.fileId).catch(() => {});
      if (version.originalFileId) await templateStorage.deleteTemplate(version.originalFileId).catch(() => {});
    }
    await versionsCollection.deleteMany({ templateId: template._id });

    // Cascade delete generation history records and their GridFS files
    const GenerationHistoryService = require('../services/generationHistoryService');
    const historyService = new GenerationHistoryService(db);
    const historyRecords = await db.collection('template_generations')
      .find({ templateId: template._id }).toArray();
    for (const record of historyRecords) {
      if (record.fileId) {
        try { await historyService.bucket.delete(record.fileId); } catch (e) { /* ignore */ }
      }
    }
    await db.collection('template_generations').deleteMany({ templateId: template._id });

    // Delete metadata
    await collection.deleteOne({ _id: template._id });

    res.json({ message: 'Шаблонот е успешно избришан' });
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({ error: 'Грешка при бришење на шаблонот' });
  }
}

/**
 * Generate a filled document from a template
 */
async function generateDocument(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { formData } = req.body;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Шаблонот не е пронајден' });
    }

    // Load tagged .docx from GridFS
    const templateStorage = new TemplateStorageService(db);
    const fileId = template.fileId;
    console.log('📄 Generating document from template:', template.name, 'fileId:', fileId, 'type:', typeof fileId);

    const taggedBuffer = await templateStorage.retrieveTemplate(fileId);
    console.log('📄 Tagged buffer loaded, size:', taggedBuffer.length);

    // Fill template with docxtemplater
    const zip = new PizZip(taggedBuffer);

    // Sanitize stray braces in the stored template (handles templates
    // created before the sanitization was added to injectTagsIntoDocx)
    const xmlFile = zip.file('word/document.xml');
    if (xmlFile && template.fields) {
      const sanitized = sanitizeBraces(xmlFile.asText(), template.fields);
      zip.file('word/document.xml', sanitized);
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter(part) { return ''; }
    });

    console.log('📄 Setting data:', JSON.stringify(formData));
    doc.setData(formData || {});
    doc.render();
    console.log('📄 Document rendered successfully');

    const outputBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Send the generated document
    const fileName = `${template.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, '')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(outputBuffer);

    // Fire-and-forget: update generation count and record history
    collection.updateOne({ _id: template._id }, { $inc: { generationCount: 1 } }).catch(() => {});
    const GenerationHistoryService = require('../services/generationHistoryService');
    const historyService = new GenerationHistoryService(db);
    historyService.recordGeneration({
      userId, templateId: template._id, templateName: template.name,
      formData, buffer: outputBuffer, fileName
    }).catch(err => console.error('Error recording generation:', err));
  } catch (error) {
    console.error('❌ Error generating document:', error);
    res.status(500).json({ error: 'Грешка при генерирање на документот' });
  }
}

/**
 * Inject {tags} into a .docx buffer by replacing originalText with tag placeholders.
 * Handles text that may be split across multiple XML runs.
 */
function injectTagsIntoDocx(buffer, fields) {
  const zip = new PizZip(buffer);
  const xmlFile = zip.file('word/document.xml');

  if (!xmlFile) {
    throw new Error('Invalid .docx file: missing document.xml');
  }

  let xmlContent = xmlFile.asText();

  // For each field, replace the original text with a docxtemplater tag
  for (const field of fields) {
    if (!field.originalText || !field.name) continue;

    const tag = field.type === 'checkbox'
      ? `{#${field.name}}${field.originalText}{/${field.name}}`
      : `{${field.name}}`;
    const originalText = field.originalText;

    // First try: direct replacement in the raw XML text nodes
    // This handles cases where the text is in a single run
    if (xmlContent.includes(originalText)) {
      xmlContent = xmlContent.replace(originalText, tag);
      continue;
    }

    // Second try: text might be split across multiple <w:r> runs
    // We need to find it across run boundaries
    xmlContent = replaceTextAcrossRuns(xmlContent, originalText, tag);
  }

  // Sanitize stray curly braces that are not part of our injected tags.
  // docxtemplater treats { and } as delimiters, so any pre-existing braces
  // in the document text will cause "duplicate open/close tag" errors.
  xmlContent = sanitizeBraces(xmlContent, fields);

  zip.file('word/document.xml', xmlContent);

  return zip.generate({
    type: 'nodebuffer',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

/**
 * Replace text that may be split across multiple <w:r> (run) elements in .docx XML.
 *
 * In .docx format, a single visible word like "Company" might be stored as:
 *   <w:r><w:t>Com</w:t></w:r><w:r><w:t>pany</w:t></w:r>
 *
 * This function finds such split text and merges the runs to insert the tag.
 */
function replaceTextAcrossRuns(xml, searchText, replacement) {
  // Find all <w:p> paragraphs
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let match;

  while ((match = paragraphRegex.exec(xml)) !== null) {
    const paragraph = match[0];

    // Extract all text content from this paragraph's runs
    const textParts = [];
    const runRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
    let runMatch;
    const runs = [];

    while ((runMatch = runRegex.exec(paragraph)) !== null) {
      const run = runMatch[0];
      const textMatch = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
      const text = textMatch ? textMatch[1] : '';
      runs.push({
        fullMatch: run,
        text,
        index: runMatch.index
      });
      textParts.push(text);
    }

    const fullText = textParts.join('');

    // Check if our search text exists in the concatenated paragraph text
    const searchIndex = fullText.indexOf(searchText);
    if (searchIndex === -1) continue;

    // Find which runs contain the search text
    let charCount = 0;
    let startRunIdx = -1;
    let endRunIdx = -1;
    let startCharInRun = 0;
    let endCharInRun = 0;

    for (let i = 0; i < runs.length; i++) {
      const runStart = charCount;
      const runEnd = charCount + runs[i].text.length;

      if (startRunIdx === -1 && searchIndex < runEnd) {
        startRunIdx = i;
        startCharInRun = searchIndex - runStart;
      }

      if (startRunIdx !== -1 && searchIndex + searchText.length <= runEnd) {
        endRunIdx = i;
        endCharInRun = searchIndex + searchText.length - runStart;
        break;
      }

      charCount = runEnd;
    }

    if (startRunIdx === -1 || endRunIdx === -1) continue;

    // Build the new paragraph by modifying the affected runs
    let newParagraph = paragraph;

    if (startRunIdx === endRunIdx) {
      // Text is within a single run but wasn't found by direct replacement
      // (rare case, maybe XML entities)
      const run = runs[startRunIdx];
      const newText = run.text.substring(0, startCharInRun) + replacement + run.text.substring(endCharInRun);
      const newRun = run.fullMatch.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${newText}</w:t>`);
      newParagraph = newParagraph.replace(run.fullMatch, newRun);
    } else {
      // Text spans multiple runs - put replacement in first run, clear middle runs, trim end run
      // Process in reverse order to preserve string indices

      // End run: keep text after the match
      const endRun = runs[endRunIdx];
      const endRemaining = endRun.text.substring(endCharInRun);
      if (endRemaining) {
        const newEndRun = endRun.fullMatch.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t xml:space="preserve">${endRemaining}</w:t>`);
        newParagraph = newParagraph.replace(endRun.fullMatch, newEndRun);
      } else {
        newParagraph = newParagraph.replace(endRun.fullMatch, '');
      }

      // Middle runs: remove entirely
      for (let i = endRunIdx - 1; i > startRunIdx; i--) {
        newParagraph = newParagraph.replace(runs[i].fullMatch, '');
      }

      // Start run: keep text before match + replacement
      const startRun = runs[startRunIdx];
      const startKeep = startRun.text.substring(0, startCharInRun);
      const newStartRun = startRun.fullMatch.replace(
        /<w:t[^>]*>[\s\S]*?<\/w:t>/,
        `<w:t xml:space="preserve">${startKeep}${replacement}</w:t>`
      );
      newParagraph = newParagraph.replace(startRun.fullMatch, newStartRun);
    }

    xml = xml.replace(paragraph, newParagraph);
    break; // Replace only the first occurrence per field
  }

  return xml;
}

/**
 * Remove stray { and } from document XML text nodes, preserving only our template tags.
 * This prevents docxtemplater from misinterpreting pre-existing braces in the document.
 */
function sanitizeBraces(xml, fields) {
  const fieldNames = fields.map(f => f.name).filter(Boolean);
  if (fieldNames.length === 0) return xml;

  // Build a regex that matches our template tags: {fieldName}
  const escapedNames = fieldNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const tagPattern = new RegExp(`\\{[#/]?(${escapedNames.join('|')})\\}`, 'g');

  // Temporarily replace our tags with placeholders
  const placeholders = [];
  let sanitized = xml.replace(tagPattern, (match) => {
    const placeholder = `__TMPL_TAG_${placeholders.length}__`;
    placeholders.push(match);
    return placeholder;
  });

  // Remove all remaining { and } from text content within <w:t> tags only
  sanitized = sanitized.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (full, open, content, close) => {
    return open + content.replace(/[{}]/g, '') + close;
  });

  // Restore our template tags
  placeholders.forEach((tag, i) => {
    sanitized = sanitized.replace(`__TMPL_TAG_${i}__`, tag);
  });

  return sanitized;
}

/**
 * Duplicate a template (creates a full copy including GridFS files)
 */
async function duplicateTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ error: 'Шаблонот не е пронајден' });
    }

    const templateStorage = new TemplateStorageService(db);

    // Copy both GridFS files
    const originalBuffer = await templateStorage.retrieveTemplate(template.originalFileId);
    const newOriginalFileId = await templateStorage.storeTemplate(originalBuffer, {
      fileName: template.originalFileName,
      userId,
      templateType: 'original'
    });

    const taggedBuffer = await templateStorage.retrieveTemplate(template.fileId);
    const newTaggedFileId = await templateStorage.storeTemplate(taggedBuffer, {
      fileName: `tagged_${template.originalFileName}`,
      userId,
      templateType: 'tagged'
    });

    const newTemplate = {
      userId: new ObjectId(userId),
      name: template.name + ' (Копија)',
      description: template.description || '',
      originalFileName: template.originalFileName,
      fileId: newTaggedFileId,
      originalFileId: newOriginalFileId,
      fields: template.fields,
      htmlPreview: template.htmlPreview || '',
      category: template.category || '',
      currentVersion: 1,
      generationCount: 0,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newTemplate);
    newTemplate._id = result.insertedId;

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Грешка при дуплирање на шаблонот' });
  }
}

/**
 * Get all categories (predefined + user-defined)
 */
async function getCategories(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const predefined = ['Вработување', 'Договори', 'Лични податоци', 'Финансии', 'Администрација', 'Друго'];

    const userCategories = await collection.distinct('category', {
      userId: new ObjectId(userId),
      category: { $nin: ['', null, undefined] }
    });

    const allCategories = [...new Set([...predefined, ...userCategories])];
    res.json(allCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Грешка при вчитување на категориите' });
  }
}

/**
 * List all versions of a template
 */
async function listVersions(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;

    // Verify template ownership
    const template = await db.collection('custom_templates').findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });
    if (!template) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    const versions = await db.collection('template_versions')
      .find({ templateId: new ObjectId(req.params.id) })
      .sort({ version: -1 })
      .toArray();

    res.json(versions);
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: 'Грешка при вчитување на верзиите' });
  }
}

/**
 * Rollback a template to a specific version
 */
async function rollbackToVersion(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');
    const versionsCollection = db.collection('template_versions');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });
    if (!template) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    const version = await versionsCollection.findOne({
      _id: new ObjectId(req.params.versionId),
      templateId: new ObjectId(req.params.id)
    });
    if (!version) return res.status(404).json({ error: 'Верзијата не е пронајдена' });

    // Snapshot current state as a new version before rollback
    const currentVersion = template.currentVersion || 1;
    await versionsCollection.insertOne({
      templateId: template._id,
      version: currentVersion,
      userId: new ObjectId(userId),
      name: template.name,
      description: template.description,
      fields: template.fields,
      fileId: template.fileId,
      originalFileId: template.originalFileId,
      htmlPreview: template.htmlPreview,
      category: template.category,
      createdAt: new Date()
    });

    // Restore from version
    await collection.updateOne(
      { _id: template._id },
      { $set: {
        name: version.name,
        description: version.description,
        fields: version.fields,
        fileId: version.fileId,
        originalFileId: version.originalFileId,
        htmlPreview: version.htmlPreview,
        category: version.category,
        currentVersion: currentVersion + 1,
        updatedAt: new Date()
      }}
    );

    res.json({ message: 'Шаблонот е вратен на верзија ' + version.version });
  } catch (error) {
    console.error('Error rolling back version:', error);
    res.status(500).json({ error: 'Грешка при враќање на верзијата' });
  }
}

/**
 * Publish a template to the marketplace
 */
async function publishTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });
    if (!template) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    const publisherName = req.user.fullName || req.user.companyInfo?.companyName || 'Анонимен';

    await collection.updateOne(
      { _id: template._id },
      { $set: { isPublic: true, publishedAt: new Date(), publisherName, updatedAt: new Date() } }
    );

    res.json({ message: 'Шаблонот е објавен' });
  } catch (error) {
    console.error('Error publishing template:', error);
    res.status(500).json({ error: 'Грешка при објавување' });
  }
}

/**
 * Unpublish a template from the marketplace
 */
async function unpublishTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });
    if (!template) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    await collection.updateOne(
      { _id: template._id },
      { $set: { isPublic: false, publishedAt: null, updatedAt: new Date() } }
    );

    res.json({ message: 'Шаблонот е повлечен' });
  } catch (error) {
    console.error('Error unpublishing template:', error);
    res.status(500).json({ error: 'Грешка при повлекување' });
  }
}

/**
 * List all public templates (marketplace browse)
 */
async function listPublicTemplates(req, res) {
  try {
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');
    const { search, category, page = 1, limit = 20 } = req.query;

    const query = { isPublic: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [templates, total] = await Promise.all([
      collection.find(query)
        .project({ htmlPreview: 0, fileId: 0, originalFileId: 0 })
        .sort({ cloneCount: -1, publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      collection.countDocuments(query)
    ]);

    res.json({ templates, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Error listing public templates:', error);
    res.status(500).json({ error: 'Грешка при вчитување' });
  }
}

/**
 * Clone a public template into the current user's collection
 */
async function clonePublicTemplate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');

    const original = await collection.findOne({
      _id: new ObjectId(req.params.id),
      isPublic: true
    });
    if (!original) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    const templateStorage = new TemplateStorageService(db);

    // Copy GridFS files
    const originalBuffer = await templateStorage.retrieveTemplate(original.originalFileId);
    const newOriginalFileId = await templateStorage.storeTemplate(originalBuffer, {
      fileName: original.originalFileName, userId, templateType: 'original'
    });

    const taggedBuffer = await templateStorage.retrieveTemplate(original.fileId);
    const newTaggedFileId = await templateStorage.storeTemplate(taggedBuffer, {
      fileName: `tagged_${original.originalFileName}`, userId, templateType: 'tagged'
    });

    const newTemplate = {
      userId: new ObjectId(userId),
      name: original.name,
      description: original.description || '',
      originalFileName: original.originalFileName,
      fileId: newTaggedFileId,
      originalFileId: newOriginalFileId,
      fields: original.fields,
      htmlPreview: original.htmlPreview || '',
      category: original.category || '',
      currentVersion: 1,
      generationCount: 0,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newTemplate);
    newTemplate._id = result.insertedId;

    // Increment clone count on original
    collection.updateOne({ _id: original._id }, { $inc: { cloneCount: 1 } }).catch(() => {});

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ error: 'Грешка при клонирање' });
  }
}

/**
 * Bulk generate documents from a template using CSV/Excel data
 */
async function bulkGenerate(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const collection = db.collection('custom_templates');
    const XLSX = require('xlsx');

    const template = await collection.findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId)
    });
    if (!template) return res.status(404).json({ error: 'Шаблонот не е пронајден' });

    if (!req.file) return res.status(400).json({ error: 'Не е прикачена датотека со податоци' });

    // Parse uploaded CSV/Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) return res.status(400).json({ error: 'Датотеката е празна' });

    // Validate headers match field names
    const fieldNames = template.fields.map(f => f.name);
    const headers = Object.keys(rows[0]);
    const missingFields = fieldNames.filter(fn => !headers.includes(fn));
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Недостасуваат колони: ${missingFields.join(', ')}`,
        expectedColumns: fieldNames
      });
    }

    // Load tagged template
    const templateStorage = new TemplateStorageService(db);
    const taggedBuffer = await templateStorage.retrieveTemplate(template.fileId);

    // Generate one doc per row and collect into ZIP
    const outputZip = new PizZip();
    const GenerationHistoryService = require('../services/generationHistoryService');
    const historyService = new GenerationHistoryService(db);

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      const zip = new PizZip(taggedBuffer);

      // Sanitize braces
      const xmlFile = zip.file('word/document.xml');
      if (xmlFile && template.fields) {
        const sanitized = sanitizeBraces(xmlFile.asText(), template.fields);
        zip.file('word/document.xml', sanitized);
      }

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ''; }
      });

      doc.setData(rowData);
      doc.render();

      const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
      const docFileName = `${template.name}_${i + 1}.docx`;
      outputZip.file(docFileName, outputBuffer);

      // Record each generation (fire-and-forget)
      historyService.recordGeneration({
        userId, templateId: template._id, templateName: template.name,
        formData: rowData, buffer: outputBuffer, fileName: docFileName
      }).catch(() => {});
    }

    // Update generation count
    collection.updateOne({ _id: template._id }, { $inc: { generationCount: rows.length } }).catch(() => {});

    const zipBuffer = outputZip.generate({ type: 'nodebuffer' });
    const zipFileName = `${template.name}_масовно.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Error bulk generating:', error);
    res.status(500).json({ error: 'Грешка при масовно генерирање' });
  }
}

/**
 * AI-powered field suggestion: analyze document text and suggest dynamic fields
 */
async function suggestFields(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Текстот е премал за анализа' });
    }

    // Truncate to ~6000 chars to keep token usage low
    const truncated = text.slice(0, 6000);

    const chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const response = await chatModel.invoke([
      {
        role: 'system',
        content: `You are a document analysis assistant for a Macedonian business document automation platform.

Your task: analyze the provided document text and identify all dynamic fields — text fragments that would change between different uses of this document (e.g. names, dates, addresses, amounts, company names, ID numbers, etc.).

For each identified field, return a JSON array of objects with:
- "originalText": the EXACT text from the document that should become a dynamic field (must match verbatim)
- "label": a human-readable Macedonian label for the field (e.g. "Име на вработен")
- "name": a camelCase ASCII variable name (e.g. "imeNaVraboten")
- "type": one of "text", "number", "date", "textarea", "companyData"
- "companyField": if type is "companyData", the field key (companyName, companyAddress, companyTaxNumber, companyManager, crnNumber, companyPIN, phone, email, industry, website)
- "required": boolean, true if this field is essential to the document

Rules:
- Only return fields where the originalText appears EXACTLY in the document
- Focus on data that changes per document instance: names, dates, addresses, IDs, amounts, positions
- Do NOT mark section titles, legal boilerplate, or static instruction text
- For company-related data (company name, address, tax number), use type "companyData" with the appropriate companyField
- For personal identification numbers (ЕМБГ), use type "text"
- For monetary amounts, use type "number"
- For dates, use type "date"
- Return ONLY a valid JSON array, no markdown, no explanation`
      },
      {
        role: 'user',
        content: truncated
      }
    ]);

    // Parse the LLM response
    let suggestions = [];
    try {
      const content = response.content.trim();
      // Strip markdown code fences if present
      const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      suggestions = JSON.parse(jsonStr);

      // Validate each suggestion has required fields and originalText actually exists in the document
      suggestions = suggestions.filter(s =>
        s.originalText &&
        s.label &&
        s.name &&
        s.type &&
        truncated.includes(s.originalText)
      );
    } catch (parseErr) {
      console.error('Failed to parse AI field suggestions:', parseErr.message);
      return res.json({ suggestions: [] });
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting fields:', error);
    res.status(500).json({ error: 'Грешка при AI анализа на документот' });
  }
}

module.exports = {
  upload,
  uploadTemplate,
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  duplicateTemplate,
  getCategories,
  listVersions,
  rollbackToVersion,
  publishTemplate,
  unpublishTemplate,
  listPublicTemplates,
  clonePublicTemplate,
  bulkGenerate,
  suggestFields
};
