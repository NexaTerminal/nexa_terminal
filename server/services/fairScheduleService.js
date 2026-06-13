/**
 * Virtual fair open/close schedule.
 *
 * Modes (admin settings doc):
 *   mode: 'manual' (DEFAULT) → fair is CLOSED unless an admin-scheduled edition
 *     (customOpensAt + customClosesAt) is active/upcoming. No automatic openings.
 *   mode: 'auto'   → open during the last N days (default 7) of each calendar
 *     quarter (windows ending Mar 31, Jun 30, Sep 30, Dec 31).
 *   mode: 'open'   → force open.
 *   mode: 'closed' → force closed, but still reports the next auto window.
 *
 * A scheduled edition (customOpensAt + customClosesAt) ALWAYS takes precedence
 * over 'manual'/'auto'/'closed' until its close date passes — so the admin can
 * keep the fair manual-only and simply schedule the next opening on demand.
 * ('open' force-open is the only thing that overrides a scheduled edition.)
 *
 * All pure functions here (no DB). The controller loads/saves the settings doc.
 */

const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_MODE = 'manual';
const VALID_MODES = ['manual', 'auto', 'open', 'closed'];

// Window of the last `windowDays` days for a quarter whose last day is `end`.
function windowForEnd(end, windowDays) {
  const closesAt = new Date(end); closesAt.setHours(23, 59, 59, 999);
  const opensAt = new Date(end);
  opensAt.setDate(opensAt.getDate() - (windowDays - 1));
  opensAt.setHours(0, 0, 0, 0);
  return { opensAt, closesAt };
}

// All quarter windows for this year + next, sorted by start.
function allWindows(now, windowDays) {
  const y = now.getFullYear();
  const wins = [];
  for (const yr of [y, y + 1]) {
    for (const m of [3, 6, 9, 12]) {           // new Date(yr, m, 0) = last day of month m
      wins.push(windowForEnd(new Date(yr, m, 0), windowDays));
    }
  }
  return wins.sort((a, b) => a.opensAt - b.opensAt);
}

// The relevant auto window: the one currently active, else the next upcoming.
function autoWindow(now, windowDays = DEFAULT_WINDOW_DAYS) {
  const wins = allWindows(now, windowDays);
  for (const w of wins) if (now >= w.opensAt && now <= w.closesAt) return { ...w, open: true };
  for (const w of wins) if (w.opensAt > now) return { ...w, open: false };
  return { ...wins[wins.length - 1], open: false };
}

/**
 * Resolve the effective fair status from settings + current time.
 * @returns {{ open:boolean, opensAt:Date|null, closesAt:Date|null, mode:string }}
 */
function getFairStatus(settings = {}, now = new Date()) {
  const windowDays = Number(settings.windowDays) || DEFAULT_WINDOW_DAYS;
  const mode = VALID_MODES.includes(settings.mode) ? settings.mode : DEFAULT_MODE;

  // Force open always wins.
  if (mode === 'open') {
    const auto = autoWindow(now, windowDays);
    return { open: true, opensAt: auto.opensAt, closesAt: auto.closesAt, mode: 'open' };
  }

  // A scheduled edition that hasn't ended yet takes precedence over the base mode.
  if (settings.customOpensAt && settings.customClosesAt) {
    const o = new Date(settings.customOpensAt);
    const c = new Date(settings.customClosesAt);
    if (now <= c) {
      return { open: now >= o && now <= c, opensAt: o, closesAt: c, mode: 'custom' };
    }
    // past the scheduled window → fall through to the base mode
  }

  // Manual: closed, nothing auto-scheduled (admin opens on demand).
  if (mode === 'manual') {
    return { open: false, opensAt: null, closesAt: null, mode: 'manual' };
  }

  // Closed: closed, but report the next auto window for reference.
  if (mode === 'closed') {
    const auto = autoWindow(now, windowDays);
    return { open: false, opensAt: auto.opensAt, closesAt: auto.closesAt, mode: 'closed' };
  }

  // Auto.
  const auto = autoWindow(now, windowDays);
  return { open: auto.open, opensAt: auto.opensAt, closesAt: auto.closesAt, mode: 'auto' };
}

module.exports = { DEFAULT_WINDOW_DAYS, DEFAULT_MODE, VALID_MODES, autoWindow, getFairStatus };
