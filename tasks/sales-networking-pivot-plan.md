# Sales & networking pivot — plan (Nov 26, 2026)

Goal: Nexa should feel like a tool that **brings money** (clients, deals, accepted quotes), not only one
that saves time on administration. Administration stays; selling moves to the front.

## Starting point (honest)

- Almost no users → anything that needs other Nexa members on the other side (marketplace, feed
  replies, directory) is an empty room today.
- So the first features must work with the company's **own clients outside Nexa**: the one-pager
  they share, the quote link they send. Every link they send also advertises Nexa.
- Network features (posts) must look fine with 0–5 companies: their value comes first from the
  company's own page and sharing, the Nexa feed is a bonus.

## Already done

- [x] **Продажна инка („Клиенти") visible to every company** — `lib/tier.js` `showsSalesFunnel`
  (API was already open to Basic; only the menu was hidden).

## Phase 1 — „Понуда" (quote that sells) — works with zero Nexa users — ✅ BUILT Nov 26 (uncommitted)

What the owner does: Клиенти → a deal → „Направи понуда" (or Понуди → Нова понуда).

1. **Builder** (one screen)
   - Client: picked from the deal / Клиенти, or typed (company or person, email).
   - Items: name, quantity, unit, unit price, ДДВ 18 / 10 / 5 / 0 % (select). Optional
     **private cost per item** — never shown to the client; gives the owner margin per line and total.
   - Discount % (whole quote), currency ден / €, valid until (default +15 days),
     payment and delivery terms (choose from a short list + note), short intro text.
   - Number per company: ПОН-2026-001. Footer line: „Понудата не е фактура."
   - Company data, logo and colours come from Мој профил / Податоци за фирма.
2. **Public quote page** `nexa.mk/ponuda/:token` (noindex)
   - Clean branded page: logo, items, totals with ДДВ, validity, terms.
   - Buttons: **„Прифаќам"** (name + optional note), **„Имам прашање"** (message), **„Одбивам"**
     (optional reason). Not an e-signature — a recorded acceptance with name and time.
   - Print styles → „Зачувај како PDF" from the browser (no new PDF engine).
   - Footer: „Понуда направена со Nexa · Направете бесплатна понуда" → signup.
3. **Tracking — the sales part**
   - Status: нацрт → испратена → **отворена** (first open time, number of views) → прифатена /
     одбиена / истечена.
   - Accepted → deal moves to „Добиени" with the quote value. Declined → „Изгубени" with the reason.
   - Owner gets an email on accept / decline / question (SMB email, allowed), plus the bell.
   - In Клиенти: „Отворена пред 3 дена, без одговор" badge with a ready follow-up text (in-app only,
     no automatic reminder emails yet).
4. **AI connection**
   - **Борис — „Проверете ја понудата"**: opens his chat with items, costs, discount pre-filled →
     margin, what the discount costs, whether the price holds. Uses the existing chat (counts toward
     the weekly limit like any question).
   - **Миа — „Напиши вовед" / „Напиши follow-up"**: one short intro paragraph for the quote and one
     follow-up message to copy into email/Viber. Cheap utility model.
5. Data: new `sales_quotes` collection (owner, dealId, token, items, totals, status, events[]).
   Reuses: sales_deals, profile branding, public-token pattern (like /predmet/:token), rate limits.

## Phase 2 — Navigation and dashboard point at money — ✅ BUILT Nov 27 (uncommitted)

- New first sidebar group **„Продажба"**: Мој профил (страница) · Клиенти · Понуди · Објави.
  Маркетинг и раст next; Администрација, Човечки ресурси, Набавки below.
