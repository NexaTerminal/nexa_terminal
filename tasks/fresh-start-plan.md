# Fresh start — erase all non-admin users and their data

Decided with user 2026-10-25:
- **Delete every non-admin account + everything they created** (Basic AND Pro). They can sign up again (Google one-click); Pros get re-invited via the founder link.
- **Admin accounts: zero changes** (account, settings, admin-authored content).
- Nothing destructive runs until the dry-run counts are reviewed and approved.

## Must keep regardless
- **Invoices** (`invoices`, `proInvoices`, `counters` = invoice numbering) — legal record-keeping; kept even for deleted users.
- **Admin/system content**: `blogs` by admin, `updates` (announcements), `courses`, legal corpus (`chatbot_documents`, Qdrant), `nexa_marketing_docs`, `custom_templates`/`template_versions` if admin-owned, `promo_codes`, `fair_settings`, `cold_email_templates`, `outreach_*` / `invited_prospects` (prospects, not users), `qa_worklist`, `audit_logs`.
- **Newsletter subscribers** (Mailjet) — separate from app users, untouched.

## Steps
### 0. Safety net
- [ ] Full backup: `npm run backup` (→ Google Drive) **and** a local `mongodump`; record file names.
- [ ] Prove the backup restores: restore into a separate `nexa_staging` database.
- [ ] Export non-admin users to CSV (email, name, company, role, plan, createdAt) — the re-invite list. Stored outside git.

### 1. Script `server/scripts/fresh-start.js` (dry-run by default)
- [ ] Prints DB host + name; **writes only with `--confirm=<dbName>`** typed exactly; otherwise dry-run.
- [ ] Admin set = `role: 'admin'` users ∪ explicit allowlist (`terminalnexa@gmail.com`); aborts if empty or unexpectedly large.
- [ ] Reads the REAL collection list (`listCollections`) and reports any collection not classified below (nothing is touched blindly).
- [ ] Per collection, per action, prints the count it would delete; with `--confirm` deletes and re-counts.

### 2. Collection classes
| Class | Action | Collections |
|---|---|---|
| User-owned | delete docs whose owner ∉ admins | chatbot_conversations, user_ai_memory, user_agent_memory, user_stance_preferences, lhcAssessments, mhc/hhc/chcAssessments, documents, shared_documents, template_generations, contracts, contract_analyses, cases, clients, employees, hr_interviews, character_assessments, courseProgress, credit_transactions, chatbot_usage, marketing_chatbot_usage, contract_analysis_usage, user_notifications, user_analytics, company_verifications, companyverifications, companies, emailVerifications, badges, teaser_screenings, sales_deals, sourcing_requests, provider_interests, blog_submissions, socialposts, fair_booths, newsletter_ad_bookings, subscription_history |
| Conversations / boards | delete all not created by admin | pro_requests, inquiries, offer_requests, topics submissions, leads (verify: CRM vs user data) |
| Embedded user refs in kept docs | strip non-admin entries | `updates` likes/comments, `blogs` likes/dislikes + user-authored posts, `promo_codes` redemptions |
| Logs / telemetry | wipe | security_events, security_logs, security_alerts, login_attempts, account_locks, blocked_ips, activity_logs, analytics, response_analytics, admin_notifications |
| Legacy leftovers | drop (after backup) | users_consolidated, users_new, users_backup, socialPosts_new/_consolidated, marketingPosts*, blogs_new/_consolidated, analytics_new/_consolidated |
| Users | delete non-admin | users |
| Keep | untouched | see "Must keep" |

Owner field per collection (userId / user / authorId / author.id / createdBy / requesterId / assignedProId …) is confirmed in the dry-run report, not assumed.

### 3. Rehearsal on staging
- [ ] Run dry-run → review counts **with the user**.
- [ ] Run `--confirm=nexa_staging`; point a local server at staging; smoke-test: admin login, admin panels, blog, announcements, new Google signup → fresh free Basic, AI chat, Разговори empty.

### 4. Production run
- [ ] Short maintenance window (night); fresh backup right before.
- [ ] `--confirm=<prod db>`; post-checks: users == admins, unclassified list empty, app smoke test as above.
- [ ] Uploaded files of deleted users (if any on server disk / Drive) — list and remove.

### 5. After
- [ ] Re-invite list ready (CSV) for the relaunch email; founder link to Pros you want back.
- [ ] Old backups on Drive = archive of the old data (keep or delete per your retention choice).

## Review
Done 2026-10-25 on live "nexa".
- Backup: server/backups/nexa-backup-2026-10-25_0931.zip (74 collections, 7,978 docs) — restore proven into nexa_restore_test (0 mismatches), then rehearsed the deletion there.
- Live run (`npm run fresh-start -- --confirm=nexa`): 52 users + 1,897 docs deleted; re-run finds 0. Kept: admin „martin" (Google, martinboshkoskilaw@gmail.com) + its own data, blogs 36, updates 14, chatbot_documents 87, inquiries 68, outreach/prospects, settings. Invoices were already empty.
- Undo: `npm run restore -- --file backups/nexa-backup-2026-10-25_0931.zip --db nexa --confirm=nexa`.
- Test DB nexa_restore_test dropped.
