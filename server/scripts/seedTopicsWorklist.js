/**
 * Seed the Topics Q&A worklist with starter topics (2 per category, 10 questions
 * each) so members see options to answer. Idempotent: skips topics whose title
 * already exists. Review/edit afterwards in /terminal/admin/topics/worklist.
 *
 *   node server/scripts/seedTopicsWorklist.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');
const TopicsService = require('../services/topicsService');
const { TOPICS } = require('../data/seedTopicsWorklist');

const ADMIN_ID = '68cb2c740a28d404657c8078'; // martin (platform admin) — createdBy

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('nexa');
  const svc = new TopicsService(db);
  const admin = { _id: ADMIN_ID };

  let created = 0, skipped = 0;
  for (const t of TOPICS) {
    const exists = await db.collection('qa_worklist').findOne({ title: t.title });
    if (exists) { skipped++; console.log('skip  ', t.title); continue; }
    const input = {
      title: t.title,
      practiceArea: t.practiceArea,
      category: t.category,
      targetKeyword: t.targetKeyword || '',
      scope: t.scope,
      questions: t.questions.map((prompt, i) => ({ order: i + 1, prompt, notes: '' }))
    };
    try {
      await svc.createWorklistItem(admin, input);
      created++; console.log('create', `[${t.category}]`, t.title);
    } catch (e) {
      console.error('FAIL  ', t.title, '→', e.code || e.message);
    }
  }

  console.log(`\nDone. created=${created} skipped=${skipped} total=${TOPICS.length}`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
