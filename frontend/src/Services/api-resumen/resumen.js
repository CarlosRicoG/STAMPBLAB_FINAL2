import axios from "axios";
import API_BASE from "../../config/api";

const API_URL = `${API_BASE}/api`;

// Contadores del menú del administrador
export const getResumenPendientes = async () => {
    const response = await axios.get(`${API_URL}/resumen/pendientes`);
    return response.data;
};

// Bandeja de trabajo "Hoy"
export const getResumenHoy = async () => {
    const response = await axios.get(`${API_URL}/resumen/hoy`);
    return response.data;
};

// Configuración pública (sin token): whatsapp, plazoPagoHoras, costoEnvio, stockMinimo...
export const getConfigPublica = async () => {
    const response = await axios.get(`${API_URL}/config-publica`);
    return response.data;
};
