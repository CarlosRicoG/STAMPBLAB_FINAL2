import { useState, useEffect } from "react";
import { FaEdit, FaEye, FaPlusCircle, FaTrash, FaBoxOpen, FaTshirt, FaSearch, FaChevronLeft, FaChevronRight, FaTruck, FaCalendarAlt, FaReceipt, FaCoins, FaEnvelope, FaPhoneAlt, FaTimes, FaLayerGroup } from "react-icons/fa";
import { getCompras, createCompra, updateCompra, deleteCompra } from "../Services/api-compras/compras";
import Swal from "sweetalert2";
import NuevaCompra from "./formularios_dash/CompraForm";

/* ── Tokens ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    violet: "#7c3aed",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const money = (n) => `$${(Number(n) || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;
const subtotalDet = d => (parseFloat(d.PrecioUnitario) || 0) * (Number(d.Cantidad) || 0);
const totalCompra = c => (c.detalles || []).reduce((s, d) => s + subtotalDet(d), 0);

/* Estilos compartidos del módulo (prefijo .cp-) */
const CP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
@keyframes cpFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes cpFade { from{opacity:0} to{opacity:1} }
@keyframes cpPop { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
@keyframes cpShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes spin { to{transform:rotate(360deg)} }
.cp-page { animation: cpFadeUp .35s ease both; }
.cp-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; margin-bottom:20px; }
.cp-kpi { background:#fff; border-radius:16px; padding:16px 18px; display:flex; align-items:center; gap:14px; box-shadow:0 2px 10px rgba(15,23,42,.05), 0 0 0 1px #eef2f7; animation:cpFadeUp .4s ease both; transition:transform .2s, box-shadow .2s; }
.cp-kpi:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(26,37,64,.10), 0 0 0 1px #e2e8f0; }
.cp-kpi-ic { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.cp-kpi-lb { margin:0; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; }
.cp-kpi-vl { margin:2px 0 0; font-size:22px; font-weight:800; color:#1a2540; letter-spacing:-.02em; line-height:1.1; }
.cp-table { width:100%; border-collapse:collapse; font-size:13px; font-family:'Outfit',sans-serif; }
.cp-table thead tr { background:linear-gradient(90deg,#1a2540 0%,#2d3f6e 100%); }
.cp-table th { color:#fff; font-size:11px; font-weight:700; padding:12px 14px; white-space:nowrap; letter-spacing:.06em; text-transform:uppercase; background:transparent; }
.cp-table td { padding:12px 14px; border-bottom:1px solid #eef2f7; vertical-align:middle; }
.cp-row { transition:background .15s, box-shadow .15s; animation:cpFadeUp .3s ease both; }
.cp-row:nth-child(even) { background:#fafbff; }
.cp-row:hover { background:#eef4ff !important; box-shadow:inset 3px 0 0 #4f8ef7; }
.cp-iconbtn { width:32px; height:32px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s, background .15s, box-shadow .15s; }
.cp-iconbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 14px rgba(15,23,42,.12); }
.cp-skel { height:12px; border-radius:6px; background:linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size:800px 100%; animation:cpShimmer 1.2s linear infinite; }
.cp-empty { text-align:center; padding:56px 20px; color:#64748b; }
.cp-empty-ic { width:72px; height:72px; border-radius:20px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#f0f4ff,#ede9fe); color:#4f8ef7; font-size:28px; }
.cp-search { position:relative; }
.cp-search input { padding:10px 34px 10px 36px; border:1.5px solid #e2e8f0; border-radius:11px; font-size:13px; font-family:'Outfit',sans-serif; outline:none; width:260px; transition:border-color .2s, box-shadow .2s; background:#fff; color:#0f172a; }
.cp-search input:focus { border-color:#4f8ef7; box-shadow:0 0 0 4px rgba(79,142,247,.12); }
.cp-primary { background:#1a2540; color:#fff; border:none; border-radius:11px; padding:10px 20px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; font-family:'Outfit',sans-serif; box-shadow:0 6px 16px rgba(26,37,64,.22); transition:transform .18s, background .18s, box-shadow .18s; }
.cp-primary:hover { background:#2d3f6e; transform:translateY(-1px); box-shadow:0 10px 22px rgba(26,37,64,.28); }
.cp-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation:cpFade .2s ease both; }
.cp-modal { background:#fff; border-radius:22px; width:100%; max-width:980px; max-height:92vh; overflow:hidden; display:flex; flex-direction:column; animation:cpPop .28s cubic-bezier(.2,.8,.2,1) both; font-family:'Outfit',sans-serif; box-shadow:0 30px 80px rgba(15,23,42,.35); }
.cp-mhead { background:radial-gradient(120% 140% at 100% 0%, rgba(124,58,237,.45) 0%, rgba(124,58,237,0) 55%), linear-gradient(120deg,#1a2540 0%,#2d3f6e 100%); padding:22px 26px; color:#fff; position:relative; }
.cp-mclose { position:absolute; top:16px; right:16px; width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s, transform .15s; }
.cp-mclose:hover { background:rgba(255,255,255,.26); transform:rotate(90deg); }
.cp-item { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:14px; align-items:center; padding:12px 14px; border:1px solid #eef2f7; border-radius:14px; background:#fff; transition:border-color .15s, box-shadow .15s, transform .15s; animation:cpFadeUp .3s ease both; }
.cp-item:hover { border-color:#c7d9ff; box-shadow:0 6px 18px rgba(79,142,247,.12); transform:translateY(-1px); }
.cp-item-ic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:16px; }
.cp-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700; }
@media (max-width: 820px) {
  .cp-head { flex-direction:column; align-items:stretch !important; gap:14px; }
  .cp-head-actions { flex-wrap:wrap; }
  .cp-search input { width:100%; }
  .cp-search { flex:1; }
  .cp-mgrid { grid-template-columns:1fr !important; }
  .cp-item { grid-template-columns:auto minmax(0,1fr); }
  .cp-item-amt { grid-column:1 / -1; text-align:left !important; }
}
`;

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
        warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
        danger:  { bg: "#fef2f2", color: C.danger,  border: "#fecaca" },
        accent:  { bg: "#f0f4ff", color: C.accent,  border: "#c7d9ff" },
        violet:  { bg: "#f5f3ff", color: C.violet,  border: "#ddd6fe" },
        navy:    { bg: C.navy,    color: "#fff",     border: C.navy },
        info:    { bg: "#e0f2fe", color: "#0369a1",  border: "#bae6fd" },
        muted:   { bg: "#f1f5f9", color: C.muted,   border: "#e2e8f0" },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        }}>{children}</span>
    );
};

const ActionBtn = ({ onClick, title, color, children, disabled }) => (
    <button className="cp-iconbtn" onClick={onClick} title={title} aria-label={title} disabled={disabled} style={{
        border: `1.5px solid ${color}26`, background: `${color}10`,
        color, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    }}>{children}</button>
);

const Kpi = ({ icon, label, value, color, delay = 0 }) => (
    <div className="cp-kpi" style={{ animationDelay: `${delay}ms` }}>
        <div className="cp-kpi-ic" style={{ background: `${color}14`, color }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <p className="cp-kpi-lb">{label}</p>
            <p className="cp-kpi-vl">{value}</p>
        </div>
    </div>
);

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];

const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
    if (totalItems === 0) return null;

    const generarPaginas = () => {
        const paginas = [];
        const delta = 2; // páginas a mostrar a cada lado de la actual
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
        minWidth: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.border}`,
        background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600,
        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Outfit',sans-serif", transition: "all 0.18s", padding: "0 8px",
    };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>

            {/* Info items */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                    Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> compras
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Por página:</span>
                    <select value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}
                        style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", color: C.navy, cursor: "pointer", background: "#fff" }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}>
                        {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Controles de página */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                    onClick={() => onCambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1} aria-label="Página anterior"
                    style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (paginaActual !== 1) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                    <FaChevronLeft size={11} />
                </button>

                {generarPaginas().map((p, i) => (
                    p === "..." ? (
                        <span key={`e-${i}`} style={{ padding: "0 4px", color: C.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>…</span>
                    ) : (
                        <button key={p} onClick={() => onCambiarPagina(p)}
                            style={{
                                ...btnBase,
                                background: p === paginaActual ? C.navy : "#fff",
                                color: p === paginaActual ? "#fff" : C.muted,
                                borderColor: p === paginaActual ? C.navy : C.border,
                                fontWeight: p === paginaActual ? 700 : 600,
                                cursor: p === paginaActual ? "default" : "pointer",
                                boxShadow: p === paginaActual ? "0 4px 12px rgba(26,37,64,.25)" : "none",
                            }}
                            onMouseEnter={e => { if (p !== paginaActual) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                            onMouseLeave={e => { if (p !== paginaActual) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}>
                            {p}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onCambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas} aria-label="Página siguiente"
                    style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (paginaActual !== totalPaginas) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                    <FaChevronRight size={11} />
                </button>
            </div>
        </div>
    );
};

/* ── Modal Detalle ── */
const ModalDetalle = ({ compra, onClose, formatearFecha }) => {
    useEffect(() => {
        const onKey = e => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!compra) return null;
    const esInsumo = d => d.TipoSeleccion === "insumo";
    const detalles = compra.detalles || [];
    const total = totalCompra(compra);
    const detIns = detalles.filter(esInsumo);
    const detProd = detalles.filter(d => !esInsumo(d));
    const totalIns = detIns.reduce((s, d) => s + subtotalDet(d), 0);
    const totalProd = detProd.reduce((s, d) => s + subtotalDet(d), 0);
    const unidades = detalles.reduce((s, d) => s + (Number(d.Cantidad) || 0), 0);
    const prov = compra.proveedor || {};
    const iniciales = (prov.Nombre || "?").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

    return (
        <div className="cp-overlay" onClick={onClose}>
            <div className="cp-modal" role="dialog" aria-modal="true" aria-label={`Detalle de la compra ${compra.CompraID}`} onClick={e => e.stopPropagation()}>

                {/* Cabecera */}
                <div className="cp-mhead">
                    <button className="cp-mclose" onClick={onClose} aria-label="Cerrar"><FaTimes size={13} /></button>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 44 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaReceipt size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.65)" }}>Detalle de la Compra</p>
                            <h5 style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>Compra #{compra.CompraID}</h5>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                        <span className="cp-chip" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}><FaCalendarAlt size={10} /> {formatearFecha(compra.FechaCompra)}</span>
                        <span className="cp-chip" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}><FaLayerGroup size={10} /> {detalles.length} ítem{detalles.length !== 1 ? "s" : ""} · {unidades} unidad{unidades !== 1 ? "es" : ""}</span>
                    </div>
                </div>

                <div style={{ overflowY: "auto", padding: 24, background: C.bg }}>
                    <div className="cp-mgrid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 16, marginBottom: 20 }}>
                        {/* Proveedor */}
                        <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
                            <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#4f8ef7,#7c3aed)", color: "#fff", fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iniciales}</div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Proveedor</p>
                                <p style={{ margin: "2px 0 6px", fontWeight: 800, color: C.navy, fontSize: 16 }}>{prov.Nombre || "Proveedor no disponible"}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    <Badge type="accent">NIT {prov.Nit || compra.ProveedorID || "—"}</Badge>
                                    {prov.Estado === false && <Badge type="danger">Inactivo</Badge>}
                                </div>
                                {(prov.Correo || prov.Telefono) && (
                                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted }}>
                                        {prov.Correo && <span style={{ display: "flex", alignItems: "center", gap: 6, overflowWrap: "anywhere" }}><FaEnvelope size={11} /> {prov.Correo}</span>}
                                        {prov.Telefono && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FaPhoneAlt size={10} /> {prov.Telefono}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumen numérico */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                { label: "Insumos", value: detIns.length, icon: <FaBoxOpen />, color: "#0369a1" },
                                { label: "Productos", value: detProd.length, icon: <FaTshirt />, color: C.success },
                            ].map(k => (
                                <div key={k.label} style={{ background: "#fff", borderRadius: 16, padding: 14, border: `1px solid ${C.border}` }}>
                                    <div style={{ color: k.color, fontSize: 16 }}>{k.icon}</div>
                                    <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{k.label}</p>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 24, color: C.navy }}>{k.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h6 style={{ fontWeight: 800, color: C.navy, margin: "0 0 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 4, height: 16, borderRadius: 4, background: C.accent, display: "inline-block" }} />
                        Detalles de la Compra
                    </h6>

                    {detalles.length === 0 ? (
                        <div className="cp-empty" style={{ background: "#fff", borderRadius: 14, border: `1px dashed ${C.accentBorder}` }}>Esta compra no tiene ítems.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {detalles.map((d, i) => {
                                const ins = esInsumo(d);
                                const color = ins ? "#0369a1" : C.success;
                                const v = d.variante;
                                return (
                                    <div key={d.DetalleCompraID || i} className="cp-item" style={{ animationDelay: `${i * 40}ms` }}>
                                        <div className="cp-item-ic" style={{ background: `${color}14`, color }}>{ins ? <FaBoxOpen /> : <FaTshirt />}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={{ fontWeight: 800, color: C.navy, fontSize: 14 }}>{ins ? (d.insumo?.Nombre || "Insumo eliminado") : (d.producto?.Nombre || "Producto eliminado")}</span>
                                                <Badge type={ins ? "info" : "success"}>{ins ? "Insumo" : "Producto"}</Badge>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, fontSize: 12, color: C.muted }}>
                                                {ins ? (
                                                    <span className="cp-chip" style={{ background: "#f1f5f9", color: C.muted }}>Tipo: {d.insumo?.Tipo || "—"}</span>
                                                ) : (
                                                    <>
                                                        <span className="cp-chip" style={{ background: "#f1f5f9", color: C.navy }}>Color: {v?.color?.Nombre || "—"}</span>
                                                        <span className="cp-chip" style={{ background: "#f1f5f9", color: C.navy }}>Talla: {v?.talla?.Nombre || "—"}</span>
                                                        <span className="cp-chip" style={{ background: "#f5f3ff", color: C.violet }}>Tela: {v?.tela?.Nombre || "Sin tela"}</span>
                                                    </>
                                                )}
                                                {!ins && d.PrecioVenta ? <span className="cp-chip" style={{ background: "#f0fdf4", color: C.success }}>P. venta {money(d.PrecioVenta)}</span> : null}
                                            </div>
                                        </div>
                                        <div className="cp-item-amt" style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{d.Cantidad} × {money(d.PrecioUnitario)}</div>
                                            <div style={{ fontWeight: 800, color: C.navy, fontSize: 15 }}>{money(subtotalDet(d))}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Totales */}
                    <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                            <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}>
                                <span>Subtotal insumos</span><strong style={{ color: C.navy }}>{money(totalIns)}</strong>
                            </div>
                            <div style={{ padding: "0 18px 12px", display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted }}>
                                <span>Subtotal productos</span><strong style={{ color: C.navy }}>{money(totalProd)}</strong>
                            </div>
                            <div style={{ background: C.navyGrad, color: "#fff", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", opacity: .8 }}>Total compra</span>
                                <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>{money(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", background: "#fff" }}>
                    <button className="cp-primary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
const Compras = () => {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedCompra, setSelected] = useState(null);
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    /* ── Estado de paginación ── */
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    useEffect(() => { cargarCompras(); }, []);

    // Reset página cuando cambia el buscador
    useEffect(() => { setPaginaActual(1); }, [search]);

    const cargarCompras = async () => {
        try {
            setLoading(true); setError(null);
            const r = await getCompras();
            setCompras(Array.isArray(r) ? r : []);
        } catch { setError("Error de conexión al cargar compras"); }
        finally { setLoading(false); }
    };

    const handleEliminar = async (compraId) => {
        const r = await Swal.fire({
            title: "¿Está seguro?", text: "Eliminará la compra y todos sus detalles. El stock será revertido.",
            icon: "warning", showCancelButton: true,
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (!r.isConfirmed) return;
        try {
            const res = await deleteCompra(compraId);
            if (res.estado) { await cargarCompras(); Swal.fire({ icon: "success", title: "Eliminado", text: "Compra eliminada y stock revertido", timer: 2000, showConfirmButton: false }); }
            else throw new Error(res.mensaje);
        } catch (e) { Swal.fire({ icon: "error", title: "No se pudo eliminar", text: e.message || "Error al eliminar", confirmButtonColor: C.navy }); }
    };

    const handleSave = async (data) => {
        try {
            const res = selectedCompra?.CompraID
                ? await updateCompra(selectedCompra.CompraID, data)
                : await createCompra(data);
            if (res?.estado) {
                Swal.fire({ icon: "success", title: "¡Éxito!", text: res.mensaje, timer: 2000, showConfirmButton: false });
                setShowForm(false); setSelected(null); await cargarCompras();
            } else throw new Error(res?.mensaje);
        } catch (e) { Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: C.navy }); }
    };

    const formatearFecha = (f) => f ? new Date(f).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const contarTipos = (detalles) => {
        if (!detalles?.length) return { insumos: 0, productos: 0, total: 0 };
        return {
            insumos: detalles.filter(d => d.TipoSeleccion === "insumo").length,
            productos: detalles.filter(d => d.TipoSeleccion === "producto").length,
            total: detalles.length,
        };
    };

    /* ── Filtrado (ID, proveedor, NIT, fecha o nombre de ítem) ── */
    const comprasFiltradas = compras.filter(c => {
        const b = search.trim().toLowerCase();
        if (!b) return true;
        return c.CompraID?.toString().includes(b.replace("#", "")) ||
            c.proveedor?.Nombre?.toLowerCase().includes(b) ||
            c.proveedor?.Nit?.toLowerCase().includes(b) ||
            formatearFecha(c.FechaCompra).toLowerCase().includes(b) ||
            (c.detalles || []).some(d => (d.insumo?.Nombre || d.producto?.Nombre || "").toLowerCase().includes(b));
    });

    /* ── Indicadores ── */
    const totalInvertido = compras.reduce((s, c) => s + totalCompra(c), 0);
    const hoy = new Date();
    const comprasMes = compras.filter(c => { const f = new Date(c.FechaCompra); return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear(); }).length;
    const proveedoresUnicos = new Set(compras.map(c => c.ProveedorRefId || c.ProveedorID)).size;

    /* ── Paginado ── */
    const totalPaginas = Math.max(1, Math.ceil(comprasFiltradas.length / itemsPorPagina));
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const desde = comprasFiltradas.length === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
    const hasta = Math.min(paginaSegura * itemsPorPagina, comprasFiltradas.length);
    const comprasPagina = comprasFiltradas.slice((paginaSegura - 1) * itemsPorPagina, paginaSegura * itemsPorPagina);

    const handleCambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) setPaginaActual(nuevaPagina);
    };

    const handleCambiarItemsPorPagina = (n) => {
        setItemsPorPagina(n);
        setPaginaActual(1);
    };

    if (showForm) return <NuevaCompra onClose={() => { setShowForm(false); setSelected(null); }} onSave={handleSave} compra={selectedCompra} />;

    const COLS = ["ID", "Proveedor", "NIT", "Fecha", "Tipo", "# Ítems", "Total", "Acciones"];

    return (
        <>
            <style>{CP_CSS}</style>

            <div className="cp-page" style={{ minHeight: "100%", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* HEADER */}
                <div className="cp-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Compras</h4>
                        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
                            {comprasFiltradas.length} compra{comprasFiltradas.length !== 1 ? "s" : ""} registrada{comprasFiltradas.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="cp-head-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div className="cp-search">
                            <FaSearch style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
                            <input type="text" placeholder="Buscar compra..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar compra" />
                            {search && <button onClick={() => setSearch("")} aria-label="Limpiar búsqueda" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "#f1f5f9", color: C.muted, width: 22, height: 22, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes size={10} /></button>}
                        </div>
                        <button className="cp-primary" onClick={() => { setSelected(null); setShowForm(true); }}>
                            <FaPlusCircle size={15} /> Agregar Compra
                        </button>
                    </div>
                </div>

                {/* INDICADORES */}
                {!error && (
                    <div className="cp-kpis">
                        <Kpi icon={<FaReceipt />} label="Compras" value={loading ? "—" : compras.length} color={C.accent} />
                        <Kpi icon={<FaCoins />} label="Total invertido" value={loading ? "—" : money(totalInvertido)} color={C.success} delay={60} />
                        <Kpi icon={<FaCalendarAlt />} label="Este mes" value={loading ? "—" : comprasMes} color={C.violet} delay={120} />
                        <Kpi icon={<FaTruck />} label="Proveedores" value={loading ? "—" : proveedoresUnicos} color={C.warning} delay={180} />
                    </div>
                )}

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={cargarCompras} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* TABLA */}
                <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table className="cp-table">
                            <thead>
                                <tr>
                                    {COLS.map((h, i) => (
                                        <th key={i} style={{ textAlign: i >= 4 ? "center" : "left" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, r) => (
                                        <tr key={r}>
                                            {COLS.map((_, c) => (
                                                <td key={c}><div className="cp-skel" style={{ width: c === 1 ? "70%" : c === 7 ? 90 : "55%", margin: c >= 4 ? "0 auto" : 0 }} /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : error ? (
                                    <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: "48px 0", color: C.danger }}>
                                        <p>{error}</p>
                                        <button onClick={cargarCompras} className="cp-primary">Reintentar</button>
                                    </td></tr>
                                ) : comprasFiltradas.length === 0 ? (
                                    <tr><td colSpan={COLS.length} style={{ padding: 0 }}>
                                        <div className="cp-empty">
                                            <div className="cp-empty-ic"><FaBoxOpen /></div>
                                            <p style={{ margin: "0 0 4px", fontWeight: 800, color: C.navy, fontSize: 15 }}>
                                                {compras.length === 0 ? "No hay compras registradas" : "No se encontraron compras"}
                                            </p>
                                            <p style={{ margin: "0 0 16px", fontSize: 13 }}>
                                                {compras.length === 0 ? "Registra la primera compra a un proveedor para alimentar el inventario." : `Ninguna compra coincide con "${search}".`}
                                            </p>
                                            {compras.length === 0
                                                ? <button className="cp-primary" onClick={() => { setSelected(null); setShowForm(true); }}><FaPlusCircle /> Agregar Compra</button>
                                                : <button onClick={() => setSearch("")} style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Limpiar búsqueda</button>}
                                        </div>
                                    </td></tr>
                                ) : (
                                    comprasPagina.map((c, idx) => {
                                        const { insumos, productos, total } = contarTipos(c.detalles);
                                        return (
                                            <tr key={c.CompraID} className="cp-row" style={{ animationDelay: `${idx * 25}ms` }}>
                                                <td><Badge type="navy">#{c.CompraID}</Badge></td>
                                                <td style={{ fontWeight: 700, color: C.navy }}>{c.proveedor?.Nombre || "N/A"}</td>
                                                <td style={{ color: C.muted }}>{c.proveedor?.Nit || c.ProveedorID || "N/A"}</td>
                                                <td style={{ color: C.muted, whiteSpace: "nowrap" }}>{formatearFecha(c.FechaCompra)}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                                        {insumos > 0 && <Badge type="info"><FaBoxOpen size={10} /> {insumos} insumo{insumos !== 1 ? "s" : ""}</Badge>}
                                                        {productos > 0 && <Badge type="success"><FaTshirt size={10} /> {productos} producto{productos !== 1 ? "s" : ""}</Badge>}
                                                        {total === 0 && <Badge type="muted">Sin ítems</Badge>}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "center" }}><Badge type="accent">{total}</Badge></td>
                                                <td style={{ textAlign: "center", fontWeight: 800, color: C.navy, whiteSpace: "nowrap" }}>{money(totalCompra(c))}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                        <ActionBtn onClick={() => { setSelected(c); setShowDetail(true); }} title="Ver detalle" color={C.accent}><FaEye size={12} /></ActionBtn>
                                                        <ActionBtn onClick={() => { setSelected(c); setShowForm(true); }} title="Editar" color={C.warning}><FaEdit size={12} /></ActionBtn>
                                                        <ActionBtn onClick={() => handleEliminar(c.CompraID)} title="Eliminar" color={C.danger}><FaTrash size={12} /></ActionBtn>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── PAGINACIÓN ── */}
                    {!loading && !error && (
                        <Paginacion
                            paginaActual={paginaSegura}
                            totalPaginas={totalPaginas}
                            totalItems={comprasFiltradas.length}
                            itemsPorPagina={itemsPorPagina}
                            onCambiarPagina={handleCambiarPagina}
                            onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
                            desde={desde}
                            hasta={hasta}
                        />
                    )}
                </div>
            </div>

            {showDetail && <ModalDetalle compra={selectedCompra} onClose={() => { setShowDetail(false); setSelected(null); }} formatearFecha={formatearFecha} />}
        </>
    );
};

export default Compras;
