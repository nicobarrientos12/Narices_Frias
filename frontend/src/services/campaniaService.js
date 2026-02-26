// src/services/campaniaService.js

// Base URL configurable por .env (mismo patrón que usuarios)
const API_BASE =
  import.meta.env.VITE_API_CAMPANIAS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/campanias`
    : 'http://localhost:3001/api/campanias');

// === Helpers de auth y manejo de respuestas ===
const getToken = () => localStorage.getItem('token');

const withAuth = (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (res.status === 204) return { ok: true };
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      try {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      } finally {
        if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    const message = data?.message || data?.error || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
};

// === Utils de querystring
function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

// === CRUD Campañas ===
export async function fetchCampanias(filters = {}) {
  const qs = toQuery(filters); // { usuario_id, desde, hasta }
  const res = await fetch(`${API_BASE}${qs}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchCampania(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createCampania(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateCampania(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteCampania(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
