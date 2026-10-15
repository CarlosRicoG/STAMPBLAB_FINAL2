import axios from "axios";

const API_URL = "http://localhost:3000/api/insumos";

// Obtener todos los insumos
export const getInsumos = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener insumos:", error);
        throw new Error(
            error.response?.data?.message || "Error al obtener los insumos"
        );
    }
};

// Obtener un insumo por ID
export const getInsumoById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener insumo:", error);
        throw new Error(
            error.response?.data?.message || "Error al obtener el insumo"
        );
    }
};

// Crear un nuevo insumo
export const createInsumo = async (insumo) => {
    try {
        const response = await axios.post(API_URL, insumo);
        return response.data;
    } catch (error) {
        console.error("Error al crear insumo:", error);
        throw new Error(
            error.response?.data?.message || "Error al crear el insumo"
        );
    }
};

// Actualizar un insumo
export const updateInsumo = async (id, insumo) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, insumo);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar insumo:", error);
        throw new Error(
            error.response?.data?.message || "Error al actualizar el insumo"
        );
    }
};

// ✅ NUEVO: Cambiar estado del insumo
export const cambiarEstadoInsumo = async (id, nuevoEstado) => {
    try {
        const response = await axios.patch(`${API_URL}/${id}/estado`, {
            Estado: nuevoEstado
        });
        return response.data;
    } catch (error) {
        console.error("Error al cambiar estado del insumo:", error);
        // Si hay un error de validación (compras asociadas), lanzarlo tal cual
        if (error.response?.status === 400) {
            throw new Error(
                error.response.data.message || "No se puede cambiar el estado del insumo"
            );
        }
        throw new Error(
            error.response?.data?.message || "Error al cambiar el estado del insumo"
        );
    }
};

// Eliminar un insumo
export const deleteInsumo = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar insumo:", error);
        throw new Error(
            error.response?.data?.message || "Error al eliminar el insumo"
        );
    }
};