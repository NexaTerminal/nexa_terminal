# Nexa Terminal — Business Review of Terminal Features

_Date: 2026-06-24 · Perspective: founder/business, not engineering · Scope: in-terminal features only_

---

## 0. Context that shapes every judgment below

- **No paying users yet** — everything is demo/dummy. So this is a *pre-PMF packaging & focus* problem, not an optimization problem. The right move is to **concentrate**, not to add.
- **Two tiers**: Basic €19/mo (€179/yr) and Pro €39/mo (€359/yr). Critically, **Basic already bundles every genuinely valuable tool** (45 doc generators, 4 AI tools, 5 compliance screenings, courses, BYO-template automation, 3 co-workers). Pro adds only **two-sided "Network" features** (booth, leads, blog placement, Q&A, RFQ bidding, 25 client sub-accounts).
- That single packaging decision is the biggest business issue on the platform. More below.

---

## 1. Feature inventory (what a user actually sees)

**РАБОТА — the tools (all in Basic €19)**
1. Dashboard (Контролна табла)
2. Documents — 45 automated generators across 8 categories + **My Templates** (upload your own .docx → automate it)
3. Проверки / Compliance Screenings — 5 domains: **Legal** (Employment ×4 parts, GDPR, Archives, Health & Safety, General), **Marketing**, **HR/Operational**, **Cyber**
4. Nexa AI — **Legal AI chat** (RAG over MK law), **Marketing AI chat**, **Contract Analysis**, **Stance/personal AI preferences**

**МРЕЖА — the network (all in Pro €39, two-sided)**
5. Virtual Fair (booth marketplace)
6. Sourcing / RFQ (request quotes)
7. Blog publishing (content/SEO placement)
8. Leads / Случаи (inbound from satellite sites)
9. Topics Q&A (answer public questions = expert positioning)

**РЕСУРСИ**
10. Education / Courses (substantial content — ~3.2k lines of course data)

**Orphaned / not in main sidebar** (reachable by URL): Investments, Find-Lawyer (actually an RFQ form), Team/sub-users, Billing/Subscription/Credits, Invite/Referrals, Verification.

---

## 2. The ranking (business value, all features)

Scored on five axes that matter pre-PMF: **WTP** (willingness to pay), **Differentiation/moat**, **Retention/daily-use**, **Acquisition leverage**, **Cost-to-maintain**. Tiers are S (crown jewel) → D (cut/park).

| # | Feature | Tier | WTP | Moat | Retention | Acq. | Verdict |
|---|---------|------|-----|------|-----------|------|---------|
| 1 | **Document automation (45 gens)** | **S** | High | High (MK-localized legal) | High | Med | The product. Sticky, clear lawyer-cost-avoidance ROI. |
| 2 | **Compliance Screenings (5 domains)** | **S** | High | High | High (laws change) | **High** | Best top-of-funnel: creates urgency, routes into docs + AI. |
| 3 | **Legal AI chat (RAG, MK law)** | **A** | High | High | High | Med | Hard to replicate; daily utility. Watch cost per query. |
| 4 | **Contract Analysis** | **A** | High | Med | Med | Med | Strong lawyer-substitute; high perceived value. |
| 5 | **My Templates (BYO .docx)** | **A** | Med-High | Med | High | Low | Expands TAM beyond your template list. Undersold. |
| 6 | **Education / Courses** | **B** | Low (alone) | Low | Med | Med (SEO/trust) | Good retention glue + lead magnet; weak standalone WTP. Content rots. |
| 7 | **Marketing AI chat** | **B** | Med | Low | Med | Low | Commoditized vs ChatGPT unless MK/brand-tuned. |
| 8 | **Leads / Случаи** | **B** | High *if liquid* | Med | High *if liquid* | — | Real Pro value **only** once satellite sites produce volume. Unproven. |
| 9 | **Virtual Fair** | **C** | Low now | Low | Low | Low | Classic empty-marketplace. No value without two-sided liquidity. |
| 10 | **Sourcing / RFQ** | **C** | Med *if liquid* | Low | Low | Low | Overlaps Leads + Find-Lawyer. Same admin-email backend. |
| 11 | **Topics Q&A** | **C** | Low | Low | Low | Med (SEO) | Really a marketing/SEO channel dressed as a product. |
| 12 | **Blog publishing** | **C** | Low | Low | Low | Med (SEO) | Acquisition channel, not a paid feature. |
| 13 | **Find-Lawyer** | **D** | Low | Low | Low | Low | Duplicate RFQ surface; orphaned; confuses positioning. |
| 14 | **Investments** | **D** | Low | Low | Low | Low | Off-strategy scope creep; a different product entirely. |
| 15 | **Dashboard** | **D→A** | — | — | **High potential** | — | Currently just a social feed. Wasted prime real estate (see §4). |

