// Services/api-cotizaciones/cotizaciones.js

import axios from "axios";
const API_URL = "http://localhost:3000/api/cotizaciones";

// Obtener todas las cotizaciones (admin)
export const getCotizaciones = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener todas las cotizaciones:", error);
        throw error;
    }
};


// Crear cotización
export const crearCotizacion = async (dataCotizacion) => {
    // dataCotizacion incluye:
    // - DocumentoID (usuario logueado)
    // - Detalles de producto, cantidad, trae prenda, etc.
    // - Diseños (array)
    try {
        const response = await axios.post(API_URL, dataCotizacion);
        return response.data;
    } catch (error) {
        console.error("Error al crear cotizacion:", error);
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



export const createCotizacionInteligente = async (data) => {
    const response = await fetch('http://localhost:3000/api/cotizaciones/inteligente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
};