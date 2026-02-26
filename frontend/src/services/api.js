// src/services/api.js
import axios from "axios";

// ⬅️ si usas Vite proxy (ver sección 3), deja solo "/api"
const BASE_URL = "/api";


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Agrega el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira o no es válido, redirige a /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      // Evita loop si ya estás en /login
      if (location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
