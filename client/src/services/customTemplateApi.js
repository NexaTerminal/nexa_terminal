const API_BASE = '/api/custom-templates';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function listTemplates() {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Грешка при вчитување на шаблоните');
  return res.json();
}

export async function getTemplate(id) {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Шаблонот не е пронајден');
  return res.json();
}

export async function uploadTemplateFile(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Грешка при прикачување');
  }
  return res.json();
}

export async function suggestFields(text) {
  const res = await fetch(`${API_BASE}/suggest-fields`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Грешка при AI анализа');
  const data = await res.json();
  return data.suggestions || [];
}

export async function createTemplate(templateData) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(templateData)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Грешка при креирање на шаблонот');
  }
  return res.json();
}

export async function updateTemplate(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Грешка при ажурирање');
  return res.json();
}

export async function deleteTemplate(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) throw new Error('Грешка при бришење');
  return res.json();
}

export async function generateDocument(id, formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/${id}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ formData })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Грешка при генерирање');
  }

  return res.blob();
}

// Feature #6: Duplicate
export async function duplicateTemplate(id) {
  const res = await fetch(`${API_BASE}/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при дуплирање');
  return res.json();
}

// Feature #3: Versions
export async function getVersions(id) {
  const res = await fetch(`${API_BASE}/${id}/versions`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Грешка при вчитување на верзиите');
  return res.json();
}

export async function rollbackVersion(id, versionId) {
  const res = await fetch(`${API_BASE}/${id}/versions/${versionId}/rollback`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при враќање на верзијата');
  return res.json();
}

// Feature #8: History
export async function getHistory(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/history?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Грешка при вчитување на историјата');
  return res.json();
}

export async function getTemplateHistory(templateId, page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/${templateId}/history?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Грешка при вчитување на историјата');
  return res.json();
}

export async function downloadGeneratedDocument(recordId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/history/${recordId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Грешка при преземање');
  return res.blob();
}

export async function deleteHistoryRecord(recordId) {
  const res = await fetch(`${API_BASE}/history/${recordId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при бришење');
  return res.json();
}

// Feature #4: Marketplace
export async function browsePublicTemplates({ search, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', limit);

  const res = await fetch(`${API_BASE}/public/browse?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Грешка при вчитување');
  return res.json();
}

export async function publishTemplate(id) {
  const res = await fetch(`${API_BASE}/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при објавување');
  return res.json();
}

export async function unpublishTemplate(id) {
  const res = await fetch(`${API_BASE}/${id}/unpublish`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при повлекување');
  return res.json();
}

export async function clonePublicTemplate(id) {
  const res = await fetch(`${API_BASE}/public/${id}/clone`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Грешка при клонирање');
  return res.json();
}

// Feature #7: Bulk Generate
export async function bulkGenerate(templateId, file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('dataFile', file);

  const res = await fetch(`${API_BASE}/${templateId}/bulk-generate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Грешка при масовно генерирање');
  }
  return res.blob();
}
