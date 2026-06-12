const API_BASE = '/api/auto-documents/company-changes';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrThrow(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Грешка (${res.status})`);
  }
  return data;
}

/**
 * Upload the user's real incorporation act (.docx) and get a structured snapshot
 * of the current registered state (company, shareholders, managers, articleMap).
 */
export async function extractAct(file) {
  const formData = new FormData();
  formData.append('act', file);
  const res = await fetch(`${API_BASE}/extract-act`, {
    method: 'POST',
    headers: authHeader(),
    body: formData
  });
  return parseOrThrow(res);
}

/**
 * Amend the user's uploaded act in place (name/seat changes) and download the
 * edited .docx. Returns { unmatched } — labels whose old text wasn't found.
 */
export async function amendActDownload(actId, formData) {
  const res = await fetch(`${API_BASE}/amend-act`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ actId, formData })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Грешка (${res.status})`);
  }
  const unmatchedHeader = res.headers.get('X-Unmatched');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'izmenet-akt.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return { unmatched: unmatchedHeader ? decodeURIComponent(unmatchedHeader) : '' };
}
