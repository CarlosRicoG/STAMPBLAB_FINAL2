import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaSearch, FaBoxOpen, FaTshirt, FaEye, FaArrowLeft, FaCheck, FaReceipt, FaCheckCircle, FaRegCircle, FaExclamationTriangle } from "react-icons/fa";
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
    violet: "#7c3aed",
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

const STOCK_BAJO = 10;
const money = (n) => `$${(Number(n) || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;
const esActivo = (e) => e === true || e === 1 || e === "1";

const getFechaHoyLocal = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

// Fecha local YYYY-MM-DD a partir del valor que devuelve la API (evita corrimientos por zona horaria)
const fechaLocalDe = (valor) => {
    if (!valor) return getFechaHoyLocal();
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor).split("T")[0];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes cpPop { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
@keyframes cpFade { from{opacity:0} to{opacity:1} }
@keyframes spin   { to{transform:rotate(360deg)} }
.cp-form { animation: fadeIn .35s ease both; }
.cp-layout { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:20px; align-items:start; }
.cp-sticky { position:sticky; top:18px; }
.det-row { transition: background .15s, box-shadow .15s; animation: fadeIn .25s ease both; }
.det-row:hover { background: #eef4ff !important; box-shadow: inset 3px 0 0 #4f8ef7; }
.cp-table thead tr { background: linear-gradient(90deg,#1a2540 0%,#2d3f6e 100%); }
.cp-table th { background: transparent !important; text-transform: uppercase; letter-spacing: .06em; }
.cp-pick { flex:1; padding:16px 20px; border-radius:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:'Outfit',sans-serif; font-weight:700; font-size:14px; transition:all .2s; }
.cp-pick:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15,23,42,.08); }
.cp-ticket { background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(26,37,64,.10), 0 0 0 1px #eef2f7; overflow:hidden; font-family:'Outfit',sans-serif; animation: fadeIn .4s ease both; }
.cp-ticket-head { background: radial-gradient(120% 160% at 100% 0%, rgba(124,58,237,.45) 0%, rgba(124,58,237,0) 55%), linear-gradient(120deg,#1a2540 0%,#2d3f6e 100%); color:#fff; padding:18px 20px; }
.cp-perf { height:14px; background: radial-gradient(circle at 7px 0, #f8fafc 6px, transparent 6.5px) repeat-x; background-size: 14px 14px; margin-top:-7px; }
.cp-tline { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; padding:6px 0; color:#475569; }
.cp-tline span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cp-check { display:flex; align-items:center; gap:8px; font-size:12px; padding:3px 0; }
.cp-err { margin:5px 0 0; font-size:11.5px; color:#dc2626; font-weight:600; display:flex; align-items:center; gap:5px; animation: fadeIn .2s ease both; }
.cp-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation: cpFade .2s ease both; }
.cp-modal { animation: cpPop .26s cubic-bezier(.2,.8,.2,1) both; box-shadow: 0 30px 80px rgba(15,23,42,.35); }
@media (max-width: 1180px) {
  .cp-layout { grid-template-columns: 1fr; }
  .cp-sticky { position: static; }
}
@media (max-width: 760px) {
  .cp-grid-resp { grid-template-columns: 1fr 1fr !important; }
  .cp-grid-resp > button { grid-column: 1 / -1; }
  .cp-grid-2 { grid-template-columns: 1fr !important; }
  .cp-picks { flex-direction: column; }
  .cp-form-head { flex-wrap: wrap; gap: 12px; }
}
`;

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────────────────── */
const TH = {
    color: "#fff", fontSize: 12, fontWeight: 700,
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
    color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow .2s", background: "#fff",
};
const invalidStyle = { borderColor: C.danger, background: C.dangerSoft };

const Input = ({ readOnly, invalid, style: sx, ...props }) => (
    <input {...props} readOnly={readOnly}
        style={{ ...inputStyle, ...(readOnly ? { background: "#f8fafc", color: C.muted, cursor: "default" } : {}), ...(invalid ? invalidStyle : {}), ...sx }}
        onFocus={e => { if (!readOnly) { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 4px rgba(79,142,247,.12)"; } }}
        onBlur={e => { e.target.style.borderColor = invalid ? C.danger : C.border; e.target.style.boxShadow = "none"; }}
    />
);

const Select = ({ children, invalid, ...props }) => (
    <select {...props} style={{ ...inputStyle, cursor: "pointer", appearance: "auto", ...(invalid ? invalidStyle : {}) }}>
        {children}
    </select>
);

const FieldError = ({ msg }) => msg ? <p className="cp-err"><FaExclamationTriangle size={10} /> {msg}</p> : null;

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        warning: { bg: C.warningSoft, color: C.warning, border: "#fde68a" },
        danger: { bg: C.dangerSoft, color: C.danger, border: "#fecaca" },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        violet: { bg: "#f5f3ff", color: C.violet, border: "#ddd6fe" },
        navy: { bg: C.navy, color: "#fff", border: C.navy },
        info: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
        muted: { bg: "#f1f5f9", color: C.muted, border: C.border },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            {children}
        </span>
    );
};

const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 18, borderRadius: 4, background: `linear-gradient(180deg, ${C.accent}, ${C.violet})` }} />
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
        <button type="button" {...props} style={{
            ...v, borderRadius: 9, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            cursor: props.disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.18s",
            opacity: props.disabled ? 0.55 : 1, ...sx,
        }}
            onMouseEnter={e => { if (!props.disabled) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = props.disabled ? "0.55" : "1"; e.currentTarget.style.transform = "none"; }}
        >{children}</button>
    );
};

