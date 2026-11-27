import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../Services/api-auth/auth";
import { limpiarSesionLocal } from "../utils/tokenSesion";

function esAdmin() {
    try {
        const u = JSON.parse(localStorage.getItem("usuario") || "null");
        return Number(u?.rol) === 1;
    } catch {
        return false;
    }
}

export function ProtectedRoute({ children, adminOnly = false }) {
    const location = useLocation();
    if (!isAuthenticated()) {
        // Token vencido o corrupto: se borra como en el 401, para que la barra no siga mostrando la sesión
        limpiarSesionLocal();
        try { sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search); } catch { /* sin storage */ }
        return <Navigate to="/login" />;
    }
    if (adminOnly && !esAdmin()) {
        return <Navigate to="/landing" replace />;
    }
    return children;
}
