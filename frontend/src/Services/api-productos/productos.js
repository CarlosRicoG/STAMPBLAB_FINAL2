import axios from "axios";

const API_URL = "http://localhost:3000/api/productos"; 

// Obtener todos los productos
export const getProductos = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Crear un nuevo producto
export const createProducto = async (productoData) => {
  try {
    // Validar que tenga PrecioBase
    if (productoData.PrecioBase === undefined || productoData.PrecioBase === null) {
      throw new Error("El precio base es obligatorio");
    }

    const response = await axios.post(API_URL, {
      Nombre: productoData.Nombre,
      Descripcion: productoData.Descripcion || "",
      PrecioBase: parseFloat(productoData.PrecioBase), 
      ImagenProducto: productoData.ImagenProducto || ""
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear producto:", error);
    throw error;
  }
};

// Obtener producto por ID
export const getProductoById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener producto:", error);
    throw error;
  }
};

// Actualizar producto
export const updateProducto = async (id, productoData) => {
  try {
    const dataToSend = {
      Nombre: productoData.Nombre,
      Descripcion: productoData.Descripcion,
      ImagenProducto: productoData.ImagenProducto
    };

    // Solo incluir PrecioBase si se envió
    if (productoData.PrecioBase !== undefined && productoData.PrecioBase !== null) {
      dataToSend.PrecioBase = parseFloat(productoData.PrecioBase);
    }

    const response = await axios.put(`${API_URL}/${id}`, dataToSend);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

// Eliminar producto
export const deleteProducto = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};