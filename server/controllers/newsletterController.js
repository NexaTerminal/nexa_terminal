const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const emailService = require('../services/emailService');

// Get database from global app
let db;
function setDatabase(database) {
  db = database;
}

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ======================
// SUBSCRIBER MANAGEMENT
// ======================

/**
 * Get paginated list of subscribers with filters
 * Query params: page, limit, search, status, sortBy, sortOrder
 */
async function getSubscribers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'subscribedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      query.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get subscribers
    const subscribers = await db.collection('newsletter_subscribers')
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Get total count
    const total = await db.collection('newsletter_subscribers').countDocuments(query);

    // Get stats
    const activeCount = await db.collection('newsletter_subscribers').countDocuments({ status: 'active' });
    const unsubscribedCount = await db.collection('newsletter_subscribers').countDocuments({ status: 'unsubscribed' });

    res.json({
      success: true,
      data: subscribers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        total,
        active: activeCount,
        unsubscribed: unsubscribedCount
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на претплатниците' });
  }
}

/**
 * Add single subscriber
 */
async function addSubscriber(req, res) {
  try {
    const { email, firstName, lastName } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Невалидна email адреса' });
    }

    // Check for duplicates
    const existing = await db.collection('newsletter_subscribers').findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Оваа email адреса веќе е регистрирана' });
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Create subscriber
    const subscriber = {
      email: email.toLowerCase(),
      firstName: firstName || '',
      lastName: lastName || '',
      status: 'active',
      source: 'manual',
      subscribedAt: new Date(),
      unsubscribedAt: null,
      unsubscribeToken,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('newsletter_subscribers').insertOne(subscriber);
    subscriber._id = result.insertedId;

    res.json({
      success: true,
      message: 'Претплатникот е успешно додаден',
      data: subscriber
    });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    res.status(500).json({ success: false, message: 'Грешка при додавање на претплатникот' });
  }
}

/**
 * Import subscribers from CSV
 */
async function importCsvSubscribers(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Не е прикачена CSV датотека' });
    }

    // Parse CSV
    const fileBuffer = req.file.buffer;
    const records = parse(fileBuffer, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      encoding: 'utf-8'
    });

    // Detect headers (check if first row contains "email")
    const hasHeaders = records[0] && records[0][0] && records[0][0].toLowerCase().includes('email');
    const dataRows = hasHeaders ? records.slice(1) : records;

    const importBatch = `import_${Date.now()}`;
    const results = {
      imported: 0,
      duplicates: 0,
      invalid: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const email = row[0]?.trim().toLowerCase();
      const firstName = row[1]?.trim() || '';
      const lastName = row[2]?.trim() || '';

      // Validate email
      if (!email || !isValidEmail(email)) {
        results.invalid++;
        results.errors.push({ email: email || 'N/A', error: 'Невалидна email адреса' });
        continue;
      }

      // Check for duplicates
      const existing = await db.collection('newsletter_subscribers').findOne({ email });
      if (existing) {
        results.duplicates++;
        results.errors.push({ email, error: 'Веќе постои' });
        continue;
      }

      // Generate unsubscribe token
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      // Create subscriber
      const subscriber = {
        email,
        firstName,
        lastName,
        status: 'active',
        source: 'csv_import',
        subscribedAt: new Date(),
        unsubscribedAt: null,
        unsubscribeToken,
        metadata: {
          importBatch
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        await db.collection('newsletter_subscribers').insertOne(subscriber);
        results.imported++;
      } catch (error) {
        results.errors.push({ email, error: 'Грешка при зачувување' });
      }
    }

    res.json({
      success: true,
      message: `Увезени: ${results.imported}, Дупликати: ${results.duplicates}, Невалидни: ${results.invalid}`,
      data: results
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ success: false, message: 'Грешка при увоз на CSV датотеката' });
  }
}

/**
 * Update subscriber
 */
async function updateSubscriber(req, res) {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, status } = req.body;

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Невалидна email адреса' });
    }

    // Build update object
    const updateFields = {
      updatedAt: new Date()
    };

    if (email) updateFields.email = email.toLowerCase();
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (status) updateFields.status = status;

    const result = await db.collection('newsletter_subscribers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Претплатникот не е пронајден' });
    }

    res.json({ success: true, message: 'Претплатникот е успешно ажуриран' });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({ success: false, message: 'Грешка при ажурирање на претплатникот' });
  }
}

