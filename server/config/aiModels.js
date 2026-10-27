'use strict';

/**
 * Central AI model configuration — the ONE place that owns which OpenAI model
 * each feature uses and how reasoning-model params are shaped.
 *
 * Everything defaults to `gpt-5-mini`. gpt-5-mini is a REASONING model, which
 * behaves differently from gpt-4o and needs param rewriting at every call site:
 *   1. It REJECTS `temperature` (only the default is allowed) → must be dropped.
 *   2. It uses `max_completion_tokens`, not `max_tokens`, AND reasoning tokens
 *      count against that cap — so tiny caps (200–320) get eaten by reasoning
 *      and the visible answer comes back EMPTY. We enforce a floor.
 *   3. It supports `reasoning_effort`: minimal | low | medium | high. Default
 *      (medium) is slow + costly; we use `low` for user answers and `minimal`
 *      for utility/JSON tasks.
 *   4. `minimal` effort is NOT allowed with the Responses `web_search` tool.
 *
 * `langchainOptions()` / `completionParams()` apply rules 1–3 automatically and
 * ONLY when the target model is a reasoning model — so setting OPENAI_MODEL=gpt-4o
 * (or any non-reasoning model) transparently re-enables temperature + max_tokens,
 * giving a pure-env rollback with no code changes.
 *
 * Embeddings are intentionally NOT handled here (text-embedding-3-small stays;
 * changing it means re-indexing Qdrant — a separate task).
 */

const DEFAULT_MODEL = 'gpt-5-mini';

// --- Role models (all default to gpt-5-mini) ---
const OPENAI_MODEL = process.env.OPENAI_MODEL || DEFAULT_MODEL;             // main answers (Лекс/Вера/Стојан, LHC narrative)
const OPENAI_MARKETING_MODEL = process.env.OPENAI_MARKETING_MODEL || DEFAULT_MODEL; // Миа
const OPENAI_UTILITY_MODEL = process.env.OPENAI_UTILITY_MODEL || DEFAULT_MODEL;     // condensation, decomposition, rerank, JSON extraction, summaries

// --- Feature models: default to the ROLE they belong to ---
const CONTRACT_ANALYSIS_MODEL = process.env.CONTRACT_ANALYSIS_MODEL || OPENAI_MODEL;      // main (deep analysis)
const CONTRACT_PRESCAN_MODEL = process.env.CONTRACT_PRESCAN_MODEL || OPENAI_UTILITY_MODEL; // utility (fast classify)
const CASE_BRIEF_MODEL = process.env.CASE_BRIEF_MODEL || OPENAI_UTILITY_MODEL;
const INTERVIEW_SUMMARY_MODEL = process.env.INTERVIEW_SUMMARY_MODEL || OPENAI_UTILITY_MODEL;
const BLOG_GUIDELINE_MODEL = process.env.BLOG_GUIDELINE_MODEL || OPENAI_UTILITY_MODEL;
const CHATBOT_WEB_MODEL = process.env.CHATBOT_WEB_MODEL || OPENAI_MODEL;                   // web_search fallback

// --- Effort per role (env-overridable) ---
const EFFORT_MAIN = process.env.AI_EFFORT_MAIN || 'low';
const EFFORT_UTILITY = process.env.AI_EFFORT_UTILITY || 'minimal';
const EFFORT_MARKETING = process.env.AI_EFFORT_MARKETING || 'low';

// --- Token floors so reasoning tokens can't starve the visible output ---
const FLOOR_UTILITY = 2000; // minimal-effort / JSON / short utility calls
const FLOOR_MAIN = 8000;    // user-facing answers (low+ effort)

/** Reasoning models: gpt-5* and the o-series (o1/o3/o4...). */
function isReasoningModel(name) {
  return /^(gpt-5|o\d)/i.test(name || '');
}

/** The max_completion_tokens floor for a given effort. */
function floorForEffort(effort) {
  return effort === 'minimal' ? FLOOR_UTILITY : FLOOR_MAIN;
}

/**
 * Options for `new ChatOpenAI(...)`.
 * Reasoning model → drop temperature, set reasoningEffort, and
 * maxCompletionTokens = max(maxTokens, floor). Non-reasoning model → classic
 * temperature + maxTokens (keeps a gpt-4o rollback working by env alone).
 */
function langchainOptions({ model, temperature, maxTokens, effort } = {}) {
  const m = model || OPENAI_MODEL;
  const base = { modelName: m, openAIApiKey: process.env.OPENAI_API_KEY };
  if (isReasoningModel(m)) {
    const eff = effort || EFFORT_MAIN;
    return {
      ...base,
      maxCompletionTokens: Math.max(maxTokens || 0, floorForEffort(eff)),
      reasoningEffort: eff,
      // temperature intentionally omitted (reasoning models reject non-default)
    };
  }
  return {
    ...base,
    ...(temperature != null ? { temperature } : {}),
    ...(maxTokens != null ? { maxTokens } : {}),
  };
}

/**
 * Rewrite a raw `openai.chat.completions.create(...)` params object for the
 * target model. Reasoning model → drop temperature, convert max_tokens →
 * max_completion_tokens (floored), add reasoning_effort. Non-reasoning → leave
 * temperature/max_tokens untouched. `messages`, `response_format`, `tools`, etc.
 * are passed through unchanged.
 */
function completionParams(params = {}, { effort } = {}) {
  const out = { ...params };
  const m = out.model || OPENAI_MODEL;
  out.model = m;
  if (isReasoningModel(m)) {
    const eff = effort || EFFORT_UTILITY;
    const requested = out.max_completion_tokens || out.max_tokens || 0;
    out.max_completion_tokens = Math.max(requested, floorForEffort(eff));
    delete out.max_tokens;
    delete out.temperature;
    out.reasoning_effort = eff;
  }
  return out;
}

module.exports = {
  DEFAULT_MODEL,
  OPENAI_MODEL,
  OPENAI_MARKETING_MODEL,
  OPENAI_UTILITY_MODEL,
  CONTRACT_ANALYSIS_MODEL,
  CONTRACT_PRESCAN_MODEL,
  CASE_BRIEF_MODEL,
  INTERVIEW_SUMMARY_MODEL,
  BLOG_GUIDELINE_MODEL,
  CHATBOT_WEB_MODEL,
  EFFORT_MAIN,
  EFFORT_UTILITY,
  EFFORT_MARKETING,
  isReasoningModel,
  langchainOptions,
  completionParams,
};
