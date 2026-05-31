const crypto = require('crypto');
const OpenAI = require('openai');
const { buildPreScanMessages } = require('./prompts/preScanPrompt');
const { buildAnalysisMessages } = require('./prompts/analysisPrompt');
const StancePreferencesService = require('../services/stancePreferencesService');

const PRE_SCAN_MODEL = process.env.CONTRACT_PRESCAN_MODEL || 'gpt-4o-mini';
const ANALYSIS_MODEL = process.env.CONTRACT_ANALYSIS_MODEL || 'gpt-4o';
const MONTHLY_LIMIT = parseInt(process.env.CONTRACT_ANALYSIS_MONTHLY_LIMIT) || 3;
const PRE_SCAN_EXCERPT_CHARS = 12000; // ~3K tokens

class ContractAnalysisService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.db = null;
    // In-memory session store: sessionId -> { userId, contractText, preScan, createdAt }
    this.sessions = new Map();
    // Sweep stale sessions every 10 min (TTL 30 min)
    this._startSessionSweeper();
  }

  setDatabase(database) {
    this.db = database;
    console.log('✓ Database reference set for ContractAnalysisService');
  }

  /** Build the Stance Preferences prefix for this user. Returns '' on any miss. */
  async _getStancePrefix(userId) {
    try {
      if (!this.db || !userId) return '';
      const svc = new StancePreferencesService(this.db);
      return await svc.getPrefix(userId);
    } catch (e) {
      console.warn('[contract-analysis] stance prefix lookup failed:', e.message);
      return '';
    }
  }

  /* ------------------------------ Quota ------------------------------ */

  _monthKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async getUsage(userId) {
    if (!this.db) return { used: 0, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT };
    const month = this._monthKey();
    const doc = await this.db.collection('contract_analysis_usage').findOne({ userId, month });
    const used = doc ? doc.count : 0;
    return { used, limit: MONTHLY_LIMIT, remaining: Math.max(0, MONTHLY_LIMIT - used), month };
  }

  async _incrementUsage(userId) {
    if (!this.db) return;
    const month = this._monthKey();
    await this.db.collection('contract_analysis_usage').updateOne(
      { userId, month },
      { $inc: { count: 1 }, $set: { lastUsedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }

  /* --------------------------- Pre-scan step --------------------------- */

  async preScan({ userId, contractText, filename, kind, wordCount }) {
    const usage = await this.getUsage(userId);
    if (usage.remaining <= 0) {
      const err = new Error(`Ја достигнавте месечната граница од ${MONTHLY_LIMIT} анализи на договори. Лимитот се ресетира на 1-ви во наредниот месец.`);
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }

    const excerpt = contractText.slice(0, PRE_SCAN_EXCERPT_CHARS);
    const stancePrefix = await this._getStancePrefix(userId);
    const messages = buildPreScanMessages(excerpt, stancePrefix);

    const response = await this.openai.chat.completions.create({
      model: PRE_SCAN_MODEL,
      messages,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const preScan = this._safeParseJson(raw, {
      contractType: 'непознато',
      language: 'mk',
      parties: [],
      suggestedQuestions: [],
    });

    // Always inject the "which party are you" question if pre-scan omitted it
    // and we have parties detected.
    if (
      preScan.parties?.length >= 2 &&
      !preScan.suggestedQuestions?.some(q => q.id === 'user-role')
    ) {
      preScan.suggestedQuestions = [
        {
          id: 'user-role',
          question: 'Која страна сте Вие во овој договор?',
          type: 'single-choice',
          options: preScan.parties.map(p => `${p.role} (${p.label})`),
        },
        ...(preScan.suggestedQuestions || []),
      ].slice(0, 3);
    }

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      contractText,
      filename,
      kind,
      wordCount,
      preScan,
      createdAt: Date.now(),
    });

    return {
      sessionId,
      contractType: preScan.contractType,
      language: preScan.language,
      parties: preScan.parties,
      questions: preScan.suggestedQuestions || [],
      wordCount,
    };
  }

  /* ----------------------------- Analysis ----------------------------- */

  async analyze({ userId, sessionId, userRole, userAnswers }) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      const err = new Error('Сесијата истече или не постои. Прикачете го договорот повторно.');
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }
    if (session.userId !== userId) {
      const err = new Error('Немате пристап до оваа сесија.');
      err.code = 'FORBIDDEN';
      throw err;
    }

    const usage = await this.getUsage(userId);
    if (usage.remaining <= 0) {
      const err = new Error(`Ја достигнавте месечната граница од ${MONTHLY_LIMIT} анализи.`);
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }

    const stancePrefix = await this._getStancePrefix(userId);
    const messages = buildAnalysisMessages({
      contractText: session.contractText,
      userRole,
      userAnswers,
      contractType: session.preScan?.contractType,
      parties: session.preScan?.parties,
      stancePrefix,
    });

    let report;
    let attempts = 0;
    let lastErr;
    while (attempts < 2) {
      attempts++;
      try {
        const response = await this.openai.chat.completions.create({
          model: ANALYSIS_MODEL,
          messages,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        });
        const raw = response.choices[0]?.message?.content || '{}';
        report = JSON.parse(raw);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!report) {
      throw new Error(`Анализата не успеа. ${lastErr?.message || ''}`.trim());
    }

    // Persist (no contract text stored)
    const record = {
      userId,
      createdAt: new Date(),
      filename: session.filename,
      fileType: session.kind,
      wordCount: session.wordCount,
      detectedType: session.preScan?.contractType,
      detectedParties: session.preScan?.parties || [],
      userRole,
      userAnswers: userAnswers || {},
      report,
      modelUsed: ANALYSIS_MODEL,
    };
    if (this.db) {
      const result = await this.db.collection('contract_analyses').insertOne(record);
      record._id = result.insertedId;
    }

    await this._incrementUsage(userId);
    this.sessions.delete(sessionId);

    const newUsage = await this.getUsage(userId);
    return { analysisId: record._id, report, usage: newUsage };
  }

  /* ----------------------------- Helpers ----------------------------- */

  _safeParseJson(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  _startSessionSweeper() {
    if (this._sweeperStarted) return;
    this._sweeperStarted = true;
    const TTL_MS = 30 * 60 * 1000;
    setInterval(() => {
      const now = Date.now();
      for (const [id, s] of this.sessions.entries()) {
        if (now - s.createdAt > TTL_MS) this.sessions.delete(id);
      }
    }, 10 * 60 * 1000).unref?.();
  }
}

module.exports = new ContractAnalysisService();
