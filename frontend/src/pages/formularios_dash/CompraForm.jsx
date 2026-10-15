import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPlus, FaTrash, FaSearch, FaBoxOpen, FaTshirt, FaEye, FaArrowLeft, FaCheck } from "react-icons/fa";
import Swal from "sweetalert2";
import { getProveedores, getVariantesByProductoEnCompra } from "../../Services/api-compras/compras";
import { getInsumos } from "../../Services/api-insumos/insumos";
import { getProductos } from "../../Services/api-productos/productos";
import { getColores, getTallas, getTelas } from "../../Services/api-productos/atributos";
import { createVariante } from "../../Services/api-productos/variantes";

/* ─────────────────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────────────────── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyHover: "#243050",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const getFechaHoyLocal = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────────────────── */
const TH = {
    background: C.navyGrad, color: "#fff", fontSize: 12, fontWeight: 700,
    padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "left",
};

const Label = ({ children, required }) => (
    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5, display: "block", fontFamily: "'Outfit',sans-serif" }}>
        {children}{required && <span style={{ color: C.danger }}> *</span>}
    </label>
);

const inputStyle = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 9,
    padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
    color: C.text, outline: "none", transition: "border-color 0.2s", background: "#fff",
};

const Input = ({ readOnly, style: sx, ...props }) => (
    <input {...props} readOnly={readOnly}
        style={{ ...inputStyle, ...(readOnly ? { background: "#f8fafc", color: C.muted, cursor: "default" } : {}), ...sx }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = C.accent; }}
        onBlur={e => { e.target.style.borderColor = C.border; }}
    />
);

const Select = ({ children, ...props }) => (
    <select {...props} style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}>
        {children}
    </select>
);

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        warning: { bg: C.warningSoft, color: C.warning, border: "#fde68a" },
        danger: { bg: C.dangerSoft, color: C.danger, border: "#fecaca" },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        navy: { bg: C.navy, color: "#fff", border: C.navy },
        info: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
        muted: { bg: "#f1f5f9", color: C.muted, border: C.border },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {children}
        </span>
    );
};

