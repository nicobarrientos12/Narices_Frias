// src/services/mascotaService.js

const API_BASE =
  import.meta.env.VITE_API_MASCOTAS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/mascotas`
    : 'http://localhost:3001/api/mascotas');

const getToken = () => localStorage.getItem('token');

const withAuth = (extraHeaders = {}) => {
  const t = getToken();
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extraHeaders };
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

const handleJSON = async (res) => {
  if (res.status === 204) return { ok: true };
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handle401();
    const msg = data?.message || data?.error || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
};

/* ===================== CRUD ===================== */

export async function fetchMascotas() {
  const res = await fetch(API_BASE, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleJSON(res);
}

export async function fetchMascota(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleJSON(res);
}

export async function createMascota(formData) {
  // No seteamos content-type para que el browser agregue el boundary
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: withAuth(),
    body: formData,
    credentials: 'include',
  });
  return handleJSON(res);
}

export async function updateMascota(id, formData) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: withAuth(),
    body: formData,
    credentials: 'include',
  });
  return handleJSON(res);
}

export async function deleteMascota(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: withAuth(),
    credentials: 'include',
  });
  return handleJSON(res);
}
