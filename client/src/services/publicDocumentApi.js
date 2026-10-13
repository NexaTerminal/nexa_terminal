/**
 * Public shared-document API (no auth). Backs the /dokument/:token page: fetch the
 * link metadata, and generate + download the .docx via the owner-sponsored endpoint.
 */

const API = '/api/public/documents';

export async function getPublicDocMeta(token) {
  const res = await fetch(`${API}/${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Невалиден или истечен линк.');
  }
  return data;
}

export async function generatePublicDoc(token, formData, fileName = 'dokument') {
  const res = await fetch(`${API}/${encodeURIComponent(token)}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Грешка (${res.status})`);
  }
  const warningsHeader = res.headers.get('X-Generation-Warnings');
  let warnings = [];
  if (warningsHeader) { try { warnings = JSON.parse(warningsHeader); } catch (_) { /* ignore */ } }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return { warnings };
}
