// src/services/postAdopcionService.js

// Base flexible
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

const API_ROOT = (import.meta.env.VITE_API_ROOT || import.meta.env.VITE_API_BASE || 'http://localhost:3001')
  .replace(/\/api\/?$/i, '');

// Permite override específico (puede ser "ruta" o URL completa)
const POST_ADOP_ENV = import.meta.env.VITE_API_POST_ADOPCION;

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

async function parseResponse(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text || null; }
}

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
    throw Object.assign(new Error('No autorizado'), { status: 401 });
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Error HTTP ${res.status}`;
    const err = Object.assign(new Error(msg), { status: res.status, data });
    throw err;
  }
  // normalizamos
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

async function fetchBLOB(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: withAuth(opts.headers || {}),
    method: opts.method || 'GET',
    body: opts.body || undefined,
  });

  if (res.status === 401) {
    handle401();
    throw Object.assign(new Error('No autorizado'), { status: 401 });
  }

  if (!res.ok) {
    const err = Object.assign(new Error(`Error HTTP ${res.status}`), { status: res.status });
    throw err;
  }
  return res.blob();
}

/* ====================== CANDIDATOS DE ENDPOINT ====================== */

// Construye lista de URLs candidatas a partir de "paths" posibles
function makeUrlCandidatesFromPaths(paths) {
  const clean = (s) => String(s || '').replace(/^\/+|\/+$/g, '');
  const isFullUrl = (s) => /^https?:\/\//i.test(s);

  const baseCandidates = [];
  for (const p of paths) {
    if (!p) continue;
    if (isFullUrl(p)) {
      baseCandidates.push(clean(p));
    } else {
      baseCandidates.push(`${API_BASE}/${clean(p)}`);
      baseCandidates.push(`http://localhost:3001/api/${clean(p)}`);
    }
  }
  // dedup
  return [...new Set(baseCandidates)];
}

// paths de recurso (acepta varios estilos/nombres)
function postAdopResourcePaths() {
  const env = POST_ADOP_ENV && String(POST_ADOP_ENV).trim();
  const envPath = env ? env.replace(/^\/+|\/+$/g, '') : null;

  return [
    envPath,                      // override (ruta o url)
    'post-adopcion',
    'postAdopcion',
    'post_adopcion',
    'seguimiento-postadopcion',
    'seguimientos-postadopcion',
    'seguimientos',
    'seguimiento',
  ].filter(Boolean);
}

function postAdopUrls() {
  return makeUrlCandidatesFromPaths(postAdopResourcePaths());
}

async function tryMany(urls, fn) {
  let lastErr = null;
  for (const url of urls) {
    try {
      return await fn(url);
    } catch (e) {
      lastErr = e;
      // seguimos probando; si todas fallan, devolvemos la última
      continue;
    }
  }
  throw lastErr || new Error('No se pudo resolver endpoint de Post-Adopción');
}

/* ====================== HELPERS PAYLOAD ====================== */

const isFileish = (v) =>
  (typeof File !== 'undefined' && v instanceof File) ||
  (typeof Blob !== 'undefined' && v instanceof Blob);

const hasPhoto = (payload) => {
  const f = payload?.foto_url;
  return !!f && isFileish(f);
};

const toFormData = (obj = {}) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return; // omitimos undefined/null
    fd.append(k, v);
  });
  return fd;
};

const asJSON = (obj = {}) => JSON.stringify(obj);

/** ===================== ENDPOINTS ESPECIALES ===================== **/

// 📌 Lista de adopciones disponibles (para reportes/form)
export const fetchAdopcionesDisponibles = async () => {
  const resourceBases = postAdopUrls(); // p.ej. .../post-adopcion, .../seguimientos, etc.
  const candidates = [
    // relativo al recurso:
    ...resourceBases.map((b) => `${b}/adopciones-disponibles`),
    // rutas más generales:
    `${API_BASE}/adopciones/disponibles`,
    `${API_BASE}/adopciones-activas`,
    `${API_BASE}/adopciones`,
    `http://localhost:3001/api/adopciones/disponibles`,
    `http://localhost:3001/api/adopciones-activas`,
    `http://localhost:3001/api/adopciones`,
  ];
  const data = await tryMany(candidates, (u) => fetchJSON(u));
  const list = Array.isArray(data) ? data : (data || []);
  return list.map((a) => {
    const mascota = a.mascota || a.nombre_mascota || a.nombreMascota || '';
    const dueno = a.dueno || a.nombre_dueno || a.nombreDueno || '';
    const fotoUrl = a.foto_url || a.fotoUrl || null;
    const fullFoto =
      !fotoUrl ? null :
      /^https?:\/\//i.test(String(fotoUrl)) ? fotoUrl :
      String(fotoUrl).startsWith('/') ? `${API_ROOT}${fotoUrl}` : `${API_ROOT}/${fotoUrl}`;
    return { ...a, mascota, dueno, foto_url: fotoUrl, foto_url_full: fullFoto };
  });
};

