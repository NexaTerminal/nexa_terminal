import { createContext, useContext } from 'react';

/**
 * Marks that a document form is being rendered in the PUBLIC share flow
 * (/dokument/:token) rather than the authenticated terminal. Default false.
 *
 * Step components read this to hide auth-only pieces (e.g. the "upload existing act"
 * extractor, which hits an authenticated endpoint) when a stranger is filling the form.
 */
export const PublicModeContext = createContext(false);

export const usePublicMode = () => useContext(PublicModeContext);
