// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const isTokenValid = (token) => {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, hasRole } = useAuth();
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return <Navigate to="/login" />;
  }
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
