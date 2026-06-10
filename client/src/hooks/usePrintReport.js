import { useState, useEffect } from 'react';

/**
 * Print helper for compliance/screening reports.
 *
 * Report pages keep their detailed findings inside collapsible sections that
 * are only mounted when expanded. Printing the raw on-screen DOM would omit any
 * collapsed section. This hook exposes a `printing` flag that components OR into
 * their collapse conditions, so every section is forced open for the print
 * render. After the (synchronous, blocking) print dialog closes, the flag is
 * reset and the sections collapse back to their previous state.
 *
 * Usage:
 *   const [printing, handlePrint] = usePrintReport();
 *   {(printing || expandedCategories[name]) && (<DetailedFindings />)}
 *   <button onClick={handlePrint}>Print</button>
 *
 * @returns {[boolean, () => void]} the printing flag and the print handler
 */
export default function usePrintReport() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    // DOM is committed with every section expanded before effects run.
    window.print();
    setPrinting(false);
  }, [printing]);

  return [printing, () => setPrinting(true)];
}
