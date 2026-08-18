# Plan — Blog author section (submit → admin → public)

Author block for user-submitted blogs. Required: full name + image. Optional:
LinkedIn, website, email, short bio. Remembered per user (prefill next time).
Admin sees it; on publish it renders on nexa.mk/blog.

## Current state (verified)
- SubmitBlog.js already has: displayName, contactEmail, linkedinUrl, bio, photo
  upload. MISSING: website. Not required. Prefills only when editing an existing
  submission (+ email from account) — not remembered across NEW posts.
- Service `_normalizeAuthorBio`: displayName/contactEmail/linkedinUrl/photoUrl/bio.
  MISSING website.
- Publish `_publishToBlog` copies author → public blog.author (name/bio/photoUrl/
  linkedinUrl/contactEmail). MISSING website.
- Public BlogPost.js uses only `post.author.name` (SEO) — NO visible author card.

## Changes
### Backend — server/services/blogSubmissionsService.js
1. `_normalizeAuthorBio`: add `website` (URL, optional, ≤240).
2. `createDraft` + `updateDraft`: after building authorBio, upsert it onto the
   user as `users.blogAuthorProfile` (remember for next time).
3. `_publishToBlog`: add `website` to `blog.author`.
4. New `getAuthorProfile(user)` → returns `user.blogAuthorProfile || {}`.

### Backend — controller/routes
5. `GET /api/blogs/submissions/author-profile` → saved profile for prefill.

### Frontend — SubmitBlog.js
6. Add `website` input to the author section.
7. Require **name + image** at submit (block + toast; reflect in canSubmit).
   LinkedIn/website/email/bio stay optional.
8. On a NEW draft (no editId), fetch the saved profile and prefill all fields so
   the author only edits/changes.

### Frontend — admin PendingBlogSubmissions.js
9. Show `website` link in the author card (already shows name/email/linkedin/bio).

### Frontend — public BlogPost.js
10. Render an author card (photo, name, bio, LinkedIn/website/email links) from
    `post.author`, shown after the article.

## Notes
- Image upload already exists (`/api/blogs/submissions/upload-image`).
- Basic users can also blog (1/mo) — this applies to whoever submits.