---

## 3. What adds value (lean in)

- **Documents + Screenings + Legal AI form one tight loop**: *Screening finds the gap → AI explains it → Document fixes it.* This is the actual product story and the only defensible moat (Macedonian legal localization). Everything else is secondary. Market the loop, not 10 disconnected menu items.
- **Screenings are your best acquisition asset** — a free/teaser compliance score creates fear+urgency and naturally funnels to paid docs and consultations. Today it's buried as a sub-menu equal to everything else.
- **My Templates** is quietly your most scalable differentiator: it removes the ceiling of "we only have 45 templates." Underexposed.
- **The 25-client-sub-account model (Pro)** is a genuine wedge — **accountants/agencies reselling Nexa to their book of clients**. That's a B2B2B growth engine and it's buried as a feature bullet.

## 4. What's not good (fix or cut)

1. **Packaging is upside-down.** All real tools sit in €19 Basic; €39 Pro adds only unproven marketplace features. Consequence: the mass market (businesses that *consume* services) has **no reason to ever upgrade** — Pro only appeals to the narrow slice that *sells* services. This caps ARPU and makes the upgrade path dead. **Highest-leverage fix on the platform.**
2. **Five overlapping two-sided surfaces** (Fair, Sourcing, Find-Lawyer, Leads, Investments) all need liquidity none of them have. You're paying to build/maintain supply-side UI for a marketplace with zero demand proof. Collapse to **one** RFQ concept.
3. **Dashboard wastes the highest-traffic screen** on a social feed. For a compliance product it should show: compliance score, what's missing, expiring/outdated documents, "next best action," recent generations.
4. **Orphaned features** (Investments, Find-Lawyer) signal scope creep and dilute the story. Each menu item is a tax on comprehension.
5. **Two AI chats + stance + contract analysis** read as four separate things; users see "which box do I type in?" Consolidate into one Nexa AI surface with modes.

---

## 5. Recommendations — what I'd change

**Re-package (do this first):**
- Make Basic the **tool tier with limits**; make Pro the **unlimited/scale tier**. Gate by *value metrics*, not by feature category: AI credits/month, # documents/month, # screenings, # sub-accounts. A consuming business then has a real reason to upgrade (hit a limit), not just service providers.
- Pull one or two **power tools into Pro** (e.g. Contract Analysis, unlimited Legal AI, all screening domains) so the tool user — not only the provider — sees Pro value.
- Surface the **accountant/agency reseller** path as a first-class plan/landing ("Manage all your clients' compliance from one account").

**Refocus the surface:**
- **Merge** Fair + Sourcing + Find-Lawyer + Investments into a single "Nexa Network / Get Offers" concept. Hide it until there's supply; don't show users an empty marketplace.
- **Demote** Blog + Topics Q&A out of the product nav into a marketing/SEO ops function (they're acquisition channels, keep them, just don't price/position them as core).
- **Rebuild the Dashboard** into a compliance command center (score, gaps, expiring docs, next action, recent docs). This alone lifts perceived value and retention.
- **Unify the 4 AI tools** under one "Nexa AI" with mode switching.

