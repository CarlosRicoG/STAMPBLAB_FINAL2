import { useState, useEffect } from "react";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { errorContrasena } from "../../utils/validarContrasena";
import { getUsuarioById, updateUsuario } from "../../Services/api-usuarios/usuarios";
import { cerrarSesion } from "../../Services/api-auth/auth";
import fondoPerfil from "../../assets/images/estampadoslies.webp";
import { FaUserEdit, FaLock, FaIdCard, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaCheckCircle, FaExclamationCircle, FaSave } from "react-icons/fa";
import usePlus from "../../hooks/usePlus";
import { MC_CSS, Avatar, MiCuentaHero } from "./miCuentaKit";
import { C } from "../../config/tokens";

const InputField = ({ label, type = "text", name, value, onChange, disabled, error, placeholder, readOnly, hint, required }) => {
    const valido = error === "" && !!value && !readOnly;
    return (
        <div className="mc-field">
            <label htmlFor={`mc-${name}`}>{label} {required && <i>*</i>}</label>
            <input
                id={`mc-${name}`}
                className={`mc-input ${error ? "err" : valido ? "ok" : ""}`}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled || readOnly}
                readOnly={readOnly}
                placeholder={placeholder}
            />
            {error && <p className="mc-err"><FaExclamationCircle size={11} /> {error}</p>}
            {valido && <p className="mc-hint" style={{ color: C.success, fontWeight: 600 }}><FaCheckCircle size={10} /> Se ve bien</p>}
            {hint && !error && !valido && <p className="mc-hint">{hint}</p>}
        </div>
    );
};

const EditarPerfil = () => {
    usePlus();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ DocumentoID: "", Nombre: "", Correo: "", Telefono: "", Direccion: "", Contraseña: "" });

    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
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
    const validarContraseña = (v) => { if (!v) return ""; return errorContrasena(v); };

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
                Swal.fire({ icon: "success", title: "¡Perfil actualizado!", text: "Por seguridad, debes iniciar sesión nuevamente.", confirmButtonColor: C.navy }).then(async () => { await cerrarSesion(); navigate("/login"); });
            } else throw new Error(response.mensaje || "Error al actualizar perfil");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.mensaje || error.message || "Error al actualizar el perfil.", confirmButtonColor: C.danger });
        } finally { setSaving(false); }
    };

    /* ── Loading state ── */
    if (loading) {
        return (
            <>
                <style>{MC_CSS}</style>
                <NavbarComponent />
                <div className="mc-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", minHeight: "calc(100vh - 72px)" }}>
                    <div className="mc-glass-card" style={{ width: "100%", maxWidth: 960, padding: 40 }}>
                        {[0, 1, 2].map(i => <div key={i} className="mc-skel" style={{ height: 96, borderRadius: 14, marginBottom: 16 }} />)}
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }

    return (
        <>
            <style>{MC_CSS + `
            .mc-perfil-wrap { min-height: calc(100vh - 72px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; position: relative; overflow: hidden; }
            .mc-perfil-wrap .sx-blob { opacity: .14; }
            .mc-perfil-layout { display: flex; }
            .mc-perfil-side { position: relative; flex: 0 0 340px; background: url(${fondoPerfil}) center/cover; }
            .mc-perfil-side::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,37,64,.88) 0%, rgba(26,37,64,.2) 60%, transparent 100%); }
            .mc-perfil-side > div { position: absolute; left: 28px; right: 28px; bottom: 28px; color: #fff; }
            .mc-perfil-form { flex: 1; padding: 40px; min-width: 0; }
            @media (max-width: 900px) { .mc-perfil-side { display: none; } }
            @media (max-width: 600px) { .mc-perfil-form { padding: 26px 18px; } }
            `}</style>

            <NavbarComponent />

            <div className="mc-page mc-perfil-wrap">
                <span className="sx-blob b1" /><span className="sx-blob b2" />
                <div className="mc-glass-card sx-reveal" style={{ width: "100%", maxWidth: 960 }}>
                    <div className="mc-perfil-layout">
                        <div className="mc-perfil-form">
                            <div style={{ marginBottom: 26 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#4f8ef7,#7c3aed)", color: C.white, display: "grid", placeItems: "center", boxShadow: "0 8px 18px rgba(79,142,247,.4)" }}>
                                        <FaUserEdit size={16} />
                                    </div>
                                    <h1 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Editar Perfil</h1>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Actualiza tu información personal</p>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mc-fsec">
                                    <p className="mc-fsec-h"><span><FaUser /></span> Información Personal</p>
                                    <div className="mc-fgrid">
                                        <InputField label="Nombre" name="Nombre" value={formData.Nombre} onChange={handleChange} disabled={saving} error={errors.Nombre} required />
                                        <InputField label="Número de documento" name="DocumentoID" value={formData.DocumentoID} readOnly hint="No modificable" />
                                    </div>
                                </div>

                                <div className="mc-fsec">
                                    <p className="mc-fsec-h"><span><FaEnvelope /></span> Contacto</p>
                                    <div className="mc-fgrid" style={{ marginBottom: 16 }}>
                                        <InputField label="Correo electrónico" type="email" name="Correo" value={formData.Correo} onChange={handleChange} disabled={saving} error={errors.Correo} required />
                                        <InputField label="Teléfono" name="Telefono" value={formData.Telefono} onChange={handleChange} disabled={saving} error={errors.Telefono} required />
                                    </div>
                                    <InputField label="Dirección" name="Direccion" value={formData.Direccion} onChange={handleChange} disabled={saving} error={errors.Direccion} required />
                                </div>

                                <div className="mc-fsec" style={{ marginBottom: 24 }}>
                                    <p className="mc-fsec-h"><span><FaLock /></span> Seguridad</p>
                                    <InputField label="Nueva Contraseña" type="password" name="Contraseña" value={formData.Contraseña} onChange={handleChange} disabled={saving} error={errors.Contraseña} placeholder="Dejar vacío para mantener la actual" hint="Opcional · 8 a 100 caracteres, con letras y números" />
                                </div>

                                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                                    <button type="button" className="mc-ghostbtn" onClick={() => navigate("/landing")} disabled={saving}>Cancelar</button>
                                    <button type="submit" className="mc-save" disabled={saving}>
                                        {saving ? (<><span className="mc-spin" /> Guardando...</>) : (<><FaSave size={14} /> Guardar Cambios</>)}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <aside className="mc-perfil-side">
                            <div>
                                <Avatar nombre={formData.Nombre} size={72} />
                                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 8px", color: "rgba(255,255,255,.75)" }}>
                                    <FaIdCard size={14} />
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Tu cuenta</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, lineHeight: 1.3 }}>{formData.Nombre || "Usuario"}</p>
                                <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,.65)", fontSize: 12 }}>{formData.Correo || ""}</p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default EditarPerfil;
