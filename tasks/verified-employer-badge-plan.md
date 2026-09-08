# „Проверен работодавач" — public verified-employer badge funnel

Turn Legal Health Check into a two-sided growth engine: a shareable **maturity
badge** aimed at **jobseekers** (employer branding) that doubles as a **non-user
acquisition funnel** for Nexa. Every badge in the wild is a backlink + referral
loop pointing at a public Nexa page.

## Locked decisions
- **Flagship audience/badge:** „Проверен работодавач" (from Employment LHC), aimed
  at employees/candidates. (Customer/GDPR + partner/general badges are later
  variants on the same engine.)
- **Build order:** public acquisition funnel FIRST (not the member badge).
- **Framing:** maturity level + **самопроценка** (self-assessment), never
  "certified compliant". Coursera-style "completed", defensible. Keeps the Phase-0
  honesty discipline.
- **Eligibility:** badge issues only for score ≥ 65 (band ≥ Задоволителна).
- **Identity (anti-spoofing) — two-tier:** issue on signup with self-assessment
  caveat; a confirmed **business email** (existing verification) upgrades it to a
  "verified company" state and drops the caveat. Low friction to start, real trust
  for those who verify.
- **Rating scale (letter tiers on top of the existing band):**
  - 65–79 → **A** (verified, solid)
  - 80–92 → **A+** (strong)
  - 93–100 → **A++** (exemplary)
  - < 65 → no badge → report + "improve" path (doc-links / trial) instead.
- **Visual:** circular seal (trust-mark) as the hero embed; a derived certificate
  for LinkedIn/download. Dynamic **SVG**, generated server-side (no headless
  browser). On-brand; use Nexa logo if provided, else text wordmark.

## The loop
Jobseeker sees seal on a job ad → clicks → verify page → "Get your own free badge"
→ public employer check (~20 Q) → **rating shown immediately** (hook) → **sign up
to claim** the shareable badge + full report (lead capture) → embeds seal → loop.
Report upsells via the doc-deep-links already shipped; 1-year expiry = re-engage +
convert.

## Reuse (≈60% already exists)
- `/proverka` public funnel — Google-first entry, per-source tracking, public
  question flow. `/proverka-rabotodavac` is a sibling.
- `lhcScoring.js` — score the curated employment subset → band → letter tier.
- Employment LHC questions (employmentPart1–4) — curate ~20 employee-facing ones.
- Public-token page pattern (cases `/predmet/:token`) → verify page.
- Google OAuth signup (redeem/onboarding) → the claim gate.
- `lhcDocumentMap` + AI narrative (just shipped) → the report + upsell.

## Data model
- `badges` collection: `{ token (unguessable), userId, assessmentId, module:'employment',
  companyName, score, band, ratingTier (A|A+|A++), issuedAt, expiresAt (+1y),
  verified (bool, from business-email), revoked, source:'proverka-badge' }`.
- The public assessment persists to `lhcAssessments` tagged `source:'proverka-badge'`;
  badge snapshots score/tier so retakes never change an issued badge.

## Phases
1. **Public employer check** `/proverka-rabotodavac` — ~20 curated Q, no login to
   start, progress bar, scored by lhcScoring. End screen shows the **rating** (teaser)
   + "claim your badge" CTA. Reuses /proverka entry + per-source tracking.
2. **Claim gate + issuance** — Google/email signup unlocks the shareable badge +
   full report; persist assessment + create `badges` record (if score ≥ 65).
   Below 65 → report + improve path, still captured as a lead.
3. **Verify page + badge assets** — public `/badge/:token` certificate page
   (company · Проверен работодавач · рејтинг · issued · valid-until · disclaimer ·
   "check your own" CTA; revoked/expired honest states). Dynamic **circular-seal
   SVG** at `/badge/:token/image.svg` + derived certificate. Share panel: embed
   snippet, LinkedIn share, download, copy link.
4. **Instrumentation** — per-source funnel + badge view/click tracking + admin view;
   business-email verified → upgrade badge state.
5. **Amplifiers (later)** — public „Проверени работодавачи" directory; expiry-renewal
   reminders (re-engagement + conversion); customer/GDPR + partner/general variants.

## Open items to settle before/while building
- **Nexa logo asset** (SVG/high-res PNG) for the seal — optional; text wordmark otherwise.
- **Curate the ~20 employee-facing questions** from the employment modules (written
  contract, on-time pay, paid leave, safe workplace, no discrimination, paid overtime…).
- **Exact wording** on seal + verify page (defensible self-assessment language).
- **Rating cutoffs** confirmation (65/80/93 above).
- Whether the badge counts against any free-check limit / abuse rate-limiting.

## Guardrails
- Never "certified/guaranteed compliant" — always "спроведе Nexa правна проверка ·
  самопроценка". Verify page carries the LHC disclaimer.
- 1-year expiry + revocable; badge is a snapshot; verify page always shows issue date.
