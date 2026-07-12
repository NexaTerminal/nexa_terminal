// HR module — HTTP layer for the employee registry.
// Thin handlers over EmployeeService; ownership enforced by scoping every
// query to req.user._id inside the service. Validation errors thrown by the
// service carry code 'VALIDATION' → 400 with the MK message.

const svc = (req) => req.app.locals.employeeService;

const fail = (res, err, fallback) => {
  if (err?.code === 'VALIDATION' || err?.code === 'INVALID_KIND') {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error('[employees] error:', err);
  return res.status(500).json({ success: false, message: fallback });
};

async function list(req, res) {
  try {
    const data = await svc(req).list(req.user._id, {
      status: req.query.status,
      q: req.query.q,
      page: req.query.page,
      limit: req.query.limit
    });
    res.json({ success: true, data });
  } catch (err) { fail(res, err, 'Грешка при вчитување на вработените.'); }
}

async function get(req, res) {
  try {
    const doc = await svc(req).get(req.user._id, req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Вработениот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при вчитување на вработениот.'); }
}

async function create(req, res) {
  try {
    const doc = await svc(req).create({
      ...req.body,
      userId: req.user._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при креирање на вработениот.'); }
}

async function update(req, res) {
  try {
    const doc = await svc(req).update(req.user._id, req.params.id, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Вработениот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при ажурирање.'); }
}

async function remove(req, res) {
  try {
    const ok = await svc(req).remove(req.user._id, req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Вработениот не е пронајден.' });
    res.json({ success: true });
  } catch (err) { fail(res, err, 'Грешка при бришење.'); }
}

async function addLeaveRecord(req, res) {
  try {
    const doc = await svc(req).addLeaveRecord(req.user._id, req.params.id, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Вработениот не е пронајден.' });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при запишување на одморот.'); }
}

async function removeLeaveRecord(req, res) {
  try {
    const doc = await svc(req).removeLeaveRecord(req.user._id, req.params.id, req.params.lid);
    if (!doc) return res.status(404).json({ success: false, message: 'Записот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при бришење на записот.'); }
}

async function addHrRecord(req, res) {
  try {
    const doc = await svc(req).addHrRecord(req.user._id, req.params.id, req.params.kind, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Вработениот не е пронајден.' });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при запишување.'); }
}

async function removeHrRecord(req, res) {
  try {
    const doc = await svc(req).removeHrRecord(req.user._id, req.params.id, req.params.kind, req.params.rid);
    if (!doc) return res.status(404).json({ success: false, message: 'Записот не е пронајден.' });
    res.json({ success: true, data: doc });
  } catch (err) { fail(res, err, 'Грешка при бришење на записот.'); }
}

module.exports = { list, get, create, update, remove, addLeaveRecord, removeLeaveRecord, addHrRecord, removeHrRecord };
