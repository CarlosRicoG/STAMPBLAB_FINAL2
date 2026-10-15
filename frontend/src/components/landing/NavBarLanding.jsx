import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaTimes, FaShoppingBag, FaFileInvoice, FaEdit, FaSignOutAlt } from "react-icons/fa";
import logo from "../../assets/images/nuevo_logo_stamplab.png";

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
};

/* ── Modal Perfil ── */
const PerfilModal = ({ show, onClose, userData, onLogout }) => {
    if (!show || !userData) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif", animation: "fadeIn 0.2s ease" }}>
                {/* Header */}
                <div style={{ background: C.navyGrad, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.3)" }}>
                            <FaUserCircle size={30} color="#fff" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>{userData.Nombre || "Usuario"}</p>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{userData.Correo || "Sin correo"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
                </div>

                {/* Actions */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                        { to: "/miscotizaciones", icon: <FaFileInvoice size={14} />, label: "Mis Cotizaciones", color: C.accent },
                        { to: "/miscompras", icon: <FaShoppingBag size={14} />, label: "Mis Compras", color: "#16a34a" },
                        { to: "/editarperfil", icon: <FaEdit size={14} />, label: "Editar Información", color: C.navy },
                    ].map(({ to, icon, label, color }) => (
                        <Link key={to} to={to} onClick={onClose}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, background: "#f8fafc", border: `1.5px solid ${C.border}`, color, fontWeight: 700, fontSize: 13, textDecoration: "none", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accentBorder; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = C.border; }}>
                            {icon} {label}
                        </Link>
                    ))}
                </div>

                {/* Logout */}
                <div style={{ padding: "0 20px 20px" }}>
                    <button onClick={onLogout}
                        style={{ width: "100%", background: "#fef2f2", color: C.danger, border: `1.5px solid #fecaca`, borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.danger; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = C.danger; }}>
                        <FaSignOutAlt size={13} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

const NavbarComponent = () => {
    const [showPerfil, setShowPerfil] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => { checkAuth(); }, [location]);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("usuario");
        if (token && user) {
            try { setUserData(JSON.parse(user)); setIsAuthenticated(true); }
            catch { setIsAuthenticated(false); setUserData(null); }
        } else { setIsAuthenticated(false); setUserData(null); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setIsAuthenticated(false);
        setUserData(null);
        setShowPerfil(false);
        navigate("/login");
    };

    const navLinks = [
        { to: "/landing", label: "Inicio" },
        { to: "/cotizacionesLanding", label: "Cotización" },
        { to: "/productosLanding", label: "Productos" },
        { to: "/servicios", label: "Servicios" },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .nav-link-item { position: relative; }
        .nav-link-item::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:2px; background:${C.accent}; border-radius:2px; transition:width 0.2s ease; }
        .nav-link-item:hover::after, .nav-link-item.active::after { width:100%; }
        .nav-link-item:hover { color:${C.accent} !important; }
        .mobile-menu { animation: slideDown 0.2s ease; }
      `}</style>

            <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(26,37,64,0.08)", fontFamily: "'Outfit',sans-serif", position: "sticky", top: 0, zIndex: 1000 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                    {/* Logo */}
                    <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
                        <img src={logo} alt="StampLab" style={{ height: 56, objectFit: "contain" }} />
                    </Link>

                    {/* Nav Links - Desktop */}
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="d-none d-md-flex">
                        {navLinks.map(({ to, label }) => (
                            <Link key={to} to={to}
                                className={`nav-link-item ${isActive(to) ? "active" : ""}`}
                                style={{ color: isActive(to) ? C.accent : C.navy, fontWeight: isActive(to) ? 700 : 600, fontSize: 14, textDecoration: "none", transition: "color 0.15s", letterSpacing: "0.01em" }}>
                                {label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth buttons - Desktop */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="d-none d-md-flex">
                        {isAuthenticated ? (
                            <>
                                <button onClick={() => setShowPerfil(true)}
                                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#f8fafc", color: C.navy, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accentBorder; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = C.border; }}>
                                    <FaUserCircle size={16} color={C.accent} />
                                    {userData?.Nombre?.split(" ")[0] || "Mi cuenta"}
                                </button>
                                <button onClick={handleLogout}
                                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#fef2f2", color: C.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.danger; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = C.danger; }}>
                                    <FaSignOutAlt size={12} /> Salir
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login"
                                    style={{ padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, fontWeight: 600, fontSize: 13, textDecoration: "none", transition: "all 0.15s", fontFamily: "'Outfit',sans-serif" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.navy; }}>
                                    Iniciar Sesión
                                </Link>
                                <Link to="/signup"
                                    style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", transition: "opacity 0.15s", fontFamily: "'Outfit',sans-serif" }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Hamburger - Mobile */}
                    <button onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ display: "none", width: 36, height: 36, borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#fff", color: C.navy, cursor: "pointer", alignItems: "center", justifyContent: "center", fontSize: 18 }}
                        className="d-flex d-md-none">
                        {mobileOpen ? <FaTimes size={16} /> : "☰"}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="mobile-menu d-md-none" style={{ background: "#fff", borderTop: `1px solid ${C.border}`, padding: "12px 24px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                        {navLinks.map(({ to, label }) => (
                            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                                style={{ padding: "10px 12px", borderRadius: 9, color: isActive(to) ? C.accent : C.navy, fontWeight: isActive(to) ? 700 : 600, fontSize: 14, textDecoration: "none", background: isActive(to) ? C.accentSoft : "transparent" }}>
                                {label}
                            </Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            {isAuthenticated ? (
                                <>
                                    <button onClick={() => { setMobileOpen(false); setShowPerfil(true); }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, background: "#f8fafc", color: C.navy, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13 }}>
                                        <FaUserCircle size={15} color={C.accent} /> Mi cuenta
                                    </button>
                                    <button onClick={handleLogout}
                                        style={{ padding: "10px 12px", borderRadius: 9, border: "none", background: "#fef2f2", color: C.danger, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13 }}>
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileOpen(false)} style={{ padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, color: C.navy, fontWeight: 600, fontSize: 13, textDecoration: "none", textAlign: "center" }}>Iniciar Sesión</Link>
                                    <Link to="/signup" onClick={() => setMobileOpen(false)} style={{ padding: "10px 12px", borderRadius: 9, background: C.navyGrad, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center" }}>Registrarse</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <PerfilModal show={showPerfil} onClose={() => setShowPerfil(false)} userData={userData} onLogout={handleLogout} />
        </>
    );
};

export default NavbarComponent;