const StockBadge = ({ stock }) => {
    const n = Number(stock) || 0;
    return <Badge type={n === 0 ? "danger" : n <= STOCK_BAJO ? "warning" : "success"}>{n}{n > 0 && n <= STOCK_BAJO ? " · bajo" : ""}</Badge>;
};

/* ─────────────────────────────────────────────────────────
   MODAL GENÉRICO
───────────────────────────────────────────────────────── */
const Modal = ({ show, onHide, title, children, footer, size = "lg" }) => {
    useEffect(() => {
        if (!show) return;
        const onKey = e => { if (e.key === "Escape") onHide(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [show, onHide]);
    if (!show) return null;
    const maxW = { sm: 480, md: 640, lg: 820, xl: 1020 }[size] || 820;
    return (
        <div className="cp-overlay" onClick={onHide}>
            <div className="cp-modal" role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: maxW, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ background: "radial-gradient(120% 160% at 100% 0%, rgba(124,58,237,.4) 0%, rgba(124,58,237,0) 55%), linear-gradient(120deg,#1a2540 0%,#2d3f6e 100%)", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>{title}</span>
                    <button type="button" onClick={onHide} aria-label="Cerrar" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
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
            <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr>{columns.map((c, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px", position: "sticky", top: 0, background: C.navy }}>{c}</th>)}</tr>
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
    <tr className="det-row" style={{ background: idx % 2 === 0 ? "#fff" : "#fafbff" }}>
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
    const [cargando, setCargando] = useState(true);
    const [intentoEnvio, setIntentoEnvio] = useState(false);

    // Insumo temp
    const [insumoSel, setInsumoSel] = useState(null);
    const [cantInsumo, setCantInsumo] = useState(1);
    const [precioInsumo, setPrecioIns] = useState("");
    const [intentoInsumo, setIntentoInsumo] = useState(false);

    // Producto temp
    const [prodSel, setProdSel] = useState(null);
    const [varConfig, setVarConfig] = useState({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
    const [variantesProd, setVariantesProd] = useState([]);
    const [intentoProd, setIntentoProd] = useState(false);

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
            setCargando(true);
            const [pR, iR, prR, cR, tR, teR] = await Promise.all([
                getProveedores(), getInsumos(), getProductos(), getColores(), getTallas(), getTelas()
            ]);
            // Activos + el proveedor actual de la compra (aunque esté inactivo) para poder editarla
            setProveedores((pR || []).filter(p => esActivo(p.Estado) || (compra && p.id === compra.ProveedorRefId)));
            // Todos los insumos activos (incluidas las telas, que también se compran por stock)
            setInsumos((iR || []).filter(i => esActivo(i.Estado)));
            setProductos(prR?.datos || prR || []);
            setColores(cR?.datos || cR || []);
            setTallas(tR?.datos || tR || []);
            setTelas(teR || []);
        } catch { Swal.fire("Error", "No se pudieron cargar los datos", "error"); }
        finally { setCargando(false); }
    };

    const cargarCompraExistente = (c) => {
        setFormData({ proveedorRefId: c.ProveedorRefId?.toString() || "", fechaCompra: fechaLocalDe(c.FechaCompra) });
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
    const handleSelInsumo = (ins) => { setInsumoSel(ins); setCantInsumo(1); setPrecioIns(""); setIntentoInsumo(false); setModalInsumo(false); setProdSel(null); setTipo("insumo"); };

    const errPrecioIns = !precioInsumo || !(parseFloat(precioInsumo) > 0) ? "El precio debe ser mayor a 0" : "";
    const errCantIns = !Number.isInteger(cantInsumo) || cantInsumo < 1 ? "La cantidad debe ser un entero mayor o igual a 1" : "";

    const handleAgregarInsumo = () => {
        setIntentoInsumo(true);
        if (!insumoSel) return Swal.fire("Atención", "Seleccione un insumo", "warning");
        if (errPrecioIns || errCantIns) return Swal.fire("Datos inválidos", [errPrecioIns, errCantIns].filter(Boolean).join(". "), "warning");
        if (detalles.find(d => d.TipoSeleccion === "insumo" && d.InsumoID === insumoSel.InsumoID)) return Swal.fire("Atención", "Este insumo ya fue agregado. Puede editar su cantidad en el detalle.", "warning");
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
        setInsumoSel(null); setCantInsumo(1); setPrecioIns(""); setTipo(null); setIntentoInsumo(false);
    };

    /* ── Producto ── */
    const calcPrecioVenta = (prod, tallaId, telaId) => {
        const base = parseFloat(prod?.PrecioBase || prodSel?.PrecioBase || 0);
        const pT = parseFloat(tallas.find(t => t.TallaID === parseInt(tallaId))?.Precio || 0);
        const pTe = parseFloat(telas.find(t => t.InsumoID === parseInt(telaId))?.PrecioTela || 0);
        return base + pT + pTe;
    };

    const cargarVariantesProd = async (prod) => {
        setVariantesProd([]);
        try { const r = await getVariantesByProductoEnCompra(prod.ProductoID); setVariantesProd(r.variantes || []); }
        catch { setVariantesProd([]); }
    };

    const handleSelProducto = (prod) => {
        setProdSel(prod);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setIntentoProd(false);
        setModalProducto(false);
        setInsumoSel(null);
        setTipo("producto");
        cargarVariantesProd(prod);
    };

    const cantProd = Number(varConfig.Cantidad);
    const errProd = {
        ColorID: !varConfig.ColorID ? "Requerido" : "",
        TallaID: !varConfig.TallaID ? "Requerido" : "",
        PrecioUnitario: !varConfig.PrecioUnitario || !(parseFloat(varConfig.PrecioUnitario) > 0) ? "El precio debe ser mayor a 0" : "",
        Cantidad: varConfig.Cantidad === "" || !Number.isInteger(cantProd) || cantProd < 1 ? "Debe ser un entero mayor o igual a 1" : "",
    };
    const varianteExistente = prodSel && varConfig.ColorID && varConfig.TallaID
        ? variantesProd.find(v => v.ColorID === parseInt(varConfig.ColorID) && v.TallaID === parseInt(varConfig.TallaID) && (v.TelaID || null) === (varConfig.TelaID ? parseInt(varConfig.TelaID) : null))
        : null;

    const handleAgregarProducto = () => {
        const { ColorID, TallaID, TelaID, PrecioUnitario } = varConfig;
        setIntentoProd(true);
        if (!prodSel) return Swal.fire("Atención", "Seleccione un producto", "warning");
        if (Object.values(errProd).some(Boolean)) return Swal.fire("Datos inválidos", Object.entries(errProd).filter(([, m]) => m).map(([k, m]) => `${{ ColorID: "Color", TallaID: "Talla", PrecioUnitario: "Precio", Cantidad: "Cantidad" }[k]}: ${m}`).join(". "), "warning");
        if (detalles.find(d => d.TipoSeleccion === "producto" && d.ProductoID === prodSel.ProductoID && d.ColorID === parseInt(ColorID) && d.TallaID === parseInt(TallaID) && (d.TelaID || null) === (TelaID ? parseInt(TelaID) : null)))
            return Swal.fire("Atención", "Ya existe este producto con esa variante. Puede editar su cantidad en el detalle.", "warning");

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
            Cantidad: cantProd
        }]);
        setProdSel(null);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setTipo(null); setIntentoProd(false);
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
        } catch (e) { Swal.fire("Error", e.response?.data?.mensaje || e.response?.data?.message || e.message || "No se pudo crear la variante", "error"); }
        finally { setCreandoVar(false); }
    };

    /* ── Detalle edits ── */
    const handleEliminarDetalle = (i) => setDetalles(p => p.filter((_, idx) => idx !== i));
    const handleCambiarCantidad = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, Cantidad: v } : d));
    // Se guarda el texto tal cual para permitir escribir decimales/borrar; se convierte al enviar
    const handleCambiarPrecio = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, PrecioUnitario: v } : d));

    /* ── Validación global ── */
    const fechaFutura = formData.fechaCompra && formData.fechaCompra > getFechaHoyLocal();
    const detallesInvalidos = detalles.filter(d => !(parseFloat(d.PrecioUnitario) > 0) || !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0));
    const checks = [
        { ok: !!formData.proveedorRefId, label: "Proveedor seleccionado" },
        { ok: !!formData.fechaCompra && !fechaFutura, label: fechaFutura ? "La fecha no puede ser futura" : "Fecha válida" },
        { ok: detalles.length > 0, label: "Al menos un ítem en el detalle" },
        { ok: detalles.length > 0 && detallesInvalidos.length === 0, label: "Precios y cantidades mayores a 0" },
    ];
    const puedeGuardar = checks.every(c => c.ok);

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIntentoEnvio(true);
        if (!formData.proveedorRefId) return Swal.fire("Error", "Seleccione un proveedor", "error");
        if (!formData.fechaCompra) return Swal.fire("Error", "Seleccione una fecha", "error");
        if (detalles.length === 0) return Swal.fire("Error", "Agregue al menos un ítem al detalle", "error");
        if (fechaFutura) return Swal.fire("Atención", "La fecha no puede ser posterior a hoy", "warning");
        const sinPrecio = detalles.find(d => !d.PrecioUnitario || parseFloat(d.PrecioUnitario) <= 0);
        if (sinPrecio) return Swal.fire("Atención", `El precio de "${sinPrecio.NombreInsumo || sinPrecio.NombreProducto}" debe ser mayor a 0`, "warning");
        const malaCant = detalles.find(d => !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0));
        if (malaCant) return Swal.fire("Atención", `La cantidad de "${malaCant.NombreInsumo || malaCant.NombreProducto}" debe ser un entero mayor a 0`, "warning");
        setSubmitting(true);
        try {
            await onSave({
                ProveedorRefId: parseInt(formData.proveedorRefId),
                FechaCompra: formData.fechaCompra,
                detalles: detalles.map(d => d.TipoSeleccion === "insumo"
                    ? { TipoSeleccion: "insumo", InsumoID: d.InsumoID, Cantidad: Number(d.Cantidad), PrecioUnitario: parseFloat(d.PrecioUnitario) || 0, PrecioVenta: d.PrecioVenta || 0 }
                    : { TipoSeleccion: "producto", ProductoID: d.ProductoID, ColorID: d.ColorID, TallaID: d.TallaID, TelaID: d.TelaID || null, Cantidad: Number(d.Cantidad), PrecioUnitario: parseFloat(d.PrecioUnitario) || 0, PrecioVenta: d.PrecioVenta || 0 }
                )
            });
        } finally { setSubmitting(false); }
    };

    /* ── Filtros ── */
    const norm = s => (s || "").toString().toLowerCase();
    const insumosFiltrados = insumos.filter(i => norm(i.Nombre).includes(norm(busqInsumo)) || norm(i.Tipo).includes(norm(busqInsumo)));
    const prodsFiltrados = productos.filter(p => norm(p.Nombre).includes(norm(busqProd)));
    const subtotal = d => (parseFloat(d.PrecioUnitario) || 0) * (Number(d.Cantidad) || 0);
    const totalCompra = detalles.reduce((s, d) => s + subtotal(d), 0);
    const totalUnidades = detalles.reduce((s, d) => s + (Number(d.Cantidad) || 0), 0);
    const proveedorActual = proveedores.find(p => String(p.id) === String(formData.proveedorRefId));

    /* ═══════════════════════════════════════
       RENDER
    ═══════════════════════════════════════ */
    return (
        <>
            <style>{CSS}</style>

            <div className="cp-form" style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div className="cp-form-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button type="button" onClick={onClose} aria-label="Volver" style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; }}>
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                                {compra ? "Editar Compra" : "Nueva Compra a Proveedor"}
                            </h4>
                            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 13 }}>
                                {detalles.length} ítem{detalles.length !== 1 ? "s" : ""} · Total: <strong style={{ color: C.navy }}>{money(totalCompra)}</strong>
                            </p>
                        </div>
                    </div>
                    <Btn variant="outline-danger" onClick={onClose}><FaTimes size={13} /> Cerrar</Btn>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="cp-layout">
                    <div style={{ minWidth: 0 }}>

                    {/* ── 1. PROVEEDOR Y FECHA ── */}
                    <Card>
                        <SectionTitle sub="Información general de la compra">Datos de la Compra</SectionTitle>
                        <div className="cp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
                            <div>
                                <Label required>Proveedor</Label>
                                <Select name="proveedorRefId" value={formData.proveedorRefId} invalid={intentoEnvio && !formData.proveedorRefId}
                                    onChange={e => setFormData(p => ({ ...p, proveedorRefId: e.target.value }))} required>
                                    <option value="">{cargando ? "Cargando proveedores..." : "Seleccione un proveedor..."}</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.Nombre} — {p.Nit}{!esActivo(p.Estado) ? " (inactivo)" : ""}</option>)}
                                </Select>
                                <FieldError msg={intentoEnvio && !formData.proveedorRefId ? "Seleccione el proveedor de la compra" : ""} />
                                {!cargando && proveedores.length === 0 && <p className="cp-err">No hay proveedores activos. Cree o active uno en el módulo de Proveedores.</p>}
                            </div>
                            <div>
                                <Label required>Fecha</Label>
                                <Input type="date" value={formData.fechaCompra} max={getFechaHoyLocal()} invalid={(intentoEnvio && !formData.fechaCompra) || fechaFutura}
                                    onChange={e => setFormData(p => ({ ...p, fechaCompra: e.target.value }))} required />
                                <FieldError msg={fechaFutura ? "No puede ser posterior a hoy" : intentoEnvio && !formData.fechaCompra ? "Seleccione una fecha" : ""} />
                            </div>
                        </div>
                    </Card>

                    {/* ── 2. SELECTOR DE TIPO ── */}
                    <Card>
                        <SectionTitle sub="Elige qué deseas agregar al detalle de esta compra">Agregar al Detalle</SectionTitle>

                        <div className="cp-picks" style={{ display: "flex", gap: 12, marginBottom: (insumoSel || prodSel) ? 22 : 0 }}>
                            <button type="button" className="cp-pick" onClick={() => { setBusqInsumo(""); setModalInsumo(true); }}
                                style={{
                                    border: `2px solid ${tipoSeleccion === "insumo" ? C.accent : C.border}`,
                                    background: tipoSeleccion === "insumo" ? C.accentSoft : "#fff",
                                    color: tipoSeleccion === "insumo" ? C.accent : C.muted,
                                }}>
                                <FaBoxOpen size={18} /> Elegir Insumo
                            </button>
                            <button type="button" className="cp-pick" onClick={() => { setBusqProd(""); setModalProducto(true); }}
                                style={{
                                    border: `2px solid ${tipoSeleccion === "producto" ? C.success : C.border}`,
                                    background: tipoSeleccion === "producto" ? C.successSoft : "#fff",
                                    color: tipoSeleccion === "producto" ? C.success : C.muted,
                                }}>
                                <FaTshirt size={18} /> Elegir Producto
                            </button>
                        </div>

                        {/* ── Panel Insumo seleccionado ── */}
                        {tipoSeleccion === "insumo" && insumoSel && (
                            <div style={{ background: C.accentSoft, borderRadius: 14, border: `1.5px solid ${C.accentBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <Badge type="accent"><FaBoxOpen size={10} /> Insumo</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{insumoSel.Nombre}</span>
                                        <Badge type={String(insumoSel.Tipo).toLowerCase() === "tela" ? "violet" : "muted"}>{insumoSel.Tipo}</Badge>
                                    </div>
                                    <button type="button" aria-label="Quitar selección" onClick={() => { setInsumoSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>
                                <div className="cp-grid-resp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "start" }}>
                                    <div>
                                        <Label>Nombre</Label>
                                        <Input value={insumoSel.Nombre} readOnly />
                                    </div>
                                    <div>
                                        <Label required>Precio de Compra</Label>
                                        <Input type="number" placeholder="$ 0" min="1" value={precioInsumo} invalid={intentoInsumo && !!errPrecioIns} onChange={e => setPrecioIns(e.target.value)} />
                                        <FieldError msg={intentoInsumo && errPrecioIns} />
                                    </div>
                                    <div>
                                        <Label required>Cantidad</Label>
                                        <Input type="number" min="1" step="1" value={cantInsumo || ""} invalid={intentoInsumo && !!errCantIns} onChange={e => setCantInsumo(Number(e.target.value))} />
                                        <FieldError msg={intentoInsumo && errCantIns} />
                                        <p style={{ margin: "5px 0 0", fontSize: 11, color: C.muted }}>
                                            Stock actual: <strong style={{ color: Number(insumoSel.Stock) <= STOCK_BAJO ? C.warning : C.navy }}>{insumoSel.Stock}</strong>
                                            {cantInsumo > 0 && <> → <strong style={{ color: C.success }}>{(Number(insumoSel.Stock) || 0) + cantInsumo}</strong></>}
                                        </p>
                                    </div>
                                    <Btn variant="success" onClick={handleAgregarInsumo} style={{ height: 38, marginTop: 22 }}>
                                        <FaPlus size={13} /> Agregar
                                    </Btn>
                                </div>
                            </div>
                        )}

                        {/* ── Panel Producto seleccionado ── */}
                        {tipoSeleccion === "producto" && prodSel && (
                            <div style={{ background: C.successSoft, borderRadius: 14, border: `1.5px solid ${C.successBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <Badge type="success"><FaTshirt size={10} /> Producto</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{prodSel.Nombre}</span>
                                        <Badge type="navy">{money(prodSel.PrecioBase)} base</Badge>
                                    </div>
                                    <button type="button" aria-label="Quitar selección" onClick={() => { setProdSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>

                                <div className="cp-grid-resp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1fr 0.8fr 1fr auto", gap: 12, alignItems: "start" }}>
                                    <div>
                                        <Label required>Color</Label>
                                        <Select value={varConfig.ColorID} invalid={intentoProd && !!errProd.ColorID} onChange={e => setVarConfig(p => ({ ...p, ColorID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {colores.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                        </Select>
                                        <FieldError msg={intentoProd && errProd.ColorID} />
                                    </div>
                                    <div>
                                        <Label required>Talla</Label>
                                        <Select value={varConfig.TallaID} invalid={intentoProd && !!errProd.TallaID} onChange={e => setVarConfig(p => ({ ...p, TallaID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {tallas.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre}</option>)}
                                        </Select>
                                        <FieldError msg={intentoProd && errProd.TallaID} />
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
                                        <Input type="number" placeholder="$ 0" min="0" value={varConfig.PrecioUnitario} invalid={intentoProd && !!errProd.PrecioUnitario} onChange={e => setVarConfig(p => ({ ...p, PrecioUnitario: e.target.value }))} />
                                        <FieldError msg={intentoProd && errProd.PrecioUnitario} />
                                    </div>
                                    <div>
                                        <Label required>Cant.</Label>
                                        <Input type="number" min="1" step="1" value={varConfig.Cantidad} invalid={intentoProd && !!errProd.Cantidad} onChange={e => setVarConfig(p => ({ ...p, Cantidad: e.target.value }))} />
                                        <FieldError msg={intentoProd && errProd.Cantidad} />
                                    </div>
                                    <div>
                                        <Label>Precio Venta</Label>
                                        <Input readOnly value={money(calcPrecioVenta(prodSel, varConfig.TallaID, varConfig.TelaID))}
                                            style={{ fontWeight: 700, color: C.success, background: "#fff" }} />
                                    </div>
                                    <Btn variant="success" onClick={handleAgregarProducto} title="Agregar al detalle" style={{ height: 38, marginTop: 22, flexShrink: 0 }}>
                                        <FaPlus size={13} />
                                    </Btn>
                                </div>
                                {varConfig.ColorID && varConfig.TallaID && (
                                    <p style={{ margin: "12px 0 0", fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        {varianteExistente
                                            ? <>Variante existente · stock actual <StockBadge stock={varianteExistente.Stock} />{cantProd > 0 && <>→ quedará en <strong style={{ color: C.success }}>{(Number(varianteExistente.Stock) || 0) + cantProd}</strong></>}</>
                                            : <><Badge type="violet">Variante nueva</Badge> se creará automáticamente al registrar la compra.</>}
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* ── 3. TABLA DE DETALLES ── */}
                    <Card>
                        <SectionTitle sub={`${detalles.length} ítem${detalles.length !== 1 ? "s" : ""} en el detalle`}>Detalle de la Compra</SectionTitle>

                        {detalles.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "44px 24px", background: C.accentSoft, borderRadius: 14, border: `1.5px dashed ${intentoEnvio ? C.danger : C.accentBorder}` }}>
                                <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#fff,#ede9fe)", color: C.accent, fontSize: 24 }}><FaBoxOpen /></div>
                                <p style={{ color: intentoEnvio ? C.danger : C.muted, margin: 0, fontSize: 13, fontWeight: intentoEnvio ? 700 : 400 }}>No hay ítems. Usa los botones de arriba para agregar insumos o productos.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
                                <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>#</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Tipo</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Nombre</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Detalle</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Base</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>+ Talla</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>+ Tela</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Venta</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Compra</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Cantidad</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Subtotal</th>
                                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalles.map((d, i) => {
                                            const precioMal = !(parseFloat(d.PrecioUnitario) > 0);
                                            const cantMal = !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0);
                                            const esProd = d.TipoSeleccion === "producto";
                                            return (
                                            <tr key={i} className="det-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafbff", borderBottom: `1px solid #eef2f7` }}>
                                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12, fontWeight: 600 }}>{i + 1}</td>
                                                <td style={{ padding: "11px 14px" }}>
                                                    {!esProd
                                                        ? <Badge type="info"><FaBoxOpen size={10} />{d.TipoInsumo || "Insumo"}</Badge>
                                                        : <Badge type="success"><FaTshirt size={10} />Producto</Badge>}
                                                </td>
                                                <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>
                                                    {!esProd ? d.NombreInsumo : d.NombreProducto}
                                                </td>
                                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>
                                                    {esProd
                                                        ? <span style={{ whiteSpace: "nowrap" }}>{d.NombreColor} / {d.NombreTalla}{d.TelaID ? ` / ${d.NombreTela}` : ""}</span>
                                                        : <span>—</span>}
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                                    {esProd ? <span style={{ fontWeight: 600, color: C.navy, fontSize: 12 }}>{money(d.PrecioBase)}</span> : <span style={{ color: C.muted }}>—</span>}
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                                    {esProd
                                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTalla || 0) > 0 ? C.accent : C.muted, fontSize: 12 }}>
                                                            {parseFloat(d.PrecioTalla || 0) > 0 ? `+${money(d.PrecioTalla)}` : "$0"}
                                                        </span>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                                    {esProd
                                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTela || 0) > 0 ? C.violet : C.muted, fontSize: 12 }}>
                                                            {parseFloat(d.PrecioTela || 0) > 0 ? `+${money(d.PrecioTela)}` : "$0"}
                                                        </span>
                                                        : <span style={{ color: C.muted }}>—</span>}
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                    {esProd ? <Badge type="success">{money(d.PrecioVenta)}</Badge> : <span style={{ color: C.muted }}>—</span>}
                                                </td>
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <input type="number" min="0" aria-label={`Precio de compra ítem ${i + 1}`}
                                                        value={d.PrecioUnitario ?? ""}
                                                        onChange={e => handleCambiarPrecio(i, e.target.value)}
                                                        style={{ ...inputStyle, width: 110, textAlign: "center", padding: "6px 10px", ...(precioMal ? invalidStyle : {}) }}
                                                        onFocus={e => e.target.style.borderColor = C.accent}
                                                        onBlur={e => e.target.style.borderColor = precioMal ? C.danger : C.border} />
                                                </td>
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <input type="number" min="1" step="1" aria-label={`Cantidad ítem ${i + 1}`}
                                                        value={d.Cantidad ?? ""}
                                                        onChange={e => handleCambiarCantidad(i, e.target.value === "" ? "" : Number(e.target.value))}
                                                        onFocus={e => e.target.style.borderColor = C.accent}
                                                        onBlur={e => {
                                                            e.target.style.borderColor = C.border;
                                                            if (!d.Cantidad || d.Cantidad < 1) handleCambiarCantidad(i, 1);
                                                            else if (!Number.isInteger(Number(d.Cantidad))) handleCambiarCantidad(i, Math.round(Number(d.Cantidad)) || 1);
                                                        }}
                                                        style={{ ...inputStyle, width: 80, textAlign: "center", padding: "6px 10px", ...(cantMal ? invalidStyle : {}) }} />
                                                </td>
                                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                    <span style={{ fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>{money(subtotal(d))}</span>
                                                </td>
                                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                                    <button type="button" title="Quitar ítem" aria-label="Quitar ítem" onClick={() => handleEliminarDetalle(i)}
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = `${C.danger}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = `${C.danger}0d`; e.currentTarget.style.transform = "none"; }}>
                                                        <FaTrash size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ); })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: C.accentSoft, borderTop: `2px solid ${C.border}` }}>
                                            <td colSpan={10} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: C.muted, fontSize: 12 }}>TOTAL DE LA COMPRA:</td>
                                            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 800, color: C.navy, fontSize: 16 }}>
                                                {money(totalCompra)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Card>
                    </div>

                    {/* ── 4. RESUMEN TIPO TICKET ── */}
                    <aside className="cp-sticky">
                        <div className="cp-ticket">
                            <div className="cp-ticket-head">
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <FaReceipt size={18} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: .7, fontWeight: 700 }}>Resumen</p>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{compra ? `Compra #${compra.CompraID}` : "Nueva compra"}</p>
                                    </div>
                                </div>
                                <p style={{ margin: "10px 0 0", fontSize: 12.5, opacity: .85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {proveedorActual ? proveedorActual.Nombre : "Sin proveedor"} · {formData.fechaCompra || "Sin fecha"}
                                </p>
                            </div>
                            <div className="cp-perf" />
                            <div style={{ padding: "6px 20px 0" }}>
                                {detalles.length === 0 ? (
                                    <p style={{ fontSize: 12.5, color: C.muted, textAlign: "center", margin: "10px 0 14px" }}>Aún no hay ítems</p>
                                ) : (
                                    <div style={{ maxHeight: 220, overflowY: "auto", borderBottom: `1.5px dashed ${C.border}`, paddingBottom: 8 }}>
                                        {detalles.map((d, i) => (
                                            <div key={i} className="cp-tline">
                                                <span title={d.NombreInsumo || d.NombreProducto}>
                                                    <strong style={{ color: C.navy }}>{d.Cantidad || 0}×</strong> {d.NombreInsumo || d.NombreProducto}
                                                    {d.TipoSeleccion === "producto" && <span style={{ color: C.muted }}> · {d.NombreTalla}</span>}
                                                </span>
                                                <span style={{ fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>{money(subtotal(d))}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="cp-tline" style={{ marginTop: 6 }}><span>Ítems</span><strong style={{ color: C.navy }}>{detalles.length}</strong></div>
                                <div className="cp-tline"><span>Unidades</span><strong style={{ color: C.navy }}>{totalUnidades}</strong></div>
                            </div>
                            <div style={{ margin: "8px 16px 0", background: C.navyGrad, borderRadius: 14, padding: "14px 16px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: .8, fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>{money(totalCompra)}</span>
                            </div>
                            <div style={{ padding: "14px 20px 4px" }}>
                                {checks.map(c => (
                                    <div key={c.label} className="cp-check" style={{ color: c.ok ? C.success : (intentoEnvio ? C.danger : C.muted) }}>
                                        {c.ok ? <FaCheckCircle size={13} /> : <FaRegCircle size={13} />} {c.label}
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: "12px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <Btn variant="primary" type="submit" disabled={!puedeGuardar || submitting} style={{ padding: "12px 20px", width: "100%", boxShadow: puedeGuardar ? `0 8px 18px ${C.navy}40` : "none" }}>
                                    {submitting
                                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Guardando...</>
                                        : <><FaCheck size={13} /> {compra ? "Guardar Cambios" : "Registrar Compra"}</>}
                                </Btn>
                                <Btn variant="secondary" onClick={onClose} style={{ padding: "10px 20px", width: "100%" }}>
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    </aside>
                  </div>
                </form>
            </div>

            {/* ════════════════════════════════════════
          MODAL: Seleccionar Insumo
      ════════════════════════════════════════ */}
            <SearchModal
                show={modalInsumo} onHide={() => setModalInsumo(false)}
                title="Seleccionar Insumo" icon={<FaBoxOpen style={{ marginRight: 8 }} />}
                searchValue={busqInsumo} onSearch={setBusqInsumo} placeholder="Buscar insumo por nombre o tipo..."
                columns={["Nombre", "Tipo", "Stock", "Precio Tela", ""]}
                emptyMsg={insumos.length === 0 ? "No hay insumos activos" : "No se encontraron insumos"}
                rows={insumosFiltrados.map((ins, i) => (
                    <TR key={ins.InsumoID} idx={i}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{ins.Nombre}</td>
                        <TD><Badge type={String(ins.Tipo).toLowerCase() === "tela" ? "violet" : "muted"}>{ins.Tipo}</Badge></TD>
                        <TD center><StockBadge stock={ins.Stock} /></TD>
                        <TD>{String(ins.Tipo).toLowerCase() === "tela" && ins.PrecioTela ? money(ins.PrecioTela) : "—"}</TD>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                            <Btn variant="primary" onClick={() => handleSelInsumo(ins)} style={{ padding: "6px 14px", fontSize: 12 }}>
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
                        <TD><Badge type="navy">{money(prod.PrecioBase)}</Badge></TD>
                        <td style={{ padding: "8px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                                <Btn variant="success" onClick={() => handleSelProducto(prod)} style={{ padding: "6px 14px", fontSize: 12 }}>
                                    Seleccionar
                                </Btn>
                                <button type="button" title="Ver variantes" aria-label="Ver variantes"
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
                footer={<>
                    <Btn variant="outline-accent" onClick={() => { setModalVerVar(false); handleAbrirNuevaVar(prodSel); }}><FaPlus size={11} /> Nueva variante</Btn>
                    <Btn variant="secondary" onClick={() => setModalVerVar(false)}>Cerrar</Btn>
                </>}>
                {loadingVar ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                        <p style={{ color: C.muted, fontSize: 13 }}>Cargando variantes...</p>
                    </div>
                ) : variantesModal.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px", background: C.accentSoft, borderRadius: 14 }}>
                        <p style={{ color: C.muted, marginBottom: 14 }}>Este producto no tiene variantes registradas.</p>
                        <Btn variant="primary" onClick={() => { setModalVerVar(false); handleAbrirNuevaVar(prodSel); }}>
                            <FaPlus size={12} /> Crear primera variante
                        </Btn>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr>{["Color", "Talla", "Tela", "Stock", "Estado"].map((h, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px" }}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {variantesModal.map((v, i) => (
                                    <TR key={v.InventarioID} idx={i}>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{v.color?.Nombre || "—"}</td>
                                        <TD>{v.talla?.Nombre || "—"}</TD>
                                        <TD><Badge type={v.tela ? "violet" : "muted"}>{v.tela?.Nombre || "Sin tela"}</Badge></TD>
                                        <TD center><StockBadge stock={v.Stock} /></TD>
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
                        <Btn variant="success" onClick={handleGuardarNuevaVar} disabled={creandoVar}>
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
                        { label: "Tela", key: "TelaID", required: false, items: telas, valKey: "InsumoID", labKey: "Nombre", extra: t => ` (${money(t.PrecioTela)})` },
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
