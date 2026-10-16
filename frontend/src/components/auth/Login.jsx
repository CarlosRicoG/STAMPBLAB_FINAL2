import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario } from "../../Services/api-auth/auth";
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

const InputField = ({ label, type, placeholder, value, onChange, disabled, error }) => {
    const [focused, setFocused] = useState(false);
    const [show, setShow] = useState(false);
    const isPass = type === "password";
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
            <input
                className="au-input"
                type={isPass && show ? "text" : type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: "100%", padding: "11px 14px", fontSize: 13,
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
            {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger, fontWeight: 600 }}>{error}</p>}
        </div>
    );
};

const LoginLanding = () => {
    const [correo, setCorreo] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await loginUsuario({ Correo: correo, Contraseña: contraseña });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("usuario", JSON.stringify({ Nombre: res.data.nombre, Correo: res.data.correo || res.data.Correo, DocumentoID: res.data.DocumentoID || res.data.documentoID, rol: res.data.rol }));

            if (res.data.rol === 1 || res.data.rol === "1") {
                await Swal.fire({ icon: "success", title: "¡Bienvenido Administrador!", text: res.data.nombre, timer: 2000, showConfirmButton: false });
                navigate("/dashboard");
            } else {
                await Swal.fire({ icon: "success", title: "¡Bienvenido!", text: res.data.nombre, timer: 2000, showConfirmButton: false });
                navigate("/landing");
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 400) {
                Swal.fire({ icon: "error", title: "Credenciales incorrectas", text: "El correo o la contraseña son incorrectos.", confirmButtonColor: C.danger });
            } else if (err.response?.status === 404) {
                Swal.fire({ icon: "error", title: "Usuario no encontrado", text: "No existe una cuenta con este correo electrónico.", confirmButtonColor: C.danger });
            } else if (err.response?.data?.mensaje) {
                Swal.fire({ icon: "error", title: "Error al iniciar sesión", text: err.response.data.mensaje, confirmButtonColor: C.danger });
            } else {
                Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor.", confirmButtonColor: C.danger });
            }
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
                <div style={{ width: "100%", maxWidth: 900, background: "#fff", borderRadius: 20, boxShadow: "0 2px 4px rgba(26,37,64,0.05), 0 18px 48px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden", display: "flex", animation: "au-rise .6s cubic-bezier(.22,1,.36,1) both" }}>

                    {/* ── Panel izquierdo (imagen) ── */}
                    <div style={{ flex: 1, minHeight: 520, backgroundImage: `url(${fondo})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
                        className="d-none d-md-flex">
                        {/* Overlay degradado */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,37,64,0.82) 0%, rgba(26,37,64,0.2) 60%, transparent 100%)" }} />
                        <div style={{ position: "relative", padding: "32px 28px" }}>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>Bienvenido de<br />vuelta</p>
                            <p style={{ margin: "8px 0 0", color: "rgba(255, 255, 255, 0.94)", fontSize: 13 }}>Inicia sesión para gestionar tus pedidos y cotizaciones.</p>
                        </div>
                    </div>

                    {/* ── Panel derecho (formulario) ── */}
                    <div className="au-stagger" style={{ flex: 1, padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>

                        {/* Logo mobile */}
                        <div className="d-flex d-md-none" style={{ justifyContent: "center", marginBottom: 24 }}>
                            <img src={logo} alt="StampLab" style={{ height: 48 }} />
                        </div>

                        {/* Card header */}
                        <div style={{ marginBottom: 32 }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 24, color: C.navy, letterSpacing: "-0.02em" }}>Iniciar Sesión</p>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>Ingresa tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <InputField label="Correo electrónico" type="email" placeholder="Ingresa tu correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} disabled={loading} />
                            <InputField label="Contraseña" type="password" placeholder="Ingresa tu contraseña" value={contraseña} onChange={e => setContraseña(e.target.value)} disabled={loading} />

                            <button type="submit" disabled={loading} className="au-btn"
                                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: loading ? C.muted : C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.15s" }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                {loading ? (
                                    <>
                                        <div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                        Iniciando sesión...
                                    </>
                                ) : "Iniciar Sesión"}
                            </button>
                        </form>

                        {/* Links */}
                        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: C.muted }}>
                                ¿No tienes una cuenta?{" "}
                                <Link to="/signup" className="au-link" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}>
                                    Registrarme
                                </Link>
                            </p>
                            <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: C.muted }}>
                                ¿Olvidaste tu contraseña?{" "}
                                <Link to="/recuperarcontraseña" className="au-link" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}>
                                    Recuperar contraseña
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default LoginLanding;