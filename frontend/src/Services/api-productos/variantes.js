import axios from "axios";

const API_URL = "http://localhost:3000/api/inventarioproducto"; 

// Obtener todas las variantes (inventario completo)
export const getAllVariantes = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (error) {
    console.error("Error al obtener todas las variantes:", error);
    throw error;
  }
};

// Obtener variantes de un producto específico
export const getVariantesByProducto = async (productoId) => {
  try {
    const res = await axios.get(`${API_URL}/producto/${productoId}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener variantes del producto:", error);
    throw error;
  }
};

// Obtener una variante por ID
export const getVarianteById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener variante:", error);
    throw error;
  }
};

// Crear nueva variante
// Campos esperados: ProductoID, ColorID, TallaID, TelaID, Stock, Estado
export const createVariante = async (data) => {
  try {
    const varianteData = {
      ProductoID: parseInt(data.ProductoID),
      ColorID: parseInt(data.ColorID),
      TallaID: parseInt(data.TallaID),
      TelaID: data.TelaID ? parseInt(data.TelaID) : null, // 🆕
      Stock: parseInt(data.Stock) || 0,
      Estado: data.Estado !== undefined ? (data.Estado ? 1 : 0) : 1
    };
    
    const res = await axios.post(API_URL, varianteData);
    return res.data;
  } catch (error) {
    console.error("Error al crear variante:", error);
    throw error;
  }
};


// Actualizar variante existente
export const updateVariante = async (id, data) => {
  try {
    const updateData = {
      Stock: data.Stock !== undefined ? parseInt(data.Stock) : undefined,
      Estado: data.Estado !== undefined ? (data.Estado ? 1 : 0) : undefined,
      TelaID: data.TelaID !== undefined ? (data.TelaID ? parseInt(data.TelaID) : null) : undefined // 🆕
    };
    
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const res = await axios.put(`${API_URL}/${id}`, updateData);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar variante:", error);
    throw error;
  }
};


// Eliminar variante
export const deleteVariante = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar variante:", error);
    throw error;
  }
};