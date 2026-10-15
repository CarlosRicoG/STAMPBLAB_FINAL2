import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { createColor, updateColor, getColores } from "../../Services/api-colores/colores.js";

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

const ColoresForm = ({ onClose, onSave, colorEdit, coloresExistentes = [] }) => {
    const [formData, setFormData] = useState({ Nombre: "" });
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (colorEdit) setFormData({ Nombre: colorEdit.Nombre || "" });
    }, [colorEdit]);

    const validarNombre = (nombre) => {
        const trimmed = nombre.trim();
        if (!trimmed) return "El nombre no puede estar vacío.";
        if (trimmed.length < 3) return "El nombre debe tener al menos 3 caracteres.";
        if (trimmed.length > 15) return "El nombre no puede tener más de 15 caracteres.";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(trimmed)) return "Solo se permiten letras y espacios.";
        const isDuplicate = coloresExistentes.some(
            c => c.Nombre.toLowerCase().trim() === trimmed.toLowerCase() && c.ColorID !== colorEdit?.ColorID
        );
        if (isDuplicate) return "Ya existe un color con este nombre.";
        return "";
    };

    const handleChange = (e) => {
        const { value } = e.target;
        setFormData({ Nombre: value });
        if (touched) setError(validarNombre(value));
    };

    const handleBlur = (e) => {
        setTouched(true);
        setError(validarNombre(e.target.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched(true);
        const mensajeError = validarNombre(formData.Nombre);
        if (mensajeError) { setError(mensajeError); return; }

        try {
            let result;
            if (colorEdit) {
                result = await updateColor({ ColorID: colorEdit.ColorID, ...formData });
            } else {
                result = await createColor(formData);
            }

            if (result.estado) {
                Swal.fire({ toast: true, icon: "success", title: colorEdit ? "Color actualizado" : "Color creado", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
                onSave();
            } else {
                throw new Error(result.mensaje);
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "Error al guardar el color", confirmButtonColor: C.danger });
        }
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                        {colorEdit ? "Editar Color" : "Crear Color"}
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
                            {colorEdit ? `Editando: ${colorEdit.Nombre}` : "Nuevo Color"}
                        </p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                            {colorEdit ? `ID: ${colorEdit.ColorID}` : "Completa el formulario para agregar un nuevo color"}
                        </p>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: "24px" }}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                Nombre del Color <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.Nombre}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ej: Azul Cielo, Rojo Carmesí..."
                                maxLength={15}
                                style={{
                                    width: "100%", padding: "10px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
                                    border: `1.5px solid ${touched && error ? C.danger : C.border}`,
                                    borderRadius: 10, outline: "none", color: "#0f172a",
                                    background: touched && error ? "#fef2f2" : "#fff",
                                    transition: "border-color 0.15s",
                                }}
                                onFocus={e => { e.target.style.borderColor = touched && error ? C.danger : C.accent; }}
                                onBlurCapture={e => { e.target.style.borderColor = touched && error ? C.danger : C.border; }}
                            />
                            {touched && error && (
                                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{error}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28 }}>
                            <button onClick={handleSubmit} disabled={touched && !!error}
                                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: touched && error ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: touched && error ? 0.6 : 1 }}
                                onMouseEnter={e => { if (!error || !touched) e.currentTarget.style.background = "#2d3f6e"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                                {colorEdit ? "Actualizar Color" : "Crear Color"}
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

export default ColoresForm;