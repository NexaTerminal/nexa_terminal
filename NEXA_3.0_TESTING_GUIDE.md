# Nexa 3.0 — Manual Testing Guide

> A step-by-step test plan for the Nexa 3.0 feature set. Written for a tester who has **never used the app before**. Follow sections in order on first pass — each section assumes accounts and state from the previous one.
>
> **Estimated total time:** 2–3 hours for a full pass.
> **Database needed:** an empty or test MongoDB instance. Do not run this against production.

---

## 0. Setup & vocabulary

### 0.1 What Nexa is (in one paragraph)

Nexa is a Macedonian SaaS for SMBs and professional service firms (lawyers, accountants, consultants). There's the **Terminal** — the in-app tool where members generate documents, run compliance checks, chat with AI assistants, and (for paying B/C tiers) submit blog posts, claim inbound leads, and author Q&A pages. Outside the Terminal there's a public marketing site at `nexa.mk` and a network of satellite content sites (immigration.mk, samodaprasham.mk, etc.) that feed inquiries into the Terminal.

### 0.2 The three tiers (Nexa 3.0)

| Internal key | Public label | Price (EUR) | Who | What's special |
|---|---|---:|---|---|
| `standard` | **Nexa Платформа** | €19 / month | Individual users | Terminal tools only |
| `admin_5` | **Nexa Мрежа · Кантора** | €39 / month | Small firms | Terminal + Blogs + Leads + 5 sub-seat invitations |
| `admin_10` | **Nexa Мрежа · Студио** | €59 / month | Studios / multi-author firms | Everything in Кантора + Topics Q&A authoring + 10 sub-seats |

Sub-seats invited by an Admin user see the **Платформа** surface only (no Blogs / Leads / Topics Q&A).

Tier-letter shorthand used throughout the codebase:
- **A** = Платформа (standard)
- **B** = Мрежа · Кантора (admin_5)
- **C** = Мрежа · Студио (admin_10)
- **ADMIN** = platform admin (you, Martin) — bypasses all gating

### 0.3 Server start

```bash
# Terminal 1 (backend)
cd /Users/martinboshkoski/Nexa/nexa.v1
npm run dev          # starts the Express server (port 5002, proxied at /api)

# Terminal 2 (frontend)
cd client
npm start            # starts CRA dev server on http://localhost:3000
```

Open `http://localhost:3000` in your browser. You'll see the public homepage.

### 0.4 Test account names you'll create

Use these so screenshots and notes stay consistent:

| Test purpose | Username | Password | Plan |
|---|---|---|---|
| Type A trial → Платформа | `test_platform_a` | `Test1234!` | standard |
| Type B (Кантора) admin | `test_kantora_b` | `Test1234!` | admin_5 |
| Type B sub-seat (colleague of Kantora) | _emailed_ | _temp_ | sub_seat under B |
| Type C (Студио) admin | `test_studio_c` | `Test1234!` | admin_10 |
| Platform admin (Martin) | use the existing seeded admin account | | admin |

If no admin account exists in your dev DB, create one via the existing `/auth/create-admin` flow (see `server/controllers/authController.js`).

### 0.5 Quick troubleshooting reset

If anything goes sideways:
1. **Log out + log back in** — refreshes the JWT-validated user, picks up new fields like `subscription`.
2. **Hard-refresh** (`Cmd+Shift+R`) — clears stale React state.
3. **Restart the dev server** — picks up backend code changes.
4. **DB inspection** — open the `nexa` database in MongoDB Compass; check the `users` collection for the test user's `subscription`, `role`, `intendedPlan`, `superUser.practiceAreas` fields if something doesn't look right.

---

## 1. Public site / pricing page

### 1.1 Visit `/pricing`

- Open `http://localhost:3000/pricing`
- ✅ The hero is a **minimal centered intro** (eyebrow "ЦЕНИ" + headline + one-line lead). **No aurora gradient hero**.
- ✅ **Two cards** side by side:
  - **Card 1 — За бизнисите · Nexa Платформа** — `€19 /месец`, subline "8 дена бесплатен пробен период, без картичка", CTA *Започнете*
  - **Card 2 — За професионалците · Nexa Мрежа** — *По апликација* (no price shown), subline "Оценуваме секоја кандидатура индивидуално", CTA *Аплицирајте*
- Click anywhere on Card 1 → should land on `/login`.
- Back, click Card 2 → should land on `/login?intent=network`.

### 1.2 Payment-flow explainer

Scroll down below the cards. ✅ A 4-step horizontal flow connected by a hairline gradient line:

```
1. Пробен период    2. Изберете план    3. Прими профактура    4. Уплати и користи
```

