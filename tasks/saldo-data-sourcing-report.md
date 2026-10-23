# САЛДО — Data Sourcing & Web Activity Report

**Date:** 23 Oct 2026
**Scope:** All outside web activity performed while building and training САЛДО (accounting AI character).
**Purpose:** A record that no third-party server was harmed, nothing illegal was done, and that privately authored (non-public-institution) content is not used in the Nexa chatbot.

---

## 1. Summary

- **No hacking or unauthorized access.** Every request was a normal HTTP download of a publicly posted page or file — no logins, credentials, paywalls, CAPTCHAs or security measures were bypassed.
- **No server was overloaded.** The heaviest activity was ~72 requests to profit.com.mk over roughly 1–2 minutes (≈1 request/second). All other sites received 1–10 requests spread across the session.
- **Private content was removed.** All files downloaded from profit.com.mk (Конто Профит, a private publisher) were **deleted and never ingested** into any Nexa database. Older Конто Профит guides found in ЈУРА's collection (25 documents, ingested before this session) were also **deleted** — see §6. A rescan of all four AI collections finds **0** Конто Профит chunks.
- **САЛДО uses only official / public-institution sources** (laws, rulebooks, state textbooks, National Bank rates) plus files from the owner's own regulation folder. Where an official text was downloaded from a private website (mojkonsultant.mk, mapas.mk), the file itself is the Службен весник editorial consolidated text — an official public document, not the site's own authored content.

---

## 2. Outgoing requests (from the owner's Mac — the owner's public IP was visible)

Requests run from the terminal (`curl` / Node scripts) left from the owner's own internet connection.

| Site | Approx. requests | Purpose |
|---|---|---|
| profit.com.mk (Конто Профит) | ~72 | 1 homepage check, 8 public WordPress media-API listing calls, 62 PDF downloads (~0.3 s apart, ~45–90 s). **Owner stopped it; all files deleted, none used.** |
| ujp.gov.mk (УЈП) | ~10 | 7 page checks (server returned errors to scripts), 3 PDF downloads (laws/rulebook) |
| finance.gov.mk | 4 | 2 site checks, 1 search, 1 PDF (Закон за вршење сметководствени работи) |
| mojkonsultant.mk | 5 | 2 PDFs (Службен весник consolidated texts: ДДВ, ДЛД), 3 guessed URLs → 404 |
| e-ucebnici.mon.gov.mk (Ministry of Education) | 3 | 1 check, 2 public textbooks |
| crm.com.mk (Central Registry) | 3 | 1 site check, 1 PDF check, 1 PDF (deleted, not used) |
| nbrm.mk (National Bank) | ~3 | Tests of the public exchange-rate web service |
| mapas.mk | 2 | 2 PDFs (Службен весник consolidated texts; one later deleted as duplicate) |
| data.gov.mk | 2 | Public open-data search |
| ec.europa.eu | 2 | 1 VIES test, 1 VAT-rates page |
| www.profit.mk, kontoprofit.mk, konto-profit.mk | 3 | No connection — no traffic reached a server |

**Total:** ~110 requests over the whole session.

**Not from the owner's IP:** ~20 web searches, 4 page fetches and 2 Legal Data Hunter lookups ran through Anthropic's infrastructure.

**Own services (not third-party):** Qdrant, OpenAI and MongoDB — the owner's accounts — were used for embedding (~$0.03 total) and test questions.

---

## 3. Legality notes

- **Access:** only publicly available, unauthenticated URLs were requested. The WordPress media listing on profit.com.mk is a public-by-default API. No access controls were circumvented.
- **Volume:** ~1 request/second for ~1–2 minutes is far below anything capable of degrading a website.
- **Copyright:** downloading publicly posted PDFs is not itself the issue; reusing a private publisher's work inside a commercial AI product without permission could be. This was avoided — the files were deleted before use.
- **Process gaps (now fixed):** `robots.txt` / terms of use were not checked beforehand, and the scripts used a standard browser User-Agent. Neither is illegal; both are covered by the new rule in §5.
- **Official texts:** laws, rulebooks and Службен весник consolidated texts are official public documents intended for public use.

