import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaSyncAlt, FaTrash, FaBoxOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import NuevaVenta from "./formularios_dash/NuevaVenta";
import { getVentas, getVentaById, updateEstadoVenta, deleteVenta } from "../Services/api-ventas/ventas";
import { getEstadosVenta } from "../Services/api-ventas/estados";
import ModalDetalleVenta from "./ModalDetalleVenta";

/* ── Tokens ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const TH = {
    background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700,
    padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "left",
};

const ESTADO_STYLES = {
    "Pendiente": { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    "Pagada": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    "En Producción": { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    "Lista para Entrega": { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
    "Entregada": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    "Cancelada": { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const EstadoBadge = ({ nombre }) => {
    const s = ESTADO_STYLES[nombre] || { bg: "#f1f5f9", color: C.muted, border: C.border };
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {nombre}
        </span>
    );
};

const Badge = ({ type, children }) => {
    const map = {
        muted: { bg: "#f1f5f9", color: C.muted, border: C.border },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};


const formatPrecio = (valor) => {
    const num = parseFloat(valor) || 0;
    return num.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};


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
        fontFamily: "'Outfit',sans-serif", transition: "all 0.18s", padding: "0 8px",
    };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                    Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> pedidos
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

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                    onClick={() => onCambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
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
                            }}
                            onMouseEnter={e => { if (p !== paginaActual) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                            onMouseLeave={e => { if (p !== paginaActual) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}>
                            {p}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onCambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (paginaActual !== totalPaginas) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                    <FaChevronRight size={11} />
                </button>
            </div>
        </div>
    );
};

/* ── Modal Cambiar Estado ── */
const EstadoModal = ({ show, onClose, onConfirm, estados, estadoSeleccionado, setEstadoSeleccionado }) => {
    if (!show) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ background: C.navyGrad, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#fff" }}>Cambiar Estado de Venta</p>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.navy, display: "block", marginBottom: 8 }}>Seleccione el nuevo estado</label>
                    <select value={estadoSeleccionado} onChange={e => setEstadoSeleccionado(e.target.value)}
                        style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontFamily: "'Outfit',sans-serif", fontSize: 13, outline: "none" }}>
                        <option value="">-- Seleccione --</option>
                        {estados.map(e => (
                            <option key={e.EstadoID} value={e.EstadoID}>{e.Nombre} — {e.Descripcion}</option>
                        ))}
                    </select>
                </div>
                <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onConfirm} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Confirmar</button>
                    <button onClick={onClose} style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════ */
