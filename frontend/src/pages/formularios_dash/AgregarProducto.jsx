import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaArrowLeft, FaCheck, FaPlus, FaTrash, FaImage, FaEdit, FaBoxOpen } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { createProducto, getProductoById, updateProducto } from "../../Services/api-productos/productos";
import { createVariante, getVariantesByProducto, updateVariante, deleteVariante } from "../../Services/api-productos/variantes";
import { getColores, getTallas, getTelas } from "../../Services/api-productos/atributos";

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
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

/* ── Subcomponentes reutilizables ── */
const Label = ({ children, required }) => (
    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5, display: "block", fontFamily: "'Outfit',sans-serif" }}>
        {children} {required && <span style={{ color: C.danger }}>*</span>}
    </label>
);

const inputBase = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 9,
    padding: "9px 13px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
    color: "#0f172a", outline: "none", transition: "border-color 0.2s",
    background: "#fff",
};

const InputField = ({ error, valid, ...props }) => (
    <input {...props} style={{
        ...inputBase,
        borderColor: error ? C.danger : valid ? C.success : C.border,
    }}
        onFocus={e => { if (!error) e.target.style.borderColor = C.accent; }}
        onBlur={e => { e.target.style.borderColor = error ? C.danger : valid ? C.success : C.border; }}
    />
);

const SelectField = ({ children, ...props }) => (
    <select {...props} style={{ ...inputBase, cursor: "pointer", appearance: "auto" }}>
        {children}
    </select>
);

