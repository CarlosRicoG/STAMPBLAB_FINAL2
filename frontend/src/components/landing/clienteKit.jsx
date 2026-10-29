/* eslint-disable react-refresh/only-export-components -- módulo de utilidades y componentes compartidos; solo afecta al recargado en caliente en desarrollo */
import React, { useEffect, useState } from "react";
import { FaWhatsapp, FaHistory } from "react-icons/fa";
import { urlWhatsApp, formatoFechaHoraCO, resumenAtencion } from "../../utils/clienteUtils";
import { getConfigPublica, cargarResumenCliente } from "../../Services/api-cliente/cliente";
import { leerUsuario } from "./miCuentaKit";

/* ═══════════════════════════════════════════════════════════
   Piezas compartidas del flujo del cliente (línea de tiempo,
   WhatsApp, avisos). Reusan el CSS del kit (.mc-*).
   ═══════════════════════════════════════════════════════════ */

/** Configuración pública (whatsapp, plazo de pago, costo de envío...) con valores por defecto. */
export const useConfigPublica = () => {
    const [config, setConfig] = useState(null);
    useEffect(() => {
        let vivo = true;
        getConfigPublica().then((c) => { if (vivo) setConfig(c); });
        return () => { vivo = false; };
    }, []);
    return config;
};

/**
 * Cotizaciones/compras del cliente y lo que requiere su atención. `activo=false` no consulta nada.
 * Si una consulta falla queda en null (la pantalla decide qué mostrar).
 */
export const useResumenCliente = (activo = true) => {
    const [datos, setDatos] = useState({ cargando: activo, cotizaciones: null, ventas: null, config: null });
    const [version, setVersion] = useState(0);
    useEffect(() => {
        if (!activo) return undefined;
        let vivo = true;
        setDatos((d) => ({ ...d, cargando: true }));
        (async () => {
            const documentoID = leerUsuario().DocumentoID || leerUsuario().documentoID;
            const [{ cotizaciones, ventas }, config] = await Promise.all([cargarResumenCliente(documentoID), getConfigPublica()]);
            if (vivo) setDatos({ cargando: false, cotizaciones, ventas, config });
        })();
        return () => { vivo = false; };
    }, [activo, version]);
    const atencion = resumenAtencion(datos.cotizaciones || [], datos.ventas || [], datos.config?.plazoPagoHoras);
    return { ...datos, atencion, recargar: () => setVersion((v) => v + 1) };
};

/** Línea de tiempo. `eventos` = [{Fecha, Estado, Nota}] o null si no se pudo cargar. */
export const LineaTiempo = ({ eventos, cargando, titulo = "Historial" }) => (
    <div className="ck-card" aria-live="polite">
        <small className="mc-lbl" style={{ display: "flex", alignItems: "center", gap: 7 }}><FaHistory size={11} /> {titulo}</small>
        {cargando ? (
            <div className="mc-skel" style={{ height: 52, width: "100%" }} />
        ) : !eventos ? (
            <p className="ck-muted">No pudimos cargar el historial en este momento. Intenta de nuevo más tarde.</p>
        ) : eventos.length === 0 ? (
            <p className="ck-muted">Aún no hay movimientos registrados.</p>
        ) : (
            <ol className="ck-tl">
                {eventos.map((e, i) => (
                    <li key={`${e.Fecha}-${i}`} className={i === eventos.length - 1 ? "now" : ""}>
                        <span className="ck-tl-dot" aria-hidden="true" />
                        <div>
                            <b>{e.Estado || "Actualización"}</b>
                            <time dateTime={e.Fecha}>{formatoFechaHoraCO(e.Fecha)}</time>
                            {e.Nota && <p>{e.Nota}</p>}
                        </div>
                    </li>
                ))}
            </ol>
        )}
    </div>
);

/** Botón "Escribir por WhatsApp": solo se muestra si hay número configurado. */
export const BotonWhatsApp = ({ numero, texto, className = "" }) => {
    const url = urlWhatsApp(numero, texto);
    if (!url) return null;
    return (
        <a className={`ck-wa ${className}`} href={url} target="_blank" rel="noopener noreferrer">
            <FaWhatsapp size={15} /> Escribir por WhatsApp
        </a>
    );
};

