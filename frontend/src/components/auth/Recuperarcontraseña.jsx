import { useState } from "react";
import { Link } from "react-router-dom";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import axios from "axios";
import { FaArrowLeft, FaEnvelope, FaCheckCircle } from "react-icons/fa";

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const RecuperarContraseña = () => {
    const [correo, setCorreo] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [focused, setFocused] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const validarCorreo = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

    const handleRecuperar = async (e) => {
        e.preventDefault();
        if (!correo) { setMensaje({ tipo: "danger", texto: "Por favor ingresa tu correo." }); return; }
        if (!validarCorreo(correo)) { setMensaje({ tipo: "danger", texto: "Por favor ingresa un correo válido." }); return; }
        setLoading(true);
        setMensaje({ tipo: "", texto: "" });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/recuperar-password`, { Correo: correo });
            setEnviado(true);
            setMensaje({ tipo: "success", texto: "Si el correo está registrado, te enviaremos un enlace de recuperación." });
            setCorreo("");
        } catch (error) {
            setMensaje({ tipo: "danger", texto: error.response?.data?.mensaje || "Error al procesar la solicitud." });
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
        @keyframes popIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 460, animation: "fadeIn 0.35s ease" }}>
                    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>

                        {/* ── Header navy ── */}
                        <div style={{ background: C.navyGrad, padding: "28px 32px" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, border: "1.5px solid rgba(255,255,255,0.25)" }}>
                                <FaEnvelope size={20} color="#fff" />
                            </div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.02em" }}>Recuperar Contraseña</p>
                            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                                Ingresa tu correo y te enviaremos un enlace de recuperación
                            </p>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: "28px 32px" }}>

                            {/* Alerta */}
                            {mensaje.texto && (
                                <div style={{ background: mensaje.tipo === "success" ? C.successSoft : C.dangerSoft, border: `1.5px solid ${mensaje.tipo === "success" ? C.successBorder : C.dangerBorder}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10, animation: "popIn 0.25s ease" }}>
                                    <span style={{ color: mensaje.tipo === "success" ? C.success : C.danger, fontWeight: 800, flexShrink: 0, fontSize: 13, marginTop: 1 }}>
                                        {mensaje.tipo === "success" ? "✓" : "!"}
                                    </span>
                                    <p style={{ margin: 0, fontSize: 13, color: mensaje.tipo === "success" ? C.success : C.danger, fontWeight: 600 }}>{mensaje.texto}</p>
                                </div>
                            )}

                            {!enviado ? (
                                <form onSubmit={handleRecuperar}>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                            Correo electrónico <span style={{ color: C.danger }}>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Ingresa tu correo electrónico"
                                            value={correo}
                                            onChange={e => { setCorreo(e.target.value); if (mensaje.texto) setMensaje({ tipo: "", texto: "" }); }}
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                            disabled={loading}
                                            required
                                            style={{ width: "100%", padding: "11px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", border: `1.5px solid ${focused ? C.accent : C.border}`, borderRadius: 10, outline: "none", color: "#0f172a", background: "#fff", transition: "border-color 0.15s", opacity: loading ? 0.7 : 1 }}
                                        />
                                        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted }}>
                                            Recibirás un enlace para restablecer tu contraseña
                                        </p>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading ? C.muted : C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}
                                        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                        {loading ? (
                                            <>
                                                <div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                                Enviando...
                                            </>
                                        ) : "Enviar enlace"}
                                    </button>
                                </form>
                            ) : (
                                /* Estado enviado */
                                <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
                                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.successSoft, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "popIn 0.3s ease" }}>
                                        <FaCheckCircle size={28} color={C.success} />
                                    </div>
                                    <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 15, color: C.navy }}>¡Correo enviado!</p>
                                    <p style={{ margin: "0 0 20px", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                                        Revisa tu bandeja de entrada y sigue las instrucciones del enlace.
                                    </p>
                                </div>
                            )}

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

export default RecuperarContraseña;