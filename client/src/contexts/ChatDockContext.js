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

  const openChat = useCallback((key) => {
    if (!key) return;
    setWindows((prev) => {
      const existing = prev.find((w) => w.key === key);
      if (existing) {
        // Already open — just un-minimize and bring it forward.
        return [...prev.filter((w) => w.key !== key), { key, minimized: false }];
      }
      const next = [...prev, { key, minimized: false }];
      // Drop the oldest if we exceed the cap.
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
