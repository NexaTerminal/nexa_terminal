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