✅ Footnote reads exactly: **"Сите цени се без ДДВ."** Nothing about manual bank transfer (we removed that line earlier).

### 1.3 Language toggle

- Top-right navbar: click `MK / EN` toggle.
- ✅ Card 1 → "Nexa Platform · €19 /month · 8-day free trial, no card required"
- ✅ Card 2 → "Nexa Network · Application-based"
- ✅ The 4-step flow translates ("Trial · Pick a plan · Receive invoice · Pay and use").
- Toggle back to MK.

### 1.4 Public homepage sanity

- `http://localhost:3000/` — Home page renders the 3-act story (Дел 1 satellites · Дел 2 Topics · Дел 3 Try the Terminal). This was built earlier and isn't part of Nexa 3.0, but it should still load.

---

## 2. Account creation & first-look

### 2.1 Sign up as Type A (standard, trial)

1. Click **Влез во Терминал** (top-right) or go to `/login`.
2. Click **Регистрирај се** / sign-up toggle.
3. Username: `test_platform_a`, Password: `Test1234!`, confirm.
4. Click **Регистрирај се** → you should be redirected into `/terminal`.

✅ **What you should see in the Terminal:**
- Top header: logo + your username "test_platform_a" + 14/14 credits indicator + profile dropdown
- **Slim subscription banner** at the top: *"Пробен период — остануваат 8 денови. Изберете план за да го задржите пристапот."*
- Left sidebar shows: `Dashboard · Документи ▶ · Проверки ▶ · Едукација · Nexa AI ▶`
- The **B/C surfaces (Блогови / Барања / Topics Q&A / Под-сметки) are NOT visible** for this Type A account.

### 2.2 Test that A users cannot see the Network surfaces

- Try typing `http://localhost:3000/terminal/blogs/submit` directly in the URL bar.
- ✅ Page either shows a "available for Nexa Мрежа only" notice or the form renders but Submit is blocked with the right tier error.
- Same with `/terminal/leads` — should show "available only for Nexa Мрежа корисници".
- Same with `/terminal/topics-qa` — should show "available only for Студио".

---

## 3. Tier visibility — Type B (Admin · 5)

Now we need an Admin user. The easiest path: open the seeded admin's session, go to **Admin → Корисници → Сите корисници**, find or upgrade your `test_platform_a` user to admin_user — OR create a fresh account `test_kantora_b` and manually promote it.

### 3.1 Promote a user to Кантора (admin_5)

1. Log out, log in as the platform admin.
2. Go to `/terminal/admin/all-users`.
3. Find `test_platform_a` (or create `test_kantora_b` first).
4. Click into the user → **Промени улога** → set role to `admin_user`.
5. Go to `/terminal/admin/subscriptions`.
6. Find the same user → set their plan to `admin_5`, status `active`, cycle `monthly`.
7. (Optionally) set `superUser.practiceAreas: ['legal', 'tax']` and `superUser.cities: ['Skopje']` directly in MongoDB Compass for routing tests later.

### 3.2 Log in as the Type B user

- Log out, log in as `test_kantora_b` (or the upgraded user).
- ✅ **Sidebar now shows**:
  ```
  Dashboard
  Документи ▶
  Проверки ▶
  Едукација
  Nexa AI ▶
  Блогови ▶       ← NEW for B
  Барања ▶        ← NEW for B
  Под-сметки ▶    ← NEW for B
  ```
