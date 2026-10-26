// Servicios del cliente para el flujo cotización -> pedido -> seguimiento (ver CONTRATO-API).
// Los endpoints nuevos pueden no existir aún: las lecturas "blandas" devuelven un valor por defecto.
import axios from "axios";
import API_BASE from "../../config/api";

const API = `${API_BASE}/api`;

/* ── Configuración pública (sin token) ── */
export const CONFIG_POR_DEFECTO = Object.freeze({
    whatsapp: "",
    plazoPagoHoras: 48,
    vigenciaCotizacionDias: 30,
    costoEnvio: 0,
    stockMinimo: 5,
});

let configPromesa = null;

/** Configuración pública con caché de la sesión. Nunca lanza: ante un fallo usa los valores por defecto. */
export const getConfigPublica = () => {
    if (!configPromesa) {
        configPromesa = axios.get(`${API}/config-publica`)
            .then((r) => ({ ...CONFIG_POR_DEFECTO, ...(r.data || {}) }))
            .catch(() => {
                configPromesa = null; // permitir reintentar más tarde
                // costoEnvio null = no se pudo consultar ("A convenir"); el servidor siempre decide el costo real
                return { ...CONFIG_POR_DEFECTO, costoEnvio: null };
            });
    }
    return configPromesa;
};

/* ── Tarifas públicas para el estimado ── */
export const getTarifasPublicas = async () => {
    try {
        const r = await axios.get(`${API}/tarifas/publicas`);
        return Array.isArray(r.data) ? r.data : (r.data?.datos || []);
    } catch {
        return [];
    }
};

/* ── Cotizaciones (cliente) ── */
export const aceptarCotizacion = async (cotizacionID) => {
    const r = await axios.post(`${API}/cotizaciones/${cotizacionID}/aceptar`);
    return r.data; // { message, venta: { VentaID, ... } }
};

export const rechazarCotizacion = async (cotizacionID, motivo = "") => {
    const body = motivo && motivo.trim() ? { motivo: motivo.trim().slice(0, 300) } : {};
    const r = await axios.post(`${API}/cotizaciones/${cotizacionID}/rechazar`, body);
    return r.data;
};

const leerHistorial = async (url) => {
    try {
        const r = await axios.get(url);
        return Array.isArray(r.data) ? r.data : [];
    } catch {
        return null; // null = no disponible (distinto de "vacío")
    }
};

export const getHistorialCotizacion = (cotizacionID) => leerHistorial(`${API}/cotizaciones/${cotizacionID}/historial`);
export const getHistorialVenta = (ventaID) => leerHistorial(`${API}/ventas/${ventaID}/historial`);

/* ── Pedidos ── */
export const subirComprobanteVenta = async (ventaID, comprobanteTransferencia, fechaTransferencia) => {
    const r = await axios.patch(`${API}/ventas/${ventaID}/comprobante`, {
        comprobanteTransferencia,
        fechaTransferencia: fechaTransferencia || new Date().toISOString(),
    });
    return r.data;
};

/**
 * Cotizaciones y compras del cliente para el resumen de "Mi cuenta" y el aviso del menú.
 * Nunca lanza: devuelve null en la lista que no pudo consultar.
 */
export const cargarResumenCliente = async (documentoID) => {
    if (!documentoID) return { cotizaciones: null, ventas: null };
    const [cot, ven] = await Promise.all([
        axios.get(`${API}/cotizaciones/usuario/${encodeURIComponent(documentoID)}`).then((r) => (Array.isArray(r.data) ? r.data : null)).catch(() => null),
        axios.get(`${API}/ventas`, { params: { documentoID, limit: 1000, page: 1 } }).then((r) => {
            const lista = Array.isArray(r.data) ? r.data : (r.data?.datos || []);
            return lista.filter((v) => String(v.DocumentoID) === String(documentoID));
        }).catch(() => null),
    ]);
    return { cotizaciones: cot, ventas: ven };
};

/** Lee un File como dataURL base64. */
export const archivoADataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

/** Mensaje de error legible desde una respuesta axios/fetch. */
export const mensajeError = (err, porDefecto = "Intenta nuevamente.") =>
    err?.response?.data?.message || err?.response?.data?.mensaje || err?.response?.data?.error || err?.message || porDefecto;
