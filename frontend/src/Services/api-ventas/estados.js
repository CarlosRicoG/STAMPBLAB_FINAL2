import axios from "axios";

const API_URL = "http://localhost:3000/api/estados";

// Obtener token del localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

// Obtener todos los estados
export const getEstados = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener estados:", error);
        throw error;
    }
};

// Obtener estados por tipo (venta, cotizacion, compra)
export const getEstadosByTipo = async (tipo) => {
    try {
        const response = await axios.get(`${API_URL}/tipo/${tipo}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error(`Error al obtener estados tipo ${tipo}:`, error);
        throw error;
    }
};

// Obtener solo estados de ventas
export const getEstadosVenta = async () => {
    return getEstadosByTipo('venta');
};

// Obtener solo estados de cotizaciones
export const getEstadosCotizacion = async () => {
    return getEstadosByTipo('cotizacion');
};

// Obtener solo estados de compras
export const getEstadosCompra = async () => {
    return getEstadosByTipo('compra');
};

// Obtener un estado por ID
export const getEstadoById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener estado:", error);
        throw error;
    }
};

// Crear un nuevo estado
export const createEstado = async (estadoData) => {
    try {
        const response = await axios.post(API_URL, estadoData, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al crear estado:", error);
        throw error;
    }
};

// Actualizar un estado
export const updateEstado = async (id, estadoData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, estadoData, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        throw error;
    }
};

// Eliminar un estado
export const deleteEstado = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al eliminar estado:", error);
        throw error;
    }
};