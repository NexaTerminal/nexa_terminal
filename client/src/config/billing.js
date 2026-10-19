/**
 * Billing / subscription UI master switch.
 *
 * Nexa is currently free for everyone (Basic is free-forever; Pro is seeded
 * free and will be charged "later") and pricing is not finalised. Until it is,
 * we hide every subscription / trial / expiry / invoice surface so users are
 * not nagged about payments that don't exist yet.
 *
 * This is a UI-ONLY hide — the backend (subscription model, invoices,
 * subscriptionGuard, admin tools, Pro-invoice admin) is left fully intact.
 * Flip this to `true` to bring the whole billing UX back in one place:
 *   - SubscriptionStatusBanner (the "Претплатата истекува…" strip)
 *   - Header profile dropdown + mobile "Сметководство" link
 *   - UserSubscription plan/status/expiry/activation/promo sections
 *
 * Note: this does NOT gate the account/password form or the profile — those
 * always stay reachable.
 */
export const BILLING_UI_ENABLED = false;
