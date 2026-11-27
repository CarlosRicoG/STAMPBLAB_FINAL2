// Catálogos y envío de la página pública "Cotizar" (CotizacionesL).
// Usan fetch + pedirLista (no axios) a propósito: pedirLista comprueba res.ok y siempre devuelve un arreglo
// (o lanza si el servidor respondió error), y la página reparte esos errores con cargarListas.
// El servicio axios de cotizacion-landing.js maneja los errores distinto (registra en consola, otra forma de error).
import API_ROOT from "../../config/api";
import { pedirLista } from "../../utils/pedirLista";

const API_BASE_URL = `${API_ROOT}/api`;

export const getProductos = () => pedirLista(`${API_BASE_URL}/productos`);
export const getTecnicas = () => pedirLista(`${API_BASE_URL}/tecnicas`);
export const getPartes = () => pedirLista(`${API_BASE_URL}/partes`);
export const getColores = () => pedirLista(`${API_BASE_URL}/colores`);
export const getTallas = () => pedirLista(`${API_BASE_URL}/tallas`);
export const getTelas = async () => (await pedirLista(`${API_BASE_URL}/insumos`)).filter(i => i.Tipo?.toLowerCase() === "tela");
/** @param {object} [opciones] opciones de fetch (p. ej. { signal } para cancelar) */
export const getVariantesByProducto = (productoID, opciones) => pedirLista(`${API_BASE_URL}/inventarioproducto/producto/${productoID}`, opciones);

/** Lanza { response: { data } } si el servidor responde con error (la página lee err.response.data.message). */
export const createCotizacionInteligente = async (data) => {
    const r = await fetch(`${API_BASE_URL}/cotizaciones/inteligente`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const d = await r.json();
    if (!r.ok) throw { response: { data: d } };
    return d;
};
