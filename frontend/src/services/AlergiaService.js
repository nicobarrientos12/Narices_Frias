// src/services/alergiaService.js
const API_BASE =
  import.meta.env.VITE_API_ALERGIAS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/alergias`
    : 'http://localhost:3001/api/alergias');

const getToken = () => localStorage.getItem('token');

const withAuth = (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  // Soporta 204
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

/** ===================== CRUD ===================== **/

export async function getAlergias() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getAlergiaById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createAlergia(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateAlergia(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteAlergia(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
