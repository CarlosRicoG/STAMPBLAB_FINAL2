import { useState, useEffect } from "react";

/* ── Tokens de color ── */
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

const inputStyle = (hasError, isTouched) => ({
    width: "100%", padding: "10px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
    border: `1.5px solid ${isTouched && hasError ? C.danger : C.border}`,
    borderRadius: 10, outline: "none", color: "#0f172a",
    background: isTouched && hasError ? "#fef2f2" : "#fff",
    transition: "border-color 0.15s",
});

const Label = ({ children, required }) => (
    <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
        {children} {required && <span style={{ color: C.danger }}>*</span>}
    </label>
);

const FieldError = ({ msg }) => msg
    ? <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{msg}</p>
    : null;

const InsumoForm = ({ onClose, onSave, insumoEdit = null }) => {
    const [formData, setFormData] = useState({ nombre: "", stock: "", tipo: "Otro", precioTela: "", estado: true });
    const [errors, setErrors] = useState({ nombre: "", stock: "", tipo: "", precioTela: "" });
    const [touched, setTouched] = useState({ nombre: false, stock: false, tipo: false, precioTela: false });

    useEffect(() => {
        if (insumoEdit) {
            setFormData({
                nombre: insumoEdit.Nombre || "",
                stock: insumoEdit.Stock?.toString() || "",
                tipo: insumoEdit.Tipo || "Otro",
                precioTela: insumoEdit.PrecioTela?.toString() || "",
                estado: insumoEdit.Estado !== undefined ? insumoEdit.Estado : true,
            });
        } else {
            setFormData({ nombre: "", stock: "", tipo: "Otro", precioTela: "", estado: true });
        }
        setErrors({ nombre: "", stock: "", tipo: "", precioTela: "" });
        setTouched({ nombre: false, stock: false, tipo: false, precioTela: false });
    }, [insumoEdit]);

    const validateNombre = (v) => {
        const n = v.trim();
        if (!n) return "El nombre es obligatorio.";
        if (n.length < 4) return "El nombre debe tener al menos 4 caracteres.";
        if (n.length > 50) return "El nombre no puede exceder 50 caracteres.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(n)) return "Solo se permiten letras, números, espacios, guiones y guiones bajos.";
        if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(n)) return "Debe contener al menos una letra.";
        return "";
    };
    const validateStock = (v) => {
        if (v === "" || v === null) return "El stock es obligatorio.";
        const n = Number(v);
        if (isNaN(n)) return "El stock debe ser un número válido.";
        if (!Number.isInteger(n)) return "El stock debe ser un número entero.";
        if (n < 0) return "El stock no puede ser negativo.";
        return "";
    };
    const validateTipo = (v) => (!v || !v.trim() ? "El tipo es obligatorio." : "");
    const validatePrecioTela = (v, tipo) => {
        if (tipo.toLowerCase() !== "tela") return "";
        if (v === "" || v === null) return "";
        const p = parseFloat(v);
        if (isNaN(p)) return "El precio debe ser un número válido.";
        if (p < 0) return "El precio no puede ser negativo.";
        if (p > 0 && p < 5000) return "El precio debe ser mínimo $5,000 o dejarlo en $0.";
        if (p > 100000) return "El precio no puede exceder $100,000.";
        const dec = v.toString().includes(".") ? v.toString().split(".")[1].length : 0;
        if (dec > 1) return "Solo se permite 1 decimal (ej: 6000.5).";
        return "";
    };

    const validate = (name, value, tipo = formData.tipo) => {
        if (name === "nombre") return validateNombre(value);
        if (name === "stock") return validateStock(value);
        if (name === "tipo") return validateTipo(value);
        if (name === "precioTela") return validatePrecioTela(value, tipo);
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === "estado" ? value === "true" : value;
        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            if (name === "tipo" && value.toLowerCase() !== "tela") {
                updated.precioTela = "";
                setErrors(pe => ({ ...pe, precioTela: "" }));
            }
            return updated;
        });
        if (touched[name]) {
            setErrors(pe => ({ ...pe, [name]: validate(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(pt => ({ ...pt, [name]: true }));
        setErrors(pe => ({ ...pe, [name]: validate(name, value) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {
            nombre: validateNombre(formData.nombre),
            stock: validateStock(formData.stock),
            tipo: validateTipo(formData.tipo),
            precioTela: validatePrecioTela(formData.precioTela, formData.tipo),
        };
        setErrors(errs);
        setTouched({ nombre: true, stock: true, tipo: true, precioTela: true });
        if (Object.values(errs).some(Boolean)) return;

        const insumoData = {
            Nombre: formData.nombre.trim(),
            Stock: formData.stock === "" ? 0 : parseInt(formData.stock),
            Tipo: formData.tipo,
            Estado: formData.estado,
            ...(insumoEdit && { InsumoID: insumoEdit.InsumoID }),
        };
        if (formData.tipo.toLowerCase() === "tela") {
            insumoData.PrecioTela = formData.precioTela === "" ? 0 : parseFloat(formData.precioTela);
        }
        onSave(insumoData);
    };

    const mostrarPrecioTela = formData.tipo.toLowerCase() === "tela";

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                        {insumoEdit ? "Editar Insumo" : "Crear Insumo"}
                    </h4>
                    <button onClick={onClose}
                        style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        ✕
                    </button>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>
                    <div style={{ background: C.navyGrad, padding: "16px 24px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#fff" }}>
                            {insumoEdit ? `Editando: ${insumoEdit.Nombre}` : "Nuevo Insumo"}
                        </p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                            {insumoEdit ? `ID: ${insumoEdit.InsumoID}` : "Completa el formulario para agregar un nuevo insumo"}
                        </p>
                    </div>

                    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Nombre */}
                        <div>
                            <Label required>Nombre del Insumo</Label>
                            <input name="nombre" type="text" value={formData.nombre} onChange={handleChange} onBlur={handleBlur}
                                placeholder="Ingrese el nombre del insumo" maxLength={50}
                                style={inputStyle(errors.nombre, touched.nombre)}
                                onFocus={e => e.target.style.borderColor = touched.nombre && errors.nombre ? C.danger : C.accent}
                                onBlurCapture={e => e.target.style.borderColor = touched.nombre && errors.nombre ? C.danger : C.border} />
                            <FieldError msg={touched.nombre && errors.nombre} />
                        </div>

                        {/* Tipo + Stock */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <Label required>Tipo de Insumo</Label>
                                <select name="tipo" value={formData.tipo} onChange={handleChange} onBlur={handleBlur}
                                    style={{ ...inputStyle(errors.tipo, touched.tipo), cursor: "pointer" }}>
                                    <option value="Tela">Tela</option>
                                    <option value="Material">Material</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <FieldError msg={touched.tipo && errors.tipo} />
                            </div>
                            <div>
                                <Label required>Stock</Label>
                                <input name="stock" type="number" value={formData.stock} onChange={handleChange} onBlur={handleBlur}
                                    placeholder="Cantidad disponible" min="0" step="1"
                                    style={inputStyle(errors.stock, touched.stock)}
                                    onFocus={e => e.target.style.borderColor = touched.stock && errors.stock ? C.danger : C.accent}
                                    onBlurCapture={e => e.target.style.borderColor = touched.stock && errors.stock ? C.danger : C.border} />
                                <FieldError msg={touched.stock && errors.stock} />
                            </div>
                        </div>

                        {/* Precio Tela */}
                        {mostrarPrecioTela && (
                            <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 12, padding: "14px 16px" }}>
                                <Label required>Precio de Tela (COP)</Label>
                                <input name="precioTela" type="number" value={formData.precioTela} onChange={handleChange} onBlur={handleBlur}
                                    placeholder="Ej: 6000 o 6000.5" min="0" max="100000" step="0.1"
                                    style={inputStyle(errors.precioTela, touched.precioTela)}
                                    onFocus={e => e.target.style.borderColor = touched.precioTela && errors.precioTela ? C.danger : C.accent}
                                    onBlurCapture={e => e.target.style.borderColor = touched.precioTela && errors.precioTela ? C.danger : C.border} />
                                <FieldError msg={touched.precioTela && errors.precioTela} />
                                <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>Máximo: $100,000 | Solo 1 decimal permitido</p>
                            </div>
                        )}

                        {/* Estado */}
                        <div>
                            <Label>Estado</Label>
                            <select name="estado" value={formData.estado.toString()} onChange={handleChange}
                                style={{ ...inputStyle(false, false), cursor: "pointer" }}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                            {formData.stock === "0" && (
                                <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>
                                    * Si el stock es 0, el estado será inactivo automáticamente
                                </p>
                            )}
                        </div>

                        {/* Botones */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
                            <button onClick={handleSubmit}
                                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#2d3f6e"}
                                onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                                {insumoEdit ? "Actualizar Insumo" : "Crear Insumo"}
                            </button>
                            <button onClick={onClose}
                                style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InsumoForm;