// Services/api-cotizaciones/cotizaciones.js

import axios from "axios";
import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/cotizaciones`;


// Obtener todas las cotizaciones (admin)
export const getCotizaciones = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error("Error al obtener todas las cotizaciones:", error);
        throw error;
    }
};


// Obtener cotizaciones de un usuario
export const getCotizacionesByUsuario = async (documentoID) => {
    try {
        const response = await axios.get(`${API_URL}/usuario/${documentoID}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener cotizaciones:", error);
        throw error;
    }
};

// Obtener detalle de cotización (admin)
export const getCotizacionById = async (cotizacionID) => {
    try {
        const response = await axios.get(`${API_URL}/${cotizacionID}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener cotizacion:", error);
        throw error;
    }
};

// Actualizar cotización (admin aprueba y pone precio)
export const updateCotizacion = async (cotizacionID, data) => {
    // data incluye: ValorTotal, EstadoID
    try {
        const response = await axios.put(`${API_URL}/${cotizacionID}`, data);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar cotizacion:", error);
        throw error;
    }
};


// Cancelar cotización (devuelve stock si es necesario)
export const cancelarCotizacion = async (cotizacionID) => {
    try {
        const response = await axios.put(`${API_URL}/${cotizacionID}/cancelar`);
        return response.data;
    } catch (error) {
        console.error("Error al cancelar cotización:", error);
        throw error;
    }
};

