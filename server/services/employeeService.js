// HR module — „Регистар на вработени" data layer.
//
// Durable `employees` collection (native driver, no TTL). One doc per
// employee, owned by the account owner (userId — every query is scoped).
// Leave usage lives as embedded leaveRecords (SMB scale: tens of employees,
// a few records per year); the balance is always COMPUTED, never stored.
// remindersSent drives the daily HR reminder engine (hrReminderService).
// companyId is populated from day one so a Pro multi-company rollup is a
// later filter, not a migration (same decision as contractService).

const { ObjectId } = require('mongodb');

const COLLECTION = 'employees';

const STATUSES = ['active', 'terminated'];
const EMPLOYMENT_TYPES = ['неопределено', 'определено'];
const REMINDER_TYPES = ['contract-30d', 'contract-7d', 'probation-7d'];

// Optional HR record tabs — one generic dated-record shape per kind:
// { _id, date, text, amount|null, createdAt }. Kind key doubles as the
// employee-doc field name.
const HR_RECORD_KINDS = ['salaryHistory', 'requests', 'sanctions', 'education'];

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));

const err = (message, code = 'VALIDATION') => {
  const e = new Error(message);
  e.code = code;
  return e;
};

const asDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

class EmployeeService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
  }

  async ensureIndexes() {
    await this.col.createIndex({ userId: 1, status: 1 });
    await this.col.createIndex({ companyId: 1 });
    await this.col.createIndex({ status: 1, contractEndsAt: 1 });   // reminder scan
    await this.col.createIndex({ status: 1, probationEndsAt: 1 });  // reminder scan
    await this.col.createIndex({ fullName: 'text' }, { default_language: 'none' }); // MK — no stemming
  }

  // ── leave math (pure — hermetic-testable without a DB) ───────────────────

  static leaveUsed(employee, year) {
    return (employee?.leaveRecords || [])
      .filter((r) => r.year === year)
      .reduce((sum, r) => sum + (Number(r.days) || 0), 0);
  }

  static leaveBalance(employee, year) {
    const allowance = Number(employee?.annualLeaveDays) || 0;
    return allowance - EmployeeService.leaveUsed(employee, year);
  }

  /** Attach computed current-year leave figures for list/detail responses. */
  static decorate(employee, now = new Date()) {
    if (!employee) return employee;
    const year = now.getFullYear();
    employee.currentYearUsed = EmployeeService.leaveUsed(employee, year);
    employee.currentYearBalance = EmployeeService.leaveBalance(employee, year);
    return employee;
  }

  // ── normalization ────────────────────────────────────────────────────────

  buildDoc({ userId, companyId, createdBy, fullName, embg, position, address,
             employmentType, contractEndsAt, probationEndsAt, hiredAt,
             salaryGross, annualLeaveDays, notes }) {
    const name = String(fullName || '').trim().slice(0, 200);
    if (!name) throw err('Внесете име и презиме на вработениот.');

    const cleanEmbg = String(embg || '').trim();
    if (!/^\d{13}$/.test(cleanEmbg)) throw err('ЕМБГ мора да содржи точно 13 цифри.');

    const cleanPosition = String(position || '').trim().slice(0, 200);
    if (!cleanPosition) throw err('Внесете работна позиција.');

    const type = EMPLOYMENT_TYPES.includes(employmentType) ? employmentType : 'неопределено';
    const contractEnd = asDate(contractEndsAt);
    if (type === 'определено' && !contractEnd) {
      throw err('За вработување на определено време внесете датум на истек на договорот.');
    }

    const allowance = Number(annualLeaveDays);
    const days = Number.isFinite(allowance) ? Math.min(60, Math.max(0, Math.round(allowance))) : 21;

    const now = new Date();
    return {
      userId: toId(userId),
      companyId: companyId ? toId(companyId) : toId(userId), // Basic: own company == owner
      createdBy: createdBy ? toId(createdBy) : toId(userId),
      fullName: name,
      embg: cleanEmbg,
      position: cleanPosition,
      address: String(address || '').trim().slice(0, 300),
      employmentType: type,
      contractEndsAt: type === 'определено' ? contractEnd : null,
      probationEndsAt: asDate(probationEndsAt),
      hiredAt: asDate(hiredAt),
      salaryGross: Number.isFinite(Number(salaryGross)) && salaryGross !== '' && salaryGross !== null
        ? Number(salaryGross) : null,
      annualLeaveDays: days,
      status: 'active',
      terminatedAt: null,
      notes: String(notes || '').slice(0, 5000),
      leaveRecords: [],
      remindersSent: [],
      createdAt: now,
      updatedAt: now
    };
  }

  normalizeHrRecord({ date, text, amount }) {
    const d = asDate(date);
    if (!d) throw err('Внесете валиден датум.');
    const cleanText = String(text || '').trim().slice(0, 300);
    if (!cleanText) throw err('Внесете опис.');
    return {
      _id: new ObjectId(),
      date: d,
      text: cleanText,
      amount: Number.isFinite(Number(amount)) && amount !== '' && amount !== null && amount !== undefined
        ? Number(amount) : null,
      createdAt: new Date()
    };
  }

  normalizeLeaveRecord({ year, from, to, days, note }) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2020 || y > 2035) throw err('Внесете валидна година (2020–2035).');
    const fromD = asDate(from);
    const toD = asDate(to);
    if (!fromD || !toD) throw err('Внесете валидни датуми за одморот.');
    if (fromD > toD) throw err('Почетниот датум мора да биде пред крајниот.');
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > 366) throw err('Внесете валиден број на денови.');
    return {
      _id: new ObjectId(),
      year: y,
      from: fromD,
      to: toD,
      days: d,
      note: String(note || '').slice(0, 300),
      createdAt: new Date()
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async create(input) {
    const doc = this.buildDoc(input);
    const { insertedId } = await this.col.insertOne(doc);
    doc._id = insertedId;
    return EmployeeService.decorate(doc);
  }

  async get(userId, id) {
    if (!ObjectId.isValid(id)) return null;
    const doc = await this.col.findOne({ _id: toId(id), userId: toId(userId) });
    return EmployeeService.decorate(doc);
  }

  async list(userId, { status, q, page = 1, limit = 20 } = {}) {
    const filter = { userId: toId(userId) };
    if (status && STATUSES.includes(status)) filter.status = status;
    if (q) filter.$text = { $search: String(q).slice(0, 100) };

    const perPage = Math.min(200, Math.max(1, Number(limit) || 20));
    const skip = (Math.max(1, Number(page)) - 1) * perPage;
    const [items, total] = await Promise.all([
      this.col.find(filter).sort({ status: 1, fullName: 1 }).skip(skip).limit(perPage).toArray(),
      this.col.countDocuments(filter)
    ]);
    items.forEach((e) => EmployeeService.decorate(e));
    return { items, total, page: Math.max(1, Number(page)), totalPages: Math.max(1, Math.ceil(total / perPage)) };
  }

  /** Editable fields only — never touches leaveRecords/remindersSent. */
  async update(userId, id, patch) {
    const existing = await this.get(userId, id);
    if (!existing) return null;

    // Re-validate through buildDoc with merged values so the same MK
    // validation rules apply on edit as on create.
    const merged = this.buildDoc({
      userId,
      companyId: existing.companyId,
      createdBy: existing.createdBy,
      fullName: patch.fullName !== undefined ? patch.fullName : existing.fullName,
      embg: patch.embg !== undefined ? patch.embg : existing.embg,
      position: patch.position !== undefined ? patch.position : existing.position,
      address: patch.address !== undefined ? patch.address : existing.address,
      employmentType: patch.employmentType !== undefined ? patch.employmentType : existing.employmentType,
      contractEndsAt: patch.contractEndsAt !== undefined ? patch.contractEndsAt : existing.contractEndsAt,
      probationEndsAt: patch.probationEndsAt !== undefined ? patch.probationEndsAt : existing.probationEndsAt,
      hiredAt: patch.hiredAt !== undefined ? patch.hiredAt : existing.hiredAt,
      salaryGross: patch.salaryGross !== undefined ? patch.salaryGross : existing.salaryGross,
      annualLeaveDays: patch.annualLeaveDays !== undefined ? patch.annualLeaveDays : existing.annualLeaveDays,
      notes: patch.notes !== undefined ? patch.notes : existing.notes
    });

    const set = {
      fullName: merged.fullName,
      embg: merged.embg,
      position: merged.position,
      address: merged.address,
      employmentType: merged.employmentType,
      contractEndsAt: merged.contractEndsAt,
      probationEndsAt: merged.probationEndsAt,
      hiredAt: merged.hiredAt,
      salaryGross: merged.salaryGross,
      annualLeaveDays: merged.annualLeaveDays,
      notes: merged.notes,
      updatedAt: new Date()
    };

    if (patch.status !== undefined && STATUSES.includes(patch.status)) {
      set.status = patch.status;
      set.terminatedAt = patch.status === 'terminated'
        ? (existing.terminatedAt || new Date())
        : null;
    }

    await this.col.updateOne({ _id: toId(id), userId: toId(userId) }, { $set: set });
    return this.get(userId, id);
  }

  async remove(userId, id) {
    if (!ObjectId.isValid(id)) return false;
    const { deletedCount } = await this.col.deleteOne({ _id: toId(id), userId: toId(userId) });
    return deletedCount === 1;
  }

  // ── leave records ────────────────────────────────────────────────────────

  async addLeaveRecord(userId, id, raw) {
    const existing = await this.get(userId, id);
    if (!existing) return null;
    const record = this.normalizeLeaveRecord(raw);
    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $push: { leaveRecords: record }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }

  async removeLeaveRecord(userId, id, recordId) {
    const existing = await this.get(userId, id);
    if (!existing || !ObjectId.isValid(recordId)) return null;
    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $pull: { leaveRecords: { _id: toId(recordId) } }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }

  // ── optional HR record tabs (salary / requests / sanctions / education) ──

  async addHrRecord(userId, id, kind, raw) {
    if (!HR_RECORD_KINDS.includes(kind)) {
      throw err('Непознат вид на запис.', 'INVALID_KIND');
    }
    const existing = await this.get(userId, id);
    if (!existing) return null;
    const record = this.normalizeHrRecord(raw);
    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $push: { [kind]: record }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }

  async removeHrRecord(userId, id, kind, recordId) {
    if (!HR_RECORD_KINDS.includes(kind)) {
      throw err('Непознат вид на запис.', 'INVALID_KIND');
    }
    const existing = await this.get(userId, id);
    if (!existing || !ObjectId.isValid(recordId)) return null;
    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $pull: { [kind]: { _id: toId(recordId) } }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }
}

module.exports = EmployeeService;
module.exports.COLLECTION = COLLECTION;
module.exports.STATUSES = STATUSES;
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.REMINDER_TYPES = REMINDER_TYPES;
module.exports.HR_RECORD_KINDS = HR_RECORD_KINDS;
