# Plan: Consolidate content surfaces — kill the duplicate newsfeed, build a terminal Updates feed

## Goal
Stop showing the **same published blogs** both publicly and inside the terminal.
End state = three surfaces, each with one job:

1. **Public Blog** (`/blog`) — admin-written + user-submitted (admin-approved). The *only*
   place blogs are read. Acquisition / SEO / newsletter / "marketing moment" the user pays for.
2. **Terminal "Updates / Известувања"** — admin-authored short, dated, action-linked posts.
   Member-only value. Replaces the Dashboard "newsfeed". Visible to **all logged-in users**.
3. **Topics Q&A** (`/terminal/topics-qa`) — community contributions. Unchanged.

User-confirmed: keep the **user blog-submission → admin approves → publish** workflow.
This is a deliberate paid feature (we can feature submissions in a newsletter / share them).

---

## What's actually there now (verified)
- Public read: `GET /api/blog` + `/api/blog/:id` (routes/blog.js) → `blogs` collection, `status:'published'`.
- **Dashboard "newsfeed"** = `client/src/components/terminal/SocialFeed.js`, rendered in
  `pages/terminal/Dashboard.js`. Despite the name, it fetches `GET /blogs?limit=10` — i.e. the
  **same published blogs** as the public site. ← THE DUPLICATE.
- Submission workflow (KEEP): `pages/terminal/Blogs.js` hub (`/terminal/blogs`), `SubmitBlog.js`,
  routes `/api/blogs/submissions` + `/api/admin/blogs/submissions`. `adminPublish` writes the
  approved submission into the `blogs` collection → it goes public.
- Legacy/vestigial social system: `routes/social.js`, `controllers/socialController.js`,
  `services/socialPostService.js`, `socialPosts` collection, `/api/social/*`. SocialFeed no longer
  even uses it (reads `/blogs` instead). Open to all authenticated users to post.
- In-terminal reader `BlogDetail.js` (`/terminal/blogs/:id`) — reads `/blogs/:id`.

---

## Phase 1 — Remove the duplicate newsfeed
- [ ] Replace the Dashboard `SocialFeed` with a new `UpdatesFeed` (Phase 2). Keep the genuinely
      useful **action-shortcut grid** (templates / screening / AI) that SocialFeed currently renders —
      move it into a small `DashboardShortcuts` block so we don't lose navigation value.
- [ ] Delete `components/terminal/SocialFeed.js` + `styles/terminal/SocialFeed.module.css`
      once UpdatesFeed lands.
- [ ] Remove the in-terminal published-blog readers that duplicate the public site:
      `pages/terminal/BlogDetail.js` route `/terminal/blogs/:id`. Where the submission hub links
      "view my published article", point it to the public `/blog/:slug` instead (opens public page).

## Phase 2 — Build the terminal Updates feed (admin-authored)
Reuse the existing `socialPosts` collection + `socialPostService` (no paying users → no migration
cost) rather than adding a new collection. Repurpose it as "updates".
- [ ] **Model/shape** per update: `{ title, body (short/markdown), category, ctaLabel?, ctaHref?,
      status: 'published'|'draft', publishedAt, authorId }`.
- [ ] **Server**: lock writes to admin only.
      - `POST/PUT/DELETE /api/social/posts*` → require `isAdmin` (currently any auth user).
      - Repurpose `GET /api/social/newsfeed` → returns published updates, newest first, paginated.
        (Rename internally to `getUpdates`; default: add a clean `/api/updates` route + deprecate old.)
- [ ] **Admin authoring UI**: small page `pages/terminal/admin/ManageUpdates.js` (+ add/edit) under
      the existing admin sidebar group. Mirror the AddBlog form style but lighter (no image required).
- [ ] **Dashboard**: new `components/terminal/UpdatesFeed.js` (+ css) → fetches updates, renders
      dated cards with optional CTA ("view more" / action link). Visible to all logged-in users.

## Phase 3 — Strengthen the public blog + submission ("marketing moment")
- [ ] Verify the public `/blog` cleanly shows both admin posts and approved user submissions
      (they already land in `blogs` collection on publish — confirm author attribution renders).
- [ ] Keep submission hub `/terminal/blogs` as-is (draft → submitted → admin review → published).
- [ ] (Light) Ensure published author gets a clear "your article is live at /blog/..." state in
      `MyPublishedBlogs` / hub so it's shareable. No new newsletter system in this pass.

## Phase 4 — Cleanup
- [ ] Decommission the legacy open social-posting path: remove `routes/social.js` user-post
      endpoints we no longer use; keep only the admin updates surface. Drop any demo seeding in
      `socialPostService` startup.
- [ ] Remove dead CSRF-exempt entries in `server.js` for `/social/posts*` / `/social/newsfeed`
      that no longer apply; add exemptions for the new updates read endpoint if public-cached.