- ✅ Topics Q&A is **NOT** visible (that's C-only).
- ✅ Top banner says *"Претплатата е активна"* or nothing (the slim banner only renders for non-active states).

### 3.3 If B-surfaces DON'T appear

This is the classic bug from this dev cycle:
1. **Log out and log back in** — the `/auth/validate` endpoint now returns the `subscription` field; old JWT sessions don't have it cached.
2. If still missing after re-login, check the network tab → `GET /auth/validate` → response body should contain `"subscription": { "plan": "admin_5", "status": "active", ... }`.
3. If `subscription` is `null`, the DB record itself doesn't have the subscription block — go back to `/admin/subscriptions` and set it.

### 3.4 Hover behavior on collapsed sidebar groups

- All groups (Документи, Проверки, Nexa AI, etc.) should be **collapsed by default** (`▶`).
- **Hover over "Документи"** without clicking → a small white panel should slide out **to the right** of the sidebar showing "Автоматизирани документи · Мои шаблони".
- Move the cursor across the gap to the flyout → it should stay open (we added an invisible bridge).
- ✅ Click the parent row → it expands inline below. The flyout no longer appears for that group (because it's now expanded).
- Active route's parent (whichever group contains the page you're on) should auto-expand.

---

## 4. Tier visibility — Type C (Студио)

Repeat the promotion from §3.1 but set:
- Plan: `admin_10`
- Use a fresh account or upgrade `test_studio_c`

### 4.1 Log in as Type C

✅ Sidebar shows everything Type B has, **plus**:
```
Topics Q&A ▶
```

### 4.2 Quick C-only checks
- `/terminal/topics-qa` → renders the 3-tab page (Отворени прашања · Мои одговори · Објавени). For now the worklist is empty; we'll populate it in §8.
- The dashboard tile row should show a tile for "Прашања на чекање" — Type B does not see this tile.

---

## 5. Sub-seat (colleague) invitation

### 5.1 Invite a colleague

1. Logged in as the Type B (or C) admin: open `/terminal/team`.
2. Click **Покани член** → enter:
   - Email: `colleague1@example.test`
   - Full name: "Колега Тест"
   - Company mode: choose **shared** (uses parent's company info)
3. ✅ A credentials card appears with the email + a temporary password. **Copy the temp password to your clipboard NOW** — it's only shown once.

### 5.2 Test sub-seat login

1. Open a **different browser** (or incognito window).
2. Go to `/login`, sign in with `colleague1@example.test` + the temp password.
3. ✅ First-login flow: you're redirected to `/terminal/change-password` (forced password change). Set a new password.
4. After password change, you land in the Terminal as a sub-seat.

### 5.3 What the sub-seat should see

- ✅ Sidebar: **only Platform surfaces** — Dashboard · Документи · Проверки · Едукација · Nexa AI.
- ❌ Sub-seat should **NOT** see Блогови / Барања / Topics Q&A / Под-сметки.
- ✅ **No "Подобрете го вашето корисничко искуство" / "Верификувај компанија" banner** appears on `/terminal/documents` (this banner is now hidden for sub-seats).
- ✅ The company info shown when generating a document should be the **parent's** company info (e.g., "TestKompanija1") because we picked `shared` mode.

### 5.4 Reset password / revoke flow (back as B admin)

- As the parent admin, on `/terminal/team`:
  - Click **Ресетирај лозинка** on the seat → a new temp password is shown.
  - The sub-seat session should still work until they next reload; after that they get `mustChangePassword: true` again.
  - Click **Поништи** → the seat is deactivated; trying to log in returns 401.

---

## 6. NexaAI Stance Preferences (any tier, including trial)

### 6.1 Find the page

- Logged in as any tier (start with the Type A trial user).
- Sidebar: **Nexa AI ▶** → hover or click → **Лични преференци** sub-item.
- Lands on `/terminal/ai/stance`.

### 6.2 Test the form

1. ✅ Five single-select pill rows render (each with 2 or 3 options):
   - Однос кон ризик (Конзервативно / Балансирано / Опортунистички)
   - Преференци за договорни односи (Долгорочни / Балансирано / Лесни за излез)
   - Ниво на детал (Детално / Балансирано / Општо)
   - Комерцијален vs. релациски приоритет
   - Тон на прегледи (Внимателно / Прагматично) — **2 options only**
2. ✅ Sixth field: **Дополнително (опционално)** — textarea, 300-char counter that decrements live.
3. **Зачувај преференци** button is **disabled** until you make a change.
4. Pick "Балансирано" / "Долгорочни" / "Детално" / "Комерцијален" / "Внимателно" + free-text "Секогаш референцирај македонско право." → Save button enables.
5. Click **Зачувај преференци** → green toast *"Преференците се зачувани."* Save button greys back out.
6. **Очисти и врати на стандардно** → clears all selections to null (the Save button enables again because state is dirty). Save.

### 6.3 Confirm the prefix is injected

- Open `/terminal/ai-chat` (Правен AI).
- Ask: *"Како се пресметува отпремнина според македонското трудово право?"*
- The response should be **detailed and conservative** (because that's what we just set), and should NOT mention the preferences explicitly to you.
- In the **server logs** (Terminal 1), look for the `[RAG DEBUG]` block — you can verify the system prompt contains `[User stance preferences]...[End user stance preferences]` block at the top.

### 6.4 Trial behavior

- Sign in as a fresh trial user (`test_platform_a` if you haven't promoted it).
- Go to `/terminal/ai/stance`. ✅ The form is fully functional — **no TrialDisabledNotice** here. Stance Preferences is a core AI tool, available even during trial.

### 6.5 Sub-seat behavior

- As the sub-seat from §5, visit `/terminal/ai/stance`. ✅ Form renders and works. Each sub-seat has their own independent preferences — not inherited from the parent.

---

## 7. Blog Submission Workflow (Type B/C only, AI is advisory)

### 7.1 Find the page

- As Type B `test_kantora_b`:
- Sidebar: **Блогови ▶** → click or hover → **Поднеси прилог** (`/terminal/blogs/submit`).

### 7.2 Try as a TRIAL Type B (if you haven't activated yet)

- ✅ A yellow **TrialDisabledNotice** appears at the top: *"Достапно по активирање на платена претплата."*
- The form renders but the **Поднеси на уреднички преглед** button is disabled.
- *(If you already activated the subscription in §3.1, skip this and go to §7.3.)*

### 7.3 As a PAID Type B — create and submit a draft

1. Title: `Тестен прилог за работни односи во Македонија`
2. Use the ReactQuill editor → paste / type 100–200 words of body text. Sample:
   > Македонското трудово право предвидува посебни правила за раскинување на договор за вработување. Според Законот за работните односи, работодавачот мора да обезбеди писмен отказ со предзнаење. (... add 2–3 more sentences ...)
3. Optional: Category = "Трудово право", Keywords = "договор, отпремнина".
4. Upload a cover image (any JPG/PNG/WebP ≤ 5MB).
5. Click **Зачувај нацрт** → green toast *"Нацртот е зачуван."* The URL now has `?id=<submission-id>` and the status is `draft`.
6. Click **Поднеси на уреднички преглед** → status briefly flips to `ai_checking` → after ~5 seconds, lands on `submitted`.

### 7.4 What the AI should produce (advisory)

- In the right-side panel ✅ **AI препораки** card now shows:
  - Either *"Без посебни забелешки"* (neutral pill) or *"N предлог(а) за подобрување"*
  - A list of suggestions: meta description, social blurb, suggested category, suggested keywords (with "Примени" buttons)
- Helper text underneath: *"Препораките се советодавни. Прилогот веќе е во уредничкиот ред."*
- ✅ The post is **in the admin queue regardless of AI verdict**. Even a 50-word draft with no structure will be submittable.

### 7.5 Monthly quota check (Type B = 1 per month)

- With the same Type B account, go back to `/terminal/blogs/submit` (you should be redirected to a new draft if you hit "+ Нов прилог" or similar).
- Try to start a second submission.
- ✅ On **submit** of the second post, the server returns 409 *"Достигната месечна граница. Кантора дозволува 1 поднесувања месечно."*
- (Type C will get 2/month.)

### 7.6 Admin review (you = Martin)

1. Log out, log in as platform admin.
2. Go to `/terminal/admin/blogs/pending` (or via sidebar: **Блогови ▶** → **Чекаат уреднички преглед**).
3. ✅ Filter chips read: *Сите чекаат · Чекаат преглед · Вратени · Прифатени (за објава)*. No more "AI помина / AI пронајде ставки" chips.
4. Click into the submission you just created.
5. Detail view:
   - Body renders (HTML from ReactQuill)
   - **AI препораки (советодавно)** section appears — neutral pill, list of suggestions
   - Notes textarea at the bottom + three buttons: **Прифати** · **Врати на доработка** · **Одбиј**

### 7.7 Test "Врати на доработка"

- Type editorial notes: *"Додајте конкретен пример на пресметка."*
- Click **Врати на доработка**. ✅ Toast *"Извршено."*; the row moves to the **Вратени** filter.
- Sub-seat author receives email `blogReturnedForRevision` (check server logs / email service stub).

### 7.8 Author revision

- Log back in as the Type B author.
- Sidebar: **Блогови ▶** → **Мои поднесувања** → status pill shows **"Вратено за доработка"** (yellow).
- Click in → form is editable, the red editorial notes block at the top shows your earlier feedback.
- Edit the body, click **Поднеси на уреднички преглед** → back to `submitted`.

### 7.9 Test "Прифати" → "Објави"

- Back as Martin admin: open the submission again.
- Click **Прифати** → status `accepted`, sets `newsletterMonth` automatically based on the 25th cutoff rule (today's date determines next or next-after-next month).
- The action row now shows **Објави на јавниот блог**.
- Click it. ✅ A new row appears in the `blogs` collection. The submission's `publishedBlogId` and `publishedAt` are populated.
- Author receives `blogSubmissionPublished`-style email (or its equivalent).

### 7.10 Public verification

- Log out (or open a private window).
- Visit `/blog` — your published post should appear in the public blog list under the author's byline (their `fullName` or `username`).

---

## 8. Inquiry Board (Manual Model)

### 8.1 Post an inquiry as Martin

1. Log in as admin → sidebar: **Управување со барања ▶** → **Внеси ново барање**.
2. Fill the form:
   - Извор: `immigration.mk`
   - Наслов: `Хитна дозвола за престој - бизнисмен од Турција`
   - Град: `Skopje`
   - Категории: check **legal** and **translation** (multi-select)
   - Анонимизирано резиме (≥40 chars):
     > Турски бизнисмен со склучен брак во Скопје. Бара дозвола за престој со рок од 2 недели поради планиран бизнис состанок. Потребен е и преведувач за документите.
   - Јазик: `tr`
   - Итност: **Итно**
   - Внатрешни белешки: `Купец преку Facebook ad campaign — pretpriemnistvo`
   - Контакт на клиентот: `Mehmet Yılmaz` / `mehmet@example.com` / `+90 555 123 4567`
   - Оригинален текст: paste any sample email body
3. Click **Објави барање**. ✅ Redirects to the detail page.

### 8.2 Verify visibility for B/C members

- Open another browser as `test_kantora_b` (Тип B):
- Make sure their `superUser.practiceAreas` includes `legal` and `superUser.cities` is empty or includes `Skopje` (set via MongoDB Compass if needed).
- Sidebar: **Барања ▶** → **Интерна табла** (`/terminal/leads`).
- ✅ The inquiry appears as a card showing:
  - Topic
  - Anonymized summary
  - Category chips (legal is green/highlighted, translation is grey)
  - 📍 Skopje · 🗣 TR · 📅 today · **Итно** red badge
  - "Изразувам интерес" button

### 8.3 First-look window (Type C only)

- Open ANOTHER browser as `test_studio_c` (Type C).
- ✅ If the inquiry is **NOT urgent** AND was posted **less than 24h ago**, Type C **should NOT see it** yet. (The first-look window gives B priority for 24h.)
- Because the inquiry we just posted is **urgent**, Type C should see it immediately.

### 8.4 Express Interest

- As Type B, click **Изразувам интерес**.
- 3-field modal:
  1. Professija: pick "Адвокат"
  2. Бесплатна почетна консултација: "Да"
  3. How can I help (max 400 chars): *"Имам 12 години искуство со имиграциски случаи. Можам да поднесам барање за дозвола во рок од 5 работни дена."*
- Submit. ✅ Toast: *"Интересот е примен. Уредничкиот тим ќе одлучи."*

### 8.5 Try to submit interest a second time

- Click **Изразувам интерес** on the same card again.
- ✅ Server returns 409: *"Веќе сте изразиле интерес за ова барање."*
- (The unique-index on `(inquiryId, memberId)` enforces this.)

### 8.6 Admin approval flow

1. As Martin: `/terminal/admin/inquiries` → click into the inquiry.
2. Left column shows the anonymized summary + the **private inquirer contact** (with **Копирај** buttons) + internal notes.
3. Right column shows the list of interest signals.
4. Click **Одобри овој член** on the signal from `test_kantora_b`.
5. ✅ Right column flips to the **"Подготвено за претставување"** panel:
   - To: `Mehmet Yılmaz <mehmet@example.com>` (with **Копирај**)
   - CC: the B user's name + email (with **Копирај**)
   - Subject: `Re: Хитна дозвола за престој...` (with **Копирај**)
   - Suggested email body — pre-rendered in **Turkish** (because `language: tr` is not handled — falls back to MK by default; we localize only mk/en). Actually since `language: tr` ≠ 'en', the template is MK. Copy text works.
6. Open your real mail client, paste the email, send it manually.
7. Back in the panel, click **Означи како воведено**.
8. ✅ The `approvals[]` row gets `introducedAt`; the inquiry status moves to `claimed` (if all categories filled) or `partially_claimed`.
9. Type B account receives no extra notification (they already know they were approved).
10. **Any other pending interest signals** from other members get auto-set to `acknowledged`, and those members receive an "Друг член беше одобрен" email.

### 8.7 Multi-category approval

- The inquiry has both `legal` AND `translation` categories.
- Now have a different Type B (with `translation` in their practiceAreas) submit interest.
- ✅ Their signal appears in the queue.
- Approve their interest under the `translation` category → second approval is added.
- ✅ Inquiry status moves to `claimed` once every tagged category has been filled.

### 8.8 Trial behavior (Inquiry Board)

- Sign in as the trial Type A user (`test_platform_a` if you haven't promoted it; or create another).
- ✅ `/terminal/leads` is **not in the sidebar** for trial-A.
- For a trial user with `intendedPlan: 'admin_5'`, the sidebar entry would appear but the board would show **2 sample cards** with clearly-labeled placeholder data, and **Express Interest is disabled**.
  - To test this: set `intendedPlan: 'admin_5'` in the DB on `test_platform_a` directly.

### 8.9 My Claims / My Engagements

- As Type B user `test_kantora_b`: `/terminal/leads?tab=claims` shows the interest signal we submitted with its status (`Одобрено`).
- `/terminal/leads?tab=engagements` shows the **approved engagements only**, with the inquirer's **real contact details revealed** (name + email + phone in a slate panel). This is the only place a member sees real contact info.

---

## 9. Topics Q&A Authoring (Студио / Type C only)

### 9.1 Create a worklist topic as Martin

1. `/terminal/admin/topics/worklist` → click **+ Нова тема**.
2. Fill in:
   - Наслов: `Како се пресметува отпремнина според Законот за работни односи?`
   - Practice area: `employment_law` (matches what we'll set on the C user's profile)
   - Категорија: `Трудово право`
   - SEO целен збор: `пресметка на отпремнина`
   - Целна должина: 1500
   - Мек рок: 28 дена
   - Опсег (≥40 chars):
     > Како се пресметува отпремнината според македонското трудово право, за кого важи, и кои се исклучоците. Конкретни примери на пресметка за договори со различен стаж.
   - Прашања: keep the 5 starter prompts, or add a 6th: *"Кои се пресметковните формули за стаж под 5, под 10, и над 10 години?"*
3. Click **Создади тема**. ✅ Redirects to the worklist list; new topic shows in **Отворени** status.

### 9.2 Member sees the topic

- Log in as `test_studio_c` (Type C).
- **Important**: set `superUser.practiceAreas: ['employment_law']` in MongoDB Compass on this user, otherwise the filter hides topics that don't match.
- Sidebar: **Topics Q&A ▶** → **Отворени прашања**.
- ✅ The new topic appears with: title, practice area chip, category chip, scope paragraph, meta (🎯 keyword · 📏 ~1500 words · ⏳ 28 days · 📝 6 questions), and a **Побарајте отворање** button.

### 9.3 Request to open

- Click **Побарајте отворање** → modal opens.
- Single field: 1-sentence justification (max 400 chars).
- Enter: *"Имам 8 години искуство со трудово право и редовно водам предавања за пресметка на отпремнина за HR директори."*
- Submit. ✅ Toast confirmation; redirected to `/terminal/topics-qa/answer/<submissionId>` (the answer form), but the status is `requested` so the form is **read-only** for now.
- Banner says something like "Барањето е поднесено. Чека одобрување."

### 9.4 Test exclusivity (try requesting the same topic from another C user)

- Open another browser as a SECOND Type C user (or upgrade test_kantora_b to admin_10 for this test).
- `/terminal/topics-qa` → ✅ **The topic still appears** because `activeSubmissionId` is still null (admin hasn't approved yet).
- They can also request → second `requested` submission is created.

### 9.5 Test one-active-submission-per-member

- As `test_studio_c`, try requesting another OPEN topic (you'll need to create a second worklist item first).
- ✅ Server returns 409: *"Имате веќе една активна тема. Завршете ја или ослободете ја пред да барате нова."*

### 9.6 Admin approves the request

1. As Martin: `/terminal/admin/topics/submissions`.
2. Filter chip **Чекаат одобрување** → both pending requests visible.
3. Click into `test_studio_c`'s request.
4. Right column shows: status `Барање`, big **Одобри** button.
5. Click **Одобри**. ✅ Status flips to `Во работа`; the topic's `activeSubmissionId` is now set.

### 9.7 Verify the lock

- Refresh the second C user's `/terminal/topics-qa`. ✅ **The topic is gone from their board** (it's now locked). Their `requested` submission still exists but the worklist row's status changed; the admin needs to decline it separately. Or you can leave it — eventually it'll show as orphaned.

### 9.8 Answer the questions

- As `test_studio_c`, go to **Topics Q&A → Мои одговори** → open the active submission → click through to `/terminal/topics-qa/answer/<id>`.
- ✅ Form renders all questions as labeled textareas. Each has:
  - The prompt
  - Optional notes from admin
  - Live word count (grey <50, amber 50–99, green ≥100)
  - Target hint "100–400 зборови"
- Type 100+ words in every question (or just enough for testing — 50+ words per answer to clear the submit gate).
- Side panel on the right tracks progress: total words / answers with text count / current status.
- Click **Зачувај нацрт** mid-way → toast *"Зачувано."*
- Click **Поднеси за преглед**. ✅ If any question is empty, server returns 400 with the missing question number. Otherwise status flips to `Поднесено`.

### 9.9 Admin review

1. As Martin: `/terminal/admin/topics/submissions` → filter **За преглед**.
2. Click into the submission.
3. ✅ Full Q&A view (read-only), revision history if any, action buttons: **Прифати · Врати на доработка · Одбиј · Принудно ослободи**.
4. Test **Врати на доработка**: enter notes "Додајте конкретна пресметка за 15 години стаж." → submit.
5. Author receives `qaSubmissionReturned` email; submission goes back to `Во работа`; **the lock is retained**.
6. As the author, edit the answers, resubmit.
7. As admin, **Прифати** → status `Прифатено`. The accept button is replaced by **Објави на topics.nexa.mk**.
8. Click Публикувај. ✅ A new row appears in the `topics_pages` collection. Submission's `publishedUrl` is populated as `https://topics.nexa.mk/<slug>`.

### 9.10 Verify the published page payload

- In MongoDB Compass → `topics_pages` collection → open the new doc.
- ✅ Fields you should see:
  - `slug` (URL-safe)
  - `url` (full https://topics.nexa.mk/...)
  - `author.{name, firm}` — populated from the user's fullName + companyInfo.companyName
  - `contentHtml` — pre-rendered HTML with `<article>`, TOC, 5+ anchored `<section id="qN">` blocks, disclaimer footer
  - `jsonLd` — array of 2 objects, types `FAQPage` and `Article`
  - `meta.{title, description, canonical}`
  - `lastReviewedAt` = `acceptedAt`

The future topics.nexa.mk satellite will read this via `GET /api/topics/pages/:slug`.

### 9.11 Public API check

- In browser or curl:
  ```
  curl http://localhost:5002/api/topics/pages/<slug>
  ```
- ✅ Returns JSON with `success: true` and the full page payload. No auth required.

---

## 10. Trial flow end-to-end

### 10.1 Fresh trial

1. Create a new account `test_trial_user` (no promotion).
2. Sidebar = Type A only (Dashboard / Документи / Проверки / Едукација / Nexa AI).
3. Top banner: *"Пробен период — остануваат 8 денови. Изберете план за да го задржите пристапот."*
4. Try generating an Automated Document. ✅ Should work — trial users have full access to the Platform tools.

### 10.2 Trial → suspended

To skip the 8-day wait:
1. Open MongoDB Compass → `users` → find `test_trial_user`.
2. Edit `subscription.endsAt` to a date in the past (e.g., yesterday).
3. Run the daily cron once via DB direct update, or just reload the Terminal.
4. ✅ Top banner now reads *"Сметката е суспендирана..."* (red).
5. Try to generate a document → server returns 402 → frontend opens the **SubscriptionGate** modal automatically.

### 10.3 Order via the gate

1. SubscriptionGate modal opens. ✅ 3 plan tiles, cycle row (Месечно/Квартално/Годишно), one **Нарачај** button.
2. Pick `Nexa Платформа`, `Месечно` → button shows "€19 / месец".
3. Click **Нарачај** → backend records the request + grants 3-day grace automatically (one-time use).
4. ✅ Toast confirms; status moves to `pending_approval`; member can use features again during grace.
5. Email with payment instructions is sent (check server logs / email service).

### 10.4 Admin approve the order

- As Martin: `/terminal/admin/subscriptions` → filter **Чекаат одобрување (Pending approval)** → find the order.
- Click **Одобри**; set the proper `endsAt`. Status flips to `active`.

---

## 11. Account / billing / subscription surfaces

### 11.1 Header dropdown

- Top-right click the user name (e.g., "test_kantora_b ▼"). ✅ Dropdown opens with:
  - 🏢 **Профил** → `/terminal/verification`
  - 💳 **Сметка** → `/terminal/subscription`
  - 📑 **Сметководство** → `/terminal/billing`
  - 🔑 **Лозинка** → `/terminal/user`
  - 🚪 Logout

### 11.2 Sidebar should NOT have Сметка group

- ✅ Sidebar bottom has no "Сметка ▶" anymore. Profile / Subscription / Billing live exclusively in the Header dropdown.

### 11.3 `/terminal/subscription`

- ✅ Page renders (no longer 404).
- Shows: plan label (e.g., "Nexa Мрежа · Кантора"), status pill, cycle, ends-at + days countdown.
- During trial: **"Изберете план"** button → opens SubscriptionGate.
- Sub-seat sees a help note: *"Како поканет колега, пристапот Ви се обезбедува преку планот на компанијата..."* and no button.
- Active grace period: yellow info panel appears with the grace end date.

### 11.4 `/terminal/billing`

- ✅ Renders the static "Како функционира уплатата" 5-step explainer.
- ✅ "Архива на профактури" placeholder block (no real invoices yet).

### 11.5 `/terminal/verification` (still exists)

- ✅ This page is preserved. It's the company-info update flow. Sub-seats with `companyMode: 'shared'` should not be encouraged to use it — but it still renders if visited directly.

### 11.6 `/terminal/profile` (REMOVED)

- Try navigating to `http://localhost:3000/terminal/profile`. ✅ Should NOT render. Either a 404 from the router or a fallback to login. (Removed in favor of the dropdown.)

### 11.7 `/terminal/user` (Лозинка)

- Existing credentials change page is kept and reachable via the **Лозинка** entry in the dropdown.

---

## 12. Sub-seat — banner suppression

- As the sub-seat from §5: visit `/terminal/documents`.
- ✅ **The "Подобрете го вашето корисничко искуство → Верификувај компанија" banner does NOT appear.**
- (Previously this banner appeared for any user with `profileComplete: false`. We now also exclude `role: 'sub_seat'`.)

---

## 13. Public API integrity (regression checks)

These should all still work since they were not touched:

- `GET /api/blogs/public` — public blog feed (used by `/blog` page)
- `GET /api/auto-documents/*` — document generation endpoints
- `GET /api/credits/balance` — credit balance (during trial should report whatever the seed grants)
- `POST /api/leads/inbound` — legacy lead webhook (HMAC-signed) still exists, just unused in v3 flow
- `GET /api/auth/validate` — should now include `subscription`, `intendedPlan`, `needsTierOnboarding` in the response

Spot-check the last one in DevTools → Network → on any Terminal page load, find `/auth/validate` → expand the response body:
```json
{
  "valid": true,
  "user": {
    "id": "...",
    "role": "admin_user",
    "subscription": { "status": "active", "plan": "admin_5", "cycle": "monthly", "endsAt": "..." },
    "intendedPlan": "admin_5",
    "needsTierOnboarding": false,
    "mustChangePassword": false,
    "parentSuperUserId": null,
    ...
  }
}
```

---

## 14. Manual cleanup / known limitations

These are documented gaps, not bugs:

- **`needsTierOnboarding` flag** is set on new signups but no first-look modal is wired yet (work was started, not completed). For now the registration form just defaults `intendedPlan` to `'standard'`.
- **`/topics.nexa.mk`** is an external satellite not in this repo. The `topics_pages` collection holds the rendered HTML, but no public-facing satellite renderer is integrated yet — that's a follow-up.
- **Newsletter assembly + send job** for accepted blog posts is not built. Submissions get `newsletterMonth: 'YYYY-MM'` correctly, but no cron picks them up to assemble the newsletter.
- **Stripe / online payments** — never wired. All payments are manual bank transfer per the pro-forma invoice flow.
- **i18n EN strings** inside the Terminal are sparse. Terminal is MK-only by design. The public site (`nexa.mk/*`) is fully bilingual.

---

## 15. Test data cleanup

When you're done testing:

```js
// In MongoDB shell or Compass:
db.users.deleteMany({ username: { $in: ['test_platform_a','test_kantora_b','test_studio_c','test_trial_user'] } });
db.users.deleteMany({ email: 'colleague1@example.test' });
db.blog_submissions.deleteMany({ });  // ⚠ deletes ALL — only safe in test DB
db.blogs.deleteMany({ submissionId: { $exists: true } });  // delete only test-published posts
db.inquiries.deleteMany({ topic: /Тестен|тестен|Test/i });
db.inquiry_interest_signals.deleteMany({ });
db.qa_worklist.deleteMany({ title: /Тестен|тестен|Test|отпремнина/i });
db.qa_submissions.deleteMany({ });
db.topics_pages.deleteMany({ });
db.user_stance_preferences.deleteMany({ });
```

⚠ Run on the **test/dev DB only**. Never on production.

---

## 16. What to flag

If anything below happens, write a bug note with:
1. The exact URL you were on
2. The account you were logged in as (role + plan)
3. What you did (1-step before the bug)
4. What you expected
5. What you saw
6. Browser DevTools console errors (if any)
7. Screenshot if visual

**High-priority signals to watch for:**
- B/C surfaces still hidden for a paid Admin user after log out + log in (means the `/auth/validate` fix didn't take effect — check `subscription` field in the response body)
- Sub-seat sees B/C surfaces (predicate bug — should always be A)
- Trial-suspended user can still generate documents (gating bypass)
- AI guideline check blocks a blog submission (should be advisory only — every submission lands in the queue)
- Express Interest possible from Type A or sub-seat (should be 403)
- Topic exclusivity broken — two members get approved on the same topic without intervening release

---

*End of testing guide. Last updated: 2026-05-30.*
