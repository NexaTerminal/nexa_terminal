/**
 * LegalDataHunterService - Wrapper around the Legal Data Hunter API
 * https://legaldatahunter.com
 *
 * Provides supplementary legal data to the RAG chatbot:
 *  - Macedonian (MK) Constitutional Court + Supreme Court case law
 *  - EU legislation (EUR-Lex) and CJEU case law for international questions
 *
 * Failure-safe: any error or timeout returns an empty array so the chatbot
 * gracefully falls back to local Qdrant results only.
 */

const DEFAULT_BASE_URL = 'https://legaldatahunter.com';
const REQUEST_TIMEOUT_MS = 8000;

// NARROW list: only triggers when foreign LAW actually applies to the question,
// NOT merely when a foreign party/person is involved. A foreigner buying land
// in Skopje is still pure MKD law — do not trigger EU search for that.
const INTL_LAW_KEYWORDS = [
  // EU regulations that directly apply or are explicitly named
  'gdpr', 'гдпр', 'eu regulation', 'eu directive', 'еу регулатива', 'еу директива',
  'eu-регулатива', 'регулатива на еу', 'директива на еу',
  'eur-lex', 'eurlex', 'еур-лекс',
  // EU courts / institutions when explicitly cited
  'cjeu', 'court of justice of the eu', 'суд на правдата на еу', 'суд на еу',
  'european court', 'европски суд',
  // explicit international/foreign-law mechanisms
  'international arbitration', 'меѓународна арбитража',
  'choice of law', 'избор на право', 'применливо право',
  'foreign law applies', 'странско право се применува',
  'icc arbitration', 'uncitral', 'unidroit',
  // explicit cross-border transactions where foreign law typically governs
  'cisg', 'виенска конвенција',
];

class LegalDataHunterService {
  constructor() {
    this.apiKey = process.env.LDH_API_KEY || null;
    this.baseUrl = process.env.LDH_BASE_URL || DEFAULT_BASE_URL;
    this.enabled = (process.env.LDH_ENABLED || 'true').toLowerCase() !== 'false' && !!this.apiKey;

    if (!this.apiKey) {
      console.warn('⚠️  LegalDataHunter disabled: LDH_API_KEY not set');
    } else {
      console.log(`✅ LegalDataHunter enabled (${this.baseUrl})`);
    }
  }

  /**
   * Heuristic: does the question have an international/EU dimension?
   * @param {string} text - question + recent conversation context
   * @returns {boolean}
   */
  hasInternationalScope(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return INTL_LAW_KEYWORDS.some(kw => lower.includes(kw));
  }

  /**
   * Search Macedonian case law (Constitutional Court + Supreme Court).
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array>} normalized doc chunks
   */
  async searchMK(query, limit = 3) {
    return this._search(query, { country: ['MK'], namespace: 'case_law', limit });
  }

  /**
   * Search EU legislation and CJEU case law.
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array>} normalized doc chunks
   */
  async searchEU(query, limit = 3) {
    return this._search(query, { country: ['EU', 'INTL'], limit });
  }

  async _search(query, body) {
    if (!this.enabled) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/v1/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, ...body }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`⚠️  [LDH] Search failed (${response.status}) for "${query.substring(0, 50)}"`);
        return [];
      }

      const data = await response.json();
      const allHits = Array.isArray(data.hits) ? data.hits : [];
      // LDH ignores small server-side limits — enforce client-side
      const hits = allHits.slice(0, body.limit || 3);
      const elapsed = Date.now() - startTime;
      console.log(`✓ [LDH] ${body.country.join('/')} search: ${hits.length}/${allHits.length} hits in ${elapsed}ms`);

      return hits.map(hit => this._normalize(hit));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⚠️  [LDH] Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      } else {
        console.warn(`⚠️  [LDH] Request error: ${error.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Normalize an LDH hit into the same {pageContent, metadata} shape used
   * by Qdrant results so the rest of the RAG pipeline is agnostic.
   */
  _normalize(hit) {
    const country = hit.country || 'XX';
    const docName = hit.title
      ? `${country} — ${hit.title}`
      : `${country} — ${hit.source || 'Legal Document'}`;

    return {
      pageContent: hit.snippet || hit.title || '',
      metadata: {
        documentName: docName,
        score: typeof hit.score === 'number' ? hit.score : 0,
        article: null,
        chunkType: 'external',
        external: true,
        url: hit.url || null,
        country,
        court: hit.court || null,
        date: hit.date || null,
        source: hit.source || null,
        language: hit.language || null,
        ldhId: hit.id || null,
      },
    };
  }
}

module.exports = new LegalDataHunterService();
