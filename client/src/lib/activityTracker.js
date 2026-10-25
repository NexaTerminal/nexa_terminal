import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Activity tracker for the admin timeline („Активност (хронолошки)").
 *
 * For logged-in users only: every page opened (with ACTIVE time — tab visible,
 * focused, input within the last 60 s — and max scroll depth), every click on a
 * link/button (visible label only, never typed text), and session starts.
 * Batched to POST /api/activity/events every 10 s, on route change and on exit.
 */

const API = process.env.REACT_APP_API_URL || '/api';
const FLUSH_MS = 10000;
const TICK_MS = 2000;
const IDLE_MS = 60000;
const SESSION_GAP_MS = 30 * 60000;

const state = {
  token: null,
  queue: [],
  page: null,        // { path, at, activeMs, scrollPct, title }
  lastInput: Date.now(),
  lastTick: Date.now(),
};

const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

// One id per tab; a new session (and a session_start event) after 30 min idle.
function sessionId() {
  const now = Date.now();
  let sid = store.get('nx_sid');
  const last = Number(store.get('nx_sid_last') || 0);
  if (!sid || now - last > SESSION_GAP_MS) {
    sid = `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    store.set('nx_sid', sid);
    state.queue.push({ kind: 'session_start', at: new Date(now).toISOString(), sessionId: sid, path: window.location.pathname });
  }
  store.set('nx_sid_last', String(now));
  return sid;
}

function enqueue(event) {
  state.queue.push({ ...event, sessionId: sessionId(), at: event.at || new Date().toISOString() });
}

function flush() {
  if (!state.token || state.queue.length === 0) return;
  const events = state.queue.splice(0, 50);
  try {
    fetch(`${API}/activity/events`, {
      method: 'POST',
      keepalive: true, // survives tab close / navigation away
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ events }),
    }).catch(() => {});
  } catch { /* never break the app for analytics */ }
  if (state.queue.length) flush();
}

// Page title: the page's own heading is more telling than the global <title>.
function pageTitle() {
  const h = document.querySelector('main h1, h1, h2');
  const t = (h?.textContent || document.title || '').replace(/\s+/g, ' ').trim();
  return t.slice(0, 120);
}

function tick() {
  const now = Date.now();
  const active = document.visibilityState === 'visible' && document.hasFocus() && now - state.lastInput < IDLE_MS;
  if (state.page && active) state.page.activeMs += now - state.lastTick;
  state.lastTick = now;
}

function startPage(path) {
  state.page = { path, at: new Date().toISOString(), activeMs: 0, scrollPct: 0, title: '' };
  state.lastTick = Date.now();
  const page = state.page;
  setTimeout(() => {
    if (state.page !== page) return;
    page.title = pageTitle();
    // A page that fits on screen counts as fully seen; otherwise start from what's visible.
    const el = document.scrollingElement;
    if (el && el.scrollHeight) page.scrollPct = Math.max(page.scrollPct, Math.min(100, (el.clientHeight / el.scrollHeight) * 100));
  }, 1500);
}

function endPage() {
  if (!state.page) return;
  tick();
  const p = state.page;
  state.page = null;
  enqueue({ kind: 'page_view', at: p.at, path: p.path, title: p.title || pageTitle(),
    activeMs: Math.round(p.activeMs), scrollPct: Math.round(p.scrollPct) });
}

function onInput() { state.lastInput = Date.now(); }

// Scroll depth from whichever element scrolled (terminal pages scroll inner panels).
function onScroll(e) {
  onInput();
  if (!state.page) return;
  const el = e.target === document || e.target === document.documentElement ? document.scrollingElement : e.target;
  if (!el || !el.scrollHeight) return;
  const pct = el.scrollHeight <= el.clientHeight ? 100 : ((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100;
  if (pct > state.page.scrollPct) state.page.scrollPct = Math.min(100, pct);
}

function onClick(e) {
  onInput();
  const el = e.target?.closest?.('a, button, [role="button"], [role="tab"], [role="menuitem"], summary');
  if (!el || el.closest('input, textarea, [contenteditable="true"]')) return;
  const text = (el.getAttribute('aria-label') || el.title || el.innerText || '').replace(/\s+/g, ' ').trim();
  const href = el.tagName === 'A' ? el.getAttribute('href') : null;
  enqueue({ kind: 'click', path: window.location.pathname, label: text.slice(0, 80) || href || el.tagName.toLowerCase(),
    target: href ? href.split('?')[0].slice(0, 300) : undefined });
}

function onHide() {
  if (document.visibilityState === 'hidden') {
    // Record what we have so far (the tab may never come back), then resume on return.
    const path = state.page?.path;
    endPage();
    flush();
    if (path) state.resumePath = path;
  } else if (state.resumePath && !state.page) {
    startPage(state.resumePath);
    state.resumePath = null;
  }
}

function onPageHide() { endPage(); flush(); }

/** Mount once inside the Router; tracks only while logged in. */
export function ActivityTracker() {
  const { token } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    state.token = token || null;
    if (!token) return undefined;
    const tickIv = setInterval(tick, TICK_MS);
    const flushIv = setInterval(flush, FLUSH_MS);
    const opts = { passive: true, capture: true };
    window.addEventListener('mousemove', onInput, opts);
    window.addEventListener('keydown', onInput, opts);
    window.addEventListener('touchstart', onInput, opts);
    document.addEventListener('scroll', onScroll, opts);
    document.addEventListener('click', onClick, true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      endPage(); flush();
      clearInterval(tickIv); clearInterval(flushIv);
      window.removeEventListener('mousemove', onInput, opts);
      window.removeEventListener('keydown', onInput, opts);
      window.removeEventListener('touchstart', onInput, opts);
      document.removeEventListener('scroll', onScroll, opts);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [token]);

  // Every route change closes the previous page view and opens the next.
  useEffect(() => {
    if (!token) return;
    endPage();
    startPage(pathname);
    flush();
  }, [pathname, token]);

  return null;
}
