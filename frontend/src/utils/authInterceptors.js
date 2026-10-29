/**
 * Adjunta automáticamente el token de sesión (localStorage "token") a TODAS las llamadas
 * hacia la API (axios y fetch), y cierra la sesión si el servidor responde que el token venció.
 * Se importa una sola vez en main.jsx.
 */
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const esLlamadaApi = (url) => {
    try {
        const u = String(url?.url ?? url ?? "");
        return API ? u.startsWith(API) : u.startsWith("/api") || u.includes("/api/");
    } catch {
        return false;
    }
};

const obtenerToken = () => {
    try { return localStorage.getItem("token"); } catch { return null; }
};

// Renovación deslizante: si al token le queda poco, el servidor manda uno nuevo en la cabecera X-Token-Renovado.
// Solo se guarda si todavía hay una sesión abierta (no revive una sesión que el usuario acaba de cerrar).
function guardarRenovado(nuevo) {
    if (!nuevo || !obtenerToken()) return;
    try { localStorage.setItem("token", nuevo); } catch { /* sin storage */ }
}

// Rutas donde un 401/403 NO significa "sesión vencida" (credenciales incorrectas, etc.)
const esRutaPublicaAuth = (url) => /\/api\/(login|registro|recuperar-password|restablecer-password|usuarios\/login)/.test(String(url));

function cerrarSesionSiVencio(status, url) {
    if (status !== 401 || esRutaPublicaAuth(url)) return;
    if (!obtenerToken()) return;
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("user");
        // El carrito NO se borra aquí: solo en el cierre de sesión voluntario (cerrarSesion)
    } catch { /* sin storage */ }
    if (!/^\/(login|signup|recuperarcontrase|restablecercontrase)/i.test(window.location.pathname)) {
        const destino = window.location.pathname + window.location.search;
        if (destino.startsWith("/") && !destino.startsWith("//")) {
            try { sessionStorage.setItem("redirectAfterLogin", destino); } catch { /* sin storage */ }
        }
        window.location.assign("/login");
    }
}

// ── axios ──
axios.interceptors.request.use((config) => {
    const token = obtenerToken();
    if (token && esLlamadaApi(config.baseURL ? config.baseURL + (config.url || "") : config.url)) {
        if (!config.headers?.Authorization && !config.headers?.authorization) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
axios.interceptors.response.use(
    (res) => {
        guardarRenovado(res?.headers?.["x-token-renovado"]);
        return res;
    },
    (error) => {
        cerrarSesionSiVencio(error?.response?.status, error?.config?.url);
        return Promise.reject(error);
    }
);

// ── fetch ──
const fetchOriginal = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url;
    if (!esLlamadaApi(url)) return fetchOriginal(input, init);

    const token = obtenerToken();
    let nuevoInit = init;
    if (token) {
        const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined) || {});
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        nuevoInit = { ...init, headers };
    }
    const res = await fetchOriginal(input, nuevoInit);
    guardarRenovado(res.headers?.get?.("x-token-renovado"));
    cerrarSesionSiVencio(res.status, url);
    return res;
};
