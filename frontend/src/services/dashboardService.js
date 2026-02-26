// src/services/dashboardService.js

const API_BASE =
  import.meta.env.VITE_API_DASHBOARD ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/dashboard`
    : 'http://localhost:3001/api/dashboard');

const getToken = () => localStorage.getItem('token');

const withAuth = (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle401 = () => {
  try {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  } finally {
    if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
};

const handleResponse = async (res) => {
  if (res.status === 204) return { ok: true };
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401) handle401();
    const message = data?.message || data?.error || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return isJson ? data : res;
};

const toQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const str = q.toString();
  return str ? `?${str}` : '';
};

/* ===================== OVERVIEW NUEVO ===================== */
/** GET /api/dashboard?start=YYYY-MM-DD&end=YYYY-MM-DD */
export async function fetchOverview(params) {
  const res = await fetch(`${API_BASE}${toQuery(params)}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

/* ===================== EXPORTS SERVER ===================== */
async function downloadFile(url, filename) {
  const res = await fetch(url, {
    headers: withAuth(),
    credentials: 'include',
  });
  if (res.status === 401) handle401();
  if (!res.ok) throw new Error(`Fallo al descargar: ${res.status}`);
  const blob = await res.blob();
  const dlUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = dlUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(dlUrl);
}

export async function downloadExcel(params) {
  const url = `${API_BASE}/export/excel${toQuery(params)}`;
  await downloadFile(url, 'dashboard_naf.xlsx');
}

export async function downloadPDF(params) {
  const url = `${API_BASE}/export/pdf${toQuery(params)}`;
  await downloadFile(url, 'dashboard_naf.pdf');
}