- Dashboard strip **„Продажба овој месец"**: value in the pipeline, quotes sent / opened / accepted,
  page views, messages. Zero values hidden (empty account doesn't look dead).
- **„Барање за понуди" hidden from the menu** (URL keeps working, admin keeps it). Recommended over
  a „demo" label: a demo of an empty marketplace still reads as empty. „Бараме" posts replace it.
  Регистар на набавки stays.
- One-pager: each „Што нудиме" card gets **„Побарај понуда"** → the contact form with that service
  pre-selected. Every message (from the page or a post) gets **„Додај во Клиенти"** (one click → new
  potential deal). Messages come from visitors of the company's page (Google, shared link, QR) —
  not from Nexa users.

## Phase 3 — Structured company posts („Објави") — ✅ BUILT Nov 27 (uncommitted)

Very limited on purpose: the company picks a type, fills a fixed form, the card design is generated.
No free-form posts, no links in text.

| Type | Fields (all short, mostly selects) |
|---|---|
| **Понуда / акција** | product or service (from „Што нудиме" or new, 60 chars) · benefit type (попуст % / бесплатна испорака / пакет / пробен период) · value · for whom (сите / фирми / граѓани) · city · valid until (max 60 days) |
| **Бараме** | category (fixed list: сметководство, превоз, печатење, ИТ, маркетинг, правни услуги, суровини, простор, …) · what (80 chars) · quantity / frequency (optional) · city · deadline (max 30 days) |
| **Ново кај нас** | kind (нов производ/услуга · нова локација · нова соработка · вработуваме) · text (200 chars) · one image (optional) |

Rules:
- Max **1 active post per type** and **2 new posts a week**; posts expire on their date.
- Requires a minimal profile (name, logo, headline) → pushes profile completion. Feature terms gate
  on first post (existing `useTermsGate`). Admin can remove; members can report.
- Appears in: the Terminal feed (tagged with the company), the company's one-pager („Актуелно",
  with Offer markup for search), and has its own share link with a preview (LinkedIn/WhatsApp/Viber).
- Actions: „Контакт" (message to the company, lands in its messages → „Додај во Клиенти").
  On a **„Бараме"** post, a member gets **„Испратете понуда"** → opens the Phase 1 builder with that
  company as the client. This is the networking → sales loop.
- No fake posts: the first real posts are Nexa's own company; AI characters do not post as companies.

## Not now (by decision)

- Automatic reminder emails for next steps (no users yet).
- Client recommendations on the one-pager (later, once pages exist).
- Company directory and follow (needs ~20–30 real profiles).
- Invoices, e-signature on quotes, .docx quote (page + PDF print first).

## Order and size

1. Phase 1 Понуда — largest (≈ 2–3 days with tests), most value, works today.
2. Phase 2 menu + dashboard + hide RFQ + „Побарај понуда" — small (≈ 1 day).
3. Phase 3 posts — medium (≈ 2 days).

Each phase: build → isolated E2E test (throwaway DB, never prod) → report → push only on "push".

## Phase 1 — result (Nov 26, 2026)

- Built as planned. Units use invoice abbreviations (ком., ч., дн., мес., усл., пак.) so „30 ком." reads
  correctly. Миа runs on the utility model at effort low; formal capitals (Ве/Вас/Ви/Ваш…) and
  „Ви благодариме" are enforced in code because the model slipped on them.
- Public page also gets `X-Robots-Tag: noindex` from Vercel (`client/vercel.json` headers) — the static
  index.html robots tag says index, Helmet adds noindex; the header makes it unambiguous.
- E2E on a throwaway DB (scratchpad `quote_e2e.js`): 41/41 — funnel button → editor → live totals
  (ДДВ 5 % + 18 %, 5 % discount) → private margin → Миа intro → send (deal → Испратена понуда) →
  public page (no cost/margin leaks, noindex, logo) → open tracking once per session, preview not
  counted → question → accept (deal → Добиени, value in €) → bell events → second answer 409 → owner
  view locked → list + deal badge → draft not public, numbering, expired refused, foreign company 404,
  empty quote can't be sent. Mobile: items collapse to two-line rows, no horizontal scroll.