// 📌 Vista previa de reportes por adopción (JSON)
export const fetchPreview = async (adopcionId) => {
  if (!adopcionId) throw new Error('adopcionId requerido');
  const candidates = [
    ...postAdopUrls().map((b) => `${b}/preview?adopcionId=${adopcionId}`),
    `${API_BASE}/post-adopcion/preview?adopcionId=${adopcionId}`,
    `http://localhost:3001/api/post-adopcion/preview?adopcionId=${adopcionId}`,
  ];
  const data = await tryMany(candidates, (u) => fetchJSON(u));
  return data || [];
};

// 📌 Generar PDF → devuelve Blob
export const downloadPDF = async (adopcionId) => {
  if (!adopcionId) throw new Error('adopcionId requerido');
  const candidates = [
    ...postAdopUrls().map((b) => `${b}/reporte/pdf?adopcionId=${adopcionId}`),
    `${API_BASE}/post-adopcion/reporte/pdf?adopcionId=${adopcionId}`,
    `http://localhost:3001/api/post-adopcion/reporte/pdf?adopcionId=${adopcionId}`,
  ];
  return await tryMany(candidates, (u) => fetchBLOB(u));
};

/** ===================== CRUD SEGUIMIENTOS ===================== **/

export const fetchSeguimientos = async () => {
  // GET a la colección
  const data = await tryMany(postAdopUrls(), (u) => fetchJSON(u));
  return Array.isArray(data) ? data : (data || []);
};

export const fetchSeguimiento = async (id) => {
  if (!id) throw new Error('ID requerido');
  const urls = postAdopUrls().map((b) => `${b}/${id}`);
  const data = await tryMany(urls, (u) => fetchJSON(u));
  return data || {};
};
// helpers nuevos:
// === helpers nuevos ===
const isFormData = (v) => typeof FormData !== 'undefined' && v instanceof FormData;

const toYMD = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(val));
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(val);
  return isNaN(d) ? null : d.toISOString().slice(0,10);
};

const toFormDataNormalized = (payload) => {
  // payload puede venir como objeto plano (con File) o ya como FormData.
  if (isFormData(payload)) {
    // Aseguramos fecha en YYYY-MM-DD si viene en otro formato
    if (payload.has('fecha')) {
      const norm = toYMD(payload.get('fecha'));
      if (norm) { payload.set('fecha', norm); }
    }
    return payload;
  }
  const fd = new FormData();
  if (payload?.adopcion_id != null) fd.append('adopcion_id', String(Number(payload.adopcion_id)));
  const ymd = toYMD(payload?.fecha); if (ymd) fd.append('fecha', ymd);
  if (payload?.observaciones != null) fd.append('observaciones', String(payload.observaciones).trim());
  if (isFileish(payload?.foto_url)) fd.append('foto_url', payload.foto_url); // clave correcta
  return fd;
};

const willSendMultipart = (payload) => {
  // true si ya es FormData o si hay File/Blob en payload.foto_url
  return isFormData(payload) || hasPhoto(payload);
};

export const createSeguimiento = async (payload) => {
  const urls = postAdopUrls();
  const tryOn = async (url) => {
    if (willSendMultipart(payload)) {
      const fd = toFormDataNormalized(payload);
      return fetchJSON(url, { method: 'POST', body: fd }); // sin Content-Type
    } else {
      return fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: asJSON({
          adopcion_id: Number(payload?.adopcion_id),
          fecha: toYMD(payload?.fecha),
          observaciones: (payload?.observaciones || '').trim() || null,
        }),
      });
    }
  };
  return tryMany(urls, tryOn);
};

export const updateSeguimiento = async (id, payload) => {
  if (!id) throw new Error('ID requerido');
  const urls = postAdopUrls().map((b) => `${b}/${id}`);
  const tryOn = async (url) => {
    if (willSendMultipart(payload)) {
      const fd = toFormDataNormalized(payload);
      return fetchJSON(url, { method: 'PUT', body: fd }); // sin Content-Type
    } else {
      return fetchJSON(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: asJSON({
          adopcion_id: Number(payload?.adopcion_id),
          fecha: toYMD(payload?.fecha),
          observaciones: (payload?.observaciones || '').trim() || null,
        }),
      });
    }
  };
  return tryMany(urls, tryOn);
};



export const deleteSeguimiento = async (id) => {
  if (!id) throw new Error('ID requerido');
  const urls = postAdopUrls().map((b) => `${b}/${id}`);
  return await tryMany(urls, (u) => fetchJSON(u, { method: 'DELETE' }));
};
