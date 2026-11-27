/** Comprobantes de pago (imagen o PDF): URL final y apertura del PDF desde un blob. */
import API_BASE from "../config/api";

/** Tiempo que se mantiene vivo el blob del PDF: de sobra para que la pestaña nueva lo cargue. */
export const MS_LIBERAR_BLOB = 60_000;

export const esPdf = (c) => typeof c === "string" && (/^data:application\/pdf/i.test(c) || /\.pdf(?:[?#]|$)/i.test(c));

/** Las rutas relativas del servidor ("/uploads/...") van contra el backend; data URLs y URLs completas, tal cual. */
export const urlComprobante = (c) => (typeof c === "string" && c.startsWith("/") ? `${API_BASE}${c}` : c);

/** Convierte una data URL (base64 o texto) en Blob. */
export function dataUrlABlob(dataUrl) {
    const coma = dataUrl.indexOf(",");
    const cab = coma >= 0 ? dataUrl.slice(0, coma) : dataUrl;
    const datos = coma >= 0 ? dataUrl.slice(coma + 1) : "";
    const tipo = (cab.match(/^data:([^;,]+)/i) || [])[1] || "application/octet-stream";
    const bytes = /;base64/i.test(cab)
        ? Uint8Array.from(atob(datos), (ch) => ch.charCodeAt(0))
        : new TextEncoder().encode(decodeURIComponent(datos));
    return new Blob([bytes], { type: tipo });
}

/**
 * Abre el PDF en otra pestaña. Llamarla DIRECTAMENTE desde el clic (sin ningún await antes): si no, el
 * navegador la trata como ventana emergente y la bloquea. El blob se libera pasado MS_LIBERAR_BLOB.
 */
export function abrirPdf(comprobante) {
    if (!comprobante) return;
    let url = urlComprobante(comprobante);
    let blobUrl = null;
    if (/^data:/i.test(comprobante)) {
        blobUrl = URL.createObjectURL(dataUrlABlob(comprobante));
        url = blobUrl;
    }
    window.open(url, "_blank", "noopener");
    if (blobUrl) setTimeout(() => URL.revokeObjectURL(blobUrl), MS_LIBERAR_BLOB);
}
