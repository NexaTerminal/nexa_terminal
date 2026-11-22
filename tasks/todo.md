# Profile personalization („Мој профил") — 2026-11-20 — DONE

Goal: every company gets a social profile — the identity layer of the
"business network". Image = a LINK (URL), no uploads.

## Data
- `users.publicProfile` (separate from `companyInfo`, so verification/legal data
  and document generation are untouched): { slug, displayName, headline, about,
  avatarUrl, coverUrl, industry, city, website, links{linkedin,facebook,instagram},
  offers[≤5], lookingFor[≤5], contactEmail?, visibility: members|public, updatedAt }
- Unique sparse index on `publicProfile.slug`; slug from company name (utils/slugify).
- Earned badges, computed (never self-declared): Верификувана фирма (isVerified),
  Проверен работодавач (badge exists), Основачки член (first 100 profiles), Pro.

## Server
- [x] `GET/PUT /api/profile/me` — validate lengths; image links https-only (no data:/javascript:).
- [x] `GET /api/profile/:slug` (members) + `GET /api/public/profile/:slug` (no auth; only visibility=public).
- [x] Never expose email/phone/tax no./address unless the user filled `contactEmail`.
- [x] Feed: comment authors resolved to { avatarUrl, slug } so names link to profiles.

## Client
- [x] `/terminal/moj-profil` — form + live preview card; completion meter.
- [x] Profile view (one component): `/terminal/f/:slug` + public `/f/:slug` with
      „Креирај бесплатен профил" CTA (growth loop) + meta tags.
