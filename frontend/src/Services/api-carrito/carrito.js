// Carrito del cliente sincronizado en el servidor (contrato: GET/PUT /api/carrito).
// Todas las funciones toleran fallos: si el servidor no responde, el carrito local sigue funcionando.
import axios from "axios";
import API_BASE from "../../config/api";

const API_URL = `${API_BASE}/api/carrito`;

/** Devuelve los ítems del servidor o `null` si no se pudo consultar. */
export const getCarritoServidor = async () => {
    try {
        const res = await axios.get(API_URL);
        return Array.isArray(res.data?.items) ? res.data.items : [];
    } catch {
        return null;
    }
};

/** Guarda los ítems en el servidor. Devuelve true/false (nunca lanza). */
export const guardarCarritoServidor = async (items) => {
    try {
        await axios.put(API_URL, { items: Array.isArray(items) ? items.slice(0, 200) : [] });
        return true;
    } catch {
        return false;
    }
};
