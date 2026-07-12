/* eslint-env node */
/**
 * HR module tests — plain Node script (no Jest):
 *
 *   node server/services/__tests__/hrReminderService.test.js
 *
 * Tier 1 (always runs): pure logic — hrReminderService.dueReminders offsets
 * matrix and EmployeeService leave math.
 * Tier 2 (runs when a local mongod is available on 127.0.0.1:27017):
 * end-to-end evaluateAndSend against a throwaway `nexa_hr_test` database
 * with a stub email service — grouping, recording, idempotency.
 */

const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const HrReminderService = require('../hrReminderService');
const EmployeeService = require('../employeeService');

const DAY_MS = 86400000;
const daysFromNow = (n, now) => new Date(now.getTime() + n * DAY_MS);

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`✓ ${name}`); }
  catch (e) { console.error(`✗ ${name}: ${e.message}`); failed++; }
};

// ── Tier 1: pure logic ──────────────────────────────────────────────────────

const svc = new HrReminderService({ collection: () => ({}) }, null);
const now = new Date('2026-07-12T10:00:00Z');

const emp = (over = {}) => ({
  _id: new ObjectId(),
  userId: new ObjectId(),
  status: 'active',
  employmentType: 'определено',
  contractEndsAt: null,
  probationEndsAt: null,
  remindersSent: [],
  annualLeaveDays: 21,
  leaveRecords: [],
  ...over
});

check('31 days out → no reminder', () => {
  const e = emp({ contractEndsAt: daysFromNow(31, now) });
  assert.equal(svc.dueReminders(e, now).length, 0);
});

check('30 days out → contract-30d fires', () => {
  const e = emp({ contractEndsAt: daysFromNow(30, now) });
  const due = svc.dueReminders(e, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].type, 'contract-30d');
  assert.deepEqual(due[0].recordTypes, ['contract-30d']);
});

check('7 days out, 30d already sent → contract-7d fires', () => {
  const e = emp({
    contractEndsAt: daysFromNow(7, now),
    remindersSent: [{ type: 'contract-30d', at: now, fired: true }]
  });
  const due = svc.dueReminders(e, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].type, 'contract-7d');
});

check('8 days out, 30d already sent → nothing new', () => {
  const e = emp({
    contractEndsAt: daysFromNow(8, now),
    remindersSent: [{ type: 'contract-30d', at: now, fired: true }]
  });
  assert.equal(svc.dueReminders(e, now).length, 0);
});

check('5 days out, fresh employee → fires 7d, records BOTH windows', () => {
  const e = emp({ contractEndsAt: daysFromNow(5, now) });
  const due = svc.dueReminders(e, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].type, 'contract-7d');
  assert.deepEqual(due[0].recordTypes.sort(), ['contract-30d', 'contract-7d'].sort());
});

check('past due → nothing', () => {
  const e = emp({ contractEndsAt: daysFromNow(-1, now) });
  assert.equal(svc.dueReminders(e, now).length, 0);
});

check('7d already sent → re-run fires nothing (idempotent)', () => {
  const e = emp({
    contractEndsAt: daysFromNow(5, now),
    remindersSent: [
      { type: 'contract-30d', at: now, fired: false },
      { type: 'contract-7d', at: now, fired: true }
    ]
  });
  assert.equal(svc.dueReminders(e, now).length, 0);
});

check('terminated employee → nothing even with due date', () => {
  const e = emp({ status: 'terminated', contractEndsAt: daysFromNow(5, now) });
  assert.equal(svc.dueReminders(e, now).length, 0);
});

check('неопределено ignores contractEndsAt; probation still fires', () => {
  const e = emp({
    employmentType: 'неопределено',
    contractEndsAt: daysFromNow(5, now),  // stale data — must be ignored
    probationEndsAt: daysFromNow(6, now)
  });
  const due = svc.dueReminders(e, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].type, 'probation-7d');
});

check('contract + probation both due → two items', () => {
  const e = emp({ contractEndsAt: daysFromNow(6, now), probationEndsAt: daysFromNow(3, now) });
  const types = svc.dueReminders(e, now).map((d) => d.type).sort();
  assert.deepEqual(types, ['contract-7d', 'probation-7d']);
});

check('leave math: used and balance across years', () => {
  const e = emp({
    annualLeaveDays: 21,
    leaveRecords: [
      { year: 2026, days: 8 },
      { year: 2026, days: 5 },
      { year: 2025, days: 20 }
    ]
  });
  assert.equal(EmployeeService.leaveUsed(e, 2026), 13);
  assert.equal(EmployeeService.leaveBalance(e, 2026), 8);
  assert.equal(EmployeeService.leaveBalance(e, 2025), 1);
  assert.equal(EmployeeService.leaveBalance(e, 2024), 21);
});

