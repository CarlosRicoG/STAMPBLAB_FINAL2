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

const ProveedoresForm = ({ onClose, onSave, proveedor = null, proveedores = [] }) => {
    const [formData, setFormData] = useState({ nit: "", nombre: "", correo: "", telefono: "", direccion: "", estado: true });
    const [errors, setErrors] = useState({ nit: "", nombre: "", correo: "", telefono: "", direccion: "" });
    const [touched, setTouched] = useState({ nit: false, nombre: false, correo: false, telefono: false, direccion: false });
    const [verificandoCorreo, setVerificandoCorreo] = useState(false);

    useEffect(() => {
        if (proveedor) {
            setFormData({ nit: proveedor.Nit || "", nombre: proveedor.Nombre || "", correo: proveedor.Correo || "", telefono: proveedor.Telefono || "", direccion: proveedor.Direccion || "", estado: proveedor.Estado !== undefined ? proveedor.Estado : true });
        } else {
            setFormData({ nit: "", nombre: "", correo: "", telefono: "", direccion: "", estado: true });
        }
        setErrors({ nit: "", nombre: "", correo: "", telefono: "", direccion: "" });
        setTouched({ nit: false, nombre: false, correo: false, telefono: false, direccion: false });
    }, [proveedor]);

    /* ── Validaciones ── */
    const validateNit = (v) => {
        const n = v.trim();
        if (!n) return "El NIT es obligatorio.";
        if (!/^[\d-]+$/.test(n)) return "El NIT solo puede contener números y guiones.";
        const digits = n.replace(/-/g, "");
        if (digits.length < 5) return "El NIT debe tener al menos 5 dígitos.";
        if (digits.length > 12) return "El NIT no puede tener más de 12 dígitos.";
        if (/--/.test(n) || n.startsWith("-") || n.endsWith("-")) return "Formato de NIT inválido.";
        return "";
    };
    const validateNombre = (v) => {
        const n = v.trim();
        if (!n) return "El nombre es obligatorio.";
        if (n.length < 3) return "El nombre debe tener al menos 3 caracteres.";
        if (n.length > 45) return "El nombre no puede exceder 45 caracteres.";
        if (/^\d/.test(n)) return "El nombre no puede comenzar con números.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(n)) return "El nombre debe comenzar con una letra.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&.\-]*$/.test(n)) return "Solo se permiten letras, números, espacios y (&.-)";
        return "";
    };
    const validateCorreo = (v) => {
        const c = v.trim().toLowerCase();
        if (!c) return "El correo es obligatorio.";
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(c)) return "Formato de correo inválido.";
        if (c.length < 10) return "El correo debe tener al menos 10 caracteres.";
        if (c.length > 254) return "El correo no puede exceder 254 caracteres.";
        return "";
    };
    const validateTelefono = (v) => {
        const t = v.trim();
        if (!t) return "El teléfono es obligatorio.";
        if (!/^\+?[\d\s]*$/.test(t)) return "Formato inválido. Use solo números (ej: +573001234567).";
        const digits = t.replace(/[\s+]/g, "");
        if (digits.length < 7) return "El teléfono debe tener al menos 7 dígitos.";
        if (digits.length > 15) return "El teléfono no puede exceder 15 dígitos.";
        return "";
    };
    const validateDireccion = (v) => {
        const d = v.trim();
        if (!d) return "La dirección es obligatoria.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.\-#,°/()]+$/.test(d)) return "Caracteres no permitidos en la dirección.";
        if (d.length < 5) return "La dirección debe tener al menos 5 caracteres.";
        if (d.length > 200) return "La dirección no puede exceder 200 caracteres.";
        return "";
    };

    const verificarCorreoUnico = (correo) =>
        proveedores.some(p => p.Correo.toLowerCase() === correo.toLowerCase() && p.Nit !== formData.nit);

    const validate = (name, value) => {
        if (name === "nit") return validateNit(value);
        if (name === "nombre") return validateNombre(value);
        if (name === "correo") return validateCorreo(value);
        if (name === "telefono") return validateTelefono(value);
        if (name === "direccion") return validateDireccion(value);
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === "estado" ? value === "true" : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (touched[name] && name !== "correo") setErrors(pe => ({ ...pe, [name]: validate(name, value) }));
        if (touched[name] && name === "correo") setErrors(pe => ({ ...pe, correo: validateCorreo(value) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(pt => ({ ...pt, [name]: true }));
        if (name === "correo") {
            const formatError = validateCorreo(value);
            setErrors(pe => ({ ...pe, correo: formatError }));
            if (!formatError && value.trim()) {
                setVerificandoCorreo(true);
                setTimeout(() => {
                    if (verificarCorreoUnico(value.trim().toLowerCase())) {
                        setErrors(pe => ({ ...pe, correo: "Este correo ya está registrado." }));
                    }
                    setVerificandoCorreo(false);
                }, 300);
            }
        } else {
            setErrors(pe => ({ ...pe, [name]: validate(name, value) }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {
            nit: validateNit(formData.nit),
            nombre: validateNombre(formData.nombre),
            correo: validateCorreo(formData.correo),
            telefono: validateTelefono(formData.telefono),
            direccion: validateDireccion(formData.direccion),
        };
        setErrors(errs);
        setTouched({ nit: true, nombre: true, correo: true, telefono: true, direccion: true });
        if (Object.values(errs).some(Boolean)) return;

        if (!proveedor || proveedor.Correo.toLowerCase() !== formData.correo.trim().toLowerCase()) {
            if (verificarCorreoUnico(formData.correo.trim().toLowerCase())) {
                setErrors(pe => ({ ...pe, correo: "Este correo ya está registrado." }));
                return;
            }
        }
        onSave({ Nit: formData.nit.trim(), Nombre: formData.nombre.trim(), Correo: formData.correo.trim().toLowerCase(), Telefono: formData.telefono.trim(), Direccion: formData.direccion.trim(), Estado: formData.estado });
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                        {proveedor ? "Editar Proveedor" : "Crear Proveedor"}
                    </h4>
                    <button onClick={onClose}
                        style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        ✕
                    </button>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>
                    <div style={{ background: C.navyGrad, padding: "16px 24px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#fff" }}>
                            {proveedor ? `Editando: ${proveedor.Nombre}` : "Nuevo Proveedor"}
                        </p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                            {proveedor ? `NIT: ${proveedor.Nit}` : "Completa el formulario para agregar un nuevo proveedor"}
                        </p>
                    </div>

                    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* NIT + Nombre */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <Label required>NIT</Label>
                                <input name="nit" type="text" value={formData.nit} onChange={handleChange} onBlur={handleBlur}
                                    placeholder="Ej: 900123456 o 900123456-7" maxLength={17}
                                    style={inputStyle(errors.nit, touched.nit)}
                                    onFocus={e => e.target.style.borderColor = touched.nit && errors.nit ? C.danger : C.accent}
                                    onBlurCapture={e => e.target.style.borderColor = touched.nit && errors.nit ? C.danger : C.border} />
                                <FieldError msg={touched.nit && errors.nit} />
                                {proveedor && (
                                    <p style={{ margin: "6px 0 0", fontSize: 11, color: C.warning, fontWeight: 600 }}>
                                        ⚠️ Tenga cuidado al modificar el NIT.
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label required>Nombre</Label>
                                <input name="nombre" type="text" value={formData.nombre} onChange={handleChange} onBlur={handleBlur}
                                    placeholder="Nombre o razón social del proveedor" maxLength={100}
                                    style={inputStyle(errors.nombre, touched.nombre)}
                                    onFocus={e => e.target.style.borderColor = touched.nombre && errors.nombre ? C.danger : C.accent}
                                    onBlurCapture={e => e.target.style.borderColor = touched.nombre && errors.nombre ? C.danger : C.border} />
                                <FieldError msg={touched.nombre && errors.nombre} />
                            </div>
                        </div>

                        {/* Correo + Teléfono */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <Label required>Correo Electrónico</Label>
                                <div style={{ position: "relative" }}>
                                    <input name="correo" type="email" value={formData.correo} onChange={handleChange} onBlur={handleBlur}
                                        placeholder="ejemplo@correo.com" maxLength={254} disabled={verificandoCorreo}
                                        style={{ ...inputStyle(errors.correo, touched.correo), paddingRight: verificandoCorreo ? 40 : 14 }}
                                        onFocus={e => e.target.style.borderColor = touched.correo && errors.correo ? C.danger : C.accent}
                                        onBlurCapture={e => e.target.style.borderColor = touched.correo && errors.correo ? C.danger : C.border} />
                                    {verificandoCorreo && (
                                        <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)" }}>
                                            <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                        </div>
                                    )}
                                </div>
                                {verificandoCorreo && <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>Verificando disponibilidad...</p>}
                                <FieldError msg={!verificandoCorreo && touched.correo && errors.correo} />
                            </div>
                            <div>
                                <Label required>Teléfono</Label>
                                <input name="telefono" type="tel" value={formData.telefono} onChange={handleChange} onBlur={handleBlur}
                                    placeholder="Ej: 3001234567 o +573001234567" maxLength={15}
                                    style={inputStyle(errors.telefono, touched.telefono)}
                                    onFocus={e => e.target.style.borderColor = touched.telefono && errors.telefono ? C.danger : C.accent}
                                    onBlurCapture={e => e.target.style.borderColor = touched.telefono && errors.telefono ? C.danger : C.border} />
                                <FieldError msg={touched.telefono && errors.telefono} />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <Label required>Dirección</Label>
                            <input name="direccion" type="text" value={formData.direccion} onChange={handleChange} onBlur={handleBlur}
                                placeholder="Dirección completa del proveedor" maxLength={200}
                                style={inputStyle(errors.direccion, touched.direccion)}
                                onFocus={e => e.target.style.borderColor = touched.direccion && errors.direccion ? C.danger : C.accent}
                                onBlurCapture={e => e.target.style.borderColor = touched.direccion && errors.direccion ? C.danger : C.border} />
                            <FieldError msg={touched.direccion && errors.direccion} />
                        </div>

                        {/* Estado */}
                        <div>
                            <Label>Estado</Label>
                            <select name="estado" value={formData.estado.toString()} onChange={handleChange}
                                style={{ ...inputStyle(false, false), cursor: "pointer" }}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>

                        {/* Botones */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
                            <button onClick={handleSubmit} disabled={verificandoCorreo}
                                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: verificandoCorreo ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: verificandoCorreo ? 0.7 : 1 }}
                                onMouseEnter={e => { if (!verificandoCorreo) e.currentTarget.style.background = "#2d3f6e"; }}
                                onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                                {proveedor ? "Actualizar Proveedor" : "Crear Proveedor"}
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

export default ProveedoresForm;