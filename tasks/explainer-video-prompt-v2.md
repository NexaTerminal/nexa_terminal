# Nexa explainer — v2 (final prompt for the design AI)

Supersedes the storyboard/prompt in `tasks/explainer-video-plan.md` (clips 7–10 dropped; 1-min walkthrough added).

## Files to attach (rename exactly like this)

| File | Content | Approx. length |
|---|---|---|
| `00_walkthrough.mp4` | 1-minute general tour of the app | 60s |
| `01_ai_tim_picker.mp4` | AI Тим, hovering the 5 characters, picking Лекс | 6s |
| `02_lex_answer.mp4` | Question to Лекс, answer streams, scroll to „Член" citations | 20s |
| `03_proverka_answers.mp4` | Answering the Правна проверка questions | 15s |
| `04_proverka_report.mp4` | Finished report with score | 8s |
| `05_document_generate.mp4` | Договор за вработување: pre-filled company data → fields → Генерирај документ | 20s |
| `06_document_word.mp4` | The finished .docx opened in Word | 8s |
| `nexa_logo.svg` / `.png` | Logo, transparent background (light + dark versions) | — |
| *(optional)* `11_razgovori.mp4`, `12_blog_kursevi.mp4`, `13_mobile.mp4`, `14_dashboard.mp4` | Only if recorded | — |

## Prompt

