import React, { useState, useEffect, useRef } from "react";
import {
  FaEye, FaCheck, FaSearch, FaDollarSign, FaImage, FaExchangeAlt, FaBan, FaFilePdf,
  FaPlusCircle, FaBoxOpen, FaChevronLeft, FaChevronRight, FaUser, FaTshirt, FaMagic,
  FaEnvelope, FaPhone, FaIdCard, FaTimes, FaSave, FaPalette, FaRulerHorizontal, FaLayerGroup,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { escapeHtml } from "../utils/escapeHtml";
import { getCotizaciones, updateCotizacion, getCotizacionById, cancelarCotizacion } from "../Services/api-cotizaciones/cotizaciones";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { FaWhatsapp, FaTags } from "react-icons/fa";
import { aplicarTarifasCotizacion } from "../Services/api-tarifas/tarifas";
import { whatsappUrl } from "../Services/api-ventas/flujo";
import API_BASE from "../config/api";
import FormularioCotizacion from './formularios_dash/FormularioCotizacion';
import "../styles/plus.css";
import { ESTADO_COTIZACION } from "../config/estados";

/* ── Tokens ── */
const C = {
  navy: "#1a2540",
  navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
  accent: "#4f8ef7",
  accentSoft: "#f0f4ff",
  accentBorder: "#c7d9ff",
  success: "#16a34a",
  successSoft: "#f0fdf4",
  warning: "#d97706",
  warningSoft: "#fffbeb",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  violet: "#7c3aed",
  muted: "#64748b",
  text: "#0f172a",
  border: "#e2e8f0",
  bg: "#f8fafc",
  info: "#0369a1",
  infoSoft: "#e0f2fe",
};

/* Estados de cotización (tabla estados, Tipo = cotizacion) */
const ESTADOS = {
  1: { nombre: "Pendiente", type: "pending" },
  2: { nombre: "Aprobada", type: "approved" },
  3: { nombre: "Rechazada", type: "rejected" },
  4: { nombre: "Cancelada", type: "canceled" },
  5: { nombre: "Procesada", type: "processed" },
};
const TYPE_POR_NOMBRE = Object.fromEntries(Object.values(ESTADOS).map(e => [e.nombre, e.type]));
const estadoDe = (c) => {
  const nombre = c?.estado?.Nombre || ESTADOS[c?.EstadoID]?.nombre || "Pendiente";
  return { nombre, type: TYPE_POR_NOMBRE[nombre] || "pending" };
};

const formatPrecio = (valor) =>
  (parseFloat(valor) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const urlDiseno = (tec) => tec?.ImagenUrl || (tec?.["ImagenDiseño"] ? `${API_BASE}/api/cotizaciones/imagen/${tec["ImagenDiseño"]}` : null);

/* "[PERSONALIZADO] Buso - detalle" -> { nombre: "Buso", desc: "detalle" } */
const parsePersonalizado = (texto) => {
  const m = /^\[PERSONALIZADO\]\s*(.+?)(?:\s+-\s+([\s\S]*))?$/.exec(texto || "");
  return m ? { nombre: m[1], desc: m[2] || "" } : null;
};
const infoDetalle = (d) => {
  if (d.TraePrenda) return { nombre: "Prenda del cliente", tipo: "prenda", desc: d.PrendaDescripcion || "" };
  if (d.producto) return { nombre: d.producto.Nombre, tipo: "catalogo", imagen: d.producto.ImagenProducto };
  const p = parsePersonalizado(d.PrendaDescripcion);
  return { nombre: p?.nombre || "Producto personalizado", tipo: "personalizado", desc: p?.desc || "" };
};

/* Misma regla que el backend (calcularValorTotalCotizacion) para mostrar subtotales por producto */
const precioUnitarioDetalle = (d) => {
  let unit;
  if (parseFloat(d.PrecioUnitario) > 0) unit = parseFloat(d.PrecioUnitario);
  else unit = (parseFloat(d.producto?.PrecioBase) || 0) + (parseFloat(d.tallas?.[0]?.talla?.Precio) || 0) + (parseFloat(d.insumos?.[0]?.insumo?.PrecioTela) || 0);
  return unit + (d.tecnicas || []).reduce((s, t) => s + (parseFloat(t.CostoTecnica) || 0), 0);
};

const sinCosto = (t) => !t.CostoTecnica || parseFloat(t.CostoTecnica) <= 0;

const validarCosto = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return "Ingresa un valor.";
  if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(v)) return "Solo números (sin letras ni símbolos).";
  const n = parseFloat(v.replace(",", "."));
  if (isNaN(n)) return "Valor inválido.";
  if (n <= 0) return "El costo debe ser mayor a $0.";
  if (n > 99_999_999) return "El valor es demasiado alto.";
  return "";
};

const swalTop = (opts) => Swal.fire({ ...opts, didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });

