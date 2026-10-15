import { useState, useEffect } from "react";
import { FaEdit, FaEye, FaPlusCircle, FaTrash, FaBoxOpen, FaTshirt, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
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
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const TH = { background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700, padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
        warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
        danger:  { bg: "#fef2f2", color: C.danger,  border: "#fecaca" },
        accent:  { bg: "#f0f4ff", color: C.accent,  border: "#c7d9ff" },
        navy:    { bg: C.navy,    color: "#fff",     border: C.navy },
        info:    { bg: "#e0f2fe", color: "#0369a1",  border: "#bae6fd" },
        muted:   { bg: "#f1f5f9", color: C.muted,   border: "#e2e8f0" },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 5,
        }}>{children}</span>
    );
};

const ActionBtn = ({ onClick, title, color, children, disabled }) => (
    <button onClick={onClick} title={title} disabled={disabled} style={{
        width: 30, height: 30, borderRadius: 7,
        border: `1.5px solid ${color}20`, background: `${color}0d`,
        color, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s", opacity: disabled ? 0.4 : 1,
    }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = "scale(1.08)"; } }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.transform = "none"; }}
    >{children}</button>
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
        minWidth: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
        background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600,
        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Outfit',sans-serif", transition: "all 0.18s", padding: "0 8px",
    };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>

            {/* Info items */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                {/* Anterior */}
                <button
                    onClick={() => onCambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}
                    onMouseEnter={e => { if (paginaActual !== 1) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                    <FaChevronLeft size={11} />
                </button>

                {/* Números */}
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

                {/* Siguiente */}
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

/* ── Modal Detalle ── */
const ModalDetalle = ({ compra, onClose, formatearFecha }) => {
    if (!compra) return null;
    const esInsumo = d => d.TipoSeleccion === "insumo";
    const subtotalDet = d => (parseFloat(d.PrecioUnitario) || 0) * d.Cantidad;
    const total = compra.detalles?.reduce((s, d) => s + subtotalDet(d), 0) || 0;
    const insumos = compra.detalles?.filter(d => esInsumo(d)).length || 0;
    const prods = compra.detalles?.filter(d => !esInsumo(d)).length || 0;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onClose}>
            <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 980, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.25s ease", fontFamily: "'Outfit',sans-serif" }}
                onClick={e => e.stopPropagation()}>

                <div style={{ background: C.navyGrad, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 16 }}>Detalle de la Compra</h5>
                        <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>ID #{compra.CompraID}</p>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                <div style={{ overflowY: "auto", padding: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "Proveedor", value: compra.proveedor?.Nombre },
                            { label: "NIT", value: compra.proveedor?.Nit },
                            { label: "Fecha", value: formatearFecha(compra.FechaCompra) },
                        ].map((item, i) => (
                            <div key={i} style={{ background: C.accentSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</p>
                                <p style={{ margin: "4px 0 0", fontWeight: 700, color: C.navy, fontSize: 14 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "Insumos", value: insumos, icon: <FaBoxOpen />, type: "info" },
                            { label: "Productos", value: prods, icon: <FaTshirt />, type: "success" },
                            { label: "Total Ítems", value: compra.detalles?.length || 0, icon: null, type: "accent" },
                        ].map((item, i) => (
                            <div key={i} style={{ background: C.accentSoft, borderRadius: 12, padding: "16px", textAlign: "center", border: `1px solid ${C.border}` }}>
                                {item.icon && <div style={{ color: item.type === "info" ? "#0369a1" : C.success, fontSize: 20, marginBottom: 6 }}>{item.icon}</div>}
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</p>
                                <p style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 24, color: C.navy }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <h6 style={{ fontWeight: 700, color: C.navy, marginBottom: 12 }}>Detalles de la Compra</h6>
                    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr>
                                    {["#", "Tipo", "Nombre", "Detalle", "P. Compra", "P. Venta", "Cantidad", "Subtotal"].map((h, i) => (
                                        <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 12px" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {compra.detalles?.map((d, i) => (
                                    <tr key={d.DetalleCompraID} style={{ background: i % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}` }}>
                                        <td style={{ padding: "10px 12px", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                                        <td style={{ padding: "10px 12px" }}>
                                            <Badge type={esInsumo(d) ? "info" : "success"}>
                                                {esInsumo(d) ? <><FaBoxOpen size={10} /> Insumo</> : <><FaTshirt size={10} /> Producto</>}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.navy }}>
                                            {esInsumo(d) ? d.insumo?.Nombre : d.producto?.Nombre}
                                        </td>
                                        <td style={{ padding: "10px 12px", color: C.muted }}>
                                            {esInsumo(d)
                                                ? <small>Tipo: {d.insumo?.Tipo || "—"}</small>
                                                : <small>{d.variante?.color?.Nombre} / {d.variante?.talla?.Nombre}{d.variante?.tela?.Nombre ? ` / ${d.variante.tela.Nombre}` : ""}</small>}
                                        </td>
                                        <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>${parseFloat(d.PrecioUnitario || 0).toLocaleString("es-CO")}</td>
                                        <td style={{ padding: "10px 12px", fontWeight: 600, color: C.success }}>
                                            {d.PrecioVenta ? `$${parseFloat(d.PrecioVenta).toLocaleString("es-CO")}` : "—"}
                                        </td>
                                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                            <Badge type="accent">{d.Cantidad}</Badge>
                                        </td>
                                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.navy }}>
                                            ${subtotalDet(d).toLocaleString("es-CO")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: C.accentSoft }}>
                                    <td colSpan={7} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: C.navy, fontSize: 13 }}>TOTAL COMPRA:</td>
                                    <td style={{ padding: "12px 16px", fontWeight: 800, color: C.navy, fontSize: 15 }}>${total.toLocaleString("es-CO")}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Cerrar
                    </button>
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
            setCompras(r || []);
        } catch { setError("Error de conexión al cargar compras"); }
        finally { setLoading(false); }
    };

    const handleEliminar = async (compraId) => {
        const r = await Swal.fire({
            title: "¿Está seguro?", text: "Eliminará la compra y todos sus detalles. El stock será revertido.",
            icon: "warning", showCancelButton: true,
            confirmButtonColor: C.navy, cancelButtonColor: C.danger,
            confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
        });
        if (!r.isConfirmed) return;
        try {
            const res = await deleteCompra(compraId);
            if (res.estado) { await cargarCompras(); Swal.fire({ icon: "success", title: "Eliminado", text: "Compra eliminada y stock revertido", timer: 2000, showConfirmButton: false }); }
            else throw new Error(res.mensaje);
        } catch (e) { Swal.fire("Error", e.message || "Error al eliminar", "error"); }
    };

    const handleSave = async (data) => {
        try {
            setLoading(true);
            const res = selectedCompra?.CompraID
                ? await updateCompra(selectedCompra.CompraID, data)
                : await createCompra(data);
            if (res?.estado) {
                Swal.fire({ icon: "success", title: "¡Éxito!", text: res.mensaje, timer: 2000, showConfirmButton: false });
                setShowForm(false); setSelected(null); await cargarCompras();
            } else throw new Error(res?.mensaje);
        } catch (e) { Swal.fire({ icon: "error", title: "Error", text: e.message }); }
        finally { setLoading(false); }
    };

    const formatearFecha = (f) => f ? new Date(f).toLocaleDateString("es-CO") : "—";

    const contarTipos = (detalles) => {
        if (!detalles?.length) return { insumos: 0, productos: 0, total: 0 };
        return {
            insumos: detalles.filter(d => d.TipoSeleccion === "insumo").length,
            productos: detalles.filter(d => d.TipoSeleccion === "producto").length,
            total: detalles.length,
        };
    };

    /* ── Filtrado ── */
    const comprasFiltradas = compras.filter(c => {
        const b = search.toLowerCase();
        return c.CompraID?.toString().includes(b) ||
            c.proveedor?.Nombre?.toLowerCase().includes(b) ||
            c.proveedor?.Nit?.toLowerCase().includes(b);
    });

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

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                .comp-row:hover { background: ${C.accentSoft} !important; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
            `}</style>

            <div style={{ minHeight: "100%", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Compras</h4>
                        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
                            {comprasFiltradas.length} compra{comprasFiltradas.length !== 1 ? "s" : ""} registrada{comprasFiltradas.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ position: "relative" }}>
                            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
                            <input type="text" placeholder="Buscar compra..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ padding: "9px 12px 9px 36px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 240, transition: "border-color 0.2s" }}
                                onFocus={e => e.target.style.borderColor = C.accent}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <button onClick={() => { setSelected(null); setShowForm(true); }}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 12px ${C.navy}33`, transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#2d3f6e"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = "none"; }}>
                            <FaPlusCircle size={15} /> Agregar Compra
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", gap: 12 }}>
                        {error}
                        <button onClick={cargarCompras} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* TABLA */}
                <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                            <thead>
                                <tr>
                                    {["ID", "Proveedor", "NIT", "Fecha", "Tipo", "# Ítems", "Acciones"].map((h, i) => (
                                        <th key={i} style={{ ...TH, textAlign: i >= 4 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 6 ? 18 : 0 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                                        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                        <span style={{ color: C.muted, fontSize: 13 }}>Cargando compras...</span>
                                    </td></tr>
                                ) : error ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0", color: C.danger }}>
                                        <p>{error}</p>
                                        <button onClick={cargarCompras} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                                    </td></tr>
                                ) : comprasFiltradas.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
                                        <FaBoxOpen size={36} style={{ opacity: 0.2, display: "block", margin: "0 auto 10px" }} />
                                        {compras.length === 0 ? "No hay compras registradas" : "No se encontraron compras"}
                                    </td></tr>
                                ) : (
                                    comprasPagina.map((c, idx) => {
                                        const { insumos, productos, total } = contarTipos(c.detalles);
                                        return (
                                            <tr key={c.CompraID} className="comp-row"
                                                style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s", borderBottom: `1px solid ${C.border}` }}>
                                                <td style={{ padding: "11px 14px" }}><Badge type="navy">#{c.CompraID}</Badge></td>
                                                <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{c.proveedor?.Nombre || "N/A"}</td>
                                                <td style={{ padding: "11px 14px", color: C.muted }}>{c.proveedor?.Nit || "N/A"}</td>
                                                <td style={{ padding: "11px 14px", color: C.muted }}>{formatearFecha(c.FechaCompra)}</td>
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                                        {insumos > 0 && <Badge type="info"><FaBoxOpen size={10} /> {insumos}</Badge>}
                                                        {productos > 0 && <Badge type="success"><FaTshirt size={10} /> {productos}</Badge>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}><Badge type="accent">{total}</Badge></td>
                                                <td style={{ padding: "11px 14px" }}>
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

            {showDetail && <ModalDetalle compra={selectedCompra} onClose={() => setShowDetail(false)} formatearFecha={formatearFecha} />}
        </>
    );
};

export default Compras;