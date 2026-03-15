const { GridFSBucket, ObjectId } = require('mongodb');

class GenerationHistoryService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('template_generations');
    this.bucket = new GridFSBucket(db, { bucketName: 'generated_documents' });
  }

  async recordGeneration({ userId, templateId, templateName, formData, buffer, fileName }) {
    // Store generated file in GridFS
    const uploadStream = this.bucket.openUploadStream(fileName, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      metadata: { userId: new ObjectId(userId), templateId: new ObjectId(templateId) }
    });

    await new Promise((resolve, reject) => {
      uploadStream.end(buffer);
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    const record = {
      userId: new ObjectId(userId),
      templateId: new ObjectId(templateId),
      templateName,
      formData,
      fileId: uploadStream.id,
      fileName,
      fileSize: buffer.length,
      generatedAt: new Date()
    };

    await this.collection.insertOne(record);
    return record;
  }

  async listHistory(userId, { page = 1, limit = 20, templateId } = {}) {
    const query = { userId: new ObjectId(userId) };
    if (templateId) query.templateId = new ObjectId(templateId);

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.collection.find(query).sort({ generatedAt: -1 }).skip(skip).limit(limit).toArray(),
      this.collection.countDocuments(query)
    ]);

    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getGeneratedDocument(recordId, userId) {
    const record = await this.collection.findOne({
      _id: new ObjectId(recordId),
      userId: new ObjectId(userId)
    });
    if (!record) return null;

    const chunks = [];
    const downloadStream = this.bucket.openDownloadStream(record.fileId);
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }

    return { buffer: Buffer.concat(chunks), fileName: record.fileName };
  }

  async deleteRecord(recordId, userId) {
    const record = await this.collection.findOne({
      _id: new ObjectId(recordId),
      userId: new ObjectId(userId)
    });
    if (!record) return false;

    // Delete GridFS file
    try {
      await this.bucket.delete(record.fileId);
    } catch (e) { /* file may already be deleted */ }

    await this.collection.deleteOne({ _id: record._id });
    return true;
  }
}

module.exports = GenerationHistoryService;
