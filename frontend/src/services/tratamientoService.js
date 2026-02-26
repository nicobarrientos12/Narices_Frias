// src/services/tratamientoService.js
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

const TRAT_ENV = import.meta.env.VITE_API_TRATAMIENTOS; // opcional override, p.ej. https://api.tuapp.com/api/tratamientos

const getToken = () => localStorage.getItem('token');

const withAuth = (extra = {}) => {
  const t = getToken();
  return { ...extra, ...(t ? { Authorization: `Bearer ${t}` } : {}) };
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

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: withAuth({ ...(opts.headers || {}) }),
    method: opts.method || 'GET',
    body: opts.body,
  });

  if (res.status === 204) return { ok: true };
  if (res.status === 401) { handle401(); throw new Error('No autorizado'); }

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.error || `Error HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Intenta varios endpoints por si tu backend varía entre singular/plural */
const baseCandidates = () => [
  ...(TRAT_ENV ? [TRAT_ENV] : []),
  `${API_BASE}/tratamientos`,
  `${API_BASE}/tratamiento`,
  `http://localhost:3001/api/tratamientos`,
  `http://localhost:3001/api/tratamiento`,
];

async function tryMany(urls, fn) {
  let last;
  for (const u of urls) {
    try { return await fn(u); } catch (e) { last = e; }
  }
  throw last || new Error('No se pudo resolver endpoint de tratamientos');
}

/** Extrae un array desde distintas envolturas comunes */
function extractList(payload) {
  if (Array.isArray(payload)) return payload;

  // Si viene como { data: [...] } o { rows: [...] } o { items: [...] } etc
  const keys = ['data', 'rows', 'items', 'result', 'results', 'content', 'records', 'tratamientos', 'list'];
  for (const k of keys) {
    const v = payload?.[k];
    if (Array.isArray(v)) return v;
    // forma { data: { rows: [...] } }
    if (v && typeof v === 'object') {
      for (const kk of keys) {
        if (Array.isArray(v[kk])) return v[kk];
      }
    }
  }

  // Si el backend devuelve un objeto con una sola propiedad que es array
  if (payload && typeof payload === 'object') {
    const firstArray = Object.values(payload).find(Array.isArray);
    if (Array.isArray(firstArray)) return firstArray;
  }

  // No encontramos array: devuelve vacío
  return [];
}

/** ===================== API pública ===================== **/

export const getAllTratamientos = async () => {
  const arr = await tryMany(baseCandidates(), (u) => fetchJSON(u));
  const list = extractList(arr);
  // Opcional: dejar para depurar rápido en navegador
  if (typeof window !== 'undefined') window.__TRAT_LIST__ = list;
  return list;
};

export const getTratamientoById = async (id) => {
  const urls = baseCandidates().map(b => `${b}/${id}`);
  const payload = await tryMany(urls, (u) => fetchJSON(u));
  // para detalle normalmente viene objeto, pero por si acaso:
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

export const crearTratamiento = async (payload) => {
  const b = baseCandidates()[0];
  const res = await fetchJSON(b, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res;
};

export const actualizarTratamiento = async (id, payload) => {
  const urls = baseCandidates().map(b => `${b}/${id}`);
  return tryMany(urls, (u) =>
    fetchJSON(u, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );
};

export const eliminarTratamiento = async (id) => {
  const urls = baseCandidates().map(b => `${b}/${id}`);
  return tryMany(urls, (u) => fetchJSON(u, { method: 'DELETE' }));
};
