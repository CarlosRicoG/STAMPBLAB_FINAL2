import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../Services/api-auth/auth";

export function ProtectedRoute({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    return children;
}
