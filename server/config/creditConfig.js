// server/config/creditConfig.js

/**
 * Credit System Configuration
 *
 * This file contains all configuration settings for the Nexa Terminal credit system.
 * Adjust these values to customize credit allocation, costs, and referral bonuses.
 */

const creditConfig = {
  // ============ WEEKLY ALLOCATION SETTINGS ============

  /**
   * Number of credits each user receives per week
   * Default: 14 credits per week
   */
  WEEKLY_ALLOCATION: parseInt(process.env.CREDIT_WEEKLY_ALLOCATION) || 14,

  /**
   * Day of week for credit reset (ISO week standard)
   * 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
   * Default: Monday (1)
   */
  RESET_DAY: 1,

  /**
   * Hour of day for credit reset (24-hour format)
   * Default: 7 AM
   */
  RESET_HOUR: 7,

  /**
   * Minute of hour for credit reset
   * Default: 0 (on the hour)
   */
  RESET_MINUTE: 0,

  /**
   * Timezone for credit reset schedule
   * Default: Europe/Skopje (Macedonia timezone, UTC+1/UTC+2)
   */
  TIMEZONE: process.env.CREDIT_TIMEZONE || 'Europe/Skopje',

  // ============ CREDIT COSTS ============

  /**
   * Credit costs for different actions
   * Positive numbers represent credits consumed
   */
  CREDIT_COSTS: {
    DOCUMENT_GENERATION: 1,  // Cost per automated document generated
    AI_QUESTION: 1,          // Cost per AI chatbot question
    LHC_REPORT: 1,           // Cost per Legal Health Check report
    MHC_REPORT: 1,           // Cost per Marketing Health Check report
    CHC_REPORT: 1,           // Cost per Cyber Security Health Check report
  },

  // ============ REFERRAL SYSTEM ============

  /**
   * Referral bonus configuration
   */
  REFERRAL_CONFIG: {
    /**
     * Minimum number of active invites needed to earn bonus
     * Default: 3 active referrals = bonus
     */
    MIN_INVITES_FOR_BONUS: parseInt(process.env.REFERRAL_MIN_INVITES) || 3,

    /**
     * Number of bonus credits awarded when threshold is met
     * Default: 7 bonus credits
     */
    BONUS_CREDITS: parseInt(process.env.REFERRAL_BONUS_AMOUNT) || 7,

    /**
     * Whether referred users must be verified to count towards bonus
     * Default: true (only verified users count)
     */
    VERIFICATION_REQUIRED: process.env.REFERRAL_VERIFICATION_REQUIRED !== 'false',

    /**
     * Maximum number of referrals a user can make per week
     * Prevents spam/abuse
     * Default: 20 invites per week
     */
    MAX_INVITES_PER_WEEK: parseInt(process.env.REFERRAL_MAX_INVITES_PER_WEEK) || 20,

    /**
     * Bonus frequency - how often bonuses can be awarded
     * 'once' = one-time bonus when threshold met
     * 'weekly' = bonus awarded every week if threshold maintained
     * 'cumulative' = bonus for every N referrals (3, 6, 9, etc.)
     * Default: 'weekly'
     */
    BONUS_FREQUENCY: process.env.REFERRAL_BONUS_FREQUENCY || 'weekly',
  },

  // ============ ADVANCED FEATURES (Phase 2) ============

  /**
   * Feature flags for advanced credit functionality
   * Set to true to enable these features in future updates
   */
  FEATURES: {
    /**
     * Enable credit rollover - unused credits carry to next week
     * Default: false (use it or lose it)
     */
    ENABLE_ROLLOVER: process.env.CREDIT_ENABLE_ROLLOVER === 'true',

    /**
     * Maximum credits that can be accumulated with rollover
     * Default: 28 (2 weeks worth)
     */
    MAX_ROLLOVER: parseInt(process.env.CREDIT_MAX_ROLLOVER) || 28,

    /**
     * Enable credit transfers between users
     * Default: false
     */
    ENABLE_CREDIT_TRANSFER: process.env.CREDIT_ENABLE_TRANSFER === 'true',

    /**
     * Enable credit purchases (top-up)
     * Default: false
     */
    ENABLE_CREDIT_PURCHASE: process.env.CREDIT_ENABLE_PURCHASE === 'true',

    /**
     * Enable tiered pricing (different costs for different documents)
     * Default: false (all documents cost the same)
     */
    ENABLE_TIERED_PRICING: process.env.CREDIT_ENABLE_TIERED_PRICING === 'true',
  },

  // ============ NOTIFICATION SETTINGS ============

  /**
   * Credit threshold for low balance warning email
   * Default: 3 credits remaining
   */
  LOW_CREDIT_THRESHOLD: parseInt(process.env.CREDIT_LOW_THRESHOLD) || 3,

  /**
   * Send weekly summary email to users
   * Default: true
   */
  SEND_WEEKLY_SUMMARY: process.env.CREDIT_SEND_WEEKLY_SUMMARY !== 'false',

  /**
   * Send notification when all credits depleted
   * Default: true
   */
  SEND_DEPLETED_NOTIFICATION: process.env.CREDIT_SEND_DEPLETED_NOTIFICATION !== 'false',

  // ============ ADMIN SETTINGS ============

  /**
   * Maximum admin adjustment amount (absolute value)
   * Prevents accidental large adjustments
   * Default: 100 credits
   */
  MAX_ADMIN_ADJUSTMENT: parseInt(process.env.CREDIT_MAX_ADMIN_ADJUSTMENT) || 100,

  /**
   * Enable scheduler in production only
   * Set to 'true' in development to test scheduler locally
   * Default: false in dev, true in production
   */
  ENABLE_SCHEDULER: process.env.ENABLE_CREDIT_SCHEDULER === 'true' || process.env.NODE_ENV === 'production',

  // ============ UTILITY METHODS ============

  /**
   * Get credit cost for a specific action
   * @param {string} action - Action type (DOCUMENT_GENERATION, AI_QUESTION, LHC_REPORT)
   * @returns {number} Credit cost
   */
  getCreditCost(action) {
    return this.CREDIT_COSTS[action] || 1;
  },

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Whether feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.FEATURES[feature] || false;
  },

  /**
   * Get next reset date/time
   * @returns {Date} Next Monday at reset time
   */
  getNextResetDate() {
    const moment = require('moment-timezone');
    const now = moment.tz(this.TIMEZONE);
    let nextReset = now.clone().isoWeekday(this.RESET_DAY).hour(this.RESET_HOUR).minute(this.RESET_MINUTE).second(0);

    // If reset time has passed this week, get next week
    if (nextReset.isBefore(now)) {
      nextReset.add(1, 'week');
    }

    return nextReset.toDate();
  },

  /**
   * Check if it's time for weekly reset
   * @returns {boolean} Whether reset should occur now
   */
  shouldResetNow() {
    const moment = require('moment-timezone');
    const now = moment.tz(this.TIMEZONE);
    return now.isoWeekday() === this.RESET_DAY &&
           now.hour() === this.RESET_HOUR &&
           now.minute() >= this.RESET_MINUTE &&
           now.minute() < this.RESET_MINUTE + 5; // 5-minute window
  },
};

// Validate configuration on load
function validateConfig() {
  const errors = [];

  if (creditConfig.WEEKLY_ALLOCATION < 1) {
    errors.push('WEEKLY_ALLOCATION must be at least 1');
  }

  if (creditConfig.RESET_DAY < 0 || creditConfig.RESET_DAY > 6) {
    errors.push('RESET_DAY must be between 0 (Sunday) and 6 (Saturday)');
  }

  if (creditConfig.RESET_HOUR < 0 || creditConfig.RESET_HOUR > 23) {
    errors.push('RESET_HOUR must be between 0 and 23');
  }

  if (creditConfig.REFERRAL_CONFIG.MIN_INVITES_FOR_BONUS < 1) {
    errors.push('MIN_INVITES_FOR_BONUS must be at least 1');
  }

  if (creditConfig.REFERRAL_CONFIG.BONUS_CREDITS < 1) {
    errors.push('BONUS_CREDITS must be at least 1');
  }

  if (errors.length > 0) {
    console.error('❌ Credit configuration validation errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    throw new Error('Invalid credit configuration');
  }

  console.log('✅ Credit configuration validated successfully');
}

// Validate on module load
validateConfig();

module.exports = creditConfig;
