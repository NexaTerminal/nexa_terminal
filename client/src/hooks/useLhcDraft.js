import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Autosave/resume for LHC questionnaires. Persists a draft (answers + any extra
 * state) to localStorage so a long assessment can be finished later, and clears
 * it on submit. Draft is read synchronously on first render via `initialDraft`
 * so questionnaire state can be initialised from it without a clobber race.
 *
 * @param {string} moduleKey  unique per questionnaire (e.g. 'gdpr', 'employment')
 */
export default function useLhcDraft(moduleKey) {
  const storageKey = `lhc_draft_${moduleKey}`;
  const timer = useRef(null);

  // Read once, synchronously, on the first render.
  const initialRef = useRef(undefined);
  if (initialRef.current === undefined) {
    try {
      const raw = localStorage.getItem(storageKey);
      initialRef.current = raw ? JSON.parse(raw) : null;
    } catch {
      initialRef.current = null;
    }
  }

  const [savedAt, setSavedAt] = useState(initialRef.current?._savedAt || null);

  const saveDraft = useCallback((data) => {
    // Nothing meaningful to resume until at least one answer exists.
    if (data && data.answers && Object.keys(data.answers).length === 0) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const payload = { ...data, _savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setSavedAt(payload._savedAt);
      } catch {
        /* storage full / unavailable — ignore, autosave is best-effort */
      }
    }, 500);
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setSavedAt(null);
  }, [storageKey]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { initialDraft: initialRef.current, saveDraft, clearDraft, savedAt };
}
