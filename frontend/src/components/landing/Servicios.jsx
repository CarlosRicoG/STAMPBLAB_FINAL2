import { useState, useEffect } from "react";
import { FaSearch, FaCheckCircle, FaTimesCircle, FaArrowRight, FaStar, FaClock, FaShieldAlt, FaPalette, FaTruck, FaMedal, FaChevronRight } from "react-icons/fa";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";

/* ── Design Tokens (mismo sistema) ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyDeep: "linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    danger: "#dc2626",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    purple: "#7c3aed",
    purpleSoft: "#f5f3ff",
};

const obtenerImagenTecnica = (tecnica) => {
    if (tecnica.imagenTecnica) return tecnica.imagenTecnica;
    const imagenesPorDefecto = {
        'serigrafía': 'https://cdn.shopify.com/s/files/1/0240/5856/0608/files/serigrafia-impresion-permeografica-branddu.webp?v=1701425637',
        'sublimación': 'https://www.brildor.com/blog/wp-content/uploads/2014/04/cabecera-que-es-la-sublimacion-2-1024x581.jpg',
        'bordado': 'https://cursos.artesdeolga.com/wp-content/uploads/2015/12/curso-bordado.jpg',
        'vinilo': 'https://alianzadigitalsyp.com/wp-content/uploads/2020/09/vinilo-adhesivo-textil-para-corte-alianza-digital-syp.jpg',
        'estampado': 'https://cdn.shopify.com/s/files/1/0240/5856/0608/files/serigrafia-impresion-permeografica-branddu.webp?v=1701425637',
        'digital': 'https://www.brildor.com/blog/wp-content/uploads/2014/04/cabecera-que-es-la-sublimacion-2-1024x581.jpg',
    };
    const nombre = tecnica.Nombre?.toLowerCase() || '';
    for (const [key, imagen] of Object.entries(imagenesPorDefecto)) {
        if (nombre.includes(key)) return imagen;
    }
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop';
};

const Servicios = () => {
    const [tecnicas, setTecnicas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => { cargarTecnicas(); }, []);

    const cargarTecnicas = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tecnicas`);
            if (!response.ok) throw new Error('Error al cargar las técnicas');
            const data = await response.json();
            setTecnicas(data.datos || data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tecnicasFiltradas = tecnicas.filter(t =>
        t.Nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.Descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const disponibles = tecnicas.filter(t => t.Estado).length;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }

                .srv-page { font-family: 'Outfit', sans-serif; background: ${C.bg}; }

                /* HERO */
                .srv-hero {
                    background: linear-gradient(135deg, #0f1824 0%, #1a2540 55%, #2d3f6e 100%);
                    position: relative;
                    overflow: hidden;
                    padding: 88px 32px 72px;
                    text-align: center;
                }
                .srv-hero::before {
                    content: '';
                    position: absolute;
                    top: -100px; left: -100px;
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(79,142,247,0.13) 0%, transparent 65%);
                    pointer-events: none;
                }
                .srv-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -80px; right: -60px;
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 65%);
                    pointer-events: none;
                }
                .srv-hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(79,142,247,0.12);
                    border: 1px solid rgba(79,142,247,0.3);
                    color: #4f8ef7;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 6px 16px;
                    border-radius: 20px;
                    margin-bottom: 20px;
                }
                .srv-hero h1 {
                    font-size: clamp(2rem, 5vw, 3.2rem);
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.03em;
                    margin: 0 0 16px;
                    line-height: 1.1;
                }
                .srv-hero h1 span {
                    background: linear-gradient(90deg, #4f8ef7, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .srv-hero-sub {
                    color: rgba(255,255,255,0.55);
                    font-size: 16px;
                    max-width: 560px;
                    margin: 0 auto 36px;
                    line-height: 1.7;
                }
                .srv-stat-box {
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px 28px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 14px;
                    backdrop-filter: blur(8px);
                    margin: 0 8px;
                }
                .srv-stat-num { font-size: 26px; font-weight: 800; color: #fff; line-height: 1; }
                .srv-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

                /* SEARCH */
                .srv-search-wrap {
                    max-width: 520px;
                    margin: 0 auto 36px;
                    position: relative;
                }
                .srv-search-input {
                    width: 100%;
                    padding: 14px 20px 14px 48px;
                    border: 2px solid ${C.border};
                    border-radius: 14px;
                    font-size: 14px;
                    font-family: 'Outfit', sans-serif;
                    color: ${C.text};
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    background: #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .srv-search-input:focus {
                    border-color: ${C.accent};
                    box-shadow: 0 0 0 3px rgba(79,142,247,0.12);
                }
                .srv-search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: ${C.muted};
                    font-size: 15px;
                }

                /* CARDS */
                .srv-card {
                    background: #fff;
                    border-radius: 18px;
                    overflow: hidden;
                    border: 1.5px solid ${C.border};
                    transition: all 0.28s cubic-bezier(.4,0,.2,1);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .srv-card:hover {
                    transform: translateY(-8px);
                    border-color: ${C.accent};
                    box-shadow: 0 20px 48px rgba(79,142,247,0.18), 0 4px 12px rgba(0,0,0,0.08);
                }
                .srv-card-img-wrap {
                    position: relative;
                    overflow: hidden;
                    height: 210px;
                }
                .srv-card-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.4s cubic-bezier(.4,0,.2,1);
                }
                .srv-card:hover .srv-card-img { transform: scale(1.07); }
                .srv-card-img-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(26,37,64,0.7) 0%, transparent 55%);
                    opacity: 0;
                    transition: opacity 0.28s;
                }
                .srv-card:hover .srv-card-img-overlay { opacity: 1; }
                .srv-card-status {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    font-family: 'Outfit', sans-serif;
                    backdrop-filter: blur(8px);
                }
                .srv-card-body {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .srv-card-title {
                    font-size: 17px;
                    font-weight: 800;
                    color: ${C.navy};
                    margin: 0 0 8px;
                    letter-spacing: -0.01em;
                }
                .srv-card-desc {
                    font-size: 13px;
                    color: ${C.muted};
                    line-height: 1.65;
                    flex: 1;
                    margin: 0 0 16px;
                }
                .srv-card-feature {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 12px;
                    color: ${C.success};
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .srv-card-btn {
                    width: 100%;
                    padding: 11px;
                    border: none;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    font-family: 'Outfit', sans-serif;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    margin-top: 14px;
                }
                .srv-card-btn-primary {
                    background: ${C.navyGrad};
                    color: #fff;
                }
                .srv-card-btn-primary:hover {
                    opacity: 0.88;
                    transform: translateY(-1px);
                }
                .srv-card-btn-disabled {
                    background: #f1f5f9;
                    color: ${C.muted};
                    cursor: not-allowed;
                }

                /* BENEFITS */
                .srv-benefit-card {
                    background: #fff;
                    border: 1.5px solid ${C.border};
                    border-radius: 18px;
                    padding: 28px 24px;
                    text-align: center;
                    transition: all 0.22s;
                }
                .srv-benefit-card:hover {
                    border-color: ${C.accent};
                    box-shadow: 0 8px 24px rgba(79,142,247,0.12);
                    transform: translateY(-4px);
                }
                .srv-benefit-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    font-size: 26px;
                }
                .srv-benefit-title { font-size: 16px; font-weight: 800; color: ${C.navy}; margin: 0 0 8px; }
                .srv-benefit-desc { font-size: 13px; color: ${C.muted}; line-height: 1.65; margin: 0; }

                /* STEPS */
                .srv-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                    padding: 24px;
                    background: #fff;
                    border: 1.5px solid ${C.border};
                    border-radius: 16px;
                    transition: all 0.22s;
                }
                .srv-step:hover {
                    border-color: ${C.accent};
                    box-shadow: 0 8px 24px rgba(79,142,247,0.10);
                }
                .srv-step-num {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: ${C.navyGrad};
                    color: #fff;
                    font-size: 20px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .srv-step-title { font-size: 15px; font-weight: 700; color: ${C.navy}; margin: 0 0 5px; }
                .srv-step-desc { font-size: 13px; color: ${C.muted}; margin: 0; line-height: 1.6; }

                /* CTA */
                .srv-cta {
                    background: linear-gradient(135deg, #0f1824 0%, #1a2540 55%, #2d3f6e 100%);
                    position: relative;
                    overflow: hidden;
                    padding: 72px 32px;
                    text-align: center;
                }
                .srv-cta::before {
                    content: '';
                    position: absolute;
                    top: -80px; left: 50%;
                    transform: translateX(-50%);
                    width: 600px; height: 300px;
                    background: radial-gradient(ellipse, rgba(79,142,247,0.15) 0%, transparent 70%);
                    pointer-events: none;
                }
                .srv-cta-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 36px;
                    background: #fff;
                    color: ${C.navy};
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 800;
                    font-family: 'Outfit', sans-serif;
                    cursor: pointer;
                    transition: all 0.22s;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .srv-cta-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }

                /* SECTION TITLES */
                .srv-section-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: ${C.accent};
                    margin: 0 0 8px;
                }
                .srv-section-title {
                    font-size: clamp(1.5rem, 3vw, 2rem);
                    font-weight: 800;
                    color: ${C.navy};
                    letter-spacing: -0.02em;
                    margin: 0 0 10px;
                }
                .srv-section-sub {
                    font-size: 14px;
                    color: ${C.muted};
                    margin: 0;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: none; }
                }
                .srv-card { animation: fadeInUp 0.4s ease both; }

                @media (max-width: 768px) {
                    .srv-stats-row { flex-direction: column; gap: 12px; }
                    .srv-grid-4 { grid-template-columns: 1fr 1fr !important; }
                    .srv-grid-3 { grid-template-columns: 1fr !important; }
                    .srv-grid-steps { grid-template-columns: 1fr 1fr !important; }
                }
                @media (max-width: 480px) {
                    .srv-grid-4, .srv-grid-steps { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div className="srv-page">
                <NavbarComponent />

                {/* ══════════ HERO ══════════ */}
                <section className="srv-hero">
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div className="srv-hero-badge">
                            <FaStar size={10} /> Técnicas profesionales de estampado
                        </div>
                        <h1>Tu marca en cada<br /><span>prenda</span></h1>
                        <p className="srv-hero-sub">
                            Transformamos tus ideas en prendas únicas con las mejores técnicas del mercado. Calidad garantizada en cada pedido.
                        </p>
                        <div className="srv-stats-row" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
                            <div className="srv-stat-box">
                                <span className="srv-stat-num">5+</span>
                                <span className="srv-stat-label">Años de experiencia</span>
                            </div>
                            <div className="srv-stat-box">
                                <span className="srv-stat-num">{disponibles}</span>
                                <span className="srv-stat-label">Técnicas disponibles</span>
                            </div>
                            <div className="srv-stat-box">
                                <span className="srv-stat-num">100%</span>
                                <span className="srv-stat-label">Calidad garantizada</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TOP ACCENT LINE */}
                <div style={{ height: 3, background: "linear-gradient(90deg, #4f8ef7 0%, #7c3aed 50%, #4f8ef7 100%)" }} />

                {/* ══════════ TÉCNICAS ══════════ */}
                <section style={{ padding: "64px 32px", background: C.bg }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                        {/* Header */}
                        <div style={{ textAlign: "center", marginBottom: 40 }}>
                            <p className="srv-section-label">Catálogo de servicios</p>
                            <h2 className="srv-section-title">Nuestras Técnicas</h2>
                            <p className="srv-section-sub">Elige la técnica perfecta para tu proyecto</p>
                        </div>

                        {/* Search */}
                        <div className="srv-search-wrap">
                            <FaSearch className="srv-search-icon" />
                            <input
                                className="srv-search-input"
                                placeholder="Buscar técnica de estampado..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div style={{ textAlign: "center", padding: "60px 0" }}>
                                <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                <p style={{ color: C.muted, fontSize: 14 }}>Cargando técnicas disponibles...</p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "24px 28px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
                                <p style={{ color: C.danger, fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>Error al cargar las técnicas</p>
                                <p style={{ color: C.muted, fontSize: 13, margin: "0 0 16px" }}>{error}</p>
                                <button onClick={cargarTecnicas}
                                    style={{ padding: "9px 22px", background: C.danger, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {/* Cards grid */}
                        {!loading && !error && (
                            tecnicasFiltradas.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                                    <FaSearch size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
                                    <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>No se encontraron técnicas</p>
                                    <p style={{ fontSize: 13 }}>Intenta con otra búsqueda</p>
                                </div>
                            ) : (
                                <div className="srv-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
                                    {tecnicasFiltradas.map((tecnica, index) => (
                                        <div
                                            key={tecnica.TecnicaID || index}
                                            className="srv-card"
                                            style={{ animationDelay: `${index * 0.06}s` }}
                                            onMouseEnter={() => setHoveredCard(tecnica.TecnicaID)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                        >
                                            {/* Imagen */}
                                            <div className="srv-card-img-wrap">
                                                <img
                                                    className="srv-card-img"
                                                    src={obtenerImagenTecnica(tecnica)}
                                                    alt={tecnica.Nombre}
                                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop'; }}
                                                />
                                                <div className="srv-card-img-overlay" />
                                                {/* Status badge */}
                                                <div className="srv-card-status" style={{
                                                    background: tecnica.Estado ? "rgba(22,163,74,0.9)" : "rgba(100,116,139,0.85)",
                                                    color: "#fff",
                                                }}>
                                                    {tecnica.Estado
                                                        ? <><FaCheckCircle size={10} /> Disponible</>
                                                        : <><FaTimesCircle size={10} /> No disponible</>
                                                    }
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="srv-card-body">
                                                <p className="srv-card-title">{tecnica.Nombre}</p>
                                                <p className="srv-card-desc">
                                                    {tecnica.Descripcion || "Técnica de estampado profesional de alta calidad para tus prendas."}
                                                </p>

                                                {tecnica.Estado && (
                                                    <div style={{ background: C.successSoft, borderRadius: 10, padding: "10px 12px", border: `1px solid #bbf7d0`, marginBottom: 4 }}>
                                                        {["Alta durabilidad", "Acabado profesional", "Resistente al lavado"].map(f => (
                                                            <div key={f} className="srv-card-feature">
                                                                <FaCheckCircle size={11} /> {f}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    className={`srv-card-btn ${tecnica.Estado ? "srv-card-btn-primary" : "srv-card-btn-disabled"}`}
                                                    disabled={!tecnica.Estado}
                                                    onClick={() => tecnica.Estado && (window.location.href = '/cotizacionesLanding')}
                                                >
                                                    {tecnica.Estado
                                                        ? <><FaArrowRight size={12} /> Solicitar Servicio</>
                                                        : "No disponible"
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </section>

                {/* ══════════ POR QUÉ ELEGIRNOS ══════════ */}
                <section style={{ padding: "64px 32px", background: "#fff", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 44 }}>
                            <p className="srv-section-label">Nuestra propuesta de valor</p>
                            <h2 className="srv-section-title">¿Por qué elegirnos?</h2>
                            <p className="srv-section-sub">Tres razones que nos hacen diferentes</p>
                        </div>

                        <div className="srv-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
                            {[
                                {
                                    icon: <FaPalette />,
                                    color: C.accent,
                                    colorSoft: C.accentSoft,
                                    title: "Diseño Personalizado",
                                    desc: "Creamos diseños únicos adaptados completamente a tus necesidades y preferencias. Cada prenda es una obra de arte."
                                },
                                {
                                    icon: <FaTruck />,
                                    color: C.success,
                                    colorSoft: C.successSoft,
                                    title: "Entrega Rápida",
                                    desc: "Tiempos de producción optimizados sin sacrificar la calidad del producto final. Tu pedido llega cuando lo necesitas."
                                },
                                {
                                    icon: <FaMedal />,
                                    color: C.purple,
                                    colorSoft: "#f5f3ff",
                                    title: "Calidad Superior",
                                    desc: "Utilizamos materiales premium y técnicas profesionales en cada trabajo. Resultados que superan tus expectativas."
                                },
                            ].map((b, i) => (
                                <div key={i} className="srv-benefit-card">
                                    <div className="srv-benefit-icon" style={{ background: b.colorSoft, color: b.color }}>
                                        {b.icon}
                                    </div>
                                    <p className="srv-benefit-title">{b.title}</p>
                                    <p className="srv-benefit-desc">{b.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════ PROCESO ══════════ */}
                <section style={{ padding: "64px 32px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 44 }}>
                            <p className="srv-section-label">Cómo trabajamos</p>
                            <h2 className="srv-section-title">Nuestro Proceso</h2>
                            <p className="srv-section-sub">Simple, transparente y eficiente</p>
                        </div>

                        <div className="srv-grid-steps" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
                            {[
                                { num: "01", titulo: "Consulta", desc: "Cuéntanos tu idea y te asesoramos sobre la mejor técnica para tu proyecto." },
                                { num: "02", titulo: "Diseño", desc: "Creamos o adaptamos el diseño según tus especificaciones y necesidades." },
                                { num: "03", titulo: "Producción", desc: "Aplicamos la técnica seleccionada con precisión y materiales de primera." },
                                { num: "04", titulo: "Entrega", desc: "Recibes tu producto terminado en el tiempo acordado, con calidad garantizada." },
                            ].map((paso, idx) => (
                                <div key={idx} className="srv-step">
                                    <div className="srv-step-num">{paso.num}</div>
                                    <div>
                                        <p className="srv-step-title">{paso.titulo}</p>
                                        <p className="srv-step-desc">{paso.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════ CTA ══════════ */}
                <section className="srv-cta">
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>
                            ¿Listo para empezar?
                        </p>
                        <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 14px" }}>
                            Crea algo increíble hoy
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: "0 0 32px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
                            Contáctanos y comencemos tu proyecto. Respuesta garantizada en menos de 24 horas.
                        </p>
                        <button className="srv-cta-btn" onClick={() => window.location.href = '/cotizacionesLanding'}>
                            Solicitar Cotización <FaChevronRight size={13} />
                        </button>
                    </div>
                </section>

                <FooterComponent />
            </div>
        </>
    );
};

export default Servicios;