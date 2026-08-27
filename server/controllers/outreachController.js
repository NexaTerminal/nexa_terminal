'use strict';

/**
 * Admin outreach controller — contact lists (audiences) + the daily drip.
 * All routes are admin-gated at the router (authenticateJWT + isAdmin).
 */
class OutreachController {
  constructor({ contactListService, dripSettingsService, dripScheduler }) {
    this.lists = contactListService;
    this.settings = dripSettingsService;
    this.scheduler = dripScheduler; // for runNow(); may be null if init failed
  }

  // ── Lists ────────────────────────────────────────────────────────────────
  async getLists(req, res) {
    try {
      const lists = await this.lists.listLists();
      res.json({ success: true, lists });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async createList(req, res) {
    try {
      const { name, type } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Внесете име на листата.' });
      const list = await this.lists.createList({ name, type, createdBy: req.user?._id });
      res.json({ success: true, list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async updateList(req, res) {
    try {
      const list = await this.lists.updateList(req.params.id, req.body || {});
      if (!list) return res.status(404).json({ success: false, message: 'Листата не постои.' });
      res.json({ success: true, list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async deleteList(req, res) {
    try {
      const ok = await this.lists.deleteList(req.params.id);
      res.json({ success: ok });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async mergeLists(req, res) {
    try {
      const { targetId, sourceIds } = req.body || {};
      if (!targetId) return res.status(400).json({ success: false, message: 'Недостасува целна листа.' });
      const result = await this.lists.mergeLists(targetId, sourceIds);
      if (!result) return res.status(404).json({ success: false, message: 'Целната листа не постои.' });
      res.json({ success: true, ...result });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  async getContacts(req, res) {
    try {
      const contacts = await this.lists.listContacts(req.params.id, { status: req.query.status });
      res.json({ success: true, contacts });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async addContact(req, res) {
    try {
      const r = await this.lists.addContact(req.params.id, req.body || {});
      if (!r.ok) {
        const msg = r.reason === 'duplicate' ? 'Овој е-маил веќе постои во листата.'
          : r.reason === 'bad_email' ? 'Невалиден е-маил.' : 'Не може да се додаде.';
        return res.status(400).json({ success: false, message: msg });
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async importContacts(req, res) {
    try {
      const stats = await this.lists.bulkImport(req.params.id, req.body?.text || '');
      res.json({ success: true, ...stats });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async updateContact(req, res) {
    try {
      const c = await this.lists.updateContact(req.params.contactId, req.body || {});
      if (!c) return res.status(404).json({ success: false, message: 'Контактот не постои.' });
      res.json({ success: true, contact: c });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async deleteContact(req, res) {
    try {
      const ok = await this.lists.deleteContact(req.params.contactId);
      res.json({ success: ok });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  /**
   * CSV export.
   *   ?listId=<id> → a single list, flat table.
   *   (no listId)  → ALL contacts in one file, split by list name with a section
   *                  header per list and a per-list running number.
   */
  async exportCsv(req, res) {
    try {
      const esc = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const listId = req.query.listId || null;
      let lines;
      let name;

      if (listId) {
        // Single list — flat table (unchanged behaviour).
        const rows = await this.lists.exportRows(listId);
        const cols = ['email', 'name', 'company', 'list', 'type', 'status'];
        lines = [cols.join(',')];
        for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(','));
        name = 'contacts-list';
      } else {
        // All lists — one file, split by list name, numbered within each list.
        const groups = await this.lists.exportGrouped();
        const cols = ['Бр.', 'Име', 'Е-маил', 'Компанија', 'Статус'];
        lines = [];
        for (const g of groups) {
          if (lines.length) lines.push('');                       // blank row between lists
          lines.push(esc(`=== ${g.name} (${g.type}) — ${g.contacts.length} контакти ===`));
          lines.push(cols.join(','));
          g.contacts.forEach((c, i) => {
            lines.push([i + 1, esc(c.name), esc(c.email), esc(c.company), esc(c.status)].join(','));
          });
        }
        if (!lines.length) lines.push('Нема контакти.');
        name = 'contacts-all';
      }

      // Prepend a UTF-8 BOM so Excel reads the Cyrillic correctly.
      const csv = '﻿' + lines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
      res.send(csv);
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  // ── Drip settings + control ────────────────────────────────────────────────
  async getSettings(req, res) {
    try {
      const settings = await this.settings.get();
      const [basic, pro] = await Promise.all([
        this.lists.statsByType('basic', settings.basic.listId),
        this.lists.statsByType('pro', settings.pro.listId),
      ]);
      res.json({ success: true, settings, stats: { basic, pro } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  async updateSettings(req, res) {
    try {
      const settings = await this.settings.update({ ...(req.body || {}), updatedBy: req.user?._id });
      res.json({ success: true, settings });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  /** Pause / resume the drip — the master switch, effective on the next run. */
  async setEnabled(req, res) {
    try {
      const settings = await this.settings.setEnabled(!!req.body?.enabled, req.user?._id);
      res.json({ success: true, settings });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }

  /** Manually fire a drip pass now (still respects pause + daily top-up). */
  async runNow(req, res) {
    try {
      if (!this.scheduler) return res.status(503).json({ success: false, message: 'Дрип не е достапен.' });
      const result = await this.scheduler.runNow();
      res.json({ success: true, result });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  }
}

module.exports = OutreachController;
