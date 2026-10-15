import React, { useState, useEffect, useRef } from "react";
import {
    FaPlus, FaTrash, FaExclamationTriangle, FaCheckCircle, FaShoppingCart,
    FaEdit, FaMagic, FaSearch, FaArrowLeft, FaTimes, FaCheck,
    FaBoxOpen, FaTshirt, FaUser, FaChevronDown
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
    createCotizacionCompleta, getColores, getTallas, getTelas, getTecnicas, getPartes
} from "../../Services/api-cotizacion-landing/cotizacion-landing";
import { getUsuarios } from "../../Services/api-usuarios/usuarios";
import { getProductos } from "../../Services/api-productos/productos";
import { getVariantesByProducto } from "../../Services/api-productos/variantes";

/* ── Tokens ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
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
    purple: "#7c3aed",
    purpleSoft: "#f5f3ff",
    purpleBorder: "#ddd6fe",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

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

const Textarea = ({ style: sx, ...props }) => (
    <textarea {...props}
        style={{ ...inputStyle, resize: "vertical", minHeight: 72, ...sx }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
    />
);

const Select = ({ children, disabled, ...props }) => (
    <select {...props} disabled={disabled}
        style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", appearance: "auto", opacity: disabled ? 0.55 : 1 }}>
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
        purple: { bg: C.purpleSoft, color: C.purple, border: C.purpleBorder },
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

const Card = ({ children, style: sx }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "22px 26px", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #f1f5f9", marginBottom: 20, ...sx }}>
        {children}
    </div>
);

const Btn = ({ variant = "primary", children, style: sx, ...props }) => {
    const variants = {
        primary: { background: C.navy, color: "#fff", border: "none" },
        secondary: { background: "#f1f5f9", color: C.muted, border: "none" },
        success: { background: C.success, color: "#fff", border: "none" },
        danger: { background: C.danger, color: "#fff", border: "none" },
        warning: { background: C.warning, color: "#fff", border: "none" },
        purple: { background: C.purple, color: "#fff", border: "none" },
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

/* ══════════════════════════════════════════════════════════
   SearchableSelect — dropdown con buscador integrado
   Props:
     options   [{ value, label, sublabel? }]
     value     valor actualmente seleccionado
     onChange  callback(value)
     placeholder
     disabled
══════════════════════════════════════════════════════════ */
const SearchableSelect = ({ options = [], value, onChange, placeholder = "Buscar...", disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const selectedOption = options.find(o => String(o.value) === String(value));

    const filtered = query.trim()
        ? options.filter(o => {
            const q = query.toLowerCase();
            return o.label?.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q);
        })
        : options;

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setQuery("");
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
        setOpen(false);
        setQuery("");
    };

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
            {/* Trigger */}
            <div
                onClick={() => { if (!disabled) setOpen(o => !o); }}
                style={{
                    ...inputStyle,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.55 : 1,
                    userSelect: "none",
                    borderColor: open ? C.accent : C.border,
                    paddingRight: 10,
                    gap: 8,
                }}
            >
                <span style={{ color: selectedOption ? C.text : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {selectedOption ? selectedOption.label : <span style={{ color: C.muted }}>{placeholder}</span>}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {selectedOption && !disabled && (
                        <button
                            onClick={handleClear}
                            style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "#cbd5e1", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, lineHeight: 1 }}
                        >✕</button>
                    )}
                    <FaChevronDown size={11} style={{ color: C.muted, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
                </div>
            </div>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10000,
                    background: "#fff", borderRadius: 10,
                    border: `1.5px solid ${C.accentBorder}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease",
                }}>
                    {/* Buscador */}
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, background: C.accentSoft }}>
                        <FaSearch size={12} style={{ color: C.accent, flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o documento..."
                            style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "'Outfit',sans-serif", color: C.text, width: "100%", background: "transparent" }}
                        />
                        {query && (
                            <button onClick={() => setQuery("")}
                                style={{ border: "none", background: "none", cursor: "pointer", color: C.muted, fontSize: 13, padding: 0, display: "flex", alignItems: "center" }}>
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Conteo */}
                    <div style={{ padding: "5px 12px 4px", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Opciones */}
                    <div style={{ maxHeight: 260, overflowY: "auto" }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: "18px 14px", textAlign: "center", color: C.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                Sin resultados para "{query}"
                            </div>
                        ) : (
                            filtered.map(opt => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt)}
                                        style={{
                                            padding: "10px 14px",
                                            cursor: "pointer",
                                            background: isSelected ? C.accentSoft : "#fff",
                                            borderLeft: `3px solid ${isSelected ? C.accent : "transparent"}`,
                                            transition: "background 0.12s",
                                            display: "flex", flexDirection: "column", gap: 2,
                                        }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
                                    >
                                        <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                            {isSelected && <span style={{ color: C.accent, marginRight: 6 }}>✓</span>}
                                            {opt.label}
                                        </span>
                                        {opt.sublabel && (
                                            <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                                {opt.sublabel}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const FormularioCotizacion = ({ onClose, onActualizar }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [tecnicas, setTecnicas] = useState([]);
    const [partes, setPartes] = useState([]);

    const [documentoID, setDocumentoID] = useState("");

    const [modoPersonalizado, setModoPersonalizado] = useState(false);
    const [productoPersonalizado, setProductoPersonalizado] = useState({ nombre: "", descripcion: "", precioUnitario: 0 });

    const [carritoProductos, setCarritoProductos] = useState([]);
    const [editandoIndex, setEditandoIndex] = useState(null);

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [variantesDisponibles, setVariantesDisponibles] = useState([]);
    const [coloresDisponibles, setColoresDisponibles] = useState([]);
    const [tallasDisponibles, setTallasDisponibles] = useState([]);
    const [telasDisponibles, setTelasDisponibles] = useState([]);
    const [cantidad, setCantidad] = useState(1);
    const [colorID, setColorID] = useState("");
    const [tallaID, setTallaID] = useState("");
    const [telaID, setTelaID] = useState("");
    const [traePrenda, setTraePrenda] = useState(false);
    const [prendaDescripcion, setPrendaDescripcion] = useState("");

    const [disenos, setDisenos] = useState([]);
    const [tecnicaID, setTecnicaID] = useState("");
    const [parteID, setParteID] = useState("");
    const [subparteDescripcion, setSubparteDescripcion] = useState("");
    const [archivoDiseno, setArchivoDiseno] = useState(null);
    const [observacionDiseno, setObservacionDiseno] = useState("");

    const [cargando, setCargando] = useState(false);
    const [cargandoVariantes, setCargandoVariantes] = useState(false);
    const [validacionStock, setValidacionStock] = useState({ valido: false, mensaje: "", cargando: false });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { cargarCatalogos(); }, []);

    const cargarCatalogos = async () => {
        setCargando(true);
        try {
            const [uR, pR, cR, tR, teR, tecR, parR] = await Promise.all([
                getUsuarios(), getProductos(), getColores(), getTallas(), getTelas(), getTecnicas(), getPartes()
            ]);
            setUsuarios(uR?.datos || uR || []);
            setProductos(pR?.datos || pR || []);
            setColores(cR?.datos || cR || []);
            setTallas(tR?.datos || tR || []);
            setTelas(teR || []);
            setTecnicas(tecR || []);
            setPartes(parR || []);
        } catch { Swal.fire("Error", "No se pudieron cargar los catálogos", "error"); }
        finally { setCargando(false); }
    };

    const handleSeleccionarProducto = async (productoID) => {
        if (!productoID) { setProductoSeleccionado(null); limpiarVariantes(); return; }
        const producto = productos.find(p => p.ProductoID === parseInt(productoID));
        setProductoSeleccionado(producto);
        limpiarVariantes();
        if (!producto) return;
        setCargandoVariantes(true);
        try {
            const response = await getVariantesByProducto(producto.ProductoID);
            const variantes = response.datos || response || [];
            setVariantesDisponibles(variantes);
            const coloresUnicos = [...new Set(variantes.map(v => v.ColorID))];
            setColoresDisponibles(colores.filter(c => coloresUnicos.includes(c.ColorID)));
            if (variantes.length === 0) Swal.fire({ icon: 'warning', title: 'Sin variantes', text: 'Este producto no tiene variantes en inventario.', confirmButtonText: 'Entendido' });
        } catch { Swal.fire("Error", "No se pudieron cargar las variantes", "error"); }
        finally { setCargandoVariantes(false); }
    };

    const handleSeleccionarColor = (nuevoColorID) => {
        setColorID(nuevoColorID); setTallaID(""); setTelaID("");
        if (!nuevoColorID) { setTallasDisponibles([]); setTelasDisponibles([]); return; }
        const varConColor = variantesDisponibles.filter(v => v.ColorID === parseInt(nuevoColorID));
        const tallasUnicas = [...new Set(varConColor.map(v => v.TallaID))];
        setTallasDisponibles(tallas.filter(t => tallasUnicas.includes(t.TallaID)));
        setTelasDisponibles([]);
    };

    const handleSeleccionarTalla = (nuevoTallaID) => {
        setTallaID(nuevoTallaID); setTelaID("");
        if (!nuevoTallaID || !colorID) { setTelasDisponibles([]); return; }
        const varConColorTalla = variantesDisponibles.filter(v => v.ColorID === parseInt(colorID) && v.TallaID === parseInt(nuevoTallaID));
        const telasUnicas = [...new Set(varConColorTalla.map(v => v.TelaID).filter(Boolean))];
        setTelasDisponibles(telas.filter(t => telasUnicas.includes(t.InsumoID)));
    };

    useEffect(() => {
        if (!modoPersonalizado) validarStockTiempoReal();
    }, [colorID, tallaID, telaID, cantidad, traePrenda, variantesDisponibles, modoPersonalizado]);

    const validarStockTiempoReal = () => {
        if (traePrenda) { setValidacionStock({ valido: true, mensaje: "Cliente trae prenda propia", cargando: false }); return; }
        if (!productoSeleccionado) { setValidacionStock({ valido: false, mensaje: "", cargando: false }); return; }
        if (!colorID || !tallaID || !telaID) { setValidacionStock({ valido: false, mensaje: "Selecciona color, talla y tipo de tela", cargando: false }); return; }
        const varianteEncontrada = variantesDisponibles.find(v =>
            v.ColorID === parseInt(colorID) && v.TallaID === parseInt(tallaID) && v.TelaID === parseInt(telaID) && v.Estado
        );
        if (!varianteEncontrada) { setValidacionStock({ valido: false, mensaje: "Esta combinación no existe en inventario", cargando: false }); return; }
        const stockDisponible = varianteEncontrada.Stock || 0;
        const cantidadSolicitada = parseInt(cantidad) || 0;
        if (stockDisponible < cantidadSolicitada) {
            setValidacionStock({ valido: false, mensaje: `Stock insuficiente (Disponible: ${stockDisponible})`, cargando: false });
        } else {
            setValidacionStock({ valido: true, mensaje: `Stock disponible: ${stockDisponible} unidades`, cargando: false });
        }
    };

    const calcularPrecios = () => {
        if (modoPersonalizado) {
            const cantNum = parseInt(cantidad) || 1;
            const precioUnit = parseFloat(productoPersonalizado.precioUnitario) || 0;
            return { precioBase: precioUnit, precioTalla: 0, precioTela: 0, precioUnitario: precioUnit, subtotal: precioUnit * cantNum, cantidad: cantNum };
        }
        if (!productoSeleccionado) return { precioBase: 0, precioTalla: 0, precioTela: 0, precioUnitario: 0, subtotal: 0, cantidad: 1 };
        const cantNum = parseInt(cantidad) || 1;
        if (traePrenda) {
            const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
            return { precioBase, precioTalla: 0, precioTela: 0, precioUnitario: precioBase, subtotal: precioBase * cantNum, cantidad: cantNum };
        }
        const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
        const talla = tallas.find(t => t.TallaID === parseInt(tallaID));
        const tela = telas.find(t => t.InsumoID === parseInt(telaID));
        const precioTalla = talla ? (parseFloat(talla.Precio) || 0) : 0;
        const precioTela = tela ? (parseFloat(tela.PrecioTela) || 0) : 0;
        const precioUnitario = precioBase + precioTalla + precioTela;
        return { precioBase, precioTalla, precioTela, precioUnitario, subtotal: precioUnitario * cantNum, cantidad: cantNum };
    };

    const precios = calcularPrecios();

    const limpiarVariantes = () => {
        setColorID(""); setTallaID(""); setTelaID("");
        setVariantesDisponibles([]); setColoresDisponibles([]); setTallasDisponibles([]); setTelasDisponibles([]);
        setValidacionStock({ valido: false, mensaje: "", cargando: false });
    };

    const limpiarFormularioProducto = () => {
        setCantidad(1); setColorID(""); setTallaID(""); setTelaID("");
        setTraePrenda(false); setPrendaDescripcion(""); setDisenos([]);
        setValidacionStock({ valido: false, mensaje: "", cargando: false });
        setTecnicaID(""); setParteID(""); setSubparteDescripcion(""); setArchivoDiseno(null); setObservacionDiseno("");
        setEditandoIndex(null);
    };

    const validarDiseno = () => {
        if (!tecnicaID) { Swal.fire("Atención", "Selecciona una técnica", "warning"); return false; }
        if (!parteID) { Swal.fire("Atención", "Selecciona una parte de la prenda", "warning"); return false; }
        if (!archivoDiseno) { Swal.fire("Atención", "Debes subir un archivo de diseño", "warning"); return false; }
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(archivoDiseno.type)) { Swal.fire("Atención", "El archivo debe ser una imagen válida", "warning"); return false; }
        if (archivoDiseno.size > 5 * 1024 * 1024) { Swal.fire("Atención", "El archivo no puede pesar más de 5MB", "warning"); return false; }
        return true;
    };

    const handleAgregarDiseno = () => {
        if (!validarDiseno()) return;
        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(tecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(parteID));
        setDisenos([...disenos, {
            id: Date.now(),
            TecnicaID: parseInt(tecnicaID), TecnicaNombre: tecnica?.Nombre,
            ParteID: parseInt(parteID), ParteNombre: parte?.Nombre,
            SubparteDescripcion: subparteDescripcion, Archivo: archivoDiseno,
            ImagenNombre: archivoDiseno?.name || "Sin archivo", Observaciones: observacionDiseno
        }]);
        setTecnicaID(""); setParteID(""); setSubparteDescripcion(""); setArchivoDiseno(null); setObservacionDiseno("");
    };

    const puedeAgregarProducto = () => {
        if (modoPersonalizado) return productoPersonalizado.nombre.trim().length > 0 && productoPersonalizado.precioUnitario > 0 && cantidad > 0;
        if (!productoSeleccionado) return false;
        if (traePrenda) return prendaDescripcion.trim().length > 0;
        return validacionStock.valido && colorID && tallaID && telaID && cantidad > 0;
    };

    const handleAgregarProductoAlCarrito = () => {
        let productoParaCarrito;
        if (modoPersonalizado) {
            if (!productoPersonalizado.nombre.trim()) { Swal.fire("Atención", "Ingresa el nombre del producto", "warning"); return; }
            if (!productoPersonalizado.precioUnitario || productoPersonalizado.precioUnitario <= 0) { Swal.fire("Atención", "Ingresa un precio válido", "warning"); return; }
            productoParaCarrito = {
                id: editandoIndex !== null ? carritoProductos[editandoIndex].id : Date.now(),
                ProductoID: null, ProductoNombre: productoPersonalizado.nombre,
                ProductoImagen: null, Cantidad: parseInt(cantidad), TraePrenda: false,
                PrendaDescripcion: productoPersonalizado.descripcion || "", EsPersonalizado: true,
                ColorID: null, ColorNombre: null, TallaID: null, TallaNombre: null, TelaID: null, TelaNombre: null,
                ...precios, disenos: [...disenos]
            };
        } else {
            if (!productoSeleccionado) { Swal.fire("Atención", "Selecciona un producto", "warning"); return; }
            if (!traePrenda && !validacionStock.valido) { Swal.fire({ icon: "error", title: "Stock", text: validacionStock.mensaje || "No se puede agregar" }); return; }
            if (traePrenda && !prendaDescripcion.trim()) { Swal.fire("Atención", "Describe la prenda que traerá el cliente", "warning"); return; }
            productoParaCarrito = {
                id: editandoIndex !== null ? carritoProductos[editandoIndex].id : Date.now(),
                ProductoID: productoSeleccionado.ProductoID, ProductoNombre: productoSeleccionado.Nombre,
                ProductoImagen: productoSeleccionado.ImagenProducto, Cantidad: parseInt(cantidad),
                TraePrenda: traePrenda, PrendaDescripcion: traePrenda ? prendaDescripcion : "", EsPersonalizado: false,
                ColorID: !traePrenda ? parseInt(colorID) : null,
                ColorNombre: !traePrenda ? colores.find(c => c.ColorID === parseInt(colorID))?.Nombre : null,
                TallaID: !traePrenda ? parseInt(tallaID) : null,
                TallaNombre: !traePrenda ? tallas.find(t => t.TallaID === parseInt(tallaID))?.Nombre : null,
                TelaID: !traePrenda ? parseInt(telaID) : null,
                TelaNombre: !traePrenda ? telas.find(t => t.InsumoID === parseInt(telaID))?.Nombre : null,
                ...precios, disenos: [...disenos]
            };
        }

        if (editandoIndex !== null) {
            const nuevo = [...carritoProductos];
            nuevo[editandoIndex] = productoParaCarrito;
            setCarritoProductos(nuevo);
        } else {
            setCarritoProductos([...carritoProductos, productoParaCarrito]);
        }

        Swal.fire({ icon: "success", title: editandoIndex !== null ? "Producto actualizado" : "Producto agregado al carrito", toast: true, position: "top-end", showConfirmButton: false, timer: 2000 });

        if (modoPersonalizado) setProductoPersonalizado({ nombre: "", descripcion: "", precioUnitario: 0 });
        else { setProductoSeleccionado(null); limpiarVariantes(); }
        limpiarFormularioProducto();
    };

    const handleEditarProductoCarrito = async (index) => {
        const producto = carritoProductos[index];
        if (producto.EsPersonalizado) {
            setModoPersonalizado(true);
            setProductoPersonalizado({ nombre: producto.ProductoNombre, descripcion: producto.PrendaDescripcion || "", precioUnitario: producto.precioUnitario });
        } else {
            setModoPersonalizado(false);
            const productoCompleto = productos.find(p => p.ProductoID === producto.ProductoID);
            setProductoSeleccionado(productoCompleto);
            setCargandoVariantes(true);
            try {
                const response = await getVariantesByProducto(producto.ProductoID);
                const variantes = response.datos || response || [];
                setVariantesDisponibles(variantes);
                const coloresUnicos = [...new Set(variantes.map(v => v.ColorID))];
                setColoresDisponibles(colores.filter(c => coloresUnicos.includes(c.ColorID)));
            } catch { console.error("Error al cargar variantes"); }
            finally { setCargandoVariantes(false); }
            setTraePrenda(producto.TraePrenda);
            setPrendaDescripcion(producto.PrendaDescripcion || "");
            if (!producto.TraePrenda) {
                setColorID(producto.ColorID?.toString() || "");
                setTallaID(producto.TallaID?.toString() || "");
                setTelaID(producto.TelaID?.toString() || "");
            }
        }
        setCantidad(producto.Cantidad);
        setDisenos(producto.disenos || []);
        setEditandoIndex(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEliminarProductoCarrito = (index) => {
        swalEncima({ title: "¿Eliminar producto?", text: "Se quitará del carrito", icon: "warning", showCancelButton: true, confirmButtonColor: C.danger, cancelButtonColor: C.navy, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar" })
            .then(result => { if (result.isConfirmed) setCarritoProductos(carritoProductos.filter((_, i) => i !== index)); });
    };

    const calcularTotalCarrito = () => carritoProductos.reduce((total, p) => total + p.subtotal, 0);

    const swalEncima = (opciones) =>
        Swal.fire({
            ...opciones,
            didOpen: () => {
                const container = document.querySelector(".swal2-container");
                if (container) container.style.zIndex = "99999";
            },
        });

    const handleEnviarCotizacion = async () => {
        if (!documentoID) { await swalEncima({ title: "Atención", text: "Selecciona un cliente", icon: "warning" }); return; }
        if (carritoProductos.length === 0) { await swalEncima({ title: "Atención", text: "Agrega al menos un producto al carrito", icon: "warning" }); return; }

        const clienteNombre = usuarios.find(u => u.DocumentoID === parseInt(documentoID))?.Nombre;
        const confirmacion = await swalEncima({
            title: "¿Crear cotización?",
            html: `<p><strong>Cliente:</strong> ${clienteNombre}</p><p><strong>Productos:</strong> ${carritoProductos.length}</p><p><strong>Total:</strong> $${calcularTotalCarrito().toLocaleString()}</p>`,
            icon: "question", showCancelButton: true,
            confirmButtonColor: C.success, cancelButtonColor: C.muted,
            confirmButtonText: "Sí, crear", cancelButtonText: "Revisar",
        });
        if (!confirmacion.isConfirmed) return;

        setSubmitting(true);
        try {
            const carritoConImagenes = await Promise.all(
                carritoProductos.map(async (prod) => {
                    const disenosConImagen = await Promise.all(
                        (prod.disenos || []).map(async (dis) => {
                            if (!dis.Archivo) return { ...dis, ImagenSubida: dis.ImagenNombre };
                            try {
                                const formData = new FormData();
                                formData.append('imagen', dis.Archivo);
                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/upload-diseno`, { method: 'POST', body: formData });
                                if (!res.ok) throw new Error('Upload falló');
                                const data = await res.json();
                                return { ...dis, ImagenSubida: data.filename };
                            } catch { return { ...dis, ImagenSubida: dis.ImagenNombre }; }
                        })
                    );
                    return { ...prod, disenos: disenosConImagen };
                })
            );

            const detalles = carritoConImagenes.map(prod => {
                if (prod.EsPersonalizado) {
                    return {
                        ProductoID: null, Cantidad: prod.Cantidad, TraePrenda: false,
                        PrendaDescripcion: `[PERSONALIZADO] ${prod.ProductoNombre}${prod.PrendaDescripcion ? ' - ' + prod.PrendaDescripcion : ''}`,
                        tallas: [], colores: [], insumos: [],
                        tecnicas: prod.disenos?.map(dis => ({
                            TecnicaID: dis.TecnicaID, ParteID: dis.ParteID,
                            ImagenDiseño: dis.ImagenSubida,
                            Observaciones: `${dis.SubparteDescripcion ? 'Subparte: ' + dis.SubparteDescripcion + ' - ' : ''}${dis.Observaciones}`,
                            CostoTecnica: 0
                        })) || []
                    };
                }
                return {
                    ProductoID: prod.ProductoID, Cantidad: prod.Cantidad,
                    TraePrenda: prod.TraePrenda, PrendaDescripcion: prod.PrendaDescripcion || "",
                    tallas: !prod.TraePrenda && prod.TallaID ? [{ TallaID: prod.TallaID, Cantidad: prod.Cantidad, PrecioTalla: prod.precioTalla }] : [],
                    colores: !prod.TraePrenda && prod.ColorID ? [{ ColorID: prod.ColorID, Cantidad: prod.Cantidad }] : [],
                    insumos: !prod.TraePrenda && prod.TelaID ? [{ InsumoID: prod.TelaID, CantidadRequerida: prod.Cantidad }] : [],
                    tecnicas: prod.disenos?.map(dis => ({
                        TecnicaID: dis.TecnicaID, ParteID: dis.ParteID,
                        ImagenDiseño: dis.ImagenSubida,
                        Observaciones: `${dis.SubparteDescripcion ? 'Subparte: ' + dis.SubparteDescripcion + ' - ' : ''}${dis.Observaciones}`,
                        CostoTecnica: 0
                    })) || []
                };
            });

            await createCotizacionCompleta({
                DocumentoID: parseInt(documentoID), FechaCotizacion: new Date().toISOString(),
                ValorTotal: calcularTotalCarrito(), EstadoID: 1, detalles
            });

            if (onActualizar) await onActualizar();
            if (onClose) onClose();
            await Swal.fire({ icon: "success", title: "¡Cotización creada!", timer: 2000, showConfirmButton: false });

        } catch (error) {
            await swalEncima({ icon: "error", title: "Error al crear cotización", text: error.response?.data?.message || error.message, confirmButtonColor: C.danger });
        } finally { setSubmitting(false); }
    };

    // ── Opciones para los SearchableSelect ──
    const opcionesClientes = usuarios.map(u => ({
        value: u.DocumentoID,
        label: u.Nombre,
        sublabel: `CC: ${u.DocumentoID}${u.Correo ? ` · ${u.Correo}` : ""}`,
    }));

    const opcionesProductos = productos.map(p => ({
        value: p.ProductoID,
        label: p.Nombre,
        sublabel: `Precio base: $${(parseFloat(p.PrecioBase) || 0).toLocaleString("es-CO")}`,
    }));

    const clienteSeleccionado = usuarios.find(u => u.DocumentoID === parseInt(documentoID));

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .det-row:hover { background: ${C.accentSoft} !important; }
      `}</style>

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, overflow: "auto", padding: "20px 16px" }}>
                <div style={{ background: C.bg, borderRadius: 20, maxWidth: 1300, margin: "0 auto", minHeight: "fit-content", fontFamily: "'Outfit',sans-serif" }}>

                    {/* HEADER */}
                    <div style={{ background: C.navyGrad, borderRadius: "20px 20px 0 0", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                                <FaArrowLeft size={13} />
                            </button>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}>Nueva Cotización</h4>
                                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                                    {carritoProductos.length} producto{carritoProductos.length !== 1 ? "s" : ""} · Total:{" "}
                                    <strong style={{ color: "#fff" }}>${calcularTotalCarrito().toLocaleString("es-CO")}</strong>
                                </p>
                            </div>
                        </div>
                        <Btn variant="outline-danger" onClick={onClose} style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}><FaTimes size={13} /> Cerrar</Btn>
                    </div>

                    <div style={{ padding: "24px 28px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

                            {/* ── COLUMNA IZQUIERDA ── */}
                            <div>
                                {/* 1. CLIENTE */}
                                <Card>
                                    <SectionTitle sub="Selecciona el cliente para esta cotización">Datos del Cliente</SectionTitle>
                                    <Label required>Cliente</Label>
                                    <SearchableSelect
                                        options={opcionesClientes}
                                        value={documentoID}
                                        onChange={setDocumentoID}
                                        placeholder="Buscar cliente por nombre o documento..."
                                    />
                                    {clienteSeleccionado && (
                                        <div style={{ marginTop: 12, background: C.accentSoft, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease" }}>
                                            <FaUser style={{ color: C.accent, fontSize: 16 }} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 13 }}>{clienteSeleccionado.Nombre}</p>
                                                <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>CC: {clienteSeleccionado.DocumentoID} · {clienteSeleccionado.Correo || "Sin correo"}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* 2. MODO PERSONALIZADO */}
                                <Card style={{ background: modoPersonalizado ? C.purpleSoft : "#fff", border: modoPersonalizado ? `1.5px solid ${C.purpleBorder}` : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 44, height: 24, borderRadius: 12, background: modoPersonalizado ? C.purple : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                                            onClick={() => { setModoPersonalizado(!modoPersonalizado); if (modoPersonalizado) setProductoPersonalizado({ nombre: "", descripcion: "", precioUnitario: 0 }); else { setProductoSeleccionado(null); limpiarVariantes(); } }}>
                                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: modoPersonalizado ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: modoPersonalizado ? C.purple : C.navy, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
                                                <FaMagic size={14} /> Producto Personalizado
                                            </p>
                                            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 12 }}>Activa para cotizar productos que no están en el catálogo</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* 3. AGREGAR PRODUCTO */}
                                <Card>
                                    <SectionTitle sub={editandoIndex !== null ? "Modifica los datos del producto seleccionado" : modoPersonalizado ? "Describe el producto personalizado" : "Selecciona y configura el producto"}>
                                        {editandoIndex !== null ? "Editando Producto" : "Agregar Producto"}
                                    </SectionTitle>

                                    {modoPersonalizado ? (
                                        <div style={{ background: C.purpleSoft, borderRadius: 14, border: `1.5px solid ${C.purpleBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                                <Badge type="purple"><FaMagic size={10} /> Personalizado</Badge>
                                                <span style={{ fontSize: 12, color: C.muted }}>No se validará contra el inventario</span>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                                                <div>
                                                    <Label required>Nombre del Producto</Label>
                                                    <Input placeholder="Ej: Buso con capucha" value={productoPersonalizado.nombre}
                                                        onChange={e => setProductoPersonalizado({ ...productoPersonalizado, nombre: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label required>Precio Unitario</Label>
                                                    <Input type="number" placeholder="$ 0" min="0" step="100" value={productoPersonalizado.precioUnitario}
                                                        onChange={e => setProductoPersonalizado({ ...productoPersonalizado, precioUnitario: parseFloat(e.target.value) || 0 })} />
                                                </div>
                                                <div>
                                                    <Label required>Cantidad</Label>
                                                    <Input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
                                                </div>
                                                <div style={{ gridColumn: "span 3" }}>
                                                    <Label>Descripción (Opcional)</Label>
                                                    <Textarea placeholder="Ej: Buso deportivo, talla L, color negro..." value={productoPersonalizado.descripcion}
                                                        onChange={e => setProductoPersonalizado({ ...productoPersonalizado, descripcion: e.target.value })} style={{ minHeight: 60 }} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: 14 }}>
                                                <Label required>Producto</Label>
                                                <SearchableSelect
                                                    options={opcionesProductos}
                                                    value={productoSeleccionado?.ProductoID || ""}
                                                    onChange={handleSeleccionarProducto}
                                                    placeholder="Buscar producto por nombre..."
                                                />
                                            </div>

                                            {productoSeleccionado && (
                                                <div style={{ background: C.accentSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", gap: 14, marginBottom: 14, animation: "fadeIn 0.2s ease" }}>
                                                    {productoSeleccionado.ImagenProducto ? (
                                                        <img src={productoSeleccionado.ImagenProducto} alt={productoSeleccionado.Nombre} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}` }} />
                                                    ) : (
                                                        <div style={{ width: 72, height: 72, borderRadius: 10, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <FaTshirt style={{ color: C.muted, opacity: 0.4, fontSize: 24 }} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 15 }}>{productoSeleccionado.Nombre}</p>
                                                        <Badge type="navy">${(parseFloat(productoSeleccionado.PrecioBase) || 0).toLocaleString()} base</Badge>
                                                    </div>
                                                </div>
                                            )}

                                            {cargandoVariantes && (
                                                <div style={{ textAlign: "center", padding: "20px" }}>
                                                    <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                                                    <p style={{ color: C.muted, fontSize: 12 }}>Cargando variantes...</p>
                                                </div>
                                            )}

                                            {productoSeleccionado && !cargandoVariantes && (
                                                <>
                                                    <div style={{ background: C.accentSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.accentBorder}`, marginBottom: 14 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <div style={{ width: 40, height: 22, borderRadius: 11, background: traePrenda ? C.success : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                                                                onClick={() => { setTraePrenda(!traePrenda); if (!traePrenda) { setColorID(""); setTallaID(""); setTelaID(""); } else { setPrendaDescripcion(""); } }}>
                                                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: traePrenda ? 21 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                                            </div>
                                                            <p style={{ margin: 0, fontWeight: 600, color: C.navy, fontSize: 13 }}>El cliente trae su propia prenda</p>
                                                        </div>
                                                        {traePrenda && (
                                                            <div style={{ marginTop: 10 }}>
                                                                <Label required>Descripción de la prenda</Label>
                                                                <Textarea placeholder="Describe la prenda..." value={prendaDescripcion} onChange={e => setPrendaDescripcion(e.target.value)} style={{ minHeight: 60 }} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!traePrenda && (
                                                        <div style={{ background: C.successSoft, borderRadius: 12, padding: "16px 18px", border: `1.5px solid ${C.successBorder}`, marginBottom: 14 }}>
                                                            <p style={{ margin: "0 0 12px", fontWeight: 700, color: C.success, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Características del Producto</p>
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: 12 }}>
                                                                <div>
                                                                    <Label required>Color</Label>
                                                                    <Select value={colorID} onChange={e => handleSeleccionarColor(e.target.value)}>
                                                                        <option value="">Seleccionar...</option>
                                                                        {coloresDisponibles.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                                                    </Select>
                                                                </div>
                                                                <div>
                                                                    <Label required>Talla</Label>
                                                                    <Select value={tallaID} onChange={e => handleSeleccionarTalla(e.target.value)} disabled={!colorID}>
                                                                        <option value="">Seleccionar...</option>
                                                                        {tallasDisponibles.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre} — ${(t.Precio || 0).toLocaleString()}</option>)}
                                                                    </Select>
                                                                    {!colorID && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Selecciona color primero</p>}
                                                                </div>
                                                                <div>
                                                                    <Label required>Tipo de Tela</Label>
                                                                    <Select value={telaID} onChange={e => setTelaID(e.target.value)} disabled={!tallaID}>
                                                                        <option value="">Seleccionar...</option>
                                                                        {telasDisponibles.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre} +${(t.PrecioTela || 0).toLocaleString()}</option>)}
                                                                    </Select>
                                                                    {!tallaID && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Selecciona talla primero</p>}
                                                                </div>
                                                                <div>
                                                                    <Label required>Cant.</Label>
                                                                    <Input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
                                                                </div>
                                                            </div>
                                                            {productoSeleccionado && !traePrenda && validacionStock.mensaje && (
                                                                <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: validacionStock.valido ? C.successSoft : C.dangerSoft, border: `1px solid ${validacionStock.valido ? C.successBorder : "#fecaca"}`, display: "flex", alignItems: "center", gap: 8 }}>
                                                                    {validacionStock.valido ? <FaCheckCircle style={{ color: C.success }} size={14} /> : <FaExclamationTriangle style={{ color: C.danger }} size={14} />}
                                                                    <span style={{ fontSize: 12, color: validacionStock.valido ? C.success : C.danger, fontWeight: 600 }}>{validacionStock.mensaje}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {traePrenda && (
                                                        <div style={{ marginBottom: 14 }}>
                                                            <Label required>Cantidad</Label>
                                                            <Input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}

                                    {(modoPersonalizado || productoSeleccionado) && (
                                        <div style={{ marginTop: 14, background: C.accentSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.accentBorder}` }}>
                                            <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.navy, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen de Precios</p>
                                            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                                {!modoPersonalizado && !traePrenda && (
                                                    <>
                                                        <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>Base</p><p style={{ margin: 0, fontWeight: 700, color: C.navy }}>${precios.precioBase.toLocaleString("es-CO")}</p></div>
                                                        <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>+ Talla</p><p style={{ margin: 0, fontWeight: 700, color: C.accent }}>${precios.precioTalla.toLocaleString("es-CO")}</p></div>
                                                        <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>+ Tela</p><p style={{ margin: 0, fontWeight: 700, color: C.warning }}>${precios.precioTela.toLocaleString("es-CO")}</p></div>
                                                        <div style={{ width: 1, background: C.border }} />
                                                    </>
                                                )}
                                                <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>Unitario</p><p style={{ margin: 0, fontWeight: 700, color: C.navy }}>${precios.precioUnitario.toLocaleString("es-CO")}</p></div>
                                                <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>Cantidad</p><p style={{ margin: 0, fontWeight: 700, color: C.navy }}>× {precios.cantidad}</p></div>
                                                <div style={{ textAlign: "center" }}><p style={{ margin: 0, fontSize: 11, color: C.muted }}>Subtotal</p><p style={{ margin: 0, fontWeight: 800, color: C.success, fontSize: 16 }}>${precios.subtotal.toLocaleString("es-CO")}</p></div>
                                            </div>
                                        </div>
                                    )}
                                </Card>

                                {/* 4. DISEÑOS */}
                                {(modoPersonalizado || productoSeleccionado) && (
                                    <Card>
                                        <SectionTitle sub="Agrega diseños/técnicas al producto (opcional)">Diseños Personalizados</SectionTitle>
                                        <div style={{ background: C.accentSoft, borderRadius: 12, padding: "16px 18px", border: `1.5px dashed ${C.accentBorder}`, marginBottom: 16 }}>
                                            <p style={{ margin: "0 0 12px", fontWeight: 700, color: C.navy, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nuevo Diseño</p>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                                <div>
                                                    <Label>Técnica</Label>
                                                    <Select value={tecnicaID} onChange={e => setTecnicaID(e.target.value)}>
                                                        <option value="">Seleccionar...</option>
                                                        {tecnicas.filter(t => t.Estado).map(t => <option key={t.TecnicaID} value={t.TecnicaID}>{t.Nombre}</option>)}
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Parte de la prenda</Label>
                                                    <Select value={parteID} onChange={e => setParteID(e.target.value)}>
                                                        <option value="">Seleccionar...</option>
                                                        {partes.map(p => <option key={p.ParteID} value={p.ParteID}>{p.Nombre}</option>)}
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Subparte (opcional)</Label>
                                                    <Input placeholder="Ej: Superior izquierdo" value={subparteDescripcion} onChange={e => setSubparteDescripcion(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>Archivo del diseño</Label>
                                                    <input type="file" accept="image/*" onChange={e => setArchivoDiseno(e.target.files[0])}
                                                        style={{ ...inputStyle, padding: "6px 10px", cursor: "pointer" }} />
                                                    {archivoDiseno && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.success }}>✓ {archivoDiseno.name}</p>}
                                                </div>
                                                <div style={{ gridColumn: "span 2" }}>
                                                    <Label>Observaciones</Label>
                                                    <Textarea placeholder="Ej: Logo azul, tamaño 10x10 cm" value={observacionDiseno} onChange={e => setObservacionDiseno(e.target.value)} style={{ minHeight: 60 }} />
                                                </div>
                                            </div>
                                            <Btn variant="success" type="button" onClick={handleAgregarDiseno} style={{ padding: "7px 16px", fontSize: 12 }}>
                                                <FaPlus size={11} /> Agregar diseño
                                            </Btn>
                                        </div>
                                        {disenos.length > 0 ? (
                                            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                                    <thead>
                                                        <tr>{["Técnica", "Parte", "Subparte", "Observaciones", "Archivo", ""].map((h, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "9px 12px" }}>{h}</th>)}</tr>
                                                    </thead>
                                                    <tbody>
                                                        {disenos.map((d, i) => (
                                                            <tr key={d.id} style={{ background: i % 2 === 0 ? "#fff" : C.accentSoft }}>
                                                                <td style={{ padding: "9px 12px", fontWeight: 600, color: C.navy }}>{d.TecnicaNombre}</td>
                                                                <td style={{ padding: "9px 12px", color: C.muted }}>{d.ParteNombre}</td>
                                                                <td style={{ padding: "9px 12px", color: C.muted }}>{d.SubparteDescripcion || "—"}</td>
                                                                <td style={{ padding: "9px 12px", color: C.text, maxWidth: 200 }}>
                                                                    {d.Observaciones
                                                                        ? <span title={d.Observaciones} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.Observaciones}</span>
                                                                        : <span style={{ color: C.muted }}>—</span>}
                                                                </td>
                                                                <td style={{ padding: "9px 12px" }}><Badge type="muted">{d.ImagenNombre}</Badge></td>
                                                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                                    <button type="button" onClick={() => setDisenos(disenos.filter(x => x.id !== d.id))}
                                                                        style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                        <FaTrash size={11} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: "center", padding: "20px", background: C.accentSoft, borderRadius: 10, border: `1px dashed ${C.border}` }}>
                                                <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>No hay diseños. Puedes agregar el producto sin diseños.</p>
                                            </div>
                                        )}
                                        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                            {editandoIndex !== null && (
                                                <Btn variant="secondary" type="button" onClick={() => { setProductoSeleccionado(null); limpiarVariantes(); limpiarFormularioProducto(); }}>
                                                    Cancelar edición
                                                </Btn>
                                            )}
                                            <Btn variant={editandoIndex !== null ? "warning" : "primary"} type="button" onClick={handleAgregarProductoAlCarrito} disabled={!puedeAgregarProducto()} style={{ padding: "10px 24px" }}>
                                                <FaShoppingCart size={13} />
                                                {editandoIndex !== null ? "Actualizar Producto" : "Agregar al Carrito"}
                                            </Btn>
                                        </div>
                                    </Card>
                                )}
                            </div>

                            {/* ── COLUMNA DERECHA: CARRITO ── */}
                            <div style={{ position: "sticky", top: 20 }}>
                                <Card style={{ marginBottom: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <SectionTitle sub={`${carritoProductos.length} producto${carritoProductos.length !== 1 ? "s" : ""} agregados`}>
                                            <FaShoppingCart size={13} style={{ marginRight: 6 }} />Carrito
                                        </SectionTitle>
                                        {carritoProductos.length > 0 && (
                                            <div style={{ background: C.accentSoft, borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
                                                <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 700 }}>TOTAL</p>
                                                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.navy }}>${calcularTotalCarrito().toLocaleString("es-CO")}</p>
                                            </div>
                                        )}
                                    </div>

                                    {carritoProductos.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "36px 20px", background: C.accentSoft, borderRadius: 12, border: `1.5px dashed ${C.accentBorder}` }}>
                                            <FaShoppingCart size={32} style={{ color: C.muted, opacity: 0.25, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                                            <p style={{ color: C.muted, margin: 0, fontSize: 12 }}>No hay productos en el carrito</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                                                {carritoProductos.map((prod, index) => (
                                                    <div key={prod.id} style={{ background: editandoIndex === index ? C.warningSoft : "#f8fafc", borderRadius: 12, padding: "12px 14px", border: `1.5px solid ${editandoIndex === index ? "#fde68a" : C.border}`, transition: "all 0.15s" }}>
                                                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                            {prod.ProductoImagen ? (
                                                                <img src={prod.ProductoImagen} alt={prod.ProductoNombre} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                                                            ) : (
                                                                <div style={{ width: 48, height: 48, borderRadius: 8, background: prod.EsPersonalizado ? C.purpleSoft : C.accentSoft, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                    {prod.EsPersonalizado ? <FaMagic style={{ color: C.purple, opacity: 0.6 }} /> : <FaTshirt style={{ color: C.accent, opacity: 0.5 }} />}
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                                                    <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.ProductoNombre}</p>
                                                                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                                                        <button onClick={() => handleEditarProductoCarrito(index)} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaEdit size={11} /></button>
                                                                        <button onClick={() => handleEliminarProductoCarrito(index)} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTrash size={11} /></button>
                                                                    </div>
                                                                </div>
                                                                {prod.EsPersonalizado && <Badge type="purple" style={{ fontSize: 10 }}><FaMagic size={9} /> Personalizado</Badge>}
                                                                {prod.TraePrenda && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Prenda propia</p>}
                                                                {!prod.TraePrenda && !prod.EsPersonalizado && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{prod.ColorNombre} · {prod.TallaNombre} · {prod.TelaNombre}</p>}
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                                                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Cant: <strong>{prod.Cantidad}</strong></p>
                                                                    <p style={{ margin: 0, fontWeight: 800, color: C.success, fontSize: 13 }}>${prod.subtotal.toLocaleString("es-CO")}</p>
                                                                </div>
                                                                {prod.disenos?.length > 0 && <Badge type="purple" style={{ marginTop: 4, fontSize: 10 }}>{prod.disenos.length} diseño{prod.disenos.length !== 1 ? "s" : ""}</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                <Btn variant="success" type="button" onClick={handleEnviarCotizacion} disabled={submitting || !documentoID} style={{ width: "100%", justifyContent: "center", padding: "11px" }}>
                                                    {submitting
                                                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Enviando...</>
                                                        : <><FaCheck size={13} /> Crear Cotización</>}
                                                </Btn>
                                                <Btn variant="secondary" type="button" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
                                                    Cancelar
                                                </Btn>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FormularioCotizacion;