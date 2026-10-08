import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ChatDockContext — controls the Facebook-style docked chat balloons.
 * Several agent windows can be open at once, lined up along the footer.
 * Mounted once in App so they persist across terminal navigation.
 *
 * windows: [{ key, minimized }] — order is open-order; the dock renders them
 * right-aligned (newest nearest the edge). Capped so they can't overflow.
 */
const ChatDockContext = createContext(null);

const MAX_WINDOWS = 3;

export function ChatDockProvider({ children }) {
  const [windows, setWindows] = useState([]);

  // openChat(key) — just open. openChat(key, { seed }) — open and auto-ask the
  // seed message (used to hand an artifact to an agent for review). seedId lets
  // the window detect a fresh seed even if it's already open.
  // opts.context = { kind, label, data } — the artifact (document / LHC / case)
  // the thread is about; handed to the server so the character answers about it.
  const openChat = useCallback((key, opts = {}) => {
    if (!key) return;
    const seed = opts.seed || null;
    const context = opts.context || null;
    const seedId = seed ? Date.now() : 0;
    setWindows((prev) => {
      const existing = prev.find((w) => w.key === key);
      if (existing) {
        const updated = { ...existing, minimized: false };
        if (seed) { updated.seed = seed; updated.seedId = seedId; updated.context = context; }
        return [...prev.filter((w) => w.key !== key), updated];
      }
      const next = [...prev, { key, minimized: false, seed, seedId, context }];
      return next.slice(-MAX_WINDOWS);
    });
  }, []);

  const closeChat = useCallback((key) => {
    setWindows((prev) => prev.filter((w) => w.key !== key));
  }, []);

  const toggleMinimize = useCallback((key) => {
    setWindows((prev) => prev.map((w) => (w.key === key ? { ...w, minimized: !w.minimized } : w)));
  }, []);

  return (
    <ChatDockContext.Provider value={{ windows, openChat, closeChat, toggleMinimize }}>
      {children}
    </ChatDockContext.Provider>
  );
}

export function useChatDock() {
  return useContext(ChatDockContext) || {};
}
