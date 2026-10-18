# Satellite site → Nexa inquiry board: contact-form email integration

**Hand this to the AI agent of each satellite site** (samodaprasham.mk, immigration.mk,
macedoniancitizenship.mk, company.nexa.mk, iplaw.nexa.mk, tax.nexa.mk, …).

Goal: when a visitor submits the site's contact form, the enquiry is emailed into Nexa,
which anonymizes it and auto-posts it to the inquiry board ("Барања"). This is already
working for **osiguran.mk** — replicate that setup for your site.

---

## What you must do

On contact-form submit, send a **lead notification email via Resend** with these exact
headers:

| Field | Value | Notes |
|---|---|---|
| **To** | `leads@duezoru.resend.app` | Nexa's Resend inbound receiving address. The part before `@` can be anything; the domain `duezoru.resend.app` must be exact. **Do not** send to `info@mail.nexa.mk` — that address is not set up for inbound and the enquiry will be silently lost. |
| **From** | `noreply@<YOUR_SITE_DOMAIN>` | **Must be your own site's domain** (e.g. `noreply@immigration.mk`). Nexa only accepts enquiries from the allowlisted satellite domains; a generic/third-party sender is dropped. |
| **Reply-To** | the **visitor's email** from the form | Nexa reads this as the lead's contact. If it's missing, the enquiry is **not** posted — it's routed to a Nexa admin as "no contact" instead. |
| **Subject** | anything (e.g. `[<YOUR_SITE_DOMAIN>] <topic> — Nexa Terminal`) | — |
| **Body** | the visitor's full message, plus their email/phone in plain text | Nexa anonymizes all PII before posting, so include it. |

Replace `<YOUR_SITE_DOMAIN>` with your actual domain, e.g. `immigration.mk`.

A visitor "we received your message" auto-reply is optional and separate — if you send one,
it goes **To the visitor**, and does not affect the Nexa integration.

---

## Prerequisites (these caused real failures on osiguran — check them first)

1. **`RESEND_API_KEY` must be set in production.** Missing key → the send fails with
   `RESEND_API_KEY missing in production` and the enquiry is never delivered.

2. **Your site's domain must be VERIFIED for sending in Resend** (SPF/DKIM, ideally DMARC).
   If you send `From: noreply@<YOUR_SITE_DOMAIN>` but that domain isn't verified in Resend,
   the send fails with `The <domain> is not verified`. Add + verify your domain under
   Resend → Domains before testing.

3. Send **via Resend** (the same provider Nexa receives on). Sending through another
   provider is fine only if your From domain is authenticated there and still deliverable.

---

## Do NOT change / assume

- Do **not** put your site's address or a third-party mailer in **From** — it must be your
  own allowlisted domain, or Nexa drops it as `skipped_sender`.
- Do **not** send the lead email to `info@mail.nexa.mk`, `info@nexa.mk`, or any `@nexa.mk`
  address — use `leads@duezoru.resend.app`.
- Do **not** strip the visitor's email out of the body or omit Reply-To — Nexa needs the
  contact to post the lead and to send the visitor their opt-out link.

---

## How to confirm it worked (end to end)

1. Submit your live contact form with a **test visitor email you control**.
2. Your Resend **Sending** tab should show the lead email **To `leads@duezoru.resend.app`**.
3. Nexa ingests it automatically. Within a few seconds:
   - the enquiry appears on the Nexa inquiry board, **anonymized** (no name/email/phone shown);
   - the test visitor receives an opt-out ("remove me") email from Nexa.
4. If nothing posts, the cause is almost always one of the prerequisites above:
   - send failed → check `RESEND_API_KEY` and that your From domain is verified in Resend;
   - sent but not posted → confirm **To** is `leads@duezoru.resend.app` and **Reply-To** is
     the visitor's email.

---

## Per-site summary (fill in your domain)

> On contact-form submit, send via Resend:
> **To** `leads@duezoru.resend.app` · **From** `noreply@<YOUR_SITE_DOMAIN>` ·
> **Reply-To** `<visitor email>` · body = visitor's message + their email/phone.
> Ensure `RESEND_API_KEY` is set in production and `<YOUR_SITE_DOMAIN>` is verified for
> sending in Resend. Deploy, then submit a test and confirm the enquiry posts (anonymized)
> on the Nexa board.

---

### Note for the operator (not the site AI)
- `leads@duezoru.resend.app` is Nexa's current Resend inbound address — confirm the
  `duezoru` subdomain matches what Resend shows under **Emails → Receiving**. If you later
  move to a branded receiving domain (e.g. `inbound.nexa.mk`), re-point this one **To**
  value per site; nothing else changes.
- Allowlisted sender domains live in `server/config/resendInboundConfig.js`
  (`DEFAULT_SENDERS`) and `server/constants/inquiryEnums.js` (`INQUIRY_SOURCES`). If a site
  sends from a domain not in those lists, add it there (and redeploy) or it's dropped as
  `skipped_sender`.
</content>
</invoke>
