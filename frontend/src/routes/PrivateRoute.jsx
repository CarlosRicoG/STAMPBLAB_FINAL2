import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        alert("Debes iniciar sesión.");
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userData);

    if (Number(user.rol) !== 1) {
        alert("Acceso restringido. Solo administradores.");
        return <Navigate to="/landing" replace />;
    }

    return children;
};

export default PrivateRoute;
