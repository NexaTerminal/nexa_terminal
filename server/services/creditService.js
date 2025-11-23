// server/services/creditService.js

const { ObjectId } = require('mongodb');
const creditConfig = require('../config/creditConfig');
const moment = require('moment-timezone');

/**
 * CreditService
 *
 * Handles all credit-related operations for the Nexa Terminal credit system.
 * This includes checking balances, deducting credits, adding credits, handling refunds,
 * managing weekly resets, and tracking credit transactions.
 */
class CreditService {
  constructor(db, userService) {
    this.db = db;
    this.userService = userService;
    this.transactionsCollection = db.collection('credit_transactions');
    this.usersCollection = db.collection('users');
  }

  // ============ CORE CREDIT OPERATIONS ============

  /**
   * Get user's current credit balance
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<Object>} Credit information
   */
  async getUserCredits(userId) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize credits if not present (for existing users)
    if (!user.credits) {
      await this._initializeUserCredits(userId);
      const updatedUser = await this.userService.findById(userId);
      return updatedUser.credits;
    }

    return {
      balance: user.credits.balance || 0,
      weeklyAllocation: user.credits.weeklyAllocation || creditConfig.WEEKLY_ALLOCATION,
      lastResetDate: user.credits.lastResetDate,
      lifetimeEarned: user.credits.lifetimeEarned || 0,
      lifetimeSpent: user.credits.lifetimeSpent || 0,
      nextResetDate: creditConfig.getNextResetDate()
    };
  }

  /**
   * Check if user has sufficient credits
   * @param {ObjectId|string} userId - User ID
   * @param {number} requiredAmount - Credits needed
   * @returns {Promise<boolean>} Whether user has enough credits
   */
  async checkBalance(userId, requiredAmount = 1) {
    const credits = await this.getUserCredits(userId);
    return credits.balance >= requiredAmount;
  }

  /**
   * Deduct credits from user account (atomic operation)
   * @param {ObjectId|string} userId - User ID
   * @param {number} amount - Credits to deduct (positive number)
   * @param {string} type - Transaction type
   * @param {Object} metadata - Additional transaction metadata
   * @returns {Promise<Object>} Transaction record
   */
  async deductCredits(userId, amount, type, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Deduction amount must be positive');
    }
    
    console.log(`[CreditService] Attempting to deduct ${amount} credits for user ${userId}`);

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = user.credits?.balance || 0;

    // Check sufficient balance
    if (currentBalance < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${currentBalance}`);
    }

    const newBalance = currentBalance - amount;
    const newLifetimeSpent = (user.credits?.lifetimeSpent || 0) + amount;

    // --- Start Enhanced Debugging ---
    const findQuery = {
      _id: new ObjectId(userId),
      'credits.balance': { $gte: amount }
    };

    const updateQuery = {
      $inc: {
        'credits.balance': -amount,
        'credits.lifetimeSpent': amount
      },
      $set: {
        updatedAt: new Date()
      }
    };

    console.log('[CreditService] Executing findOneAndUpdate with:', {
      findQuery: JSON.stringify(findQuery),
      updateQuery: JSON.stringify(updateQuery)
    });
    // --- End Enhanced Debugging ---

    // Atomic update using MongoDB's $inc
    const result = await this.usersCollection.findOneAndUpdate(
      findQuery,
      updateQuery,
      { returnDocument: 'after' }
    );

    // --- More Debugging ---
    console.log('[CreditService] Raw result from findOneAndUpdate:', JSON.stringify(result, null, 2));

    if (!result || !result.value) {
      console.error('[CreditService] Credit deduction failed. User might have insufficient balance or the document was modified concurrently. Result value is null or undefined.');
      throw new Error('Credit deduction failed - insufficient balance or concurrent modification');
    }
    
    console.log(`[CreditService] Successfully updated balance in DB. New balance: ${result.value.credits.balance}`);
    // --- End Debugging ---

    // Record transaction
    const transaction = await this._recordTransaction({
      userId: new ObjectId(userId),
      type,
      amount: -amount, // Negative for debit
      balanceBefore: currentBalance,
      balanceAfter: result.value.credits.balance, // Use the confirmed new balance
      metadata,
      createdAt: new Date()
    });

    // Check for low balance and send alert
    if (result.value.credits.balance === 0) {
      // Trigger depleted email (async, don't wait)
      this._triggerDepletedEmail(user).catch(err =>
        console.error('Failed to send depleted email:', err)
      );
    } else if (result.value.credits.balance <= creditConfig.LOW_CREDIT_THRESHOLD) {
      // Trigger low credit email (async, don't wait)
      this._triggerLowCreditEmail(user).catch(err =>
        console.error('Failed to send low credit email:', err)
      );
    }

    return {
      success: true,
      transaction,
      newBalance: result.value.credits.balance,
      remainingCredits: result.value.credits.balance
    };
  }

  /**
   * Add credits to user account
   * @param {ObjectId|string} userId - User ID
   * @param {number} amount - Credits to add (positive number)
   * @param {string} type - Transaction type
   * @param {Object} metadata - Additional transaction metadata
   * @returns {Promise<Object>} Transaction record
   */
  async addCredits(userId, amount, type, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Addition amount must be positive');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = user.credits?.balance || 0;
    const newBalance = currentBalance + amount;
    const newLifetimeEarned = (user.credits?.lifetimeEarned || 0) + amount;

    // Update user credits
    await this.usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: {
          'credits.balance': amount,
          'credits.lifetimeEarned': amount
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Record transaction
    const transaction = await this._recordTransaction({
      userId: new ObjectId(userId),
      type,
      amount: amount, // Positive for credit
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      metadata,
      createdAt: new Date()
    });

    return {
      success: true,
      transaction,
      newBalance,
      addedCredits: amount
    };
  }

  /**
   * Refund credits for failed operations
   * @param {ObjectId|string} userId - User ID
   * @param {ObjectId|string} originalTransactionId - Original transaction to refund
   * @param {string} failureReason - Reason for refund
   * @returns {Promise<Object>} Refund transaction record
   */
  async refundCredits(userId, originalTransactionId, failureReason = 'Operation failed') {
    const originalTransaction = await this.transactionsCollection.findOne({
      _id: new ObjectId(originalTransactionId)
    });

    if (!originalTransaction) {
      throw new Error('Original transaction not found');
    }

    if (originalTransaction.amount >= 0) {
      throw new Error('Can only refund debit transactions');
    }

    // Refund the absolute amount
    const refundAmount = Math.abs(originalTransaction.amount);

    return await this.addCredits(
      userId,
      refundAmount,
      'REFUND',
      {
        originalTransactionId: originalTransactionId,
        originalType: originalTransaction.type,
        failureReason
      }
    );
  }

  // ============ WEEKLY RESET OPERATIONS ============

  /**
   * Reset credits for a single user
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async resetWeeklyCredits(userId) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = user.credits?.balance || 0;
    const weeklyAllocation = user.credits?.weeklyAllocation || creditConfig.WEEKLY_ALLOCATION;

    // Update credits
    await this.usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'credits.balance': weeklyAllocation,
          'credits.lastResetDate': new Date(),
          updatedAt: new Date()
        },
        $inc: {
          'credits.lifetimeEarned': weeklyAllocation
        }
      }
    );

    // Record transaction
    await this._recordTransaction({
      userId: new ObjectId(userId),
      type: 'WEEKLY_RESET',
      amount: weeklyAllocation,
      balanceBefore: currentBalance,
      balanceAfter: weeklyAllocation,
      metadata: {
        previousBalance: currentBalance,
        resetDate: new Date()
      },
      createdAt: new Date()
    });

    return true;
  }

  /**
   * Reset credits for all users (weekly scheduled job)
   * @returns {Promise<Object>} Reset summary
   */
  async resetAllUserCredits() {
    console.log('[CreditService] Starting weekly credit reset for all users...');

    const users = await this.userService.getAllUsersForCreditReset();
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        await this.resetWeeklyCredits(user._id);
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({
          userId: user._id,
          username: user.username,
          error: error.message
        });
        console.error(`Failed to reset credits for user ${user.username}:`, error);
      }
    }

    const summary = {
      timestamp: new Date(),
      totalUsers: users.length,
      usersReset: successCount,
      failures: failCount,
      errors: errors
    };

    console.log('[CreditService] Weekly reset complete:', summary);
    return summary;
  }

  /**
   * Check and perform missed resets (run on server startup)
   * @returns {Promise<number>} Number of users reset
   */
  async checkAndPerformMissedResets() {
    const lastMonday = moment().tz(creditConfig.TIMEZONE)
      .startOf('isoWeek'); // Start of current week (Monday 00:00)

    const users = await this.usersCollection.find({
      $or: [
        { 'credits.lastResetDate': { $lt: lastMonday.toDate() } },
        { 'credits.lastResetDate': null },
        { credits: { $exists: false } }
      ]
    }).toArray();

    console.log(`[CreditService] Found ${users.length} users needing credit reset`);

    for (const user of users) {
      try {
        if (!user.credits) {
          await this._initializeUserCredits(user._id);
        } else {
          await this.resetWeeklyCredits(user._id);
        }
      } catch (error) {
        console.error(`Failed to reset credits for user ${user.username}:`, error);
      }
    }

    return users.length;
  }

  // ============ TRANSACTION HISTORY ============

  /**
   * Get user's transaction history
   * @param {ObjectId|string} userId - User ID
   * @param {Object} options - Query options (limit, offset, type)
   * @returns {Promise<Array>} Transaction records
   */
  async getTransactionHistory(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      type = null,
      startDate = null,
      endDate = null
    } = options;

    const query = { userId: new ObjectId(userId) };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await this.transactionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await this.transactionsCollection.countDocuments(query);

    return {
      transactions,
      total,
      limit,
      offset
    };
  }

  /**
   * Get weekly usage statistics for user
   * @param {ObjectId|string} userId - User ID
   * @returns {Promise<Object>} Usage stats
   */
  async getWeeklyUsageStats(userId) {
    const startOfWeek = moment().tz(creditConfig.TIMEZONE).startOf('isoWeek').toDate();

    const transactions = await this.transactionsCollection
      .find({
        userId: new ObjectId(userId),
        createdAt: { $gte: startOfWeek },
        amount: { $lt: 0 } // Only debits
      })
      .toArray();

    const stats = {
      totalSpent: 0,
      documentGeneration: 0,
      aiQuestions: 0,
      lhcReports: 0,
      byDay: {},
      transactions: transactions.length
    };

    transactions.forEach(tx => {
      stats.totalSpent += Math.abs(tx.amount);

      if (tx.type === 'DOCUMENT_GENERATION') stats.documentGeneration++;
      if (tx.type === 'AI_QUESTION') stats.aiQuestions++;
      if (tx.type === 'LHC_REPORT') stats.lhcReports++;

      // Group by day
      const day = moment(tx.createdAt).format('YYYY-MM-DD');
      stats.byDay[day] = (stats.byDay[day] || 0) + Math.abs(tx.amount);
    });

    const credits = await this.getUserCredits(userId);
    stats.remainingCredits = credits.balance;
    stats.weeklyAllocation = credits.weeklyAllocation;

    return stats;
  }

  // ============ ADMIN OPERATIONS ============

  /**
   * Manually adjust user credits (admin only)
   * @param {ObjectId|string} userId - User ID
   * @param {number} amount - Credits to add (positive) or remove (negative)
   * @param {ObjectId|string} adminId - Admin user ID
   * @param {string} reason - Reason for adjustment
   * @returns {Promise<Object>} Transaction record
   */
  async adjustCredits(userId, amount, adminId, reason) {
    if (Math.abs(amount) > creditConfig.MAX_ADMIN_ADJUSTMENT) {
      throw new Error(`Adjustment amount exceeds maximum allowed (${creditConfig.MAX_ADMIN_ADJUSTMENT})`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for admin adjustments');
    }

    if (amount > 0) {
      return await this.addCredits(userId, amount, 'ADMIN_ADJUSTMENT', {
        adminNote: reason,
        adminId: new ObjectId(adminId)
      });
    } else {
      return await this.deductCredits(userId, Math.abs(amount), 'ADMIN_ADJUSTMENT', {
        adminNote: reason,
        adminId: new ObjectId(adminId)
      });
    }
  }

  /**
   * Get all users' credit information (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User credit information
   */
  async getAllUserCredits(options = {}) {
    const { page = 1, limit = 50, sortBy = 'balance' } = options;
    const skip = (page - 1) * limit;

    const sortOptions = {};
    if (sortBy === 'balance') sortOptions['credits.balance'] = 1;
    if (sortBy === 'username') sortOptions.username = 1;
    if (sortBy === 'spent') sortOptions['credits.lifetimeSpent'] = -1;

    const users = await this.usersCollection
      .find({})
      .project({
        username: 1,
        email: 1,
        credits: 1,
        createdAt: 1
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await this.usersCollection.countDocuments({});

    return {
      users,
      total,
      page,
      limit
    };
  }

  /**
   * Get system-wide credit statistics (admin only)
   * @returns {Promise<Object>} System statistics
   */
  async getSystemStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalCreditsInCirculation: { $sum: '$credits.balance' },
          avgBalance: { $avg: '$credits.balance' },
          totalLifetimeEarned: { $sum: '$credits.lifetimeEarned' },
          totalLifetimeSpent: { $sum: '$credits.lifetimeSpent' }
        }
      }
    ];

    const stats = await this.usersCollection.aggregate(pipeline).toArray();

    const weeklyTransactions = await this.transactionsCollection.countDocuments({
      createdAt: {
        $gte: moment().tz(creditConfig.TIMEZONE).startOf('isoWeek').toDate()
      }
    });

    return {
      ...stats[0],
      weeklyTransactions,
      timestamp: new Date()
    };
  }

  // ============ PRIVATE HELPER METHODS ============

  /**
   * Initialize credits for existing user (migration helper)
   * @private
   */
  async _initializeUserCredits(userId) {
    await this.usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          credits: {
            balance: creditConfig.WEEKLY_ALLOCATION,
            weeklyAllocation: creditConfig.WEEKLY_ALLOCATION,
            lastResetDate: new Date(),
            lifetimeEarned: creditConfig.WEEKLY_ALLOCATION,
            lifetimeSpent: 0
          },
          updatedAt: new Date()
        }
      }
    );

    // Record initial credit transaction
    await this._recordTransaction({
      userId: new ObjectId(userId),
      type: 'INITIAL_CREDIT',
      amount: creditConfig.WEEKLY_ALLOCATION,
      balanceBefore: 0,
      balanceAfter: creditConfig.WEEKLY_ALLOCATION,
      metadata: { reason: 'Initial credit allocation' },
      createdAt: new Date()
    });
  }

  /**
   * Record a credit transaction
   * @private
   */
  async _recordTransaction(transactionData) {
    const result = await this.transactionsCollection.insertOne(transactionData);
    return { ...transactionData, _id: result.insertedId };
  }

  /**
   * Trigger low credit email notification
   * @private
   */
  async _triggerLowCreditEmail(user) {
    // Import email service dynamically to avoid circular dependencies
    const emailService = require('./emailService');
    if (emailService && emailService.sendLowCreditAlert) {
      await emailService.sendLowCreditAlert(user);
    }
  }

  /**
   * Trigger depleted credit email notification
   * @private
   */
  async _triggerDepletedEmail(user) {
    // Import email service dynamically to avoid circular dependencies
    const emailService = require('./emailService');
    if (emailService && emailService.sendCreditDepletedEmail) {
      await emailService.sendCreditDepletedEmail(user);
    }
  }
}

module.exports = CreditService;