/* ── CSS propio del módulo (prefijo cz-) ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
.cz-page, .cz-page *, .cz-modal, .cz-modal * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
@keyframes cz-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes cz-pop { from { opacity: 0; transform: translateY(18px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes cz-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes cz-spin { to { transform: rotate(360deg); } }
@keyframes cz-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(217,119,6,.45); } 70% { box-shadow: 0 0 0 7px rgba(217,119,6,0); } }

.cz-head { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
.cz-title { margin:0; font-weight:800; font-size:22px; color:#1a2540; letter-spacing:-.02em; }
.cz-filters { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
.cz-input { padding:9px 14px; border-radius:10px; border:1.5px solid #e2e8f0; font-size:13px; outline:none; color:#0f172a; background:#fff; transition:border-color .2s, box-shadow .2s; }
.cz-input:focus { border-color:#4f8ef7; box-shadow:0 0 0 3px rgba(79,142,247,.15); }
.cz-search { position:relative; width:300px; max-width:100%; }
.cz-search svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#64748b; font-size:13px; }
.cz-search input { width:100%; padding-left:36px; }

.cz-tablewrap { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.05), 0 8px 24px rgba(15,23,42,.06); border:1px solid #eef2f7; }
.cz-table { width:100%; border-collapse:collapse; font-size:13px; }
.cz-table th { background:linear-gradient(90deg,#1a2540 0%,#2d3f6e 100%); color:#fff; font-size:12px; font-weight:700; padding:13px 16px; white-space:nowrap; letter-spacing:.04em; text-align:left; }
.cz-table td { padding:12px 16px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
.cz-row { transition:background .18s, box-shadow .18s; animation:cz-fade .35s ease both; }
.cz-row:hover { background:#f5f8ff !important; box-shadow:inset 3px 0 0 #4f8ef7; }
.cz-row:hover .cz-thumb { transform:scale(1.08); box-shadow:0 6px 16px rgba(26,37,64,.18); }
.cz-thumb { width:48px; height:48px; border-radius:10px; object-fit:cover; border:2px solid #e2e8f0; transition:transform .25s, box-shadow .25s; cursor:pointer; display:flex; align-items:center; justify-content:center; background:#f0f4ff; }

.cz-badge { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:4px 11px; font-size:11px; font-weight:700; border:1px solid; white-space:nowrap; }
.cz-badge .cz-dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
.cz-badge.pending { background:#fffbeb; color:#92400e; border-color:#fde68a; }
.cz-badge.pending .cz-dot { background:#d97706; animation:cz-pulse 2s infinite; }
.cz-badge.approved { background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; }
.cz-badge.processed { background:#f5f3ff; color:#7c3aed; border-color:#ddd6fe; }
.cz-badge.canceled { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.cz-badge.rejected { background:#f1f5f9; color:#475569; border-color:#cbd5e1; }
.cz-badge.navy { background:#1a2540; color:#fff; border-color:#1a2540; }
.cz-badge.money { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; font-size:12px; }
.cz-badge.money.zero { background:#f8fafc; color:#94a3b8; border-color:#e2e8f0; }

.cz-act { width:32px; height:32px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .18s, background .18s, box-shadow .18s; border:1.5px solid; }
.cz-act:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 14px rgba(15,23,42,.12); }
.cz-act:disabled { opacity:.45; cursor:not-allowed; }

.cz-skel { height:14px; border-radius:7px; background:linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size:800px 100%; animation:cz-shimmer 1.2s linear infinite; }
.cz-empty { text-align:center; padding:56px 20px; color:#64748b; }
.cz-empty-ico { width:72px; height:72px; border-radius:22px; margin:0 auto 14px; display:grid; place-items:center; background:linear-gradient(135deg,rgba(79,142,247,.14),rgba(124,58,237,.14)); color:#4f8ef7; font-size:28px; }

/* ── Modal detalle ── */
.cz-overlay { position:fixed; inset:0; background:rgba(15,24,36,.6); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation:cz-fade .2s ease; }
.cz-modal { background:#f8fafc; border-radius:22px; width:100%; max-width:1100px; max-height:94vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 80px rgba(15,24,36,.45); animation:cz-pop .32s cubic-bezier(.22,1,.36,1); }
.cz-mhead { flex-shrink:0; position:relative; padding:22px 28px 20px; color:#fff; background:radial-gradient(600px 200px at 85% -40%, rgba(124,58,237,.55), transparent 60%), linear-gradient(120deg,#0f1824 0%,#1a2540 45%,#2d3f6e 100%); overflow:hidden; }
.cz-mhead::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.35; background-image:radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px); background-size:22px 22px; mask-image:linear-gradient(90deg,transparent,#000 70%); -webkit-mask-image:linear-gradient(90deg,transparent,#000 70%); }
.cz-mhead-row { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.cz-close { background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); border-radius:10px; width:36px; height:36px; color:#fff; cursor:pointer; display:grid; place-items:center; transition:background .2s, transform .2s; }
.cz-close:hover { background:rgba(255,255,255,.24); transform:rotate(90deg); }
.cz-total-head { text-align:right; }
.cz-total-head small { display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6); font-weight:700; }
.cz-total-head strong { font-size:30px; font-weight:900; letter-spacing:-.02em; background:linear-gradient(90deg,#fff,#c7d9ff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }

.cz-timeline { position:relative; z-index:1; display:flex; align-items:center; margin-top:18px; max-width:620px; }
.cz-step { display:flex; align-items:center; gap:8px; color:rgba(255,255,255,.5); font-size:12px; font-weight:700; white-space:nowrap; }
.cz-step i { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-style:normal; font-size:11px; background:rgba(255,255,255,.1); border:1.5px solid rgba(255,255,255,.25); transition:all .3s; }
.cz-step.done { color:#fff; } .cz-step.done i { background:#16a34a; border-color:#16a34a; }
.cz-step.now { color:#fff; } .cz-step.now i { background:#4f8ef7; border-color:#4f8ef7; box-shadow:0 0 0 5px rgba(79,142,247,.3); }
.cz-step.bad { color:#fecaca; } .cz-step.bad i { background:#dc2626; border-color:#dc2626; }
.cz-line { flex:1; height:2px; min-width:24px; margin:0 10px; background:rgba(255,255,255,.18); border-radius:2px; }
.cz-line.done { background:linear-gradient(90deg,#16a34a,#4f8ef7); }

.cz-mbody { min-height:0; overflow-y:auto; padding:22px 28px; flex:1; }
.cz-grid2 { display:grid; grid-template-columns:1fr 300px; gap:16px; margin-bottom:22px; }
.cz-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px 20px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
.cz-label { margin:0 0 12px; font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.1em; }
.cz-client { display:flex; gap:16px; align-items:center; }
.cz-avatar { width:54px; height:54px; border-radius:16px; flex-shrink:0; display:grid; place-items:center; color:#fff; font-weight:800; font-size:19px; background:linear-gradient(135deg,#4f8ef7,#7c3aed); box-shadow:0 8px 20px rgba(79,142,247,.35); }
.cz-client-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 18px; flex:1; }
.cz-client-grid div { display:flex; align-items:center; gap:7px; font-size:13px; color:#0f172a; min-width:0; }
.cz-client-grid svg { color:#4f8ef7; flex-shrink:0; }
.cz-client-grid span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.cz-prod { background:#fff; border:1px solid #e2e8f0; border-radius:18px; margin-bottom:16px; overflow:hidden; animation:cz-fade .35s ease both; transition:box-shadow .25s, border-color .25s; }
.cz-prod:hover { box-shadow:0 10px 30px rgba(26,37,64,.08); border-color:#c7d9ff; }
.cz-prod-head { display:flex; gap:16px; align-items:center; padding:16px 20px; background:linear-gradient(90deg,#f5f8ff,#fff); border-bottom:1px solid #eef2f7; }
.cz-prod-img { width:76px; height:76px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0; cursor:zoom-in; transition:transform .25s; background:#f0f4ff; display:grid; place-items:center; }
.cz-prod-img:hover { transform:scale(1.05); }
.cz-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; background:#f0f4ff; color:#3b6fe0; border:1px solid #dbe6ff; }
.cz-chip.violet { background:#f5f3ff; color:#7c3aed; border-color:#e4dcff; }
.cz-chip.amber { background:#fffbeb; color:#92400e; border-color:#fde68a; }
.cz-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.cz-sub { margin-left:auto; text-align:right; flex-shrink:0; }
.cz-sub small { display:block; font-size:10px; color:#64748b; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.cz-sub strong { font-size:17px; color:#1a2540; font-weight:800; }

.cz-designs { padding:16px 20px 18px; }
.cz-dgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
.cz-design { border:1px solid #ece7fb; border-radius:16px; overflow:hidden; background:#fff; display:flex; flex-direction:column; transition:transform .25s, box-shadow .25s, border-color .25s; }
.cz-design:hover { transform:translateY(-3px); box-shadow:0 12px 26px rgba(124,58,237,.12); border-color:#d9ccff; }
.cz-design.missing { border-color:#fecaca; box-shadow:inset 0 3px 0 #dc2626; }
.cz-dimg { height:170px; background:repeating-conic-gradient(#f5f3ff 0% 25%, #fff 0% 50%) 50%/18px 18px; display:grid; place-items:center; overflow:hidden; cursor:zoom-in; position:relative; }
.cz-dimg img { max-width:100%; max-height:100%; object-fit:contain; transition:transform .5s cubic-bezier(.22,1,.36,1); }
.cz-dimg:hover img { transform:scale(1.07); }
.cz-dimg .cz-zoomhint { position:absolute; bottom:8px; right:8px; background:rgba(26,37,64,.75); color:#fff; font-size:10px; font-weight:700; padding:3px 8px; border-radius:999px; opacity:0; transition:opacity .2s; }
.cz-dimg:hover .cz-zoomhint { opacity:1; }
.cz-dinfo { padding:12px 14px 14px; display:flex; flex-direction:column; gap:6px; flex:1; }
.cz-dinfo p { margin:0; font-size:12.5px; color:#0f172a; }
.cz-dinfo b { color:#7c3aed; }
.cz-cost { margin-top:auto; padding-top:10px; border-top:1px dashed #e2e8f0; display:flex; align-items:center; gap:8px; }
.cz-cost .cz-val { font-size:16px; font-weight:800; }
.cz-cost input { width:100%; min-width:0; padding:8px 10px 8px 24px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:13px; font-weight:700; outline:none; transition:border-color .2s, box-shadow .2s; }
.cz-cost input:focus { border-color:#4f8ef7; box-shadow:0 0 0 3px rgba(79,142,247,.15); }
.cz-cost input.err { border-color:#dc2626; }
.cz-money { position:relative; flex:1; }
.cz-money::before { content:"$"; position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#64748b; font-weight:700; font-size:13px; }
.cz-btn { border:none; border-radius:10px; padding:9px 16px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:transform .18s, box-shadow .18s, opacity .18s; color:#fff; white-space:nowrap; }
.cz-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 18px rgba(15,23,42,.18); }
.cz-btn:disabled { opacity:.55; cursor:not-allowed; }
.cz-btn.sm { padding:8px 12px; font-size:12px; border-radius:9px; }
.cz-btn.navy { background:linear-gradient(135deg,#1a2540,#2d3f6e); }
.cz-btn.green { background:#16a34a; } .cz-btn.blue { background:linear-gradient(135deg,#4f8ef7,#7c3aed); }
.cz-btn.red { background:#dc2626; } .cz-btn.ghost { background:#fff; color:#475569; border:1.5px solid #e2e8f0; }
.cz-btn.outline-red { background:#fff; color:#dc2626; border:1.5px solid #fecaca; }
.cz-alert { display:flex; gap:10px; align-items:center; padding:10px 14px; border-radius:12px; font-size:12.5px; font-weight:600; margin-bottom:16px; }
.cz-alert.warn { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
.cz-alert.info { background:#f0f4ff; color:#1e40af; border:1px solid #c7d9ff; }
.cz-mfoot { flex-shrink:0; padding:14px 28px; border-top:1px solid #e2e8f0; background:#fff; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
.cz-mfoot > div { display:flex; gap:8px; flex-wrap:wrap; }
.cz-summary { display:flex; justify-content:flex-end; }
.cz-summary-box { min-width:280px; border-radius:16px; padding:16px 20px; color:#fff; background:linear-gradient(135deg,#1a2540,#2d3f6e 60%,#4c3a9e); box-shadow:0 14px 34px rgba(26,37,64,.3); }
.cz-summary-box div { display:flex; justify-content:space-between; font-size:12.5px; color:rgba(255,255,255,.75); margin-bottom:6px; gap:18px; }
.cz-summary-box .tot { border-top:1px solid rgba(255,255,255,.18); padding-top:10px; margin:10px 0 0; color:#fff; font-size:15px; font-weight:700; align-items:baseline; }
.cz-summary-box .tot strong { font-size:24px; font-weight:900; }

@media (max-width: 860px) {
  .cz-grid2 { grid-template-columns:1fr; }
  .cz-client-grid { grid-template-columns:1fr; }
  .cz-prod-head { flex-wrap:wrap; }
  .cz-sub { margin-left:0; text-align:left; }
  .cz-timeline { overflow-x:auto; }
  .cz-mhead, .cz-mbody, .cz-mfoot { padding-left:16px; padding-right:16px; }
  .cz-page { padding:20px 16px !important; }
  .cz-search { width:100%; }
}
`;

const Badge = ({ type, children, dot }) => (
  <span className={`cz-badge ${type}`}>{dot && <span className="cz-dot" />}{children}</span>
);

const ActionBtn = ({ onClick, title, color, children, disabled }) => (
  <button className="cz-act" onClick={onClick} title={title} aria-label={title} disabled={disabled}
    style={{ borderColor: `${color}33`, background: `${color}10`, color }}>{children}</button>
);

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];

const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
  if (totalItems === 0) return null;

  const generarPaginas = () => {
    const paginas = [];
    const delta = 2;
    const rangoIzq = Math.max(2, paginaActual - delta);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + delta);
    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);
    return paginas;
  };

  const btnBase = {
    minWidth: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.18s", padding: "0 8px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: C.muted }}>
          Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> cotizaciones
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.muted }}>Por página:</span>
          <select className="cz-input" value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}
            style={{ padding: "4px 10px", fontSize: 12, borderRadius: 8, cursor: "pointer" }}>
            {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button aria-label="Página anterior" onClick={() => onCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}
          style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}>
          <FaChevronLeft size={11} />
        </button>
        {generarPaginas().map((p, i) => (
          p === "..." ? (
            <span key={`e-${i}`} style={{ padding: "0 4px", color: C.muted, fontSize: 13 }}>…</span>
          ) : (
            <button key={p} onClick={() => onCambiarPagina(p)}
              style={{
                ...btnBase,
                background: p === paginaActual ? C.navy : "#fff",
                color: p === paginaActual ? "#fff" : C.muted,
                borderColor: p === paginaActual ? C.navy : C.border,
                fontWeight: p === paginaActual ? 700 : 600,
                cursor: p === paginaActual ? "default" : "pointer",
              }}>
              {p}
            </button>
          )
        ))}
        <button aria-label="Página siguiente" onClick={() => onCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}
          style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}>
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

/* ── Modal imagen ampliada ── */
const ImagenModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="cz-overlay" style={{ zIndex: 1070, background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div style={{ animation: "cz-pop .3s ease" }} onClick={e => e.stopPropagation()}>
        <img src={src} alt="Vista ampliada"
          style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", background: "#fff" }} />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="cz-btn red" onClick={onClose} style={{ borderRadius: 24, padding: "9px 24px" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

/* ── Línea de tiempo del estado ── */
const Timeline = ({ estado }) => {
  const terminalMalo = estado === "Cancelada" || estado === "Rechazada";
  const orden = ["Pendiente", "Aprobada", "Procesada"];
  const idx = orden.indexOf(estado);
  const pasos = terminalMalo ? ["Pendiente", estado] : orden;
  return (
    <div className="cz-timeline">
      {pasos.map((p, i) => {
        let cls = "";
        if (terminalMalo) cls = i === 0 ? "done" : "bad";
        else if (i < idx || (estado === "Procesada" && i === idx)) cls = "done";
        else if (i === idx) cls = "now";
        const icon = cls === "done" ? "✓" : cls === "bad" ? "✕" : i + 1;
        return (
          <React.Fragment key={p}>
            {i > 0 && <span className={`cz-line ${cls === "done" || (cls === "now") || cls === "bad" ? "done" : ""}`} />}
            <span className={`cz-step ${cls}`}><i>{icon}</i>{p === "Procesada" ? "Procesada (venta)" : p}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Tarjeta de diseño con costo editable ── */
const DisenoCard = ({ tec, editable, onGuardar, onVerImagen }) => {
  const [valor, setValor] = useState(tec.CostoTecnica && parseFloat(tec.CostoTecnica) > 0 ? String(parseFloat(tec.CostoTecnica)) : "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const img = urlDiseno(tec);
  const falta = sinCosto(tec);
  const cambiado = valor !== (falta ? "" : String(parseFloat(tec.CostoTecnica)));

  const guardar = async () => {
    const e = validarCosto(valor);
    setError(e);
    if (e) return;
    setGuardando(true);
    try { await onGuardar(tec.CotizacionTecnicaID, parseFloat(valor.trim().replace(",", "."))); }
    finally { setGuardando(false); }
  };

  return (
    <div className={`cz-design ${falta ? "missing" : ""}`}>
      <div className="cz-dimg" onClick={() => img && onVerImagen(img)} style={{ cursor: img ? "zoom-in" : "default" }}>
        {img
          ? <><img src={img} alt="Diseño" onError={e => { e.currentTarget.style.display = "none"; }} /><span className="cz-zoomhint">Ampliar</span></>
          : <div style={{ textAlign: "center", color: C.violet, opacity: .45 }}><FaImage size={34} /><p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700 }}>Sin imagen</p></div>}
      </div>
      <div className="cz-dinfo">
        <p><b>Técnica:</b> {tec.tecnica?.Nombre || "N/A"}</p>
        <p><b>Parte:</b> {tec.parte?.Nombre || "N/A"}</p>
        {tec.Observaciones && <p style={{ color: C.muted, fontSize: 12 }}><b style={{ color: C.text }}>Obs.:</b> {tec.Observaciones}</p>}
        <div className="cz-cost">
          {editable ? (
            <>
              <div className="cz-money">
                <input aria-label="Costo del diseño" inputMode="numeric" placeholder="Costo por unidad" value={valor}
                  className={error ? "err" : ""}
                  onChange={e => { setValor(e.target.value); if (error) setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") guardar(); }} />
              </div>
              <button className={`cz-btn sm ${cambiado ? "green" : "ghost"}`} onClick={guardar} disabled={guardando || !cambiado} title="Guardar costo">
                {guardando ? <span style={{ width: 12, height: 12, border: "2px solid #fff6", borderTopColor: "#fff", borderRadius: "50%", animation: "cz-spin .7s linear infinite" }} /> : <FaSave size={11} />}
                {falta ? "Asignar" : "Guardar"}
              </button>
            </>
          ) : (
            <span className="cz-val" style={{ color: falta ? C.danger : C.success }}>
              {falta ? "Sin precio" : `$${formatPrecio(tec.CostoTecnica)}`}
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{falta ? "" : " / unidad"}</span>
            </span>
          )}
        </div>
        {error && <p style={{ color: C.danger, fontSize: 11, fontWeight: 600 }}>{error}</p>}
        {editable && falta && !error && <p style={{ color: C.danger, fontSize: 11, fontWeight: 600 }}>Falta asignar el costo</p>}
      </div>
    </div>
  );
};

/* ── Modal Detalle Cotización ── */
const ModalDetalleCotizacion = ({ cotizacion, onClose, onRecargar, onAprobar, onConvertirAVenta, onCancelar }) => {
  const [imagenModal, setImagenModal] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !imagenModal) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imagenModal, onClose]);

  const { nombre: estadoNombre, type: estadoType } = estadoDe(cotizacion);
  const puedeEditarCostos = estadoNombre === "Pendiente";
  const todasTecnicas = cotizacion.detalles?.flatMap(d => d.tecnicas || []) || [];
  const faltantes = todasTecnicas.filter(sinCosto).length;

  const handleGuardarCosto = async (tecnicaID, costo) => {
    try {
      await axios.put(`${API_BASE}/api/cotizaciontecnicas/${tecnicaID}`, { CostoTecnica: costo });
      await onRecargar(cotizacion.CotizacionID);
      Swal.fire({ icon: "success", title: "Costo guardado", text: "Total recalculado", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    } catch (error) {
      swalTop({ icon: "error", title: "No se pudo asignar el costo", text: error.response?.data?.message || error.message });
    }
  };

  const [aplicando, setAplicando] = useState(false);
  const handleAplicarTarifas = async () => {
    setAplicando(true);
    try {
      const r = await aplicarTarifasCotizacion(cotizacion.CotizacionID);
      await onRecargar(cotizacion.CotizacionID);
      const aplicadas = Number(r?.aplicadas) || 0;
      const sinTarifa = Number(r?.sinTarifa) || 0;
      swalTop({
        icon: aplicadas > 0 ? (sinTarifa > 0 ? "info" : "success") : "warning",
        title: `${aplicadas} aplicada${aplicadas !== 1 ? "s" : ""}, ${sinTarifa} sin tarifa`,
        text: sinTarifa > 0 ? "Los diseños sin tarifa deben costearse a mano (o crea la tarifa en Servicios > Tarifas)." : undefined,
        confirmButtonColor: C.accent,
      });
    } catch (error) {
      const noExiste = error.response?.status === 404;
      swalTop({ icon: "error", title: "No se pudieron aplicar las tarifas", text: noExiste ? "Esta función aún no está disponible en el servidor." : (error.response?.data?.message || error.message) });
    } finally { setAplicando(false); }
  };

  const handleDescargarPdf = async () => {
    if (faltantes > 0) {
      await swalTop({ icon: 'warning', title: 'No se puede descargar el PDF', html: `<p>Hay <strong>${faltantes}</strong> diseño(s) sin precio asignado.</p>`, confirmButtonText: 'Entendido', confirmButtonColor: C.warning });
      return;
    }
    setDescargando(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cotizaciones/${cotizacion.CotizacionID}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cotizacion_${cotizacion.CotizacionID}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(link.href);
    } catch (error) {
      let msg = 'Error desconocido';
      if (error.response?.data instanceof Blob) {
        try { const texto = await error.response.data.text(); msg = JSON.parse(texto).message || msg; } catch { /* la respuesta no es JSON: se usa el mensaje de texto */ }
      } else { msg = error.response?.data?.message || error.message || msg; }
      swalTop({ icon: 'error', title: 'Error al generar el PDF', text: msg, confirmButtonColor: C.danger });
    } finally { setDescargando(false); }
  };

  const u = cotizacion.usuario || {};
  const waUrl = whatsappUrl(u.Telefono, `Hola ${u.Nombre || ""}, te escribimos de STAMPLAB sobre tu cotización #${cotizacion.CotizacionID}.`.replace(/\s+,/, ","));
  const iniciales = (u.Nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
  const subtotalCalc = (cotizacion.detalles || []).reduce((s, d) => s + precioUnitarioDetalle(d) * (d.Cantidad || 0), 0);
  const totalUnidades = (cotizacion.detalles || []).reduce((s, d) => s + (d.Cantidad || 0), 0);

  return (
    <div className="cz-overlay" onClick={onClose}>
      <div className="cz-modal" role="dialog" aria-modal="true" aria-label={`Cotización ${cotizacion.CotizacionID}`} onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="cz-mhead">
          <div className="cz-mhead-row">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h5 style={{ margin: 0, fontWeight: 800, fontSize: 21, letterSpacing: "-.02em" }}>Cotización #{cotizacion.CotizacionID}</h5>
                <Badge type={estadoType} dot>{estadoNombre}</Badge>
              </div>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 12.5 }}>
                {new Date(cotizacion.FechaCotizacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {" · "}{cotizacion.detalles?.length || 0} producto(s) · {totalUnidades} unidad(es)
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div className="cz-total-head">
                <small>Valor total</small>
                <strong>${formatPrecio(cotizacion.ValorTotal)}</strong>
              </div>
              <button className="cz-close" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
            </div>
          </div>
          <Timeline estado={estadoNombre} />
        </div>

        {/* Cuerpo */}
        <div className="cz-mbody">
          {puedeEditarCostos && faltantes > 0 && (
            <div className="cz-alert warn" style={{ flexWrap: "wrap" }}>
              <FaDollarSign /> <span style={{ flex: 1, minWidth: 200 }}>Faltan {faltantes} diseño(s) por costear. Asigna el costo por unidad de cada diseño para poder aprobar y descargar el PDF.</span>
              <button className="cz-btn sm blue" onClick={handleAplicarTarifas} disabled={aplicando} title="Rellena el costo de los diseños sin precio con las tarifas por técnica y parte">
                <FaTags size={11} /> {aplicando ? "Aplicando..." : "Aplicar tarifas"}
              </button>
            </div>
          )}
          {estadoNombre === "Aprobada" && (
            <div className="cz-alert info"><FaExchangeAlt /> Cotización aprobada: ya puedes convertirla a venta (se descontará el stock de cada variante).</div>
          )}

          <div className="cz-grid2">
            <div className="cz-card">
              <p className="cz-label">Cliente</p>
              <div className="cz-client">
                <div className="cz-avatar">{iniciales || <FaUser />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 800, color: C.navy, fontSize: 16 }}>{u.Nombre || "N/A"}</p>
                  <div className="cz-client-grid">
                    <div><FaIdCard /><span>{u.DocumentoID || "N/A"}</span></div>
                    <div><FaPhone /><span>{u.Telefono || "Sin teléfono"}</span></div>
                    <div style={{ gridColumn: "1 / -1" }}><FaEnvelope /><span>{u.Correo || "Sin correo"}</span></div>
                  </div>
                  {waUrl && (
                    <a className="cz-btn sm ghost" href={waUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 10, textDecoration: "none", color: "#15803d", borderColor: "#bbf7d0", background: C.successSoft }}>
                      <FaWhatsapp size={14} /> Escribir por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="cz-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p className="cz-label">Resumen</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="cz-chip">{cotizacion.detalles?.length || 0} producto(s)</span>
                  <span className="cz-chip violet">{todasTecnicas.length} diseño(s)</span>
                  {faltantes > 0 && <span className="cz-chip amber">{faltantes} sin costo</span>}
                </div>
              </div>
              {estadoNombre === "Aprobada" && (
                <button className="cz-btn blue" onClick={() => onConvertirAVenta(cotizacion.CotizacionID)} style={{ justifyContent: "center" }}>
                  <FaExchangeAlt size={12} /> Convertir a Venta
                </button>
              )}
              {estadoNombre === "Pendiente" && (
                <button className="cz-btn green" onClick={() => onAprobar(cotizacion.CotizacionID)} style={{ justifyContent: "center" }}>
                  <FaCheck size={12} /> Aprobar cotización
                </button>
              )}
            </div>
          </div>

          <p className="cz-label" style={{ fontSize: 12, color: C.navy }}>Productos y diseños</p>

          {cotizacion.detalles?.length > 0 ? cotizacion.detalles.map((detalle, index) => {
            const info = infoDetalle(detalle);
            const unit = precioUnitarioDetalle(detalle);
            return (
              <div key={detalle.DetalleCotizacionID} className="cz-prod" style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="cz-prod-head">
                  {info.imagen ? (
                    <img className="cz-prod-img" src={info.imagen} alt={info.nombre} onClick={() => setImagenModal(info.imagen)} />
                  ) : (
                    <div className="cz-prod-img" style={{ cursor: "default", background: info.tipo === "personalizado" ? "#f5f3ff" : "#fffbeb" }}>
                      {info.tipo === "personalizado" ? <FaMagic size={24} color={C.violet} /> : <FaTshirt size={24} color={C.warning} />}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Producto {index + 1}</p>
                    <h6 style={{ color: C.navy, fontWeight: 800, margin: "2px 0 0", fontSize: 16 }}>{info.nombre}</h6>
                    <div className="cz-chips">
                      <span className="cz-chip" style={{ background: C.navy, color: "#fff", borderColor: C.navy }}>{detalle.Cantidad} unidad(es)</span>
                      {info.tipo === "personalizado" && <span className="cz-chip violet"><FaMagic size={9} /> Personalizado</span>}
                      {info.tipo === "prenda" && <span className="cz-chip amber"><FaTshirt size={9} /> Prenda propia</span>}
                      {detalle.colores?.map(c => <span key={`c${c.CotizacionColorID || c.ColorID}`} className="cz-chip"><FaPalette size={9} /> {c.color?.Nombre}</span>)}
                      {detalle.tallas?.map(t => <span key={`t${t.CotizacionTallaID || t.TallaID}`} className="cz-chip"><FaRulerHorizontal size={9} /> Talla {t.talla?.Nombre}</span>)}
                      {detalle.insumos?.map(i => <span key={`i${i.CotizacionInsumoID || i.InsumoID}`} className="cz-chip"><FaLayerGroup size={9} /> {i.insumo?.Nombre}</span>)}
                    </div>
                    {info.desc && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#92400e", background: C.warningSoft, border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px" }}><strong>Descripción:</strong> {info.desc}</p>}
                  </div>
                  <div className="cz-sub">
                    <small>Subtotal</small>
                    <strong>${formatPrecio(unit * (detalle.Cantidad || 0))}</strong>
                    <div style={{ fontSize: 11, color: C.muted }}>{detalle.Cantidad} × ${formatPrecio(unit)}</div>
                  </div>
                </div>
                <div className="cz-designs">
                  <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.violet, fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em" }}>
                    Diseños aplicados ({detalle.tecnicas?.length || 0})
                  </p>
                  {detalle.tecnicas?.length > 0 ? (
                    <div className="cz-dgrid">
                      {detalle.tecnicas.map(tec => (
                        <DisenoCard key={`${tec.CotizacionTecnicaID}-${tec.CostoTecnica}`} tec={tec} editable={puedeEditarCostos}
                          onGuardar={handleGuardarCosto} onVerImagen={setImagenModal} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>Este producto no lleva diseños.</p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="cz-empty"><div className="cz-empty-ico"><FaBoxOpen /></div>No hay productos en esta cotización</div>
          )}

          <div className="cz-summary">
            <div className="cz-summary-box">
              <div><span>Productos (con diseños)</span><span>${formatPrecio(subtotalCalc)}</span></div>
              <div><span>Unidades</span><span>{totalUnidades}</span></div>
              <div className="tot"><span>Total cotización</span><strong>${formatPrecio(cotizacion.ValorTotal)}</strong></div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="cz-mfoot">
          <div>
            <button className="cz-btn red" onClick={handleDescargarPdf} disabled={descargando}
              title={faltantes > 0 ? "Hay diseños sin precio" : "Descargar PDF"} style={faltantes > 0 ? { background: C.muted } : undefined}>
              <FaFilePdf /> {descargando ? "Generando..." : "Descargar PDF"}
            </button>
            {(estadoNombre === "Pendiente" || estadoNombre === "Aprobada") && (
              <button className="cz-btn outline-red" onClick={() => onCancelar(cotizacion)}><FaBan size={12} /> Cancelar cotización</button>
            )}
          </div>
          <button className="cz-btn navy" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const Cotizaciones = () => {
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const reqId = useRef(0);

  const cargarCotizaciones = async (page, limit, search, estado) => {
    const id = ++reqId.current;
    setCargando(true);
    try {
      const response = await getCotizaciones({ page, limit, search, estado });
      if (id !== reqId.current) return; // respuesta vieja: la ignoramos
      setTotalItems(response.total || 0);
      setTotalPaginas(Math.max(1, response.totalPaginas || 1));
      setCotizaciones(response.datos || []);
    } catch {
      if (id === reqId.current) Swal.fire("Error", "No se pudieron cargar las cotizaciones", "error");
    } finally { if (id === reqId.current) setCargando(false); }
  };

  // Recarga respetando la página, búsqueda y filtro actuales
  const recargar = () => cargarCotizaciones(paginaActual, itemsPorPagina, busqueda, filtroEstado);

  // Carga inicial + cambios de búsqueda (con debounce) y de filtro
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPaginaActual(1);
      cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado);
    }, busqueda ? 350 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstado]);

  const handleCerrarFormulario = () => { setMostrarFormulario(false); setModalKey(prev => prev + 1); };
  const handleCotizacionCreada = () => { setPaginaActual(1); return cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado); };
  const handleCerrarDetalle = () => { setCotizacionSeleccionada(null); recargar(); };

  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const desde = totalItems === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarCotizaciones(nuevaPagina, itemsPorPagina, busqueda, filtroEstado);
    }
  };

  const handleCambiarItemsPorPagina = (n) => {
    setItemsPorPagina(n);
    setPaginaActual(1);
    cargarCotizaciones(1, n, busqueda, filtroEstado);
  };

  const recargarDetalle = async (cotizacionID) => {
    const response = await getCotizacionById(cotizacionID);
    setCotizacionSeleccionada(response);
    return response;
  };

  const handleVerDetalle = async (cotizacionID) => {
    try { await recargarDetalle(cotizacionID); }
    catch { Swal.fire("Error", "No se pudo cargar el detalle", "error"); }
  };

  // Enlace desde "Hoy": /dashboard/cotizaciones?abrir=ID abre directamente el detalle
  const [searchParams, setSearchParams] = useSearchParams();
  const abrirParam = searchParams.get("abrir");
  useEffect(() => {
    if (!abrirParam) return;
    const id = parseInt(abrirParam, 10);
    setSearchParams({}, { replace: true });
    if (id > 0) handleVerDetalle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirParam]);

  const handleCancelarCotizacion = async (cotizacion) => {
    const { nombre: estadoNombre } = estadoDe(cotizacion);
    const result = await swalTop({
      title: '¿Cancelar esta cotización?',
      html: `<p><strong>Cotización #${cotizacion.CotizacionID}</strong></p><p>Cliente: ${escapeHtml(cotizacion.usuario?.Nombre || 'N/A')}</p><p>Estado actual: <strong>${escapeHtml(estadoNombre)}</strong></p><p style="color:#64748b;font-size:13px">Esta acción no se puede deshacer.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: C.danger, cancelButtonColor: C.navy,
      confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No, mantener'
    });
    if (!result.isConfirmed) return;
    try {
      await cancelarCotizacion(cotizacion.CotizacionID);
      setCotizacionSeleccionada(null);
      Swal.fire({ icon: 'success', title: '¡Cotización cancelada!', timer: 2000, showConfirmButton: false });
      recargar();
    } catch (error) {
      swalTop({ icon: 'error', title: 'Error al cancelar', text: error.response?.data?.message || error.message });
    }
  };

  const handleAprobar = async (cotizacionID) => {
    let response;
    try { response = await getCotizacionById(cotizacionID); }
    catch { Swal.fire("Error", "No se pudo cargar la cotización", "error"); return; }
    const faltan = response.detalles?.flatMap(d => d.tecnicas || []).filter(sinCosto) || [];
    if (faltan.length > 0) {
      await swalTop({
        icon: "warning", title: "No se puede aprobar",
        html: `<p>Hay <strong>${faltan.length}</strong> diseño(s) sin costo asignado.</p><p style="color:#64748b;font-size:13px">Abre el detalle y asigna el costo de cada diseño.</p>`,
        showCancelButton: true, confirmButtonText: "Asignar costos", cancelButtonText: "Cerrar", confirmButtonColor: C.accent, cancelButtonColor: C.muted,
      }).then(r => { if (r.isConfirmed) setCotizacionSeleccionada(response); });
      return;
    }
    const ok = await swalTop({
      title: `¿Aprobar la cotización #${cotizacionID}?`,
      html: `<p>Total: <strong>$${formatPrecio(response.ValorTotal)}</strong></p><p style="color:#64748b;font-size:13px">Después de aprobarla ya no podrás modificar los costos.</p>`,
      icon: "question", showCancelButton: true, confirmButtonText: "Sí, aprobar", cancelButtonText: "Cancelar",
      confirmButtonColor: C.success, cancelButtonColor: C.muted,
    });
    if (!ok.isConfirmed) return;
    try {
      await updateCotizacion(cotizacionID, { EstadoID: ESTADO_COTIZACION.APROBADA });
      Swal.fire({ icon: "success", title: "¡Cotización aprobada!", timer: 1500, showConfirmButton: false });
      if (cotizacionSeleccionada?.CotizacionID === cotizacionID) await recargarDetalle(cotizacionID);
      recargar();
    } catch (error) {
      swalTop({ icon: "error", title: "No se pudo aprobar", text: error.response?.data?.message || error.message });
    }
  };

  const handleConvertirAVenta = async (cotizacionID) => {
    const result = await swalTop({
      title: '¿Convertir cotización a venta?',
      html: `<p style="color:#64748b;font-size:13px">Se creará una venta pendiente y se descontará el stock de cada variante.</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, convertir', cancelButtonText: 'Cancelar',
      confirmButtonColor: C.success, cancelButtonColor: C.muted
    });
    if (!result.isConfirmed) return;
    try {
      const response = await axios.post(`${API_BASE}/api/cotizaciones/${cotizacionID}/convertir-a-venta`);
      setCotizacionSeleccionada(null);
      Swal.fire({ icon: 'success', title: '¡Conversión exitosa!', text: `Venta #${response.data.venta.VentaID} creada`, timer: 2500, showConfirmButton: false });
      recargar();
    } catch (error) {
      swalTop({ icon: 'error', title: 'No se pudo convertir', text: error.response?.data?.message || error.message || 'Error desconocido' });
    }
  };

  const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : "—";

  const obtenerPrimerProducto = (detalles) => {
    if (!Array.isArray(detalles) || detalles.length === 0) return { Nombre: "Sin producto", Imagen: null, Cantidad: 0, extra: 0 };
    const d = detalles[0];
    const info = infoDetalle(d);
    const primerDiseno = detalles.flatMap(x => x.tecnicas || []).map(urlDiseno).find(Boolean);
    return { Nombre: info.nombre, Imagen: info.imagen || primerDiseno || null, Cantidad: d.Cantidad || 0, extra: detalles.length - 1, tipo: info.tipo };
  };

  const pendientes = cotizaciones.filter(c => estadoDe(c).nombre === "Pendiente").length;

  return (
    <>
      <style>{CSS}</style>

      <div className="cz-page sx-font" style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px" }}>

        {/* HEADER */}
        <div className="cz-head">
          <div>
            <h4 className="cz-title">Gestión de Cotizaciones</h4>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
              {totalItems} cotizaci{totalItems !== 1 ? "ones" : "ón"} ·{" "}
              <span style={{ color: C.warning, fontWeight: 700 }}>{pendientes} pendiente{pendientes !== 1 ? "s" : ""} en esta página</span>
            </p>
          </div>
          <button className="sx-btn sx-btn-dark sx-btn-sm" onClick={() => setMostrarFormulario(true)}>
            <FaPlusCircle size={15} /> Agregar Cotización
          </button>
        </div>

        {/* FILTROS */}
        <div className="cz-filters">
          <select className="cz-input" aria-label="Filtrar por estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ cursor: "pointer" }}>
            <option value="Todos">Todos los estados</option>
            {Object.values(ESTADOS).map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <div className="cz-search">
            <FaSearch />
            <input className="cz-input" type="text" aria-label="Buscar cotización" placeholder="Buscar por #, cliente o documento..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>

        {/* TABLA */}
        <div className="cz-tablewrap">
          <div style={{ overflowX: "auto" }}>
            <table className="cz-table">
              <thead>
                <tr>
                  {["ID", "Imagen", "Cliente", "Producto", "Fecha", "Estado", "Valor Total", "Acciones"].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 5 ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  Array.from({ length: Math.min(itemsPorPagina, 6) }).map((_, i) => (
                    <tr key={`sk${i}`}>
                      <td><div className="cz-skel" style={{ width: 38 }} /></td>
                      <td><div className="cz-skel" style={{ width: 48, height: 48, borderRadius: 10 }} /></td>
                      <td><div className="cz-skel" style={{ width: 130, marginBottom: 6 }} /><div className="cz-skel" style={{ width: 90, height: 10 }} /></td>
                      <td><div className="cz-skel" style={{ width: 120 }} /></td>
                      <td><div className="cz-skel" style={{ width: 80 }} /></td>
                      <td><div className="cz-skel" style={{ width: 80, margin: "0 auto", height: 22, borderRadius: 11 }} /></td>
                      <td><div className="cz-skel" style={{ width: 80, margin: "0 auto", height: 22, borderRadius: 11 }} /></td>
                      <td><div className="cz-skel" style={{ width: 100, margin: "0 auto", height: 30 }} /></td>
                    </tr>
                  ))
                ) : cotizaciones.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="cz-empty">
                      <div className="cz-empty-ico"><FaBoxOpen /></div>
                      <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 15 }}>
                        {busqueda || filtroEstado !== "Todos" ? "No se encontraron cotizaciones" : "No hay cotizaciones registradas"}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                        {busqueda || filtroEstado !== "Todos" ? "Prueba con otra búsqueda o cambia el filtro de estado." : "Crea la primera con el botón «Agregar Cotización»."}
                      </p>
                    </div>
                  </td></tr>
                ) : (
                  cotizaciones.map((cot, idx) => {
                    const producto = obtenerPrimerProducto(cot.detalles);
                    const { nombre: estadoNombre, type: estadoType } = estadoDe(cot);
                    return (
                      <tr key={cot.CotizacionID} className="cz-row"
                        style={{ background: idx % 2 === 0 ? "#fff" : "#fafcff", animationDelay: `${idx * 0.03}s` }}>
                        <td><Badge type="navy">#{cot.CotizacionID}</Badge></td>
                        <td>
                          {producto.Imagen ? (
                            <img className="cz-thumb" src={producto.Imagen} alt={producto.Nombre} onClick={() => setImagenModal(producto.Imagen)} />
                          ) : (
                            <div className="cz-thumb" style={{ cursor: "default" }}>
                              {producto.tipo === "personalizado" ? <FaMagic style={{ color: C.violet, opacity: .6 }} /> : <FaBoxOpen style={{ color: C.muted, opacity: 0.45, fontSize: 18 }} />}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: C.navy }}>{cot.usuario?.Nombre || "Sin nombre"}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>CC: {cot.usuario?.DocumentoID || "N/A"}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: C.navy, maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{producto.Nombre}</div>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>
                            {producto.Cantidad} ud{producto.Cantidad !== 1 ? "s" : ""}{producto.extra > 0 ? ` · +${producto.extra} producto${producto.extra > 1 ? "s" : ""} más` : ""}
                          </div>
                        </td>
                        <td style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>{formatearFecha(cot.FechaCotizacion)}</td>
                        <td style={{ textAlign: "center" }}><Badge type={estadoType} dot>{estadoNombre}</Badge></td>
                        <td style={{ textAlign: "center" }}>
                          {parseFloat(cot.ValorTotal) > 0
                            ? <Badge type="money">${formatPrecio(cot.ValorTotal)}</Badge>
                            : <span className="cz-badge money zero" title="Aún sin costear">Por costear</span>}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                            <ActionBtn onClick={() => handleVerDetalle(cot.CotizacionID)} title="Ver detalle" color={C.accent}><FaEye size={12} /></ActionBtn>
                            {estadoNombre === "Pendiente" && (
                              <>
                                <ActionBtn onClick={() => handleAprobar(cot.CotizacionID)} title="Aprobar" color={C.success}><FaCheck size={12} /></ActionBtn>
                                <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.danger}><FaBan size={12} /></ActionBtn>
                              </>
                            )}
                            {estadoNombre === "Aprobada" && (
                              <>
                                <ActionBtn onClick={() => handleConvertirAVenta(cot.CotizacionID)} title="Convertir a venta" color={C.violet}><FaExchangeAlt size={12} /></ActionBtn>
                                <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.danger}><FaBan size={12} /></ActionBtn>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!cargando && (
            <Paginacion
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              totalItems={totalItems}
              itemsPorPagina={itemsPorPagina}
              onCambiarPagina={handleCambiarPagina}
              onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
              desde={desde}
              hasta={hasta}
            />
          )}
        </div>
      </div>

      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />

      {cotizacionSeleccionada && (
        <ModalDetalleCotizacion
          cotizacion={cotizacionSeleccionada}
          onClose={handleCerrarDetalle}
          onRecargar={recargarDetalle}
          onAprobar={handleAprobar}
          onConvertirAVenta={handleConvertirAVenta}
          onCancelar={handleCancelarCotizacion}
        />
      )}

      {mostrarFormulario && (
        <FormularioCotizacion
          key={modalKey}
          onClose={handleCerrarFormulario}
          onActualizar={handleCotizacionCreada}
        />
      )}
    </>
  );
};

export default Cotizaciones;
