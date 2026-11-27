import axios from "axios";

import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/tallas`;


export const getTallas = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createTalla = async (talla) => {
  const res = await axios.post(API_URL, talla);
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
