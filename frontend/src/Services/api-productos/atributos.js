import axios from "axios";

import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api`;


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

// CORREGIDO: Obtener Telas (insumos tipo "Tela")
export const getTelas = async () => {
  try {
    const res = await axios.get(`${API_URL}/insumos`);
    
    // Extraer array de insumos (maneja diferentes formatos de respuesta)
    let insumos = res.data.datos || res.data;
    
    // Si no es un array, convertirlo
    if (!Array.isArray(insumos)) {
      console.warn("getTelas: respuesta no es un array:", insumos);
      insumos = [];
    }

    console.log("Total insumos recibidos:", insumos.length);

    // FILTRO MEJORADO: Búsqueda case-insensitive y flexible
    const telas = insumos.filter(insumo => {
      if (!insumo || !insumo.Tipo) return false;
      
      const tipo = insumo.Tipo.toString().toLowerCase().trim();
      const esTela = tipo === 'tela' || tipo === 'telas';
      
      if (esTela) {
        console.log("Tela encontrada:", insumo.Nombre, "- Tipo:", insumo.Tipo);
      }
      
      return esTela;
    });

    console.log("Total telas encontradas:", telas.length);
    
    if (telas.length === 0) {
      console.warn("No se encontraron telas. Tipos disponibles:");
      const tiposUnicos = [...new Set(insumos.map(i => i.Tipo).filter(Boolean))];
      console.log("Tipos en BD:", tiposUnicos);
    }

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
    let insumos = res.data.datos || res.data;
    
    if (!Array.isArray(insumos)) {
      insumos = [];
    }

    const noTelas = insumos.filter(insumo => {
      if (!insumo || !insumo.Tipo) return true; // Si no tiene tipo, incluirlo
      
      const tipo = insumo.Tipo.toString().toLowerCase().trim();
      return tipo !== 'tela' && tipo !== 'telas';
    });

    return noTelas;
  } catch (error) {
    console.error("Error al obtener insumos no telas:", error);
    throw error;
  }
};