import { useState, useEffect, useRef } from "react";
import {
    FaSearch, FaCheckCircle, FaTimesCircle, FaArrowRight, FaStar, FaPalette, FaTruck, FaMedal,
    FaChevronRight, FaChevronDown, FaComments, FaPencilRuler, FaIndustry, FaBoxOpen, FaShieldAlt, FaTshirt,
} from "react-icons/fa";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import ScrollToTopButton from "./ScrollTopButton";
import usePlus from "../../hooks/usePlus";

const IMG_FALLBACK = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop';

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
    return IMG_FALLBACK;
};

/* Contador animado al entrar en pantalla */
const CountUp = ({ to, suffix = "" }) => {
    const ref = useRef(null);
    const [val, setVal] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        let raf = 0;
        const run = () => {
            if (reduce || !to) { setVal(to); return; }
            const t0 = performance.now(), dur = 1400;
            const tick = (t) => {
                const p = Math.min(1, (t - t0) / dur);
                setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
                if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.3 });
        io.observe(el);
        return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }, [to]);
    return <span ref={ref}>{val}{suffix}</span>;
};

const BENEFICIOS = [
    { icon: <FaPalette />, title: "Diseño personalizado", desc: "Creamos diseños únicos adaptados a tus necesidades. Cada prenda es una pieza hecha a tu medida." },
    { icon: <FaTruck />, title: "Entrega rápida", desc: "Tiempos de producción optimizados sin sacrificar calidad. Tu pedido llega cuando lo necesitas." },
    { icon: <FaMedal />, title: "Calidad superior", desc: "Materiales premium y técnicas profesionales en cada trabajo, con resultados que superan expectativas." },
    { icon: <FaShieldAlt />, title: "Garantía total", desc: "Si algo no queda como lo acordamos, lo corregimos. Tu satisfacción es nuestra prioridad." },
];

const PASOS = [
    { num: "01", icon: <FaComments />, titulo: "Consulta", desc: "Cuéntanos tu idea y te asesoramos sobre la mejor técnica para tu proyecto." },
    { num: "02", icon: <FaPencilRuler />, titulo: "Diseño", desc: "Creamos o adaptamos el diseño según tus especificaciones y necesidades." },
    { num: "03", icon: <FaIndustry />, titulo: "Producción", desc: "Aplicamos la técnica seleccionada con precisión y materiales de primera." },
    { num: "04", icon: <FaBoxOpen />, titulo: "Entrega", desc: "Recibes tu producto terminado en el tiempo acordado, con calidad garantizada." },
];

const FAQS = [
    { q: "¿Qué técnica es la mejor para mi proyecto?", a: "Depende del diseño, la cantidad y el tipo de tela. Cuéntanos tu idea y te recomendamos la opción con mejor acabado y precio." },
    { q: "¿Hay un mínimo de prendas por pedido?", a: "Trabajamos desde piezas únicas hasta grandes volúmenes. Al cotizar te indicamos las mejores condiciones según la cantidad." },
    { q: "¿Cuánto tarda mi pedido?", a: "Los tiempos varían según la técnica y el volumen, pero siempre te damos una fecha clara de entrega al aprobar la cotización." },
    { q: "¿El estampado resiste los lavados?", a: "Sí. Usamos materiales y procesos profesionales pensados para conservar color y definición lavado tras lavado." },
    { q: "¿Puedo enviar mi propio diseño?", a: "Claro. Puedes enviarnos tu arte o dejar que nuestro equipo lo cree o adapte por ti." },
];

const MARQUEE = ["Serigrafía", "Sublimación", "Bordado", "Vinilo textil", "Estampado digital", "Personalización"];

