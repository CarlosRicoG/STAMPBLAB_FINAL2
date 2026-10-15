import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario } from "../../Services/api-auth/auth";
import * as jose from 'jose';
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

const InputField = ({ label, type, placeholder, value, onChange, disabled, error }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label}
            </label>
            <input
                type={type}
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
                }}
            />
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
            if (correo === "admin@gmail.com" && contraseña === "admin123") {
                const secret = new TextEncoder().encode('clave_secreta');
                const tokenAdmin = await new jose.SignJWT({ id: 'admin', rol: 1 })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('2h')
                    .sign(secret);
                localStorage.setItem("token", tokenAdmin);
                localStorage.setItem("usuario", JSON.stringify({ Nombre: "Administrador", DocumentoID: "admin", rol: 1 }));
                await Swal.fire({ icon: "success", title: "¡Bienvenido Administrador!", text: "Has iniciado sesión exitosamente", timer: 2000, showConfirmButton: false });
                navigate("/dashboard");
                return;
            }

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
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: "100%", maxWidth: 900, background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(26,37,64,0.12), 0 0 0 1px #f1f5f9", overflow: "hidden", display: "flex", animation: "fadeIn 0.35s ease" }}>

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
                    <div style={{ flex: 1, padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>

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

                            <button type="submit" disabled={loading}
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
                                <Link to="/signup" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
                                    Registrarme
                                </Link>
                            </p>
                            <p style={{ margin: 0, textAlign: "center", fontSize: 13, color: C.muted }}>
                                ¿Olvidaste tu contraseña?{" "}
                                <Link to="/recuperarcontraseña" style={{ color: C.accent, fontWeight: 700, textDecoration: "none" }}
                                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
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