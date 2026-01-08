// server/services/referralService.js

const { ObjectId } = require('mongodb');
const creditConfig = require('../config/creditConfig');

/**
 * ReferralService
 *
 * Handles referral code generation, invitation tracking, and bonus credit awards.
 * Users earn bonus credits when they successfully refer new verified users.
 */
class ReferralService {
  constructor(db, userService, creditService) {
    this.db = db;
    this.userService = userService;
    this.creditService = creditService;
    this.usersCollection = db.collection('users');
  }

  // ============ REFERRAL CODE MANAGEMENT ============

  /**
   * Generate a unique referral code for a user
   * Format: NX-USERNAME-XXXX (e.g., NX-MARTIN-A4B2)
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<string>} Generated referral code
   */
  async generateUniqueCode(userId) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const username = user.username.toUpperCase().slice(0, 8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const code = `NX-${username}-${random}`;

    // Ensure uniqueness
    const existing = await this.userService.findByReferralCode(code);
    if (existing) {
      // Recursively generate new code if collision
      return this.generateUniqueCode(userId);
    }

    return code;
  }

  /**
   * Create or get referral code for user
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<string>} Referral code
   */
  async createReferralCode(userId) {
    const user = await this.userService.findById(userId);

    if (user.referralCode) {
      return user.referralCode;
    }

    const code = await this.generateUniqueCode(userId);

    await this.usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          referralCode: code,
          updatedAt: new Date()
        }
      }
    );

    return code;
  }

  // ============ INVITATION TRACKING ============

  /**
   * Process a new invitation (when user uses referral link to register)
   * @param {string} referralCode - Referrer's code
   * @param {string} newUserEmail - Email of person being invited
   * @returns {Promise<Object>} Referrer user object
   */
  async processInvitation(referralCode, newUserEmail) {
    const referrer = await this.userService.findByReferralCode(referralCode);

    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    // Check if email already referred
    const existingReferral = referrer.referrals?.find(r => r.email === newUserEmail);
    if (existingReferral) {
      return referrer; // Already tracked
    }

    // Check weekly invite limit
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const recentInvites = referrer.referrals?.filter(
      r => new Date(r.invitedAt) >= weekStart
    ).length || 0;

    if (recentInvites >= creditConfig.REFERRAL_CONFIG.MAX_INVITES_PER_WEEK) {
      throw new Error('Weekly referral limit reached');
    }

    // Add to referrals list
    await this.usersCollection.updateOne(
      { _id: referrer._id },
      {
        $push: {
          referrals: {
            email: newUserEmail,
            status: 'pending',
            invitedAt: new Date()
          }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    return referrer;
  }

  /**
   * Activate a referral when new user verifies their account
   * @param {ObjectId|string} newUserId - New user's ID
   * @returns {Promise<boolean>} Success status
   */
  async activateReferral(newUserId) {
    const newUser = await this.userService.findById(newUserId);

    if (!newUser || !newUser.referredBy) {
      return false; // No referral to activate
    }

    const referralCode = newUser.referredBy;

    // Update referral status to active
    const result = await this.usersCollection.updateOne(
      {
        referralCode: referralCode,
        'referrals.email': newUser.email
      },
      {
        $set: {
          'referrals.$.status': 'active',
          'referrals.$.activatedAt': new Date(),
          'referrals.$.userId': new ObjectId(newUserId),
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      // Check if referrer now qualifies for bonus
      await this.checkAndAwardBonus(referralCode);
      return true;
    }

    return false;
  }

  // ============ BONUS CREDIT SYSTEM ============

  /**
   * Check if user qualifies for referral bonus and award it
   * @param {string} referralCode - Referrer's code
   * @returns {Promise<Object|null>} Bonus award result or null
   */
  async checkAndAwardBonus(referralCode) {
    const referrer = await this.userService.findByReferralCode(referralCode);

    if (!referrer) {
      return null;
    }

    const activeReferrals = referrer.referrals?.filter(
      r => r.status === 'active'
    ) || [];

    const minInvites = creditConfig.REFERRAL_CONFIG.MIN_INVITES_FOR_BONUS;
    const bonusAmount = creditConfig.REFERRAL_CONFIG.BONUS_CREDITS;
    const bonusFrequency = creditConfig.REFERRAL_CONFIG.BONUS_FREQUENCY;

    // Check if user qualifies
    if (activeReferrals.length < minInvites) {
      return null; // Not enough referrals yet
    }

    // Award bonus based on frequency setting
    let shouldAward = false;

    if (bonusFrequency === 'once') {
      // One-time bonus when first reaching threshold
      const hasReceivedBonus = await this._hasReceivedReferralBonus(referrer._id);
      shouldAward = !hasReceivedBonus;

    } else if (bonusFrequency === 'cumulative') {
      // Bonus for every N referrals (3, 6, 9, etc.)
      shouldAward = activeReferrals.length % minInvites === 0;

    } else if (bonusFrequency === 'weekly') {
      // Bonus every week if threshold maintained
      shouldAward = activeReferrals.length >= minInvites;
    }

    if (shouldAward) {
      const result = await this.creditService.addCredits(
        referrer._id,
        bonusAmount,
        'REFERRAL_BONUS',
        {
          referralCount: activeReferrals.length,
          bonusType: bonusFrequency
        }
      );

      // Send congratulations email
      this._sendReferralBonusEmail(referrer, bonusAmount, activeReferrals.length)
        .catch(err => console.error('Failed to send referral bonus email:', err));

      return result;
    }

    return null;
  }

  /**
   * Process all referral bonuses (weekly scheduled job)
   * @returns {Promise<Object>} Processing summary
   */
  async processAllReferralBonuses() {
    console.log('[ReferralService] Processing weekly referral bonuses...');

    const bonusFrequency = creditConfig.REFERRAL_CONFIG.BONUS_FREQUENCY;

    if (bonusFrequency !== 'weekly') {
      console.log('[ReferralService] Weekly bonuses not enabled, skipping');
      return { bonusesAwarded: 0, message: 'Weekly bonuses disabled' };
    }

    const minInvites = creditConfig.REFERRAL_CONFIG.MIN_INVITES_FOR_BONUS;

    // Find all users with enough active referrals
    const eligibleUsers = await this.usersCollection.find({
      referralCode: { $exists: true, $ne: null }
    }).toArray();

    let bonusesAwarded = 0;
    const errors = [];

    for (const user of eligibleUsers) {
      try {
        const activeReferrals = user.referrals?.filter(r => r.status === 'active') || [];

        if (activeReferrals.length >= minInvites) {
          const result = await this.checkAndAwardBonus(user.referralCode);
          if (result) {
            bonusesAwarded++;
          }
        }
      } catch (error) {
        errors.push({
          userId: user._id,
          username: user.username,
          error: error.message
        });
        console.error(`Failed to award bonus for ${user.username}:`, error);
      }
    }

    const summary = {
      timestamp: new Date(),
      bonusesAwarded,
      errors
    };

    console.log('[ReferralService] Weekly bonus processing complete:', summary);
    return summary;
  }

  // ============ REFERRAL STATISTICS ============

  /**
   * Get referral statistics for a user
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<Object>} Referral stats
   */
  async getReferralStats(userId) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate referral code if doesn't exist
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = await this.createReferralCode(userId);
    }

    const referrals = user.referrals || [];
    const activeReferrals = referrals.filter(r => r.status === 'active');
    const pendingReferrals = referrals.filter(r => r.status === 'pending');

    const minInvites = creditConfig.REFERRAL_CONFIG.MIN_INVITES_FOR_BONUS;
    const bonusAmount = creditConfig.REFERRAL_CONFIG.BONUS_CREDITS;

    return {
      referralCode,
      totalInvites: referrals.length,
      activeInvites: activeReferrals.length,
      pendingInvites: pendingReferrals.length,
      nextBonusIn: Math.max(0, minInvites - activeReferrals.length),
      bonusAmount,
      minInvitesForBonus: minInvites,
      lifetimeBonusEarned: await this._calculateLifetimeBonus(userId),
      recentReferrals: referrals
        .sort((a, b) => new Date(b.invitedAt) - new Date(a.invitedAt))
        .slice(0, 5) // Last 5 referrals
    };
  }

  /**
   * Send invitation emails - SIMPLIFIED VERSION
   * Awards credits immediately for valid new invitations
   * @param {ObjectId|string} userId - Referrer user ID
   * @param {Array<string>} emails - Email addresses to invite
   * @returns {Promise<Object>} Send results with credits earned
   */
  async sendInvitations(userId, emails) {
    console.log('\n🎯 [ReferralService] sendInvitations called (SIMPLIFIED)');
    console.log('👤 [ReferralService] User ID:', userId);
    console.log('📧 [ReferralService] Emails to send:', emails);

    const user = await this.userService.findById(userId);
    console.log('👤 [ReferralService] User found:', user?.username || user?.email);

    if (!user) {
      console.error('❌ [ReferralService] User not found');
      throw new Error('User not found');
    }

    // Ensure user has referral code
    let referralCode = user.referralCode;
    console.log('🔑 [ReferralService] Existing referral code:', referralCode);

    if (!referralCode) {
      console.log('🆕 [ReferralService] Creating new referral code...');
      referralCode = await this.createReferralCode(userId);
      console.log('✅ [ReferralService] Referral code created:', referralCode);
    }

    const emailService = require('./emailService');
    const results = {
      sent: [],
      failed: [],
      alreadyUsers: [],
      alreadyInvited: [],
      creditsEarned: 0
    };

    console.log('📨 [ReferralService] Starting to process emails...');

    for (const email of emails) {
      try {
        console.log(`\n📧 [ReferralService] Processing email: ${email}`);

        // Check if email is already a registered user
        const existingUser = await this.usersCollection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          console.log(`⚠️ [ReferralService] Email ${email} is already a registered user`);
          results.alreadyUsers.push(email);
          continue;
        }

        // Check if this email has been invited before (by anyone)
        const alreadyInvited = await this.usersCollection.findOne({
          'referrals.email': email.toLowerCase()
        });

        if (alreadyInvited) {
          console.log(`⚠️ [ReferralService] Email ${email} has already been invited`);
          results.alreadyInvited.push(email);
          continue;
        }

        // Track invitation
        console.log('📝 [ReferralService] Tracking invitation...');
        await this.processInvitation(referralCode, email);
        console.log('✅ [ReferralService] Invitation tracked');

        // Award 1 credit immediately for this valid invitation
        console.log('💰 [ReferralService] Awarding 1 credit for valid invitation...');
        await this.creditService.addCredits(
          user._id,
          1,
          'INSTANT_REFERRAL_CREDIT',
          { invitedEmail: email.toLowerCase() }
        );
        results.creditsEarned++;
        console.log('✅ [ReferralService] Credit awarded');

        // Send email
        console.log('📮 [ReferralService] Sending email via emailService...');
        await emailService.sendInvitationEmail(email, user, referralCode);
        console.log(`✅ [ReferralService] Email sent successfully to ${email}`);

        results.sent.push(email);
      } catch (error) {
        console.error(`❌ [ReferralService] Failed to process invitation for ${email}:`, error);
        results.failed.push({
          email,
          error: error.message
        });
      }
    }

    console.log('\n📊 [ReferralService] Final results:');
    console.log('   ✅ Sent:', results.sent.length);
    console.log('   ⏭️  Already users:', results.alreadyUsers.length);
    console.log('   🔄 Already invited:', results.alreadyInvited.length);
    console.log('   ❌ Failed:', results.failed.length);
    console.log('   💰 Credits earned:', results.creditsEarned);

    return results;
  }

  // ============ PRIVATE HELPER METHODS ============

  /**
   * Check if user has already received a referral bonus
   * @private
   */
  async _hasReceivedReferralBonus(userId) {
    const transactions = await this.db.collection('credit_transactions')
      .findOne({
        userId: new ObjectId(userId),
        type: 'REFERRAL_BONUS'
      });

    return !!transactions;
  }

  /**
   * Calculate total bonus credits earned from referrals
   * @private
   */
  async _calculateLifetimeBonus(userId) {
    const pipeline = [
      {
        $match: {
          userId: new ObjectId(userId),
          type: 'REFERRAL_BONUS'
        }
      },
      {
        $group: {
          _id: null,
          totalBonus: { $sum: '$amount' }
        }
      }
    ];

    const result = await this.db.collection('credit_transactions')
      .aggregate(pipeline)
      .toArray();

    return result[0]?.totalBonus || 0;
  }

  /**
   * Send referral bonus email notification
   * @private
   */
  async _sendReferralBonusEmail(user, bonusAmount, activeReferrals) {
    const emailService = require('./emailService');

    if (emailService && emailService.sendReferralBonusEmail) {
      await emailService.sendReferralBonusEmail(user, bonusAmount, activeReferrals);
    }
  }
}

module.exports = ReferralService;
