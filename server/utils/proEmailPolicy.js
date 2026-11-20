'use strict';

/**
 * Pro email policy (user rule, Oct 2026): Pro members get ONE automatic email —
 * the Monday lead digest (leadDigestService). Every other event email to a Pro
 * (client message, conversation closed, lead assigned/offered) is OFF; they still
 * get the in-app bell / socket event. Set PRO_CHAT_EMAILS=on to restore those.
 * A new invite on the board never emails anyone, whatever this flag says: Pros
 * see waiting invites when they log in.
 */
const proEventEmailsEnabled = () => process.env.PRO_CHAT_EMAILS === 'on';

module.exports = { proEventEmailsEnabled };
