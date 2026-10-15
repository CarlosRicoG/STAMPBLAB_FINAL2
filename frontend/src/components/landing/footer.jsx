import { FaWhatsapp, FaFacebook, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";

const FooterComponent = () => {
    const year = new Date().getFullYear();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

                .sl-footer {
                    background: linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%);
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .sl-footer::before {
                    content: '';
                    position: absolute;
                    top: -60px;
                    left: -60px;
                    width: 320px;
                    height: 320px;
                    background: radial-gradient(circle, rgba(79,142,247,0.10) 0%, transparent 70%);
                    pointer-events: none;
                }

                .sl-footer::after {
                    content: '';
                    position: absolute;
                    bottom: -80px;
                    right: -40px;
                    width: 280px;
                    height: 280px;
                    background: radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%);
                    pointer-events: none;
                }

                .sl-footer-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.35), rgba(255,255,255,0.08), rgba(79,142,247,0.35), transparent);
                    margin: 0;
                    border: none;
                }

                .sl-footer-social-btn {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    border: 1.5px solid rgba(255,255,255,0.10);
                    background: rgba(255,255,255,0.05);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.22s cubic-bezier(.4,0,.2,1);
                    text-decoration: none;
                    color: rgba(255,255,255,0.65);
                    backdrop-filter: blur(4px);
                }

                .sl-footer-social-btn:hover {
                    transform: translateY(-3px) scale(1.08);
                    border-color: rgba(79,142,247,0.5);
                    background: rgba(79,142,247,0.15);
                    color: #fff;
                    box-shadow: 0 8px 20px rgba(79,142,247,0.25);
                }

                .sl-footer-social-btn.wa:hover  { border-color: rgba(37,211,102,0.5); background: rgba(37,211,102,0.12); box-shadow: 0 8px 20px rgba(37,211,102,0.2); }
                .sl-footer-social-btn.fb:hover  { border-color: rgba(24,119,242,0.5); background: rgba(24,119,242,0.12); box-shadow: 0 8px 20px rgba(24,119,242,0.2); }
                .sl-footer-social-btn.ig:hover  { border-color: rgba(228,64,95,0.5);  background: rgba(228,64,95,0.12);  box-shadow: 0 8px 20px rgba(228,64,95,0.2);  }

                .sl-footer-link {
                    color: rgba(255,255,255,0.5);
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 400;
                    transition: color 0.18s, padding-left 0.18s;
                    display: inline-block;
                    line-height: 1.8;
                }

                .sl-footer-link:hover {
                    color: #4f8ef7;
                    padding-left: 6px;
                }

                .sl-footer-contact-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(255,255,255,0.5);
                    font-size: 13px;
                    margin-bottom: 10px;
                    transition: color 0.18s;
                }

                .sl-footer-contact-item:hover { color: rgba(255,255,255,0.85); }

                .sl-footer-contact-icon {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    background: rgba(79,142,247,0.12);
                    border: 1px solid rgba(79,142,247,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: #4f8ef7;
                }

                .sl-footer-badge {
                    display: inline-block;
                    background: linear-gradient(90deg, #4f8ef7 0%, #7c3aed 100%);
                    color: #fff;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    padding: 3px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    margin-bottom: 14px;
                }

                .sl-footer-section-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: rgba(255,255,255,0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin: 0 0 16px;
                }

                .sl-brand-name {
                    font-size: 22px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                    line-height: 1;
                    margin: 0 0 6px;
                }

                .sl-brand-tagline {
                    font-size: 12px;
                    color: rgba(255,255,255,0.4);
                    font-weight: 400;
                    margin: 0;
                }

                .sl-footer-bottom {
                    background: rgba(0,0,0,0.25);
                    padding: 14px 0;
                }
            `}</style>

            <footer className="sl-footer">
                {/* TOP ACCENT LINE */}
                <div style={{
                    height: 3,
                    background: "linear-gradient(90deg, #4f8ef7 0%, #7c3aed 50%, #4f8ef7 100%)",
                    backgroundSize: "200% 100%",
                    animation: "none"
                }} />

                {/* MAIN CONTENT */}
                <div style={{ padding: "48px 0 36px", position: "relative", zIndex: 1 }}>
                    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40, alignItems: "start" }}>

                            {/* ── COLUMNA 1: BRAND ── */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <img
                                        src="src/assets/logostamplab.png"
                                        alt="StampLab"
                                        style={{ height: 48, objectFit: "contain", filter: "brightness(1.1)" }}
                                        onError={e => { e.target.style.display = "none"; }}
                                    />
                                    <div>
                                        <p className="sl-brand-name">StampLab</p>
                                        <p className="sl-brand-tagline text-light">Tu marca, nuestra pasión</p>
                                    </div>
                                </div>
                                <p style={{ color: "#ffff", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 260 }}>
                                    Estampamos tu identidad en cada prenda. Calidad, creatividad y entrega a tiempo, siempre.
                                </p>
                                {/* REDES */}
                                <div style={{ display: "flex", gap: 10 }}>
                                    <a href="https://wa.me/" target="_blank" rel="noreferrer" className="sl-footer-social-btn wa" title="WhatsApp">
                                        <FaWhatsapp size={17} />
                                    </a>
                                    <a href="https://facebook.com" target="_blank" rel="noreferrer" className="sl-footer-social-btn fb" title="Facebook">
                                        <FaFacebook size={17} />
                                    </a>
                                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="sl-footer-social-btn ig" title="Instagram">
                                        <FaInstagram size={17} />
                                    </a>
                                </div>
                            </div>

                            {/* ── COLUMNA 2: NAVEGACIÓN ── */}
                            <div>
                                <p className="sl-footer-section-title">Navegación</p>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <Link to="/landing" className="sl-footer-link">Inicio</Link>
                                    <Link to="/cotizacionesLanding" className="sl-footer-link">Cotizar</Link>
                                    <Link to="/productosLanding" className="sl-footer-link">Catálogo Productos</Link>
                                    <Link to="/servicios" className="sl-footer-link">Servicios</Link>
                                </div>
                            </div>

                            {/* ── COLUMNA 4: CONTACTO ── */}
                            <div>
                                <p className="sl-footer-section-title">Contacto</p>
                                <div className="sl-footer-contact-item">
                                    <div className="sl-footer-contact-icon"><FaMapMarkerAlt size={12} /></div>
                                    <span>Medellín, Colombia</span>
                                </div>
                                <div className="sl-footer-contact-item">
                                    <div className="sl-footer-contact-icon"><FaPhone size={12} /></div>
                                    <span>+57 304 3519567</span>
                                </div>
                                <div className="sl-footer-contact-item">
                                    <div className="sl-footer-contact-icon"><FaEnvelope size={12} /></div>
                                    <span>hola@stamplab.co</span>
                                </div>
                            </div>

                            {/* HORARIO */}
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: "10px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",        // centra horizontalmente
                                    justifyContent: "center",    // centra verticalmente
                                    textAlign: "center",         // centra el texto
                                    background: "rgba(79,142,247,0.08)",
                                    borderRadius: 10,
                                    border: "1px solid rgba(79,142,247,0.15)"
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 8px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#4f8ef7",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em"
                                    }}
                                >
                                    Horario
                                </p>

                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.7)",
                                        lineHeight: 1.8
                                    }}
                                >
                                    <strong>Lun – Vie</strong><br />
                                    8:00 AM – 6:00 PM<br /><br />
                                    <strong>Sáb</strong><br />
                                    9:00 AM – 2:00 PM
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* DIVIDER */}
                <hr className="sl-footer-divider" />

                {/* BOTTOM BAR */}
                <div className="sl-footer-bottom">
                    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 12, color: "#ffff", fontFamily: "'Outfit', sans-serif" }}>
                            © {year} StampLab. Todos los derechos reservados.
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: "#ffff", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                            Hecho con <FaHeart size={10} style={{ color: "#dc2626" }} /> en Colombia
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default FooterComponent;