check('buildDoc validation: EMBG + определено rules', () => {
  const es = new EmployeeService({ collection: () => ({}) });
  const base = { userId: new ObjectId(), fullName: 'Тест', embg: '0101990450001', position: 'Правник' };
  assert.ok(es.buildDoc(base));
  assert.throws(() => es.buildDoc({ ...base, embg: '123' }), /13 цифри/);
  assert.throws(() => es.buildDoc({ ...base, employmentType: 'определено' }), /определено/);
  assert.ok(es.buildDoc({ ...base, employmentType: 'определено', contractEndsAt: '2026-09-01' }));
});

// ── Tier 2: mongod integration ──────────────────────────────────────────────

(async () => {
  let client;
  try {
    const { MongoClient } = require('mongodb');
    client = new MongoClient('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 1500 });
    await client.connect();
  } catch {
    console.log('\n(skip) mongod tier — no local MongoDB on 127.0.0.1:27017');
    finish();
    return;
  }

  try {
    const db = client.db('nexa_hr_test');
    await db.dropDatabase();

    const ownerId = new ObjectId();
    await db.collection('users').insertOne({
      _id: ownerId, email: 'owner@test.mk', fullName: 'Тест Сопственик'
    });

    const employeeService = new EmployeeService(db);
    await employeeService.ensureIndexes();
    const mk = (over) => employeeService.create({
      userId: ownerId, fullName: 'Вработен Тестов', embg: '0101990450001',
      position: 'Оператор', ...over
    });

    const e1 = await mk({ fullName: 'Ана Договорова', employmentType: 'определено', contractEndsAt: daysFromNow(7, now) });
    const e2 = await mk({ fullName: 'Борис Пробен', probationEndsAt: daysFromNow(6, now) });
    const e3 = await mk({ fullName: 'Влатко Прекинат', employmentType: 'определено', contractEndsAt: daysFromNow(7, now) });
    await employeeService.update(ownerId, e3._id, { status: 'terminated' });

    const stubEmail = { sent: [], async sendEmail(to, subject, html) { this.sent.push({ to, subject, html }); } };
    const hr = new HrReminderService(db, stubEmail);

    const r1 = await hr.evaluateAndSend(now);
    check('mongod: one grouped digest for the owner', () => {
      assert.equal(r1.emailsSent, 1);
      assert.equal(stubEmail.sent.length, 1);
      assert.equal(stubEmail.sent[0].to, 'owner@test.mk');
      assert.match(stubEmail.sent[0].html, /Ана Договорова/);
      assert.match(stubEmail.sent[0].html, /Борис Пробен/);
      assert.doesNotMatch(stubEmail.sent[0].html, /Влатко Прекинат/);
    });

    check('mongod: reminders recorded on both employees', async () => {});
    const e1After = await employeeService.get(ownerId, e1._id);
    const e2After = await employeeService.get(ownerId, e2._id);
    check('mongod: contract employee has 7d fired + 30d satisfied', () => {
      const types = e1After.remindersSent.map((s) => `${s.type}:${s.fired}`).sort();
      assert.deepEqual(types, ['contract-30d:false', 'contract-7d:true'].sort());
    });
    check('mongod: probation employee has probation-7d', () => {
      assert.deepEqual(e2After.remindersSent.map((s) => s.type), ['probation-7d']);
    });

    const r2 = await hr.evaluateAndSend(now);
    check('mongod: second run sends nothing (idempotent)', () => {
      assert.equal(r2.emailsSent, 0);
      assert.equal(stubEmail.sent.length, 1);
    });

    // Leave records via the service against real Mongo.
    await employeeService.addLeaveRecord(ownerId, e1._id, { year: 2026, from: '2026-08-01', to: '2026-08-10', days: 8 });
    const withLeave = await employeeService.get(ownerId, e1._id);
    check('mongod: leave record → balance 13', () => {
      assert.equal(withLeave.currentYearBalance, 21 - 8);
    });
    const otherUser = new ObjectId();
    check('mongod: cross-user access denied', async () => {});
    const foreign = await employeeService.get(otherUser, e1._id);
    check('mongod: other user gets null (userId scoping)', () => assert.equal(foreign, null));

    await db.dropDatabase();
  } finally {
    await client.close();
  }
  finish();
})();

function finish() {
  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log('\nAll HR module assertions pass.');
}
