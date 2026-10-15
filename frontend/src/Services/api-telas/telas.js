import axios from "axios";

const API_URL = "http://localhost:3001/telas";

// Obtener todas las telas
export const getTelas = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; // { estado: true/false, datos: [...] }
    } catch (error) {
        console.error(" Error en getTelas:", error);
        throw error;
    }
};

// Crear una tela
export const createTela = async (nuevaTela) => {
    try {
        const response = await axios.post(API_URL, nuevaTela);
        return response.data;
    } catch (error) {
        console.error("Error en createTela:", error);
        throw error;
    }
};

// Editar una tela
export const updateTela = async (telaID, telaActualizada) => {
    try {
        const response = await axios.put(`${API_URL}/${telaID}`, telaActualizada);
        return response.data;
    } catch (error) {
        console.error("Error en updateTela:", error);
        throw error;
    }
};

// Obtener una tela por ID
export const getTelaById = async (telaID) => {
    try {
        const response = await axios.get(`${API_URL}/${telaID}`);
        return response.data;
    } catch (error) {
        console.error("Error en getTelaById:", error);
        throw error;
    }
};

// Eliminar una tela
export const deleteTela = async (telaID) => {
    try {
        const response = await axios.delete(`${API_URL}/${telaID}`);
        return response.data;
    } catch (error) {
        console.error("Error en deleteTela:", error);
        throw error;
    }
};
