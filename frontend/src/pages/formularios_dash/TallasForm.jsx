import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { createTalla, updateTalla, getTallas } from "../../Services/api-tallas/tallas";

/* ── Tokens de color (mismos que Técnicas) ── */
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

const tallasConPrecio = ["XXL", "XXXL"];

const TallasForm = ({ onClose, onSave, tallaEdit, tallasExistentes = [] }) => {
    const [formData, setFormData] = useState({ Nombre: "", Precio: "" });
    const [errors, setErrors] = useState({ Nombre: "", Precio: "" });
    const [touched, setTouched] = useState({ Nombre: false, Precio: false });

    useEffect(() => {
        if (tallaEdit) {
            setFormData({ Nombre: tallaEdit.Nombre || "", Precio: tallaEdit.Precio ?? "" });
        }
    }, [tallaEdit]);

    const validarNombre = (valor) => {
        const trimmed = valor.trim();
        if (!trimmed) return "El nombre no puede estar vacío.";
        if (trimmed.length < 1) return "El nombre debe tener al menos 1 carácter.";
        if (trimmed.length > 4) return "El nombre no puede tener más de 4 caracteres.";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmed)) return "Solo se permiten letras y espacios.";
        const isDuplicate = tallasExistentes.some(
            t => t.Nombre.toLowerCase().trim() === trimmed.toLowerCase() && t.TallaID !== tallaEdit?.TallaID
        );
        if (isDuplicate) return "Ya existe una talla con este nombre.";
        return "";
    };

    const validarPrecio = (valor, nombre) => {
        if (!tallasConPrecio.includes(nombre.toUpperCase())) return "";
        if (valor === "" || valor === null || valor === undefined) return "El precio es obligatorio para esta talla.";
        if (isNaN(valor)) return "El precio debe ser un número válido.";
        if (Number(valor) < 0) return "El precio no puede ser negativo.";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);

        if (touched[name]) {
            const err = name === "Nombre" ? validarNombre(value) : validarPrecio(value, updated.Nombre);
            setErrors(prev => ({ ...prev, [name]: err }));
        }

        // Re-validate Precio when Nombre changes (to show/hide price field correctly)
        if (name === "Nombre" && touched.Precio) {
            setErrors(prev => ({ ...prev, Precio: validarPrecio(updated.Precio, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const err = name === "Nombre" ? validarNombre(value) : validarPrecio(value, formData.Nombre);
        setErrors(prev => ({ ...prev, [name]: err }));
    };

    const validateAll = () => {
        const nombreErr = validarNombre(formData.Nombre);
        const precioErr = validarPrecio(formData.Precio, formData.Nombre);
        setErrors({ Nombre: nombreErr, Precio: precioErr });
        setTouched({ Nombre: true, Precio: true });
        return !nombreErr && !precioErr;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateAll()) return;

        const dataEnviar = {
            Nombre: formData.Nombre.trim(),
            Precio: tallasConPrecio.includes(formData.Nombre.toUpperCase())
                ? (formData.Precio !== "" && !isNaN(formData.Precio) ? Number(formData.Precio) : null)
                : null,
        };

        try {
            let result;
            if (tallaEdit) {
                result = await updateTalla(tallaEdit.TallaID, dataEnviar);
            } else {
                result = await createTalla(dataEnviar);
            }

            if (result.estado) {
                Swal.fire({ toast: true, icon: "success", title: tallaEdit ? "Talla actualizada" : "Talla creada", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
                onSave();
            } else {
                throw new Error(result.mensaje);
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo guardar la talla", confirmButtonColor: C.danger });
        }
    };

    const mostrarPrecio = tallasConPrecio.includes(formData.Nombre.toUpperCase());
    const hasErrors = !!errors.Nombre || (mostrarPrecio && !!errors.Precio);

    const inputStyle = (fieldError, isTouched) => ({
        width: "100%", padding: "10px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
        border: `1.5px solid ${isTouched && fieldError ? C.danger : C.border}`,
        borderRadius: 10, outline: "none", color: "#0f172a",
        background: isTouched && fieldError ? "#fef2f2" : "#fff",
        transition: "border-color 0.15s",
    });

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                        {tallaEdit ? "Editar Talla" : "Crear Talla"}
                    </h4>
                    <button onClick={onClose}
                        style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        ✕
                    </button>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>

                    {/* Card header */}
                    <div style={{ background: C.navyGrad, padding: "16px 24px" }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#fff" }}>
                            {tallaEdit ? `Editando: ${tallaEdit.Nombre}` : "Nueva Talla"}
                        </p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                            {tallaEdit ? `ID: ${tallaEdit.TallaID}` : "Completa el formulario para agregar una nueva talla"}
                        </p>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Nombre */}
                        <div>
                            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                Nombre de la Talla <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="Nombre"
                                value={formData.Nombre}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: S, M, L, XL, XXL"
                                maxLength={4}
                                style={inputStyle(errors.Nombre, touched.Nombre)}
                                onFocus={e => { e.target.style.borderColor = touched.Nombre && errors.Nombre ? C.danger : C.accent; }}
                            />
                            {touched.Nombre && errors.Nombre && (
                                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{errors.Nombre}</p>
                            )}
                        </div>

                        {/* Precio (solo XXL / XXXL) */}
                        {mostrarPrecio && (
                            <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 12, padding: "14px 16px" }}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                    Precio <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    name="Precio"
                                    value={formData.Precio}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Ingresa el precio"
                                    min="0"
                                    style={inputStyle(errors.Precio, touched.Precio)}
                                    onFocus={e => { e.target.style.borderColor = touched.Precio && errors.Precio ? C.danger : C.accent; }}
                                />
                                {touched.Precio && errors.Precio && (
                                    <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{errors.Precio}</p>
                                )}
                                <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted }}>
                                    Este campo solo aplica para tallas XXL y XXXL.
                                </p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
                            <button onClick={handleSubmit} disabled={hasErrors && (touched.Nombre || touched.Precio)}
                                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: hasErrors ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: hasErrors && (touched.Nombre || touched.Precio) ? 0.6 : 1 }}
                                onMouseEnter={e => { if (!hasErrors) e.currentTarget.style.background = "#2d3f6e"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                                {tallaEdit ? "Actualizar Talla" : "Crear Talla"}
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

export default TallasForm;