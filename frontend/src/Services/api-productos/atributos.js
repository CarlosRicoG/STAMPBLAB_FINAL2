import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Obtener todos los colores
export const getColores = async () => {
  try {
    const res = await axios.get(`${API_URL}/colores`);
    return res.data; // Ya retorna { estado: true, datos: [...] }
  } catch (error) {
    console.error("Error al obtener colores:", error);
    throw error;
  }
};

// Obtener todas las tallas
export const getTallas = async () => {
  try {
    const res = await axios.get(`${API_URL}/tallas`);
    return res.data; // Ya retorna { estado: true, datos: [...] }
  } catch (error) {
    console.error("Error al obtener tallas:", error);
    throw error;
  }
};

// Obtener todos los insumos
export const getInsumos = async () => {
  try {
    const res = await axios.get(`${API_URL}/insumos`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener insumos:", error);
    throw error;
  }
};

// Obtener Telas (insumos tipo "Tela")
export const getTelas = async () => {
  try {
    const res = await axios.get(`${API_URL}/insumos`);
    const insumos = res.data.datos || res.data;

    // Filtrar solo los insumos tipo "Tela"
    const telas = insumos.filter(insumo =>
      insumo.Tipo && insumo.Tipo.toLowerCase() === 'tela'
    );

    return telas;
  } catch (error) {
    console.error("Error al obtener telas:", error);
    throw error;
  }
};

// Obtener insumos que NO son telas
export const getInsumosNoTelas = async () => {
  try {
    const res = await axios.get(`${API_URL}/insumos`);
    const insumos = res.data.datos || res.data;

    const noTelas = insumos.filter(insumo =>
      !insumo.Tipo || insumo.Tipo.toLowerCase() !== 'tela'
    );

    return noTelas;
  } catch (error) {
    console.error("Error al obtener insumos no telas:", error);
    throw error;
  }
};