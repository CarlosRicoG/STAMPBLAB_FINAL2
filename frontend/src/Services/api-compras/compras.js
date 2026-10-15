import axios from "axios";
import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/compras`;


// Obtener todas las compras
export const getCompras = async () => {
    try {
        const response = await axios.get(API_URL);
        console.log("Compras obtenidas:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error completo al obtener compras:", error);
        console.error("Respuesta del servidor:", error.response?.data);
        console.error("Status:", error.response?.status);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.response?.data?.error ||
            error.message ||
            "Error al obtener las compras";
        throw new Error(errorMessage);
    }
};

// Obtener una compra por ID
export const getCompraById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        console.log("Compra obtenida:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al obtener compra:", error);
        console.error("Respuesta del servidor:", error.response?.data);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.message ||
            "Error al obtener la compra";
        throw new Error(errorMessage);
    }
};

// Crear una nueva compra
export const createCompra = async (compra) => {
    try {
        console.log("Enviando compra:", compra);
        const response = await axios.post(API_URL, compra);
        console.log("Compra creada:", response.data);

        return {
            estado: true,
            mensaje: response.data.message || "Compra creada exitosamente",
            compra: response.data.compra
        };
    } catch (error) {
        console.error("Error al crear compra:", error);
        console.error("Respuesta del servidor:", error.response?.data);
        console.error("Datos enviados:", compra);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.message ||
            "Error al crear la compra";
        throw new Error(errorMessage);
    }
};

// Actualizar una compra
export const updateCompra = async (id, compra) => {
    try {
        console.log("Actualizando compra:", id, compra);
        const response = await axios.put(`${API_URL}/${id}`, compra);
        console.log("Compra actualizada:", response.data);

        return {
            estado: true,
            mensaje: response.data.message || "Compra actualizada exitosamente",
            compra: response.data.compra
        };
    } catch (error) {
        console.error("Error al actualizar compra:", error);
        console.error("Respuesta del servidor:", error.response?.data);
        console.error("Datos enviados:", compra);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.message ||
            "Error al actualizar la compra";
        throw new Error(errorMessage);
    }
};

// Eliminar una compra
export const deleteCompra = async (id) => {
    try {
        console.log("Eliminando compra:", id);
        const response = await axios.delete(`${API_URL}/${id}`);
        console.log("Compra eliminada:", response.data);

        return {
            estado: true,
            mensaje: response.data.message || "Compra eliminada exitosamente"
        };
    } catch (error) {
        console.error("Error al eliminar compra:", error);
        console.error("Respuesta del servidor:", error.response?.data);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.message ||
            "Error al eliminar la compra";
        throw new Error(errorMessage);
    }
};

// Obtener todos los proveedores (para el dropdown)
export const getProveedores = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/proveedores`);
        console.log("Preedores obtenidos:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error completo al obtener proveedores:", error);
        console.error("Respuesta del servidor (completa):", JSON.stringify(error.response?.data, null, 2));
        console.error("Status:", error.response?.status);
        console.error("URL intentada:", `${import.meta.env.VITE_API_URL}/api/proveedores`);

        const errorMessage = error.response?.data?.message ||
            error.response?.data?.mensaje ||
            error.response?.data?.error ||
            error.message ||
            "Error al cargar proveedores";
        throw new Error(errorMessage);
    }
};

// CORREGIDO: Obtener variantes de un producto
export const getVariantesByProductoEnCompra = async (productoId) => {
    try {
        // RUTA CORRECTA: usar el endpoint de inventario
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventarioproducto/producto/${productoId}`);
        
        console.log("Variantes obtenidas:", response.data);
        
        // Manejar diferentes formatos de respuesta
        const variantes = response.data.datos || response.data.variantes || response.data || [];
        
        return {
            estado: true,
            variantes: Array.isArray(variantes) ? variantes : [],
            totalVariantes: Array.isArray(variantes) ? variantes.length : 0
        };
    } catch (error) {
        console.error("Error al obtener variantes:", error);
        console.error("Respuesta del servidor:", error.response?.data);
        
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.mensaje || 
                            error.message || 
                            "Error al obtener variantes del producto";
        throw new Error(errorMessage);
    }
};