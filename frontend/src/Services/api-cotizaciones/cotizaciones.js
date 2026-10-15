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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/inteligente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await response.json();
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


// Convertir cotización a venta
export const convertirCotizacionAVenta = async (cotizacionID) => {
    try {
        const response = await axios.post(`${API_URL}/${cotizacionID}/convertir-venta`);
        return response.data;
    } catch (error) {
        console.error("Error al convertir cotización:", error);
        throw error;
    }
};