**What to add (only after refocus):**
- **Document lifecycle**: e-signature, shareable signing links, a "my documents" vault, renewal/expiry reminders. Turns one-shot generation into recurring value → the strongest retention lever you're missing.
- **Recurring compliance**: scheduled re-screening ("re-run your GDPR check quarterly") + change alerts when MK law updates → recurring reason to log in and to keep paying.
- **Free teaser screening** as the public acquisition funnel into signup.
- **Usage analytics for the user** (docs generated, money/time saved) — makes ROI visible at renewal.

---

## 6. Prioritized roadmap

**P0 (weeks, highest ROI):**
1. Re-package tiers around limits + move 1–2 power tools to Pro.
2. Rebuild Dashboard as compliance command center.
3. Hide empty marketplace surfaces; collapse the 5 RFQ-ish features into one.

**P1 (next):**
4. Document vault + e-sign + expiry reminders (recurring value).
5. Free teaser screening → signup funnel.
6. Unify AI tools; surface My Templates prominently.

**P2 (after PMF signal):**
7. Re-introduce the Network/marketplace once you can guarantee supply (seed providers manually first).
8. Accountant/agency reseller plan & onboarding.

**Cut now:** Investments, standalone Find-Lawyer.

---

## 8. Revision — corrected business model (founder input, 2026-06-24)

The §4 critique of "upside-down packaging" was based on a wrong assumption. The intended model:

- **Basic = demand side** (small businesses, the tools). **Pro = supply side** (lawyers/accountants/consultants serving those businesses). These are *different customers*, not an upsell ladder.
- **Pro value =** (1) **marketing reach** to the SMB base via Blog + Newsletter + 20 Q&A; (2) **brokered anonymized leads** via Get Offers (Nexa rewrites the client's need without exposing company info — a trust/"insurance" mechanic, run manually/concierge for now); (3) **client-provisioning** — providers give Nexa member seats to their own client book.
- **Growth loop**: provider onboards their clients as members → clients become the SMB audience → which makes Pro's marketing surfaces worth paying for → attracts more providers. **The member mechanic is the demand-side acquisition engine, not just a feature.**
- **Find-a-lawyer**: killed → folded into Get Offers as the general solution. ✅ (matches §5)
- **Virtual Fair**: intentionally gated/closed for a period to force providers to post products and build supply before opening. ✅ Sound cold-start move — treat "opening day" as a marketable event.
- **Dashboard**: rebuilt as admin-only, word-limited compliance/legal micro-posts (not user blog posts). ✅ Keeps the platform alive without depending on UGC.

**Implications that supersede earlier sections:**
- Blog / Newsletter / Topics Q&A are **Pro marketing inventory**, not weak consumer content — but their value is **audience-gated** (≈€0 until the SMB base exists). Sell early Pro on *client-provisioning + future reach*; seed early providers cheap/free.
- **Open decision — member economics (highest-leverage unknown):** what does each provisioned client seat grant (full Basic tools? lighter?), and how are AI credits capped per member? €39 Pro × 25 full-tool seats × 25× AI usage is either a brilliant CAC subsidy or a margin sink. Decide before building more.
- **Get Offers** concierge is right for MVP but manual — cap per plan, track hours/request, know the self-serve trigger.

**New build — Contract Management System (endorsed):** closes the post-generation retention gap. v1 = repository + metadata + renewal/expiry/notice/payment **reminders** (email + dashboard) + **generate→store→track** loop with the existing doc generators. Defer e-sign, versioning, approval chains. Open question: place it as a Basic tool or a Pro multiplier (provider tracks all clients' deadlines from one account).

---

## 7. One-line thesis

You've built a **strong, defensible compliance-tools product** (Documents + Screenings + Legal AI) and wrapped it in an **unproven, liquidity-starved marketplace** — then priced it so the marketplace is the only thing people pay extra for. **Re-price around the tools, focus the surface to the compliance loop, and defer the marketplace until you can hand-seed supply.**