const Ventas = () => {

    const [showForm, setShowForm] = useState(false);
    const [ventaEdit, setVentaEdit] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEstadoModal, setShowEstadoModal] = useState(false);
    const [estadosVenta, setEstadosVenta] = useState([]);
    const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
    const [filtro, setFiltro] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    /* ── Paginación ── */
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    const [totalItems, setTotalItems] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true });

    useEffect(() => { loadVentas(1, itemsPorPagina, ""); loadEstadosVenta(); }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPaginaActual(1);
            loadVentas(1, itemsPorPagina, filtro);
        }, 350);
        return () => clearTimeout(timeout);
    }, [filtro]);


    const loadVentas = async (page, limit, search) => {
        try {
            setLoading(true); setError(null);
            const data = await getVentas({ page, limit, search, estado: "procesadas" });
            setVentas(data.datos || []);
            setTotalItems(data.total || 0);
            setTotalPaginas(data.totalPaginas || 1);
        } catch { setError("Error al cargar ventas"); }
        finally { setLoading(false); }
    };

    const loadEstadosVenta = async () => {
        try { setEstadosVenta((await getEstadosVenta()) || []); }
        catch (e) { console.error(e); }
    };

    const getEstadoBadge = (estadoID) => {
        const estado = estadosVenta.find(e => e.EstadoID === estadoID);
        return estado?.Nombre || "Sin estado";
    };

    const handleAgregar = () => { setVentaEdit(null); setShowForm(true); };
    const handleEditar = (v) => { setVentaEdit(v); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setVentaEdit(null); loadVentas(1, itemsPorPagina, filtro); };

    const handleVer = async (venta) => {
        try {
            const data = await getVentaById(venta.VentaID);
            setSelectedVenta(data); setShowDetailModal(true);
        } catch { Toast.fire({ icon: "error", title: "Error al cargar detalles" }); }
    };

    const handleCambiarEstado = (v) => { setSelectedVenta(v); setEstadoSeleccionado(v.EstadoID || ""); setShowEstadoModal(true); };

    const confirmarCambioEstado = async () => {
        if (!estadoSeleccionado) { Toast.fire({ icon: "warning", title: "Seleccione un estado" }); return; }
        try {
            await updateEstadoVenta(selectedVenta.VentaID, parseInt(estadoSeleccionado));
            Toast.fire({ icon: "success", title: "Estado actualizado correctamente" });
            setShowEstadoModal(false); loadVentas(paginaActual, itemsPorPagina, filtro);
        } catch { Toast.fire({ icon: "error", title: "Error al actualizar el estado" }); }
    };

    const handleEliminar = async (venta) => {
        const result = await Swal.fire({
            title: `¿Eliminar venta #${venta.VentaID}?`,
            text: "Esta acción no se puede deshacer.",
            icon: "warning", showCancelButton: true,
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
            try {
                setDeletingId(venta.VentaID);
                await deleteVenta(venta.VentaID);
                Toast.fire({ icon: "success", title: `Venta #${venta.VentaID} eliminada` });
                await loadVentas(paginaActual, itemsPorPagina, filtro);
            } catch { Toast.fire({ icon: "error", title: "Error al eliminar la venta" }); }
            finally { setDeletingId(null); }
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "-";
        return new Date(fecha).toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    };

    /* ── Filtrado ── */
    const ventasFiltradas = ventas;

    /* ── Paginado ── */
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const desde = ventasFiltradas.length === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
    const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);
    
    const ventasPagina = ventas;

    const handleCambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
            loadVentas(nuevaPagina, itemsPorPagina, filtro);
        }
    };
    const handleCambiarItemsPorPagina = (n) => {
        setItemsPorPagina(n); setPaginaActual(1);
        loadVentas(1, n, filtro);
    };

    if (showForm) return <NuevaVenta onClose={handleCloseForm} ventaEdit={ventaEdit} />;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                .venta-row:hover { background: ${C.accentSoft} !important; }
                .icon-btn { transition: all 0.18s; }
                .icon-btn:hover { transform: scale(1.08); }
            `}</style>

            <div style={{ minHeight: "100%", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Pedidos</h4>
                        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
                            {totalItems} pedido{totalItems !== 1 ? "s" : ""} registrado{totalItems !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input type="text" placeholder="Filtrar por ID o cliente..." value={filtro} onChange={e => setFiltro(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 240, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button onClick={handleAgregar} disabled={loading}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1, boxShadow: `0 4px 12px ${C.navy}33`, transition: "all 0.2s" }}
                            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#2d3f6e"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = "none"; }}>
                            <FaPlusCircle size={15} /> Agregar Pedido
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={() => loadVentas(1, itemsPorPagina, filtro)} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                            <thead>
                                <tr>
                                    {["ID Venta", "Cliente", "Fecha", "Subtotal", "Total", "Estado", "Acciones"].map((h, i) => (
                                        <th key={i} style={{ ...TH, textAlign: ["Subtotal", "Total", "Acciones"].includes(h) ? "right" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 6 ? 18 : 0 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                                        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                        <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando ventas...</p>
                                    </td></tr>
                                ) : ventasFiltradas.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                                        <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, display: "block", margin: "0 auto 12px" }} />
                                        <p style={{ color: C.muted, margin: "0 0 14px", fontSize: 13 }}>
                                            {filtro ? "No se encontraron ventas con ese filtro." : "No hay ventas registradas."}
                                        </p>
                                        {!filtro && <button onClick={handleAgregar} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primera venta</button>}
                                    </td></tr>
                                ) : (
                                    ventasPagina.map((venta, idx) => (
                                        <tr key={venta.VentaID} className="venta-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                            <td style={{ padding: "11px 14px" }}><Badge type="muted">#{venta.VentaID}</Badge></td>
                                            <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>
                                                {venta.usuario?.Nombre || `Doc: ${venta.DocumentoID}`}
                                            </td>
                                            <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>{formatearFecha(venta.FechaVenta)}</td>
                                            <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>
                                                ${formatPrecio(venta.Subtotal)}
                                            </td>
                                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: C.navy }}>
                                                ${formatPrecio(venta.Total)}
                                            </td>
                                            <td style={{ padding: "11px 14px" }}>
                                                <EstadoBadge nombre={getEstadoBadge(venta.EstadoID)} />
                                            </td>
                                            <td style={{ padding: "11px 14px", textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    <button className="icon-btn" onClick={() => handleVer(venta)} title="Ver detalles"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaEye size={12} />
                                                    </button>
                                                    {/* <button className="icon-btn" onClick={() => handleEditar(venta)} title="Editar"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaEdit size={12} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleCambiarEstado(venta)} title="Cambiar estado"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaSyncAlt size={12} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleEliminar(venta)} title="Eliminar"
                                                        disabled={deletingId === venta.VentaID}
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deletingId === venta.VentaID ? 0.5 : 1 }}>
                                                        <FaTrash size={12} />
                                                    </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── PAGINACIÓN ── */}
                    {!loading && !error && (
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

            {showDetailModal && selectedVenta && (
                <ModalDetalleVenta venta={selectedVenta} onClose={() => setShowDetailModal(false)} />
            )}

            <EstadoModal
                show={showEstadoModal}
                onClose={() => setShowEstadoModal(false)}
                onConfirm={confirmarCambioEstado}
                estados={estadosVenta}
                estadoSeleccionado={estadoSeleccionado}
                setEstadoSeleccionado={setEstadoSeleccionado}
            />
        </>
    );
};

export default Ventas;