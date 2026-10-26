import axios from "axios";

import API_BASE from "../../config/api";
const API_URL = `${API_BASE}/api/ventas`;


// Obtener todas las ventas
export const getVentas = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        throw error;
    }
};

// Obtener venta por ID
export const getVentaById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener venta:", error);
        throw error;
    }
};

// Crear venta (con descuento de stock automático)
export const crearVenta = async (ventaData) => {
    try {
        const response = await axios.post(API_URL, ventaData);
        return response.data;
    } catch (error) {
        console.error("Error al crear venta:", error);
        throw error;
    }
};

// Actualizar venta completa
export const updateVenta = async (id, ventaData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, ventaData);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar venta:", error);
        throw error;
    }
};

// Actualizar solo el estado (con lógica de devolución de stock si se cancela)
// extra (opcional): { nota, fechaEstimadaEntrega }
export const updateEstadoVenta = async (id, estadoID, extra = {}) => {
    try {
        const body = { EstadoID: estadoID };
        if (extra?.nota) body.nota = extra.nota;
        if (extra?.fechaEstimadaEntrega) body.fechaEstimadaEntrega = extra.fechaEstimadaEntrega;
        const response = await axios.patch(`${API_URL}/${id}/estado`, body);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        throw error;
    }
};

// Eliminar venta (con devolución de stock si estaba pendiente)
export const deleteVenta = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar venta:", error);
        throw error;
    }
};

// Obtener datos del dashboard
export const getDashboardData = async (filtros = {}) => {
    try {
        const response = await axios.get(`${API_URL}/dashboard/data`, {
            params: filtros
        });
        return response.data;
    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        throw error;
    }
};
// Descarga el comprobante PDF de una venta (cliente dueño o admin)
export const descargarComprobante = async (ventaID) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/${ventaID}/factura`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprobante_venta_${ventaID}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Historial de estados de un pedido: [{ Fecha, EstadoID, Estado, Nota }]
export const getHistorialVenta = async (id) => {
    const response = await axios.get(`${API_URL}/${id}/historial`);
    return response.data;
};

// Rechaza el comprobante de transferencia (el pedido sigue Pendiente). motivo: 5-300 caracteres
export const rechazarComprobante = async (id, motivo) => {
    const response = await axios.patch(`${API_URL}/${id}/rechazar-comprobante`, { motivo });
    return response.data;
};
