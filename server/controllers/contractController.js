// Contract Management System v1 — HTTP layer (tasks/cms-v1-plan.md §4–5).
// Thin handlers over ContractService; ownership enforced by scoping every
// query to req.user._id inside the service.

const { ObjectId, GridFSBucket } = require('mongodb');

const svc = (req) => req.app.locals.contractService;

async function list(req, res) {
  try {
    const data = await svc(req).list(req.user._id, {
      status: req.query.status,
      q: req.query.q,
      page: req.query.page,
      limit: 20
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[contracts] list error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на договорите.' });
  }
}

async function upcoming(req, res) {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const items = await svc(req).upcoming(req.user._id, { days });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[contracts] upcoming error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на обврските.' });
  }
}

async function get(req, res) {
  try {
    const doc = await svc(req).get(req.user._id, req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Договорот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] get error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на договорот.' });
  }
}

async function create(req, res) {
  try {
    if (!req.body?.title || !String(req.body.title).trim()) {
      return res.status(400).json({ success: false, message: 'Насловот е задолжителен.' });
    }
    const doc = await svc(req).create({
      ...req.body,
      userId: req.user._id,
      createdBy: req.user._id,
      source: 'manual',
      file: null,           // manual create carries no file
      formData: null
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] create error:', err);
    res.status(500).json({ success: false, message: 'Грешка при креирање на договорот.' });
  }
}

async function update(req, res) {
  try {
    const doc = await svc(req).update(req.user._id, req.params.id, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Договорот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] update error:', err);
    res.status(500).json({ success: false, message: 'Грешка при ажурирање.' });
  }
}

async function remove(req, res) {
  try {
    const ok = await svc(req).remove(req.user._id, req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Договорот не е пронајден.' });
    res.json({ success: true });
  } catch (err) {
    console.error('[contracts] delete error:', err);
    res.status(500).json({ success: false, message: 'Грешка при бришење.' });
  }
}

async function addObligation(req, res) {
  try {
    if (!req.body?.label || !req.body?.dueAt) {
      return res.status(400).json({ success: false, message: 'Обврската бара назив и рок.' });
    }
    const doc = await svc(req).addObligation(req.user._id, req.params.id, req.body);
    if (!doc) return res.status(404).json({ success: false, message: 'Договорот не е пронајден.' });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] addObligation error:', err);
    res.status(500).json({ success: false, message: 'Грешка при додавање на обврската.' });
  }
}

async function updateObligation(req, res) {
  try {
    const doc = await svc(req).updateObligation(req.user._id, req.params.id, req.params.oid, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Обврската не е пронајдена.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] updateObligation error:', err);
    res.status(500).json({ success: false, message: 'Грешка при ажурирање на обврската.' });
  }
}

/**
 * generate → save: promote an existing shared_documents record (created by
 * baseDocumentController on every generation) into a durable contract.
 * References the SAME GridFS fileId — the 7-day TTL is on the metadata
 * record, not the file (CMS plan §5.1); isFileReferenced() guards cleanup.
 */
async function fromShare(req, res) {
  try {
    const db = req.app.locals.db;
    const shared = await db.collection('shared_documents').findOne({
      shareToken: req.params.shareToken,
      userId: new ObjectId(req.user._id)
    });
    if (!shared) {
      return res.status(404).json({ success: false, message: 'Документот не е пронајден или не е ваш.' });
    }

    // Idempotent: don't duplicate if this generation is already tracked.
    const existing = await db.collection('contracts').findOne({
      userId: new ObjectId(req.user._id),
      'file.shareToken': shared.shareToken
    });
    if (existing) return res.json({ success: true, data: existing, existed: true });

    const fd = shared.formData || {};
    const doc = await svc(req).create({
      userId: req.user._id,
      createdBy: req.user._id,
      source: 'generated',
      title: req.body?.title || shared.fileName?.replace(/\.docx$/i, '') || shared.documentType,
      documentType: shared.documentType,
      category: 'contract',
      // Best-effort prefill from the generation form (field names vary per
      // generator — pick the common ones, user can edit after).
      counterparty: {
        name: fd.employeeName || fd.otherPartyName || fd.clientName || fd.counterpartyName || '',
        type: 'legal'
      },
      dates: {
        signedAt: fd.agreementDate || fd.contractDate || null,
        expiresAt: req.body?.expiresAt || fd.endDate || fd.expiryDate || null,
        noticePeriodDays: req.body?.noticePeriodDays || null
      },
      status: 'active',
      file: {
        fileId: shared.fileId,
        fileName: shared.fileName,
        shareToken: shared.shareToken
      },
      formData: fd
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] fromShare error:', err);
    res.status(500).json({ success: false, message: 'Грешка при зачувување во Договори.' });
  }
}

/** Multipart upload (.docx/.pdf) → GridFS ('shared_documents' bucket) → contract. */
async function upload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Недостасува датотека.' });

    const db = req.app.locals.db;
    const bucket = new GridFSBucket(db, { bucketName: 'shared_documents' });
    const fileId = await new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(req.file.originalname, {
        metadata: { userId: new ObjectId(req.user._id), source: 'contract_upload', mime: req.file.mimetype }
      });
      stream.on('finish', () => resolve(stream.id));
      stream.on('error', reject);
      stream.end(req.file.buffer);
    });

    let meta = {};
    try { meta = req.body?.meta ? JSON.parse(req.body.meta) : {}; } catch (_) { /* tolerate */ }

    const doc = await svc(req).create({
      ...meta,
      userId: req.user._id,
      createdBy: req.user._id,
      source: 'uploaded',
      title: meta.title || req.file.originalname.replace(/\.(docx|pdf)$/i, ''),
      file: { fileId, fileName: req.file.originalname, mime: req.file.mimetype },
      formData: null
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[contracts] upload error:', err);
    res.status(500).json({ success: false, message: 'Грешка при прикачување.' });
  }
}

async function download(req, res) {
  try {
    const doc = await svc(req).get(req.user._id, req.params.id);
    if (!doc || !doc.file?.fileId) {
      return res.status(404).json({ success: false, message: 'Нема датотека за овој договор.' });
    }
    const db = req.app.locals.db;
    const bucket = new GridFSBucket(db, { bucketName: 'shared_documents' });
    res.setHeader('Content-Type', doc.file.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.file.fileName)}`);
    bucket.openDownloadStream(doc.file.fileId)
      .on('error', () => res.status(404).end())
      .pipe(res);
  } catch (err) {
    console.error('[contracts] download error:', err);
    res.status(500).json({ success: false, message: 'Грешка при преземање.' });
  }
}

module.exports = {
  list, upcoming, get, create, update, remove,
  addObligation, updateObligation, fromShare, upload, download
};
