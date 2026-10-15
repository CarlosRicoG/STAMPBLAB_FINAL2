import axios from "axios";
import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/colores`;


export const getColores = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Crear color – enviar { Nombre }
export const createColor = async (nuevoColor) => {
    const response = await axios.post(API_URL, { Nombre: nuevoColor.Nombre });
    return response.data;
};

// Actualizar color
export const updateColor = async (colorActualizado) => {
    const response = await axios.put(`${API_URL}/${colorActualizado.ColorID}`, colorActualizado);
    return response.data;
};

// Eliminar color
export const deleteColor = async (colorID) => {
    const response = await axios.delete(`${API_URL}/${colorID}`);
    return response.data;
};
