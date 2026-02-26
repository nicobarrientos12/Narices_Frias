// src/services/authService.js
import api from "./api";

/** Login normal */
export const login = async (correo, contrasena) => {
  const { data } = await api.post("/auth/login", { correo, contrasena });
  return data;  // { message, token, usuario }
};

/** Paso A: solicitar reseteo (olvidé mi contraseña) */
export const forgotPassword = async (correo) => {
  const { data } = await api.post("/auth/forgot", { correo });
  return data;  // { message }
};

/** Paso B: resetear contraseña con token */
export const resetPassword = async (token, nueva_contrasena) => {
  const { data } = await api.post("/auth/reset", { token, nueva_contrasena });
  return data;  // { message }
};
