import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";
import Swal from "sweetalert2";
import { FaArrowLeft, FaLock, FaExclamationTriangle } from "react-icons/fa";

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const PasswordInput = ({ label, placeholder, value, onChange, disabled, hint }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} <span style={{ color: C.danger }}>*</span>
            </label>
            <input
                type="password"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ width: "100%", padding: "11px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", border: `1.5px solid ${focused ? C.accent : C.border}`, borderRadius: 10, outline: "none", color: "#0f172a", background: "#fff", transition: "border-color 0.15s", opacity: disabled ? 0.7 : 1 }}
            />
            {hint && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>{hint}</p>}
        </div>
    );
};

const RestablecerContraseña = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [tokenValido, setTokenValido] = useState(true);

    useEffect(() => {
        const tokenFromUrl = searchParams.get("token");
        if (!tokenFromUrl) { setTokenValido(false); }
        else { setToken(tokenFromUrl); }
    }, [searchParams]);

    const handleRestablecer = async (e) => {
        e.preventDefault();
        if (!nuevaContraseña || !confirmarContraseña) { setMensaje({ tipo: "danger", texto: "Completa todos los campos." }); return; }
        if (nuevaContraseña !== confirmarContraseña) { setMensaje({ tipo: "danger", texto: "Las contraseñas no coinciden." }); return; }
        if (nuevaContraseña.length < 4) { setMensaje({ tipo: "danger", texto: "La contraseña debe tener al menos 4 caracteres." }); return; }

        setLoading(true);
        setMensaje({ tipo: "", texto: "" });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/restablecer-password`, { token, nuevaContraseña });
            await Swal.fire({ icon: "success", title: "¡Contraseña actualizada!", text: "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.", confirmButtonColor: C.navy });
            navigate("/login");
        } catch (error) {
            let mensajeError = "Error al restablecer la contraseña.";
            if (error.response?.status === 401) mensajeError = "El enlace ha expirado o es inválido. Solicita uno nuevo.";
            else if (error.response?.data?.mensaje) mensajeError = error.response.data.mensaje;
            setMensaje({ tipo: "danger", texto: mensajeError });
        } finally {
            setLoading(false);
        }
    };

    /* ── Token inválido ── */
    if (!tokenValido) {
        return (
            <>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
                <NavbarComponent />
                <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                    <div style={{ width: "100%", maxWidth: 460, animation: "fadeIn 0.35s ease" }}>
                        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>
                            <div style={{ background: C.navyGrad, padding: "28px 32px" }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, border: "1.5px solid rgba(255,255,255,0.25)" }}>
                                    <FaExclamationTriangle size={20} color="#fff" />
                                </div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#fff" }}>Enlace inválido</p>
                                <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>El enlace de recuperación no es válido o ha expirado</p>
                            </div>
                            <div style={{ padding: "28px 32px" }}>
                                <div style={{ background: C.warningSoft, border: `1.5px solid ${C.warningBorder}`, borderRadius: 10, padding: "14px 16px", marginBottom: 22 }}>
                                    <p style={{ margin: 0, fontSize: 13, color: C.warning, fontWeight: 600 }}>
                                        El enlace que usaste ya no es válido. Esto puede ocurrir si ya fue usado o si expiró.
                                    </p>
                                </div>
                                <Link to="/recuperarcontraseña"
                                    style={{ display: "block", width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center", textDecoration: "none", marginBottom: 16 }}>
                                    Solicitar nuevo enlace
                                </Link>
                                <div style={{ textAlign: "center" }}>
                                    <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                                        <FaArrowLeft size={11} /> Volver al inicio de sesión
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
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
        @keyframes popIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 460, animation: "fadeIn 0.35s ease" }}>
                    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>

                        {/* ── Header navy ── */}
                        <div style={{ background: C.navyGrad, padding: "28px 32px" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, border: "1.5px solid rgba(255,255,255,0.25)" }}>
                                <FaLock size={18} color="#fff" />
                            </div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}>Restablecer Contraseña</p>
                            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                                Crea una nueva contraseña segura para tu cuenta
                            </p>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: "28px 32px" }}>

                            {/* Alerta */}
                            {mensaje.texto && (
                                <div style={{ background: C.dangerSoft, border: `1.5px solid ${C.dangerBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10, animation: "popIn 0.25s ease" }}>
                                    <span style={{ color: C.danger, fontWeight: 800, flexShrink: 0, fontSize: 14, marginTop: 1 }}>!</span>
                                    <p style={{ margin: 0, fontSize: 13, color: C.danger, fontWeight: 600 }}>{mensaje.texto}</p>
                                </div>
                            )}

                            <form onSubmit={handleRestablecer}>
                                <PasswordInput
                                    label="Nueva Contraseña"
                                    placeholder="Ingresa tu nueva contraseña"
                                    value={nuevaContraseña}
                                    onChange={e => setNuevaContraseña(e.target.value)}
                                    disabled={loading}
                                    hint="Mínimo 4 caracteres"
                                />
                                <PasswordInput
                                    label="Confirmar Contraseña"
                                    placeholder="Confirma tu nueva contraseña"
                                    value={confirmarContraseña}
                                    onChange={e => setConfirmarContraseña(e.target.value)}
                                    disabled={loading}
                                />

                                {/* Indicador de coincidencia */}
                                {confirmarContraseña && (
                                    <div style={{ marginBottom: 20, marginTop: -10 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: nuevaContraseña === confirmarContraseña ? C.success : C.danger }}>
                                            {nuevaContraseña === confirmarContraseña ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
                                        </p>
                                    </div>
                                )}

                                <button type="submit" disabled={loading}
                                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading ? C.muted : C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                    {loading ? (
                                        <>
                                            <div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                            Actualizando...
                                        </>
                                    ) : "Restablecer Contraseña"}
                                </button>
                            </form>

                            <div style={{ textAlign: "center" }}>
                                <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 600, fontSize: 13, textDecoration: "none" }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                    <FaArrowLeft size={11} /> Volver al inicio de sesión
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default RestablecerContraseña;