const Servicios = () => {
    usePlus();
    const [tecnicas, setTecnicas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [faqOpen, setFaqOpen] = useState(0);

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

    const wave = (fill) => (
        <svg className="sx-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,40 L1440,70 L0,70 Z" fill={fill} />
        </svg>
    );

    return (
        <>
            <style>{`
                .svc-page { font-family: 'Outfit', sans-serif; background: #f8fafc; overflow-x: hidden; }
                .svc-page * { box-sizing: border-box; }
                .svc-hero { padding: 110px 24px 40px; text-align: center; }
                .svc-hero h1 { font: 900 clamp(2.4rem, 6.4vw, 4.6rem)/1.04 'Outfit', sans-serif; letter-spacing: -.04em; margin: 18px 0 18px; color: #fff; }
                .svc-hero-sub { color: rgba(255,255,255,.68); font-size: 18px; line-height: 1.7; max-width: 620px; margin: 0 auto 38px; }
                .svc-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 999px; font: 700 12px 'Outfit'; letter-spacing: .1em; text-transform: uppercase;
                    color: #9ec0ff; background: rgba(79,142,247,.14); border: 1px solid rgba(79,142,247,.4); backdrop-filter: blur(8px); }
                .svc-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 54px; }
                .svc-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 820px; margin: 0 auto; position: relative; z-index: 1; }
                .svc-stat { padding: 24px 16px; text-align: center; }
                .svc-stat b { display: block; font: 900 clamp(2rem, 4vw, 2.9rem)/1 'Outfit'; color: #fff; letter-spacing: -.03em; }
                .svc-stat span { display: block; margin-top: 8px; font: 600 11px 'Outfit'; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.55); }
                .svc-marq { margin-top: 56px; padding-bottom: 70px; }
                .svc-marq-item { font: 900 clamp(1.6rem, 4vw, 2.6rem) 'Outfit'; letter-spacing: -.02em; display: inline-flex; align-items: center; gap: 56px; }
                .svc-marq-item i { color: #4f8ef7; font-style: normal; font-size: .6em; }
                .svc-hero-wave { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; }

                .svc-head { text-align: center; margin-bottom: 36px; }
                .svc-head .sx-sub { margin: 0 auto; }
                .svc-search { max-width: 580px; margin: 0 auto 46px; position: relative; }
                .svc-search input { width: 100%; padding: 18px 54px 18px 56px; border: 2px solid transparent; border-radius: 18px; font: 500 15px 'Outfit', sans-serif; color: #0f172a; outline: none;
                    background: linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg, #e2e8f0, #e2e8f0) border-box; box-shadow: 0 10px 34px rgba(26,37,64,.10); transition: all .3s; }
                .svc-search input:focus { background: linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg,#4f8ef7,#7c3aed) border-box; box-shadow: 0 14px 44px rgba(79,142,247,.28); transform: translateY(-2px); }
                .svc-search svg.si { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); color: #4f8ef7; font-size: 17px; pointer-events: none; }
                .svc-search .cnt { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); font: 700 11px 'Outfit'; color: #3b6fe0; background: rgba(79,142,247,.12); padding: 4px 10px; border-radius: 99px; }

                .svc-grid { display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
                .svc-card { display: flex; flex-direction: column; height: 100%; }
                .svc-img { position: relative; height: 230px; background: #e2e8f0; }
                .svc-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .svc-img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,24,36,.82) 0%, rgba(26,37,64,.15) 55%, transparent 100%); transition: opacity .4s; }
                .svc-card:hover .svc-img::after { background: linear-gradient(to top, rgba(26,37,64,.9) 0%, rgba(79,142,247,.25) 70%, transparent 100%); }
                .svc-badge-st { position: absolute; top: 14px; right: 14px; z-index: 2; display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 999px; font: 700 11px 'Outfit'; color: #fff; backdrop-filter: blur(8px); }
                .svc-badge-ok { background: rgba(22,163,74,.92); box-shadow: 0 0 0 0 rgba(22,163,74,.6); animation: svc-ping 2.2s infinite; }
                .svc-badge-no { background: rgba(100,116,139,.88); }
                .svc-idx { position: absolute; left: 18px; bottom: 12px; z-index: 2; font: 900 44px/1 'Outfit'; color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,.7); }
                .svc-body { padding: 24px 24px 26px; display: flex; flex-direction: column; flex: 1; }
                .svc-body h3 { font: 800 21px 'Outfit'; letter-spacing: -.02em; color: #1a2540; margin: 0 0 8px; }
                .svc-desc { font-size: 14px; line-height: 1.7; color: #64748b; margin: 0 0 16px; flex: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
                .svc-feats { list-style: none; padding: 0; margin: 0 0 20px; display: grid; gap: 8px; }
                .svc-feats li { display: flex; align-items: center; gap: 10px; font: 600 13px 'Outfit'; color: #334155; }
                .svc-feats li span { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 10px; background: linear-gradient(135deg,#16a34a,#4ade80); flex-shrink: 0; }
                .svc-btn-off { background: #f1f5f9; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
                .svc-btn-off:hover { transform: none; box-shadow: none; background: #f1f5f9; color: #94a3b8; }
                .svc-btn-off::after { display: none; }

                .svc-dark { background: linear-gradient(160deg, #0f1824, #1a2540 60%, #14203a); color: #fff; overflow: hidden; }
                .svc-dark .sx-title { color: #fff; } .svc-dark .sx-sub { color: rgba(255,255,255,.62); }
                .svc-why { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); position: relative; z-index: 1; }
                .svc-why .sx-glass { padding: 32px 26px; height: 100%; }
                .svc-why h3 { font: 800 20px 'Outfit'; margin: 22px 0 10px; color: #fff; }
                .svc-why p { margin: 0; font-size: 14.5px; line-height: 1.7; color: rgba(255,255,255,.65); }
                .svc-ghost-num { position: absolute; right: 16px; top: 6px; font: 900 80px/1 'Outfit'; color: rgba(255,255,255,.05); }

                .svc-tl { position: relative; display: grid; gap: 28px; grid-template-columns: repeat(4, 1fr); padding-top: 40px; }
                .svc-tl-line { position: absolute; top: 74px; left: 12.5%; right: 12.5%; height: 4px; border-radius: 4px; background: rgba(79,142,247,.18); overflow: hidden; }
                .svc-tl-line::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, #4f8ef7, #7c3aed, #4f8ef7); background-size: 200% 100%; animation: sx-shine 3s linear infinite; }
                .svc-step { text-align: center; position: relative; z-index: 1; }
                .svc-dot { width: 76px; height: 76px; margin: 0 auto 20px; border-radius: 50%; display: grid; place-items: center; font-size: 26px; color: #fff; background: linear-gradient(135deg,#4f8ef7,#7c3aed);
                    box-shadow: 0 0 0 8px #eef2f9, 0 16px 36px rgba(79,142,247,.4); transition: transform .5s var(--sx-ease); }
                .svc-step:hover .svc-dot { transform: scale(1.12) rotate(-6deg); }
                .svc-step .sx-num { font-size: 62px; opacity: .22; display: block; margin-bottom: -18px; }
                .svc-step h3 { font: 800 20px 'Outfit'; color: #1a2540; margin: 0 0 8px; position: relative; }
                .svc-step p { font-size: 14px; line-height: 1.65; color: #64748b; margin: 0 auto; max-width: 250px; }

                .svc-faq { max-width: 820px; margin: 0 auto; display: grid; gap: 14px; }
                .svc-faq-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: var(--sx-shadow-1); transition: border-color .3s, box-shadow .3s; overflow: hidden; }
                .svc-faq-item.open { border-color: rgba(79,142,247,.5); box-shadow: 0 16px 44px rgba(79,142,247,.16); }
                .svc-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; text-align: left; background: none; border: 0; cursor: pointer; padding: 20px 24px; font: 700 16.5px 'Outfit', sans-serif; color: #1a2540; }
                .svc-faq-q svg { flex-shrink: 0; color: #4f8ef7; transition: transform .4s var(--sx-ease); }
                .svc-faq-item.open .svc-faq-q svg { transform: rotate(180deg); }
                .svc-faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s var(--sx-ease); }
                .svc-faq-item.open .svc-faq-a { grid-template-rows: 1fr; }
                .svc-faq-a > div { overflow: hidden; }
                .svc-faq-a p { margin: 0; padding: 0 24px 22px; color: #64748b; line-height: 1.75; font-size: 15px; }

                .svc-cta { position: relative; overflow: hidden; text-align: center; padding: 100px 24px; color: #fff;
                    background: linear-gradient(120deg, #1a2540 0%, #3b2a8f 50%, #4f8ef7 100%); background-size: 200% 200%; animation: svc-grad 10s ease infinite; }
                .svc-cta h2 { font: 900 clamp(2rem, 5vw, 3.4rem)/1.08 'Outfit'; letter-spacing: -.035em; margin: 14px 0 16px; }
                .svc-cta p { color: rgba(255,255,255,.78); font-size: 17px; max-width: 520px; margin: 0 auto 34px; line-height: 1.7; }
                .svc-cta .sx-btn-light { padding: 18px 40px; font-size: 16px; border-radius: 16px; }

                .svc-empty { text-align: center; padding: 60px 0; color: #64748b; }
                .svc-spin { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #4f8ef7; border-radius: 50%; animation: sx-spin .8s linear infinite; margin: 0 auto 16px; }
                .svc-skel { height: 440px; border-radius: 20px; background: linear-gradient(90deg,#eef2f9 25%,#f8fafc 50%,#eef2f9 75%); background-size: 200% 100%; animation: sx-shine 1.4s linear infinite; }

                @keyframes svc-ping { 70% { box-shadow: 0 0 0 10px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
                @keyframes svc-grad { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

                @media (max-width: 900px) {
                    .svc-tl { grid-template-columns: 1fr 1fr; row-gap: 44px; } .svc-tl-line { display: none; }
                }
                @media (max-width: 600px) {
                    .svc-hero { padding: 84px 18px 30px; }
                    .svc-stats { grid-template-columns: 1fr; gap: 12px; }
                    .svc-stat { padding: 16px; }
                    .svc-tl { grid-template-columns: 1fr; }
                    .svc-grid { grid-template-columns: 1fr; }
                    .svc-cta { padding: 72px 20px; }
                    .svc-search input { padding-right: 20px; } .svc-search .cnt { display: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .svc-cta, .svc-badge-ok, .svc-tl-line::after, .svc-skel { animation: none !important; }
                }
            `}</style>

            <div className="svc-page sx-font">
                <NavbarComponent />

                {/* ══════════ HERO ══════════ */}
                <section className="sx-hero-bg svc-hero">
                    <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
                    <div className="sx-hero-in" style={{ position: "relative", zIndex: 2 }}>
                        <div><span className="svc-badge"><FaStar size={11} /> Técnicas profesionales de estampado</span></div>
                        <h1>Tu marca en cada<br /><span className="sx-gradient-text">prenda</span></h1>
                        <p className="svc-hero-sub">
                            Transformamos tus ideas en prendas únicas con las mejores técnicas del mercado. Calidad garantizada en cada pedido.
                        </p>
                        <div className="svc-ctas">
                            <a className="sx-btn sx-pulse" href="#tecnicas">Ver técnicas <FaArrowRight size={12} /></a>
                            <button className="sx-btn sx-btn-ghost" onClick={() => window.location.href = '/cotizacionesLanding'}>Solicitar cotización</button>
                        </div>
                        <div className="svc-stats">
                            <div className="sx-glass svc-stat"><b><CountUp to={5} suffix="+" /></b><span>Años de experiencia</span></div>
                            <div className="sx-glass svc-stat"><b><CountUp to={disponibles} /></b><span>Técnicas disponibles</span></div>
                            <div className="sx-glass svc-stat"><b><CountUp to={100} suffix="%" /></b><span>Calidad garantizada</span></div>
                        </div>
                    </div>
                    <div className="sx-marquee svc-marq" style={{ position: "relative", zIndex: 2 }} aria-hidden="true">
                        <div className="sx-marquee-track">
                            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((m, i) => (
                                <span key={i} className="svc-marq-item">
                                    <span className={i % 2 ? "sx-outline-text" : ""} style={i % 2 ? {} : { color: "rgba(255,255,255,.9)" }}>{m}</span><i>✦</i>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="svc-hero-wave">{wave("#f8fafc")}</div>
                </section>

                {/* ══════════ TÉCNICAS ══════════ */}
                <section className="sx-section" id="tecnicas" style={{ paddingTop: 40 }}>
                    <div className="sx-wrap">
                        <div className="svc-head sx-reveal">
                            <span className="sx-eyebrow">Catálogo de servicios</span>
                            <h2 className="sx-title">Nuestras <span className="sx-gradient-text">técnicas</span></h2>
                            <p className="sx-sub">Elige la técnica perfecta para tu proyecto</p>
                        </div>

                        <div className="svc-search sx-reveal" style={{ "--sx-i": 1 }}>
                            <FaSearch className="si" />
                            <input
                                placeholder="Buscar técnica de estampado..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                            {!loading && !error && <span className="cnt">{tecnicasFiltradas.length} resultados</span>}
                        </div>

                        {loading && (
                            <>
                                <div className="svc-spin" />
                                <div className="svc-grid">{[0, 1, 2].map(i => <div key={i} className="svc-skel" />)}</div>
                            </>
                        )}

                        {error && (
                            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 16, padding: "26px 30px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
                                <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>Error al cargar las técnicas</p>
                                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>{error}</p>
                                <button className="sx-btn sx-btn-sm" style={{ background: "#dc2626", boxShadow: "none" }} onClick={cargarTecnicas}>Reintentar</button>
                            </div>
                        )}

                        {!loading && !error && (
                            tecnicasFiltradas.length === 0 ? (
                                <div className="svc-empty">
                                    <FaSearch size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                    <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>No se encontraron técnicas</p>
                                    <p style={{ fontSize: 14 }}>Intenta con otra búsqueda</p>
                                </div>
                            ) : (
                                <div className="svc-grid">
                                    {tecnicasFiltradas.map((tecnica, index) => (
                                        <div key={tecnica.TecnicaID || index} className="sx-card sx-reveal svc-card" style={{ "--sx-i": index % 4 }}>
                                            <div className="svc-img sx-zoom">
                                                <img
                                                    src={obtenerImagenTecnica(tecnica)}
                                                    alt={tecnica.Nombre}
                                                    loading="lazy"
                                                    onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }}
                                                />
                                                <div className={`svc-badge-st ${tecnica.Estado ? "svc-badge-ok" : "svc-badge-no"}`}>
                                                    {tecnica.Estado
                                                        ? <><FaCheckCircle size={11} /> Disponible</>
                                                        : <><FaTimesCircle size={11} /> No disponible</>}
                                                </div>
                                                <span className="svc-idx">{String(index + 1).padStart(2, "0")}</span>
                                            </div>
                                            <div className="svc-body">
                                                <h3>{tecnica.Nombre}</h3>
                                                <p className="svc-desc">
                                                    {tecnica.Descripcion || "Técnica de estampado profesional de alta calidad para tus prendas."}
                                                </p>
                                                {tecnica.Estado && (
                                                    <ul className="svc-feats">
                                                        {["Alta durabilidad", "Acabado profesional", "Resistente al lavado"].map(f => (
                                                            <li key={f}><span><FaCheckCircle /></span>{f}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <button
                                                    className={`sx-btn ${tecnica.Estado ? "" : "svc-btn-off"}`}
                                                    style={{ width: "100%" }}
                                                    disabled={!tecnica.Estado}
                                                    onClick={() => tecnica.Estado && (window.location.href = '/cotizacionesLanding')}
                                                >
                                                    {tecnica.Estado ? <>Solicitar Servicio <FaArrowRight size={12} /></> : "No disponible"}
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
                <div style={{ background: "#f8fafc", lineHeight: 0 }}>{wave("#0f1824")}</div>
                <section className="sx-section svc-dark">
                    <span className="sx-blob b1" style={{ opacity: .3 }} /><span className="sx-blob b2" style={{ opacity: .3 }} />
                    <div className="sx-wrap">
                        <div className="svc-head sx-reveal">
                            <span className="sx-eyebrow">Nuestra propuesta de valor</span>
                            <h2 className="sx-title">¿Por qué <span className="sx-gradient-text">elegirnos</span>?</h2>
                            <p className="sx-sub">Razones que nos hacen diferentes</p>
                        </div>
                        <div className="svc-why">
                            {BENEFICIOS.map((b, i) => (
                                <div key={i} className="sx-glass sx-tilt sx-reveal" style={{ "--sx-i": i }}>
                                    <span className="svc-ghost-num">0{i + 1}</span>
                                    <div className="sx-icon">{b.icon}</div>
                                    <h3>{b.title}</h3>
                                    <p>{b.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <div style={{ background: "#eef2f9", lineHeight: 0, transform: "scaleY(-1)", marginTop: -1 }}>{wave("#0f1824")}</div>

                {/* ══════════ PROCESO ══════════ */}
                <section className="sx-section" style={{ background: "#eef2f9", paddingTop: 30 }}>
                    <div className="sx-wrap">
                        <div className="svc-head sx-reveal">
                            <span className="sx-eyebrow">Cómo trabajamos</span>
                            <h2 className="sx-title">Nuestro <span className="sx-gradient-text">proceso</span></h2>
                            <p className="sx-sub">Simple, transparente y eficiente</p>
                        </div>
                        <div className="svc-tl">
                            <div className="svc-tl-line" />
                            {PASOS.map((p, i) => (
                                <div key={i} className="svc-step sx-reveal" style={{ "--sx-i": i }}>
                                    <div className="svc-dot">{p.icon}</div>
                                    <span className="sx-num">{p.num}</span>
                                    <h3>{p.titulo}</h3>
                                    <p>{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════ FAQ ══════════ */}
                <section className="sx-section" style={{ background: "#f8fafc" }}>
                    <div className="sx-wrap">
                        <div className="svc-head sx-reveal">
                            <span className="sx-eyebrow">Resolvemos tus dudas</span>
                            <h2 className="sx-title">Preguntas <span className="sx-gradient-text">frecuentes</span></h2>
                        </div>
                        <div className="svc-faq">
                            {FAQS.map((f, i) => (
                                <div key={i} className={`svc-faq-item sx-reveal ${faqOpen === i ? "open" : ""}`} style={{ "--sx-i": i }}>
                                    <button className="svc-faq-q" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                                        {f.q} <FaChevronDown />
                                    </button>
                                    <div className="svc-faq-a"><div><p>{f.a}</p></div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════ CTA ══════════ */}
                <section className="svc-cta">
                    <span className="sx-blob b3" style={{ top: "-20%", left: "10%", opacity: .35 }} />
                    <span className="sx-blob b2" style={{ opacity: .35 }} />
                    <div style={{ position: "relative", zIndex: 1 }} className="sx-reveal">
                        <FaTshirt size={38} className="sx-bob" style={{ opacity: .9 }} />
                        <span className="sx-eyebrow" style={{ color: "#cfe0ff", display: "flex", justifyContent: "center" }}>¿Listo para empezar?</span>
                        <h2>Crea algo increíble hoy</h2>
                        <p>Contáctanos y comencemos tu proyecto. Respuesta garantizada en menos de 24 horas.</p>
                        <button className="sx-btn sx-btn-light sx-pulse" onClick={() => window.location.href = '/cotizacionesLanding'}>
                            Solicitar Cotización <FaChevronRight size={13} />
                        </button>
                    </div>
                </section>

                <FooterComponent />
                <ScrollToTopButton />
            </div>
        </>
    );
};

export default Servicios;
