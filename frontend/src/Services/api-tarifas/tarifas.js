import axios from "axios";
import API_BASE from "../../config/api";

const API_URL = `${API_BASE}/api/tarifas`;

export const getTarifas = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Crea o actualiza (upsert) la tarifa de una técnica + parte
export const guardarTarifa = async ({ TecnicaID, ParteID, Costo }) => {
    const response = await axios.put(API_URL, { TecnicaID, ParteID, Costo });
    return response.data;
};

export const eliminarTarifa = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

// Rellena el costo de los diseños sin precio de una cotización usando las tarifas
export const aplicarTarifasCotizacion = async (cotizacionID) => {
    const response = await axios.post(`${API_BASE}/api/cotizaciones/${cotizacionID}/aplicar-tarifas`);
    return response.data;
};
