// Shared MK labels + helpers for the Предмети (cases) feature. Kept in one place
// so the list, detail, and public status page stay in sync with the server enums
// (see server/services/casesService.js).

export const CASE_TYPE_LABEL = {
  parnica: 'Парница',
  krivicno: 'Кривично',
  upravna: 'Управна постапка',
  dogovorno: 'Договорно',
  nasledstvo: 'Наследство',
  rabotni: 'Работни односи',
  izvrsuvanje: 'Извршување',
  registracija: 'Регистрација',
  drugo: 'Друго'
};

export const STATUS_LABEL = {
  open: 'Отворен',
  in_progress: 'Во тек',
  waiting: 'На чекање',
  closed: 'Затворен',
  archived: 'Архивиран'
};

// Maps a status to a Contracts.module.css badge variant class name.
export const STATUS_BADGE = {
  open: 'badge_active',
  in_progress: 'badge_renewed',
  waiting: 'badge_expiring',
  closed: 'badge_terminated',
  archived: 'badge_expired'
};

export const PRIORITY_LABEL = { low: 'Низок', normal: 'Нормален', high: 'Висок' };

export const DEADLINE_TYPE_LABEL = {
  rociste: 'Рочиште',
  zalba: 'Жалба',
  podnesok: 'Поднесок',
  zastarenost: 'Застареност',
  plakanje: 'Плаќање',
  drugo: 'Друго'
};

export const TIMELINE_TYPE_LABEL = {
  sostanok: 'Состанок',
  podnesok: 'Поднесок',
  rociste: 'Рочиште',
  telefon: 'Телефонски разговор',
  eposhta: 'Е-пошта',
  napomena: 'Белешка',
  drugo: 'Друго'
};

export const CASE_TYPE_OPTIONS = Object.entries(CASE_TYPE_LABEL).map(([value, label]) => ({ value, label }));
export const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }));
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABEL).map(([value, label]) => ({ value, label }));
export const DEADLINE_TYPE_OPTIONS = Object.entries(DEADLINE_TYPE_LABEL).map(([value, label]) => ({ value, label }));
export const TIMELINE_TYPE_OPTIONS = Object.entries(TIMELINE_TYPE_LABEL).map(([value, label]) => ({ value, label }));

// The public status link a lawyer hands to a client must ALWAYS be the real,
// production URL (leads.nexa.mk) — never localhost — since it is copied and sent
// out. This is intentionally host-independent, so it reads correctly even while
// testing on localhost / leads.localhost.
export const publicCaseUrl = (token) => `https://leads.nexa.mk/predmet/${token}`;

const MK_MONTHS_SHORT = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];

// toLocaleDateString('mk-MK') is unreliable across browsers — format manually.
export const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return `${date.getDate()} ${MK_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

const DAY_MS = 86400000;
export const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / DAY_MS) : null);

export const dueLabel = (d) => {
  const n = daysLeft(d);
  if (n === null) return '';
  if (n < 0) return `пред ${Math.abs(n)} дена`;
  if (n === 0) return 'денес';
  if (n === 1) return 'утре';
  return `за ${n} дена`;
};
