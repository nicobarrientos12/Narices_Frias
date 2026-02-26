// src/services/adopcionService.js

// Base URL configurable por .env, con fallback local
const API_BASE =
  import.meta.env.VITE_API_ADOPCIONES ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/adopciones`
    : 'http://localhost:3001/api/adopciones');

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
  // 204 No Content
  if (res.status === 204) return { ok: true };

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Limpia sesión y redirige si es 401
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

// === CRUD Adopciones ===

export async function fetchAdopciones() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchAdopcion(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createAdopcion(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateAdopcion(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteAdopcion(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
