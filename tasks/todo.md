# Contact Lists + Daily Drip Sender

Mailchimp-style audiences (editable, unlimited) that feed a daily drip sender:
40 Basic + 40 Pro = 80/day at 08:30 Europe/Skopje. Reuses promo codes, saved
cold-email copy, and the invited-prospects ledger. Stops when empty, resumes on
add. Ships DISABLED by default.

## Data model (namespaced `outreach_*`; `contacts` is taken by the contact form)
- `outreach_lists`    { name, type:'basic'|'pro', createdBy, contactCount, ts }
- `outreach_contacts` { listId, email(lc), name?, company?, status, sentAt?, ts }
- `outreach_drip_settings` (singleton) { basic:{code,templateId,language,perDay},
                                          pro:{...}, enabled }

## Backend
- [ ] config/dripConfig.js — defaults (40/type, 08:30, TZ Skopje, interval, ENABLED env)
- [ ] services/contactListService.js — list+contact CRUD, bulk paste import
- [ ] services/dripSettingsService.js — get/set singleton
- [ ] services/dripSendService.js — runOnce(now): count-today → top-up → send → mark+ledger
- [ ] services/dripScheduler.js — node-cron 30 8 * * * (Skopje) + runNow()
- [ ] controllers/outreachController.js — admin endpoints
- [ ] routes/outreach.js — /api/admin/outreach (authenticateJWT + isAdmin)
- [ ] server.js — wire services + scheduler, reuse existing service instances

## Frontend
- [ ] pages/terminal/admin/ContactLists.js (+ .module.css)
- [ ] App.js route /terminal/admin/contact-lists
- [ ] Sidebar.js — link "Контакт листи" under Корисници (users-admin)

## Verify
- [ ] node -c syntax on new server files
- [ ] client build compiles

## Review
DONE — all backend files node -c pass + require-load OK; client build compiles.
- Pause/resume: `enabled` flag in outreach_drip_settings, checked every runOnce;
  UI Паузирај/Активирај button toggles it, effective on the next run.
- Restart-safe: runOnce counts today's sent per bucket and only tops up to perDay.
- Dedup: contacts already in invited_prospects are skipped (parked 'unsubscribed').
- Ships PAUSED (enabled defaults false); scheduler fires 08:30 Skopje but no-ops.
- Fixed: /codes + /invite-templates return `items` (not codes/templates).

## Not built (v1 scope notes)
- Resend bounce/unsubscribe webhook — statuses are manual flips for now.
- No commit/push yet (per multi-agent coordination; awaiting user go-ahead).
