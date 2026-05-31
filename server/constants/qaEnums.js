/**
 * Enums for the Topics Q&A authoring workflow (Nexa 3.0 §8).
 */

const WORKLIST_STATUS = Object.freeze({
  OPEN:        'open',
  REQUESTED:   'requested',     // a member has requested, awaiting admin approval
  IN_PROGRESS: 'in_progress',   // approved, member is writing
  SUBMITTED:   'submitted',     // member submitted for review
  PUBLISHED:   'published',
  ARCHIVED:    'archived'
});

const SUBMISSION_STATUS = Object.freeze({
  REQUESTED:   'requested',
  DECLINED:    'declined',
  IN_PROGRESS: 'in_progress',
  SUBMITTED:   'submitted',
  RETURNED:    'returned',
  ACCEPTED:    'accepted',
  PUBLISHED:   'published',
  REJECTED:    'rejected',
  RELEASED:    'released'
});

const ACTIVE_LOCK_STATUSES = Object.freeze([
  'requested', 'in_progress', 'submitted', 'returned', 'accepted'
]);

const DEFAULT_SOFT_DEADLINE_DAYS = 28;
const DEFAULT_TARGET_LENGTH_WORDS = 1500;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 20;
const MIN_WORDS_PER_ANSWER = 50;
const TARGET_MIN_WORDS_PER_ANSWER = 100;
const TARGET_MAX_WORDS_PER_ANSWER = 400;
const REQUEST_REASON_MAX = 400;

// Suggested starter questions admins can use. The admin form lets them
// override / extend up to MAX_QUESTIONS.
const STARTER_QUESTIONS_MK = Object.freeze([
  'Која е темата во 1–2 реченици?',
  'Кого се однесува ова и зошто е важно?',
  'Кои се клучните македонски правни/регулаторни одредби?',
  'Кои се вообичаените примери и сценарија?',
  'Кои се најчестите грешки и како да се избегнат?',
  'Кои се типичните трошоци или временски рамки?',
  'Кога треба да се ангажира професионалец?',
  'Кои се алтернативите?',
  'Кои се ризиците ако ова се игнорира?',
  'Кои се добрите практики и што препорачувам?'
]);

module.exports = {
  WORKLIST_STATUS,
  SUBMISSION_STATUS,
  ACTIVE_LOCK_STATUSES,
  DEFAULT_SOFT_DEADLINE_DAYS,
  DEFAULT_TARGET_LENGTH_WORDS,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  MIN_WORDS_PER_ANSWER,
  TARGET_MIN_WORDS_PER_ANSWER,
  TARGET_MAX_WORDS_PER_ANSWER,
  REQUEST_REASON_MAX,
  STARTER_QUESTIONS_MK
};
