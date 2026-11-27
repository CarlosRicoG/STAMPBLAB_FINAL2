import axios from "axios";
import API_BASE from "../../config/api";
import { tokenVencido, guardarDesfaseToken, limpiarSesionLocal } from "../../utils/tokenSesion";
export { leerPayloadToken, tokenVencido } from "../../utils/tokenSesion";
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
        guardarDesfaseToken(response?.data?.token); // reloj del equipo vs. servidor (iat), para juzgar el vencimiento
        return response;
    } catch (error) {
        console.error("Error en loginUsuario:", error);
        throw error;
    }
};

// Hay sesión si existe un token legible y sin vencer (según el reloj del servidor, ver utils/tokenSesion).
// El interceptor (authInterceptors) reemplaza el token por el renovado (X-Token-Renovado) y su desfase,
// así que se lee siempre el que esté guardado ahora.
export function isAuthenticated() {
    let token = null;
    try { token = localStorage.getItem("token"); } catch { return false; }
    if (!token) return false;
    return !tokenVencido(token);
}

// Obtener el token almacenado
export function getToken() {
    return localStorage.getItem("token");
}

// Cerrar sesión: avisa al servidor (para que el token deje de valer de verdad) y limpia el navegador
export async function cerrarSesion() {
    try {
        await axios.post(`${API_URL}/logout`, null, { timeout: 4000 }); // el token se adjunta solo (authInterceptors)
    } catch { /* sin conexión o token ya vencido: igual se cierra localmente */ }
    limpiarSesionLocal();
    localStorage.removeItem("cart_productos_landing"); // el carrito no debe pasar a otra sesión
}

// Compatibilidad con el nombre anterior
export const logout = cerrarSesion;
