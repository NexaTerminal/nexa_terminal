const API_BASE = '/api/contract-analysis';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrThrow(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.error || `Грешка (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getUsage() {
  const res = await fetch(`${API_BASE}/usage`, { headers: authHeader() });
  return parseOrThrow(res);
}

export async function uploadContract(file) {
  const formData = new FormData();
  formData.append('contract', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });
  return parseOrThrow(res);
}

export async function analyzeContract({ sessionId, userRole, userAnswers }) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userRole, userAnswers }),
  });
  return parseOrThrow(res);
}
