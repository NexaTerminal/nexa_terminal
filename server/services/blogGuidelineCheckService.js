/**
 * Blog submission AI guideline check.
 *
 * Given a draft, asks an OpenAI model to evaluate against the six rules
 * defined in Nexa 3.0 §6 and return a structured JSON verdict.
 *
 * Fails-soft: any error in the AI call produces a degraded "pass with note"
 * result so the workflow never blocks indefinitely on infrastructure.
 */

const OpenAI = require('openai');

const MODEL = process.env.BLOG_GUIDELINE_MODEL || 'gpt-4o-mini';

// Strip HTML tags and collapse whitespace for word-count + content sniffing.
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const wordCount = (s) => stripHtml(s).split(/\s+/).filter(Boolean).length;

const SYSTEM = `You are an editorial reviewer for a Macedonian SaaS platform called Nexa. You are evaluating an expert blog submission written by a verified professional (lawyer, accountant, or consultant) for publication on the public Nexa blog.

Evaluate the submission against these six rules and return a single JSON object with the exact shape below.

Rules:
1. Length: a recommended range is 600–2,500 words. Do NOT fail the check on length alone; only note length as a soft suggestion in suggestedMetaDescription / suggestedSocialBlurb if it materially affects readability.
2. Structure: at least one H2-level heading; not a single block of text.
3. Tone: declarative and informational. NO first-person sales language (no "contact us today", "we are the best", "hire me", "call now", explicit CTAs urging engagement).
4. Compliance: no claims of guaranteed legal outcomes; no profession-specific solicitation; no defamatory or unverifiable statements about identifiable parties.
5. Citations: at least one factual claim references a law, regulation, official institution, or other named source. Be GENEROUS here — name-checking a Macedonian law or institution counts.
6. Originality: flag content that reads as templated, AI-padded, or generic filler (long strings of platitudes with no specific claims).

Return JSON ONLY with this shape (no markdown, no commentary):
{
  "pass": boolean,
  "issues": [{ "rule": "length"|"structure"|"tone"|"compliance"|"citations"|"originality", "message": "concrete Macedonian sentence explaining what is wrong and what to change" }],
  "suggestedMetaDescription": "≤155 char MK meta description summarising the post",
  "suggestedSocialBlurb": "≤220 char MK promotional sentence for social",
  "suggestedCategory": "one MK category label, e.g. 'Корпоративно право', 'Трудово право', 'Даноци', 'Маркетинг', 'Бизнис'",
  "suggestedKeywords": ["mk keyword 1", "mk keyword 2", "...up to 5"]
}

If pass:true, issues MUST be an empty array. If any rule fails, pass MUST be false and issues MUST contain at least one entry with the rule key. Always populate the suggested* fields so the member can use them when revising or accepting.`;

class BlogGuidelineCheckService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * @param {object} submission
   * @param {string} submission.title
   * @param {string} submission.bodyHtml — ReactQuill HTML (not Markdown).
   * @param {string} [submission.suggestedCategory]
   * @param {string[]} [submission.suggestedKeywords]
   * @returns {Promise<{ pass, issues, suggestedMetaDescription, suggestedSocialBlurb, suggestedCategory, suggestedKeywords }>}
   */
  async check(submission) {
    const title = String(submission?.title || '').trim();
    const body  = String(submission?.bodyHtml || '');
    const wc    = wordCount(body);

    // Word-count gating removed per product decision. The AI guideline check
    // below may still surface length as a soft recommendation but no hard
    // pre-block runs here — every non-empty submission goes to the model.

    const userBlock = [
      `НАСЛОВ: ${title}`,
      `БРОЈ НА ЗБОРОВИ: ${wc}`,
      submission.suggestedCategory ? `ПРЕДЛОЖЕНА КАТЕГОРИЈА: ${submission.suggestedCategory}` : '',
      Array.isArray(submission.suggestedKeywords) && submission.suggestedKeywords.length
        ? `ПРЕДЛОЖЕНИ КЛУЧНИ ЗБОРОВИ: ${submission.suggestedKeywords.join(', ')}`
        : '',
      '',
      'СОДРЖИНА (HTML):',
      body
    ].filter(Boolean).join('\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user',   content: userBlock }
        ]
      });

      const raw = response?.choices?.[0]?.message?.content || '{}';
      const verdict = JSON.parse(raw);
      return BlogGuidelineCheckService.normalize(verdict);
    } catch (err) {
      console.error('[blog-guideline] AI check failed:', err.message);
      // Fail-soft: return a "pass with note" verdict and let the admin decide.
      return {
        pass: true,
        issues: [],
        suggestedMetaDescription: '',
        suggestedSocialBlurb: '',
        suggestedCategory: submission.suggestedCategory || '',
        suggestedKeywords: Array.isArray(submission.suggestedKeywords) ? submission.suggestedKeywords.slice(0, 5) : [],
        _fallback: true
      };
    }
  }

  /** Defensive normalization so a wonky AI response can't crash the caller. */
  static normalize(v) {
    const validRules = ['length','structure','tone','compliance','citations','originality'];
    const issues = Array.isArray(v?.issues) ? v.issues : [];
    const cleanIssues = issues
      .filter(i => i && typeof i === 'object')
      .map(i => ({
        rule: validRules.includes(i.rule) ? i.rule : 'originality',
        message: String(i.message || '').slice(0, 500)
      }));
    const pass = !!v?.pass && cleanIssues.length === 0;
    return {
      pass,
      issues: cleanIssues,
      suggestedMetaDescription: String(v?.suggestedMetaDescription || '').slice(0, 200),
      suggestedSocialBlurb:     String(v?.suggestedSocialBlurb     || '').slice(0, 280),
      suggestedCategory:        String(v?.suggestedCategory        || '').slice(0, 80),
      suggestedKeywords: Array.isArray(v?.suggestedKeywords)
        ? v.suggestedKeywords.map(k => String(k || '').trim()).filter(Boolean).slice(0, 5)
        : []
    };
  }
}

BlogGuidelineCheckService.wordCount = wordCount;
BlogGuidelineCheckService.stripHtml = stripHtml;

module.exports = BlogGuidelineCheckService;
