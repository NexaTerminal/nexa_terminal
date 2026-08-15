# Plan/Spec — Admin editing of Topics Q&A questions (topics.nexa.mk)

Scope confirmed with user: the **Topics Q&A** worklist (lawyer-facing, topics.nexa.mk),
NOT the LHC compliance questionnaires. Admin (martinboshkoski) must be able to
**edit** an existing topic and its guiding questions, not only create new ones.
Deliverable for now: **plan/spec only** (no code).

## Current state (verified)

- **Create UI exists**: `client/src/pages/terminal/admin/AdminTopicsWorklistNew.js`
  (title, practiceArea, category, targetKeyword, targetLengthWords,
  softDeadlineDays, scope, questions[5–20] with prompt+notes).
- **List UI**: `AdminTopicsWorklist.js` — shows cards with question count; only
  action is Archive. **No Edit link.**
- **Routes (frontend)**: only `/terminal/admin/topics/worklist` and `…/new`.
  No `…/:id/edit`.
- **Backend already supports edit**:
  - `GET /api/admin/topics/worklist/:id` (`adminWorklistGet`)
  - `PUT /api/admin/topics/worklist/:id` (`adminWorklistUpdate` →
    `topicsService.updateWorklistItem`) — whitelists title/practiceArea/category/
    targetKeyword/targetLengthWords/softDeadlineDays/scope/**questions**.
- **Latent bug**: `updateWorklistItem` comment says it blocks edits while a
  submission is in flight, but it does not. Overwriting `questions` on a locked
  topic desyncs the submission `answers` array (built from questions at
  `requestToOpen`). Must guard.

## Gap = frontend edit page + list affordance + one backend guard

### Phase 1 — Editable topics (core ask)
1. **Refactor the New form into a shared `TopicWorklistForm` component.**
   - Extract the form body from `AdminTopicsWorklistNew.js` into
     `components/terminal/admin/TopicWorklistForm.js`.
   - Props: `initialValues`, `mode` ('create'|'edit'), `lockedQuestions` (bool),
     `onSubmit`.
   - `New` page passes `STARTER_QUESTIONS` defaults + POST handler.
2. **Add `AdminTopicsWorklistEdit.js`.**
   - Route: `/terminal/admin/topics/worklist/:id/edit` (PrivateRoute, admin).
   - On mount `GET …/worklist/:id`, prefill the shared form.
   - Submit `PUT …/worklist/:id`; on success → back to list.
   - If topic is locked (`activeSubmissionId` set OR status ≠ open), render
     questions read-only with a banner: "Темата има активно поднесување —
     прашањата не може да се менуваат. Уреди наслов/опсег/клучен збор."
3. **Add "Уреди" link on each worklist card** (`AdminTopicsWorklist.js`), next to
   Архивирај, linking to `…/:id/edit`.
4. **Backend guard** (`topicsService.updateWorklistItem`): if
   `doc.activeSubmissionId || doc.status !== OPEN`, ignore/reject `input.questions`
   (and structural fields), allow only title/scope/targetKeyword. Return a clear
   `code: 'LOCKED'` if the client tries to change questions. This makes the code
   match its own comment and prevents answer desync.

### Phase 2 — Editor UX quality (recommended)
- **Reorder questions** (up/down buttons or drag) — order currently only implied
  by array index; expose it explicitly.
- **Duplicate a topic** ("Копирај") to seed a new one from an existing template —
  fastest way to fill the empty categories.
- **Unsaved-changes guard** on the edit form (navigation prompt).
- **Inline validation**: min 5 / max 20 questions, scope ≥ 40 chars (already
  enforced server-side — mirror it in the UI before submit).
- **Category as first-class**: `practiceArea` is free text today; make it a
  select (or datalist) aligned with `TOPIC_CATEGORIES` / marketplace practice
  areas so the "Labour Law (5) / Tax Law (0)…" counts stay consistent.

### Phase 3 — Category management & coverage (fills the empty (0) areas)
- **Admin category overview**: a small panel listing each category with its topic
  count + quick "add topic in this category" — directly targets the reported
  "Tax Law (0), Real Estate (0)…" gaps.
- Optional: move `TOPIC_CATEGORIES` to a DB collection so categories themselves
  are editable without deploy (only if you want categories dynamic; questions are
  already per-topic in DB).

## Improvements — for USERS (lawyers on topics.nexa.mk)
- Consistent categories + counts so members can find open topics in their area.
- Filling empty categories (Phase 3) removes dead ends where a lawyer's practice
  area shows nothing to answer.
- Clearer guiding questions (reorder + notes) → better answers → better published
  pages → more inbound.

## Improvements — for SUPER-ADMIN (martinboshkoski)
- Edit any topic + its questions from the UI (Phase 1) — no redeploy to fix a
  typo or reshape a questionnaire.
- Duplicate/seed topics to scale coverage fast (Phase 2).
- Lock-safe editing (guard) prevents corrupting in-flight lawyer submissions.
- Category overview to see and close coverage gaps at a glance (Phase 3).
- Role note: there is a single admin tier (`role==='admin' || isAdmin`). No new
  "super-admin" role is required; the edit UI sits behind the existing
  `requireAdmin`. Add a distinct `superAdmin` flag ONLY if you later want to
  restrict question-editing to a subset of admins.

## Files touched (Phase 1)
- NEW `client/src/components/terminal/admin/TopicWorklistForm.js`
- NEW `client/src/pages/terminal/admin/AdminTopicsWorklistEdit.js`
- EDIT `client/src/pages/terminal/admin/AdminTopicsWorklistNew.js` (use shared form)
- EDIT `client/src/pages/terminal/admin/AdminTopicsWorklist.js` (add Edit link)
- EDIT `client/src/App.js` (add `…/:id/edit` route)
- EDIT `server/services/topicsService.js` (`updateWorklistItem` lock guard)

## Out of scope
- LHC compliance questionnaires (separate, hardcoded engine).
- Changing the submission/review workflow.
