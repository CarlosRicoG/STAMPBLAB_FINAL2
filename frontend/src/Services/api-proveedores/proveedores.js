import axios from "axios";

const API_URL = "http://localhost:3000/api/proveedores";

// Obtener todos los proveedores
export const getProveedores = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        throw new Error(
            error.response?.data?.message || "Error al obtener los proveedores"
        );
    }
};

// Obtener un proveedor por NIT
export const getProveedorByNit = async (nit) => {
    try {
        const response = await axios.get(`${API_URL}/${nit}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener proveedor:", error);
        throw new Error(
            error.response?.data?.message || "Error al obtener el proveedor"
        );
    }
};

// Crear un nuevo proveedor
export const createProveedor = async (proveedor) => {
    try {
        const response = await axios.post(API_URL, proveedor);
        return {
            estado: true,
            mensaje: response.data.message || "Proveedor creado exitosamente",
            proveedor: response.data.proveedor
        };
    } catch (error) {
        console.error("Error al crear proveedor:", error);
        throw new Error(
            error.response?.data?.message || "Error al crear el proveedor"
        );
    }
};

// Actualizar un proveedor
export const updateProveedor = async (nit, proveedor) => {
    try {
        const response = await axios.put(`${API_URL}/${nit}`, proveedor);
        return {
            estado: true,
            mensaje: response.data.message || "Proveedor actualizado exitosamente",
            proveedor: response.data.proveedor
        };
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        throw new Error(
            error.response?.data?.message || "Error al actualizar el proveedor"
        );
    }
};

// Eliminar o desactivar un proveedor (MEJORADO)
export const deleteProveedor = async (nit) => {
    try {
        const response = await axios.delete(`${API_URL}/${nit}`);
        return {
            estado: response.data.estado || true,
            mensaje: response.data.mensaje || response.data.message || "Operación exitosa",
            accion: response.data.accion, // 'eliminado' o 'desactivado'
            data: response.data
        };
    } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        throw new Error(
            error.response?.data?.message || error.response?.data?.mensaje || "Error al eliminar el proveedor"
        );
    }
};

// Cambiar estado de un proveedor
export const cambiarEstadoProveedor = async (nit, nuevoEstado) => {
    try {
        const response = await axios.patch(`${API_URL}/${nit}/estado`, {
            Estado: nuevoEstado
        });
        return {
            estado: true,
            mensaje: response.data.message || "Estado actualizado",
            proveedor: response.data.proveedor
        };
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        throw new Error(
            error.response?.data?.message || "Error al cambiar el estado"
        );
    }
};