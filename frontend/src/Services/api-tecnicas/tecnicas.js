import axios from "axios";

const API_URL = "http://localhost:3000/api/tecnicas";

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
    // Asegurarse que el objeto esté correctamente formateado
    const payload = {
      Nombre: data.Nombre,
      Descripcion: data.Descripcion || "",
      imagenTecnica: data.imagenTecnica || "", 
      Estado: data.Estado !== undefined ? data.Estado : true
    };

    console.log("Enviando técnica:", payload);
    
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
      Estado: data.Estado
    };

    console.log("Actualizando técnica:", payload);
    
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
    console.error("Error en deleteTecnica:", error);
    throw error;
  }
};