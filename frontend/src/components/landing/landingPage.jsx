import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import FooterComponent from "./footer";
import NavbarComponent from "./NavBarLanding";
import ScrollToTopButton from "./ScrollTopButton";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";

const C = {
    navy:      "#1a2540",
    navyDark:  "#0f1824",
    accent:    "#4f8ef7",
    text:      "#0f172a",
    muted:     "#64748b",
    mutedDark: "rgba(255,255,255,0.38)",
    border:    "#e2e8f0",
    borderDark:"rgba(255,255,255,0.09)",
    bg:        "#f8fafc",
    white:     "#ffffff",
    success:   "#16a34a",
    successBg: "#f0fdf4",
};

const FONT = "'Outfit', sans-serif";

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

/* ─── Chevron SVG ─── */
const ChevLeft  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Check     = ({ color = "currentColor" }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowR    = ({ color = "currentColor" }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/* ══════════════════════════════════
   HOME
══════════════════════════════════ */
const Home = () => {
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

    return (
        <div style={{ fontFamily: FONT, background: C.bg, overflowX: "hidden" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
                @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

                .h1 { animation: fadeUp 0.6s ease 0.04s both }
                .h2 { animation: fadeUp 0.6s ease 0.16s both }
                .h3 { animation: fadeUp 0.6s ease 0.27s both }
                .h4 { animation: fadeUp 0.6s ease 0.38s both }
                .h5 { animation: fadeIn 0.8s ease 0.55s both }

                .prod-c  { transition: box-shadow 0.2s, transform 0.2s; }
                .prod-c:hover  { box-shadow: 0 10px 32px rgba(26,37,64,0.12); transform: translateY(-4px); }
                .prod-c:hover .pimg { transform: scale(1.05); }
                .pimg { transition: transform 0.3s ease; }

                .tec-r { transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.08); }
                .tec-r:hover { background: rgba(255,255,255,0.03); }

                .step-c { transition: border-color 0.18s; }
                .step-c:hover { border-color: ${C.accent}; }

                /* Botones sin gradiente */
                .btn-n {
                    background: ${C.navy}; color: #fff;
                    border: 2px solid ${C.navy}; border-radius: 8px;
                    padding: 11px 24px; font-weight: 700; font-size: 14px;
                    cursor: pointer; font-family: ${FONT};
                    display: inline-flex; align-items: center; gap: 7px;
                    transition: background 0.16s;
                    text-decoration: none;
                }
                .btn-n:hover { background: ${C.navyDark}; border-color: ${C.navyDark}; }

                .btn-a {
                    background: ${C.accent}; color: #fff;
                    border: 2px solid ${C.accent}; border-radius: 8px;
                    padding: 11px 24px; font-weight: 700; font-size: 14px;
                    cursor: pointer; font-family: ${FONT};
                    display: inline-flex; align-items: center; gap: 7px;
                    transition: background 0.16s;
                }
                .btn-a:hover { background: #3b7ae0; border-color: #3b7ae0; }

                .btn-g {
                    background: transparent; color: #fff;
                    border: 2px solid rgba(255,255,255,0.3); border-radius: 8px;
                    padding: 11px 24px; font-weight: 700; font-size: 14px;
                    cursor: pointer; font-family: ${FONT};
                    display: inline-flex; align-items: center; gap: 7px;
                    transition: border-color 0.16s, background 0.16s;
                }
                .btn-g:hover { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }

                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }

                @media (max-width: 768px) {
                    .hero-grid  { grid-template-columns: 1fr !important; }
                    .about-grid { grid-template-columns: 1fr !important; }
                    .cta-grid   { grid-template-columns: 1fr !important; }
                    .tec-r      { grid-template-columns: 50px 1fr !important; }
                    .tec-desc   { display: none !important; }
                }
            `}</style>

            <NavbarComponent />

            {/* ══════════════════
                HERO
            ══════════════════ */}
            <section style={{ minHeight:"100vh", background:C.navy, display:"flex", alignItems:"center", padding:"120px 24px 80px", position:"relative", overflow:"hidden" }}>

                {/* Franja diagonal sutil */}
                <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"38%", background:"rgba(255,255,255,0.022)", clipPath:"polygon(16% 0, 100% 0, 100% 100%, 0% 100%)", pointerEvents:"none" }}/>
                {/* Línea vertical */}
                <div style={{ position:"absolute", left:"60%", top:0, bottom:0, width:1, background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>

                <div className="hero-grid" style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 220px", gap:48, alignItems:"center", position:"relative", zIndex:1 }}>

                    {/* Texto */}
                    <div>
                        <p className="h1" style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:20 }}>
                            StampLab · Desde 2022
                        </p>
                        <h1 className="h2" style={{ fontSize:"clamp(2.6rem,7vw,5.4rem)", fontWeight:900, color:"#fff", lineHeight:0.95, letterSpacing:"-0.04em", marginBottom:8 }}>DISEÑA</h1>
                        <h1 className="h3" style={{ fontSize:"clamp(2.6rem,7vw,5.4rem)", fontWeight:900, color:"transparent", WebkitTextStroke:"2px rgba(255,255,255,0.4)", lineHeight:0.95, letterSpacing:"-0.04em", marginBottom:8 }}>TU ESTILO,</h1>
                        <h1 className="h3" style={{ fontSize:"clamp(2.6rem,7vw,5.4rem)", fontWeight:900, color:C.accent, lineHeight:0.95, letterSpacing:"-0.04em", marginBottom:28 }}>ESTAMPA TU IDENTIDAD.</h1>
                        <p className="h4" style={{ fontSize:16, color:"rgba(255,255,255,0.45)", lineHeight:1.78, maxWidth:460, marginBottom:36 }}>
                            Serigrafía, sublimación, vinil textil y bordado. Cuéntanos tu idea y la hacemos realidad.
                        </p>
                        <div className="h4" style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                            <button className="btn-a" onClick={() => navigate("/productosLanding")}>
                                Ver productos <ArrowR color="#fff"/>
                            </button>
                            <button className="btn-g" onClick={() => navigate("/cotizacionesLanding")}>
                                Cotizar diseño
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas verticales */}
                    <div className="h5" style={{ display:"flex", flexDirection:"column" }}>
                        {STATS.map((s, i) => (
                            <div key={i} style={{ padding:"18px 0 18px 18px", borderLeft:`3px solid ${i % 2 === 0 ? C.accent : C.borderDark}`, marginBottom:6 }}>
                                <p style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1, letterSpacing:"-0.03em", marginBottom:4 }}>
                                    <Counter num={s.num} suf={s.suf}/>
                                </p>
                                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.09em" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll hint */}
                <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:0.28 }}>
                    <div style={{ width:1, height:32, background:"rgba(255,255,255,0.6)" }}/>
                    <p style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", color:"#fff", textTransform:"uppercase" }}>scroll</p>
                </div>
            </section>

            {/* ══════════════════
                QUIÉNES SOMOS
            ══════════════════ */}
            <section style={{ padding:"88px 24px", background:C.white, borderBottom:`1px solid ${C.border}` }}>
                <div className="about-grid" style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }}>

                    <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:14 }}>Quiénes somos</p>
                        <h2 style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:900, color:C.navy, lineHeight:1.2, letterSpacing:"-0.025em", marginBottom:20 }}>
                            Transformamos ideas en prendas que la gente usa
                        </h2>
                        <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:14 }}>
                            Desde 2022 personalizamos ropa y accesorios para personas, equipos y marcas. Trabajamos con la técnica que cada diseño necesita — no usamos plantillas genéricas.
                        </p>
                        <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:32 }}>
                            Cada pedido pasa por un proceso de asesoría donde revisamos diseño, técnica y materiales antes de producir. Sin sorpresas en la entrega.
                        </p>

                        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                            {[
                                ["Materiales de primera",  "Usamos insumos que duran lavado tras lavado."],
                                ["Asesoría incluida",      "Te orientamos en técnica, colores y acabados."],
                                ["Tiempos cumplidos",      "Acordamos fecha de entrega y la respetamos."],
                            ].map(([t, d], i) => (
                                <div key={i} style={{ display:"flex", gap:13, alignItems:"flex-start" }}>
                                    <div style={{ width:22, height:22, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                                        <Check color="#fff"/>
                                    </div>
                                    <div>
                                        <p style={{ fontWeight:800, fontSize:14, color:C.navy, marginBottom:2 }}>{t}</p>
                                        <p style={{ fontSize:13, color:C.muted }}>{d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual */}
                    <div style={{ position:"relative" }}>
                        <div style={{ background:C.navy, borderRadius:14, padding:"44px 36px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:320 }}>
                            <div>
                                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:6 }}>Stamp</p>
                                <p style={{ fontSize:60, fontWeight:900, color:"#fff", lineHeight:1, letterSpacing:"-0.04em" }}>LAB</p>
                            </div>
                            <div style={{ borderTop:"1px solid rgba(255,255,255,0.09)", paddingTop:22, marginTop:32 }}>
                                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>Técnicas</p>
                                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                                    {["Serigrafía","Sublimación","Vinil","Bordado"].map(t => (
                                        <span key={t} style={{ background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.65)", borderRadius:4, padding:"4px 10px", fontSize:11, fontWeight:600 }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Tag flotante */}
                        <div style={{ position:"absolute", bottom:-14, right:-14, background:C.white, borderRadius:10, padding:"13px 16px", boxShadow:"0 8px 28px rgba(0,0,0,0.09)", border:`1px solid ${C.border}` }}>
                            <p style={{ fontSize:22, fontWeight:900, color:C.navy, marginBottom:2 }}>500+</p>
                            <p style={{ fontSize:11, color:C.muted, fontWeight:600 }}>pedidos entregados</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* <section style={{ padding:"88px 24px", background:C.navy }}>
                <div style={{ maxWidth:1100, margin:"0 auto" }}>
                    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:48, flexWrap:"wrap", gap:16 }}>
                        <div>
                            <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:10 }}>Lo que hacemos</p>
                            <h2 style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:900, color:"#fff", letterSpacing:"-0.025em" }}>Nuestras técnicas</h2>
                        </div>
                        <p style={{ fontSize:14, color:"rgba(255,255,255,0.35)", maxWidth:300, lineHeight:1.75, textAlign:"right" }}>
                            La técnica correcta depende del diseño, la prenda y el volumen del pedido.
                        </p>
                    </div>


                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                        {TECNICAS.map((t, i) => (
                            <div key={i} className="tec-r" style={{ display:"grid", gridTemplateColumns:"64px 1fr 2fr", gap:24, alignItems:"start", padding:"26px 12px", borderRadius:6 }}>
                                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.2)", letterSpacing:"0.08em", paddingTop:2 }}>{t.n}</p>
                                <p style={{ fontSize:17, fontWeight:800, color:"#fff" }}>{t.titulo}</p>
                                <p className="tec-desc" style={{ fontSize:14, color:"rgba(255,255,255,0.42)", lineHeight:1.75 }}>{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* ══════════════════
                PRODUCTOS
            ══════════════════ */}
            <section style={{ padding:"88px 24px", background:C.bg }}>
                <div style={{ maxWidth:1100, margin:"0 auto" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36, flexWrap:"wrap", gap:14 }}>
                        <div>
                            <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:8 }}>Catálogo</p>
                            <h2 style={{ fontSize:"clamp(1.5rem,3vw,2.1rem)", fontWeight:900, color:C.navy, letterSpacing:"-0.025em" }}>Productos disponibles</h2>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            {totalS > 1 && (
                                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                    <button onClick={() => setSlide(p => Math.max(0,p-1))} disabled={slide===0}
                                        style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${C.border}`, background:C.white, cursor:slide===0?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:slide===0?0.3:1, color:C.navy }}>
                                        <ChevLeft/>
                                    </button>
                                    <span style={{ fontSize:12, color:C.muted, fontWeight:600, minWidth:40, textAlign:"center" }}>{slide+1} / {totalS}</span>
                                    <button onClick={() => setSlide(p => Math.min(totalS-1,p+1))} disabled={slide===totalS-1}
                                        style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${C.border}`, background:C.white, cursor:slide===totalS-1?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:slide===totalS-1?0.3:1, color:C.navy }}>
                                        <ChevRight/>
                                    </button>
                                </div>
                            )}
                            <button className="btn-n" onClick={() => navigate("/productosLanding")} style={{ padding:"8px 16px", fontSize:13 }}>
                                Ver todos
                            </button>
                        </div>
                    </div>

                    {cargando ? (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:18 }}>
                            {[1,2,3].map(i => (
                                <div key={i} style={{ background:C.white, borderRadius:12, overflow:"hidden", border:`1px solid ${C.border}` }}>
                                    <div style={{ height:200, background:"linear-gradient(90deg,#f1f5f9 25%,#e8e6e1 50%,#f1f5f9 75%)", backgroundSize:"600px 100%", animation:"shimmer 1.4s infinite" }}/>
                                    <div style={{ padding:14 }}>
                                        <div style={{ height:13, borderRadius:4, background:"#f1f5f9", marginBottom:8 }}/>
                                        <div style={{ height:11, borderRadius:4, background:"#f1f5f9", width:"55%" }}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : productos.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"44px 20px", background:C.white, borderRadius:12, border:`1px solid ${C.border}` }}>
                            <p style={{ fontWeight:700, color:C.navy, marginBottom:4 }}>No hay productos disponibles por ahora.</p>
                            <p style={{ color:C.muted, fontSize:14 }}>Vuelve pronto.</p>
                        </div>
                    ) : (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:18 }}>
                            {current.map(p => {
                                const precio = precioMin(p);
                                const cols   = coloresOf(p);
                                return (
                                    <div key={p.ProductoID} className="prod-c" style={{ background:C.white, borderRadius:12, overflow:"hidden", border:`1px solid ${C.border}`, display:"flex", flexDirection:"column" }}>
                                        <div style={{ height:200, overflow:"hidden", background:C.bg, position:"relative" }}>
                                            {p.ImagenProducto
                                                ? <img src={p.ImagenProducto} alt={p.Nombre} className="pimg" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }} onError={e=>e.target.style.display="none"}/>
                                                : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><p style={{ fontSize:13, color:C.muted }}>Sin imagen</p></div>
                                            }
                                            <span style={{ position:"absolute", top:10, left:10, background:C.successBg, color:C.success, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700, letterSpacing:"0.04em" }}>Disponible</span>
                                        </div>
                                        <div style={{ padding:"13px 14px", flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                                            <p style={{ fontWeight:800, fontSize:15, color:C.navy }}>{p.Nombre}</p>
                                            {p.Descripcion && <p style={{ fontSize:12, color:C.muted, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.Descripcion}</p>}
                                            {cols.length > 0 && (
                                                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                                                    <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>Colores</p>
                                                    {cols.map(c => <span key={c} title={c} style={{ width:12, height:12, borderRadius:"50%", background:coloresHex[c]||"#ccc", border:"1.5px solid rgba(0,0,0,0.1)", display:"inline-block" }}/>)}
                                                </div>
                                            )}
                                            <div style={{ marginTop:"auto", paddingTop:11, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                                <div>
                                                    <p style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:1 }}>Desde</p>
                                                    <p style={{ fontWeight:900, fontSize:18, color:C.text }}>${precio.toLocaleString("es-CO")}</p>
                                                </div>
                                                <button className="btn-n" onClick={() => navigate("/productosLanding")} style={{ padding:"7px 13px", fontSize:12 }}>Ver</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════════════
                PROCESO
            ══════════════════ */}
            <section style={{ padding:"88px 24px", background:C.white, borderTop:`1px solid ${C.border}` }}>
                <div style={{ maxWidth:1100, margin:"0 auto" }}>
                    <div style={{ maxWidth:460, marginBottom:48 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:12 }}>Proceso</p>
                        <h2 style={{ fontSize:"clamp(1.6rem,3vw,2.3rem)", fontWeight:900, color:C.navy, lineHeight:1.2, letterSpacing:"-0.025em", marginBottom:14 }}>¿Cómo funciona?</h2>
                        <p style={{ fontSize:15, color:C.muted, lineHeight:1.75 }}>Del concepto a la prenda en cuatro pasos. Sin letra chica.</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:13 }}>
                        {PASOS.map((paso, i) => (
                            <div key={i} className="step-c" style={{ background:C.bg, borderRadius:10, padding:"22px 18px", border:`1.5px solid ${C.border}` }}>
                                <p style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:"0.1em", marginBottom:14 }}>{paso.n}</p>
                                <p style={{ fontWeight:800, fontSize:15, color:C.navy, marginBottom:7 }}>{paso.titulo}</p>
                                <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{paso.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════
                CTA FINAL
            ══════════════════ */}
            <section style={{ padding:"88px 24px", background:C.navy }}>
                <div className="cta-grid" style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr auto", gap:56, alignItems:"center" }}>
                    <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:12 }}>¿Tienes un proyecto?</p>
                        <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:900, color:"#fff", lineHeight:1.1, letterSpacing:"-0.03em", marginBottom:16 }}>
                            Tu idea merece ser real.
                        </h2>
                        <p style={{ fontSize:15, color:"rgba(255,255,255,0.4)", lineHeight:1.78, maxWidth:420 }}>
                            Cotiza sin compromiso. Revisamos juntos el diseño, la técnica y el presupuesto. Sin costos ocultos.
                        </p>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10, minWidth:190 }}>
                        <button className="btn-a" onClick={() => navigate("/cotizacionesLanding")} style={{ justifyContent:"center" }}>
                            Cotizar gratis <ArrowR color="#fff"/>
                        </button>
                        <button className="btn-g" onClick={() => navigate("/productosLanding")} style={{ justifyContent:"center" }}>
                            Ver catálogo
                        </button>
                    
                    </div>
                </div>
            </section>

            <FooterComponent />
            <ScrollToTopButton />
        </div>
    );
};

export default Home;