- Not covered by the E2E: real e-mail delivery (test ran with e-mail off) and the Борис chat answer
  itself (the button opens his chat with the question pre-filled via the existing `?agent=&q=` handoff).

## Phase 2 — result (Nov 27, 2026)

- Sidebar (SMB): new first group **Продажба** (open by default via `defaultOpen`): Моја страница
  (/terminal/moj-profil, new `globe` icon) · Клиенти · Понуди; then Маркетинг и раст, Администрација,
  Човечки ресурси, Набавки (only Регистар на набавки), Едукација. Mobile drawer (Header.js) mirrors it.
- „Барање за понуди" hidden: `showsSourcing` → admin only (URL still works); Регистар на набавки now uses
  `showsProcurementRegister`; its „Побарај понуди преку Nexa" link shows to admin only.
- Feature tour rewritten (5 steps, formal Вие): Продажба → Маркетинг и раст → Администрација →
  Набавки → Едукација; removed the old promises (blog for Basic, „1000+ претплатници", marketplace).
- Dashboard **SalesStrip** (`GET /api/sales/overview`): accepted quotes this month (ден.), awaiting
  answer (+ unopened), pipeline, page views; nudges for new one-pager messages not yet in Клиенти and
  overdue next steps. Zero tiles hidden; an empty account sees three first steps (Моја страница →
  Клиенти → Понуда).
- One-pager: „Побарајте понуда" on a service card pre-selects that service in the contact form
  (chip, button „Побарај понуда", hint placeholder); server keeps the service only if it is one of the
  company's offers; e-mail subject „Барање понуда: X". Messages in Моја страница show the service and
  **+ Додај во Клиенти** → `POST /api/profile/me/messages/:id/to-deal` (potential deal with the message
  as note, next step today „Испрати понуда за X"; idempotent; owner-scoped).
- E2E (scratchpad `phase2_e2e.js`, throwaway DB): 22/22. Phase 1 test rerun on a fresh DB: 40/41
  (only the logo check, because the re-seeded test company has no uploaded logo).
- Note: the old scratch DB was corrupted by macOS temp cleanup; re-seed script is in the session log.

## Phase 3 — result (Nov 27, 2026)

- `company_posts` + `services/companyPostsService.js` + `routes/companyPosts.js` (`/api/company-posts`,
  before CSRF like /api/sales). Types/fields exactly as planned; title generated from fields
  („−20% на Торти по нарачка", „Бесплатна испорака: …", „Пакет: … — 3 + 1 гратис").
- Rules (server-enforced): page with name + headline + logo required; terms `companyPost` accepted
  (FeatureTermsModal, scroll + tick); 1 active per type; 2 new per 7 days (ended posts still count);
  links / e-mails / phone numbers rejected; offer ≤ 60 days, seeking and news ≤ 30 days; 3 reports hide
  a post and notify admins; admin remove (`DELETE /admin/:id`, „Отстрани" on feed cards).
- Feed: posts mixed into the dashboard stream (FeedPost): „Заинтересирани сме" / „Јавете се" (optional
  note → profile_messages with postTitle + sender page, bell + e-mail, once per company); on „Бараме"
  **„Испратете понуда"** → deal (Контактирани) + quote draft prefilled with the poster; when that quote
  is sent the poster gets a bell + e-mail with the link. Share (copy link to /f/slug#objava-id), report.
- One-pager: „Актуелно — Понуди и новости" section with the live posts; „Искористете ја понудата /
  Испратете понуда / Контактирајте" pre-fills the contact form („Во врска со: …", postId validated).
- `/terminal/objavi`: type picker (with reasons when blocked), fixed forms, live preview, my posts with
  state + interest count + „Заврши". Menu: Продажба → Моја страница · Објави · Клиенти · Понуди.
- E2E (throwaway DB): Phase 3 31/31; regression Phase 2 22/22, Phase 1 41/41.
- Not done (by choice, small): image on „Ново кај нас", Offer JSON-LD / crawler preview of posts.
