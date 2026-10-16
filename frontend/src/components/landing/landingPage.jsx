import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import FooterComponent from "./footer";
import NavbarComponent from "./NavBarLanding";
import ScrollToTopButton from "./ScrollTopButton";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";
import usePlus from "../../hooks/usePlus";
import "./landing.css";
import imgBlanca from "../../assets/images/camisablanca.png";
import imgNegra from "../../assets/images/camisanegra.png";
import imgBuzo from "../../assets/images/buzo.png";

const coloresHex = {
    "Rojo":"#ef4444","Azul":"#3b82f6","Verde":"#22c55e","Amarillo":"#eab308",
    "Negro":"#1e1e1e","Blanco":"#ebebeb","Rosa":"#ec4899","Morado":"#a855f7",
    "Naranja":"#f97316","Gris":"#94a3b8","Café":"#92400e","Cafe":"#92400e",
};

const TECNICAS = [
    { n:"01", titulo:"Serigrafía",   desc:"Tintas especializadas sobre la tela. Alta cobertura, colores sólidos y durabilidad comprobada. Recomendada para pedidos de volumen." },
    { n:"02", titulo:"Sublimación",  desc:"El diseño se integra a nivel molecular con la fibra. Resultado fotográfico, sin relieve, resistente al lavado sin desgaste." },
    { n:"03", titulo:"Vinil Textil", desc:"Corte de precisión con acabado mate o brillante. Ideal para logos, nombres y números con bordes limpios." },
    { n:"04", titulo:"Bordado",      desc:"Hilo en relieve de alta resistencia. Aporta textura y distinción a gorras, camisas y uniformes corporativos." },
];

const STATS = [
    { num:"3",   suf:"+",  label:"Años de experiencia" },
    { num:"500", suf:"+",  label:"Pedidos entregados" },
    { num:"4",   suf:"",   label:"Técnicas disponibles" },
    { num:"100", suf:"%",  label:"Garantía de calidad" },
];

const PASOS = [
    { n:"01", titulo:"Elige tu prenda",    desc:"Selecciona producto, talla y color en el catálogo." },
    { n:"02", titulo:"Comparte tu diseño", desc:"Sube el archivo o cuéntanos la idea. La cotizamos." },
    { n:"03", titulo:"Confirmamos todo",   desc:"Revisamos materiales, técnica y stock. Cero sorpresas." },
    { n:"04", titulo:"Recibes tu pedido",  desc:"Producción y entrega en el tiempo acordado." },
];

/* ─── Contador animado ─── */
const Counter = ({ num, suf }) => {
    const [val, setVal] = useState(0);
    const ref  = useRef(null);
    const done = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !done.current) {
                done.current = true;
                const n = parseInt(num, 10);
                let cur = 0;
                const step = n / 40;
                const t = setInterval(() => {
                    cur = Math.min(cur + step, n);
                    setVal(Math.floor(cur));
                    if (cur >= n) clearInterval(t);
                }, 28);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [num]);
    return <span ref={ref}>{val}{suf}</span>;
};

const ChevLeft  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Check     = ({ color = "currentColor" }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowR    = ({ color = "currentColor" }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

const Wave = ({ fill, flip, className = "sx-wave", style }) => (
    <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ transform: flip ? "scaleY(-1)" : undefined, ...style }}>
        <path fill={fill} d="M0 40c120 36 240 40 360 20S600 0 720 8s240 56 360 56 240-24 360-44v60H0z" />
    </svg>
);

const CINTA = ["Serigrafía", "Sublimación", "Vinil textil", "Bordado", "Camisetas", "Buzos", "Gorras", "Uniformes"];

