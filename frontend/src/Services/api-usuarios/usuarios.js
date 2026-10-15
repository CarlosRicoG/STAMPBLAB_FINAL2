// src/services/api-usuarios/usuarios.js

import axios from "axios";

const API_URL = "http://localhost:3000/api/usuarios"; 

// Configurar el token en los headers
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// Obtener todos los usuarios
export const getUsuarios = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeaders());
        console.log("getUsuarios response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error en getUsuarios:", error);
        throw error;
    }
};

// Obtener un usuario por ID
export const getUsuarioById = async (documentoID) => {
    try {
        const response = await axios.get(`${API_URL}/${documentoID}`, getAuthHeaders());
        console.log("getUsuarioById response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error en getUsuarioById:", error);
        throw error;
    }
};

// Crear un usuario - CORREGIDO
export const createUsuario = async (nuevoUsuario) => {
    try {
        console.log("createUsuario - Enviando:", nuevoUsuario);
        const response = await axios.post(API_URL, nuevoUsuario, getAuthHeaders());
        console.log("createUsuario - Respuesta completa:", response.data);
        
        // El backend devuelve: { estado: true, mensaje: "...", datos: {...} }
        return response.data;
    } catch (error) {
        console.error("Error en createUsuario:", error);
        console.error("Error response:", error.response?.data);
        
        // Si hay error del servidor, devolver estructura consistente
        if (error.response?.data) {
            return error.response.data;
        }
        
        // Error de red u otro
        return {
            estado: false,
            mensaje: error.message || 'Error de conexión al crear usuario'
        };
    }
};

// Editar un usuario - CORREGIDO
export const updateUsuario = async (documentoID, usuarioActualizado) => {
    try {
        // Asegurar que RolID sea string
        if (usuarioActualizado.RolID) {
            usuarioActualizado.RolID = String(usuarioActualizado.RolID);
        }
        
        console.log("updateUsuario - DocumentoID:", documentoID);
        console.log("updateUsuario - Enviando:", usuarioActualizado);
        
        const response = await axios.put(
            `${API_URL}/${documentoID}`, 
            usuarioActualizado, 
            getAuthHeaders()
        );
        
        console.log("updateUsuario - Respuesta completa:", response.data);
        
        // El backend devuelve: { estado: true, mensaje: "...", datos: {...} }
        return response.data;
    } catch (error) {
        console.error("Error en updateUsuario:", error);
        console.error("Error response:", error.response?.data);
        
        // Si hay error del servidor, devolver estructura consistente
        if (error.response?.data) {
            return error.response.data;
        }
        
        // Error de red u otro
        return {
            estado: false,
            mensaje: error.message || 'Error de conexión al actualizar usuario'
        };
    }
};

// Eliminar un usuario
export const deleteUsuario = async (documentoID) => {
    try {
        const response = await axios.delete(`${API_URL}/${documentoID}`, getAuthHeaders());
        console.log("deleteUsuario response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error en deleteUsuario:", error);
        throw error;
    }
};

// Obtener roles disponibles
export const getRoles = async () => {
    try {
        const response = await axios.get(`${API_URL}/util/roles`, getAuthHeaders());
        console.log("getRoles response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error en getRoles:", error);
        throw error;
    }
};