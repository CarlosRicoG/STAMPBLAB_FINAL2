import axios from "axios";

const API_URL = "http://localhost:3000/api/tallas";

export const getTallas = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createTalla = async (talla) => {
  console.log(" Enviando al backend:", talla);
  const res = await axios.post(API_URL, talla);
  console.log(" Respuesta backend:", res.data);
  return res.data;
};

export const updateTalla = async (id, talla) => {
  const res = await axios.put(`${API_URL}/${id}`, talla);
  return res.data;
};

export const deleteTalla = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

export const getTallaById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};
