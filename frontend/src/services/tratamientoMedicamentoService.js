// Base flexible (usa VITE_API_BASE si viene como https://host, agrega /api)
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

// Permite override exacto del recurso
const TRAT_MED_ENV = import.meta.env.VITE_API_TRAT_MED;

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

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.error || `Error HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

function baseCandidates() {
  const base = TRAT_MED_ENV || `${API_BASE}/tratamiento-medicamento`;
  // variantes + fallbacks
  const candidates = [
    base,
    `${API_BASE}/tratamiento_medicamento`,
    `${API_BASE}/tratamientoMedicamento`,
    `http://localhost:3001/api/tratamiento-medicamento`,
    `http://localhost:3001/api/tratamiento_medicamento`,
    `http://localhost:3001/api/tratamientoMedicamento`,
  ];
  return [...new Set(candidates)];
}

async function tryMany(urls, fn) {
  let lastErr = null;
  for (const url of urls) {
    try {
      return await fn(url);
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('No se pudo resolver endpoint de tratamiento-medicamento');
}

/** ===================== API ===================== **/

export const getAllTratamientoMedicamentos = async () => {
  const data = await tryMany(baseCandidates(), (u) => fetchJSON(u));
  return Array.isArray(data) ? data : (data || []);
};

export const getTratamientoMedicamentoById = async (id) => {
  const urls = baseCandidates().map((b) => `${b}/${id}`);
  return await tryMany(urls, (u) => fetchJSON(u));
};

export const crearTratamientoMedicamento = async (payload) => {
  const url = baseCandidates()[0];
  return await tryMany([url], (u) =>
    fetchJSON(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  );
};

export const actualizarTratamientoMedicamento = async (id, payload) => {
  const urls = baseCandidates().map((b) => `${b}/${id}`);
  return await tryMany(urls, (u) =>
    fetchJSON(u, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  );
};

export const eliminarTratamientoMedicamento = async (id) => {
  const urls = baseCandidates().map((b) => `${b}/${id}`);
  return await tryMany(urls, (u) => fetchJSON(u, { method: 'DELETE' }));
};

/**
 * Crear VARIOS medicamentos para un tratamiento de una sola vez.
 * Soporta dos modos:
 * 1) Si existe /bulk: POST { tratamiento_id, items: [{ medicamento_id, dosis, frecuencia, duracion }, ...] }
 * 2) Fallback: hace múltiples POST /tratamiento-medicamento uno por uno.
 */
export const crearTratamientoMedicamentosMasivo = async ({ tratamiento_id, items }) => {
  if (!Number.isFinite(Number(tratamiento_id))) {
    throw new Error('tratamiento_id inválido');
  }
  const limpios = (items || []).map(it => ({
    tratamiento_id: Number(tratamiento_id),
    medicamento_id: Number(it.medicamento_id),
    dosis: it.dosis || null,
    frecuencia: it.frecuencia || null,
    duracion: it.duracion || null,
  })).filter(it => it.medicamento_id);

  if (!limpios.length) throw new Error('No hay items válidos para registrar.');

  const bases = baseCandidates();
  const bulkCandidates = bases.map(b => `${b}/bulk`);

  // Intento /bulk
  try {
    const resp = await tryMany(bulkCandidates, (u) =>
      fetchJSON(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tratamiento_id: Number(tratamiento_id), items: limpios.map(({ medicamento_id, dosis, frecuencia, duracion }) => ({ medicamento_id, dosis, frecuencia, duracion })) }),
      })
    );
    return resp;
  } catch (_) {
    // Fallback: crear uno por uno
    const created = [];
    for (const row of limpios) {
      const r = await crearTratamientoMedicamento(row);
      created.push(r);
    }
    return created;
  }
};