export const CLIENTE_CSS = `
.swal2-container { z-index: 20000 !important; }
.ck-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px 18px; margin-bottom: 22px; }
.ck-muted { margin: 0; font-size: 13px; color: #64748b; }
.ck-tl { list-style: none; margin: 8px 0 0; padding: 0; position: relative; }
.ck-tl li { position: relative; display: flex; gap: 14px; padding: 0 0 16px; }
.ck-tl li:last-child { padding-bottom: 0; }
.ck-tl li::before { content: ""; position: absolute; left: 6px; top: 16px; bottom: -2px; width: 2px; background: #dbe3ef; }
.ck-tl li:last-child::before { display: none; }
.ck-tl-dot { width: 14px; height: 14px; margin-top: 3px; border-radius: 50%; background: #4f8ef7; border: 3px solid #dbeafe; flex-shrink: 0; position: relative; z-index: 1; }
.ck-tl li.now .ck-tl-dot { background: linear-gradient(135deg, #4f8ef7, #7c3aed); border-color: #ddd6fe; }
.ck-tl b { display: block; font-size: 14px; font-weight: 800; color: #1a2540; }
.ck-tl time { display: block; font-size: 12px; color: #64748b; margin-top: 1px; }
.ck-tl p { margin: 5px 0 0; font-size: 13px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 10px; }

.ck-wa { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #fff !important; text-decoration: none; background: #16a34a; box-shadow: 0 10px 22px rgba(22,163,74,.3); transition: transform .25s, box-shadow .25s; }
.ck-wa:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(22,163,74,.4); }

.ck-alert { display: flex; gap: 12px; align-items: flex-start; border-radius: 16px; padding: 14px 16px; margin-bottom: 18px; border: 1.5px solid; }
.ck-alert.warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.ck-alert.bad { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.ck-alert.ok { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.ck-alert.info { background: #eef3ff; border-color: #c7d9ff; color: #1e3a8a; }
.ck-alert svg { flex-shrink: 0; margin-top: 2px; }
.ck-alert b { display: block; font-size: 14px; margin-bottom: 2px; }
.ck-alert p { margin: 0; font-size: 13px; line-height: 1.5; }
.ck-alert .ck-btn { margin-top: 10px; }

.ck-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; border-radius: 12px; font-size: 13px; font-weight: 800; border: 0; cursor: pointer; text-decoration: none; color: #fff; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 10px 22px rgba(124,58,237,.28); transition: transform .25s, box-shadow .25s, opacity .2s; font-family: 'Outfit', sans-serif; }
.ck-btn:hover:not(:disabled) { transform: translateY(-2px); color: #fff; box-shadow: 0 14px 28px rgba(124,58,237,.4); }
.ck-btn:disabled { opacity: .6; cursor: not-allowed; }
.ck-btn.green { background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 10px 22px rgba(22,163,74,.3); }
.ck-btn.ghost { background: #fff; color: #1a2540; border: 1.5px solid #cbd5e1; box-shadow: none; }
.ck-btn.ghost:hover:not(:disabled) { color: #4f8ef7; border-color: #4f8ef7; }
.ck-btn.danger { background: #fff; color: #dc2626; border: 1.5px solid #fecaca; box-shadow: none; }
.ck-btn.danger:hover:not(:disabled) { background: #dc2626; color: #fff; }

.ck-price { background: #fff; border: 1px solid #bbf7d0; border-radius: 18px; padding: 16px 18px; margin-bottom: 22px; }
.ck-price-row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 13px; color: #475569; border-bottom: 1px dashed #e2e8f0; }
.ck-price-row b { color: #1a2540; white-space: nowrap; }
.ck-price-row.sub { padding-left: 14px; font-size: 12px; color: #64748b; border-bottom: 0; }
.ck-price-tot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 12px; font-weight: 800; color: #1a2540; }
.ck-price-tot strong { font-size: 26px; font-weight: 900; color: #16a34a; letter-spacing: -.03em; }
.ck-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.ck-note { font-size: 12.5px; color: #64748b; line-height: 1.55; margin: 12px 0 0; }

.ck-input { width: 100%; padding: 11px 14px; font-size: 14px; border: 1.5px solid #dbe3ef; border-radius: 12px; font-family: 'Outfit', sans-serif; }
@media (max-width: 760px) { .ck-actions .ck-btn { flex: 1 1 100%; } }
`;
