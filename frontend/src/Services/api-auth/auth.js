import axios from "axios";
import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api`;


// Registro de usuario
export const registrarUsuario = async (datos) => {
    try {
        const response = await axios.post(`${API_URL}/registro`, datos);
        return response;
    } catch (error) {
        console.error("Error en registrarUsuario:", error);
        throw error;
    }
};

// Login de usuario
export const loginUsuario = async (datos) => {
    try {
        const response = await axios.post(`${API_URL}/login`, datos);
        return response;
    } catch (error) {
        console.error("Error en loginUsuario:", error);
        throw error;
    }
};

// Verificar si hay token
export function isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token; // devuelve true si hay token
}

// Obtener el token almacenado
export function getToken() {
    return localStorage.getItem("token");
}

// Obtener datos del usuario
export function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

// Cerrar sesión
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}
