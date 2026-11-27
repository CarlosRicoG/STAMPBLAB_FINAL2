import { C } from "../../config/tokens";

/* ══════════════════════════════════════════════════════════
   Utilidades compartidas del módulo de Ventas (Pedidos / Pendientes)
   ══════════════════════════════════════════════════════════ */
export const VT = {
    navy: C.navy,
    navy2: "#2d3f6e",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: C.accent,
    accentSoft: C.accentSoft,
    accentBorder: C.accentBorder,
    violet: C.violet,
    success: C.success,
    successSoft: C.successSoft,
    successBorder: C.successBorder,
    warning: C.warning,
    warningSoft: C.warningSoft,
    warningBorder: C.warningBorder,
    danger: C.danger,
    muted: C.muted,
    border: C.border,
    bg: C.bg,
};

/* Estados de venta (tabla estados, tipo 'venta') */
export const ESTADOS_VENTA = {
    8: { nombre: "Pendiente", color: C.warning, bg: C.warningSoft, border: C.warningBorder },
    9: { nombre: "Pagada", color: C.success, bg: C.successSoft, border: C.successBorder },
    10: { nombre: "En Producción", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    13: { nombre: "Lista para Entrega", color: C.violet, bg: C.purpleSoft, border: C.purpleBorder },
    11: { nombre: "Entregada", color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
    12: { nombre: "Cancelada", color: C.danger, bg: C.dangerSoft, border: C.dangerBorder },
};
const ESTILO_POR_NOMBRE = Object.fromEntries(Object.values(ESTADOS_VENTA).map(e => [e.nombre, e]));
export const estiloEstado = (idOrNombre) =>
    ESTADOS_VENTA[idOrNombre] || ESTILO_POR_NOMBRE[idOrNombre] || { nombre: idOrNombre || "Sin estado", color: VT.muted, bg: "#f1f5f9", border: VT.border };

/* Flujo normal de un pedido (para el timeline) */
export const FLUJO_VENTA = [8, 9, 10, 13, 11];

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
    blanco: C.white, negro: "#111827", rojo: C.danger, azul: "#2563eb", gris: "#9ca3af",
    verde: C.success, amarillo: "#facc15", naranja: "#f97316", rosado: "#f472b6", rosa: "#f472b6",
    morado: C.violet, violeta: C.violet, beige: "#e7d8b9", cafe: "#7c4a21", "café": "#7c4a21",
    marron: "#7c4a21", "marrón": "#7c4a21", vinotinto: "#7f1d1d", celeste: "#7dd3fc", turquesa: "#14b8a6",
    "azul marino": "#1e3a8a", "verde militar": "#4d5d2b", crema: "#fef3c7", fucsia: "#d946ef", dorado: "#d4a017", plateado: "#c0c0c0",
};
export const colorHex = (nombre = "") => COLORES_HEX[nombre.trim().toLowerCase()] || null;

/* CSS compartido (prefijo .vt-) */
export const VT_CSS = `
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
