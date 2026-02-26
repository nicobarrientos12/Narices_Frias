// src/services/historialService.js

const API_BASE =
  import.meta.env.VITE_API_HISTORIAL ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/historial`
    : 'http://localhost:3001/api/historial');

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

const handleJSON = async (res) => {
  if (res.status === 204) return { ok: true };
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handle401();
    const message = data?.message || data?.error || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
};

const handleBLOB = async (res) => {
  const blob = await res.blob().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) handle401();
    const message = `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return blob;
};

/** ===================== Endpoints ===================== **/

// 📄 Descargar PDF de historial por mascota
export async function downloadHistorialPdf(mascotaId) {
  const res = await fetch(`${API_BASE}/reporte/pdf?mascotaId=${mascotaId}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleBLOB(res);
}

// 🐶 Listar mascotas con dueño para historial
export async function fetchMascotasHistorial() {
  const res = await fetch(`${API_BASE}/mascotas`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleJSON(res);
}
