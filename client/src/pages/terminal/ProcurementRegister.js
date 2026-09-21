import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TerminalShell from '../../components/terminal/TerminalShell';
import procurementApi from '../../services/procurementApi';
import s from './ProcurementRegister.module.css';

/**
 * „Регистар на набавки" — the register is organised around the TYPE of product/
 * service (e.g. Осигурување). Each entry holds the offers the SMB received, lets
 * them pick the best, and carries a renewal date that triggers a re-quote reminder.
 */

const CATEGORIES = [
  'Осигурување', 'ИТ и софтвер', 'Хостинг и домени', 'Маркетинг и реклама',
  'Канцелариска опрема и материјали', 'Информатичка опрема (хардвер)',
  'Транспорт и логистика', 'Градежништво и реновирање', 'Правни услуги',
  'Сметководство и финансии', 'Консалтинг', 'Телекомуникации / Интернет',
  'Производство и индустриска опрема', 'Угостителство и кетеринг',
  'Чистење и одржување', 'Обука и едукација', 'Преведување', 'Друго'
];
const TYPE_MK = { product: 'Производ', service: 'Услуга' };
const EMPTY = { title: '', category: '', type: 'service', renewalDate: '', note: '' };
const EMPTY_OFFER = { supplier: '', amount: '', terms: '', validUntil: '', contact: '', note: '' };