/**
 * Delete subscriber
 */
async function deleteSubscriber(req, res) {
  try {
    const { id } = req.params;

    const result = await db.collection('newsletter_subscribers').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Претплатникот не е пронајден' });
    }

    res.json({ success: true, message: 'Претплатникот е успешно избришан' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ success: false, message: 'Грешка при бришење на претплатникот' });
  }
}

/**
 * Bulk delete subscribers
 */
async function bulkDeleteSubscribers(req, res) {
  try {
    const { subscriberIds } = req.body;

    if (!Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Не се избрани претплатници' });
    }

    const objectIds = subscriberIds.map(id => new ObjectId(id));
    const result = await db.collection('newsletter_subscribers').deleteMany({ _id: { $in: objectIds } });

    res.json({
      success: true,
      message: `Избришани ${result.deletedCount} претплатници`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting subscribers:', error);
    res.status(500).json({ success: false, message: 'Грешка при бришење на претплатниците' });
  }
}

/**
 * Export subscribers to CSV
 */
async function exportSubscribersCsv(req, res) {
  try {
    const subscribers = await db.collection('newsletter_subscribers')
      .find({ status: 'active' })
      .sort({ subscribedAt: -1 })
      .toArray();

    // Generate CSV
    let csv = 'Email,Име,Презиме,Статус,Извор,Датум\n';
    subscribers.forEach(sub => {
      const date = new Date(sub.subscribedAt).toLocaleDateString('mk-MK');
      csv += `${sub.email},"${sub.firstName}","${sub.lastName}",${sub.status},${sub.source},${date}\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pretplatnici_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'Грешка при експорт на CSV' });
  }
}

// ======================
// CAMPAIGN MANAGEMENT
// ======================

/**
 * Get paginated list of campaigns
 */
async function getCampaigns(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const campaigns = await db.collection('newsletter_campaigns')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection('newsletter_campaigns').countDocuments({});

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на кампањите' });
  }
}

/**
 * Get single campaign
 */
async function getCampaign(req, res) {
  try {
    const { id } = req.params;
    const campaign = await db.collection('newsletter_campaigns').findOne({ _id: new ObjectId(id) });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на кампањата' });
  }
}

/**
 * Create new campaign
 */
async function createCampaign(req, res) {
  try {
    const { name, subject, selectedBlogIds } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Името и насловот се задолжителни' });
    }

    // Fetch selected blogs
    const blogs = await emailService.fetchBlogsForNewsletter(selectedBlogIds || []);

    // Generate HTML content
    const htmlContent = await emailService.generateNewsletterHTML({
      name,
      subject,
      selectedBlogIds
    }, blogs, 'preview-token', 'preview-pixel');

    // Create campaign
    const campaign = {
      name,
      subject,
      htmlContent,
      selectedBlogIds: selectedBlogIds || [],
      recipientCount: 0,
      status: 'draft',
      scheduledFor: null,
      sentAt: null,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      analytics: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalUnsubscribed: 0,
        openRate: 0,
        clickRate: 0
      }
    };

    const result = await db.collection('newsletter_campaigns').insertOne(campaign);
    campaign._id = result.insertedId;

    res.json({
      success: true,
      message: 'Кампањата е успешно креирана',
      data: campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при креирање на кампањата' });
  }
}

/**
 * Update campaign
 */
async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const { name, subject, selectedBlogIds } = req.body;

    const updateFields = {
      updatedAt: new Date()
    };

    if (name) updateFields.name = name;
    if (subject) updateFields.subject = subject;
    if (selectedBlogIds) {
      updateFields.selectedBlogIds = selectedBlogIds;

      // Regenerate HTML if blogs changed
      const blogs = await emailService.fetchBlogsForNewsletter(selectedBlogIds);
      const campaign = await db.collection('newsletter_campaigns').findOne({ _id: new ObjectId(id) });
      updateFields.htmlContent = await emailService.generateNewsletterHTML(
        { ...campaign, selectedBlogIds },
        blogs,
        'preview-token',
        'preview-pixel'
      );
    }

    const result = await db.collection('newsletter_campaigns').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    res.json({ success: true, message: 'Кампањата е успешно ажурирана' });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при ажурирање на кампањата' });
  }
}

/**
 * Send campaign immediately
 */
async function sendCampaign(req, res) {
  try {
    const { id } = req.params;

    // Get campaign
    const campaign = await db.collection('newsletter_campaigns').findOne({ _id: new ObjectId(id) });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    // Get active subscribers
    const subscribers = await db.collection('newsletter_subscribers')
      .find({ status: 'active' })
      .toArray();

    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'Нема активни претплатници' });
    }

    // Update campaign status
    await db.collection('newsletter_campaigns').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'sending', updatedAt: new Date() } }
    );

    // Fetch blogs for this campaign
    const blogs = await emailService.fetchBlogsForNewsletter(campaign.selectedBlogIds || []);

    // Send in background (don't await)
    setImmediate(async () => {
      try {
        const result = await emailService.sendNewsletterBatch(campaign, blogs, subscribers);

        // Update campaign status and analytics
        await db.collection('newsletter_campaigns').updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              recipientCount: result.sent,
              'analytics.totalSent': result.sent,
              updatedAt: new Date()
            }
          }
        );

        console.log(`Campaign ${id} sent successfully: ${result.sent} emails sent, ${result.failed} failed`);
      } catch (error) {
        console.error('Error sending campaign batch:', error);
        await db.collection('newsletter_campaigns').updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'failed', updatedAt: new Date() } }
        );
      }
    });

    res.json({
      success: true,
      message: 'Билтенот се испраќа. Ќе добиете известување кога ќе заврши.',
      recipientCount: subscribers.length
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при испраќање на билтенот' });
  }
}

/**
 * Schedule campaign for later
 */
async function scheduleCampaign(req, res) {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({ success: false, message: 'Датумот за закажување е задолжителен' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Датумот мора да биде во иднина' });
    }

    const result = await db.collection('newsletter_campaigns').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'scheduled',
          scheduledFor: scheduledDate,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    res.json({
      success: true,
      message: 'Билтенот е успешно закажан',
      scheduledFor: scheduledDate
    });
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при закажување на билтенот' });
  }
}

/**
 * Send test email
 */
async function sendTestEmail(req, res) {
  try {
    const { id } = req.params;
    const { testEmail } = req.body;

    if (!testEmail || !isValidEmail(testEmail)) {
      return res.status(400).json({ success: false, message: 'Невалидна тест email адреса' });
    }

    const campaign = await db.collection('newsletter_campaigns').findOne({ _id: new ObjectId(id) });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    // Fetch blogs
    const blogs = await emailService.fetchBlogsForNewsletter(campaign.selectedBlogIds || []);

    // Generate test HTML (without tracking)
    const testHtml = await emailService.generateNewsletterHTML(
      campaign,
      blogs,
      'test-unsubscribe-token',
      'test-tracking-pixel'
    );

    // Send test email
    await emailService.sendEmail(testEmail, `[ТЕСТ] ${campaign.subject}`, testHtml);

    res.json({ success: true, message: 'Тест email-от е успешно испратен' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, message: 'Грешка при испраќање на тест email' });
  }
}

/**
 * Delete campaign
 */
async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;

    const result = await db.collection('newsletter_campaigns').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    // Also delete associated analytics
    await db.collection('newsletter_analytics').deleteMany({ campaignId: new ObjectId(id) });

    res.json({ success: true, message: 'Кампањата е успешно избришана' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, message: 'Грешка при бришење на кампањата' });
  }
}

// ======================
// ANALYTICS
// ======================

/**
 * Get analytics overview
 */
async function getAnalyticsOverview(req, res) {
  try {
    // Total subscribers
    const totalSubscribers = await db.collection('newsletter_subscribers').countDocuments({ status: 'active' });

    // Total campaigns sent
    const totalCampaigns = await db.collection('newsletter_campaigns').countDocuments({ status: 'sent' });

    // Average open rate and click rate
    const campaigns = await db.collection('newsletter_campaigns')
      .find({ status: 'sent' })
      .toArray();

    let totalOpenRate = 0;
    let totalClickRate = 0;
    campaigns.forEach(campaign => {
      totalOpenRate += campaign.analytics?.openRate || 0;
      totalClickRate += campaign.analytics?.clickRate || 0;
    });

    const avgOpenRate = campaigns.length > 0 ? (totalOpenRate / campaigns.length).toFixed(2) : 0;
    const avgClickRate = campaigns.length > 0 ? (totalClickRate / campaigns.length).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalSubscribers,
        totalCampaigns,
        avgOpenRate: parseFloat(avgOpenRate),
        avgClickRate: parseFloat(avgClickRate)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на аналитиката' });
  }
}

/**
 * Get campaign analytics
 */
async function getCampaignAnalytics(req, res) {
  try {
    const { id } = req.params;

    const campaign = await db.collection('newsletter_campaigns').findOne({ _id: new ObjectId(id) });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Кампањата не е пронајдена' });
    }

    res.json({
      success: true,
      data: campaign.analytics || {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        openRate: 0,
        clickRate: 0
      }
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на аналитиката' });
  }
}

/**
 * Get subscriber-level details for a campaign
 */
async function getCampaignSubscriberDetails(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, filter = 'all' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query based on filter
    const query = { campaignId: new ObjectId(id) };

    if (filter === 'opened') {
      query['events.type'] = 'opened';
    } else if (filter === 'clicked') {
      query['events.type'] = 'clicked';
    } else if (filter === 'not-opened') {
      query['events.type'] = { $nin: ['opened', 'clicked'] };
    }

    const analytics = await db.collection('newsletter_analytics')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection('newsletter_analytics').countDocuments(query);

    // Format response
    const details = analytics.map(record => {
      const opened = record.events?.some(e => e.type === 'opened') || false;
      const clicked = record.events?.some(e => e.type === 'clicked') || false;
      const openedEvent = record.events?.find(e => e.type === 'opened');
      const clickedEvent = record.events?.find(e => e.type === 'clicked');

      return {
        subscriberEmail: record.subscriberEmail,
        opened,
        openedAt: openedEvent?.timestamp || null,
        clicked,
        clickedAt: clickedEvent?.timestamp || null,
        clickedLink: clickedEvent?.metadata?.linkUrl || null
      };
    });

    res.json({
      success: true,
      data: details,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching subscriber details:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на деталите' });
  }
}

// ======================
// TRACKING & UNSUBSCRIBE
// ======================

/**
 * Track email open (returns 1x1 transparent GIF)
 */
async function trackOpen(req, res) {
  try {
    const { token } = req.params;

    // Find analytics record
    const analytics = await db.collection('newsletter_analytics').findOne({ trackingPixelToken: token });

    if (analytics) {
      // Check if already opened
      const alreadyOpened = analytics.events?.some(e => e.type === 'opened');

      if (!alreadyOpened) {
        // Record opened event
        await db.collection('newsletter_analytics').updateOne(
          { trackingPixelToken: token },
          {
            $push: {
              events: {
                type: 'opened',
                timestamp: new Date(),
                metadata: {
                  userAgent: req.headers['user-agent'] || ''
                }
              }
            },
            $set: { updatedAt: new Date() }
          }
        );

        // Update campaign analytics
        const campaign = await db.collection('newsletter_campaigns').findOne({ _id: analytics.campaignId });
        if (campaign) {
          const totalOpened = (campaign.analytics?.totalOpened || 0) + 1;
          const totalSent = campaign.analytics?.totalSent || 1;
          const openRate = ((totalOpened / totalSent) * 100).toFixed(2);

          await db.collection('newsletter_campaigns').updateOne(
            { _id: analytics.campaignId },
            {
              $set: {
                'analytics.totalOpened': totalOpened,
                'analytics.openRate': parseFloat(openRate),
                updatedAt: new Date()
              }
            }
          );
        }
      }
    }

    // Return 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(gif);
  } catch (error) {
    console.error('Error tracking open:', error);
    // Still return GIF even on error
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length
    });
    res.end(gif);
  }
}

/**
 * Track link click and redirect
 */
async function trackClick(req, res) {
  try {
    const { token, linkId } = req.params;
    const redirectUrl = req.query.redirect;

    if (!redirectUrl) {
      return res.status(400).send('Missing redirect URL');
    }

    // Find analytics record
    const analytics = await db.collection('newsletter_analytics').findOne({ trackingPixelToken: token });

    if (analytics) {
      // Record clicked event
      await db.collection('newsletter_analytics').updateOne(
        { trackingPixelToken: token },
        {
          $push: {
            events: {
              type: 'clicked',
              timestamp: new Date(),
              metadata: {
                linkUrl: redirectUrl,
                linkId: linkId,
                userAgent: req.headers['user-agent'] || ''
              }
            }
          },
          $set: { updatedAt: new Date() }
        }
      );

      // Update campaign analytics (only count unique clicks)
      const alreadyClicked = analytics.events?.some(e => e.type === 'clicked');
      if (!alreadyClicked) {
        const campaign = await db.collection('newsletter_campaigns').findOne({ _id: analytics.campaignId });
        if (campaign) {
          const totalClicked = (campaign.analytics?.totalClicked || 0) + 1;
          const totalSent = campaign.analytics?.totalSent || 1;
          const clickRate = ((totalClicked / totalSent) * 100).toFixed(2);

          await db.collection('newsletter_campaigns').updateOne(
            { _id: analytics.campaignId },
            {
              $set: {
                'analytics.totalClicked': totalClicked,
                'analytics.clickRate': parseFloat(clickRate),
                updatedAt: new Date()
              }
            }
          );
        }
      }
    }

    // Redirect to original URL
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Error tracking click:', error);
    // Still redirect even on error
    res.redirect(302, req.query.redirect || 'https://nexa.mk');
  }
}

/**
 * Unsubscribe from newsletter
 */
async function unsubscribe(req, res) {
  try {
    const { token } = req.params;

    // Find subscriber by unsubscribe token
    const subscriber = await db.collection('newsletter_subscribers').findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="mk">
        <head>
          <meta charset="utf-8">
          <title>Грешка</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Грешка</h1>
            <p>Неважечки линк за отпишување.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (subscriber.status === 'unsubscribed') {
      return res.send(`
        <!DOCTYPE html>
        <html lang="mk">
        <head>
          <meta charset="utf-8">
          <title>Веќе отпишан</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
            h1 { color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Веќе сте отпишани</h1>
            <p>Вашата email адреса <strong>${subscriber.email}</strong> веќе е отпишана од нашиот билтен.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Update subscriber status
    await db.collection('newsletter_subscribers').updateOne(
      { unsubscribeToken: token },
      {
        $set: {
          status: 'unsubscribed',
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Return confirmation page
    res.send(`
      <!DOCTYPE html>
      <html lang="mk">
      <head>
        <meta charset="utf-8">
        <title>Успешно отпишување</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            max-width: 500px;
            margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 {
            color: #10b981;
            margin-bottom: 20px;
          }
          p {
            color: #4b5563;
            line-height: 1.6;
          }
          .email {
            font-weight: bold;
            color: #1e40af;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Успешно се отпишавте</h1>
          <p>Вашата email адреса <span class="email">${subscriber.email}</span> е успешно отпишана од нашиот билтен.</p>
          <p>Ќе ни недостасувате! Ако сакате повторно да се претплатите, контактирајте не.</p>
          <div class="footer">
            <p>Неxa Terminal - Автоматизација на правни документи</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="mk">
      <head>
        <meta charset="utf-8">
        <title>Грешка</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { background: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
          h1 { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Грешка</h1>
          <p>Се случи грешка при отпишување. Ве молиме обидете се повторно подоцна.</p>
        </div>
      </body>
      </html>
    `);
  }
}

// ======================
// HELPER METHODS
// ======================

/**
 * Get recent published blogs
 */
async function getRecentBlogs(req, res) {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    const blogs = await db.collection('blogPosts')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .project({ _id: 1, title: 1, excerpt: 1, featuredImage: 1, createdAt: 1 })
      .toArray();

    res.json({ success: true, blogs: blogs });
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на објавите' });
  }
}

// Export all methods
module.exports = {
  setDatabase,
  getSubscribers,
  addSubscriber,
  importCsvSubscribers,
  updateSubscriber,
  deleteSubscriber,
  bulkDeleteSubscribers,
  exportSubscribersCsv,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
  deleteCampaign,
  getAnalyticsOverview,
  getCampaignAnalytics,
  getCampaignSubscriberDetails,
  trackOpen,
  trackClick,
  unsubscribe,
  getRecentBlogs
};
