import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../../Services/api-auth/auth";
import fondo from "../../assets/images/imagenfondo.png";
import logo from "../../assets/images/nuevo_logo_stamplab.png";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";


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
    const [show, setShow] = useState(false);
    const isPass = type === "password";
    return (
        <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            <div style={{ position: "relative" }}>
            <input
                className="au-input"
                type={isPass && show ? "text" : type}
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
                    paddingRight: isPass ? 42 : 14,
                }}
            />
            {isPass && <button type="button" className="au-eye" tabIndex={-1} onClick={() => setShow(v => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>{show ? <FaEyeSlash size={15} /> : <FaEye size={15} />}</button>}
            </div>
            {error && <p className="au-shake" style={{ margin: "5px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{error}</p>}
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
        @keyframes au-rise { from{opacity:0;transform:translateY(18px) scale(.985)} to{opacity:1;transform:none} }
        @keyframes au-sheen { 0%,60%{left:-70%} 100%{left:140%} }
        @keyframes au-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-2px)} }
        .au-stagger > * { opacity: 0; animation: au-rise .6s cubic-bezier(.22,1,.36,1) both; }
        .au-stagger > *:nth-child(1){animation-delay:.05s} .au-stagger > *:nth-child(2){animation-delay:.12s}
        .au-stagger > *:nth-child(3){animation-delay:.19s} .au-stagger > *:nth-child(4){animation-delay:.26s}
        .au-stagger > *:nth-child(5){animation-delay:.33s} .au-stagger > *:nth-child(6){animation-delay:.40s}
        .au-input { transition: border-color .2s, box-shadow .25s, background .2s !important; }
        .au-input:hover:not(:disabled) { border-color: #b6c8ee !important; }
        .au-input:focus { box-shadow: 0 0 0 4px rgba(79,142,247,.16), 0 8px 20px rgba(79,142,247,.16); }
        .au-eye { position:absolute; right:6px; top:50%; transform:translateY(-50%); border:0; background:transparent; width:34px; height:34px; border-radius:9px; color:#94a3b8; cursor:pointer; display:grid; place-items:center; transition: background .2s, color .2s; }
        .au-eye:hover { background:#f0f4ff; color:#4f8ef7; }
        .au-btn { position:relative; overflow:hidden; transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, opacity .15s !important; box-shadow: 0 6px 16px rgba(26,37,64,.22); }
        .au-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(26,37,64,.30); }
        .au-btn:not(:disabled):active { transform: translateY(0) scale(.985); }
        .au-btn::after { content:""; position:absolute; top:0; left:-70%; width:45%; height:100%; transform:skewX(-22deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); animation: au-sheen 3.6s ease-in-out infinite; pointer-events:none; }
        .au-btn:disabled::after { display:none; }
        .au-link { text-decoration:none !important; background: linear-gradient(currentColor,currentColor) no-repeat 0 100% / 0 1.5px; padding-bottom:2px; transition: background-size .3s cubic-bezier(.22,1,.36,1), color .2s; }
        .au-link:hover { background-size: 100% 1.5px; }
        .au-shake { animation: au-shake .4s; }
        @media (prefers-reduced-motion: reduce) { .au-stagger > *, .au-btn::after, .au-shake { animation: none !important; opacity: 1 !important; } }

      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 980, background: "#fff", borderRadius: 20, boxShadow: "0 2px 4px rgba(26,37,64,0.05), 0 18px 48px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden", display: "flex", animation: "au-rise .6s cubic-bezier(.22,1,.36,1) both" }}>

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
                    <div className="au-stagger" style={{ flex: 1, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, overflowY: "auto" }}>

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
                            <button type="submit" disabled={loading} className="au-btn"
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
                            <Link to="/login" className="au-link" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}>
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