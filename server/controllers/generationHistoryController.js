const GenerationHistoryService = require('../services/generationHistoryService');

async function listHistory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const service = new GenerationHistoryService(db);
    const { page = 1, limit = 20 } = req.query;

    const result = await service.listHistory(userId, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (error) {
    console.error('Error listing history:', error);
    res.status(500).json({ error: 'Грешка при вчитување на историјата' });
  }
}

async function getTemplateHistory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const service = new GenerationHistoryService(db);
    const { page = 1, limit = 20 } = req.query;

    const result = await service.listHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      templateId: req.params.id
    });
    res.json(result);
  } catch (error) {
    console.error('Error listing template history:', error);
    res.status(500).json({ error: 'Грешка при вчитување на историјата' });
  }
}

async function downloadGenerated(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const service = new GenerationHistoryService(db);

    const result = await service.getGeneratedDocument(req.params.recordId, userId);
    if (!result) return res.status(404).json({ error: 'Документот не е пронајден' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Error downloading generated doc:', error);
    res.status(500).json({ error: 'Грешка при преземање' });
  }
}

async function deleteRecord(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const db = req.app.locals.db;
    const service = new GenerationHistoryService(db);

    const deleted = await service.deleteRecord(req.params.recordId, userId);
    if (!deleted) return res.status(404).json({ error: 'Записот не е пронајден' });

    res.json({ message: 'Записот е избришан' });
  } catch (error) {
    console.error('Error deleting history record:', error);
    res.status(500).json({ error: 'Грешка при бришење' });
  }
}

module.exports = { listHistory, getTemplateHistory, downloadGenerated, deleteRecord };
