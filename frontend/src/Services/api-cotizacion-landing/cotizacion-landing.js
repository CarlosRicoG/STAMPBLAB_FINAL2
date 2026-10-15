// Services/api-cotizaciones/cotizacion-landing.js

import axios from "axios";
const API_URL = "http://localhost:3000/api/cotizaciones";
const API_BASE = "http://localhost:3000/api";

// ============================================
// COTIZACIONES
// ============================================

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

// Obtener detalle de cotización por ID
export const getCotizacionById = async (cotizacionID) => {
    try {
        const response = await axios.get(`${API_URL}/${cotizacionID}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener cotización:", error);
        throw error;
    }
};

// Actualizar cotización (cambiar estado, valor total, etc.)
export const updateCotizacion = async (cotizacionID, data) => {
    try {
        const response = await axios.put(`${API_URL}/${cotizacionID}`, data);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar cotización:", error);
        throw error;
    }
};

// ============================================
// CREAR COTIZACIÓN INTELIGENTE (desde Landing)
// ============================================
export const createCotizacionInteligente = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/inteligente`, data);
        return response.data;
    } catch (error) {
        console.error("Error al crear cotización inteligente:", error);
        throw error;
    }
};

// ============================================
// CREAR COTIZACIÓN COMPLETA (desde Dashboard)
// ============================================
export const createCotizacionCompleta = async (cotizacionData) => {
    try {
        const response = await axios.post(`${API_URL}/completa`, cotizacionData);
        return response.data;
    } catch (error) {
        console.error("Error al crear cotización completa:", error);
        throw error;
    }
};

// ============================================
// CATÁLOGOS (para usar en formularios)
// ============================================

export const getColores = async () => {
    try {
        const response = await axios.get(`${API_BASE}/colores`);
        return response.data.datos || response.data;
    } catch (error) {
        console.error("Error al obtener colores:", error);
        throw error;
    }
};

export const getTallas = async () => {
    try {
        const response = await axios.get(`${API_BASE}/tallas`);
        return response.data.datos || response.data;
    } catch (error) {
        console.error("Error al obtener tallas:", error);
        throw error;
    }
};

export const getTelas = async () => {
    try {
        const response = await axios.get(`${API_BASE}/insumos`);
        const insumos = response.data.datos || response.data;
        return insumos.filter(i => i.Tipo && i.Tipo.toLowerCase() === 'tela');
    } catch (error) {
        console.error("Error al obtener telas:", error);
        throw error;
    }
};

export const getTecnicas = async () => {
    try {
        const response = await axios.get(`${API_BASE}/tecnicas`);
        return response.data.datos || response.data;
    } catch (error) {
        console.error("Error al obtener técnicas:", error);
        throw error;
    }
};

export const getPartes = async () => {
    try {
        const response = await axios.get(`${API_BASE}/partes`);
        return response.data.datos || response.data;
    } catch (error) {
        console.error("Error al obtener partes:", error);
        throw error;
    }
};

export const getProductos = async () => {
    try {
        const response = await axios.get(`${API_BASE}/productos`);
        return response.data.datos || response.data;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
};