- [ ] i18n: rename `newsfeed` ("Business Newsfeed") strings to "Updates / Известувања";
      remove unused social-post keys in `en/translation.json`, `mk/translation.json`,
      `mk/translation_new.json`.
- [ ] Sidebar: add admin "Updates / Известувања" entry to the admin sidebar group.
      (No user-facing sidebar change — Updates lives on the Dashboard.)

## Phase 5 — Verify
- [ ] `cd server && npm test` (tierService etc. still green).
- [ ] Manual: Dashboard shows UpdatesFeed (not blogs); public `/blog` shows admin + approved
      user posts; submission flow still works end-to-end; no broken `/terminal/blogs/:id` links;
      grep for residual `SocialFeed` / `newsfeed` references = none.
- [ ] Build client (`cd client && npm run build`) to catch removed-import breakage.

---

## Decisions
- Updates feed audience: **all logged-in users** (confirmed) — no tier gate this pass.
- Keep user blog submissions (confirmed) — the paid "write & we feature it" feature.
- Reuse `socialPosts` collection for Updates (no migration; no paying users).
- In-terminal blog *reader* (`BlogDetail`) is removed; public `/blog/:slug` is the single reader.

## Out of scope (note for later)
- Actual newsletter sending pipeline.
- Pro-gating Updates (can layer a tier check later if it becomes an upsell).

## Review (implemented)

**Server**
- New clean `updates` collection surface instead of repurposing the messy `socialPosts`
  (deviation from plan — no real data to migrate, far more elegant):
  - `controllers/updatesController.js` (list / adminList / create / update / remove).
  - `routes/updates.js` — `GET /` (any logged-in user), `GET /admin` + `POST/PUT/DELETE` (admin only).
  - Mounted unconditionally in `server.js`; CSRF exemptions swapped `/social/*` → `/updates*`.
- Decommissioned the dead social system: removed `SocialPostService` startup and deleted
  `routes/social.js`, `controllers/socialController.js`, `services/socialPostService.js`.
- Left harmless residual `socialPosts` refs in analytics / userDeletion / investment cross-post
  and the `social` feature flag — out of scope, no behavior impact.

**Client**
- `components/terminal/SocialFeed.js` (read the public blog) → new `UpdatesFeed.js` reading
  `/api/updates`; kept the useful action-shortcut grid + tier B/C summary tiles.
- Renamed `SocialFeed.module.css` → `UpdatesFeed.module.css`, added update-card + CTA styles.
- `Dashboard.js` now renders `<UpdatesFeed/>`.
- Removed the in-terminal blog reader `BlogDetail.js` + route `/terminal/blogs/:id`
  (only the deleted SocialFeed linked to it; public `/blog/:slug` is the single reader).
- Admin authoring: `pages/terminal/admin/ManageUpdates.js` (+ css), route
  `/terminal/admin/updates`, sidebar group "Известувања".

**Verification**
- `node -c` on all changed server files — OK.
- `react-scripts build` — Compiled successfully (bundle −2 KB).
- Grep sweep — no dangling imports to deleted files.
- Server jest not installed in this env (tierService test untouched by this work).

**Left as-is (noted)**
- Dead i18n `newsfeed` keys in en/mk translations (unreferenced; not worth JSON-edit risk).
- The user blog-submission → admin-approve → publish flow is untouched (kept by design).

---

## Follow-up: engagement (likes + comments) + read-more modal

**Server** (`updatesController.js` + `routes/updates.js`)
- Update docs now carry `likes: [ObjectId]` and `comments: [{ _id, userId, authorName, content, createdAt }]`.
- `GET /api/updates` returns `likesCount`, `commentsCount`, `likedByMe` per card (no heavy arrays).
- `GET /api/updates/:id` → full body + sorted comments (each flagged `mine`) for the modal.
- `POST /api/updates/:id/like` — any logged-in user toggles their like.
- `POST /api/updates/:id/comments` — add comment (denormalized `authorName` from companyInfo/userName).
- `DELETE /api/updates/:id/comments/:commentId` — comment author or admin only.
- Admin list moved to `GET /api/updates/admin/all` so it can't be shadowed by `/:id`.
- All covered by the existing `/^\/updates\/.*$/` CSRF exemption.

**Client**
- `UpdateCard`: body truncated to 50 words; "Прочитај повеќе" appears only when longer; inline
  like button (optimistic via `patchItem`) + comment count button — both open the modal.
- New `UpdateModal.js`: full text, CTA, like toggle, comment list + add form, delete-own-comment,
  Escape/overlay close. Counts sync back to the card through `onPatch`.
- Added engagement + modal styles to `UpdatesFeed.module.css`.

**Verify**: `node -c` server OK; `react-scripts build` Compiled successfully.
