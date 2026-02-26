// src/services/mascotaVacunaService.js
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_MASCOTA_VACUNAS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/mascota-vacunas`
    : 'http://localhost:3001/api/mascota-vacunas');

// Axios instance + auth + manejo 401
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      } finally {
        if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(err);
  }
);

/** ============== CRUD base ============== */

export async function getAllAplicaciones() {
  const { data } = await api.get('/');
  return data;
}

export async function getAplicacionById(id) {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function crearAplicacion(payload) {
  const { data } = await api.post('/', payload);
  return data;
}

export async function actualizarAplicacion(id, payload) {
  const { data } = await api.put(`/${id}`, payload);
  return data;
}

export async function eliminarAplicacion(id) {
  const { data } = await api.delete(`/${id}`);
  return data;
}

/** ============== Compat: búsqueda por nombre (por si tu backend funciona así) ============== */
export async function getAplicacionByNombre(mascota, vacuna) {
  // Nota: si tu backend la expone así: GET /:mascota/:vacuna
  // si no existe, lanzará 404 y lo capturaremos en el loader flexible
  const { data } = await api.get(`/${encodeURIComponent(mascota)}/${encodeURIComponent(vacuna)}`);
  return data;
}

/** ============== Loader flexible para edición ==============
 * Intenta:
 * 1) GET /:id
 * 2) GET /:mascota/:vacuna   (si se proveen nombres)
 * 3) GET / (lista) y busca por id
 */
export async function getAplicacionFlexible({ id, mascota, vacuna }) {
  // 1) por id
  if (id) {
    try {
      return await getAplicacionById(id);
    } catch (e) {
      if (e?.response?.status !== 404) throw e; // si no es 404, re-lanzamos
    }
  }
  // 2) por nombres (si vienen)
  if (mascota && vacuna) {
    try {
      return await getAplicacionByNombre(mascota, vacuna);
    } catch (e) {
      if (e?.response?.status !== 404) throw e;
    }
  }
  // 3) buscar en la lista por id
  if (id) {
    const list = await getAllAplicaciones();
    const found = Array.isArray(list) ? list.find(a => String(a.id) === String(id)) : null;
    if (found) return found;
  }
  // nada
  const err = new Error('No se encontró la aplicación con los parámetros suministrados.');
  err.code = 'NOT_FOUND';
  throw err;
}
