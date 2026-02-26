// src/services/usuarioService.js

// Base URL configurable por .env (igual patrón que adopciones)
const API_BASE =
  import.meta.env.VITE_API_USUARIOS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/usuarios`
    : 'http://localhost:3001/api/usuarios');

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

// === CRUD Usuarios ===
export async function fetchUsuarios() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchUsuario(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function fetchVeterinarios() {
  const res = await fetch(`${API_BASE}/veterinarios`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createUsuario(body) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateUsuario(id, body) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteUsuario(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}