const ErrorMsg = ({ msg }) => msg ? <p style={{ color: C.danger, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{msg}</p> : null;
const ValidMsg = ({ show, msg = "Válido ✓" }) => show ? <p style={{ color: C.success, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{msg}</p> : null;
const HintMsg = ({ msg }) => <p style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{msg}</p>;

const Badge = ({ type, children }) => {
    const map = {
        success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
        warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
        danger: { bg: "#fef2f2", color: C.danger, border: "#fecaca" },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        navy: { bg: C.navy, color: "#fff", border: C.navy },
        muted: { bg: "#f1f5f9", color: C.muted, border: "#e2e8f0" },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};

const TH = { background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700, padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

const SectionTitle = ({ children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 20, borderRadius: 4, background: C.navy }} />
        <h5 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{children}</h5>
    </div>
);

/* ══════════════════════════════════════════════════════════ */
const AgregarProducto = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const modoEdicion = Boolean(id);

    const [producto, setProducto] = useState({ Nombre: "", Descripcion: "", PrecioBase: "", ImagenProducto: "" });
    const [errores, setErrores] = useState({ Nombre: "", Descripcion: "", PrecioBase: "" });
    const [productoOriginal, setProdOrig] = useState(null);
    const [previewError, setPreviewError] = useState(false);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [variantes, setVariantes] = useState([]);
    const [variantesOrig, setVarOrig] = useState([]);
    const [paso, setPaso] = useState(1);
    const [productoCreado, setProdCreado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [editandoProd, setEditandoProd] = useState(false);
    const [nuevaVariante, setNuevaVariante] = useState({ ColorID: "", TallaID: "", TelaID: "", Stock: 0, Estado: true });

    /* ── Validaciones ── */
    const validarNombre = v => {
        if (!v?.trim()) return "El nombre es obligatorio";
        if (v.trim().length < 3) return "Mínimo 3 caracteres";
        if (v.trim().length > 30) return "Máximo 30 caracteres";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-()]+$/.test(v)) return "Solo letras, espacios, guiones y paréntesis";
        return "";
    };
    const validarDescripcion = v => (v?.length > 50 ? "Máximo 50 caracteres" : "");
    const validarPrecio = v => {
        if (!v) return "El precio es obligatorio";
        const n = parseFloat(v);
        if (isNaN(n) || n < 0) return "Precio inválido";
        if (n > 99999999.99) return "Precio excede el máximo";
        return "";
    };
    const validarStock = v => {
        const n = parseInt(v);
        if (isNaN(n) || n < 0) return "Stock inválido";
        if (n > 999999) return "Stock excede el máximo";
        return "";
    };

    const getPrecioTalla = id => parseFloat(tallas.find(t => t.TallaID === parseInt(id))?.Precio) || 0;
    const getPrecioTela = id => { if (!id) return 0; return parseFloat(telas.find(t => t.InsumoID === parseInt(id))?.PrecioTela) || 0; };
    const calcPrecio = (tid, teid) => (parseFloat(productoCreado?.PrecioBase) || 0) + getPrecioTalla(tid) + getPrecioTela(teid);

    useEffect(() => {
        (async () => {
            try {
                const [cR, tR, teR] = await Promise.all([getColores(), getTallas(), getTelas()]);
                setColores(cR.datos || cR); setTallas(tR.datos || tR); setTelas(teR || []);
            } catch { Swal.fire("Error", "No se pudieron cargar atributos", "error"); }
        })();
        if (modoEdicion) cargarProductoExistente();
    }, [id]);

    const cargarProductoExistente = async () => {
        setCargandoDatos(true);
        try {
            const [pR, vR] = await Promise.all([getProductoById(id), getVariantesByProducto(id)]);
            const pd = pR.datos || pR; const vd = vR.datos || vR;
            const pi = { Nombre: pd.Nombre, Descripcion: pd.Descripcion || "", PrecioBase: pd.PrecioBase || "", ImagenProducto: pd.ImagenProducto || "" };
            setProducto(pi); setProdOrig(JSON.parse(JSON.stringify(pi))); setProdCreado(pd);
            const vf = vd.map(v => ({ InventarioID: v.InventarioID, ColorID: v.ColorID, TallaID: v.TallaID, TelaID: v.TelaID || null, Stock: v.Stock, Estado: v.Estado, nombreColor: v.color?.Nombre, nombreTalla: v.talla?.Nombre, nombreTela: v.tela?.Nombre || "Sin tela", precioTalla: v.talla?.Precio || 0, precioTela: v.tela?.PrecioTela || 0, esExistente: true }));
            setVariantes(vf); setVarOrig(JSON.parse(JSON.stringify(vf))); setPaso(2);
        } catch { Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el producto" }).then(() => navigate("/dashboard/productos")); }
        finally { setCargandoDatos(false); }
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setProducto(p => ({ ...p, [name]: value }));
        const err = name === "Nombre" ? validarNombre(value) : name === "Descripcion" ? validarDescripcion(value) : name === "PrecioBase" ? validarPrecio(value) : "";
        setErrores(p => ({ ...p, [name]: err }));
        if (name === "ImagenProducto") setPreviewError(false);
    };

    const handleFile = e => {
        const file = e.target.files[0]; if (!file) return;
        if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"].includes(file.type))
            return Swal.fire("Formato inválido", "Solo JPG, PNG, GIF, WEBP, SVG", "error");
        if (file.size > 5 * 1024 * 1024) return Swal.fire("Archivo muy grande", "Máximo 5MB", "error");
        const r = new FileReader();
        r.onloadend = () => { setProducto(p => ({ ...p, ImagenProducto: r.result })); setPreviewError(false); };
        r.readAsDataURL(file);
    };

    const handleGuardarProducto = async e => {
        e.preventDefault();
        const eN = validarNombre(producto.Nombre), eD = validarDescripcion(producto.Descripcion), eP = validarPrecio(producto.PrecioBase);
        setErrores({ Nombre: eN, Descripcion: eD, PrecioBase: eP });
        if (eN || eD || eP) return Swal.fire({ icon: "error", title: "Errores de validación", text: "Corrige los errores antes de continuar" });
        setCargando(true);
        try {
            let np;
            if (modoEdicion) {
                const r = await updateProducto(id, producto); np = r.datos || r.producto;
                Swal.fire({ title: "¡Actualizado!", icon: "success", timer: 1500, showConfirmButton: false });
                setProdOrig(JSON.parse(JSON.stringify(producto))); setProdCreado(np); setEditandoProd(false);
            } else {
                const r = await createProducto(producto); np = r.datos || r.producto;
                Swal.fire({ title: "¡Producto creado!", text: "Ahora agrega las variantes", icon: "success", timer: 2000, showConfirmButton: false });
            }
            setProdCreado(np); setPaso(2);
        } catch (err) { Swal.fire("Error", err.response?.data?.mensaje || "No se pudo guardar", "error"); }
        finally { setCargando(false); }
    };

    const handleAgregarVariante = () => {
        const { ColorID, TallaID, TelaID, Stock } = nuevaVariante;
        if (!ColorID || !TallaID) return Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Selecciona al menos color y talla" });
        const eS = validarStock(Stock); if (eS) return Swal.fire({ icon: "error", title: "Stock inválido", text: eS });
        if (variantes.some(v => v.ColorID === parseInt(ColorID) && v.TallaID === parseInt(TallaID) && v.TelaID === (TelaID ? parseInt(TelaID) : null)))
            return Swal.fire({ icon: "warning", title: "Variante duplicada", text: "Ya existe esa combinación" });
        const talla = tallas.find(t => t.TallaID === parseInt(TallaID)), tela = TelaID ? telas.find(t => t.InsumoID === parseInt(TelaID)) : null;
        setVariantes(p => [...p, {
            ColorID: parseInt(ColorID), TallaID: parseInt(TallaID), TelaID: TelaID ? parseInt(TelaID) : null,
            Stock: parseInt(Stock) || 0, Estado: nuevaVariante.Estado,
            nombreColor: colores.find(c => c.ColorID === parseInt(ColorID))?.Nombre,
            nombreTalla: talla?.Nombre, nombreTela: tela?.Nombre || "Sin tela",
            precioTalla: talla?.Precio || 0, precioTela: tela?.PrecioTela || 0, esExistente: false
        }]);
        setNuevaVariante({ ColorID: "", TallaID: "", TelaID: "", Stock: 0, Estado: true });
        Swal.fire({ icon: "success", title: "Variante agregada", timer: 1200, showConfirmButton: false });
    };

    const handleEditarVariante = idx => {
        const v = variantes[idx];
        Swal.fire({
            title: "Editar Variante",
            html: `<p style="font-weight:700;color:#1a2540;margin-bottom:16px">${v.nombreColor} — ${v.nombreTalla}</p>
        <label style="font-size:12px;font-weight:700;color:#374151">Tela</label>
        <select id="tela" class="form-select mb-3">
          <option value="">Sin tela</option>
          ${telas.map(t => `<option value="${t.InsumoID}" ${v.TelaID === t.InsumoID ? "selected" : ""}>${t.Nombre} ($${parseFloat(t.PrecioTela || 0).toLocaleString()})</option>`).join("")}
        </select>
        <label style="font-size:12px;font-weight:700;color:#374151">Stock</label>
        <input type="number" id="stock" class="form-control mb-3" value="${v.Stock}" min="0">
        <label style="font-size:12px;font-weight:700;color:#374151">Estado</label>
        <select id="estado" class="form-select">
          <option value="true" ${v.Estado ? "selected" : ""}>Disponible</option>
          <option value="false" ${!v.Estado ? "selected" : ""}>No disponible</option>
        </select>`,
            showCancelButton: true, confirmButtonText: "Guardar", cancelButtonText: "Cancelar",
            confirmButtonColor: C.navy,
            preConfirm: () => {
                const s = parseInt(document.getElementById("stock").value);
                const eS = validarStock(s); if (eS) { Swal.showValidationMessage(eS); return false; }
                return { telaId: document.getElementById("tela").value || null, stock: s, estado: document.getElementById("estado").value === "true" };
            }
        }).then(r => {
            if (r.isConfirmed) {
                const { telaId, stock, estado } = r.value;
                const ts = telaId ? telas.find(t => t.InsumoID === parseInt(telaId)) : null;
                setVariantes(p => p.map((x, i) => i === idx ? { ...x, TelaID: telaId ? parseInt(telaId) : null, nombreTela: ts?.Nombre || "Sin tela", precioTela: ts?.PrecioTela || 0, Stock: stock, Estado: estado } : x));
                Swal.fire({ icon: "success", title: "Variante actualizada", timer: 1200, showConfirmButton: false });
            }
        });
    };

    const handleEliminarVariante = async idx => {
        const v = variantes[idx];
        const r = await Swal.fire({ title: "¿Eliminar variante?", text: `${v.nombreColor} — ${v.nombreTalla} — ${v.nombreTela}`, icon: "warning", showCancelButton: true, confirmButtonColor: C.danger, cancelButtonColor: C.navy, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar" });
        if (!r.isConfirmed) return;
        if (v.esExistente && v.InventarioID) {
            setCargando(true);
            try { await deleteVariante(v.InventarioID); Swal.fire({ icon: "success", title: "Variante eliminada", timer: 1200, showConfirmButton: false }); }
            catch { Swal.fire("Error", "No se pudo eliminar", "error"); setCargando(false); return; }
            finally { setCargando(false); }
        }
        setVariantes(p => p.filter((_, i) => i !== idx));
    };

    const handleGuardarVariantes = async () => {
        if (variantes.length === 0 && !modoEdicion) {
            const r = await Swal.fire({ title: "Sin variantes", text: "¿Guardar sin variantes?", icon: "question", showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar" });
            if (!r.isConfirmed) return;
        }
        setCargando(true);
        try {
            await Promise.all(variantes.map(v => {
                if (v.esExistente) {
                    const orig = variantesOrig.find(o => o.InventarioID === v.InventarioID);
                    if (!orig || orig.Stock !== v.Stock || orig.Estado !== v.Estado || orig.TelaID !== v.TelaID)
                        return updateVariante(v.InventarioID, { Stock: v.Stock, Estado: v.Estado, TelaID: v.TelaID });
                } else {
                    return createVariante({ ProductoID: productoCreado.ProductoID, ColorID: v.ColorID, TallaID: v.TallaID, TelaID: v.TelaID, Stock: v.Stock, Estado: v.Estado });
                }
            }).filter(Boolean));
            Swal.fire({ title: modoEdicion ? "¡Actualizado!" : "¡Éxito!", text: modoEdicion ? "Producto actualizado" : `Creado con ${variantes.length} variante(s)`, icon: "success", timer: 2000, showConfirmButton: false });
            setTimeout(() => navigate("/dashboard/productos"), 2000);
        } catch { Swal.fire("Error", "Problema al guardar variantes", "error"); }
        finally { setCargando(false); }
    };

    const handleVolver = () => {
        if (paso === 2) {
            Swal.fire({ title: modoEdicion ? "¿Descartar cambios?" : "¿Volver al paso anterior?", text: "Los cambios no guardados se perderán", icon: "warning", showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar", confirmButtonColor: C.danger }).then(r => {
                if (r.isConfirmed) { modoEdicion ? navigate("/dashboard/productos") : (setPaso(1), setVariantes([])); }
            });
        } else { navigate("/dashboard/productos"); }
    };

    if (cargandoDatos) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Cargando producto...</p>
            </div>
        </div>
    );

    const showPreview = producto.ImagenProducto && !previewError;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .var-row:hover { background: ${C.accentSoft} !important; }
        select.form-select, input.form-control { font-family: 'Outfit', sans-serif !important; }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                    <button onClick={handleVolver} disabled={cargando} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; }}>
                        <FaArrowLeft size={14} />
                    </button>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                            {modoEdicion ? (paso === 1 ? "Editar Producto" : "Gestionar Producto y Variantes") : (paso === 1 ? "Crear Nuevo Producto" : "Agregar Variantes")}
                        </h4>
                    </div>
                </div>

                {/* ── STEPPER ── */}
                {!modoEdicion && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                        {[1, 2].map((n, i) => (
                            <React.Fragment key={n}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                        background: paso >= n ? C.navy : "#e2e8f0", color: paso >= n ? "#fff" : C.muted,
                                        fontWeight: 800, fontSize: 14, fontFamily: "'Outfit',sans-serif",
                                        boxShadow: paso >= n ? `0 4px 12px ${C.navy}44` : "none", transition: "all 0.3s",
                                    }}>
                                        {paso > n ? <FaCheck size={13} /> : n}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: paso >= n ? C.navy : C.muted }}>{n === 1 ? "Datos" : "Variantes"}</span>
                                </div>
                                {i === 0 && (
                                    <div style={{ width: 80, height: 2, background: paso >= 2 ? C.navy : "#e2e8f0", margin: "19px 16px 0", borderRadius: 2, transition: "background 0.3s" }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ════════════════════════════════════════
            PASO 1: Datos del producto
        ════════════════════════════════════════ */}
                {paso === 1 && (
                    <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 18, padding: "32px 36px", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", animation: "fadeIn 0.3s ease" }}>
                        <SectionTitle>Información del Producto</SectionTitle>
                        <form onSubmit={handleGuardarProducto}>

                            {/* Nombre */}
                            <div style={{ marginBottom: 20 }}>
                                <Label required>Nombre del Producto</Label>
                                <InputField name="Nombre" type="text" value={producto.Nombre} onChange={handleChange} placeholder="Ej: Camiseta Básica" error={errores.Nombre} valid={!errores.Nombre && producto.Nombre} required />
                                <ErrorMsg msg={errores.Nombre} />
                                <ValidMsg show={!errores.Nombre && !!producto.Nombre} msg="Nombre válido ✓" />
                                <HintMsg msg="Solo letras, espacios, guiones y paréntesis" />
                            </div>

                            {/* Descripción */}
                            <div style={{ marginBottom: 20 }}>
                                <Label>Descripción</Label>
                                <textarea name="Descripcion" value={producto.Descripcion} onChange={handleChange} rows={3} maxLength={50} placeholder="Describe el producto..."
                                    style={{ ...inputBase, resize: "vertical", borderColor: errores.Descripcion ? C.danger : C.border }}
                                    onFocus={e => { if (!errores.Descripcion) e.target.style.borderColor = C.accent; }}
                                    onBlur={e => { e.target.style.borderColor = errores.Descripcion ? C.danger : C.border; }} />
                                <ErrorMsg msg={errores.Descripcion} />
                                <HintMsg msg={`${producto.Descripcion.length}/50 caracteres`} />
                            </div>

                            {/* Precio Base */}
                            <div style={{ marginBottom: 20 }}>
                                <Label required>Precio Base</Label>
                                <InputField name="PrecioBase" type="number" value={producto.PrecioBase || ""} onChange={handleChange} placeholder="Ej: 15000" min="0" step="0.01" error={errores.PrecioBase} valid={!errores.PrecioBase && producto.PrecioBase} required />
                                <ErrorMsg msg={errores.PrecioBase} />
                                <ValidMsg show={!errores.PrecioBase && !!producto.PrecioBase} msg="Precio válido ✓" />
                                <HintMsg msg="Precio base sin adicionales de talla o tela" />
                            </div>

                            {/* Imagen */}
                            <div style={{ marginBottom: 24 }}>
                                <Label required={!modoEdicion}>
                                    <FaImage style={{ marginRight: 6 }} /> Imagen del Producto
                                </Label>
                                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" onChange={handleFile} required={!modoEdicion}
                                    style={{ ...inputBase, padding: "8px 12px", cursor: "pointer" }} />
                                <HintMsg msg="Formatos: JPG, PNG, GIF, WEBP, SVG · Máximo 5MB" />
                            </div>

                            {/* Preview */}
                            {showPreview && (
                                <div style={{ marginBottom: 24, borderRadius: 14, overflow: "hidden", border: `1.5px solid ${C.accentBorder}`, background: C.accentSoft }}>
                                    <div style={{ background: C.navyGrad, padding: "8px 16px" }}>
                                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Vista Previa</span>
                                    </div>
                                    <div style={{ padding: 16, textAlign: "center" }}>
                                        <img src={producto.ImagenProducto} alt="Preview" onError={() => setPreviewError(true)} style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 10, objectFit: "contain" }} />
                                    </div>
                                </div>
                            )}

                            {/* Botones */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                <button type="button" onClick={() => navigate("/dashboard/productos")} disabled={cargando}
                                    style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={cargando}
                                    style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: cargando ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: cargando ? 0.7 : 1 }}>
                                    {cargando ? <><div style={{ width: 14, height: 14, border: "2px solid #fff4", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />{modoEdicion ? "Actualizando..." : "Creando..."}</> : (modoEdicion ? "Actualizar y Continuar" : "Crear y Continuar")}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ════════════════════════════════════════
            PASO 2: Variantes
        ════════════════════════════════════════ */}
                {paso === 2 && productoCreado && (
                    <div style={{ maxWidth: 1100, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>

                        {/* Card info producto */}
                        <div style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <SectionTitle>Información del Producto</SectionTitle>
                                {modoEdicion && !editandoProd && (
                                    <button onClick={() => setEditandoProd(true)}
                                        style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                                        <FaEdit size={11} /> Editar datos
                                    </button>
                                )}
                            </div>

                            {editandoProd ? (
                                <form onSubmit={handleGuardarProducto}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                        <div>
                                            <Label required>Nombre</Label>
                                            <InputField name="Nombre" type="text" value={producto.Nombre} onChange={handleChange} error={errores.Nombre} />
                                            <ErrorMsg msg={errores.Nombre} />
                                        </div>
                                        <div>
                                            <Label required>Precio Base</Label>
                                            <InputField name="PrecioBase" type="number" value={producto.PrecioBase} onChange={handleChange} min="0" step="0.01" error={errores.PrecioBase} />
                                            <ErrorMsg msg={errores.PrecioBase} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <Label>Descripción</Label>
                                        <textarea name="Descripcion" value={producto.Descripcion} onChange={handleChange} rows={2} maxLength={50}
                                            style={{ ...inputBase, resize: "vertical" }} />
                                        <HintMsg msg={`${producto.Descripcion.length}/50`} />
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <Label>Nueva Imagen</Label>
                                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" onChange={handleFile}
                                            style={{ ...inputBase, padding: "8px 12px", cursor: "pointer" }} />
                                        {showPreview && <img src={producto.ImagenProducto} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 10 }} onError={() => setPreviewError(true)} />}
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button type="button" onClick={() => { setProducto(JSON.parse(JSON.stringify(productoOriginal))); setErrores({ Nombre: "", Descripcion: "", PrecioBase: "" }); setEditandoProd(false); }}
                                            style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={cargando}
                                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                            {cargando ? "Guardando..." : "Guardar cambios"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 20, alignItems: "start" }}>
                                    {showPreview
                                        ? <img src={producto.ImagenProducto} alt={producto.Nombre} style={{ width: 130, height: 130, objectFit: "cover", borderRadius: 12, border: `2px solid ${C.border}` }} onError={() => setPreviewError(true)} />
                                        : <div style={{ width: 130, height: 130, borderRadius: 12, background: C.accentSoft, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 28 }} /></div>
                                    }
                                    <div>
                                        <h5 style={{ margin: "0 0 4px", color: C.navy, fontWeight: 800 }}>{producto.Nombre}</h5>
                                        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 14px" }}>{producto.Descripcion || "Sin descripción"}</p>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <Badge type="navy">${(productoCreado.PrecioBase || 0).toLocaleString()} base</Badge>
                                            <Badge type="accent">{variantes.length} variante{variantes.length !== 1 ? "s" : ""}</Badge>
                                            <Badge type="success">Stock: {variantes.reduce((a, v) => a + (v.Stock || 0), 0)}</Badge>
                                        </div>
                                        <p style={{ margin: "10px 0 0", color: C.muted, fontSize: 11 }}>ID: {productoCreado.ProductoID}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Gestión de variantes */}
                        {!editandoProd && (
                            <>
                                {/* Form nueva variante */}
                                <div style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
                                    <SectionTitle>{modoEdicion ? "Gestionar Variantes" : "Agregar Variantes"}</SectionTitle>

                                    <div style={{ background: C.accentSoft, borderRadius: 14, padding: "20px 22px", border: `1.5px solid ${C.accentBorder}`, marginBottom: 24 }}>
                                        <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: 1 }}>Nueva Variante</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                                            <div>
                                                <Label required>Color</Label>
                                                <SelectField value={nuevaVariante.ColorID} onChange={e => setNuevaVariante(p => ({ ...p, ColorID: e.target.value }))}>
                                                    <option value="">Seleccionar...</option>
                                                    {colores.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                                </SelectField>
                                            </div>
                                            <div>
                                                <Label required>Talla</Label>
                                                <SelectField value={nuevaVariante.TallaID} onChange={e => setNuevaVariante(p => ({ ...p, TallaID: e.target.value }))}>
                                                    <option value="">Seleccionar...</option>
                                                    {tallas.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre}</option>)}
                                                </SelectField>
                                            </div>
                                            <div>
                                                <Label>Tela</Label>
                                                <SelectField value={nuevaVariante.TelaID} onChange={e => setNuevaVariante(p => ({ ...p, TelaID: e.target.value }))}>
                                                    <option value="">Sin tela</option>
                                                    {telas.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre} (${parseFloat(t.PrecioTela || 0).toLocaleString()})</option>)}
                                                </SelectField>
                                            </div>
                                            <div>
                                                <Label>Stock</Label>
                                                <InputField type="number" min="0" max="999999" value={nuevaVariante.Stock} onChange={e => setNuevaVariante(p => ({ ...p, Stock: e.target.value }))} />
                                                <HintMsg msg="Máx: 999,999" />
                                            </div>
                                            <div>
                                                <Label>Estado</Label>
                                                <SelectField value={nuevaVariante.Estado} onChange={e => setNuevaVariante(p => ({ ...p, Estado: e.target.value === "true" }))}>
                                                    <option value="true">Disponible</option>
                                                    <option value="false">No disponible</option>
                                                </SelectField>
                                            </div>
                                            <div style={{ paddingBottom: errores.PrecioBase ? 0 : 0 }}>
                                                <button type="button" onClick={handleAgregarVariante} title="Agregar variante"
                                                    style={{ width: 40, height: 40, borderRadius: 10, background: C.success, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <FaPlus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabla variantes */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>Variantes</span>
                                        <Badge type="accent">{variantes.length}</Badge>
                                    </div>

                                    {variantes.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "32px", background: C.accentSoft, borderRadius: 14, border: `1.5px dashed ${C.accentBorder}` }}>
                                            <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No hay variantes. Agrega al menos una combinación de color, talla y tela.</p>
                                        </div>
                                    ) : (
                                        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                                <thead>
                                                    <tr>
                                                        {["Color", "Talla", "Tela", "Precio Total", "Stock", "Estado", "Acciones"].map((h, i) => (
                                                            <th key={i} style={{ ...TH, textAlign: i >= 4 ? "center" : "left" }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variantes.map((v, idx) => (
                                                        <tr key={idx} className="var-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s" }}>
                                                            <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{v.nombreColor}</td>
                                                            <td style={{ padding: "11px 14px", color: C.muted }}>{v.nombreTalla}</td>
                                                            <td style={{ padding: "11px 14px" }}><Badge type={v.TelaID ? "accent" : "muted"}>{v.nombreTela}</Badge></td>
                                                            <td style={{ padding: "11px 14px" }}>
                                                                <span style={{ fontWeight: 700, color: C.success }}>${calcPrecio(v.TallaID, v.TelaID).toLocaleString()}</span>
                                                                <br />
                                                                <small style={{ color: C.muted, fontSize: 10 }}>Base: ${parseFloat(productoCreado.PrecioBase || 0).toLocaleString()} + T: ${parseFloat(v.precioTalla || 0).toLocaleString()} + Te: ${parseFloat(v.precioTela || 0).toLocaleString()}</small>
                                                            </td>
                                                            <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                                <Badge type={v.Stock > 10 ? "success" : v.Stock > 0 ? "warning" : "danger"}>{v.Stock}</Badge>
                                                            </td>
                                                            <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                                <Badge type={v.Estado ? "success" : "muted"}>{v.Estado ? "Disponible" : "No disp."}</Badge>
                                                            </td>
                                                            <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                                    <button onClick={() => handleEditarVariante(idx)} title="Editar"
                                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                        <FaEdit size={12} />
                                                                    </button>
                                                                    <button onClick={() => handleEliminarVariante(idx)} title="Eliminar"
                                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Botones finales */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                    <button onClick={handleVolver} disabled={cargando}
                                        style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                        {modoEdicion ? "Cancelar" : "Volver"}
                                    </button>
                                    <button onClick={handleGuardarVariantes} disabled={cargando}
                                        style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: cargando ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: cargando ? 0.7 : 1 }}>
                                        {cargando ? <><div style={{ width: 14, height: 14, border: "2px solid #fff4", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Guardando...</> : <><FaCheck size={13} />{modoEdicion ? "Guardar Cambios" : "Finalizar"}</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default AgregarProducto;