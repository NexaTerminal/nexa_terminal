'use strict';

/**
 * Pro email policy (user rule, Oct 2026): Pro members get ONE automatic email —
 * the Monday lead digest (leadDigestService). Every other event email to a Pro
 * (new conversation on the board, client message, conversation closed, lead
 * assigned/offered) is OFF; they still get the in-app bell / socket event.
 * Set PRO_CHAT_EMAILS=on to restore the event emails.
 */
const proEventEmailsEnabled = () => process.env.PRO_CHAT_EMAILS === 'on';

module.exports = { proEventEmailsEnabled };