/* ══════════════════════════════════
   HOME
══════════════════════════════════ */
const Home = () => {
    usePlus();
    const navigate = useNavigate();
    const [productos,  setProductos]  = useState([]);
    const [tallas,     setTallas]     = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [slide,      setSlide]      = useState(0);

    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        try {
            const [pRes, tRes] = await Promise.all([getProductos(), getTallas()]);
            const data = (pRes.datos || pRes).filter(p => p.inventario?.some(i => i.Stock > 0 && i.Estado));
            setProductos(data);
            setTallas(tRes.datos || tRes);
        } catch (e) { console.error(e); }
        finally { setCargando(false); }
    };

    const precioMin = (p) => {
        const base = parseFloat(p.PrecioBase) || 0;
        const vars = p.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
        if (!vars.length) return base;
        const ids = [...new Set(vars.map(i => i.TallaID))].sort((a, b) => a - b);
        const t = tallas.find(t => t.TallaID === ids[0]);
        return base + (parseFloat(t?.Precio) || 0);
    };
    const coloresOf = (p) => [...new Set(p.inventario?.filter(i => i.Stock > 0 && i.Estado).map(i => i.color?.Nombre).filter(Boolean))];

    const PPS = 3;
    const totalS  = Math.ceil(productos.length / PPS);
    const current = productos.slice(slide * PPS, (slide + 1) * PPS);

    const cinta = [...CINTA, ...CINTA];

    return (
        <div className="hm-root">
            <NavbarComponent />

            {/* ══════════ HERO ══════════ */}
            <section className="hm-hero sx-hero-bg">
                <div className="sx-blob b1" /><div className="sx-blob b2" /><div className="sx-blob b3" />
                <div className="hm-hero-grid">
                    <div className="sx-hero-in">
                        <span className="hm-badge"><i className="hm-dot sx-pulse" /> StampLab · Desde 2022</span>
                        <div>
                            <h1 className="hm-h1">DISEÑA</h1>
                            <h1 className="hm-h1 sx-outline-text">TU ESTILO,</h1>
                            <h1 className="hm-h1 sx-gradient-text">ESTAMPA TU IDENTIDAD.</h1>
                        </div>
                        <p className="hm-lead">Serigrafía, sublimación, vinil textil y bordado. Cuéntanos tu idea y la hacemos realidad.</p>
                        <div className="hm-cta">
                            <button className="sx-btn" onClick={() => navigate("/productosLanding")}>Ver productos <ArrowR color="#fff"/></button>
                            <button className="sx-btn sx-btn-ghost" onClick={() => navigate("/cotizacionesLanding")}>Cotizar diseño</button>
                        </div>
                        <div className="hm-hero-stats">
                            {STATS.slice(0, 3).map((s, i) => (
                                <div key={i}><b><Counter num={s.num} suf={s.suf}/></b><span>{s.label}</span></div>
                            ))}
                        </div>
                    </div>

                    <div className="hm-stage" aria-hidden="true">
                        <div className="hm-ring" /><div className="hm-ring hm-ring2" /><div className="hm-orb sx-bob" />
                        <div className="hm-fcard hm-fc1"><img src={imgBlanca} alt="" /></div>
                        <div className="hm-fcard hm-fc2"><img src={imgNegra} alt="" /></div>
                        <div className="hm-fcard hm-fc3"><img src={imgBuzo} alt="" /></div>
                        <div className="hm-tag t1 sx-bob"><i>✦</i> Calidad premium</div>
                        <div className="hm-tag t2 sx-bob" style={{ animationDelay: "-2s" }}><i>★</i> Entrega a tiempo</div>
                    </div>
                </div>
                <div className="hm-scroll" />
                <Wave fill="#ffffff" className="sx-wave hm-wave-hero" />
            </section>

            {/* ══════════ CINTA ══════════ */}
            <div className="hm-ribbon">
                <div className="sx-marquee">
                    <div className="sx-marquee-track">
                        {cinta.map((t, i) => (
                            <span key={i} className={`hm-ribbon-item ${i % 2 ? "o" : ""}`}>{t} <span className="hm-star">✦</span></span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════ QUIÉNES SOMOS ══════════ */}
            <section className="sx-section" style={{ background:"#fff" }}>
                <div className="sx-wrap hm-about">
                    <div className="sx-reveal sx-reveal-left">
                        <span className="sx-eyebrow">Quiénes somos</span>
                        <h2 className="sx-title">Transformamos ideas en <span className="sx-gradient-text">prendas que la gente usa</span></h2>
                        <p className="hm-p">Desde 2022 personalizamos ropa y accesorios para personas, equipos y marcas. Trabajamos con la técnica que cada diseño necesita — no usamos plantillas genéricas.</p>
                        <p className="hm-p" style={{ marginBottom: 24 }}>Cada pedido pasa por un proceso de asesoría donde revisamos diseño, técnica y materiales antes de producir. Sin sorpresas en la entrega.</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                            {[
                                ["Materiales de primera",  "Usamos insumos que duran lavado tras lavado."],
                                ["Asesoría incluida",      "Te orientamos en técnica, colores y acabados."],
                                ["Tiempos cumplidos",      "Acordamos fecha de entrega y la respetamos."],
                            ].map(([t, d], i) => (
                                <div key={i} className="hm-feat">
                                    <div className="sx-icon"><Check color="#fff"/></div>
                                    <div><b>{t}</b><span>{d}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hm-visual sx-reveal sx-reveal-right">
                        <div className="hm-vbox sx-tilt">
                            <div>
                                <p style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".2em", marginBottom:10 }}>Stamp</p>
                                <p className="hm-big sx-gradient-text">LAB</p>
                            </div>
                            <div style={{ borderTop:"1px solid rgba(255,255,255,.14)", paddingTop:22, marginTop:32 }}>
                                <p style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".16em", marginBottom:12 }}>Técnicas</p>
                                {["Serigrafía","Sublimación","Vinil","Bordado"].map(t => <span key={t} className="hm-pill">{t}</span>)}
                            </div>
                        </div>
                        <div className="hm-float sx-bob"><b className="sx-gradient-text">500+</b><span>pedidos entregados</span></div>
                    </div>
                </div>
            </section>

            {/* ══════════ ESTADÍSTICAS ══════════ */}
            <section className="hm-stats sx-hero-bg" style={{ padding:"70px 24px" }}>
                <div className="sx-blob b1" style={{ opacity:.25 }} /><div className="sx-blob b2" style={{ opacity:.25 }} />
                <div className="sx-wrap sx-grid sx-grid-4" style={{ gap:10 }}>
                    {STATS.map((s, i) => (
                        <div key={i} className="hm-stat sx-reveal" style={{ "--sx-i": i }}>
                            <b><Counter num={s.num} suf={s.suf}/></b><span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ TÉCNICAS ══════════ */}
            <section className="sx-section sx-hero-bg" style={{ paddingBottom: 110 }}>
                <div className="sx-blob b3" style={{ top:"10%", left:"70%" }} />
                <div className="sx-wrap">
                    <div className="sx-reveal" style={{ textAlign:"center", marginBottom:50 }}>
                        <span className="sx-eyebrow">Lo que hacemos</span>
                        <h2 className="sx-title" style={{ color:"#fff" }}>Nuestras <span className="sx-gradient-text">técnicas</span></h2>
                        <p className="sx-sub" style={{ margin:"0 auto", color:"rgba(255,255,255,.65)" }}>La técnica correcta depende del diseño, la prenda y el volumen del pedido.</p>
                    </div>
                    <div className="sx-grid sx-grid-4">
                        {TECNICAS.map((t, i) => (
                            <div key={i} className="sx-glass sx-reveal" style={{ "--sx-i": i }}>
                                <div className="hm-tec">
                                    <p className="n">{t.n}</p>
                                    <h3>{t.titulo}</h3>
                                    <p>{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ PRODUCTOS ══════════ */}
            <section className="sx-section sx-alt">
                <div className="sx-wrap">
                    <div className="hm-head sx-reveal">
                        <div>
                            <span className="sx-eyebrow">Catálogo</span>
                            <h2 className="sx-title" style={{ marginBottom:0 }}>Productos <span className="sx-gradient-text">disponibles</span></h2>
                        </div>
                        <div className="hm-nav">
                            {totalS > 1 && (
                                <>
                                    <button className="hm-arrow" aria-label="Anterior" onClick={() => setSlide(p => Math.max(0,p-1))} disabled={slide===0}><ChevLeft/></button>
                                    <span style={{ fontSize:13, color:"#64748b", fontWeight:700, minWidth:44, textAlign:"center" }}>{slide+1} / {totalS}</span>
                                    <button className="hm-arrow" aria-label="Siguiente" onClick={() => setSlide(p => Math.min(totalS-1,p+1))} disabled={slide===totalS-1}><ChevRight/></button>
                                </>
                            )}
                            <button className="sx-btn sx-btn-dark sx-btn-sm" onClick={() => navigate("/productosLanding")}>Ver todos <ArrowR color="#fff"/></button>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="sx-grid">{[1,2,3].map(i => <div key={i} className="hm-skel" />)}</div>
                    ) : productos.length === 0 ? (
                        <div className="hm-empty">
                            <p style={{ fontWeight:800, color:"#1a2540", marginBottom:4 }}>No hay productos disponibles por ahora.</p>
                            <p style={{ color:"#64748b", fontSize:14 }}>Vuelve pronto.</p>
                        </div>
                    ) : (
                        <div className="sx-grid" key={slide}>
                            {current.map((p, idx) => {
                                const precio = precioMin(p);
                                const cols   = coloresOf(p);
                                return (
                                    <div key={p.ProductoID} className="sx-card sx-reveal hm-prod" style={{ "--sx-i": idx }}>
                                        <div className="hm-pimg sx-zoom">
                                            {p.ImagenProducto
                                                ? <img src={p.ImagenProducto} alt={p.Nombre} onError={e=>e.target.style.display="none"}/>
                                                : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><p style={{ fontSize:13, color:"#64748b" }}>Sin imagen</p></div>
                                            }
                                            <span className="hm-avail">● Disponible</span>
                                        </div>
                                        <div className="hm-pbody">
                                            <p className="hm-pname">{p.Nombre}</p>
                                            {p.Descripcion && <p className="hm-pdesc">{p.Descripcion}</p>}
                                            {cols.length > 0 && (
                                                <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                                                    <span style={{ fontSize:11, color:"#64748b", fontWeight:700 }}>Colores</span>
                                                    {cols.map(c => <span key={c} title={c} className="hm-swatch" style={{ background:coloresHex[c]||"#ccc" }}/>)}
                                                </div>
                                            )}
                                            <div className="hm-pfoot">
                                                <div className="hm-price"><small>Desde</small><b>${precio.toLocaleString("es-CO")}</b></div>
                                                <button className="sx-btn sx-btn-sm" onClick={() => navigate("/productosLanding")}>Ver <ArrowR color="#fff"/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════ PROCESO ══════════ */}
            <section className="sx-section" style={{ background:"#fff" }}>
                <div className="sx-wrap">
                    <div className="sx-reveal" style={{ textAlign:"center", marginBottom:54 }}>
                        <span className="sx-eyebrow">Proceso</span>
                        <h2 className="sx-title">¿Cómo <span className="sx-gradient-text">funciona?</span></h2>
                        <p className="sx-sub" style={{ margin:"0 auto" }}>Del concepto a la prenda en cuatro pasos. Sin letra chica.</p>
                    </div>
                    <div className="hm-steps sx-grid sx-grid-4">
                        {PASOS.map((paso, i) => (
                            <div key={i} className="sx-card sx-reveal" style={{ "--sx-i": i }}>
                                <div className="hm-step">
                                    <p className="sx-num">{paso.n}</p>
                                    <h3>{paso.titulo}</h3>
                                    <p>{paso.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ CTA FINAL ══════════ */}
            <section className="hm-cta-sec sx-hero-bg">
                <div className="sx-blob b1" /><div className="sx-blob b2" />
                <div className="sx-wrap sx-reveal sx-reveal-zoom">
                    <span className="sx-eyebrow" style={{ color:"#9bbcff" }}>¿Tienes un proyecto?</span>
                    <h2 className="hm-cta-title">Tu idea merece <span className="sx-gradient-text">ser real.</span></h2>
                    <p className="hm-cta-p">Cotiza sin compromiso. Revisamos juntos el diseño, la técnica y el presupuesto. Sin costos ocultos.</p>
                    <div className="hm-cta" style={{ justifyContent:"center" }}>
                        <button className="sx-btn sx-btn-light" onClick={() => navigate("/cotizacionesLanding")}>Cotizar gratis <ArrowR color="#1a2540"/></button>
                        <button className="sx-btn sx-btn-ghost" onClick={() => navigate("/productosLanding")}>Ver catálogo</button>
                    </div>
                </div>
            </section>

            <FooterComponent />
            <ScrollToTopButton />
        </div>
    );
};

export default Home;