```
Create a 72-second vertical product explainer video (9:16, 1080x1920, 30fps) for "Nexa", a web
platform for small businesses in North Macedonia. Target audience: small business owners, HR and
office managers. Message: Nexa is the place to (1) get informed, (2) do less admin, (3) connect
with a professional. Tone: fast, dynamic, modern, confident; never cheesy. All on-screen text is
Macedonian Cyrillic and must be used EXACTLY as written below, including punctuation and „Сè".

ATTACHED FOOTAGE (screen recordings of the real app)
- 00_walkthrough.mp4: 1-minute general tour of the app. Use it as a source of fast B-roll
  (dashboard, sidebar, sections, any chat or conversation screens). Pick the most visual moments.
- 01_ai_tim_picker.mp4: choosing an AI character.
- 02_lex_answer.mp4: AI answer with law-article ("Член") citations. Hero shot of pillar 1.
- 03_proverka_answers.mp4 and 04_proverka_report.mp4: compliance check and its score report.
- 05_document_generate.mp4 and 06_document_word.mp4: generating an employment contract and the
  finished Word document. Hero shot of pillar 2.
- nexa_logo: the brand logo.
- Optional clips 11–14 (if attached): use as extra B-roll where it fits.
Recordings are raw and slow: speed-ramp them 1.5x–3x, cut out waiting/loading, keep the moment of
the result (answer appears, score appears, document opens) at normal speed for ~1 second.

BRAND STYLE (match the app)
- Font: Inter only. 800 weight headlines, 600 labels, 500 body.
- Colors: primary blue #1E4DB7, deep navy #0F2766 for title backgrounds, light blue #7BB8FF and
  #E0EEFF, teal accent #2BB3C0, white #FFFFFF cards, near-white #F5F5F5, dark text #262626.
  Orange #F97316 ONLY in the problem scene.
- Backgrounds: soft "aurora" gradient — large blurred light-blue (#7BB8FF) and teal (#2BB3C0) orbs
  drifting slowly on navy or on near-white.
- UI elements: white rounded cards (14px radius), thin light-grey border, soft shadow; minimal,
  mostly monochrome. No stock photos, no people, no clip-art, no emojis on screen.
- Screen recordings sit inside a floating browser frame with a slight 3D tilt and drop shadow.
  Crop and zoom so the important UI fills the vertical frame; use zoom-to-cursor punch-ins and a
  blue (#1E4DB7) highlight ring on every click.
- Text: max 7 words per card, big, centered. Keep the top 15% and bottom 20% of the frame free of
  text (TikTok/Reels UI). Burn in captions for every scene — the video must work with sound off.
- Motion: quick whip/slide transitions on the beat, cards pop in with slight overshoot, kinetic
  word-by-word text for the hook.

MUSIC
Upbeat electronic / corporate-pop, ~124 BPM, royalty-free and licensed for commercial use. Build
for the first 7 seconds, DROP exactly at the logo reveal (0:07). Cut every scene on the beat.
Music fades out over the last 2 seconds. No voice-over.

SCENES
1. 0:00–0:03 HOOK. Navy background, kinetic word-by-word text:
   „Колку часа неделно губите на администрација?"
2. 0:03–0:07 PROBLEM. Four fast cards slamming in one per beat, orange accent:
   „Договор за вработување?" / „Отказ?" / „ГДПР правилник?" / „Адвокат за секоја ситница?"
3. 0:07–0:10 REVEAL (music drop). Aurora bloom, Nexa logo scales in, then:
   „Правниот оддел на Вашата фирма."
4. 0:10–0:16 MONTAGE. 4–5 very fast cuts (≈1s each) from 00_walkthrough.mp4 showing the breadth of
   the app (dashboard, sidebar, different sections). Caption: „Вашата фирма. Сè на едно место."
5. 0:16–0:18 Pillar chip (white card on aurora): „1 · Информирајте се"
6. 0:18–0:28 AI. 01_ai_tim_picker (2s) → 02_lex_answer (8s, speed-ramped, end zoomed on the
   „Член" citation). Caption: „Прашајте. На македонски. Со член од законот."
7. 0:28–0:35 CHECK. 03_proverka_answers (4s, fast) → 04_proverka_report (3s, score animating in).
   Caption: „Дознајте што Ви недостасува."
8. 0:35–0:37 Pillar chip: „2 · Помалку администрација"
9. 0:37–0:47 DOCUMENT. 05_document_generate (7s, emphasise the pre-filled company fields with a
   highlight ring) → 06_document_word (3s, the finished contract).
   Caption: „Договор за вработување — за 2 минути."
10. 0:47–0:52 ORGANISED. Segment from 00_walkthrough.mp4 that shows the sidebar sections /
    employees / contracts area. Caption: „Вработени, договори, рокови — уредно."
11. 0:52–0:54 Pillar chip: „3 · Поврзете се"
12. 0:54–1:02 PROFESSIONAL. Animated chat motion-graphic in the app's style (white bubbles on
    near-white, Inter), over a blurred frame of a chat screen from 00_walkthrough.mp4 (or
    11_razgovori.mp4 if attached). Bubbles appear one by one:
      - grey bubble labelled „Лекс · AI": „Можам да поканам професионалец во разговорот."
      - small blue status chip: „Професионалец се приклучи"
      - blue-outlined bubble labelled „Професионалец": „Добар ден, ќе Ви помогнам."
    Caption: „Кога AI не е доволен — професионалец."
13. 1:02–1:05 RECAP. Three chips stack into one card on beats:
    „Информирани." / „Помалку админ." / „Поврзани."
14. 1:05–1:12 END CARD (hold at least 4 seconds, aurora loop on navy): Nexa logo,
    „Сè на едно место.", very large „nexa.mk", a white button „Регистрирајте се бесплатно",
    and a small line at 60% opacity: „AI одговорите се информативни и не се правен совет."

ALSO EXPORT
- 30s cut, 9:16: scenes 1, 2 (only 2 cards: „Договор за вработување?" / „Адвокат за секоја
  ситница?"), 3, 6, 9, 14.
- 60s cut, 4:5 (1080x1350) for LinkedIn/Facebook feed: same as master without scenes 4 and 10;
  re-layout text for the 4:5 frame.
- 15s cut, 9:16: „Договор за вработување?" (2s) → scene 9 at 3x (9s) → „За 2 минути. nexa.mk" (4s).

RULES
- Do not add testimonials, ratings, customer numbers, prices, or the phrase "проверено од адвокат".
- Do not invent UI screens other than the chat motion-graphic in scene 12.
- Do not change, translate or "correct" any Macedonian text.
- If any frame of the footage shows a real person's name, email, phone or ID number, blur it.
```
