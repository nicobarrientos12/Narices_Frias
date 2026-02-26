import { createContext, useState, useContext, useEffect, useRef, useMemo } from "react";

const AuthContext = createContext(null);

// --- helpers ---
const safeParseJSON = (str) => {
  try { return JSON.parse(str); } catch { return null; }
};

const decodeJwt = (token) => {
  // muy simple, sin validar firma (solo para leer exp, rol, etc.)
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true; // si no trae exp, lo consideramos válido
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

export const AuthProvider = ({ children }) => {
  // estado inicial seguro desde storage
  const storedUser = safeParseJSON(localStorage.getItem("usuario"));
  const storedToken = localStorage.getItem("token");

  const [usuario, setUsuario] = useState(() => (isTokenValid(storedToken) ? storedUser : null));
  const [token, setToken] = useState(() => (isTokenValid(storedToken) ? storedToken : null));

  // temporizador de auto-logout cuando el token expire
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = (jwt) => {
    clearLogoutTimer();
    const payload = decodeJwt(jwt);
    if (!payload?.exp) return; // no programamos nada si no hay exp
    const msUntilExpire = payload.exp * 1000 - Date.now();
    if (msUntilExpire > 0) {
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, msUntilExpire);
    } else {
      // ya expiró
      logout();
    }
  };

  const login = (data) => {
    // espera un objeto { token, usuario }
    setUsuario(data.usuario || null);
    setToken(data.token || null);
    localStorage.setItem("usuario", JSON.stringify(data.usuario || null));
    localStorage.setItem("token", data.token || "");
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    clearLogoutTimer();
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  // programa/cancela auto-logout cuando cambia el token
  useEffect(() => {
    if (token && isTokenValid(token)) {
      scheduleAutoLogout(token);
    } else if (token) {
      // si hay token inválido, forzamos logout
      logout();
    } else {
      clearLogoutTimer();
    }
    return clearLogoutTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // sincroniza logout entre pestañas/ventanas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        // token fue removido en otra pestaña
        setUsuario(null);
        setToken(null);
        clearLogoutTimer();
      }
      if (e.key === "token" && e.newValue) {
        // si en otra pestaña hicieron login
        if (isTokenValid(e.newValue)) {
          const u = safeParseJSON(localStorage.getItem("usuario"));
          setUsuario(u);
          setToken(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // helpers derivados
  const isAuthenticated = !!token && isTokenValid(token);
  const authHeader = useMemo(
    () => (isAuthenticated ? { Authorization: `Bearer ${token}` } : {}),
    [isAuthenticated, token]
  );

  const currentRole = useMemo(() => {
    const roleFromUser = usuario?.rol;
    const roleFromToken = decodeJwt(token || "")?.rol;
    return roleFromUser || roleFromToken || null;
  }, [usuario, token]);

  const hasRole = (...roles) => {
    return currentRole ? roles.includes(currentRole) : false;
  };

  const value = {
    usuario,
    token,
    isAuthenticated,
    role: currentRole,
    authHeader,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
