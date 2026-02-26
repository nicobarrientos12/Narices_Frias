// src/services/mascotaEnfermedadService.js
import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_MASCOTA_ENFERMEDAD ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/mascota-enfermedad`
    : 'http://localhost:3001/api/mascota-enfermedad');

// Axios instance con auth + manejo de 401
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

/** =================== CRUD =================== **/

export async function getAllMascotaEnfermedades() {
  const { data } = await api.get('/');
  return data;
}

export async function getMascotaEnfermedadById(id) {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function crearMascotaEnfermedad(payload) {
  const { data } = await api.post('/', payload);
  return data;
}

export async function actualizarMascotaEnfermedad(id, payload) {
  const { data } = await api.put(`/${id}`, payload);
  return data;
}

export async function eliminarMascotaEnfermedad(id) {
  const { data } = await api.delete(`/${id}`);
  return data;
}
