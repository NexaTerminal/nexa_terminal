'use strict';

class InvoicesController {
  constructor({ invoicesService }) {
    this.svc = invoicesService;
  }

  // --- User: list own invoices --------------------------------------------
  async listMine(req, res) {
    try {
      const rows = await this.svc.listForUser(req.user._id || req.user.id);
      res.json({ invoices: rows });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to load invoices.' });
    }
  }

  // --- Admin: list any user's invoices ------------------------------------
  async listForUser(req, res) {
    try {
      const { userId } = req.params;
      const rows = await this.svc.listForUser(userId);
      res.json({ invoices: rows });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  // --- Admin: create ------------------------------------------------------
  async create(req, res) {
    try {
      const { userId } = req.params;
      const row = await this.svc.create(userId, req.body || {});
      res.status(201).json({ invoice: row });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  // --- Admin: update ------------------------------------------------------
  async update(req, res) {
    try {
      const { invoiceId } = req.params;
      const row = await this.svc.update(invoiceId, req.body || {});
      res.json({ invoice: row });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  // --- Admin: delete ------------------------------------------------------
  async remove(req, res) {
    try {
      const { invoiceId } = req.params;
      const ok = await this.svc.remove(invoiceId);
      if (!ok) return res.status(404).json({ message: 'Not found.' });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
}

module.exports = InvoicesController;
