import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../Services/api-auth/auth";

function esAdmin() {
    try {
        const u = JSON.parse(localStorage.getItem("usuario") || "null");
        return Number(u?.rol) === 1;
    } catch {
        return false;
    }
}

export function ProtectedRoute({ children, adminOnly = false }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    if (adminOnly && !esAdmin()) {
        return <Navigate to="/landing" replace />;
    }
    return children;
}
