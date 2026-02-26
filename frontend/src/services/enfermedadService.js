// src/services/enfermedadService.js

const API_BASE =
  import.meta.env.VITE_API_ENFERMEDADES ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/enfermedades`
    : 'http://localhost:3001/api/enfermedades');

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
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handle401();
    const message = data?.message || data?.error || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
};

/** ===================== CRUD ===================== **/

export async function getAllEnfermedades() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getEnfermedadById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function crearEnfermedad(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function actualizarEnfermedad(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function eliminarEnfermedad(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
