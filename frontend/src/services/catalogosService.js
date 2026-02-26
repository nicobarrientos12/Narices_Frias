// src/services/catalogosService.js

// Base desde variables de entorno (flexible)
const API_BASE =
  import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/api`
    : (import.meta.env.VITE_API_ROOT || 'http://localhost:3001/api');

// Permite overrides por recurso si los defines en .env
const MASCOTAS_ENV = import.meta.env.VITE_API_MASCOTAS;
const VACUNAS_ENV  = import.meta.env.VITE_API_VACUNAS;
const ENF_ENV      = import.meta.env.VITE_API_ENF;

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

// Hace fetch a una URL con headers/credenciales y maneja estados
async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: withAuth(),
    credentials: 'include',
  });

  if (res.status === 204) return { ok: true }; // sin contenido

  // 401 => limpiar sesión y redirigir
  if (res.status === 401) {
    handle401();
    throw new Error('No autorizado');
  }

  // 404 => devolvemos marca especial para que el caller pruebe otra URL
  if (res.status === 404) {
    return { __notFound: true };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // si no hay JSON válido, data queda null
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Error HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  // normalizamos: si backend envía {data:[]}, usamos eso; si envía [], usamos tal cual
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) return data.data;
  return data;
}

// Intenta múltiples URLs hasta obtener 2xx; ignora 404 y sigue probando.
async function tryMany(urls) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const out = await fetchJSON(url);
      if (out && out.__notFound) {
        // era 404: probamos la siguiente URL
        continue;
      }
      return out || [];
    } catch (e) {
      lastErr = e;
      // si no es 404 ya lo gestionamos arriba, seguimos intentando por robustez
      continue;
    }
  }
  // Si ninguna funcionó, lanzamos el último error o uno genérico
  throw lastErr || new Error('No se pudo resolver ninguna URL del catálogo.');
}

/** ===================== GETs ===================== **/

// Mascotas
export async function getAllMascotas() {
  const urls = [
    // Overrides por variable (si existen)
    ...(MASCOTAS_ENV ? [MASCOTAS_ENV] : []),

    // Convenciones comunes
    `${API_BASE}/mascotas`,
    `${API_BASE}/catalogos/mascotas`,

    // Último fallback hardcoded local
    `http://localhost:3001/api/mascotas`,
  ];

  const data = await tryMany(urls);
  // Siempre devolver { data } para que tus componentes usen res.data
  return { data: Array.isArray(data) ? data : (data ? [data] : []) };
}

// Vacunas
export async function getAllVacunas() {
  const urls = [
    ...(VACUNAS_ENV ? [VACUNAS_ENV] : []),

    // Variantes frecuentes según cómo se montó el backend
    `${API_BASE}/vacunas`,
    `${API_BASE}/vacuna`,
    `${API_BASE}/clinica/vacunas`,

    `http://localhost:3001/api/vacunas`,
  ];

  const data = await tryMany(urls);
  return { data: Array.isArray(data) ? data : (data ? [data] : []) };
}

// Enfermedades
export async function getAllEnfermedades() {
  const urls = [
    ...(ENF_ENV ? [ENF_ENV] : []),

    `${API_BASE}/enfermedades`,
    `${API_BASE}/catalogos/enfermedades`,

    `http://localhost:3001/api/enfermedades`,
  ];

  const data = await tryMany(urls);
  return { data: Array.isArray(data) ? data : (data ? [data] : []) };
}
