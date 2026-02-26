// src/services/mascotaAlergiaService.js
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_MASCOTA_ALERGIA ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/mascota-alergia`
    : 'http://localhost:3001/api/mascota-alergia');

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

export async function getAllMascotaAlergias() {
  const { data } = await api.get('/');
  return data;
}

export async function getMascotaAlergiaById(id) {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function crearMascotaAlergia(payload) {
  const { data } = await api.post('/', payload);
  return data;
}

export async function actualizarMascotaAlergia(id, payload) {
  const { data } = await api.put(`/${id}`, payload);
  return data;
}

export async function eliminarMascotaAlergia(id) {
  const { data } = await api.delete(`/${id}`);
  return data;
}
