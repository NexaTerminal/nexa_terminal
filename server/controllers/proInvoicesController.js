'use strict';

class ProInvoicesController {
  constructor({ proInvoicesService }) {
    this.svc = proInvoicesService;
  }

  // ── User-facing ────────────────────────────────────────────────────────
  async listMine(req, res) {
    try {
      const items = await this.svc.listForUser(req.user._id || req.user.id);
      res.json({ success: true, items });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async downloadMine(req, res) {
    try {
      const inv = await this.svc.findById(req.params.id);
      if (!inv) return res.status(404).json({ success: false, message: 'Не е пронајдена.' });
      const ownerId = String(inv.userId);
      const requesterId = String(req.user._id || req.user.id);
      if (ownerId !== requesterId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Немате пристап.' });
      }
      const { renderProInvoicePdf } = require('../services/proInvoicePdf');
      const buf = await renderProInvoicePdf(inv);
      const filename = `profaktura-${String(inv.number).replace(/\//g, '-')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buf);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ── Admin-facing ───────────────────────────────────────────────────────
  async listAll(req, res) {
    try {
      const { year, status, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const { items, total } = await this.svc.listAll({
        year, status, limit: Number(limit), skip
      });
      res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body || {};
      const inv = await this.svc.updateStatus(req.params.id, status);
      if (!inv) return res.status(404).json({ success: false, message: 'Не е пронајдена.' });
      res.json({ success: true, invoice: inv });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async remove(req, res) {
    try {
      const ok = await this.svc.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Не е пронајдена.' });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // ── Numbering control (admin) ──────────────────────────────────────────
  async getCounter(req, res) {
    try {
      const year = req.query.year || new Date().getUTCFullYear();
      const counter = await this.svc.getCounter(year);
      res.json({ success: true, counter });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  async setCounter(req, res) {
    try {
      const { year, next } = req.body || {};
      const counter = await this.svc.setNext(year || new Date().getUTCFullYear(), next);
      res.json({ success: true, counter });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async resequence(req, res) {
    try {
      const { year } = req.body || {};
      const result = await this.svc.resequenceYear(year || new Date().getUTCFullYear());
      res.json({ success: true, result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = ProInvoicesController;