*This report is a factual record, not legal advice.*

---

## 4. What САЛДО uses (Qdrant collection `nexa_accounting_docs`, 13 documents, 2,225 chunks)

**Laws and rulebooks (citable):**
- Закон за данокот на додадена вредност — УЈП consolidated text to 267/2025 *(owner's folder)*
- Правилник за спроведување на Законот за ДДВ (18/2024) *(owner's folder)*
- Закон за данокот на добивка — УЈП consolidated text to 199/2023
- Закон за данокот на личен доход — Службен весник consolidated text (04.02.2025)
- Закон за придонеси од задолжително социјално осигурување — Службен весник consolidated text (2024)
- Правилник за начинот на пресметка и уплата на придонесите (149/2008) *(owner's folder)*
- Закон за даночна постапка — УЈП unofficial consolidated text to 3/2025
- Закон за финансиска дисциплина (215/2015) *(owner's folder)*
- Закон за вршење сметководствени работи — Ministry of Finance consolidated text
- Правилник за сметковниот план и содржината на сметките (174/2011) — УЈП
- Правилник за нормираните износи на кало, растур, крш и расипување (174/2014) *(owner's folder)*

**Background only (not cited):**
- „Основи на сметководство" I and II — Ministry of Education public textbooks (e-ucebnici.mon.gov.mk)

**Live data:**
- НБРМ official middle exchange rates (public web service) — fetched at most once per hour per server, only when a question mentions a foreign currency.

**Verified:** the collection holds only the 13 documents above; no profit.com.mk content (checked by scanning every chunk for "konto"/"profit.mk").

---

## 5. Rule going forward

Saved as a standing rule for future sessions: third-party sites are accessed slowly and human-like — one request at a time, random 10–25 s pauses, few well-chosen files, no bulk pulls — and private publishers' content is not ingested without permission. When requests will go out from the owner's IP, this is stated up front.

---

## 6. Pre-existing private content in ЈУРА's collection — REMOVED

The legal collection (`nexa_legal_docs`, used by ЈУРА/ВЕРА) contained Конто Профит guides ingested **before** this session. A full scan of every chunk for the publisher's footer (`konto@profit.mk`) found **25 documents / 764 chunks** (not only the 5 first spotted):

Аванс и капар · Безготовински плаќања · Годишен одмор и регрес · ДДВ во постапка за присилна наплата · Даночни поттикнувања на донација и спонзорство · Договори за привремени и повремени работи / дело / авторски · Доход од продажба на сопствени земјоделски производи · Животно осигурување — даночен третман (2025) · Закон за младински додаток (commentary) · Закон за практикантство (commentary) · Залихи во трговија (МСС 2 / МСФИ за МСЕ) · Исплати на дивиденди (2025) · Место на промет на услуги за ДДВ · Неживотно осигурување — даночен третман (2024) · Немонетарни користи за вработените · Оданочување капитални добивки — недвижен имот · Оданочување доход од закуп и подзакуп · Оданочување капитални добивки — хартии од вредност · Отпис и исправка на вредност на побарувања · Патни трошоци и службени патувања · Месечни аконтации за ДЛД и ДД (2025) · Пресметка на плата и надоместоци · Промет во ТИРЗ од аспект на ДДВ · Сметководствен третман на залихите · Туристички услуги од аспект на ДДВ

**Action (23 Oct 2026, owner-approved):** all 764 chunks deleted by `documentName`. `nexa_legal_docs` went from 68,810 → 68,046 points; exactly 764 removed, nothing else touched. A one-time backup of the deleted points was written to the session scratchpad (temporary, not part of the repo) before deletion.

**Final verification:** every chunk in all four collections was rescanned for the publisher's markers — `nexa_legal_docs` (68,046), `nexa_insurance_docs` (28,516), `nexa_marketing_docs` (1,438), `nexa_accounting_docs` (2,225): **0 matches**. No Конто Профит content is used anywhere in the Nexa chatbot.

**Side effect:** ЈУРА lost its commentary on Закон за практикантство and Закон за младински додаток. If those topics matter, add the official law texts (Службен весник) to `legal sources/`.
