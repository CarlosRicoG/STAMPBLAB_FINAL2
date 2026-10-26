import axios from "axios";
import API_BASE from "../../config/api";

const URL = `${API_BASE}/api/notificaciones`;

/** Notificaciones activas (archivada=false) o historial (archivada=true), paginadas de 20 en 20. */
export const listarNotificaciones = async ({ archivada = false, page = 1 } = {}) => {
    const { data } = await axios.get(URL, { params: { archivada, page } });
    return data; // { results, next, total, noLeidas }
};

export const contarNoLeidas = async () => {
    const { data } = await axios.get(`${URL}/contador`);
    return Number(data?.noLeidas) || 0;
};

export const marcarLeida = (id) => axios.post(`${URL}/${id}/leer`);
export const archivarNotificacion = (id) => axios.post(`${URL}/${id}/archivar`);
export const marcarTodasLeidas = () => axios.post(`${URL}/leer-todas`);
export const archivarTodas = () => axios.post(`${URL}/archivar-todas`);
