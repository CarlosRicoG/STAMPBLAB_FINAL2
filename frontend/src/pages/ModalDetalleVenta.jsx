import { descargarComprobante, getHistorialVenta, rechazarComprobante } from "../Services/api-ventas/ventas";
import { getConfigPublica } from "../Services/api-resumen/resumen";
import { siguientesEstados, NOMBRE_ESTADO_VENTA, ESTADOS_CON_FECHA, hoyISO, whatsappUrl, fechaLimitePago } from "../Services/api-ventas/flujo";
import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import { FaCreditCard, FaTruck, FaInfoCircle, FaTimes, FaUser, FaReceipt, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaIdCard, FaCheck, FaBan, FaSearchPlus, FaDownload, FaBoxOpen, FaStore, FaWhatsapp, FaHistory, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { ESTADO_VENTA } from "../config/estados";

/* ══════════════════════════════════════════════════════════
   Utilidades compartidas del módulo de Ventas (Pedidos / Pendientes)
   ══════════════════════════════════════════════════════════ */
export const VT = {
    navy: "#1a2540",
    navy2: "#2d3f6e",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    violet: "#7c3aed",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

/* Estados de venta (tabla estados, tipo 'venta') */
export const ESTADOS_VENTA = {
    8: { nombre: "Pendiente", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    9: { nombre: "Pagada", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    10: { nombre: "En Producción", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    13: { nombre: "Lista para Entrega", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
    11: { nombre: "Entregada", color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
    12: { nombre: "Cancelada", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};
const ESTILO_POR_NOMBRE = Object.fromEntries(Object.values(ESTADOS_VENTA).map(e => [e.nombre, e]));
export const estiloEstado = (idOrNombre) =>
    ESTADOS_VENTA[idOrNombre] || ESTILO_POR_NOMBRE[idOrNombre] || { nombre: idOrNombre || "Sin estado", color: VT.muted, bg: "#f1f5f9", border: VT.border };

/* Flujo normal de un pedido (para el timeline) */
export const FLUJO_VENTA = [8, 9, 10, 13, 11];

export const EstadoBadge = ({ id, nombre, size = "sm" }) => {
    const s = estiloEstado(id ?? nombre);
    const label = nombre || s.nombre;
    return (
        <span className={`vt-badge vt-badge-${size}`} style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            <span className="vt-dot" style={{ background: s.color }} />
            {label}
        </span>
    );
};

export const fmtCOP = (valor) => {
    const num = parseFloat(valor) || 0;
    return "$" + num.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const fmtFecha = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtHora = (fecha) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
};

export const iniciales = (nombre = "") =>
    (nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("") || "?").toUpperCase();

const COLORES_HEX = {
    blanco: "#ffffff", negro: "#111827", rojo: "#dc2626", azul: "#2563eb", gris: "#9ca3af",
    verde: "#16a34a", amarillo: "#facc15", naranja: "#f97316", rosado: "#f472b6", rosa: "#f472b6",
    morado: "#7c3aed", violeta: "#7c3aed", beige: "#e7d8b9", cafe: "#7c4a21", "café": "#7c4a21",
    marron: "#7c4a21", "marrón": "#7c4a21", vinotinto: "#7f1d1d", celeste: "#7dd3fc", turquesa: "#14b8a6",
    "azul marino": "#1e3a8a", "verde militar": "#4d5d2b", crema: "#fef3c7", fucsia: "#d946ef", dorado: "#d4a017", plateado: "#c0c0c0",
};
export const colorHex = (nombre = "") => COLORES_HEX[nombre.trim().toLowerCase()] || null;

/* CSS compartido (prefijo .vt-) */
export const VT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
.vt-page, .vt-page *, .vt-overlay, .vt-overlay * { box-sizing: border-box; }
.vt-page { font-family:'Outfit',sans-serif; }
@keyframes vtFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes vtFade { from{opacity:0} to{opacity:1} }
@keyframes vtPop { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:none} }
@keyframes vtShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes vtSpin { to{transform:rotate(360deg)} }
@keyframes vtPulse { 0%,100%{box-shadow:0 0 0 0 rgba(79,142,247,.45)} 50%{box-shadow:0 0 0 6px rgba(79,142,247,0)} }

.vt-badge { display:inline-flex; align-items:center; gap:6px; border:1px solid; border-radius:999px; font-weight:700; font-family:'Outfit',sans-serif; white-space:nowrap; line-height:1.2; }
.vt-badge-sm { padding:4px 11px; font-size:11.5px; }
.vt-badge-lg { padding:6px 14px; font-size:13px; }
.vt-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
.vt-id { display:inline-block; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; border-radius:8px; padding:3px 9px; font-size:12px; font-weight:700; font-variant-numeric:tabular-nums; }

.vt-card-table { background:#fff; border-radius:18px; box-shadow:0 2px 16px rgba(15,23,42,.06), 0 0 0 1px #eef2f7; overflow:hidden; animation:vtFadeUp .35s ease both; }
.vt-table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; font-family:'Outfit',sans-serif; }
.vt-table thead tr { background:linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%); }
.vt-table th { background:transparent; color:#fff; font-size:11px; font-weight:700; padding:13px 16px; white-space:nowrap; letter-spacing:.06em; text-transform:uppercase; text-align:left; }
.vt-table td { padding:13px 16px; border-bottom:1px solid #eef2f7; vertical-align:middle; }
.vt-table tbody tr:last-child td { border-bottom:none; }
.vt-row { transition:background .15s ease, box-shadow .15s ease; animation:vtFadeUp .3s ease both; }
.vt-row:nth-child(even) { background:#fbfcfe; }
.vt-row:hover { background:#f3f7ff; box-shadow:inset 3px 0 0 #4f8ef7; }
.vt-num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }

.vt-client { display:flex; align-items:center; gap:10px; min-width:0; }
.vt-avatar { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; background:linear-gradient(135deg,#4f8ef7,#7c3aed); box-shadow:0 2px 6px rgba(79,142,247,.3); }
.vt-client-name { font-weight:700; color:#1a2540; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px; }
.vt-client-sub { font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:6px; margin-top:1px; }
.vt-date { color:#1a2540; font-weight:600; font-size:12.5px; white-space:nowrap; }
.vt-time { color:#94a3b8; font-size:11.5px; }

.vt-actions { display:flex; gap:6px; justify-content:flex-end; }
.vt-ibtn { width:32px; height:32px; border-radius:9px; border:1.5px solid; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s ease, box-shadow .15s ease, background .15s ease; background:#fff; }
.vt-ibtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 4px 10px rgba(15,23,42,.12); }
.vt-ibtn:disabled { opacity:.35; cursor:not-allowed; }
.vt-ibtn-view { color:#4f8ef7; border-color:#c7d9ff; background:#f0f4ff; }
.vt-ibtn-view:hover:not(:disabled) { background:#4f8ef7; color:#fff; border-color:#4f8ef7; }
.vt-ibtn-edit { color:#d97706; border-color:#fde68a; background:#fffbeb; }
.vt-ibtn-edit:hover:not(:disabled) { background:#d97706; color:#fff; border-color:#d97706; }
.vt-ibtn-state { color:#7c3aed; border-color:#ddd6fe; background:#f5f3ff; }
.vt-ibtn-state:hover:not(:disabled) { background:#7c3aed; color:#fff; border-color:#7c3aed; }
.vt-ibtn-ok { color:#16a34a; border-color:#bbf7d0; background:#f0fdf4; }
.vt-ibtn-ok:hover:not(:disabled) { background:#16a34a; color:#fff; border-color:#16a34a; }
.vt-ibtn-del { color:#dc2626; border-color:#fecaca; background:#fef2f2; }
.vt-ibtn-del:hover:not(:disabled) { background:#dc2626; color:#fff; border-color:#dc2626; }

.vt-search { position:relative; }
.vt-search input { border:1.5px solid #e2e8f0; border-radius:11px; padding:10px 34px 10px 36px; font-size:13px; font-family:'Outfit',sans-serif; outline:none; width:270px; color:#0f172a; background:#fff; transition:border-color .18s, box-shadow .18s; }
.vt-search input:focus { border-color:#4f8ef7; box-shadow:0 0 0 4px rgba(79,142,247,.12); }
.vt-search .vt-search-ic { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
.vt-search .vt-search-x { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:22px; height:22px; border-radius:50%; border:none; background:#f1f5f9; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; }

.vt-btn-primary { background:#1a2540; color:#fff; border:none; border-radius:11px; padding:10px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(26,37,64,.25); transition:transform .18s, background .18s, box-shadow .18s; }
.vt-btn-primary:hover:not(:disabled) { background:#2d3f6e; transform:translateY(-1px); box-shadow:0 8px 20px rgba(26,37,64,.3); }
.vt-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
.vt-btn-ghost { background:#f1f5f9; color:#475569; border:none; border-radius:11px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; transition:background .18s; }
.vt-btn-ghost:hover { background:#e2e8f0; }

.vt-skel { height:12px; border-radius:6px; background:linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size:800px 100%; animation:vtShimmer 1.2s linear infinite; }

.vt-empty { text-align:center; padding:56px 20px; }
.vt-empty-ic { width:64px; height:64px; border-radius:20px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:26px; }
.vt-empty h5 { margin:0 0 4px; font-size:15px; font-weight:800; color:#1a2540; }
.vt-empty p { margin:0 0 16px; font-size:13px; color:#64748b; }

/* ── Modales ── */
.vt-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation:vtFade .2s ease; font-family:'Outfit',sans-serif; }
.vt-modal { background:#fff; border-radius:20px; width:100%; max-height:92vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 24px 60px rgba(15,23,42,.35); animation:vtPop .28s cubic-bezier(.2,.8,.2,1); }
.vt-mhead { position:relative; background:linear-gradient(120deg,#1a2540 0%,#2d3f6e 60%,#3b3f8f 100%); color:#fff; padding:22px 26px; overflow:hidden; flex-shrink:0; }
.vt-mhead::after { content:""; position:absolute; right:-60px; top:-80px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(79,142,247,.35), transparent 70%); pointer-events:none; }
.vt-mclose { width:34px; height:34px; border-radius:10px; border:1.5px solid rgba(255,255,255,.28); background:rgba(255,255,255,.1); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .18s, transform .18s; position:relative; z-index:1; }
.vt-mclose:hover { background:rgba(255,255,255,.22); transform:rotate(90deg); }
.vt-mbody { padding:22px 26px; overflow-y:auto; flex:1; background:#f8fafc; }
.vt-mfoot { padding:14px 26px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:10px; flex-shrink:0; background:#fff; }

.vt-sec { background:#fff; border:1px solid #e9eef5; border-radius:16px; padding:16px 18px; box-shadow:0 1px 3px rgba(15,23,42,.04); animation:vtFadeUp .35s ease both; }
.vt-sec-title { display:flex; align-items:center; gap:8px; margin:0 0 12px; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#64748b; }
.vt-sec-title .vt-sec-ic { width:24px; height:24px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:11px; }
.vt-kv { display:flex; align-items:flex-start; gap:9px; font-size:13px; color:#334155; margin-top:7px; }
.vt-kv svg { color:#94a3b8; margin-top:3px; flex-shrink:0; }

.vt-timeline { display:flex; align-items:flex-start; justify-content:space-between; position:relative; padding:4px 4px 0; }
.vt-step { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; text-align:center; }
.vt-step::before { content:""; position:absolute; top:13px; right:50%; width:100%; height:3px; background:#e2e8f0; z-index:0; }
.vt-step:first-child::before { display:none; }
.vt-step.done::before, .vt-step.current::before { background:linear-gradient(90deg,#4f8ef7,#7c3aed); }
.vt-step-dot { width:28px; height:28px; border-radius:50%; background:#fff; border:3px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-size:11px; color:#fff; position:relative; z-index:1; transition:all .2s; }
.vt-step.done .vt-step-dot { background:#4f8ef7; border-color:#4f8ef7; }
.vt-step.current .vt-step-dot { background:#7c3aed; border-color:#7c3aed; animation:vtPulse 1.8s ease infinite; }
.vt-step-lbl { font-size:11px; font-weight:600; color:#94a3b8; margin-top:7px; line-height:1.2; }
.vt-step.done .vt-step-lbl { color:#475569; }
.vt-step.current .vt-step-lbl { color:#7c3aed; font-weight:800; }

.vt-item { display:flex; gap:14px; align-items:center; padding:12px 0; border-bottom:1px dashed #e2e8f0; }
.vt-item:last-child { border-bottom:none; }
.vt-thumb { width:58px; height:58px; border-radius:12px; background:#f1f5f9; border:1px solid #e2e8f0; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.vt-thumb img { width:100%; height:100%; object-fit:cover; }
.vt-chip { display:inline-flex; align-items:center; gap:5px; background:#f1f5f9; color:#334155; border:1px solid #e2e8f0; border-radius:999px; padding:2px 9px; font-size:11.5px; font-weight:600; }
.vt-swatch { width:11px; height:11px; border-radius:50%; border:1px solid rgba(15,23,42,.2); display:inline-block; }

.vt-total-box { background:linear-gradient(135deg,#1a2540,#2d3f6e); color:#fff; border-radius:14px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; margin-top:12px; }

.vt-proof { position:relative; display:inline-block; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; cursor:zoom-in; background:#f8fafc; }
.vt-proof img { display:block; max-width:200px; max-height:230px; object-fit:contain; transition:transform .25s; }
.vt-proof:hover img { transform:scale(1.04); }
.vt-proof-hint { position:absolute; inset:auto 0 0 0; background:linear-gradient(transparent, rgba(15,23,42,.75)); color:#fff; font-size:11px; font-weight:700; padding:16px 8px 7px; display:flex; align-items:center; justify-content:center; gap:6px; }
.vt-lightbox { position:fixed; inset:0; z-index:1100; background:rgba(2,6,23,.88); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:14px; padding:24px; animation:vtFade .2s ease; cursor:zoom-out; }
.vt-lightbox img { max-width:92vw; max-height:80vh; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.5); background:#fff; }

.vt-grid-3 { display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; }
.vt-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width: 860px) { .vt-grid-3, .vt-grid-2 { grid-template-columns:1fr; } }
@media (max-width: 640px) {
  .vt-head { flex-direction:column; align-items:stretch !important; }
  .vt-search input { width:100%; }
  .vt-timeline .vt-step-lbl { font-size:9.5px; }
}
`;

/* ── Timeline de estado ── */
export const TimelineEstado = ({ estadoID }) => {
    if (estadoID === 12) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
                <FaBan /> Esta venta fue cancelada. El flujo del pedido se detuvo.
            </div>
        );
    }
    const idx = FLUJO_VENTA.indexOf(estadoID);
    return (
        <div className="vt-timeline">
            {FLUJO_VENTA.map((id, i) => {
                const cls = idx < 0 ? "" : i < idx ? "done" : i === idx ? (id === 11 ? "done" : "current") : "";
                return (
                    <div key={id} className={`vt-step ${cls}`}>
                        <div className="vt-step-dot">{(cls === "done" || cls === "current") && <FaCheck size={10} />}</div>
                        <div className="vt-step-lbl">{ESTADOS_VENTA[id].nombre}</div>
                    </div>
                );
            })}
        </div>
    );
};

/* ── Indicador compacto del método de pago (para tablas) ── */
export const MetodoPagoMini = ({ metodo }) => {
    if (metodo === "transferencia") return <span title="Transferencia" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: VT.accent }}><FaCreditCard size={10} /> Transferencia</span>;
    if (metodo === "contraentrega") return <span title="Contraentrega" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: VT.success }}><FaTruck size={10} /> Contraentrega</span>;
    return <span title="Venta presencial" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FaStore size={10} /> Presencial</span>;
};

/* ── Filas skeleton mientras carga ── */
export const SkeletonRows = ({ cols = 7, rows = 6 }) => (
    <>
        {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="vt-skel-row">
                {Array.from({ length: cols }).map((__, c) => (
                    <td key={c} style={{ padding: "16px" }}>
                        {c === 1 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="vt-skel" style={{ width: 34, height: 34, borderRadius: "50%" }} />
                                <div style={{ flex: 1 }}><div className="vt-skel" style={{ width: "70%", marginBottom: 6 }} /><div className="vt-skel" style={{ width: "40%", height: 9 }} /></div>
                            </div>
                        ) : (
                            <div className="vt-skel" style={{ width: c === cols - 1 ? 70 : `${50 + ((r * 7 + c * 13) % 40)}%`, marginLeft: c >= 3 && c !== 5 ? "auto" : 0 }} />
                        )}
                    </td>
                ))}
            </tr>
        ))}
    </>
);

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];
export const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
    if (totalItems === 0) return null;
    const paginas = [];
    const rangoIzq = Math.max(2, paginaActual - 2);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + 2);
    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);

    return (
        <div className="vt-pag">
            <style>{`
                .vt-pag { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1px solid #eef2f7; background:#fff; flex-wrap:wrap; gap:12px; font-family:'Outfit',sans-serif; }
                .vt-pbtn { min-width:34px; height:34px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; transition:all .18s; padding:0 8px; }
                .vt-pbtn:hover:not(:disabled):not(.on) { background:#f0f4ff; border-color:#4f8ef7; color:#4f8ef7; }
                .vt-pbtn.on { background:#1a2540; border-color:#1a2540; color:#fff; font-weight:700; cursor:default; box-shadow:0 4px 10px rgba(26,37,64,.25); }
                .vt-pbtn:disabled { opacity:.4; cursor:not-allowed; }
                .vt-pag select { border:1.5px solid #e2e8f0; border-radius:8px; padding:4px 10px; font-size:12px; font-family:'Outfit',sans-serif; outline:none; color:#1a2540; cursor:pointer; background:#fff; }
                .vt-pag select:focus { border-color:#4f8ef7; }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: VT.muted }}>
                    Mostrando <strong style={{ color: VT.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: VT.navy }}>{totalItems}</strong> pedidos
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: VT.muted }}>
                    Por página:
                    <select className="vt-per-page" value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}>
                        {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className="vt-pbtn" aria-label="Página anterior" onClick={() => onCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>‹</button>
                {paginas.map((p, i) => p === "..."
                    ? <span key={`e-${i}`} style={{ padding: "0 4px", color: VT.muted, fontSize: 13 }}>…</span>
                    : <button key={p} className={`vt-pbtn ${p === paginaActual ? "on" : ""}`} onClick={() => p !== paginaActual && onCambiarPagina(p)}>{p}</button>
                )}
                <button className="vt-pbtn" aria-label="Página siguiente" onClick={() => onCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>›</button>
            </div>
        </div>
    );
};

/* ── Campos opcionales al cambiar de estado: nota para el cliente y fecha estimada ── */
export const CamposNotaFecha = ({ nota, setNota, fecha, setFecha, pideFecha, errorFecha, errorNota }) => (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {pideFecha && (
            <div>
                <label htmlFor="vt-fecha-est" style={{ fontSize: 12, fontWeight: 700, color: VT.navy, display: "block", marginBottom: 6 }}>
                    Fecha estimada de entrega <span style={{ fontWeight: 500, color: VT.muted }}>(opcional)</span>
                </label>
                <input id="vt-fecha-est" type="date" value={fecha} min={hoyISO()} onChange={e => setFecha(e.target.value)}
                    aria-invalid={!!errorFecha}
                    style={{ border: `1.5px solid ${errorFecha ? VT.danger : VT.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif", color: VT.navy }} />
                {errorFecha && <div role="alert" style={{ color: VT.danger, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{errorFecha}</div>}
            </div>
        )}
        <div>
            <label htmlFor="vt-nota-cli" style={{ fontSize: 12, fontWeight: 700, color: VT.navy, display: "block", marginBottom: 6 }}>
                Nota para el cliente <span style={{ fontWeight: 500, color: VT.muted }}>(opcional)</span>
            </label>
            <textarea id="vt-nota-cli" value={nota} onChange={e => setNota(e.target.value)} rows={2} maxLength={320}
                placeholder="Ej.: Tu pedido ya está en producción, te avisamos cuando esté listo."
                aria-invalid={!!errorNota}
                style={{ width: "100%", border: `1.5px solid ${errorNota ? VT.danger : VT.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", color: VT.navy }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: errorNota ? VT.danger : VT.muted, marginTop: 3 }}>
                <span role={errorNota ? "alert" : undefined}>{errorNota || "El cliente la verá en el seguimiento de su pedido."}</span>
                <span>{nota.length}/300</span>
            </div>
        </div>
    </div>
);

/* ── Modal para cambiar / procesar el estado de una venta ── */
export const EstadoVentaModal = ({ show, venta, estados, titulo = "Cambiar estado de la venta", aviso, onClose, onConfirm }) => {
    const [sel, setSel] = useState("");
    const [saving, setSaving] = useState(false);
    const [nota, setNota] = useState("");
    const [fechaEst, setFechaEst] = useState("");
    useEffect(() => { if (show) { setSel(""); setSaving(false); setNota(""); setFechaEst(""); } }, [show, venta?.VentaID]);
    useEffect(() => {
        if (!show) return;
        const onKey = (e) => { if (e.key === "Escape" && !saving) onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [show, saving, onClose]);
    if (!show || !venta) return null;

    const unidades = (venta.detalles || []).reduce((a, d) => a + (parseInt(d.Cantidad) || 0), 0);
    const selID = parseInt(sel);
    // Solo estados válidos según la máquina de estados del pedido
    const validos = siguientesEstados(venta.EstadoID);
    const opciones = validos.map(id => estados.find(e => e.EstadoID === id) || { EstadoID: id, Nombre: NOMBRE_ESTADO_VENTA[id] });
    const pideFecha = ESTADOS_CON_FECHA.includes(selID);
    const hoy = hoyISO();
    const errorFecha = pideFecha && fechaEst && fechaEst < hoy ? "La fecha estimada no puede ser anterior a hoy." : "";
    const errorNota = nota.length > 300 ? "La nota no puede superar 300 caracteres." : "";

    const confirmar = async () => {
        if (!sel || saving || errorFecha || errorNota) return;
        setSaving(true);
        try {
            await onConfirm(selID, {
                nota: nota.trim() || undefined,
                fechaEstimadaEntrega: pideFecha && fechaEst ? fechaEst : undefined,
            });
        } finally { setSaving(false); }
    };

    return (
        <div className="vt-overlay" style={{ zIndex: 1060 }} onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose?.(); }}>
            <style>{VT_CSS}{`
                .vt-opt { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:1.5px solid #e2e8f0; background:#fff; border-radius:12px; padding:10px 14px; cursor:pointer; font-family:'Outfit',sans-serif; transition:border-color .15s, background .15s, transform .15s; }
                .vt-opt:hover { border-color:#c7d9ff; background:#fafcff; transform:translateX(2px); }
                .vt-opt.on { border-width:2px; padding:9.5px 13.5px; }
                .vt-radio { width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
            `}</style>
            <div className="vt-modal" style={{ maxWidth: 500 }}>
                <div className="vt-mhead" style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{titulo}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.7)" }}>Venta #{venta.VentaID} · {venta.usuario?.Nombre || `Doc: ${venta.DocumentoID}`} · {fmtCOP(venta.Total)}</p>
                        </div>
                        <button className="vt-mclose" onClick={onClose} disabled={saving} aria-label="Cerrar"><FaTimes size={13} /></button>
                    </div>
                </div>
                <div className="vt-mbody" style={{ background: "#fff", padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontSize: 12, color: VT.muted, fontWeight: 600, flexWrap: "wrap" }}>
                        Estado actual <EstadoBadge id={venta.EstadoID} nombre={venta.estado?.Nombre} />
                        {sel && <><span style={{ fontSize: 16, color: "#94a3b8" }}>→</span><EstadoBadge id={selID} /></>}
                    </div>
                    {aviso && (
                        <div style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#92400e", fontWeight: 600, display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <FaInfoCircle style={{ marginTop: 2, flexShrink: 0 }} /> {aviso}
                        </div>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 700, color: VT.navy, margin: "0 0 8px" }}>Seleccione el nuevo estado</p>
                    {opciones.length === 0 && (
                        <p style={{ fontSize: 13, color: VT.muted, margin: "0 0 8px" }}>Este pedido está en un estado final: ya no admite cambios de estado.</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="radiogroup" aria-label="Nuevo estado">
                        {opciones.map(e => {
                            const s = estiloEstado(e.EstadoID);
                            const on = selID === e.EstadoID;
                            return (
                                <button key={e.EstadoID} type="button" role="radio" aria-checked={on} data-estado={e.EstadoID}
                                    className={`vt-opt ${on ? "on" : ""}`} onClick={() => setSel(String(e.EstadoID))}
                                    style={on ? { borderColor: s.color, background: s.bg } : undefined}>
                                    <span className="vt-radio" style={on ? { borderColor: s.color } : undefined}>{on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: on ? s.color : VT.navy }}>{e.Nombre}</span>
                                        {e.Descripcion && <span style={{ display: "block", fontSize: 11.5, color: VT.muted }}>{e.Descripcion}</span>}
                                    </span>
                                    <span className="vt-dot" style={{ background: s.color, width: 9, height: 9 }} />
                                </button>
                            );
                        })}
                    </div>
                    {sel && (
                        <CamposNotaFecha nota={nota} setNota={setNota} fecha={fechaEst} setFecha={setFechaEst}
                            pideFecha={pideFecha} errorFecha={errorFecha} errorNota={errorNota} />
                    )}
                    {selID === 12 && (
                        <div style={{ marginTop: 12, background: venta.EstadoID === ESTADO_VENTA.PENDIENTE ? VT.successSoft : "#fef2f2", border: `1px solid ${venta.EstadoID === ESTADO_VENTA.PENDIENTE ? VT.successBorder : "#fecaca"}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: venta.EstadoID === ESTADO_VENTA.PENDIENTE ? "#166534" : "#991b1b", fontWeight: 600 }}>
                            {venta.EstadoID === ESTADO_VENTA.PENDIENTE
                                ? `Se devolverán ${unidades} unidad(es) al inventario. `
                                : "La venta ya no está pendiente: el stock NO se devuelve al inventario. "}
                            Una venta cancelada no se puede reactivar.
                        </div>
                    )}
                    {selID === ESTADO_VENTA.PENDIENTE && venta.EstadoID !== ESTADO_VENTA.PENDIENTE && (
                        <div style={{ marginTop: 12, background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#92400e", fontWeight: 600 }}>
                            La venta volverá al módulo de Pedidos Pendientes.
                        </div>
                    )}
                </div>
                <div className="vt-mfoot">
                    <button className="vt-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button className="vt-btn-primary vt-confirm-estado" onClick={confirmar} disabled={!sel || saving || !!errorFecha || !!errorNota}
                        style={selID === 12 ? { background: VT.danger, boxShadow: "0 4px 14px rgba(220,38,38,.3)" } : undefined}>
                        {saving && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "vtSpin .7s linear infinite" }} />}
                        {selID === 12 ? "Cancelar venta" : "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
let configCache = null; // /config-publica casi no cambia: se consulta una sola vez por sesión de la página

const ModalDetalleVenta = ({ venta, onClose, footerExtra, onActualizado }) => {
    const [zoom, setZoom] = useState(false);
    const [historial, setHistorial] = useState(null); // null = cargando, [] = sin datos o error
    const [config, setConfig] = useState(configCache);
    const [motivoLocal, setMotivoLocal] = useState(undefined); // undefined = usar el de la venta
    const [rechazando, setRechazando] = useState(false);
    const ventaID = venta?.VentaID;

    useEffect(() => {
        if (!ventaID) return;
        let vivo = true;
        setHistorial(null); setMotivoLocal(undefined);
        getHistorialVenta(ventaID)
            .then(h => { if (vivo) setHistorial(Array.isArray(h) ? h : []); })
            .catch(() => { if (vivo) setHistorial([]); });
        return () => { vivo = false; };
    }, [ventaID]);

    useEffect(() => {
        if (configCache) return;
        let vivo = true;
        getConfigPublica().then(c => { configCache = c || {}; if (vivo) setConfig(configCache); }).catch(() => { });
        return () => { vivo = false; };
    }, []);

    const handleRechazar = async () => {
        const r = await Swal.fire({
            title: "Rechazar comprobante",
            text: "El pedido seguirá Pendiente y se avisará al cliente para que suba uno nuevo. Indica el motivo.",
            input: "textarea", inputLabel: "Motivo del rechazo (5 a 300 caracteres)",
            inputPlaceholder: "Ej.: El valor transferido no coincide con el total del pedido.",
            inputAttributes: { maxlength: 300, "aria-label": "Motivo del rechazo" },
            showCancelButton: true, confirmButtonText: "Rechazar comprobante", cancelButtonText: "Cancelar",
            confirmButtonColor: VT.danger, cancelButtonColor: VT.navy,
            didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; },
            inputValidator: (v) => {
                const t = (v || "").trim();
                if (t.length < 5) return "El motivo debe tener al menos 5 caracteres.";
                if (t.length > 300) return "El motivo no puede superar 300 caracteres.";
                return undefined;
            },
        });
        if (!r.isConfirmed) return;
        setRechazando(true);
        try {
            const motivo = r.value.trim();
            await rechazarComprobante(ventaID, motivo);
            setMotivoLocal(motivo);
            Swal.fire({ icon: "success", title: "Comprobante rechazado", text: "Se avisó al cliente por correo.", timer: 2200, showConfirmButton: false,
                didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
            onActualizado?.();
        } catch (e) {
            Swal.fire({ icon: "error", title: "No se pudo rechazar el comprobante", text: e?.response?.data?.message || e?.message || "Intenta de nuevo.",
                didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
        } finally { setRechazando(false); }
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") { if (zoom) setZoom(false); else onClose?.(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom, onClose]);

    if (!venta) return null;

    const estadoNombre = venta.estado?.Nombre || estiloEstado(venta.EstadoID).nombre;
    const detalles = venta.detalles || [];
    const unidades = detalles.reduce((a, d) => a + (parseInt(d.Cantidad) || 0), 0);
    const subtotalCalc = detalles.reduce((a, d) => a + (parseInt(d.Cantidad) || 0) * (parseFloat(d.PrecioUnitario) || 0), 0);
    const subtotal = venta.Subtotal != null ? parseFloat(venta.Subtotal) : subtotalCalc;
    const total = venta.Total != null ? parseFloat(venta.Total) : subtotal;
    const fecha = venta.FechaVenta ? new Date(venta.FechaVenta) : null;
    const fechaLarga = fecha
        ? fecha.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + fmtHora(venta.FechaVenta)
        : "-";
    const cliente = venta.usuario || {};
    const metodo = venta.MetodoPago;
    const motivoRechazo = motivoLocal !== undefined ? motivoLocal : venta.ComprobanteMotivoRechazo;
    const pendiente = venta.EstadoID === ESTADO_VENTA.PENDIENTE;
    const esEnvio = venta.TipoEntrega === "envio";
    const hayEntrega = !!venta.TipoEntrega;
    const costoEnvio = parseFloat(venta.CostoEnvio) || 0;
    const telefonoCliente = venta.ContactoTelefono || cliente.Telefono || venta.TelefonoEntrega;
    const waUrl = whatsappUrl(telefonoCliente, `Hola ${venta.ContactoNombre || cliente.Nombre || ""}, te escribimos de STAMPLAB sobre tu pedido #${venta.VentaID}.`.replace(/\s+,/, ","));
    const limitePago = pendiente ? fechaLimitePago(venta.FechaVenta, config?.plazoPagoHoras) : null;
    // Las fechas "YYYY-MM-DD" se interpretan como día local (new Date() las toma como UTC y mostraría el día anterior)
    const fe = venta.FechaEstimadaEntrega ? String(venta.FechaEstimadaEntrega).slice(0, 10) : "";
    const fechaEstimada = /^\d{4}-\d{2}-\d{2}$/.test(fe) ? new Date(+fe.slice(0, 4), +fe.slice(5, 7) - 1, +fe.slice(8, 10)) : null;
    const fmtLarga = (d) => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) + " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="vt-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }} role="dialog" aria-modal="true" aria-label={`Detalle de la venta ${venta.VentaID}`}>
            <style>{VT_CSS}</style>
            <div className="vt-modal" style={{ maxWidth: 980 }}>
                {/* Cabecera */}
                <div className="vt-mhead">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, position: "relative", zIndex: 1 }}>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>Detalle del pedido</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>Venta #{venta.VentaID}</h2>
                                <EstadoBadge id={venta.EstadoID} nombre={estadoNombre} size="lg" />
                            </div>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,.75)", textTransform: "capitalize" }}>{fechaLarga}</p>
                        </div>
                        <button className="vt-mclose" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="vt-mbody">
                    {/* Timeline */}
                    <div className="vt-sec" style={{ marginBottom: 14 }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: "#f5f3ff", color: VT.violet }}><FaCheck /></span>Seguimiento del pedido</p>
                        <TimelineEstado estadoID={venta.EstadoID} />
                        {fechaEstimada && venta.EstadoID !== 12 && venta.EstadoID !== 11 && (
                            <div className="vt-kv" style={{ marginTop: 14, color: VT.violet, fontWeight: 700 }}>
                                <FaCalendarAlt size={12} style={{ color: VT.violet }} />
                                <span>Entrega estimada: {fechaEstimada.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                            </div>
                        )}
                    </div>

                    {limitePago && (
                        <div role="status" style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#92400e", fontWeight: 600, display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <FaClock style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>
                                Plazo de pago: el cliente debe pagar antes del {fmtLarga(limitePago)}
                                {limitePago < new Date() ? " (plazo vencido: el sistema cancelará el pedido automáticamente)." : ". Pasado ese plazo el pedido se cancela solo y el stock vuelve al inventario."}
                            </span>
                        </div>
                    )}

                    <div className="vt-grid-3" style={{ marginBottom: 14 }}>
                        {/* Cliente */}
                        <div className="vt-sec" style={{ animationDelay: ".04s" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaUser /></span>Cliente</p>
                            <div className="vt-client">
                                <div className="vt-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{iniciales(cliente.Nombre)}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div className="vt-client-name" style={{ fontSize: 15 }}>{cliente.Nombre || "Sin nombre"}</div>
                                    <div className="vt-client-sub"><FaIdCard size={11} /> {venta.DocumentoID || "N/A"}</div>
                                </div>
                            </div>
                            {cliente.Correo && <div className="vt-kv"><FaEnvelope size={12} /><span style={{ wordBreak: "break-all" }}>{cliente.Correo}</span></div>}
                            {cliente.Telefono && <div className="vt-kv"><FaPhoneAlt size={12} /><span>{cliente.Telefono}</span></div>}
                        </div>

                        {/* Pago */}
                        <div className="vt-sec" style={{ animationDelay: ".08s" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.successSoft, color: VT.success }}><FaCreditCard /></span>Método de pago</p>
                            {metodo === "transferencia" ? (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.accentSoft, color: VT.accent, borderColor: VT.accentBorder }}><FaCreditCard /> Transferencia bancaria</span>
                                    {venta.FechaTransferencia && <div className="vt-kv"><FaReceipt size={12} /><span>Transferido el {fmtFecha(venta.FechaTransferencia)} · {fmtHora(venta.FechaTransferencia)}</span></div>}
                                    {!venta.ComprobanteTransferencia && <div className="vt-kv" style={{ color: VT.warning }}><FaInfoCircle size={12} /><span>Sin comprobante adjunto</span></div>}
                                </>
                            ) : metodo === "contraentrega" ? (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.successSoft, color: VT.success, borderColor: VT.successBorder }}><FaTruck /> Pago contraentrega</span>
                                    <div className="vt-kv"><FaInfoCircle size={12} /><span>El cliente paga al recibir el pedido.</span></div>
                                </>
                            ) : (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.warningSoft, color: "#92400e", borderColor: VT.warningBorder }}><FaInfoCircle /> Venta presencial</span>
                                    <div className="vt-kv"><FaInfoCircle size={12} /><span>Sin método de pago registrado.</span></div>
                                </>
                            )}
                        </div>

                        {/* Totales */}
                        <div className="vt-sec" style={{ animationDelay: ".12s", display: "flex", flexDirection: "column" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: "#f5f3ff", color: VT.violet }}><FaReceipt /></span>Resumen</p>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: VT.muted, marginBottom: 6 }}>
                                <span>Productos</span><strong style={{ color: VT.navy }}>{detalles.length} ítem(s) · {unidades} und.</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: VT.muted }}>
                                <span>Subtotal</span><strong style={{ color: VT.navy }}>{fmtCOP(subtotal)}</strong>
                            </div>
                            <div className="vt-total-box" style={{ marginTop: "auto" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: .8 }}>Total</span>
                                <span data-testid="vt-total" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>{fmtCOP(total)}</span>
                            </div>
                        </div>
                    </div>

                    {(hayEntrega || venta.ContactoNombre || venta.ContactoTelefono || venta.ContactoDireccion || waUrl) && (
                        <div className="vt-sec" style={{ marginBottom: 14 }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaTruck /></span>Entrega y contacto del pedido</p>
                            <div className="vt-grid-3" style={{ gap: 10 }}>
                                {[
                                    { ic: esEnvio ? <FaTruck /> : <FaStore />, l: "Tipo de entrega", v: hayEntrega ? (esEnvio ? "Envío a domicilio" : "Retiro en tienda") : "—" },
                                    { ic: <FaReceipt />, l: "Costo de envío", v: hayEntrega ? (esEnvio ? (costoEnvio > 0 ? fmtCOP(costoEnvio) : "Sin costo") : "No aplica") : "—" },
                                    { ic: <FaUser />, l: "Contacto", v: venta.ContactoNombre },
                                    { ic: <FaPhoneAlt />, l: "Teléfono de contacto", v: venta.ContactoTelefono },
                                    { ic: <FaMapMarkerAlt />, l: "Dirección de contacto", v: venta.ContactoDireccion },
                                ].map(x => (
                                    <div key={x.l} style={{ background: VT.bg, borderRadius: 12, padding: "10px 12px", border: "1px solid #eef2f7" }}>
                                        <div style={{ fontSize: 11, color: VT.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{x.ic}{x.l}</div>
                                        <div style={{ fontSize: 13.5, color: VT.navy, fontWeight: 600, marginTop: 3, wordBreak: "break-word" }}>{x.v || "—"}</div>
                                    </div>
                                ))}
                            </div>
                            {waUrl && (
                                <a className="vt-btn-ghost" href={waUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", marginTop: 12, color: "#15803d", background: VT.successSoft }}>
                                    <FaWhatsapp size={15} /> Escribir por WhatsApp
                                </a>
                            )}
                        </div>
                    )}

                    {(metodo === "contraentrega" || venta.ComprobanteTransferencia) && (
                        <div className="vt-grid-2" style={{ marginBottom: 14, gridTemplateColumns: metodo === "contraentrega" && venta.ComprobanteTransferencia ? "1fr 1fr" : "1fr" }}>
                            {metodo === "contraentrega" && (
                                <div className="vt-sec">
                                    <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.successSoft, color: VT.success }}><FaTruck /></span>Datos de entrega</p>
                                    <div className="vt-grid-3" style={{ gap: 10 }}>
                                        {[
                                            { ic: <FaUser />, l: "Recibe", v: venta.NombreReceptor },
                                            { ic: <FaPhoneAlt />, l: "Teléfono", v: venta.TelefonoEntrega },
                                            { ic: <FaMapMarkerAlt />, l: "Dirección", v: venta.DireccionEntrega },
                                        ].map(x => (
                                            <div key={x.l} style={{ background: VT.bg, borderRadius: 12, padding: "10px 12px", border: "1px solid #eef2f7" }}>
                                                <div style={{ fontSize: 11, color: VT.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{x.ic}{x.l}</div>
                                                <div style={{ fontSize: 13.5, color: VT.navy, fontWeight: 600, marginTop: 3, wordBreak: "break-word" }}>{x.v || "—"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {venta.ComprobanteTransferencia && (
                                <div className="vt-sec">
                                    <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaReceipt /></span>Comprobante de transferencia</p>
                                    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                                        <div className="vt-proof" onClick={() => setZoom(true)} title="Ampliar comprobante">
                                            <img src={venta.ComprobanteTransferencia} alt="Comprobante de pago" />
                                            <div className="vt-proof-hint"><FaSearchPlus /> Ampliar</div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <button className="vt-btn-ghost" onClick={() => setZoom(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><FaSearchPlus /> Ver comprobante</button>
                                            <a className="vt-btn-ghost" href={venta.ComprobanteTransferencia} download={`comprobante-venta-${venta.VentaID}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}><FaDownload /> Descargar</a>
                                            {pendiente && metodo === "transferencia" && (
                                                <button className="vt-btn-ghost" onClick={handleRechazar} disabled={rechazando}
                                                    style={{ display: "inline-flex", alignItems: "center", gap: 7, color: VT.danger, background: "#fef2f2" }}>
                                                    <FaBan /> {rechazando ? "Rechazando..." : "Rechazar comprobante"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {motivoRechazo && (
                                        <div role="status" style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#991b1b", fontWeight: 600 }}>
                                            Comprobante rechazado. Motivo: <span style={{ fontWeight: 500 }}>{motivoRechazo}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Historial */}
                    <div className="vt-sec" style={{ marginBottom: 14 }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: "#f5f3ff", color: VT.violet }}><FaHistory /></span>Historial del pedido</p>
                        {historial === null ? (
                            <div><div className="vt-skel" style={{ width: "60%", marginBottom: 8 }} /><div className="vt-skel" style={{ width: "40%" }} /></div>
                        ) : historial.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: VT.muted }}>Todavía no hay movimientos registrados para este pedido.</p>
                        ) : (
                            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                {historial.map((h, i) => {
                                    const s = estiloEstado(h.EstadoID ?? h.Estado);
                                    return (
                                        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <span className="vt-dot" style={{ background: s.color, width: 10, height: 10, marginTop: 5 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: VT.navy }}>
                                                    {h.Estado || s.nombre}
                                                    <span style={{ fontWeight: 500, color: VT.muted, marginLeft: 8, fontSize: 12 }}>{fmtFecha(h.Fecha)} · {fmtHora(h.Fecha)}</span>
                                                </div>
                                                {h.Nota && <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2, wordBreak: "break-word" }}>{h.Nota}</div>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    {/* Productos */}
                    <div className="vt-sec" style={{ animationDelay: ".16s" }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaBoxOpen /></span>Productos vendidos</p>
                        {detalles.length > 0 ? (
                            <div>
                                {detalles.map((d, i) => {
                                    const hex = colorHex(d.color?.Nombre);
                                    const lineTotal = (parseInt(d.Cantidad) || 0) * (parseFloat(d.PrecioUnitario) || 0);
                                    return (
                                        <div key={d.DetalleVentaID || i} className="vt-item">
                                            <div className="vt-thumb">
                                                {d.producto?.ImagenProducto
                                                    ? <img src={d.producto.ImagenProducto} alt={d.producto?.Nombre} />
                                                    : <FaBoxOpen style={{ color: "#cbd5e1" }} size={22} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, color: VT.navy, fontSize: 14 }}>{d.producto?.Nombre || "Producto sin nombre"}</div>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                                    <span className="vt-chip">{hex && <span className="vt-swatch" style={{ background: hex }} />}{d.color?.Nombre || "Sin color"}</span>
                                                    <span className="vt-chip">Talla {d.talla?.Nombre || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right", fontSize: 12.5, color: VT.muted, whiteSpace: "nowrap" }}>
                                                {d.Cantidad} × {fmtCOP(d.PrecioUnitario)}
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 100, fontWeight: 800, color: VT.navy, fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>
                                                {fmtCOP(lineTotal)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, paddingTop: 12, marginTop: 4, borderTop: "1px solid #e2e8f0", fontSize: 13, color: VT.muted }}>
                                    <span>Subtotal <strong style={{ color: VT.navy, marginLeft: 6 }}>{fmtCOP(subtotal)}</strong></span>
                                    <span>Total <strong style={{ color: VT.success, marginLeft: 6, fontSize: 15 }}>{fmtCOP(total)}</strong></span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ textAlign: "center", color: VT.muted, padding: 24, margin: 0, fontSize: 13 }}>No hay productos en esta venta</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="vt-mfoot">
                    <button className="vt-btn-ghost" onClick={() => descargarComprobante(venta.VentaID).catch(() => alert("No se pudo descargar el comprobante"))}>Descargar comprobante</button>
                    {footerExtra}
                    <button className={footerExtra ? "vt-btn-ghost" : "vt-btn-primary"} onClick={onClose}>Cerrar</button>
                </div>
            </div>

            {zoom && venta.ComprobanteTransferencia && (
                <div className="vt-lightbox" onClick={() => setZoom(false)}>
                    <img src={venta.ComprobanteTransferencia} alt="Comprobante ampliado" onClick={e => e.stopPropagation()} style={{ cursor: "default" }} />
                    <span style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>Clic fuera de la imagen o Esc para cerrar</span>
                </div>
            )}
        </div>
    );
};

export default ModalDetalleVenta;
