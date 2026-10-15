import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    FaShoppingCart, FaTshirt, FaImage, FaPlusCircle, FaTrash, FaEdit,
    FaEye, FaCheckCircle, FaTimesCircle, FaArrowRight, FaBoxOpen,
    FaPalette, FaRuler, FaTags, FaLayerGroup, FaChevronRight,
    FaUser, FaUpload, FaTimes, FaCheck, FaExclamationTriangle,
    FaStar, FaPlus, FaMinus
} from "react-icons/fa";
import FooterComponent from "./footer";
import NavbarComponent from "./NavBarLanding";

// ── Design tokens (mismo sistema) ──
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyDeep: "linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    purple: "#7c3aed",
    purpleSoft: "#f5f3ff",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    white: "#ffffff",
};

// ── APIs ──
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const api = {
    getProductos: async () => { const r = await fetch(`${API_BASE_URL}/productos`); const d = await r.json(); return d.datos || d; },
    getTecnicas: async () => { const r = await fetch(`${API_BASE_URL}/tecnicas`); const d = await r.json(); return d.datos || d; },
    getPartes: async () => { const r = await fetch(`${API_BASE_URL}/partes`); const d = await r.json(); return d.datos || d; },
    getColores: async () => { const r = await fetch(`${API_BASE_URL}/colores`); const d = await r.json(); return d.datos || d; },
    getTallas: async () => { const r = await fetch(`${API_BASE_URL}/tallas`); const d = await r.json(); return d.datos || d; },
    getTelas: async () => {
        const r = await fetch(`${API_BASE_URL}/insumos`); const d = await r.json();
        return (d.datos || d).filter(i => i.Tipo?.toLowerCase() === "tela");
    },
    getVariantesByProducto: async (productoID) => {
        const r = await fetch(`${API_BASE_URL}/inventarioproducto/producto/${productoID}`);
        if (!r.ok) throw new Error(`Error ${r.status}`);
        const d = await r.json(); return d.datos || d;
    },
    createCotizacionInteligente: async (data) => {
        const r = await fetch(`${API_BASE_URL}/cotizaciones/inteligente`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        const d = await r.json();
        if (!r.ok) throw { response: { data: d } };
        return d;
    }
};

// ── Componentes UI ──
const Label = ({ children, required }) => (
    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>
        {children}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
    </p>
);

const InputBase = ({ style, ...props }) => (
    <input {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px rgba(79,142,247,0.12)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

const SelectBase = ({ style, ...props }) => (
    <select {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, cursor: "pointer", ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px rgba(79,142,247,0.12)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

const TextareaBase = ({ style, ...props }) => (
    <textarea {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, resize: "vertical", ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px rgba(79,142,247,0.12)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

const SectionCard = ({ title, subtitle, icon, accentColor = C.accent, children, headerRight }) => (
    <div style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 22px", borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(90deg, ${accentColor}08 0%, transparent 100%)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}15`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, fontSize: 15 }}>
                    {icon}
                </div>
                <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{title}</p>
                    {subtitle && <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{subtitle}</p>}
                </div>
            </div>
            {headerRight}
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style, ...rest }) => {
    const variants = {
        primary: { bg: C.navyGrad, color: "#fff", border: "none" },
        success: { bg: `linear-gradient(90deg, #16a34a, #15803d)`, color: "#fff", border: "none" },
        danger: { bg: C.dangerSoft, color: C.danger, border: `1.5px solid ${C.dangerBorder}` },
        ghost: { bg: "transparent", color: C.muted, border: `1.5px solid ${C.border}` },
        accent: { bg: `linear-gradient(90deg, #4f8ef7, #7c3aed)`, color: "#fff", border: "none" },
        warning: { bg: C.warningSoft, color: C.warning, border: `1.5px solid ${C.warningBorder}` },
    };
    const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 13 }, lg: { padding: "13px 28px", fontSize: 14 } };
    const v = variants[variant]; const s = sizes[size];
    return (
        <button onClick={onClick} disabled={disabled} {...rest} style={{
            ...v, ...s, borderRadius: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
            cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center",
            gap: 7, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...style
        }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
            {children}
        </button>
    );
};

const InfoBadge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        warning: { bg: C.warningSoft, color: C.warning, border: C.warningBorder },
        danger: { bg: C.dangerSoft, color: C.danger, border: C.dangerBorder },
        info: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        purple: { bg: C.purpleSoft, color: C.purple, border: "#ddd6fe" },
    };
    const s = map[type] || map.info;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};

// ── Modal base ──
const Modal = ({ open, onClose, title, subtitle, accentColor = C.navy, maxWidth = 680, children, footer }) => {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onClose}>
            <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalIn 0.25s ease", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ background: accentColor, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{title}</p>
                        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Outfit',sans-serif" }}>{subtitle}</p>}
                    </div>
                </div>
                <div style={{ overflowY: "auto", flex: 1, padding: "22px 24px" }}>{children}</div>
                {footer && <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>{footer}</div>}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────
const CotizacionLanding = () => {
    const [usuario, setUsuario] = useState(null);
    const [mostrarLoginModal, setMostrarLoginModal] = useState(false);
    const [traePrenda, setTraePrenda] = useState(false);
    const [productos, setProductos] = useState([]);
    const [tecnicas, setTecnicas] = useState([]);
    const [partes, setPartes] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [variantesProducto, setVariantesProducto] = useState([]);
    const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
    const [busquedaProducto, setBusquedaProducto] = useState("");
    const [formProducto, setFormProducto] = useState({ ColorID: "", TallaID: "", TipoTela: "", Cantidad: 1, PrendaDescripcion: "" });
    const [disenoActual, setDisenoActual] = useState({ TecnicaID: "", ParteID: "", Subparte: "", ImagenDiseno: null, Observacion: "" });
    const [erroresDiseño, setErroresDiseño] = useState({});
    const [disenoEditando, setDisenoEditando] = useState(null);
    const [mostrarModalVisualizacion, setMostrarModalVisualizacion] = useState(false);
    const [disenoVisualizando, setDisenoVisualizando] = useState(null);
    const [disenosAgregados, setDisenosAgregados] = useState([]);
    const [productosEnCotizacion, setProductosEnCotizacion] = useState([]);
    const [mostrarExito, setMostrarExito] = useState(false);
    const [numeroCotizacion, setNumeroCotizacion] = useState(null);
    const [tipoCotizacion, setTipoCotizacion] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");
    const [enviando, setEnviando] = useState(false);

    // ── Efectos ──
    useEffect(() => { verificarAutenticacion(); cargarDatos(); }, []);

    useEffect(() => {
        if (productoSeleccionado && !traePrenda) cargarVariantesProducto(productoSeleccionado.ProductoID);
        else { setVariantesProducto([]); setFormProducto(prev => ({ ...prev, ColorID: "", TallaID: "", TipoTela: "" })); }
    }, [productoSeleccionado, traePrenda]);

    useEffect(() => {
        if (!productoSeleccionado || traePrenda) return;
        const coloresDisp = obtenerColoresDisponibles();
        const tallasDisp = obtenerTallasDisponibles();
        const telasDisp = obtenerTelasDisponibles();
        if (formProducto.ColorID && !coloresDisp.some(c => c.ColorID === parseInt(formProducto.ColorID))) { setFormProducto(prev => ({ ...prev, ColorID: "", TallaID: "", TipoTela: "" })); return; }
        if (formProducto.TallaID && !tallasDisp.some(t => t.TallaID === parseInt(formProducto.TallaID))) { setFormProducto(prev => ({ ...prev, TallaID: "", TipoTela: "" })); return; }
        if (formProducto.TipoTela && !telasDisp.some(t => t.InsumoID === parseInt(formProducto.TipoTela))) setFormProducto(prev => ({ ...prev, TipoTela: "" }));
    }, [productoSeleccionado, traePrenda, formProducto.ColorID, formProducto.TallaID, variantesProducto]);

    // ── Auth ──
    const verificarAutenticacion = () => {
        const u = localStorage.getItem("usuario");
        if (!u) { setMostrarLoginModal(true); return; }
        setUsuario(JSON.parse(u));
    };
    const handleIniciarSesion = () => { sessionStorage.setItem("redirectAfterLogin", window.location.pathname); window.location.href = "/login"; };

    // ── Carga de datos ──
    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [prodData, tecData, partData, colData, tallData, telData] = await Promise.all([
                api.getProductos(), api.getTecnicas(), api.getPartes(), api.getColores(), api.getTallas(), api.getTelas()
            ]);
            setProductos(prodData || []); setTecnicas(tecData || []); setPartes(partData || []);
            setColores(colData || []); setTallas(tallData || []); setTelas(telData || []);
        } catch (err) {
            Swal.fire("Error", err?.message || "Error cargando catálogos", "error");
        } finally { setCargando(false); }
    };

    const cargarVariantesProducto = async (productoID) => {
        try {
            const res = await api.getVariantesByProducto(productoID);
            if (!Array.isArray(res)) { setVariantesProducto([]); return; }
            const variantes = res.filter(v => v.Estado && v.Stock > 0);
            setVariantesProducto(variantes);
            if (variantes.length === 0) Swal.fire({ icon: "warning", title: "Sin variantes disponibles", text: "Este producto no tiene variantes en stock.", confirmButtonText: "Entendido" });
        } catch { setVariantesProducto([]); Swal.fire({ icon: "error", title: "Error al cargar variantes", text: "No se pudieron cargar las opciones.", confirmButtonText: "Entendido" }); }
    };

    // ── Filtros de variantes ──
    const obtenerColoresDisponibles = () => {
        if (!productoSeleccionado || traePrenda || variantesProducto.length === 0) return colores;
        const ids = [...new Set(variantesProducto.filter(v => v.Estado && v.Stock > 0).map(v => v.ColorID))];
        return colores.filter(c => ids.includes(c.ColorID));
    };
    const obtenerTallasDisponibles = () => {
        if (!productoSeleccionado || traePrenda || variantesProducto.length === 0) return tallas;
        const base = formProducto.ColorID ? variantesProducto.filter(v => v.Estado && v.Stock > 0 && v.ColorID === parseInt(formProducto.ColorID)) : variantesProducto.filter(v => v.Estado && v.Stock > 0);
        const ids = [...new Set(base.map(v => v.TallaID))];
        return tallas.filter(t => ids.includes(t.TallaID));
    };
    const obtenerTelasDisponibles = () => {
        if (!productoSeleccionado || traePrenda || variantesProducto.length === 0) return telas;
        const base = variantesProducto.filter(v => v.Estado && v.Stock > 0
            && (!formProducto.ColorID || v.ColorID === parseInt(formProducto.ColorID))
            && (!formProducto.TallaID || v.TallaID === parseInt(formProducto.TallaID)));
        const ids = [...new Set(base.filter(v => v.TelaID).map(v => v.TelaID))];
        return telas.filter(t => ids.includes(t.InsumoID));
    };

    const coloresDisponibles = obtenerColoresDisponibles();
    const tallasDisponibles = obtenerTallasDisponibles();
    const telasDisponibles = obtenerTelasDisponibles();

    const validarStockDisponible = () => {
        if (traePrenda || !productoSeleccionado || variantesProducto.length === 0) return { valido: true };
        const cantidad = parseInt(formProducto.Cantidad) || 0;
        const variante = variantesProducto.find(v => {
            const c = !formProducto.ColorID || v.ColorID === parseInt(formProducto.ColorID);
            const t = !formProducto.TallaID || v.TallaID === parseInt(formProducto.TallaID);
            const te = !formProducto.TipoTela || v.TelaID === parseInt(formProducto.TipoTela);
            return c && t && te && v.Estado;
        });
        if (!variante) return { valido: false, mensaje: "No existe esta combinación de producto. Verifica tu selección." };
        if (variante.Stock < cantidad) return { valido: false, mensaje: `Stock insuficiente. Solo hay ${variante.Stock} unidad(es) disponible(s).`, stockDisponible: variante.Stock };
        return { valido: true, stockDisponible: variante.Stock };
    };

    // ─────────────────────────────────────────────────
    // VALIDACIONES DE DISEÑO (mejoradas)
    // ─────────────────────────────────────────────────
    const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const TAMAÑO_MAX_MB = 5;

    const validarDiseño = (diseno, esEdicion = false) => {
        const errores = {};

        if (!diseno.TecnicaID) errores.TecnicaID = "Debes seleccionar una técnica de estampado.";
        if (!diseno.ParteID) errores.ParteID = "Debes seleccionar la parte de la prenda.";

        // Imagen: obligatoria al crear, opcional al editar (se mantiene la existente)
        if (!esEdicion) {
            if (!diseno.ImagenDiseno) {
                errores.ImagenDiseno = "Debes subir una imagen del diseño.";
            } else {
                if (!TIPOS_IMAGEN_PERMITIDOS.includes(diseno.ImagenDiseno.type)) {
                    errores.ImagenDiseno = "Solo se permiten imágenes JPG, PNG, GIF o WEBP.";
                } else if (diseno.ImagenDiseno.size > TAMAÑO_MAX_MB * 1024 * 1024) {
                    errores.ImagenDiseno = `El archivo no puede superar ${TAMAÑO_MAX_MB}MB. (Actual: ${(diseno.ImagenDiseno.size / 1024 / 1024).toFixed(2)}MB)`;
                }
            }
        } else if (diseno.ImagenDiseno) {
            // Si se sube nueva imagen al editar, validar igualmente
            if (!TIPOS_IMAGEN_PERMITIDOS.includes(diseno.ImagenDiseno.type)) {
                errores.ImagenDiseno = "Solo se permiten imágenes JPG, PNG, GIF o WEBP.";
            } else if (diseno.ImagenDiseno.size > TAMAÑO_MAX_MB * 1024 * 1024) {
                errores.ImagenDiseno = `El archivo no puede superar ${TAMAÑO_MAX_MB}MB. (Actual: ${(diseno.ImagenDiseno.size / 1024 / 1024).toFixed(2)}MB)`;
            }
        }

        // Validar duplicado de técnica+parte (no puede repetirse la misma combinación en el mismo producto)
        if (diseno.TecnicaID && diseno.ParteID) {
            const duplicado = disenosAgregados.find(d =>
                d.TecnicaID === parseInt(diseno.TecnicaID) &&
                d.ParteID === parseInt(diseno.ParteID) &&
                (!esEdicion || d.id !== disenoEditando?.id)
            );
            if (duplicado) {
                const tecnicaNombre = tecnicas.find(t => t.TecnicaID === parseInt(diseno.TecnicaID))?.Nombre;
                const parteNombre = partes.find(p => p.ParteID === parseInt(diseno.ParteID))?.Nombre;
                errores.duplicado = `Ya existe un diseño con la combinación "${tecnicaNombre}" + "${parteNombre}". Cambia la técnica o la parte.`;
            }
        }

        if (diseno.Observacion && diseno.Observacion.length > 500) {
            errores.Observacion = `Las observaciones no pueden superar 500 caracteres. (Actual: ${diseno.Observacion.length})`;
        }

        return errores;
    };

    // ── Handlers diseños ──
    const handleAgregarDiseno = () => {
        const errores = validarDiseño(disenoActual, false);
        setErroresDiseño(errores);
        if (Object.keys(errores).length > 0) return;

        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(disenoActual.TecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(disenoActual.ParteID));
        const archivoCopiado = new File([disenoActual.ImagenDiseno], disenoActual.ImagenDiseno.name, {
            type: disenoActual.ImagenDiseno.type, lastModified: disenoActual.ImagenDiseno.lastModified
        });
        setDisenosAgregados(prev => [...prev, {
            id: Date.now() + Math.random(),
            TecnicaID: parseInt(disenoActual.TecnicaID), ParteID: parseInt(disenoActual.ParteID),
            tecnica, parte, Subparte: disenoActual.Subparte.trim(),
            ImagenDiseno: archivoCopiado, ImagenNombre: disenoActual.ImagenDiseno.name,
            ImagenPreviewUrl: URL.createObjectURL(archivoCopiado),
            Observacion: disenoActual.Observacion.trim()
        }]);
        setDisenoActual({ TecnicaID: "", ParteID: "", Subparte: "", ImagenDiseno: null, Observacion: "" });
        setErroresDiseño({});
        Swal.fire({ icon: "success", title: "Diseño agregado", timer: 1800, showConfirmButton: false });
    };

    const handleEditarDiseno = (diseno) => {
        setDisenoEditando(diseno);
        setDisenoActual({ TecnicaID: diseno.TecnicaID.toString(), ParteID: diseno.ParteID.toString(), Subparte: diseno.Subparte, ImagenDiseno: null, Observacion: diseno.Observacion });
        setErroresDiseño({});
    };

    const handleGuardarEdicion = () => {
        const errores = validarDiseño(disenoActual, true);
        setErroresDiseño(errores);
        if (Object.keys(errores).length > 0) return;

        const tecnica = tecnicas.find(t => t.TecnicaID === parseInt(disenoActual.TecnicaID));
        const parte = partes.find(p => p.ParteID === parseInt(disenoActual.ParteID));
        setDisenosAgregados(prev => prev.map(d => {
            if (d.id !== disenoEditando.id) return d;
            const nuevaImagen = disenoActual.ImagenDiseno || d.ImagenDiseno;
            const nuevaPreviewUrl = disenoActual.ImagenDiseno ? URL.createObjectURL(disenoActual.ImagenDiseno) : d.ImagenPreviewUrl;
            return { ...d, TecnicaID: parseInt(disenoActual.TecnicaID), ParteID: parseInt(disenoActual.ParteID), tecnica, parte, Subparte: disenoActual.Subparte.trim(), ImagenDiseno: nuevaImagen, ImagenNombre: disenoActual.ImagenDiseno?.name || d.ImagenNombre, ImagenPreviewUrl: nuevaPreviewUrl, Observacion: disenoActual.Observacion.trim() };
        }));
        setDisenoEditando(null);
        setDisenoActual({ TecnicaID: "", ParteID: "", Subparte: "", ImagenDiseno: null, Observacion: "" });
        setErroresDiseño({});
        Swal.fire({ icon: "success", title: "Diseño actualizado", timer: 1500, showConfirmButton: false });
    };

    const handleCancelarEdicion = () => {
        setDisenoEditando(null);
        setDisenoActual({ TecnicaID: "", ParteID: "", Subparte: "", ImagenDiseno: null, Observacion: "" });
        setErroresDiseño({});
    };

    const handleEliminarDiseno = (id) => {
        Swal.fire({
            title: "¿Eliminar diseño?", text: "Esta acción no se puede deshacer.",
            icon: "warning", showCancelButton: true, confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar", confirmButtonColor: C.danger
        }).then(r => {
            if (r.isConfirmed) {
                const dis = disenosAgregados.find(d => d.id === id);
                if (dis?.ImagenPreviewUrl) URL.revokeObjectURL(dis.ImagenPreviewUrl);
                setDisenosAgregados(prev => prev.filter(d => d.id !== id));
                Swal.fire({ icon: "success", title: "Diseño eliminado", timer: 1500, showConfirmButton: false });
            }
        });
    };

    // ── Agregar producto a cotización ──
    const handleAgregarACotizacion = () => {
        if (traePrenda) {
            if (!formProducto.PrendaDescripcion.trim()) { Swal.fire("Atención", "Describe la prenda que traes.", "warning"); return; }
            if (parseInt(formProducto.Cantidad) < 1) { Swal.fire("Atención", "La cantidad debe ser al menos 1.", "warning"); return; }
        } else {
            if (!productoSeleccionado) { Swal.fire("Atención", "Selecciona un producto del catálogo o activa 'Traes tu prenda'.", "warning"); return; }
            if (variantesProducto.length > 0) {
                if (coloresDisponibles.length > 0 && !formProducto.ColorID) { Swal.fire("Atención", "Debes seleccionar un color.", "warning"); return; }
                if (tallasDisponibles.length > 0 && !formProducto.TallaID) { Swal.fire("Atención", "Debes seleccionar una talla.", "warning"); return; }
                if (telasDisponibles.length > 0 && !formProducto.TipoTela) { Swal.fire("Atención", "Debes seleccionar un tipo de tela.", "warning"); return; }
                const vStock = validarStockDisponible();
                if (!vStock.valido) { Swal.fire({ icon: "error", title: "Stock insuficiente", html: `<p>${vStock.mensaje}</p>`, confirmButtonColor: C.danger }); return; }
            }
        }
        if (disenosAgregados.length === 0) { Swal.fire("Atención", "Debes agregar al menos un diseño antes de continuar.", "warning"); return; }

        const prod = {
            id: Date.now(), ProductoID: productoSeleccionado?.ProductoID || null,
            producto: productoSeleccionado, Cantidad: parseInt(formProducto.Cantidad),
            TraePrenda: traePrenda, PrendaDescripcion: traePrenda ? formProducto.PrendaDescripcion : "",
            ColorID: (!traePrenda && formProducto.ColorID) ? parseInt(formProducto.ColorID) : null,
            TallaID: (!traePrenda && formProducto.TallaID) ? parseInt(formProducto.TallaID) : null,
            TipoTela: (!traePrenda && formProducto.TipoTela) ? parseInt(formProducto.TipoTela) : null,
            color: (!traePrenda && formProducto.ColorID) ? colores.find(c => c.ColorID == formProducto.ColorID) : null,
            talla: (!traePrenda && formProducto.TallaID) ? tallas.find(t => t.TallaID == formProducto.TallaID) : null,
            tela: (!traePrenda && formProducto.TipoTela) ? telas.find(t => t.InsumoID == formProducto.TipoTela) : null,
            disenos: [...disenosAgregados]
        };
        setProductosEnCotizacion(prev => [...prev, prod]);
        setProductoSeleccionado(null); setVariantesProducto([]);
        setFormProducto({ ColorID: "", TallaID: "", TipoTela: "", Cantidad: 1, PrendaDescripcion: "" });
        setDisenosAgregados([]); setDisenoActual({ TecnicaID: "", ParteID: "", Subparte: "", ImagenDiseno: null, Observacion: "" });
        setDisenoEditando(null); setErroresDiseño({});
        Swal.fire({ icon: "success", title: "¡Agregado!", text: `Producto con ${prod.disenos.length} diseño(s)`, timer: 2000, showConfirmButton: false });
    };

    const handleEliminarProducto = (id) => {
        Swal.fire({ title: "¿Eliminar producto?", text: "Se eliminarán sus diseños.", icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar", cancelButtonText: "Cancelar", confirmButtonColor: C.danger })
            .then(r => { if (r.isConfirmed) setProductosEnCotizacion(prev => prev.filter(p => p.id !== id)); });
    };

    // ── Generar cotización ──
    const handleGenerarCotizacion = async () => {
        if (!usuario) { setMostrarLoginModal(true); return; }
        if (productosEnCotizacion.length === 0) { Swal.fire("Atención", "Debes agregar al menos un producto.", "warning"); return; }
        setEnviando(true);
        try {
            const productosConImgs = await Promise.all(productosEnCotizacion.map(async (prod) => {
                const disenos = await Promise.all(prod.disenos.map(async (dis) => {
                    if (!dis.ImagenDiseno) return dis;
                    try {
                        const fd = new FormData(); fd.append('imagen', dis.ImagenDiseno);
                        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/upload-diseno`, { method: 'POST', body: fd });
                        const d = await r.json();
                        return { ...dis, ImagenNombre: d.filename };
                    } catch { return dis; }
                }));
                return { ...prod, disenos };
            }));

            const detalles = productosConImgs.map(prod => {
                const base = {
                    ProductoID: prod.ProductoID || null, Cantidad: prod.Cantidad,
                    TraePrenda: prod.TraePrenda, PrendaDescripcion: prod.PrendaDescripcion || "",
                    tecnicas: prod.disenos.map(dis => ({
                        TecnicaID: dis.TecnicaID, ParteID: dis.ParteID,
                        ImagenDiseño: dis.ImagenNombre,
                        Observaciones: [dis.Subparte ? `Subparte: ${dis.Subparte}` : null, dis.Observacion || null].filter(Boolean).join(" - "),
                        CostoTecnica: 0
                    }))
                };
                if (prod.TraePrenda) return { ...base, tallas: [], colores: [], insumos: [] };
                return {
                    ...base,
                    tallas: prod.TallaID ? [{ TallaID: prod.TallaID, Cantidad: prod.Cantidad, PrecioTalla: prod.talla?.Precio || 0 }] : [],
                    colores: prod.ColorID ? [{ ColorID: prod.ColorID, Cantidad: prod.Cantidad }] : [],
                    insumos: prod.TipoTela ? [{ InsumoID: prod.TipoTela, CantidadRequerida: prod.Cantidad }] : [],
                };
            });

            const response = await api.createCotizacionInteligente({ DocumentoID: usuario.DocumentoID, FechaCotizacion: new Date().toISOString(), detalles });
            setTipoCotizacion(response.tipo === 'cotizacion' ? 'cotización' : 'venta');
            setNumeroCotizacion(response.tipo === 'cotizacion' ? response?.cotizacion?.CotizacionID : response?.venta?.VentaID);
            setMensajeExito(response.mensaje || "");
            setMostrarExito(true);
            setProductosEnCotizacion([]); setDisenosAgregados([]); setProductoSeleccionado(null);
            setTraePrenda(false); setDisenoEditando(null);
            setFormProducto({ ColorID: "", TallaID: "", TipoTela: "", Cantidad: 1, PrendaDescripcion: "" });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || err?.message || "Error al procesar", confirmButtonColor: C.danger });
        } finally { setEnviando(false); }
    };

    const validacionStock = validarStockDisponible();
    const totalDisenos = productosEnCotizacion.reduce((s, p) => s + p.disenos.length, 0);
    const productosFiltrados = productos.filter(p => p.Nombre?.toLowerCase().includes(busquedaProducto.toLowerCase()));

    // ── Campo de error ──
    const ErrorMsg = ({ campo }) => erroresDiseño[campo] ? (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.danger, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Outfit',sans-serif" }}>
            <FaExclamationTriangle size={9} /> {erroresDiseño[campo]}
        </p>
    ) : null;

    // ── Loading ──
    if (cargando) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: `4px solid ${C.border}`, borderTop: `4px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes modalIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
                <p style={{ color: C.muted, fontSize: 14 }}>Cargando catálogos...</p>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                .dis-row:hover { background: ${C.accentSoft} !important; }
                .prod-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 32px rgba(79,142,247,0.18) !important; border-color: ${C.accent} !important; }
                .prod-card { transition: all 0.22s cubic-bezier(.4,0,.2,1) !important; }
                ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
            `}</style>

            <NavbarComponent />

            {/* ── HERO ── */}
            <section style={{ background: C.navyDeep, position: "relative", overflow: "hidden", padding: "52px 32px 42px", textAlign: "center" }}>
                <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, background: "radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, right: -40, width: 300, height: 300, background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, marginBottom: 16, fontFamily: "'Outfit',sans-serif" }}>
                        <FaStar size={9} /> Cotización personalizada
                    </div>
                    <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 10px", fontFamily: "'Outfit',sans-serif" }}>
                        Crea tu <span style={{ background: "linear-gradient(90deg,#4f8ef7,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cotización</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 480, margin: "0 auto", fontFamily: "'Outfit',sans-serif" }}>
                        Selecciona tus productos, configura los diseños y recibe tu presupuesto en horas.
                    </p>
                    {usuario && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "6px 16px" }}>
                            <FaUser size={11} style={{ color: C.accent }} />
                            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>{usuario.Nombre}</span>
                        </div>
                    )}
                </div>
            </section>
            <div style={{ height: 3, background: "linear-gradient(90deg,#4f8ef7 0%,#7c3aed 50%,#4f8ef7 100%)" }} />

            {/* ── MODALES ── */}
            {/* Login */}
            <Modal open={mostrarLoginModal} onClose={() => { }} title="Autenticación requerida" subtitle="Debes iniciar sesión para continuar" accentColor={C.navyGrad} maxWidth={420}
                footer={<Btn onClick={handleIniciarSesion} style={{background: C.navyGrad, color: "#fff"}}><FaArrowRight size={12} /> Iniciar Sesión</Btn>}>
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: C.accent }}>
                        <FaUser />
                    </div>
                    <p style={{ color: C.muted, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>Para crear una cotización necesitas tener una cuenta activa.</p>
                </div>
            </Modal>

            {/* Éxito */}
            <Modal open={mostrarExito} onClose={() => setMostrarExito(false)}
                title={tipoCotizacion === 'cotización' ? '¡Cotización generada!' : '¡Pedido registrado!'}
                accentColor="linear-gradient(90deg,#16a34a,#15803d)" maxWidth={460}
                footer={<Btn variant="success" style={{ background: C.success, color: "#ffff" }} onClick={() => setMostrarExito(false)}><FaCheck size={12} /> Entendido</Btn>}>
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: C.successSoft, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 32, color: C.success }}>
                        <FaCheckCircle />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: "0 0 8px", fontFamily: "'Outfit',sans-serif" }}>
                        {tipoCotizacion === 'cotización' ? 'Estamos cotizando tu pedido' : 'Tu pedido fue registrado'}
                    </p>
                    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px", fontFamily: "'Outfit',sans-serif" }}>{mensajeExito}</p>
                    <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 12, padding: "12px 20px", display: "inline-block" }}>
                        <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Número de {tipoCotizacion}</p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.accent, fontFamily: "'Outfit',sans-serif" }}>#{numeroCotizacion}</p>
                    </div>
                </div>
            </Modal>

            {/* Visualización de diseño */}
            <Modal open={mostrarModalVisualizacion && !!disenoVisualizando} onClose={() => setMostrarModalVisualizacion(false)}
                title="Detalle del Diseño" accentColor="linear-gradient(90deg,#7c3aed,#4f8ef7)" maxWidth={600}
                footer={<Btn variant="ghost" style={{ background: C.danger, color: "#ffffff"}} onClick={() => setMostrarModalVisualizacion(false)}>Cerrar</Btn>}>
                {disenoVisualizando && (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                            {[["Técnica", disenoVisualizando.tecnica?.Nombre || "N/A"], ["Parte", disenoVisualizando.parte?.Nombre || "N/A"], ["Subparte", disenoVisualizando.Subparte || "No especificada"], ["Archivo", disenoVisualizando.ImagenNombre]].map(([k, v]) => (
                                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.border}` }}>
                                    <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>{k}</p>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{v}</p>
                                </div>
                            ))}
                        </div>
                        {disenoVisualizando.Observacion && (
                            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>Observaciones</p>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{disenoVisualizando.Observacion}</p>
                            </div>
                        )}
                        {disenoVisualizando.ImagenPreviewUrl && (
                            <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.bg }}>
                                <p style={{ margin: 0, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, fontFamily: "'Outfit',sans-serif" }}>Vista previa</p>
                                <div style={{ padding: 16, textAlign: "center" }}>
                                    <img src={disenoVisualizando.ImagenPreviewUrl} alt="Diseño" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", borderRadius: 10 }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Selección de productos */}
            <Modal open={mostrarModalProductos} onClose={() => setMostrarModalProductos(false)} title="Catálogo de Productos" subtitle={`${productosFiltrados.length} producto(s) disponible(s)`} accentColor={C.navyGrad} maxWidth={760}>
                <div style={{ marginBottom: 16, position: "relative" }}>
                    <input placeholder="Buscar producto..." value={busquedaProducto} onChange={e => setBusquedaProducto(e.target.value)}
                        style={{ width: "100%", padding: "10px 14px 10px 40px", border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", background: C.bg }}
                        onFocus={e => { e.target.style.borderColor = C.accent; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>🔍</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                    {productosFiltrados.map(prod => (
                        <div key={prod.ProductoID} className="prod-card" style={{ borderRadius: 14, border: `1.5px solid ${C.border}`, overflow: "hidden", cursor: "pointer", background: C.white }}
                            onClick={() => { setProductoSeleccionado(prod); setMostrarModalProductos(false); setBusquedaProducto(""); Swal.fire({ icon: "success", title: prod.Nombre, timer: 1400, showConfirmButton: false }); }}>
                            <img src={prod.ImagenProducto || "https://via.placeholder.com/200?text=Producto"} alt={prod.Nombre} style={{ width: "100%", height: 140, objectFit: "cover" }} onError={e => { e.target.src = "https://via.placeholder.com/200?text=Producto"; }} />
                            <div style={{ padding: "10px 12px" }}>
                                <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 13, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{prod.Nombre}</p>
                                <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif", lineHeight: 1.4 }}>{prod.Descripcion?.slice(0, 60) || "Sin descripción"}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {productosFiltrados.length === 0 && <p style={{ textAlign: "center", color: C.muted, padding: "32px 0", fontFamily: "'Outfit',sans-serif" }}>No se encontraron productos</p>}
            </Modal>

            {/* ── CUERPO PRINCIPAL ── */}
            <div style={{ background: C.bg, minHeight: "100vh", padding: "32px 24px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 22, alignItems: "start" }}>

                    {/* ── COLUMNA IZQUIERDA ── */}
                    <div>

                        {/* SECCIÓN 1: PRODUCTO */}
                        <SectionCard title="Configuración del Producto" subtitle="Elige producto y variante" icon={<FaTshirt />} accentColor={C.accent}>
                            {/* Toggle prenda propia */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: traePrenda ? C.warningSoft : C.accentSoft, border: `1.5px solid ${traePrenda ? C.warningBorder : C.accentBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, cursor: "pointer" }}
                                onClick={() => { setTraePrenda(p => !p); setProductoSeleccionado(null); setVariantesProducto([]); setFormProducto({ ColorID: "", TallaID: "", TipoTela: "", Cantidad: 1, PrendaDescripcion: "" }); }}>
                                <div>
                                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: traePrenda ? C.warning : C.accent }}>¿Traes tu propia prenda?</p>
                                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Activa esta opción si no necesitas comprar la prenda</p>
                                </div>
                                <div style={{ width: 44, height: 24, borderRadius: 12, background: traePrenda ? C.warning : C.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                    <div style={{ position: "absolute", top: 3, left: traePrenda ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                                </div>
                            </div>

                            {traePrenda ? (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                                    <div style={{ background: C.warningSoft, border: `1px solid ${C.warningBorder}`, borderRadius: 10, padding: "10px 14px" }}>
                                        <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>✓ Modo prenda propia — no se validará stock ni se requerirá seleccionar producto.</p>
                                    </div>
                                    <div>
                                        <Label required>Descripción de la prenda</Label>
                                        <TextareaBase rows={3} placeholder="Ej: Camiseta negra de algodón, talla M, cuello redondo..." value={formProducto.PrendaDescripcion} onChange={e => setFormProducto({ ...formProducto, PrendaDescripcion: e.target.value })} />
                                        {formProducto.PrendaDescripcion.trim() === "" && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Describe el tipo, material, color y talla de tu prenda.</p>}
                                    </div>
                                    <div>
                                        <Label required>Cantidad de prendas</Label>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <button onClick={() => setFormProducto(p => ({ ...p, Cantidad: Math.max(1, (parseInt(p.Cantidad) || 1) - 1) }))} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}><FaMinus size={10} /></button>
                                            <InputBase type="number" min="1" value={formProducto.Cantidad} onChange={e => setFormProducto({ ...formProducto, Cantidad: parseInt(e.target.value) || 1 })} style={{ textAlign: "center", width: 80 }} />
                                            <button onClick={() => setFormProducto(p => ({ ...p, Cantidad: (parseInt(p.Cantidad) || 1) + 1 }))} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}><FaPlus size={10} /></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    {/* Selector de producto */}
                                    <div style={{ gridColumn: "1/-1" }}>
                                        <Label required>Producto del catálogo</Label>
                                        <button onClick={() => setMostrarModalProductos(true)} style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${productoSeleccionado ? C.success : C.border}`, borderRadius: 12, background: productoSeleccionado ? C.successSoft : C.bg, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s" }}>
                                            {productoSeleccionado?.ImagenProducto
                                                ? <img src={productoSeleccionado.ImagenProducto} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                                                : <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}><FaBoxOpen /></div>
                                            }
                                            <div style={{ textAlign: "left" }}>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: productoSeleccionado ? C.success : C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                                    {productoSeleccionado ? productoSeleccionado.Nombre : "Seleccionar producto"}
                                                </p>
                                                <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{productoSeleccionado ? "Haz clic para cambiar" : "Haz clic para ver el catálogo"}</p>
                                            </div>
                                            {productoSeleccionado ? <FaCheckCircle style={{ marginLeft: "auto", color: C.success }} /> : <FaChevronRight style={{ marginLeft: "auto", color: C.muted }} size={12} />}
                                        </button>
                                    </div>

                                    {/* Color */}
                                    <div>
                                        <Label required>Color</Label>
                                        <SelectBase value={formProducto.ColorID} onChange={e => setFormProducto({ ...formProducto, ColorID: e.target.value, TallaID: "", TipoTela: "" })}>
                                            <option value="">{coloresDisponibles.length === 0 ? "Sin colores disponibles" : "Selecciona color..."}</option>
                                            {coloresDisponibles.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                        </SelectBase>
                                    </div>
                                    {/* Talla */}
                                    <div>
                                        <Label required>Talla</Label>
                                        <SelectBase value={formProducto.TallaID} onChange={e => setFormProducto({ ...formProducto, TallaID: e.target.value, TipoTela: "" })} style={{ opacity: !formProducto.ColorID ? 0.6 : 1 }}>
                                            <option value="">{!formProducto.ColorID ? "Primero selecciona color" : tallasDisponibles.length === 0 ? "Sin tallas disponibles" : "Selecciona talla..."}</option>
                                            {tallasDisponibles.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre}{t.Precio ? ` (+$${t.Precio?.toLocaleString('es-CO')})` : ""}</option>)}
                                        </SelectBase>
                                    </div>
                                    {/* Tela */}
                                    <div>
                                        <Label required>Tipo de Tela</Label>
                                        <SelectBase value={formProducto.TipoTela} onChange={e => setFormProducto({ ...formProducto, TipoTela: e.target.value })} style={{ opacity: (!formProducto.ColorID || !formProducto.TallaID) ? 0.6 : 1 }}>
                                            <option value="">{(!formProducto.ColorID || !formProducto.TallaID) ? "Primero selecciona color y talla" : telasDisponibles.length === 0 ? "Sin telas disponibles" : "Selecciona tela..."}</option>
                                            {telasDisponibles.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre}{t.PrecioTela ? ` (+$${t.PrecioTela?.toLocaleString('es-CO')})` : ""}</option>)}
                                        </SelectBase>
                                    </div>
                                    {/* Cantidad */}
                                    <div>
                                        <Label required>Cantidad</Label>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <button onClick={() => setFormProducto(p => ({ ...p, Cantidad: Math.max(1, (parseInt(p.Cantidad) || 1) - 1) }))} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}><FaMinus size={10} /></button>
                                            <InputBase type="number" min="1" value={formProducto.Cantidad} onChange={e => setFormProducto({ ...formProducto, Cantidad: parseInt(e.target.value) || 1 })} style={{ textAlign: "center", flex: 1 }} />
                                            <button onClick={() => setFormProducto(p => ({ ...p, Cantidad: (parseInt(p.Cantidad) || 1) + 1 }))} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}><FaPlus size={10} /></button>
                                        </div>
                                        {validacionStock.stockDisponible !== undefined && (
                                            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Stock disponible: <strong>{validacionStock.stockDisponible}</strong> unidades</p>
                                        )}
                                        {!validacionStock.valido && (
                                            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.danger, display: "flex", alignItems: "center", gap: 4 }}><FaExclamationTriangle size={9} /> {validacionStock.mensaje}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {/* SECCIÓN 2: DISEÑOS */}
                        <SectionCard
                            title={disenoEditando ? "Editando Diseño" : "Agregar Diseño"}
                            subtitle="Configura la técnica y sube tu archivo"
                            icon={<FaPalette />}
                            accentColor={C.purple}
                            headerRight={disenoEditando && <InfoBadge type="warning">Modo edición</InfoBadge>}
                        >
                            {/* Error de duplicado global */}
                            {erroresDiseño.duplicado && (
                                <div style={{ background: C.dangerSoft, border: `1.5px solid ${C.dangerBorder}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                                    <p style={{ margin: 0, fontSize: 12, color: C.danger, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif" }}>
                                        <FaExclamationTriangle /> {erroresDiseño.duplicado}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                {/* Técnica */}
                                <div>
                                    <Label required>Técnica de estampado</Label>
                                    <SelectBase value={disenoActual.TecnicaID} onChange={e => { setDisenoActual({ ...disenoActual, TecnicaID: e.target.value }); setErroresDiseño(p => ({ ...p, TecnicaID: undefined, duplicado: undefined })); }} style={{ borderColor: erroresDiseño.TecnicaID ? C.danger : C.border }}>
                                        <option value="">Selecciona técnica...</option>
                                        {tecnicas.filter(t => t.Estado).map(t => <option key={t.TecnicaID} value={t.TecnicaID}>{t.Nombre}</option>)}
                                    </SelectBase>
                                    <ErrorMsg campo="TecnicaID" />
                                </div>
                                {/* Parte */}
                                <div>
                                    <Label required>Parte de la prenda</Label>
                                    <SelectBase value={disenoActual.ParteID} onChange={e => { setDisenoActual({ ...disenoActual, ParteID: e.target.value }); setErroresDiseño(p => ({ ...p, ParteID: undefined, duplicado: undefined })); }} style={{ borderColor: erroresDiseño.ParteID ? C.danger : C.border }}>
                                        <option value="">Selecciona parte...</option>
                                        {partes.map(p => <option key={p.ParteID} value={p.ParteID}>{p.Nombre}</option>)}
                                    </SelectBase>
                                    <ErrorMsg campo="ParteID" />
                                </div>
                                {/* Subparte */}
                                <div>
                                    <Label>Subparte <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", fontSize: 10 }}>(opcional)</span></Label>
                                    <InputBase placeholder="Ej: Superior izquierdo, centro..." value={disenoActual.Subparte} onChange={e => setDisenoActual({ ...disenoActual, Subparte: e.target.value })} />
                                </div>
                                {/* Imagen */}
                                <div>
                                    <Label required={!disenoEditando}>
                                        Imagen del diseño
                                        {disenoEditando && <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", fontSize: 10 }}> (opcional al editar)</span>}
                                    </Label>
                                    <label style={{ display: "block", cursor: "pointer" }}>
                                        <div style={{ border: `2px dashed ${erroresDiseño.ImagenDiseno ? C.danger : disenoActual.ImagenDiseno ? C.success : C.border}`, borderRadius: 10, padding: "12px 14px", background: disenoActual.ImagenDiseno ? C.successSoft : C.bg, transition: "all 0.2s", textAlign: "center" }}>
                                            {disenoActual.ImagenDiseno ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                                                    <img src={URL.createObjectURL(disenoActual.ImagenDiseno)} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
                                                    <div style={{ textAlign: "left" }}>
                                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.success, fontFamily: "'Outfit',sans-serif" }}>✓ {disenoActual.ImagenDiseno.name}</p>
                                                        <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{(disenoActual.ImagenDiseno.size / 1024).toFixed(0)} KB</p>
                                                    </div>
                                                </div>
                                            ) : disenoEditando ? (
                                                <div>
                                                    <FaUpload style={{ color: C.muted, marginBottom: 4 }} />
                                                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Mantiene: <strong>{disenoEditando.ImagenNombre}</strong></p>
                                                    <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Haz clic para reemplazar</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <FaUpload style={{ color: C.muted, marginBottom: 4, fontSize: 18 }} />
                                                    <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>JPG, PNG, GIF, WEBP · máx. 5MB</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" style={{ display: "none" }}
                                            onChange={e => { setDisenoActual({ ...disenoActual, ImagenDiseno: e.target.files[0] || null }); setErroresDiseño(p => ({ ...p, ImagenDiseno: undefined })); }}
                                            key={disenoActual.TecnicaID + disenoActual.ParteID + (disenoEditando?.id || "")} />
                                    </label>
                                    <ErrorMsg campo="ImagenDiseno" />
                                </div>
                                {/* Observaciones */}
                                <div style={{ gridColumn: "1/-1" }}>
                                    <Label>Observaciones <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", fontSize: 10 }}>(máx. 500 caracteres)</span></Label>
                                    <TextareaBase rows={2} placeholder="Detalles del diseño: colores, tamaño, posición exacta..."
                                        value={disenoActual.Observacion}
                                        onChange={e => { setDisenoActual({ ...disenoActual, Observacion: e.target.value }); setErroresDiseño(p => ({ ...p, Observacion: undefined })); }}
                                        style={{ borderColor: erroresDiseño.Observacion ? C.danger : C.border }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                                        <ErrorMsg campo="Observacion" />
                                        <p style={{ margin: 0, fontSize: 10, color: disenoActual.Observacion.length > 500 ? C.danger : C.muted, fontFamily: "'Outfit',sans-serif", marginLeft: "auto" }}>{disenoActual.Observacion.length}/500</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botones diseño */}
                            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                                {disenoEditando ? (
                                    <>
                                        <Btn variant="success" onClick={handleGuardarEdicion} style={{ background: C.warningBorder, color: "#0f172a", flex: 1 }}><FaCheck size={12} /> Guardar cambios</Btn>
                                        <Btn variant="ghost" onClick={handleCancelarEdicion} style={{ background: C.danger, color: "#ffffff"}}><FaTimes size={12} /> Cancelar</Btn>
                                    </>
                                ) : (
                                    <Btn variant="accent" onClick={handleAgregarDiseno} style={{ background: C.navyGrad, color: "#fff", flex: 1 }}><FaPlus size={12} /> Agregar diseño</Btn>
                                )} 
                            </div>

                            {/* Tabla de diseños */}
                            {disenosAgregados.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>Diseños agregados ({disenosAgregados.length})</p>
                                        <InfoBadge type="purple">{disenosAgregados.length} diseño{disenosAgregados.length !== 1 ? "s" : ""}</InfoBadge>
                                    </div>
                                    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                                            <thead>
                                                <tr style={{ background: C.navyGrad }}>
                                                    {["#", "Previa", "Técnica", "Parte", "Subparte", "Acciones"].map((h, i) => (
                                                        <th key={i} style={{ padding: "10px 12px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "left", letterSpacing: "0.05em" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {disenosAgregados.map((dis, idx) => (
                                                    <tr key={dis.id} className="dis-row" style={{ background: idx % 2 === 0 ? "#fff" : C.bg, transition: "background 0.15s" }}>
                                                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.muted }}>#{idx + 1}</td>
                                                        <td style={{ padding: "8px 12px" }}>
                                                            {dis.ImagenPreviewUrl
                                                                ? <img src={dis.ImagenPreviewUrl} alt="preview" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 7, border: `1.5px solid ${C.border}` }} />
                                                                : <div style={{ width: 38, height: 38, borderRadius: 7, background: C.purpleSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.purple }}><FaImage size={14} /></div>
                                                            }
                                                        </td>
                                                        <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>{dis.tecnica?.Nombre}</td>
                                                        <td style={{ padding: "10px 12px", color: C.text }}>{dis.parte?.Nombre}</td>
                                                        <td style={{ padding: "10px 12px", color: C.muted }}>{dis.Subparte || "—"}</td>
                                                        <td style={{ padding: "8px 12px" }}>
                                                            <div style={{ display: "flex", gap: 5 }}>
                                                                {[
                                                                    { icon: <FaEye size={11} />, color: C.accent, title: "Ver", fn: () => { setDisenoVisualizando(dis); setMostrarModalVisualizacion(true); } },
                                                                    { icon: <FaEdit size={11} />, color: C.warning, title: "Editar", fn: () => handleEditarDiseno(dis) },
                                                                    { icon: <FaTrash size={11} />, color: C.danger, title: "Eliminar", fn: () => handleEliminarDiseno(dis.id) },
                                                                ].map(({ icon, color, title, fn }) => (
                                                                    <button key={title} onClick={fn} title={title} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${color}20`, background: `${color}0d`, color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; }}>
                                                                        {icon}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {/* BOTÓN AGREGAR AL CARRITO */}
                        <div style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.border}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                            <div>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>¿Listo con este producto?</p>
                                <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                    {disenosAgregados.length === 0 ? "Agrega al menos un diseño antes de continuar." : `${disenosAgregados.length} diseño(s) configurado(s) → se agregarán con el producto.`}
                                </p>
                            </div>
                            <Btn variant="primary" style={{ background: C.navyGrad, color: "#fff", width: "320px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"  }} size="lg" onClick={handleAgregarACotizacion}
                                disabled={disenosAgregados.length === 0 || (!traePrenda && !validacionStock.valido)}>
                                <FaShoppingCart size={14} /> Agregar al carrito
                            </Btn>
                        </div>
                    </div>

                    {/* ── COLUMNA DERECHA: RESUMEN ── */}
                    <div style={{ position: "sticky", top: 20 }}>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            {[
                                { val: productosEnCotizacion.length, label: "Productos", color: C.accent, bg: C.accentSoft, icon: <FaShoppingCart /> },
                                { val: totalDisenos, label: "Diseños", color: C.purple, bg: C.purpleSoft, icon: <FaPalette /> },
                            ].map(({ val, label, color, bg, icon }) => (
                                <div key={label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{icon}</div>
                                    <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 900, color, fontFamily: "'Outfit',sans-serif" }}>{val}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Diseños en curso */}
                        {disenosAgregados.length > 0 && (
                            <div style={{ background: C.purpleSoft, border: `1.5px solid #ddd6fe`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
                                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>Diseños en curso ({disenosAgregados.length})</p>
                                {disenosAgregados.map((dis, i) => (
                                    <div key={dis.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                                        {dis.ImagenPreviewUrl
                                            ? <img src={dis.ImagenPreviewUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                                            : <div style={{ width: 28, height: 28, borderRadius: 6, background: "#ddd6fe", flexShrink: 0 }} />
                                        }
                                        <p style={{ margin: 0, fontSize: 12, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                            <strong>#{i + 1}</strong> {dis.tecnica?.Nombre} · {dis.parte?.Nombre}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Lista de productos en cotización */}
                        <SectionCard title="Tu Cotización" subtitle={productosEnCotizacion.length === 0 ? "Sin productos aún" : `${productosEnCotizacion.length} producto(s)`} icon={<FaLayerGroup />} accentColor={C.success}>
                            {productosEnCotizacion.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "16px 0" }}>
                                    <FaBoxOpen size={28} style={{ color: C.muted, opacity: 0.3, marginBottom: 8 }} />
                                    <p style={{ color: C.muted, fontSize: 12, margin: 0, fontFamily: "'Outfit',sans-serif" }}>Agrega productos para comenzar</p>
                                </div>
                            ) : (
                                productosEnCotizacion.map((prod, idx) => (
                                    <div key={prod.id} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, animation: "fadeUp 0.3s ease" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                                {prod.TraePrenda ? "Prenda propia" : ` ${prod.producto?.Nombre || "Producto"}`}
                                            </p>
                                            <button onClick={() => handleEliminarProducto(prod.id)} style={{ background: C.dangerSoft, border: `1px solid ${C.dangerBorder}`, borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.danger }}>
                                                <FaTimes size={9} />
                                            </button>
                                        </div>
                                        {prod.TraePrenda
                                            ? <p style={{ margin: "0 0 4px", fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{prod.PrendaDescripcion}</p>
                                            : <p style={{ margin: "0 0 4px", fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                                {[prod.color?.Nombre, prod.talla?.Nombre, prod.tela?.Nombre].filter(Boolean).join(" · ")}
                                            </p>
                                        }
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Cantidad: <strong>{prod.Cantidad}</strong></p>
                                            <InfoBadge type="purple">{prod.disenos.length} diseño{prod.disenos.length !== 1 ? "s" : ""}</InfoBadge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </SectionCard>

                        {/* Botones finales */}
                        {productosEnCotizacion.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                                <Btn variant="success" style={{ width: "100%", background: C.success, color: "#ffff", justifyContent: "center" }} size="lg" onClick={handleGenerarCotizacion} disabled={enviando}>
                                    {enviando
                                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Procesando...</>
                                        : <><FaCheckCircle size={14} /> Generar cotización</>
                                    }
                                </Btn>
                                <Btn variant="ghost" size="md" style={{ width: "100%", background: C.danger, color: "#ffffff", justifyContent: "center" }}
                                    onClick={() => Swal.fire({ title: "¿Limpiar todo?", text: "Se eliminarán todos los productos.", icon: "warning", showCancelButton: true, confirmButtonText: "Sí, limpiar", cancelButtonText: "Cancelar", confirmButtonColor: C.danger })
                                        .then(r => { if (r.isConfirmed) { setProductosEnCotizacion([]); setDisenosAgregados([]); setProductoSeleccionado(null); setTraePrenda(false); setDisenoEditando(null); setFormProducto({ ColorID: "", TallaID: "", TipoTela: "", Cantidad: 1, PrendaDescripcion: "" }); } })}>
                                    <FaTrash size={12} /> Limpiar todo
                                </Btn>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default CotizacionLanding;