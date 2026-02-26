// src/services/duenoService.js
const API_BASE =
  import.meta.env.VITE_API_DUENOS ||
  (import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/duenos` : 'http://localhost:3001/api/duenos');

const getToken = () => localStorage.getItem('token');

const withAuth = (extraHeaders = {}) => {
  const token = getToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  // si el backend devuelve 204 No Content
  if (res.status === 204) return { ok: true };

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Si es 401, limpiamos sesión y mandamos al login
    if (res.status === 401) {
      try {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      } finally {
        // evita bucles si ya estás en /login
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

export async function fetchDuenos() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchDueno(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createDueno(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateDueno(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteDueno(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
