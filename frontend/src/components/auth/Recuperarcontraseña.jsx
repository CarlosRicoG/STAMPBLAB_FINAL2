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

        @keyframes popIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 460, animation: "au-rise .6s cubic-bezier(.22,1,.36,1) both" }}>
                    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 4px rgba(26,37,64,0.05), 0 18px 48px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden" }}>

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
                        <div className="au-stagger" style={{ padding: "28px 32px" }}>

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
                                            className="au-input"
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

                                    <button type="submit" disabled={loading} className="au-btn"
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
                                <Link to="/login" className="au-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
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