- [x] Header dropdown: „Мој профил" (new) + „Податоци за фирма" (old /terminal/verification).
- [x] Dashboard suggestion (dismissible „Не сега", 30 days) until ≥70%.
- [x] Images: initials fallback on broken link, referrerPolicy=no-referrer.

## Not now
- Directory „Фирми" + follow — hidden until ~20–30 real profiles (empty room).

## Review (2026-11-20)
- User rule: profile is OPTIONAL — nothing gated; suggestion is dismissible; first
  visit prefilled from companyInfo (+ „Пополни празно од податоците за фирма").
- Visibility: members (default) / public (opt-in, /f/:slug) / private (only me).
- Delete profile anytime. Slug stable across renames. Founding # via atomic counter.
- E2E (throwaway mongod, real routes, stubbed auth): prefill, javascript: link
  rejected, http→https, tag dedupe, duplicate-name slug -2, Pro offers from
  practice areas, members-only 404 publicly, private 404 to others / 200 to owner,
  no phone/tax leak, feed bylines only for visible profiles, delete.
- Client build compiles. Not clicked through in a browser.
- Old unused styles/terminal/Profile.module.css left untouched (restored after an
  accidental overwrite); new styles in CompanyProfile.module.css.

# AI characters post to the feed (Option B) — 2026-11-20

Goal: frame the dashboard feed as "your advisors post here". Admin stays editor:
admin pastes source → chosen character drafts in its voice → admin edits →
publish now or schedule. Comments on character posts get an automatic short
reply from that character (capped), with "continue in chat".

## Server
- [x] `services/agentPostService.js` — `draftPost({agent, source, hint})` (JSON: title/body/category/ctaLabel/ctaHref; facts ONLY from source) + `replyToComment({agent, post, comment})` (2–4 sentences, general, no PII echo, points to private chat / Ask-a-Pro for own cases). Fails safe.
- [x] `updatesController` — `authorAgent` field (whitelist), scheduled `publishAt` (publishedAt in future = hidden until then; no cron), member list/getOne only show `published && publishedAt<=now`, `POST /updates/admin/draft`, async agent reply after a comment on a character post (cap 10/user/day via `update_ai_replies` TTL collection; kill switch `UPDATES_AI_REPLIES=off`), deleting a comment also removes the agent's reply to it.

## Client
- [x] Admin `ManageUpdates` — „Објави како" (Nexa + 5 characters), „Извор" box + „Генерирај нацрт", „Закажи за" datetime, list shows author + „Закажано".
- [x] Feed card + modal — character header (photo, Name·AI, role), „Прашај <Name>" opens dock with the post as focus context; agent replies styled as the character with „Продолжи во разговор"; modal polls for the reply ("<Name> пишува…").
- [x] Hide zero counters (♡ / 💬 show number only when > 0).

## Verify
- [x] Build client; node syntax check server; exercise draft + reply via a script against the service (mock-free if OPENAI key present).

## Review (2026-11-20)
- Built as planned; client build compiles clean.
- Live AI test: Дина draft from a UJP notice used only source facts; replies (Лекс, Дина) are on-voice and general. Replies moved to the MAIN model (public under Nexa's name). redactPii removed from replies — it erased deadlines ("[отстрането]").
- E2E on a throwaway mongod: scheduled post hidden from members (404) but visible to admin; clearing the schedule publishes now; invalid `authorAgent` stripped; comment → async agent reply linked via `replyTo`; deleting the comment removes the reply; `UPDATES_AI_REPLIES=off` disables replies.
- Committed with the profile feature (2026-11-20).

# Fix Users: Free Basic + Invite-only Pro + Weekly Lead Digest

## Decisions (locked with user, 2026-10-19)
- **Basic = free-forever.** Self-serve signup on nexa.mk. No trial, no invoice, no billing emails, no expiry. (Backend already does this via `initFreeBasic`.)
- **Pro = invite-only.** Activated ONLY by a redeem link: `leads.nexa.mk/redeem?code=...&plan=pro&days=180` → Google sign-in → auto-set Pro + 6-month (180d) pilot.
- **Pilot end:** at day 180 the account locks. No auto-charge, no auto-invoice. Operator decides manually to extend/close.
- **Remove the "are you Pro/Basic?" modal (`TierOnboardingModal`) entirely.** Plan comes from storefront (nexa.mk=Basic) + invite link (=Pro).
- **No public Pro/lawyer signup form** on leads.nexa.mk. Pro only via invite.
- **Kill ALL billing/trial/proforma/subscription-offer reminder emails** (for everyone).
- **New: weekly Monday lead-teaser digest** to active Pro lawyers. Same newest 4–5 open leads to all. Anonymized teaser (topic + city + category), no full details, "cases are waiting — log in" framing. Skip the email if ≤1 open lead that week.
- **Reset existing demo accounts:** one-time script — all `standard_user` → active free-forever Basic; clear `needsTierOnboarding` for everyone; leave Pro/admin untouched.

---

## Plan

### A. Remove the tier-selection modal
- [ ] `server/controllers/authController.js` — stop setting `needsTierOnboarding: true` at signup (register). Plan is derived from storefront/invite only.
- [ ] `server/config/passport.js` — same for Google OAuth account creation.
- [ ] `client/src/components/common/PrivateRoute.js` — remove `<TierOnboardingModal />` render + import.
- [ ] Delete `client/src/components/terminal/TierOnboardingModal.js` + its `.module.css`.
- [ ] Leave the `needsTierOnboarding` field readable (reset script clears it); remove the `/auth` endpoint that flips it if now unused (verify in `server/routes/auth.js` + `userService.js`).

### B. Pro = invite-only (remove public lawyer signup form)
- [ ] `client/src/pages/website/Login.js` — on leads storefront, hide the Pro signup form (license field / account-type picker). Code-less leads visitors see an invite-required message (reuse/adjust `RequestAccessPanel` copy: "Pro пристапот е само по покана"). Invited visitors (code stashed from `/redeem`) still get the full signup/Google flow.
- [ ] Keep nexa.mk open self-serve Basic (`OPEN_REGISTRATION=true`).
- [ ] `server/controllers/authController.js` register — if `intendedPlan==='pro'` but no valid invite context, keep `initLocked` (already does). No proLicense requirement path needed since the public Pro form is gone.

### C. Pilot duration = 180 days
- [ ] `server/services/promoCodeService.js` — default `promoDays` 90 → 180 for Pro.
- [ ] `client/src/pages/Redeem.js` — default days fallback 90 → 180.
- [ ] Verify admin can mint a Pro/180 code (POST `/api/subscription/promo-codes` via `subscriptionController.create`); confirm there's a UI in `ManageSubscriptions.js` with a days field. If missing, add a small "Покани адвокат (180 дена)" button that mints a code and shows the copyable `/redeem` link.
- [ ] Confirm `subscriptionService.redeemPromo` + `suspendExpired` lock the account at day 180 with no auto-charge (per subscription-enforcement; should already hold).

### D. Kill billing/trial reminder emails
- [ ] `server/server.js` — do not `.start()` `trialReminderScheduler` (and confirm `subscriptionScheduler` only does suspend-at-expiry, no email sends). Keep the suspend cron (needed to lock pilots at 180d).
- [ ] Leave `trialReminderService` / emails in the tree but unwired (reversible), consistent with the billing-UI-hidden approach. Add a short comment pointing to `config/billing.js` rationale.
- [ ] Sanity-check no other scheduler emails invoices/proforma to Basic.

### E. Weekly Monday lead digest (NEW)
- [ ] `server/services/leadDigestService.js` (new) — `getWeeklyDigestLeads()`: newest 4–5 OPEN inquiries from `inquiriesService` (anonymized fields only: `topic`, `city`, `category`, `createdAt`). `sendWeeklyDigest()`: if ≥2 leads, email every active Pro lawyer (`role: admin_user` / `subscription.plan: pro`, access-live), else no-op.
- [ ] `server/emails/leadDigestEmail.js` (new) — MK template: "Те чекаат предмети" hero, 4–5 teaser rows (topic + city + category), CTA button → `leads.nexa.mk/terminal` (login). No company info, no full summary.
- [ ] `server/services/leadDigestScheduler.js` (new) — cron every Monday ~09:00 MK (clone `hrReminderScheduler` pattern). Idempotent per week (guard against double-send).
- [ ] `server/server.js` — wire + `.start()` the new scheduler (behind the existing features/env guard pattern).

### F. Reset existing demo accounts (one-time)
- [ ] `server/scripts/reset-users-free-basic.js` — for all `role: standard_user`: set `subscription.plan='basic'`, `status='active'`, `endsAt=null`, `paidVia` cleared; set `needsTierOnboarding:false` for ALL users; do NOT touch `admin_user`/Pro. Dry-run flag + count output. Run against live `nexa` DB only after user confirms.

### G. Front page / copy
- [ ] Verify nexa.mk `Home.js` ("Започни бесплатно") + `Pricing.js` ("Еден пакет бесплатно, еден по покана") — already aligned; adjust only if stale trial/price wording remains.
- [ ] Grep for leftover "trial"/"8 дена"/price strings on public pages and reword to free/invite.

---

## Verification
- [ ] New nexa.mk signup → free Basic, active, no modal, full access, no billing UI.
- [ ] leads.nexa.mk without code → invite-required message, no Pro form.
- [ ] `/redeem?code=...` (Pro/180) → Google → Pro, endsAt ≈ now+180d, full Pro interface.
- [ ] No reminder/proforma emails fire (scheduler log).
- [ ] Lead digest dry-run: builds 4–5 teaser rows, skips when ≤1 lead.
- [ ] Reset script dry-run count looks right before live run.
- [ ] `cd client && npm run build` clean; server boots.

## Review (executed 2026-10-19)

**Done + verified (client build clean, server syntax OK, digest logic exercised):**
- **A — Tier modal removed.** `needsTierOnboarding:false` at signup (authController) + Google (passport); `PrivateRoute` no longer renders it; `TierOnboardingModal.js` + css deleted. The `chooseAccountType` endpoint is now inert (self-403s; its only caller was the deleted modal) — left in place, reversible.
- **B — Pro invite-only.** Login.js: chooser + licence field removed; plan is storefront-derived (`isLeadsStore?'pro':'basic'`); `canRegister = hasInvite || (OPEN_REGISTRATION && !isLeadsStore)` → leads.nexa.mk without an invite shows the "по покана" panel. Google OAuth callback now provisions `initFreeBasic` (Basic) / `initLocked` (Pro) instead of an 8-day trial.
- **C — 180-day pilot.** `promoCodeService` default 90→180; `Redeem.js` fallback 90→180. Admin mints Pro/180 codes via existing `POST /api/subscription/promo-codes`. `redeemPromo→_activate` sets role+plan+endsAt+enforces 20-cap.
- **D — Billing emails off.** `trialReminderScheduler` no longer started (`if(false)`); `subscriptionScheduler.emailsEnabled=false` (keeps the expiry→suspend safety net so pilots lock at day 180, but sends no email).
- **E — Weekly Monday lead digest (NEW).** `leadDigestService` + `leadDigestEmail` + `leadDigestScheduler` (Mon 09:00 Europe/Skopje), wired in server.js. Same newest ≤5 active Inquiry Board leads to all active Pro lawyers; anonymized teaser (topic+area+city+urgency, no client identity/summary); skips if <2 leads; idempotent per ISO week via `lead_digest_runs`.
- **G — Copy.** Public Home/Pricing already free/invite-aligned; fixed stale "8-day trial" comment + RequestAccessPanel "30 дена Pro" → invite framing.

**HELD for explicit go (live DB write):**
- **F — Reset script** `scripts/reset-users-free-basic.js` written + dry-run OK (53 users: 41 Basic→reset, 11 Pro untouched, 1 flag). NOT applied yet — awaiting user confirmation to run live.

**Not committed/pushed** (per multi-agent push coordination).

---

## Follow-up (same session): reset applied + disclaimers + anonymity

**Reset — DONE (live DB).** `reset-users-free-basic.js` applied: 41 Basic → free-forever, 48 `needsTierOnboarding` cleared, 11 Pro untouched.

**Disclaimers — DONE.**
- Always-on minimal strip `GlobalDisclaimerBar` (fixed bottom, clears the chat dock) mounted in `PrivateRoute` → on every terminal page; links to `/terminal/disclaimer`.
- Terminal `Disclaimer.js` rewritten: entity **NEXA AMD**, AI-not-legal-advice + no-liability box, "Поврзување со професионалец" (channel-only, **no commission**, not stimulating the engagement, not liable for advice/instructions/outcome), and "Анонимност на корисникот".
- AI chat dock pro-invite step shows the channel-only / no-commission / no-liability consent line.

**Anonymity + Pro reveal — DONE (server verified).**
- `proRequestsService`: `userRevealed:false` at create; `present(doc, viewerRole)` masks userName/email/company + user message author to "Анонимен корисник" on the **Pro** view until revealed; board never shows company; owner/admin unaffected. `_notifyTargets` keeps raw emails for server notifications (so masking doesn't break "new message"/"Pro joined" emails). `claim` snapshots Pro's address/website/phone. New `setRevealed` + `POST /pro-requests/:id/reveal` (owner) + `ProRequestsApiService.reveal`.
- Client: `proChat.js` returns `proProfile` + `userRevealed`; new `ProProfileModal`; both chat surfaces (AgentChatDock + AIChat) show an always-visible clickable Pro chip → profile modal + an "Анонимни сте · Откриј идентитет" toggle.
- Verified: client build clean; server `present`/masking unit-exercised (pro=masked, owner=full, board=anon, reveal=unmasked).

---

## AI chat: way out of a Pro thread + „Нов разговор" (2026-11-06)

**Problem:** after inviting a Pro, every message goes to the Pro. The dock had no „new" control and re-opening resumed that same thread, so the user could not ask the AI anything else. The full page had „Нова конверзација" only in the sidebar (hidden on phones), and a reload landed back in the locked thread. A waiting invite could never be withdrawn (`close` = active only).

- [x] „Нов разговор": + icon in dock header, link in full-page header, link above the composer in a Pro thread
- [x] A thread with a Pro invited is not auto-resumed (a new question would reach the Pro); „Отвори го разговорот со професионалец" link on the empty chat
- [x] „Откажи покана": `POST /pro-requests/:id/cancel-invite`, owner/admin, atomic on `status:'open'` so it can't close a chat a Pro just joined
- [x] Fixed: seeded message posting to the Pro from a stale closure (dock); double broadcast from the full-page „Побарај професионалец"

**Review:** service test 5/5 (incl. claim race); dock RTL flows 4/4 against the real component (temp test, removed); client build clean; headless Chrome at 390px against a mock API: no horizontal overflow on either surface. Never run against the real backend (local env = prod DB; a real invite broadcasts to Pros). Not exercised in a browser: sending a message after the full-page „+ Нов разговор". Uncommitted.

---

## Pro invite: one per conversation, no emails (2026-11-07)

**Problem:** create runs the AI summary before responding (seconds), the UI didn't react, and nothing deduped, so 3-4 clicks made 3-4 requests and 3-4 sets of emails.

- [x] Removed all invite-time emails: Pro broadcast, admin copy, requester confirmation. Bell stays.
- [x] One live invite per conversation: `reserveInvite` + `pro_invite_locks` (5 min TTL) before the slow summary; re-invite allowed after cancel/close
- [x] Instant click feedback + synchronous click guard on dock and full page („Се испраќа…")
- [x] A slow invite can't lock a chat the user opened meanwhile (full page)
- [x] Pro badge now counts open board invites (was 0 at login)

**Review:** real controller + fake DB: 4 simultaneous clicks = 1 request, 0 emails; late click returns the existing invite; other conversations unaffected; re-invite works. Headless Chrome with a 1.5s mock create: 1 POST on each surface, button changes at once. Pro badge shows 2 with 2 mock invites. Not run against the real backend or Atlas. Bell count not asserted. Document-review and LHC invites have no conversation id, so no dedupe there.

**Follow-up (2026-11-07):** Pro sidebar link „Разговори" → `/terminal/pro/conversations`, first in the primary group (`proSections` only). Bell and messaging bar unchanged. Checked in headless Chrome with mock Pro and Basic users: Pro has the link, Basic doesn't.

---

## Services pages „Услуги" — consulting & project management (PLAN, 2026-11-20)

**Goal:** a separate, manual, high-touch offer: Martin (corporate law + COO + network) runs big projects as project lead. Unrelated to Terminal and satellites. Audience: owners, investors, boards, foreign buyers. Not SMB self-serve, not lawyers-Pro.

**Positioning (hard constraint):** project management and coordination, NOT legal representation or legal opinions (founder is not a currently licensed attorney). Legal opinions, notary, tax and valuation come from partner licensed professionals that Nexa engages and coordinates. Every page says so plainly. No prices (scoping → written proposal), no invented clients, deal counts or testimonials.

**Proposed lineup (5):**
1. Due diligence на недвижност: coordinate title/cadastre, encumbrances, permits/legalisation, urban plan, contracts; red-flag report; closing checklist
2. M&A — водење проект и советување: deal PMO from LOI to closing: DD coordination, data room, timeline, SPA negotiation support with counsel, closing and 100-day integration
3. Стартап советување: structure (ДОО/ДООЕЛ), founders' agreement, cap table, investor readiness, first hires, ops setup
4. Организациски развој: structure, roles, processes, internal acts, governance, KPI; change management
5. (suggested) Влез на пазарот за странски компании: entity setup, permits/residence, bank, hiring, local partners: strongest fit with existing traffic from immigration.mk / company.nexa.mk
   - Alternatives: Interim COO (fractional operations lead); restructuring/exit

**Pages:**
- `/uslugi` hub: one-line promise, 5 service cards, "како работиме" (4 steps: разговор → обем и понуда → водење → предавање), founder block, contact form
- `/uslugi/:slug` per service: hero (outcome), за кого е, што опфаќа (phases), што добивате (deliverables), како работиме, што не правиме (partner professionals), FAQ, inquiry form
- Content in one config file `client/src/data/services.js` (MK + EN), one shared page component, so adding a service needs no new code
- SEO: SEOHelmet + schema.org `ProfessionalService`/`Service`; MK slugs (`/uslugi/due-diligence-nedviznosti`, etc.)
- Nav: „Услуги" in PublicNavbarV2 on nexa.mk only (not on leads.nexa.mk); footer link

**Lead capture:** reuse `POST /api/leads/inbound` with `practiceArea: 'services:<slug>'` + fields (company, deal size range, timeline). Admin sees it in existing inbound leads; email to info@ via current flow (verify). No new collection unless needed.

**Steps:**
- [x] Lineup confirmed (5). User: no founder presentation, "we" wording; experience stated as team experience
- [x] `client/src/data/services.js`: MK + EN content for all 5 + shared copy
- [x] `pages/website/Services.js` (/uslugi), `ServicePage.js` (/uslugi/:slug), `Services.module.css`, `components/website/ServiceInquiryForm.js`
- [x] Inquiry: NEW `POST /api/public/services/inquiry` (pre-CSRF, 5/h/IP, Joi, honeypot) → `service_inquiries` + email to ADMIN_EMAIL. Changed from leads/inbound: that webhook needs an HMAC signature the browser can't send
- [x] Routes, navbar „Услуги" (nexa.mk only), footer link, sitemap
- [ ] Browser check (desktop/mobile)

**Review:** endpoint tested with stubbed DB/email: valid 201 + saved + emailed (HTML escaped); missing consent 400; short message 400; honeypot 201, nothing saved. Client build clean. Not browser-checked. No admin UI for service_inquiries yet (email + DB only). Note: /contact form posts to /api/leads/inbound without a signature, so it likely 400s in production unless LEAD_WEBHOOK_BYPASS_HMAC=true.

**Round 2 (2026-11-20): depth + visuals + EN**
- [x] Content split into `client/src/data/services/*.js` (one file per service, MK + EN): intro, typical situation, signals, roadmap (phases, indicative durations, activities, outcome), Macedonia specifics, common mistakes, deliverables, what we need, roles, 8–11 FAQs
- [x] Rendered words per page (headless Chrome, visible text, FAQ answers collapsed): MK 1503–1755, EN 1579–1861
- [x] `ServiceIllustration` (inline SVG per topic + hub), centred symmetric layout, centred vertical roadmap, odd-count card grids centred
- [x] Fixed: public MK/EN switch reverted on navigation (PublicNavbarV2 called i18n directly; LanguageContext re-applied its own state), now goes through LanguageContext
- [x] Fixed: consent checkbox inherited global input width and overflowed 390px mobile
- Checked: 390px mobile has no horizontal overflow on hub + 4 detail pages; ?lang=en renders EN everywhere
- Open: other public pages are still MK-only (Login, Proverka, EmployerBadgeCheck, BadgeVerify, Blog/BlogPost UI, Corporate/Trademark/Employment/Residence/Topics SEO pages, Forgot/Reset password, PublicProfile, CharacterAssessment, InterviewForm)

### Round 3 (2026-11-21)
- [x] FAQ: spacing + divider between question/answer; global button styles neutralised in FaqAccordion
- [x] Inquiry form: removed company + timeline (client, data, server schema/email)
- [x] Centring bug: `.nexa-public p` margin overrode `margin:auto` (disclaimer + hub partners note)
- [x] Real photos (Unsplash licence, free commercial use, no attribution required) in public/images/services/<slug>.jpg + hub.jpg; 21:9 band under hero
- [x] Photo band → full-bleed, faded over navy + gradient, centred overlay text (service summary / hub line) + CTA; all 6 pages, MK+EN
- [x] /pricing removed → homepage #paketi (PlansSection + "services are separate" callout); /pricing redirects; nav „Цени" + cross-site link removed; footer „Пакети"
- [x] Signup redesigned (nexa.mk): pitch panel — free forever, 5 features incl. business social network; ?mode=register opens signup tab
- [x] LanguageContext kept dropping #hash on ?lang rewrite — fixed (all anchor links)

### SEO/GEO pass (2026-11-22)
- [x] Post-build prerender `client/scripts/seo-prerender.mjs` (no browser): 20 public routes get own HTML (meta, OG, hreflang, JSON-LD, full text in #seo-shell) + build/sitemap.xml (+EN alternates) + build/llms-full.txt
- [x] Static tags carry data-rh → Helmet replaces instead of duplicating (fixed site-wide double canonical)
- [x] hreflang only on bilingual pages; EN canonical = ?lang=en
- [x] robots.txt one group incl. AI bots + private token paths; llms.txt rewritten (removed false "reviewed by licensed professionals")
- [x] OrganizationSchema no longer LegalService; breadcrumbs/Service/SoftwareApplication JSON-LD; per-service OG photos 1600x900
- [x] noindex 404 catch-all; SEOHelmet on login (index) / forgot+reset (noindex); blog title/h1 fixed
- [ ] Known: leads.nexa.mk "/" non-JS bots get the nexa.mk home shell (same build); submit sitemap in Search Console/Bing
