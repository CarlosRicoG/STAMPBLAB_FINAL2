import { C } from "../../../config/tokens";

/* Datos y almacenamiento compartidos por el catálogo de la tienda (Productos.jsx y sus modales). */

export const CART_KEY = "cart_productos_landing";

export const coloresHex = {
    "Rojo": "#ef4444", "Azul": "#3b82f6", "Verde": "#22c55e", "Amarillo": "#eab308",
    "Negro": C.text, "Blanco": "#f0f0f0", "Rosa": "#ec4899", "Morado": "#a855f7",
    "Naranja": "#f97316", "Gris": "#94a3b8", "Cafe": "#92400e", "Café": "#92400e",
};

export const saveCart = (c) => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch { /* sin storage */ } };
export const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } };
