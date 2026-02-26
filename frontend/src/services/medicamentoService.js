// src/services/medicamentoService.js

// BASE flexible por variables de entorno
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

// Permite override específico si lo defines en .env
const MEDICAMENTOS_ENV = import.meta.env.VITE_API_MEDICAMENTOS;

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

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: withAuth(opts.headers || {}),
    method: opts.method || 'GET',
    body: opts.body || undefined,
  });

  if (res.status === 204) return { ok: true };

  if (res.status === 401) {
    handle401();
    throw new Error('No autorizado');
  }

  if (res.status === 404) {
    return { __notFound: true };
  }

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.error || `Error HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // normalizamos
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

// Prueba varias URLs hasta que alguna responda OK (ignora 404 y sigue)
async function tryMany(urls, opts) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const out = await fetchJSON(url, opts);
      if (out && out.__notFound) continue; // probar siguiente
      return out || [];
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('No se pudo resolver endpoint de medicamentos');
}

// ============= Endpoints candidatos (en orden) =============
function medsUrls() {
  return [
    ...(MEDICAMENTOS_ENV ? [MEDICAMENTOS_ENV] : []),
    `${API_BASE}/medicamentos`,
    `${API_BASE}/catalogos/medicamentos`,
    `http://localhost:3001/api/medicamentos`,
  ];
}

/** ===================== CRUD ===================== **/

// Lista (devuelve siempre { data: [] })
export async function getMedicamentos() {
  const data = await tryMany(medsUrls());
  return { data: Array.isArray(data) ? data : (data ? [data] : []) };
}

// Obtener por ID (devuelve siempre { data: {} })
export async function getMedicamentoById(id) {
  const urls = medsUrls().map(base => `${base}/${id}`);
  const data = await tryMany(urls);
  return { data: data || {} };
}

// Crear (acepta objeto JSON)
export async function createMedicamento(payload) {
  const url = medsUrls()[0]; // toma el primero disponible (si definiste env, usa ese)
  const data = await tryMany([url], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { data };
}

// Actualizar
export async function updateMedicamento(id, payload) {
  const urls = medsUrls().map(base => `${base}/${id}`);
  const data = await tryMany(urls, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { data };
}

// Eliminar
export async function deleteMedicamento(id) {
  const urls = medsUrls().map(base => `${base}/${id}`);
  const data = await tryMany(urls, { method: 'DELETE' });
  return { data };
}
