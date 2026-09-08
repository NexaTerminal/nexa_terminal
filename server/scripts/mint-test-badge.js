// Dev helper: insert a test „Проверен работодавач" badge so you can view the
// verify page + seal + certificate WITHOUT going through Google OAuth.
//
//   cd server && node scripts/mint-test-badge.js               # score 88 → A+
//   cd server && node scripts/mint-test-badge.js 95 "Тест ДОО" # custom score/name
//
// Prints the URLs to open. Safe to run repeatedly (each run makes a new token).

const path = require('path');
const fs = require('fs');
for (const f of ['.env.development', '.env']) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) require('dotenv').config({ path: p });
}
const { MongoClient } = require('mongodb');
const badge = require('../services/badgeService');

const score = parseInt(process.argv[2], 10) || 88;
const companyName = process.argv[3] || 'ДОО Пример Компанија';

(async () => {
  const rating = badge.ratingForScore(score);
  if (!rating) { console.error(`Score ${score} is below ${badge.BADGE_MIN_SCORE} — no badge.`); process.exit(1); }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const token = badge.generateToken();
  const now = new Date();
  await db.collection('badges').insertOne({
    token, userId: 'test-user', module: 'employment', companyName, verified: true,
    score, ratingTier: rating.tier, ratingLabel: rating.label,
    issuedAt: now, renewedAt: now, expiresAt: new Date(now.getTime() + 365 * 864e5),
    revoked: false, source: 'mint-test-badge',
  });

  const api = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const client3000 = process.env.CLIENT_URL || 'http://localhost:3000';
  console.log(`\n✅ Test badge minted — ${companyName} · ${score}% · ${rating.tier}\n`);
  console.log(`Verify page:  ${client3000}/badge/${token}`);
  console.log(`Seal SVG:     ${api}/public/employer-badge/verify/${token}/image.svg`);
  console.log(`Certificate:  ${api}/public/employer-badge/verify/${token}/certificate.svg\n`);

  await client.close();
  process.exit(0);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
