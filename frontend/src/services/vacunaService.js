// src/services/vacunaService.js
import axios from 'axios';

// Prioridad de .env (igual patrón que usuarios)
const API_BASE =
  import.meta.env.VITE_API_VACUNAS ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE}/vacunas`
    : 'http://localhost:3001/api/vacunas');

// Instancia axios con credenciales y Authorization automática
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirección limpia si el backend responde 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const { response } = error || {};
    if (response?.status === 401) {
      try {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      } finally {
        if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

// === Endpoints ===
// Nota: retornamos la Response de axios (no .data) porque tu Lista hace: const { data } = await fetchVacunas();
export const fetchVacunas     = () => api.get('/');
export const fetchVacunaById  = (id) => api.get(`/${id}`);
export const createVacuna     = (data) => api.post('/', data);
export const updateVacuna     = (id, data) => api.put(`/${id}`, data);
export const deleteVacuna     = (id) => api.delete(`/${id}`);
