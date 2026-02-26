// src/services/calendarioService.js
const API_BASE =
  import.meta.env.VITE_API_CALENDARIO ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/calendario`
    : 'http://localhost:3001/api/calendario');

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

/** ===================== API ===================== **/

// Obtener citas por fecha (YYYY-MM-DD)
export async function getCitasByDate(fecha) {
  const res = await fetch(`${API_BASE}/${fecha}`, {
    headers: withAuth(),
    credentials: 'include',
  });
  return handleResponse(res);
}

// Notificar por correo
export async function notificarCorreo(body) {
  const res = await fetch(`${API_BASE}/notificar/correo`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

// Generar link WhatsApp (devuelve { url })
export async function generarWhatsApp(body) {
  const res = await fetch(`${API_BASE}/notificar/whatsapp`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}
