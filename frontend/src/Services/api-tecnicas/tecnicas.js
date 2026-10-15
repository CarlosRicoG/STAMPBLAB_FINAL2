import axios from "axios";

import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/tecnicas`;


export const getAllTecnicas = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error en getAllTecnicas:", error);
    throw error;
  }
};

export const getTecnicaById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error en getTecnicaById:", error);
    throw error;
  }
};

export const createTecnica = async (data) => {
  try {
    const payload = {
      Nombre: data.Nombre,
      Descripcion: data.Descripcion || "",
      imagenTecnica: data.imagenTecnica || "",
      Estado: data.Estado !== undefined ? data.Estado : true,
    };
    const response = await axios.post(API_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error en createTecnica:", error.response?.data || error);
    throw error;
  }
};

export const updateTecnica = async (id, data) => {
  try {
    const payload = {
      Nombre: data.Nombre,
      Descripcion: data.Descripcion,
      imagenTecnica: data.imagenTecnica,
      Estado: data.Estado,
    };
    const response = await axios.put(`${API_URL}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error en updateTecnica:", error.response?.data || error);
    throw error;
  }
};

export const deleteTecnica = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    // Loggear el cuerpo de la respuesta de error para debugging
    console.error(
      "Error en deleteTecnica:",
      error.response?.data || error.message
    );
    throw error;
  }
};