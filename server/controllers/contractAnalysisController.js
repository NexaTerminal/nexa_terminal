const multer = require('multer');
const service = require('../contractAnalysis/ContractAnalysisService');
const { ContractTextExtractor, ExtractionError, MAX_BYTES } = require('../contractAnalysis/ContractTextExtractor');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const lower = (file.originalname || '').toLowerCase();
    if (allowed.includes(file.mimetype) || lower.endsWith('.pdf') || lower.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Поддржани се само .pdf и .docx датотеки.'));
    }
  },
});

exports.uploadMiddleware = upload.single('contract');

exports.uploadAndPreScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Не е прикачена датотека.' });
    }
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Не сте автентицирани.' });
    }

    const extracted = await ContractTextExtractor.extract(req.file.buffer, req.file.mimetype, req.file.originalname);

    const result = await service.preScan({
      userId,
      contractText: extracted.text,
      filename: req.file.originalname,
      kind: extracted.kind,
      wordCount: extracted.wordCount,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('❌ [contract-analysis] upload error:', err.message);
    if (err instanceof ExtractionError) {
      return res.status(400).json({ success: false, code: err.code, error: err.userMessage });
    }
    if (err.code === 'QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, code: err.code, error: err.message });
    }
    return res.status(500).json({ success: false, error: err.message || 'Грешка при прикачување.' });
  }
};

exports.analyze = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Не сте автентицирани.' });
    }
    const { sessionId, userRole, userAnswers } = req.body || {};
    if (!sessionId || !userRole) {
      return res.status(400).json({ success: false, error: 'sessionId и userRole се задолжителни.' });
    }

    const result = await service.analyze({
      userId,
      sessionId,
      userRole,
      userAnswers: userAnswers || {},
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('❌ [contract-analysis] analyze error:', err.message);
    const status = err.code === 'SESSION_NOT_FOUND' ? 404
      : err.code === 'FORBIDDEN' ? 403
      : err.code === 'QUOTA_EXCEEDED' ? 429
      : 500;
    return res.status(status).json({ success: false, code: err.code, error: err.message });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Не сте автентицирани.' });
    }
    const usage = await service.getUsage(userId);
    return res.json({ success: true, ...usage });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
