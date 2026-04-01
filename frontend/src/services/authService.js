// src/services/authService.js
import api from "./api";

/** Login normal */
export const getCaptcha = async () => {
  const { data } = await api.get("/auth/captcha");
  return data; // { question, token }
};

/** Login normal */
export const login = async (correo, contrasena, captcha_token, captcha_answer) => {
  const { data } = await api.post("/auth/login", { correo, contrasena, captcha_token, captcha_answer });
  return data;  // { message, token, refresh_token, usuario }
};

/** Refrescar sesiÃ³n con refresh token */
export const refreshSession = async (refresh_token) => {
  const { data } = await api.post("/auth/refresh", { refresh_token });
  return data; // { token, refresh_token }
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
