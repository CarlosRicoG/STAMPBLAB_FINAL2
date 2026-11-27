/**
 * Comprobante de transferencia (imagen o PDF) para el panel: lo usan ModalDetalleVenta y Hoy.
 * - Imagen: miniatura con zoom (lightbox).
 * - PDF (data:application/pdf;base64,... o ruta .pdf): botón "Ver PDF" que lo abre en otra pestaña desde un blob.
 * - Rutas "/uploads/..." se piden al backend (API_BASE delante).
 * Los estilos (vt-*, cf-p-*) los pone cada pantalla; aquí solo se reciben los nombres de clase.
 */
import React from "react";
import { FaSearchPlus, FaDownload, FaFilePdf } from "react-icons/fa";
import { esPdf, urlComprobante, abrirPdf } from "../utils/comprobante";
import { C } from "../config/tokens";

/**
 * Bloque del comprobante en el detalle de la venta (estilos vt-* de ModalDetalleVenta).
 * `onZoom` abre el lightbox (solo imágenes); `children` son acciones extra (p. ej. rechazar).
 */
export default function VisorComprobante({ comprobante, ventaID, onZoom, children }) {
    if (!comprobante) return null;
    const url = urlComprobante(comprobante);
    const pdf = esPdf(comprobante);
    const estiloBoton = { display: "inline-flex", alignItems: "center", gap: 7 };
    return (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {pdf ? (
                <button type="button" className="vt-proof" onClick={() => abrirPdf(comprobante)} title="Ver PDF" aria-label="Ver comprobante en PDF"
                    style={{ width: 140, height: 160, padding: 0, display: "grid", placeItems: "center", cursor: "pointer", font: "inherit" }}>
                    <FaFilePdf size={44} color={C.danger} aria-hidden="true" />
                    <div className="vt-proof-hint"><FaFilePdf aria-hidden="true" /> PDF</div>
                </button>
            ) : (
                <div className="vt-proof" onClick={onZoom} title="Ampliar comprobante">
                    <img src={url} alt="Comprobante de pago" />
                    <div className="vt-proof-hint"><FaSearchPlus /> Ampliar</div>
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pdf
                    ? <button className="vt-btn-ghost" onClick={() => abrirPdf(comprobante)} style={estiloBoton}><FaFilePdf /> Ver PDF</button>
                    : <button className="vt-btn-ghost" onClick={onZoom} style={estiloBoton}><FaSearchPlus /> Ver comprobante</button>}
                <a className="vt-btn-ghost" href={url} download={`comprobante-venta-${ventaID}${pdf ? ".pdf" : ""}`} style={{ ...estiloBoton, textDecoration: "none" }}><FaDownload /> Descargar</a>
                {children}
            </div>
        </div>
    );
}

/**
 * Comprobante ampliado a pantalla completa. Si es PDF muestra una tarjeta con "Ver PDF" (el clic del usuario
 * abre la pestaña, así no lo bloquea el navegador). `children` es el pie (botón Cerrar o texto de ayuda).
 */
export function LightboxComprobante({ comprobante, onCerrar, className, claseBoton = "vt-btn-ghost", imgStyle, children, ...resto }) {
    if (!comprobante) return null;
    const detener = (e) => e.stopPropagation();
    return (
        <div className={className} onClick={onCerrar} {...resto}>
            {esPdf(comprobante) ? (
                <div onClick={detener} style={{ background: C.white, borderRadius: 12, padding: "22px 26px", textAlign: "center", maxWidth: 360, cursor: "default" }}>
                    <FaFilePdf size={44} color={C.danger} aria-hidden="true" />
                    <p style={{ margin: "10px 0 14px", color: C.navy, fontWeight: 700, fontSize: 14 }}>El comprobante es un PDF</p>
                    <button type="button" className={claseBoton} onClick={() => abrirPdf(comprobante)} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <FaFilePdf aria-hidden="true" /> Ver PDF
                    </button>
                </div>
            ) : (
                <img src={urlComprobante(comprobante)} alt="Comprobante ampliado" onClick={detener} style={imgStyle} />
            )}
            {children}
        </div>
    );
}
