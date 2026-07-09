// Dashboard command center summary (master-plan Phase 3).
// One call feeding the compliance cockpit: latest screening per domain,
// recent generated documents, and the CMS upcoming count. Mounted behind
// subscriptionGuard — locked users see LockedWelcome and never call this.

const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');
const { priceFor, slugFromTransaction, DEFAULT_PRICE_EUR } = require('../constants/documentPrices');

const router = express.Router();

// domain → collection. Legal (lhc) has 8 sub-screenings sharing one collection;
// we surface the latest one + how many distinct sub-areas were ever completed.
const DOMAINS = [
  { key: 'legal', collection: 'lhcAssessments' },
  { key: 'marketing', collection: 'mhcAssessments' },
  { key: 'hr', collection: 'hhcAssessments' },
  { key: 'cyber', collection: 'chcAssessments' }
];

router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = new ObjectId(req.user._id);

    const screenings = await Promise.all(DOMAINS.map(async ({ key, collection }) => {
      const latest = await db.collection(collection)
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(1)
        .project({ category: 1, categoryTitle: 1, percentage: 1, grade: 1, overallLevel: 1, maturityLevel: 1, violations: 1, createdAt: 1 })
        .toArray();
      const doc = latest[0] || null;
      let areasDone = 0;
      if (key === 'legal') {
        areasDone = (await db.collection(collection).distinct('category', { userId })).length;
      }
      return {
        domain: key,
        done: !!doc,
        createdAt: doc?.createdAt || null,
        category: doc?.category || null,
        categoryTitle: doc?.categoryTitle || null,
        percentage: typeof doc?.percentage === 'number' ? doc.percentage : null,
        grade: doc?.grade || doc?.overallLevel || doc?.maturityLevel || null,
        violationsCount: Array.isArray(doc?.violations) ? doc.violations.length : null,
        areasDone
      };
    }));

    const recentDocuments = await db.collection('shared_documents')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ documentType: 1, fileName: 1, createdAt: 1, shareToken: 1 })
      .toArray();

    let upcomingCount = 0;
    try {
      const contractService = req.app.locals.contractService;
      if (contractService) {
        upcomingCount = (await contractService.upcoming(req.user._id, { days: 30 })).length;
      }
    } catch (_) { /* widget shows details anyway */ }

    // Savings meter (master-plan Phase 5): every successful generation left a
    // durable credit_transactions record (type DOCUMENT_GENERATION); custom
    // (My Templates) generations live in template_generations. Sum against the
    // draft market-price map — framed as an estimate in the UI.
    let savings = { totalEur: 0, docsCount: 0 };
    try {
      const [txs, customCount] = await Promise.all([
        db.collection('credit_transactions')
          .find({ userId, type: 'DOCUMENT_GENERATION' })
          .project({ metadata: 1 })
          .toArray(),
        db.collection('template_generations').countDocuments({ userId })
      ]);
      const generatorTotal = txs.reduce((sum, t) => sum + priceFor(slugFromTransaction(t.metadata)), 0);
      savings = {
        totalEur: generatorTotal + customCount * DEFAULT_PRICE_EUR,
        docsCount: txs.length + customCount
      };
    } catch (_) { /* meter is decorative — never break the summary */ }

    res.json({ success: true, data: { screenings, recentDocuments, upcomingCount, savings } });
  } catch (err) {
    console.error('[dashboard] summary error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на прегледот.' });
  }
});

module.exports = router;
