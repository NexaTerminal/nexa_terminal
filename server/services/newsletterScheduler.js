// server/services/newsletterScheduler.js

const cron = require('node-cron');
const { ObjectId } = require('mongodb');

/**
 * NewsletterScheduler
 *
 * Manages scheduled tasks for the newsletter system:
 * - Checks every 5 minutes for campaigns scheduled to be sent
 * - Automatically sends scheduled campaigns when their time arrives
 * - Updates campaign status and analytics after sending
 */
class NewsletterScheduler {
  constructor(database, emailService) {
    this.db = database;
    this.emailService = emailService;
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Start the newsletter scheduler
   * Runs every 5 minutes to check for scheduled campaigns
   */
  start() {
    console.log('[NewsletterScheduler] Starting newsletter scheduler...');

    // Run every 5 minutes
    // Cron format: minute hour day-of-month month day-of-week
    // */5 * * * * = Every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkScheduledCampaigns();
    }, {
      scheduled: true,
      timezone: 'Europe/Skopje'
    });

    this.isRunning = true;
    console.log('[NewsletterScheduler] ⏰ Scheduler started - checking every 5 minutes');
  }

  /**
   * Check for campaigns that should be sent now
   */
  async checkScheduledCampaigns() {
    const now = new Date();
    console.log(`[NewsletterScheduler] Checking for scheduled campaigns at ${now.toISOString()}`);

    try {
      // Find all campaigns scheduled for now or earlier that haven't been sent yet
      const campaigns = await this.db.collection('newsletter_campaigns').find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).toArray();

      if (campaigns.length === 0) {
        console.log('[NewsletterScheduler] No campaigns ready to send');
        return;
      }

      console.log(`[NewsletterScheduler] Found ${campaigns.length} campaign(s) to send`);

      // Send each campaign
      for (const campaign of campaigns) {
        await this.sendScheduledCampaign(campaign);
      }

    } catch (error) {
      console.error('[NewsletterScheduler] ❌ Error checking scheduled campaigns:', error);
    }
  }

  /**
   * Send a scheduled campaign
   * @param {Object} campaign - Campaign document from database
   */
  async sendScheduledCampaign(campaign) {
    console.log(`[NewsletterScheduler] Sending campaign: ${campaign.name} (ID: ${campaign._id})`);

    try {
      // Update status to 'sending'
      await this.db.collection('newsletter_campaigns').updateOne(
        { _id: campaign._id },
        {
          $set: {
            status: 'sending',
            updatedAt: new Date()
          }
        }
      );

      // Fetch active subscribers
      const subscribers = await this.db.collection('newsletter_subscribers')
        .find({ status: 'active' })
        .toArray();

      if (subscribers.length === 0) {
        console.log(`[NewsletterScheduler] ⚠️ No active subscribers found for campaign ${campaign._id}`);

        await this.db.collection('newsletter_campaigns').updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: 'failed',
              sentAt: new Date(),
              updatedAt: new Date(),
              error: 'Нема активни претплатници'
            }
          }
        );
        return;
      }

      // Fetch blogs for this campaign
      const blogs = await this.emailService.fetchBlogsForNewsletter(
        campaign.selectedBlogIds.map(id => new ObjectId(id))
      );

      if (blogs.length === 0) {
        console.log(`[NewsletterScheduler] ⚠️ No blogs found for campaign ${campaign._id}`);

        await this.db.collection('newsletter_campaigns').updateOne(
          { _id: campaign._id },
          {
            $set: {
              status: 'failed',
              sentAt: new Date(),
              updatedAt: new Date(),
              error: 'Не се пронајдени блогови'
            }
          }
        );
        return;
      }

      // Send newsletter batch
      console.log(`[NewsletterScheduler] Sending to ${subscribers.length} subscriber(s)...`);
      const result = await this.emailService.sendNewsletterBatch(campaign, blogs, subscribers);

      // Update campaign status to 'sent'
      const sentAt = new Date();
      await this.db.collection('newsletter_campaigns').updateOne(
        { _id: campaign._id },
        {
          $set: {
            status: 'sent',
            sentAt: sentAt,
            recipientCount: result.sent,
            updatedAt: sentAt,
            'analytics.totalSent': result.sent
          }
        }
      );

      console.log('[NewsletterScheduler] ✅ Campaign sent successfully:', {
        campaignId: campaign._id.toString(),
        campaignName: campaign.name,
        sent: result.sent,
        failed: result.failed,
        timestamp: sentAt.toISOString()
      });

      if (result.failed > 0) {
        console.warn(`[NewsletterScheduler] ⚠️ ${result.failed} email(s) failed to send`);
      }

    } catch (error) {
      console.error(`[NewsletterScheduler] ❌ Failed to send campaign ${campaign._id}:`, error);

      // Update campaign status to 'failed'
      await this.db.collection('newsletter_campaigns').updateOne(
        { _id: campaign._id },
        {
          $set: {
            status: 'failed',
            sentAt: new Date(),
            updatedAt: new Date(),
            error: error.message
          }
        }
      ).catch(err => {
        console.error('[NewsletterScheduler] Failed to update campaign status:', err);
      });
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      console.log('[NewsletterScheduler] Stopping scheduler...');
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('[NewsletterScheduler] Scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      timezone: 'Europe/Skopje',
      checkInterval: 'Every 5 minutes',
      nextCheck: this.cronJob ? 'Within 5 minutes' : 'Not scheduled'
    };
  }

  /**
   * Manually trigger campaign check (for testing)
   * @returns {Promise<void>}
   */
  async manualCheck() {
    console.log('[NewsletterScheduler] Manual check triggered');
    await this.checkScheduledCampaigns();
  }
}

module.exports = NewsletterScheduler;
