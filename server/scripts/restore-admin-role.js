/**
 * One-shot: restore the platform-admin role that a promo/paid activation
 * clobbered (PLAN_TO_ROLE['pro'] → 'admin_user' overwrote role:'admin').
 * The subscription is left intact; only `role` is corrected.
 *
 *   node server/scripts/restore-admin-role.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient, ObjectId } = require('mongodb');

const USER_ID = '68cb2c740a28d404657c8078'; // martin (platform admin)

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const client = new MongoClient(uri);
  await client.connect();
  const users = client.db('nexa').collection('users');

  const before = await users.findOne({ _id: new ObjectId(USER_ID) }, { projection: { role: 1, isAdmin: 1, username: 1 } });
  console.log('before:', before);

  const res = await users.updateOne(
    { _id: new ObjectId(USER_ID) },
    { $set: { role: 'admin', isAdmin: true, updatedAt: new Date() } }
  );
  console.log('modified:', res.modifiedCount);

  const after = await users.findOne({ _id: new ObjectId(USER_ID) }, { projection: { role: 1, isAdmin: 1, username: 1 } });
  console.log('after:', after);

  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