const fmt = (d) => (d ? new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const numAmount = (a) => { const n = String(a || '').replace(/[^\d]/g, ''); return n ? parseInt(n, 10) : null; };
const daysUntil = (d) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

export default function ProcurementRegister() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');
  const [openId, setOpenId] = useState(null);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    procurementApi.list(token)
      .then((d) => setItems(d.items || []))
      .catch(() => notify('err', 'Не може да се вчита регистарот.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3500); };
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setO = (k, v) => setOfferForm((f) => ({ ...f, [k]: v }));

  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items]);
  const shown = useMemo(() => (filter ? items.filter((i) => i.category === filter) : items), [items, filter]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return notify('err', 'Внесете назив на набавката.');
    if (!form.category) return notify('err', 'Изберете тип (категорија).');
    setCreating(true);
    try {
      const r = await procurementApi.create(token, form);
      setItems((prev) => [r.item, ...prev]);
      setForm(EMPTY);
      setOpenId(r.item.id);
      notify('ok', 'Набавката е креирана. Додајте ги понудите подолу.');
    } catch (ex) {
      notify('err', ex.response?.data?.message || 'Грешка при креирање.');
    } finally { setCreating(false); }
  };

  const patch = async (id, body) => {
    try {
      const r = await procurementApi.update(token, id, body);
      setItems((prev) => prev.map((i) => (i.id === id ? r.item : i)));
    } catch (_) { notify('err', 'Измената не успеа.'); }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Да ја избришам „${item.title}“ и сите понуди?`)) return;
    try {
      await procurementApi.remove(token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      notify('ok', 'Избришано.');
    } catch (_) { notify('err', 'Бришењето не успеа.'); }
  };

  const addOffer = async (item) => {
    if (!offerForm.supplier.trim()) return notify('err', 'Внесете назив на добавувачот.');
    try {
      const r = await procurementApi.addOffer(token, item.id, offerForm);
      setItems((prev) => prev.map((i) => (i.id === item.id ? r.item : i)));
      setOfferForm(EMPTY_OFFER);
    } catch (ex) { notify('err', ex.response?.data?.message || 'Грешка при додавање понуда.'); }
  };

  const chooseOffer = async (item, offer) => {
    const r = await procurementApi.updateOffer(token, item.id, offer.id, { chosen: !offer.chosen });
    setItems((prev) => prev.map((i) => (i.id === item.id ? r.item : i)));
  };

  const removeOffer = async (item, offer) => {
    const r = await procurementApi.removeOffer(token, item.id, offer.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? r.item : i)));
  };

  const openItem = (item) => { setOpenId(openId === item.id ? null : item.id); setOfferForm(EMPTY_OFFER); };

  const renderRenewal = (item) => {
    const dleft = daysUntil(item.renewalDate);
    if (item.renewalDate == null) return <span className={s.renewNone}>без датум за обнова</span>;
    const cls = dleft == null ? s.renewOk : dleft < 0 ? s.renewOver : dleft <= (item.reminderDaysBefore || 30) ? s.renewSoon : s.renewOk;
    const txt = dleft < 0 ? `обновата помина (${fmt(item.renewalDate)})` : `обнова: ${fmt(item.renewalDate)}${dleft <= (item.reminderDaysBefore || 30) ? ` · за ${dleft} дена` : ''}`;
    return <span className={cls}>{txt}</span>;
  };

  return (
    <TerminalShell>
      <div className={s.page}>
        <header className={s.header}>
          <span className={s.eyebrow}>Набавки</span>
          <h1 className={s.title}>Регистар на набавки</h1>
          <p className={s.lead}>
            Едно место по тип на набавка (пр. Осигурување, Хостинг, Сметководство).
            Запишете ги понудите што ги добивате, изберете ја најдобрата и поставете
            датум за обнова — ќе ве потсетиме навреме да побарате нови понуди.
          </p>
        </header>

        {toast && <div className={toast.type === 'ok' ? s.toastOk : s.toastErr}>{toast.text}</div>}

        {/* Create */}
        <form className={s.createCard} onSubmit={create}>
          <h2 className={s.cardTitle}>Нова набавка</h2>
          <div className={s.formGrid}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Назив *</span>
              <input className={s.input} value={form.title} maxLength={140}
                     onChange={(e) => setF('title', e.target.value)} placeholder="пр. Осигурување на возен парк" />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Тип / категорија *</span>
              <select className={s.input} value={form.category} onChange={(e) => setF('category', e.target.value)}>
                <option value="">Изберете…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Производ или услуга</span>
              <div className={s.segmented}>
                {[['service', 'Услуга'], ['product', 'Производ']].map(([v, l]) => (
                  <button key={v} type="button" className={form.type === v ? s.segOn : s.seg} onClick={() => setF('type', v)}>{l}</button>
                ))}
              </div>
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Датум за обнова (опционално)</span>
              <input className={s.input} type="date" value={form.renewalDate} onChange={(e) => setF('renewalDate', e.target.value)} />
            </label>
          </div>
          <button type="submit" className={s.btnPrimary} disabled={creating}>
            {creating ? 'Се креира…' : 'Додади набавка'}
          </button>
        </form>

        {/* Filter + list */}
        <div className={s.listHead}>
          <h2 className={s.cardTitle}>Мои набавки</h2>
          <div className={s.filterWrap}>
            <Link to="/terminal/sourcing" className={s.sourcingLink}>Побарај понуди преку Nexa →</Link>
            {categories.length > 1 && (
              <select className={s.filter} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">Сите типови ({items.length})</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className={s.empty}>Се вчитува…</div>
        ) : shown.length === 0 ? (
          <div className={s.empty}>Сè уште немате набавки. Додајте ја првата погоре.</div>
        ) : (
          <div className={s.list}>
            {shown.map((item) => {
              const amounts = item.offers.map((o) => numAmount(o.amount)).filter((n) => n != null);
              const minAmount = amounts.length ? Math.min(...amounts) : null;
              const chosen = item.offers.find((o) => o.chosen);
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className={`${s.row} ${item.status === 'archived' ? s.rowArchived : ''}`}>
                  <button type="button" className={s.rowHead} onClick={() => openItem(item)}>
                    <div className={s.rowMain}>
                      <div className={s.rowTitleWrap}>
                        <span className={s.rowName}>{item.title}</span>
                        <span className={s.catChip}>{item.category}</span>
                        <span className={s.typeChip}>{TYPE_MK[item.type]}</span>
                      </div>
                      <div className={s.rowMeta}>
                        <span className={s.offerCount}>{item.offers.length} понуди</span>
                        {chosen && <span className={s.chosenTag}>Избрано: {chosen.supplier}{chosen.amount ? ` · ${chosen.amount}` : ''}</span>}
                        {renderRenewal(item)}
                      </div>
                    </div>
                    <span className={s.chev}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className={s.rowBody}>
                      {/* Offers */}
                      {item.offers.length > 0 && (
                        <div className={s.offers}>
                          <div className={`${s.offerRow} ${s.offerHeadRow}`}>
                            <span>Добавувач</span><span>Цена</span><span>Услови</span><span>Важи до</span><span></span>
                          </div>
                          {item.offers.map((o) => {
                            const isMin = minAmount != null && numAmount(o.amount) === minAmount;
                            return (
                              <div key={o.id} className={`${s.offerRow} ${o.chosen ? s.offerChosen : ''}`}>
                                <span className={s.offerSupplier}>
                                  {o.supplier}
                                  {o.contact ? <span className={s.offerContact}>{o.contact}</span> : null}
                                </span>
                                <span className={s.offerAmount}>
                                  {o.amount || '—'}
                                  {isMin && <span className={s.minTag}>најниска</span>}
                                </span>
                                <span className={s.offerTerms}>{o.terms || '—'}</span>
                                <span className={s.offerValid}>{o.validUntil ? fmt(o.validUntil) : '—'}</span>
                                <span className={s.offerActions}>
                                  <button type="button" className={o.chosen ? s.btnChosen : s.btnChoose} onClick={() => chooseOffer(item, o)}>
                                    {o.chosen ? '✓ Избрано' : 'Избери'}
                                  </button>
                                  <button type="button" className={s.btnDel} onClick={() => removeOffer(item, o)} aria-label="Избриши понуда">✕</button>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add offer */}
                      <div className={s.addOffer}>
                        <input className={s.oInput} placeholder="Добавувач *" value={offerForm.supplier} onChange={(e) => setO('supplier', e.target.value)} />
                        <input className={s.oInput} placeholder="Цена (пр. 45.000 ден)" value={offerForm.amount} onChange={(e) => setO('amount', e.target.value)} />
                        <input className={s.oInput} placeholder="Услови (испорака/покритие)" value={offerForm.terms} onChange={(e) => setO('terms', e.target.value)} />
                        <input className={s.oInput} type="date" title="Важи до" value={offerForm.validUntil} onChange={(e) => setO('validUntil', e.target.value)} />
                        <input className={s.oInput} placeholder="Контакт" value={offerForm.contact} onChange={(e) => setO('contact', e.target.value)} />
                        <button type="button" className={s.btnAddOffer} onClick={() => addOffer(item)}>+ Понуда</button>
                      </div>

                      {/* Item controls */}
                      <div className={s.itemControls}>
                        <label className={s.ctrl}>
                          <span>Датум за обнова</span>
                          <input className={s.ctrlInput} type="date" value={dateInput(item.renewalDate)}
                                 onChange={(e) => patch(item.id, { renewalDate: e.target.value || null })} />
                        </label>
                        <label className={s.ctrl}>
                          <span>Потсети пред (дена)</span>
                          <input className={s.ctrlNum} type="number" min={1} max={180} value={item.reminderDaysBefore ?? 30}
                                 onChange={(e) => patch(item.id, { reminderDaysBefore: e.target.value })} />
                        </label>
                        <button type="button" className={s.btnGhost} onClick={() => patch(item.id, { status: item.status === 'archived' ? 'active' : 'archived' })}>
                          {item.status === 'archived' ? 'Врати' : 'Архивирај'}
                        </button>
                        <button type="button" className={s.btnDangerGhost} onClick={() => removeItem(item)}>Избриши набавка</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TerminalShell>
  );
}
