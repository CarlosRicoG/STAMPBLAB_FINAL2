import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../../Services/api-auth/auth";
import fondo from "../../assets/images/imagenfondo.png";
import logo from "../../assets/images/nuevo_logo_stamplab.png";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import Swal from "sweetalert2";

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const InputField = ({ label, type = "text", placeholder, value, onChange, onBlur, disabled, error, required }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                disabled={disabled}
                required={required}
                onFocus={() => setFocused(true)}
                onBlurCapture={() => setFocused(false)}
                style={{
                    width: "100%", padding: "10px 14px", fontSize: 13,
                    fontFamily: "'Outfit',sans-serif",
                    border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
                    borderRadius: 10, outline: "none", color: "#0f172a",
                    background: error ? "#fef2f2" : "#fff",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                    opacity: disabled ? 0.7 : 1,
                }}
            />
            {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{error}</p>}
        </div>
    );
};

const RegistroLanding = () => {
    const [nombre, setNombre] = useState("");
    const [documento, setDocumento] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [errores, setErrores] = useState({ nombre: "", documento: "", correo: "", telefono: "", direccion: "", contraseña: "", confirmar: "" });

    const validarNombre = (v) => {
        if (!v.trim()) return "El nombre es requerido.";
        if (v.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v)) return "El nombre solo debe contener letras.";
        return "";
    };
    const validarDocumento = (v) => {
        if (!v.trim()) return "El documento es requerido.";
        if (!/^\d+$/.test(v)) return "El documento solo debe contener números.";
        if (v.length < 7 || v.length > 10) return "El documento debe tener entre 7 y 10 dígitos.";
        return "";
    };
    const validarCorreo = (v) => {
        if (!v.trim()) return "El correo es requerido.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "El correo no es válido.";
        return "";
    };
    const validarTelefono = (v) => {
        if (!v.trim()) return "El teléfono es requerido.";
        if (!/^[\d\s-]+$/.test(v)) return "Solo puede contener números, espacios o guiones.";
        const soloNumeros = v.replace(/[\s-]/g, "");
        if (soloNumeros.length < 7 || soloNumeros.length > 10) return "El teléfono debe tener entre 7 y 10 dígitos.";
        return "";
    };
    const validarDireccion = (v) => {
        if (!v.trim()) return "La dirección es requerida.";
        if (v.trim().length < 5) return "La dirección debe tener al menos 5 caracteres.";
        return "";
    };
    const validarContraseña = (v) => {
        if (!v) return "La contraseña es requerida.";
        if (v.length < 4) return "La contraseña debe tener al menos 4 caracteres.";
        if (v.length > 20) return "La contraseña no debe exceder 20 caracteres.";
        return "";
    };
    const validarConfirmar = (v) => {
        if (!v) return "Debes confirmar tu contraseña.";
        if (v !== contraseña) return "Las contraseñas no coinciden.";
        return "";
    };

    const blur = (field, fn, value) => {
        const e = fn(value);
        setErrores(prev => ({ ...prev, [field]: e }));
    };

    const handleRegistro = async (e) => {
        e.preventDefault();
        const nuevosErrores = {
            nombre: validarNombre(nombre),
            documento: validarDocumento(documento),
            correo: validarCorreo(correo),
            telefono: validarTelefono(telefono),
            direccion: validarDireccion(direccion),
            contraseña: validarContraseña(contraseña),
            confirmar: validarConfirmar(confirmar),
        };
        setErrores(nuevosErrores);
        if (Object.values(nuevosErrores).some(e => e !== "")) {
            Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Por favor corrige los errores antes de continuar.", confirmButtonColor: C.danger });
            return;
        }
        setLoading(true);
        try {
            const datos = { DocumentoID: documento.trim(), Nombre: nombre.trim(), Correo: correo.trim(), Telefono: telefono.trim(), Direccion: direccion.trim(), Contraseña: contraseña, RolID: 2 };
            const response = await registrarUsuario(datos);
            if (response.data?.estado !== false) {
                Swal.fire({ icon: "success", title: "¡Registro exitoso!", text: "Tu cuenta ha sido creada. Por favor inicia sesión.", confirmButtonColor: C.navy }).then(() => navigate("/login"));
            } else {
                throw new Error(response.data?.mensaje || "Error al registrar usuario");
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error al registrarse", text: err.response?.data?.mensaje || err.message || "Verifica los datos e intenta nuevamente.", confirmButtonColor: C.danger });
        } finally {
            setLoading(false);
        }
    };

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
                <div style={{ width: "100%", maxWidth: 980, background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden", display: "flex", animation: "fadeIn 0.35s ease" }}>

                    {/* ── Panel izquierdo (imagen) ── */}
                    <div style={{ flex: "0 0 340px", backgroundImage: `url(${fondo})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
                        className="d-none d-lg-flex">
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,37,64,0.85) 0%, rgba(26,37,64,0.25) 60%, transparent 100%)" }} />
                        <div style={{ position: "relative", padding: "32px 28px" }}>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>Crea tu cuenta</p>
                            <p style={{ margin: "8px 0 0", color: "rgba(255, 255, 255, 0.94)", fontSize: 13 }}>Únete a StampLab y accede a cotizaciones, productos y más.</p>
                        </div>
                    </div>

                    {/* ── Panel derecho (formulario) ── */}
                    <div style={{ flex: 1, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, overflowY: "auto" }}>

                        {/* Logo mobile */}
                        <div className="d-flex d-lg-none" style={{ justifyContent: "center", marginBottom: 20 }}>
                            <img src={logo} alt="StampLab" style={{ height: 44 }} />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Formulario de Registro</p>
                            <p style={{ margin: "5px 0 0", fontSize: 13, color: C.muted }}>Completa todos los campos para crear tu cuenta</p>
                        </div>

                        <form onSubmit={handleRegistro}>
                            {/* Fila 1: Nombre + Documento */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <InputField label="Nombre" placeholder="Ingresa tu nombre" value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    onBlur={() => blur("nombre", validarNombre, nombre)}
                                    disabled={loading} error={errores.nombre} required />
                                <InputField label="Número de documento" placeholder="Número de documento" value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    onBlur={() => blur("documento", validarDocumento, documento)}
                                    disabled={loading} error={errores.documento} required />
                            </div>

                            {/* Fila 2: Correo + Teléfono */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <InputField label="Correo electrónico" type="email" placeholder="Correo" value={correo}
                                    onChange={e => setCorreo(e.target.value)}
                                    onBlur={() => blur("correo", validarCorreo, correo)}
                                    disabled={loading} error={errores.correo} required />
                                <InputField label="Teléfono" placeholder="Teléfono" value={telefono}
                                    onChange={e => setTelefono(e.target.value)}
                                    onBlur={() => blur("telefono", validarTelefono, telefono)}
                                    disabled={loading} error={errores.telefono} required />
                            </div>

                            {/* Fila 3: Dirección + Contraseña */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                <InputField label="Dirección" placeholder="Dirección" value={direccion}
                                    onChange={e => setDireccion(e.target.value)}
                                    onBlur={() => blur("direccion", validarDireccion, direccion)}
                                    disabled={loading} error={errores.direccion} required />
                                <InputField label="Contraseña" type="password" placeholder="Contraseña" value={contraseña}
                                    onChange={e => setContraseña(e.target.value)}
                                    onBlur={() => blur("contraseña", validarContraseña, contraseña)}
                                    disabled={loading} error={errores.contraseña} required />
                            </div>

                            {/* Confirmar contraseña */}
                            <div style={{ marginBottom: 24 }}>
                                <InputField label="Confirmar contraseña" type="password" placeholder="Confirmar contraseña" value={confirmar}
                                    onChange={e => setConfirmar(e.target.value)}
                                    onBlur={() => blur("confirmar", validarConfirmar, confirmar)}
                                    disabled={loading} error={errores.confirmar} required />
                            </div>

                            {/* Botón */}
                            <button type="submit" disabled={loading}
                                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading ? C.muted : C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.15s" }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                {loading ? (
                                    <>
                                        <div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                        Registrando...
                                    </>
                                ) : "Registrar"}
                            </button>
                        </form>

                        <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 13, color: C.muted }}>
                            ¿Ya tienes cuenta?{" "}
                            <Link to="/login" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default RegistroLanding;