const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 18, borderRadius: 4, background: C.navy }} />
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>{children}</h5>
        </div>
        {sub && <p style={{ margin: "4px 0 0 14px", fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
);

const Card = ({ children, style }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "22px 26px", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #f1f5f9", marginBottom: 20, ...style }}>
        {children}
    </div>
);

const Btn = ({ variant = "primary", children, style: sx, ...props }) => {
    const variants = {
        primary: { background: C.navy, color: "#fff", border: "none" },
        secondary: { background: "#f1f5f9", color: C.muted, border: "none" },
        success: { background: C.success, color: "#fff", border: "none" },
        danger: { background: C.danger, color: "#fff", border: "none" },
        outline: { background: "transparent", color: C.navy, border: `1.5px solid ${C.navy}` },
        "outline-danger": { background: "transparent", color: C.danger, border: `1.5px solid ${C.danger}` },
        "outline-accent": { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}` },
    };
    const v = variants[variant] || variants.primary;
    return (
        <button {...props} style={{
            ...v, borderRadius: 9, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            cursor: props.disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif",
            display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.18s",
            opacity: props.disabled ? 0.55 : 1, ...sx,
        }}
            onMouseEnter={e => { if (!props.disabled) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = props.disabled ? "0.55" : "1"; }}
        >{children}</button>
    );
};

/* ─────────────────────────────────────────────────────────
   MODAL GENÉRICO
───────────────────────────────────────────────────────── */
const Modal = ({ show, onHide, title, children, footer, size = "lg" }) => {
    if (!show) return null;
    const maxW = { sm: 480, md: 640, lg: 820, xl: 1020 }[size] || 820;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onHide}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: maxW, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.22s ease" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ background: C.navyGrad, padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>{title}</span>
                    <button onClick={onHide} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                </div>
                <div style={{ overflowY: "auto", padding: "22px 24px", flex: 1 }}>{children}</div>
                {footer && <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>{footer}</div>}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   MODAL: TABLA BÚSQUEDA INSUMOS / PRODUCTOS
───────────────────────────────────────────────────────── */
const SearchModal = ({ show, onHide, title, icon, searchValue, onSearch, placeholder, columns, rows, emptyMsg }) => (
    <Modal show={show} onHide={onHide} title={<>{icon}{title}</>} size="lg"
        footer={<Btn variant="secondary" onClick={onHide}>Cerrar</Btn>}>
        <div style={{ position: "relative", marginBottom: 18 }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
            <input value={searchValue} onChange={e => onSearch(e.target.value)} placeholder={placeholder} autoFocus
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <div style={{ overflowY: "auto", maxHeight: 380, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr>{columns.map((c, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px" }}>{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0
                        ? <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 36, color: C.muted }}>{emptyMsg}</td></tr>
                        : rows}
                </tbody>
            </table>
        </div>
    </Modal>
);

const TR = ({ children, idx }) => (
    <tr style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : C.accentSoft}>
        {children}
    </tr>
);

const TD = ({ children, center, muted }) => (
    <td style={{ padding: "11px 14px", color: muted ? C.muted : C.text, textAlign: center ? "center" : "left", fontSize: 13 }}>
        {children}
    </td>
);

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
const NuevaCompra = ({ onClose, onSave, compra = null }) => {

    const [formData, setFormData] = useState({ proveedorRefId: "", fechaCompra: getFechaHoyLocal() });
    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [tipoSeleccion, setTipo] = useState(null);

    // Insumo temp
    const [insumoSel, setInsumoSel] = useState(null);
    const [cantInsumo, setCantInsumo] = useState(1);
    const [precioInsumo, setPrecioIns] = useState("");

    // Producto temp
    const [prodSel, setProdSel] = useState(null);
    const [varConfig, setVarConfig] = useState({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });

    // Modales
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalProducto, setModalProducto] = useState(false);
    const [modalVerVar, setModalVerVar] = useState(false);
    const [modalNuevaVar, setModalNuevaVar] = useState(false);

    const [busqInsumo, setBusqInsumo] = useState("");
    const [busqProd, setBusqProd] = useState("");
    const [variantesModal, setVarModal] = useState([]);
    const [loadingVar, setLoadingVar] = useState(false);
    const [nuevaVarForm, setNuevaVarF] = useState({ ColorID: "", TallaID: "", TelaID: "", Stock: 0 });
    const [creandoVar, setCreandoVar] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    /* ── Cargar datos ── */
    useEffect(() => {
        cargarDatos();
        if (compra) cargarCompraExistente(compra);
    }, [compra]);

    const cargarDatos = async () => {
        try {
            const [pR, iR, prR, cR, tR, teR] = await Promise.all([
                getProveedores(), getInsumos(), getProductos(), getColores(), getTallas(), getTelas()
            ]);
            setProveedores((pR || []).filter(p => p.Estado === true || p.Estado === 1));
            setInsumos((iR || []).filter(i => (i.Estado === true || i.Estado === 1) && (!i.Tipo || i.Tipo.toLowerCase() !== "tela")));
            setProductos(prR?.datos || prR || []);
            setColores(cR?.datos || cR || []);
            setTallas(tR?.datos || tR || []);
            setTelas(teR || []);
        } catch { Swal.fire("Error", "No se pudieron cargar los datos", "error"); }
    };

    const cargarCompraExistente = (c) => {
        setFormData({ proveedorRefId: c.ProveedorRefId?.toString() || "", fechaCompra: c.FechaCompra ? c.FechaCompra.split("T")[0] : getFechaHoyLocal() });
        if (c.detalles?.length > 0) {
            setDetalles(c.detalles.map(d => {
                if (d.TipoSeleccion === "producto" || d.ProductoID) {
                    const v = d.variante;
                    return {
                        TipoSeleccion: "producto",
                        ProductoID: d.ProductoID,
                        NombreProducto: d.producto?.Nombre || "N/A",
                        ColorID: v?.ColorID, TallaID: v?.TallaID, TelaID: v?.TelaID || null,
                        InventarioID: d.InventarioID,
                        NombreColor: v?.color?.Nombre || "N/A",
                        NombreTalla: v?.talla?.Nombre || "N/A",
                        NombreTela: v?.tela?.Nombre || "Sin tela",
                        PrecioBase: d.producto?.PrecioBase || 0,
                        PrecioTalla: v?.talla?.Precio || 0,
                        PrecioTela: v?.tela?.PrecioTela || 0,
                        PrecioVenta: parseFloat(d.PrecioVenta) || 0,
                        PrecioUnitario: parseFloat(d.PrecioUnitario) || 0,
                        Cantidad: d.Cantidad
                    };
                } else {
                    return {
                        TipoSeleccion: "insumo",
                        InsumoID: d.InsumoID,
                        NombreInsumo: d.insumo?.Nombre || "N/A",
                        TipoInsumo: d.insumo?.Tipo || "N/A",
                        StockActual: d.insumo?.Stock || 0,
                        PrecioUnitario: parseFloat(d.PrecioUnitario) || 0,
                        PrecioVenta: parseFloat(d.PrecioVenta) || 0,
                        Cantidad: d.Cantidad
                    };
                }
            }));
        }
    };

    /* ── Insumo ── */
    const handleSelInsumo = (ins) => { setInsumoSel(ins); setCantInsumo(1); setPrecioIns(""); setModalInsumo(false); setTipo("insumo"); };

    const handleAgregarInsumo = () => {
        if (!insumoSel) return Swal.fire("Atención", "Seleccione un insumo", "warning");
        if (!cantInsumo || cantInsumo <= 0) return Swal.fire("Atención", "La cantidad debe ser mayor a 0", "warning");
        if (!precioInsumo || parseFloat(precioInsumo) <= 0) return Swal.fire("Atención", "El precio de compra debe ser mayor a 0", "warning");
        if (detalles.find(d => d.TipoSeleccion === "insumo" && d.InsumoID === insumoSel.InsumoID)) return Swal.fire("Atención", "Este insumo ya fue agregado", "warning");
        setDetalles(p => [...p, {
            TipoSeleccion: "insumo",
            InsumoID: insumoSel.InsumoID,
            NombreInsumo: insumoSel.Nombre,
            TipoInsumo: insumoSel.Tipo,
            StockActual: insumoSel.Stock,
            PrecioUnitario: parseFloat(precioInsumo) || 0,
            PrecioVenta: 0,
            Cantidad: cantInsumo
        }]);
        setInsumoSel(null); setCantInsumo(1); setPrecioIns(""); setTipo(null);
    };

    /* ── Producto ── */
    const calcPrecioVenta = (prod, tallaId, telaId) => {
        const base = parseFloat(prod?.PrecioBase || prodSel?.PrecioBase || 0);
        const pT = parseFloat(tallas.find(t => t.TallaID === parseInt(tallaId))?.Precio || 0);
        const pTe = parseFloat(telas.find(t => t.InsumoID === parseInt(telaId))?.PrecioTela || 0);
        return base + pT + pTe;
    };

    const handleSelProducto = (prod) => {
        setProdSel(prod);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setModalProducto(false);
        setTipo("producto");
    };

    const handleAgregarProducto = () => {
        const { ColorID, TallaID, TelaID, Cantidad, PrecioUnitario } = varConfig;
        if (!prodSel) return Swal.fire("Atención", "Seleccione un producto", "warning");
        if (!ColorID || !TallaID) return Swal.fire("Atención", "Color y talla son obligatorios", "warning");
        if (!Cantidad || Cantidad <= 0) return Swal.fire("Atención", "La cantidad debe ser mayor a 0", "warning");
        if (!PrecioUnitario || parseFloat(PrecioUnitario) <= 0) return Swal.fire("Atención", "El precio de compra debe ser mayor a 0", "warning");
        if (detalles.find(d => d.TipoSeleccion === "producto" && d.ProductoID === prodSel.ProductoID && d.ColorID === parseInt(ColorID) && d.TallaID === parseInt(TallaID) && d.TelaID === (TelaID ? parseInt(TelaID) : null)))
            return Swal.fire("Atención", "Ya existe este producto con esa variante", "warning");

        const color = colores.find(c => c.ColorID === parseInt(ColorID));
        const talla = tallas.find(t => t.TallaID === parseInt(TallaID));
        const tela = telas.find(t => t.InsumoID === parseInt(TelaID));
        const precioVenta = calcPrecioVenta(prodSel, TallaID, TelaID);

        setDetalles(p => [...p, {
            TipoSeleccion: "producto",
            ProductoID: prodSel.ProductoID,
            NombreProducto: prodSel.Nombre,
            ColorID: parseInt(ColorID),
            TallaID: parseInt(TallaID),
            TelaID: TelaID ? parseInt(TelaID) : null,
            NombreColor: color?.Nombre || "",
            NombreTalla: talla?.Nombre || "",
            NombreTela: tela?.Nombre || "Sin tela",
            PrecioBase: parseFloat(prodSel.PrecioBase || 0),
            PrecioTalla: parseFloat(talla?.Precio || 0),
            PrecioTela: parseFloat(tela?.PrecioTela || 0),
            PrecioVenta: precioVenta,
            PrecioUnitario: parseFloat(PrecioUnitario) || 0,
            Cantidad: parseInt(Cantidad)
        }]);
        setProdSel(null);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setTipo(null);
    };

    /* ── Ver variantes ── */
    const handleVerVariantes = async (prod) => {
        setProdSel(prod); setLoadingVar(true); setModalVerVar(true);
        try { const r = await getVariantesByProductoEnCompra(prod.ProductoID); setVarModal(r.variantes || []); }
        catch { Swal.fire("Error", "No se pudieron cargar las variantes", "error"); }
        finally { setLoadingVar(false); }
    };

    /* ── Crear variante ── */
    const handleAbrirNuevaVar = (prod) => { setProdSel(prod); setNuevaVarF({ ColorID: "", TallaID: "", TelaID: "", Stock: 0 }); setModalNuevaVar(true); };

    const handleGuardarNuevaVar = async () => {
        const { ColorID, TallaID, TelaID, Stock } = nuevaVarForm;
        if (!ColorID || !TallaID) return Swal.fire("Atención", "Color y talla son obligatorios", "warning");
        setCreandoVar(true);
        try {
            await createVariante({ ProductoID: prodSel.ProductoID, ColorID, TallaID, TelaID: TelaID || null, Stock: parseInt(Stock) || 0, Estado: 1 });
            Swal.fire({ icon: "success", title: "Variante creada", timer: 1500, showConfirmButton: false });
            setModalNuevaVar(false);
            if (modalVerVar) { const r = await getVariantesByProductoEnCompra(prodSel.ProductoID); setVarModal(r.variantes || []); }
        } catch (e) { Swal.fire("Error", e.message || "No se pudo crear la variante", "error"); }
        finally { setCreandoVar(false); }
    };

    /* ── Detalle edits ── */
    const handleEliminarDetalle = (i) => setDetalles(p => p.filter((_, idx) => idx !== i));
    const handleCambiarCantidad = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, Cantidad: v } : d));
    const handleCambiarPrecio = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, PrecioUnitario: parseFloat(v) || 0 } : d));

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.proveedorRefId) return Swal.fire("Error", "Seleccione un proveedor", "error");
        if (!formData.fechaCompra) return Swal.fire("Error", "Seleccione una fecha", "error");
        if (detalles.length === 0) return Swal.fire("Error", "Agregue al menos un ítem al detalle", "error");
        if (formData.fechaCompra > getFechaHoyLocal()) return Swal.fire("Atención", "La fecha no puede ser posterior a hoy", "warning");
        const sinPrecio = detalles.find(d => !d.PrecioUnitario || parseFloat(d.PrecioUnitario) <= 0);
        if (sinPrecio) return Swal.fire("Atención", `El precio de "${sinPrecio.NombreInsumo || sinPrecio.NombreProducto}" debe ser mayor a 0`, "warning");
        setSubmitting(true);
        try {
            await onSave({
                ProveedorRefId: parseInt(formData.proveedorRefId),
                FechaCompra: formData.fechaCompra,
                detalles: detalles.map(d => d.TipoSeleccion === "insumo"
                    ? { TipoSeleccion: "insumo", InsumoID: d.InsumoID, Cantidad: d.Cantidad, PrecioUnitario: d.PrecioUnitario || 0, PrecioVenta: d.PrecioVenta || 0 }
                    : { TipoSeleccion: "producto", ProductoID: d.ProductoID, ColorID: d.ColorID, TallaID: d.TallaID, TelaID: d.TelaID || null, Cantidad: d.Cantidad, PrecioUnitario: d.PrecioUnitario || 0, PrecioVenta: d.PrecioVenta || 0 }
                )
            });
        } finally { setSubmitting(false); }
    };

    /* ── Filtros ── */
    const insumosFiltrados = insumos.filter(i => i.Nombre.toLowerCase().includes(busqInsumo.toLowerCase()));
    const prodsFiltrados = productos.filter(p => p.Nombre.toLowerCase().includes(busqProd.toLowerCase()));
    const totalCompra = detalles.reduce((s, d) => s + (parseFloat(d.PrecioUnitario || 0) * d.Cantidad), 0);

    /* ═══════════════════════════════════════
       RENDER
    ═══════════════════════════════════════ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .det-row:hover { background: ${C.accentSoft} !important; }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; }}>
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                                {compra ? "Editar Compra" : "Nueva Compra a Proveedor"}
                            </h4>
                            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 13 }}>
                                {detalles.length} ítem{detalles.length !== 1 ? "s" : ""} · Total: <strong style={{ color: C.navy }}>${totalCompra.toLocaleString("es-CO")}</strong>
                            </p>
                        </div>
                    </div>
                    <Btn variant="outline-danger" onClick={onClose}><FaTimes size={13} /> Cerrar</Btn>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ── 1. PROVEEDOR Y FECHA ── */}
                    <Card>
                        <SectionTitle sub="Información general de la compra">Datos de la Compra</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
                            <div>
                                <Label required>Proveedor</Label>
                                <Select name="proveedorRefId" value={formData.proveedorRefId} onChange={e => setFormData(p => ({ ...p, proveedorRefId: e.target.value }))} required>
                                    <option value="">Seleccione un proveedor...</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.Nombre} — {p.Nit}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label required>Fecha</Label>
                                <Input type="date" value={formData.fechaCompra} max={getFechaHoyLocal()} onChange={e => setFormData(p => ({ ...p, fechaCompra: e.target.value }))} required />
                            </div>
                        </div>
                    </Card>

                    {/* ── 2. SELECTOR DE TIPO ── */}
                    <Card>
                        <SectionTitle sub="Elige qué deseas agregar al detalle de esta compra">Agregar al Detalle</SectionTitle>

                        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
                            <button type="button" onClick={() => { setTipo("insumo"); setModalInsumo(true); }}
                                style={{
                                    flex: 1, padding: "14px 20px", borderRadius: 12, border: `2px solid ${tipoSeleccion === "insumo" ? C.accent : C.border}`,
                                    background: tipoSeleccion === "insumo" ? C.accentSoft : "#fff",
                                    color: tipoSeleccion === "insumo" ? C.accent : C.muted,
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                    fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                                }}>
                                <FaBoxOpen size={18} /> Elegir Insumo
                            </button>
                            <button type="button" onClick={() => { setTipo("producto"); setModalProducto(true); }}
                                style={{
                                    flex: 1, padding: "14px 20px", borderRadius: 12, border: `2px solid ${tipoSeleccion === "producto" ? C.success : C.border}`,
                                    background: tipoSeleccion === "producto" ? C.successSoft : "#fff",
                                    color: tipoSeleccion === "producto" ? C.success : C.muted,
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                    fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                                }}>
                                <FaTshirt size={18} /> Elegir Producto
                            </button>
                        </div>

                        {/* ── Panel Insumo seleccionado ── */}
                        {tipoSeleccion === "insumo" && insumoSel && (
                            <div style={{ background: C.accentSoft, borderRadius: 14, border: `1.5px solid ${C.accentBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Badge type="accent"><FaBoxOpen size={10} /> Insumo</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{insumoSel.Nombre}</span>
                                        <Badge type="muted">{insumoSel.Tipo}</Badge>
                                    </div>
                                    <button type="button" onClick={() => { setInsumoSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
                                    <div>
                                        <Label>Nombre</Label>
                                        <Input value={insumoSel.Nombre} readOnly />
                                    </div>
                                    <div>
                                        <Label required>Precio de Compra</Label>
                                        <Input type="number" placeholder="$ 0" min="1" value={precioInsumo} onChange={e => setPrecioIns(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label required>Cantidad</Label>
                                        <Input type="number" min="1" value={cantInsumo || ""} onChange={e => setCantInsumo(Number(e.target.value))} />
                                        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Stock actual: {insumoSel.Stock}</p>
                                    </div>
                                    <Btn variant="success" type="button" onClick={handleAgregarInsumo} style={{ height: 40 }}>
                                        <FaPlus size={13} /> Agregar
                                    </Btn>
                                </div>
                            </div>
                        )}

                        {/* ── Panel Producto seleccionado ── */}
                        {tipoSeleccion === "producto" && prodSel && (
                            <div style={{ background: C.successSoft, borderRadius: 14, border: `1.5px solid ${C.successBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Badge type="success"><FaTshirt size={10} /> Producto</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{prodSel.Nombre}</span>
                                        <Badge type="navy">${parseFloat(prodSel.PrecioBase || 0).toLocaleString()} base</Badge>
                                        {/* <p style={{ margin: "4px 0 0", fontSize: 10, color: C.muted }}>Base + Talla + Tela</p> */}
                                    </div>
                                    <button type="button" onClick={() => { setProdSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1fr 0.8fr 1fr auto", gap: 12, alignItems: "end" }}>
                                    <div>
                                        <Label required>Color</Label>
                                        <Select value={varConfig.ColorID} onChange={e => setVarConfig(p => ({ ...p, ColorID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {colores.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>Talla</Label>
                                        <Select value={varConfig.TallaID} onChange={e => setVarConfig(p => ({ ...p, TallaID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {tallas.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Tela</Label>
                                        <Select value={varConfig.TelaID} onChange={e => setVarConfig(p => ({ ...p, TelaID: e.target.value }))}>
                                            <option value="">Sin tela</option>
                                            {telas.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>Precio Compra</Label>
                                        <Input type="number" placeholder="$ 0" min="0" value={varConfig.PrecioUnitario} onChange={e => setVarConfig(p => ({ ...p, PrecioUnitario: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label>Cant.</Label>
                                        <Input type="number" min="1" value={varConfig.Cantidad} onChange={e => setVarConfig(p => ({ ...p, Cantidad: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label>Precio Venta</Label>
                                        <Input readOnly value={`$${calcPrecioVenta(prodSel, varConfig.TallaID, varConfig.TelaID).toLocaleString("es-CO")}`}
                                            style={{ fontWeight: 700, color: C.success, background: C.successSoft }} />
                                    </div>
                                    <Btn variant="success" type="button" onClick={handleAgregarProducto} style={{ height: 40, flexShrink: 0 }}>
                                        <FaPlus size={13} />
                                    </Btn>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* ── 3. TABLA DE DETALLES ── */}
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <SectionTitle sub={`${detalles.length} ítem${detalles.length !== 1 ? "s" : ""} en el detalle`}>Detalle de la Compra</SectionTitle>
                            {detalles.length > 0 && (
                                <div style={{ background: C.accentSoft, borderRadius: 12, padding: "10px 18px", textAlign: "right" }}>
                                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>TOTAL</p>
                                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.navy }}>${totalCompra.toLocaleString("es-CO")}</p>
                                </div>
                            )}
                        </div>

                        {detalles.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 24px", background: C.accentSoft, borderRadius: 14, border: `1.5px dashed ${C.accentBorder}` }}>
                                <FaBoxOpen size={36} style={{ color: C.muted, opacity: 0.25, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                                <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>No hay ítems. Usa los botones de arriba para agregar insumos o productos.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                        <tr>
                                            {/* Columnas comunes */}
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>#</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Tipo</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Nombre</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Detalle</th>
                                            {/* Desglose precio venta (solo productos) */}
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center", background: "linear-gradient(90deg, #1a3560 0%, #1e4080 100%)" }}>P. Base</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center", background: "linear-gradient(90deg, #1a3560 0%, #1e4080 100%)" }}>+ Talla</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center", background: "linear-gradient(90deg, #1a3560 0%, #1e4080 100%)" }}>+ Tela</th>
                                            {/* Precio compra editable y cantidad */}
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Venta</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Compra</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Cantidad</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Subtotal</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalles.map((d, i) => (
                                            <tr key={i} className="det-row" style={{ background: i % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s" }}>
                                                {/* # */}
                                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12, fontWeight: 600 }}>{i + 1}</td>

                                                {/* Tipo */}
                                                <td style={{ padding: "11px 14px" }}>
                                                    {d.TipoSeleccion === "insumo"
                                                        ? <Badge type="info"><FaBoxOpen size={10} />{d.TipoInsumo || "Insumo"}</Badge>
                                                        : <Badge type="success"><FaTshirt size={10} />Producto</Badge>}
                                                </td>

                                                {/* Nombre */}
                                                <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>
                                                    {d.TipoSeleccion === "insumo" ? d.NombreInsumo : d.NombreProducto}
                                                </td>

                                                {/* Detalle variante */}
                                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>
                                                    {d.TipoSeleccion === "producto"
                                                        ? <span>{d.NombreColor} / {d.NombreTalla}{d.TelaID ? ` / ${d.NombreTela}` : ""}</span>
                                                        : <span>—</span>}
                                                </td>

                                                {/* P. Base */}
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: i % 2 === 0 ? "#f8fbff" : "#eef4ff" }}>
                                                    {d.TipoSeleccion === "producto"
                                                        ? <span style={{ fontWeight: 600, color: C.navy, fontSize: 12 }}>${parseFloat(d.PrecioBase || 0).toLocaleString("es-CO")}</span>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>

                                                {/* + Talla */}
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: i % 2 === 0 ? "#f8fbff" : "#eef4ff" }}>
                                                    {d.TipoSeleccion === "producto"
                                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTalla || 0) > 0 ? C.accent : C.muted, fontSize: 12 }}>
                                                            {parseFloat(d.PrecioTalla || 0) > 0 ? `+$${parseFloat(d.PrecioTalla).toLocaleString("es-CO")}` : "$0"}
                                                        </span>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>

                                                {/* + Tela */}
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: i % 2 === 0 ? "#f8fbff" : "#eef4ff" }}>
                                                    {d.TipoSeleccion === "producto"
                                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTela || 0) > 0 ? C.warning : C.muted, fontSize: 12 }}>
                                                            {parseFloat(d.PrecioTela || 0) > 0 ? `+$${parseFloat(d.PrecioTela).toLocaleString("es-CO")}` : "$0"}
                                                        </span>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>

                                                {/* P. Venta (calculado) */}
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                    {d.TipoSeleccion === "producto"
                                                        ? <Badge type="success">${parseFloat(d.PrecioVenta || 0).toLocaleString("es-CO")}</Badge>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>

                                                {/* P. Compra (editable) */}
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={d.PrecioUnitario ?? ""}
                                                        onChange={e => handleCambiarPrecio(i, e.target.value)}
                                                        style={{ ...inputStyle, width: 110, textAlign: "center", padding: "6px 10px" }}
                                                        onFocus={e => e.target.style.borderColor = C.accent}
                                                        onBlur={e => e.target.style.borderColor = C.border}
                                                    />
                                                </td>

                                                {/* Cantidad (editable) */}
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={d.Cantidad ?? ""}
                                                        onChange={e => handleCambiarCantidad(i, Number(e.target.value))}
                                                        onFocus={e => e.target.style.borderColor = C.accent}
                                                        onBlur={e => {
                                                            e.target.style.borderColor = C.border;
                                                            if (!d.Cantidad || d.Cantidad < 1) handleCambiarCantidad(i, 1);
                                                        }}
                                                        style={{ ...inputStyle, width: 80, textAlign: "center", padding: "6px 10px" }}
                                                    />
                                                </td>

                                                {/* Subtotal */}
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                    <span style={{ fontWeight: 700, color: C.navy }}>
                                                        ${(parseFloat(d.PrecioUnitario || 0) * d.Cantidad).toLocaleString("es-CO")}
                                                    </span>
                                                </td>

                                                {/* Eliminar */}
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <button type="button" onClick={() => handleEliminarDetalle(i)}
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = `${C.danger}22`}
                                                        onMouseLeave={e => e.currentTarget.style.background = `${C.danger}0d`}>
                                                        <FaTrash size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: C.accentSoft, borderTop: `2px solid ${C.border}` }}>
                                            <td colSpan={10} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: C.muted, fontSize: 12 }}>TOTAL DE LA COMPRA:</td>
                                            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 800, color: C.navy, fontSize: 16 }}>
                                                ${totalCompra.toLocaleString("es-CO")}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* ── 4. BOTONES SUBMIT ── */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 14, paddingTop: 8 }}>
                        <Btn variant="secondary" type="button" onClick={onClose} style={{ padding: "11px 28px" }}>
                            Cancelar
                        </Btn>
                        <Btn variant="primary" type="submit" disabled={detalles.length === 0 || !formData.proveedorRefId || submitting} style={{ padding: "11px 32px", boxShadow: `0 4px 14px ${C.navy}44` }}>
                            {submitting
                                ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Guardando...</>
                                : <><FaCheck size={13} /> {compra ? "Guardar Cambios" : "Registrar Compra"}</>}
                        </Btn>
                    </div>
                </form>
            </div>

            {/* ════════════════════════════════════════
          MODAL: Seleccionar Insumo
      ════════════════════════════════════════ */}
            <SearchModal
                show={modalInsumo} onHide={() => setModalInsumo(false)}
                title="Seleccionar Insumo" icon={<FaBoxOpen style={{ marginRight: 8 }} />}
                searchValue={busqInsumo} onSearch={setBusqInsumo} placeholder="Buscar insumo..."
                columns={["Nombre", "Tipo", "Stock", "Precio Tela", ""]}
                emptyMsg="No se encontraron insumos"
                rows={insumosFiltrados.map((ins, i) => (
                    <TR key={ins.InsumoID} idx={i}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{ins.Nombre}</td>
                        <TD><Badge type="muted">{ins.Tipo}</Badge></TD>
                        <TD center><Badge type={ins.Stock > 10 ? "success" : "warning"}>{ins.Stock}</Badge></TD>
                        <TD>{ins.PrecioTela ? `$${parseFloat(ins.PrecioTela).toLocaleString()}` : "—"}</TD>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                            <Btn variant="primary" type="button" onClick={() => handleSelInsumo(ins)} style={{ padding: "6px 14px", fontSize: 12 }}>
                                Seleccionar
                            </Btn>
                        </td>
                    </TR>
                ))}
            />

            {/* ════════════════════════════════════════
          MODAL: Seleccionar Producto
      ════════════════════════════════════════ */}
            <SearchModal
                show={modalProducto} onHide={() => setModalProducto(false)}
                title="Seleccionar Producto" icon={<FaTshirt style={{ marginRight: 8 }} />}
                searchValue={busqProd} onSearch={setBusqProd} placeholder="Buscar producto..."
                columns={["Nombre", "Descripción", "Precio Base", "Acciones"]}
                emptyMsg="No se encontraron productos"
                rows={prodsFiltrados.map((prod, i) => (
                    <TR key={prod.ProductoID} idx={i}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{prod.Nombre}</td>
                        <TD muted>{prod.Descripcion || "—"}</TD>
                        <TD><Badge type="navy">${parseFloat(prod.PrecioBase || 0).toLocaleString()}</Badge></TD>
                        <td style={{ padding: "8px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                                <Btn variant="success" type="button" onClick={() => handleSelProducto(prod)} style={{ padding: "6px 14px", fontSize: 12 }}>
                                    Seleccionar
                                </Btn>
                                <button type="button" title="Ver variantes"
                                    onClick={() => { setModalProducto(false); handleVerVariantes(prod); }}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.accent}30`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    onMouseEnter={e => e.currentTarget.style.background = `${C.accent}22`}
                                    onMouseLeave={e => e.currentTarget.style.background = `${C.accent}0d`}>
                                    <FaEye size={13} />
                                </button>
                            </div>
                        </td>
                    </TR>
                ))}
            />

            {/* ════════════════════════════════════════
          MODAL: Ver Variantes
      ════════════════════════════════════════ */}
            <Modal show={modalVerVar} onHide={() => setModalVerVar(false)} size="lg"
                title={<><FaEye style={{ marginRight: 8 }} />Variantes — {prodSel?.Nombre}</>}
                footer={<Btn variant="secondary" onClick={() => setModalVerVar(false)}>Cerrar</Btn>}>
                {loadingVar ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                        <p style={{ color: C.muted, fontSize: 13 }}>Cargando variantes...</p>
                    </div>
                ) : variantesModal.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px", background: C.accentSoft, borderRadius: 14 }}>
                        <p style={{ color: C.muted, marginBottom: 14 }}>Este producto no tiene variantes registradas.</p>
                        <Btn variant="primary" type="button" onClick={() => { setModalVerVar(false); handleAbrirNuevaVar(prodSel); }}>
                            <FaPlus size={12} /> Crear primera variante
                        </Btn>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>{["Color", "Talla", "Tela", "Stock", "Estado"].map((h, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px" }}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {variantesModal.map((v, i) => (
                                    <TR key={v.InventarioID} idx={i}>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{v.color?.Nombre || "—"}</td>
                                        <TD>{v.talla?.Nombre || "—"}</TD>
                                        <TD><Badge type={v.tela ? "accent" : "muted"}>{v.tela?.Nombre || "Sin tela"}</Badge></TD>
                                        <TD center><Badge type={v.Stock > 10 ? "success" : v.Stock > 0 ? "warning" : "danger"}>{v.Stock}</Badge></TD>
                                        <TD center><Badge type={v.Estado ? "success" : "muted"}>{v.Estado ? "Activa" : "Inactiva"}</Badge></TD>
                                    </TR>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>

            {/* ════════════════════════════════════════
          MODAL: Crear Nueva Variante
      ════════════════════════════════════════ */}
            <Modal show={modalNuevaVar} onHide={() => setModalNuevaVar(false)} size="sm"
                title={<><FaPlus style={{ marginRight: 8 }} />Nueva Variante — {prodSel?.Nombre}</>}
                footer={
                    <>
                        <Btn variant="secondary" onClick={() => setModalNuevaVar(false)}>Cancelar</Btn>
                        <Btn variant="success" type="button" onClick={handleGuardarNuevaVar} disabled={creandoVar}>
                            {creandoVar
                                ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creando...</>
                                : <><FaPlus size={12} /> Crear Variante</>}
                        </Btn>
                    </>
                }>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                        { label: "Color", key: "ColorID", required: true, items: colores, valKey: "ColorID", labKey: "Nombre" },
                        { label: "Talla", key: "TallaID", required: true, items: tallas, valKey: "TallaID", labKey: "Nombre" },
                        { label: "Tela", key: "TelaID", required: false, items: telas, valKey: "InsumoID", labKey: "Nombre", extra: t => ` ($${parseFloat(t.PrecioTela || 0).toLocaleString()})` },
                    ].map(({ label, key, required, items, valKey, labKey, extra }) => (
                        <div key={key}>
                            <Label required={required}>{label}</Label>
                            <Select value={nuevaVarForm[key]} onChange={e => setNuevaVarF(p => ({ ...p, [key]: e.target.value }))}>
                                <option value="">{required ? "Seleccionar..." : "Sin tela"}</option>
                                {items.map(item => <option key={item[valKey]} value={item[valKey]}>{item[labKey]}{extra ? extra(item) : ""}</option>)}
                            </Select>
                        </div>
                    ))}
                    <div>
                        <Label>Stock inicial</Label>
                        <Input type="number" min="0" value={nuevaVarForm.Stock} onChange={e => setNuevaVarF(p => ({ ...p, Stock: e.target.value }))} />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default NuevaCompra;