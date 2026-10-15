import { useState, useEffect } from "react";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getUsuarioById, updateUsuario } from "../../Services/api-usuarios/usuarios";
import fondoPerfil from "../../assets/images/estampadoslies.png";
import { FaUserEdit, FaLock, FaIdCard } from "react-icons/fa";

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const InputField = ({ label, type = "text", name, value, onChange, disabled, error, placeholder, readOnly, hint, required }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled || readOnly}
                readOnly={readOnly}
                placeholder={placeholder}
                style={{
                    width: "100%", padding: "10px 14px", fontSize: 13,
                    fontFamily: "'Outfit',sans-serif",
                    border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
                    borderRadius: 10, outline: "none", color: "#0f172a",
                    background: readOnly ? C.bg : error ? "#fef2f2" : "#fff",
                    transition: "border-color 0.15s",
                    opacity: (disabled && !readOnly) ? 0.7 : 1,
                    boxSizing: "border-box",
                    cursor: readOnly ? "not-allowed" : "text",
                }}
            />
            {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{error}</p>}
            {hint && !error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.muted }}>{hint}</p>}
        </div>
    );
};

const EditarPerfil = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ DocumentoID: "", Nombre: "", Correo: "", Telefono: "", Direccion: "", Contraseña: "" });

    useEffect(() => { cargarDatosUsuario(); }, []);

    const cargarDatosUsuario = async () => {
        try {
            const user = localStorage.getItem("usuario");
            if (!user) { Swal.fire({ icon: "warning", title: "No autenticado", text: "Debes iniciar sesión para acceder a esta página." }).then(() => navigate("/login")); return; }
            const userData = JSON.parse(user);
            const token = localStorage.getItem("token");
            if (!token) { navigate("/login"); return; }
            if (!userData.DocumentoID) {
                Swal.fire({ icon: "error", title: "Error", text: "Hay un problema con tu sesión. Por favor inicia sesión nuevamente." }).then(() => { localStorage.clear(); navigate("/login"); });
                return;
            }
            const response = await getUsuarioById(userData.DocumentoID);
            if (response) {
                setFormData({ DocumentoID: response.DocumentoID || "", Nombre: response.Nombre || "", Correo: response.Correo || "", Telefono: response.Telefono || "", Direccion: response.Direccion || "", Contraseña: "" });
            }
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.mensaje || error.message || "No se pudieron cargar tus datos." });
        } finally { setLoading(false); }
    };

    const validarNombre = (v) => { const n = String(v || "").trim(); if (!n) return "El nombre es obligatorio."; if (n.length < 3 || n.length > 50) return "Entre 3 y 50 caracteres."; if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]+$/.test(n)) return "Solo letras."; return ""; };
    const validarCorreo = (v) => { const c = String(v || "").trim(); if (!c) return "El correo es obligatorio."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return "Correo inválido."; return ""; };
    const validarTelefono = (v) => { const t = String(v || "").trim(); if (!t) return "El teléfono es obligatorio."; if (!/^\d+$/.test(t)) return "Solo números."; if (t.length < 7 || t.length > 10) return "Entre 7 y 10 dígitos."; return ""; };
    const validarDireccion = (v) => { const d = String(v || "").trim(); if (!d) return "La dirección es obligatoria."; return ""; };
    const validarContraseña = (v) => { if (!v) return ""; if (v.length < 4) return "Mínimo 4 caracteres."; return ""; };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        const validators = { Nombre: validarNombre, Correo: validarCorreo, Telefono: validarTelefono, Direccion: validarDireccion, Contraseña: validarContraseña };
        if (validators[name]) setErrors(prev => ({ ...prev, [name]: validators[name](value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = { Nombre: validarNombre(formData.Nombre), Correo: validarCorreo(formData.Correo), Telefono: validarTelefono(formData.Telefono), Direccion: validarDireccion(formData.Direccion), Contraseña: validarContraseña(formData.Contraseña) };
        const activos = Object.fromEntries(Object.entries(errs).filter(([, v]) => v !== ""));
        if (Object.keys(activos).length > 0) { setErrors(activos); Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Por favor corrige los errores antes de continuar.", confirmButtonColor: C.danger }); return; }
        try {
            setSaving(true);
            const dataToSend = { Nombre: formData.Nombre.trim(), Correo: formData.Correo.trim(), Telefono: formData.Telefono.trim(), Direccion: formData.Direccion.trim() };
            if (formData.Contraseña?.trim()) dataToSend.Contraseña = formData.Contraseña.trim();
            const response = await updateUsuario(formData.DocumentoID, dataToSend);
            if (response.estado) {
                Swal.fire({ icon: "success", title: "¡Perfil actualizado!", text: "Por seguridad, debes iniciar sesión nuevamente.", confirmButtonColor: C.navy }).then(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); });
            } else throw new Error(response.mensaje || "Error al actualizar perfil");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.mensaje || error.message || "Error al actualizar el perfil.", confirmButtonColor: C.danger });
        } finally { setSaving(false); }
    };

    /* ── Loading state ── */
    if (loading) {
        return (
            <>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <NavbarComponent />
                <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "'Outfit',sans-serif" }}>
                    <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: C.muted, fontSize: 14, fontWeight: 600 }}>Cargando tus datos...</p>
                </div>
                <FooterComponent />
            </>
        );
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 960, background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden", display: "flex", animation: "fadeIn 0.35s ease" }}>

                    {/* ── Panel izquierdo (formulario) ── */}
                    <div style={{ flex: 1, padding: "40px 40px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>

                        {/* Título */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaUserEdit size={16} color={C.accent} />
                                </div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Editar Perfil</p>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Actualiza tu información personal</p>
                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* Sección: Info personal */}
                            <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 16, border: `1px solid ${C.border}` }}>
                                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Información Personal</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <InputField label="Nombre" name="Nombre" value={formData.Nombre} onChange={handleChange} disabled={saving} error={errors.Nombre} required />
                                    <InputField label="Número de documento" name="DocumentoID" value={formData.DocumentoID} readOnly hint="No modificable" />
                                </div>
                            </div>

                            {/* Sección: Contacto */}
                            <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 16, border: `1px solid ${C.border}` }}>
                                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contacto</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                    <InputField label="Correo electrónico" type="email" name="Correo" value={formData.Correo} onChange={handleChange} disabled={saving} error={errors.Correo} required />
                                    <InputField label="Teléfono" name="Telefono" value={formData.Telefono} onChange={handleChange} disabled={saving} error={errors.Telefono} required />
                                </div>
                                <InputField label="Dirección" name="Direccion" value={formData.Direccion} onChange={handleChange} disabled={saving} error={errors.Direccion} required />
                            </div>

                            {/* Sección: Seguridad */}
                            <div style={{ background: C.bg, borderRadius: 12, padding: "16px 18px", marginBottom: 24, border: `1px solid ${C.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                                    <FaLock size={11} color={C.muted} />
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seguridad</p>
                                </div>
                                <InputField label="Nueva Contraseña" type="password" name="Contraseña" value={formData.Contraseña} onChange={handleChange} disabled={saving} error={errors.Contraseña} placeholder="Dejar vacío para mantener la actual" hint="Opcional · Mínimo 4 caracteres" />
                            </div>

                            {/* Botones */}
                            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                                <button type="button" onClick={() => navigate("/landing")} disabled={saving}
                                    style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving}
                                    style={{ background: saving ? C.muted : C.navyGrad, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}
                                    onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                    {saving ? (
                                        <>
                                            <div style={{ width: 15, height: 15, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                            Guardando...
                                        </>
                                    ) : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Panel derecho (imagen) ── */}
                    <div style={{ flex: "0 0 340px", backgroundImage: `url(${fondoPerfil})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}
                        className="d-none d-lg-block">
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,37,64,0.8) 0%, rgba(26,37,64,0.15) 60%, transparent 100%)" }} />
                        <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <FaIdCard size={14} color="rgba(255,255,255,0.8)" />
                                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tu cuenta</p>
                            </div>
                            <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 18, lineHeight: 1.3 }}>{formData.Nombre || "Usuario"}</p>
                            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{formData.Correo || ""}</p>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default EditarPerfil;