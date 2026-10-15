// src/services/roles/rolesService.js

import axios from "axios";

const API_URL = "http://localhost:3000/api/roles";

// Obtener todos los roles
export const getRoles = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; // { estado: true/false, datos: [...] }
    } catch (error) {
        console.error("Error en getRoles:", error);
        throw error;
    }
};

// Crear un rol
export const createRol = async (nuevoRol) => {
    try {
        const response = await axios.post(API_URL, nuevoRol);
        return response.data;
    } catch (error) {
        console.error("Error en createRol:", error);
        throw error;
    }
};

// Editar un rol
// export const updateRol = async (id, rolActualizado) => {
//     try {
//         const response = await axios.put(`${API_URL}/${id}`, rolActualizado);
//         return response.data;
//     } catch (error) {
//         console.error("Error en updateRol:", error);
//         throw error;
//     }
// };



// Editar un rol
export const updateRol = async (id, rolActualizado) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, rolActualizado);
        return response.data;
    } catch (error) {
        console.error("Error en updateRol:", error);
        
        // Extraer el mensaje de error del backend
        if (error.response && error.response.data) {
            throw {
                message: error.response.data.mensaje || error.response.data.error || "No puedes hacer esta acción",
                status: error.response.status,
                response: error.response
            };
        }
        
        throw error;
    }
};



export const deleteRol = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error en deleteRol:", error);
        
        // Extraer el mensaje de error del backend
        if (error.response && error.response.data) {
            throw {
                message: error.response.data.mensaje || error.response.data.error || "Error al eliminar el rol",
                status: error.response.status
            };
        }
        
        throw error;
    }
};
