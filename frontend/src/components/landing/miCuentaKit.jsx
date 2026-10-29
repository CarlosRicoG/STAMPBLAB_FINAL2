/* eslint-disable react-refresh/only-export-components -- módulo de utilidades y componentes compartidos; solo afecta al recargado en caliente en desarrollo */
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { FaTimes, FaCheck, FaTimesCircle } from "react-icons/fa";

/* ═══════════════════════════════════════════════════════════
   Kit compartido de "Mi cuenta" (Mis cotizaciones, Mis compras,
   Editar perfil, Formulario de compra). Prefijo CSS: .mc-
   ═══════════════════════════════════════════════════════════ */

export const prefersReduced = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const formatPrecio = (valor) =>
    (parseFloat(valor) || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const leerUsuario = () => {
    try { return JSON.parse(localStorage.getItem("usuario")) || {}; } catch { return {}; }
};

export const iniciales = (nombre = "") => {
    const p = String(nombre).trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "SL";
    return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
};

/* ── Contador animado ── */
export const CountUp = ({ value = 0, format = (n) => Math.round(n).toLocaleString("es-CO"), duration = 1100 }) => {
    const [n, setN] = useState(prefersReduced() ? value : 0);
    useEffect(() => {
        const target = Number(value) || 0;
        if (prefersReduced() || target === 0) { setN(target); return; }
        let raf, t0;
        const step = (t) => {
            if (!t0) t0 = t;
            const p = Math.min(1, (t - t0) / duration);
            setN(target * (1 - Math.pow(1 - p, 4)));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return <>{format(n)}</>;
};

export const Avatar = ({ nombre, size = 64 }) => (
    <div className="mc-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
        <span>{iniciales(nombre)}</span>
    </div>
);

/* ── Cabecera hero ── */
export const MiCuentaHero = ({ eyebrow = "Mi cuenta", title, accent, sub, children }) => {
    return (
        <section className="sx-hero-bg mc-hero">
            <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
            <div className="mc-hero-inner sx-hero-in">
                <span className="sx-eyebrow mc-eyebrow">{eyebrow}</span>
                <h1 className="mc-h1">{title} <span className="sx-gradient-text">{accent}</span></h1>
                <p className="mc-hero-sub">{sub}</p>
            </div>
            {children && <div className="mc-hero-stats">{children}</div>}
        </section>
    );
};

/* ── Tarjeta de estadística ── */
export const StatCard = ({ icon, label, value, format, tone = "blue", i = 0 }) => (
    <div className={`mc-stat sx-reveal sx-glass-w mc-tone-${tone}`} style={{ "--sx-i": i }}>
        <span className="mc-stat-ico">{icon}</span>
        <div>
            <div className="mc-stat-n"><CountUp value={value} format={format} /></div>
            <div className="mc-stat-l">{label}</div>
        </div>
    </div>
);

/* ── Pestañas píldora con indicador deslizante ── */
export const PillTabs = ({ items, value, onChange }) => {
    const wrap = useRef(null);
    const [ind, setInd] = useState({ left: 0, width: 0, ready: false });
    const medir = () => {
        const el = wrap.current?.querySelector(".mc-tab.on");
        if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    useLayoutEffect(medir, [value, items.length, items.map((x) => x.count).join(",")]);
    useEffect(() => {
        window.addEventListener("resize", medir);
        const t = setTimeout(medir, 400);
        return () => { window.removeEventListener("resize", medir); clearTimeout(t); };
    }, []);
    return (
        <div className="mc-tabs" ref={wrap} role="tablist">
            <span className="mc-tab-ind" style={{ transform: `translateX(${ind.left}px)`, width: ind.width, opacity: ind.ready ? 1 : 0 }} />
            {items.map((it) => (
                <button key={it.key} role="tab" aria-selected={value === it.key} type="button"
                    className={`mc-tab ${value === it.key ? "on" : ""}`} onClick={() => onChange(it.key)}>
                    {it.label}<em>{it.count}</em>
                </button>
            ))}
        </div>
    );
};

/* ── Stepper de estado ── */
export const Stepper = ({ steps, current, failed }) => {
    const last = steps.length - 1;
    return (
        <div className="mc-steps" style={{ "--mc-n": steps.length }}>
            <div className="mc-steps-line"><i style={{ transform: `scaleX(${last ? Math.min(current, last) / last : 0})` }} className={failed ? "bad" : ""} /></div>
            {steps.map((s, i) => {
                const st = failed && i === current ? "bad" : i < current ? "done" : i === current ? "now" : "todo";
                return (
                    <div key={s} className={`mc-step ${st}`}>
                        <span className="mc-dot">{st === "done" ? <FaCheck size={8} /> : st === "bad" ? <FaTimesCircle size={9} /> : i + 1}</span>
                        <span className="mc-step-l">{s}</span>
                    </div>
                );
            })}
        </div>
    );
};

/* ── Modal ── */
export const McModal = ({ onClose, children, wide }) => {
    useEffect(() => {
        const k = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", k);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
    }, [onClose]);
    return (
        <div className="mc-overlay" onClick={onClose}>
            <div className={`mc-modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export const ModalHead = ({ eyebrow, title, sub, onClose }) => (
    <div className="mc-mhead">
        <span className="sx-blob b1" style={{ width: 240, height: 240, top: -120, left: -80, opacity: .35 }} />
        <span className="sx-blob b2" style={{ width: 200, height: 200, bottom: -120, right: -60, opacity: .3 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
            <span className="mc-meyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{sub}</p>
        </div>
        <button type="button" className="mc-close" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
    </div>
);

/* ── Estado vacío ilustrado ── */
export const EmptyState = ({ icon, title, text, children }) => (
    <div className="mc-empty sx-reveal">
        <div className="mc-empty-art">
            <span className="mc-ring r1" /><span className="mc-ring r2" />
            <span className="mc-empty-ico sx-bob">{icon}</span>
        </div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="mc-empty-cta">{children}</div>
    </div>
);

export const Skeletons = ({ n = 3 }) => (
    <div className="mc-grid">
        {Array.from({ length: n }).map((_, i) => (
            <div key={i} className="mc-skel-card">
                <div className="mc-skel" style={{ height: 14, width: "40%" }} />
                <div style={{ display: "flex", gap: 12, margin: "18px 0" }}>
                    <div className="mc-skel" style={{ width: 70, height: 70, borderRadius: 16 }} />
                    <div style={{ flex: 1 }}><div className="mc-skel" style={{ height: 14, width: "80%", marginBottom: 10 }} /><div className="mc-skel" style={{ height: 11, width: "55%" }} /></div>
                </div>
                <div className="mc-skel" style={{ height: 8, width: "100%", marginBottom: 18 }} />
                <div className="mc-skel" style={{ height: 44, width: "100%", borderRadius: 12 }} />
            </div>
        ))}
    </div>
);

export const MC_CSS = `
.mc-page { background: #f8fafc; min-height: 100vh; font-family: 'Outfit', sans-serif; color: #0f172a; }
.mc-page *, .mc-page *::before, .mc-page *::after { box-sizing: border-box; }
.mc-page button, .mc-page input, .mc-page select, .mc-page textarea { font-family: 'Outfit', sans-serif; }

/* hero */
.mc-hero { padding: 48px 32px 40px; text-align: center; border-bottom: 3px solid transparent; border-image: linear-gradient(90deg,#4f8ef7,#7c3aed,#4f8ef7) 1; }
.mc-hero-inner { position: relative; z-index: 2; max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
.mc-hello { display: inline-flex; align-items: center; gap: 14px; padding: 8px 20px 8px 8px; border-radius: 999px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(10px); margin-bottom: 22px; text-align: left; }
.mc-hello-l { display: block; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.55); font-weight: 600; }
.mc-hello-n { display: block; font-size: 17px; font-weight: 800; color: #fff; line-height: 1.15; }
.mc-avatar { border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 800; letter-spacing: .02em; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 0 0 3px rgba(255,255,255,.22), 0 10px 26px rgba(79,142,247,.5); flex-shrink: 0; position: relative; }
.mc-avatar::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; border: 2px solid rgba(167,139,250,.5); animation: mc-ring 3s ease-out infinite; }
@keyframes mc-ring { 0% { transform: scale(.9); opacity: .9; } 100% { transform: scale(1.25); opacity: 0; } }
.mc-eyebrow { color: #a5c4ff !important; }
.mc-h1 { font-weight: 900; font-size: clamp(1.9rem, 4.4vw, 2.7rem); line-height: 1.1; letter-spacing: -.03em; margin: 10px 0 10px; color: #fff; }
.mc-hero-sub { color: rgba(255,255,255,.66); font-size: 15px; line-height: 1.6; max-width: 520px; margin: 0; }

.mc-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px 64px; position: relative; z-index: 3; }
.mc-hero-stats { position: relative; z-index: 2; margin-top: 26px; }
.mc-hero-stats .mc-stats { margin: 0; display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }
.mc-pull { margin-top: 0; }

/* stats */
.mc-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 18px; margin-bottom: 34px; }
.mc-stat { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 26px; min-width: 120px; border-radius: 16px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(10px); transition: transform .35s var(--sx-ease), background .3s, border-color .3s, box-shadow .3s; }
.mc-stat:hover { transform: translateY(-5px); background: rgba(255,255,255,.13); border-color: rgba(79,142,247,.6); box-shadow: 0 16px 36px rgba(0,0,0,.28); }
.mc-stat-ico { display: none; }
.mc-stat-n { font-size: 24px; font-weight: 900; color: #fff; line-height: 1.1; font-variant-numeric: tabular-nums; }
.mc-stat-l { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: .08em; }

/* tabs */
.mc-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 26px; }
.mc-bar-t { font-size: 13px; font-weight: 600; color: #64748b; }
.mc-tabs { position: relative; display: inline-flex; gap: 2px; padding: 5px; border-radius: 999px; background: #fff; border: 1px solid #e2e8f0; box-shadow: var(--sx-shadow-1); max-width: 100%; overflow-x: auto; scrollbar-width: none; }
.mc-tabs::-webkit-scrollbar { display: none; }
.mc-tab-ind { position: absolute; top: 5px; bottom: 5px; left: 0; border-radius: 999px; background: linear-gradient(135deg, #1a2540, #2d3f6e); box-shadow: 0 8px 20px rgba(26,37,64,.35); transition: transform .45s var(--sx-ease), width .45s var(--sx-ease), opacity .2s; }
.mc-tab { position: relative; z-index: 1; border: 0; background: transparent; cursor: pointer; padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #64748b; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; transition: color .25s; }
.mc-tab:hover { color: #1a2540; }
.mc-tab.on, .mc-tab.on:hover { color: #fff; }
.mc-tab em { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(100,116,139,.14); }
.mc-tab.on em { background: rgba(255,255,255,.2); }

/* grid + tarjetas */
.mc-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.mc-card { position: relative; background: #fff; border-radius: 18px; border: 1px solid #e8edf5; box-shadow: var(--sx-shadow-1); overflow: hidden; display: flex; flex-direction: column; transition: transform .4s var(--sx-ease), box-shadow .4s, border-color .4s; }
.mc-card::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px; z-index: 2; background: linear-gradient(90deg, #4f8ef7, #7c3aed); }
.mc-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .35s; background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 0%), rgba(79,142,247,.10), transparent 60%); }
.mc-card:hover { transform: translateY(-8px); box-shadow: var(--sx-shadow-2); border-color: rgba(79,142,247,.35); }
.mc-card:hover::after { opacity: 1; }
.mc-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding: 18px 20px 16px; background: linear-gradient(135deg, #0f1824, #1a2540 60%, #2d3f6e); }
.mc-id { font-size: 18px; font-weight: 900; letter-spacing: -.02em; color: #fff; line-height: 1.1; }
.mc-id small { display: block; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.6); font-weight: 700; margin-bottom: 3px; }
.mc-date { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,.65); font-weight: 500; margin-top: 6px; }
.mc-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: .02em; border: 1px solid; white-space: nowrap; }
.mc-badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.mc-card-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 18px; flex: 1; }
.mc-prod { display: flex; gap: 14px; align-items: center; }
.mc-thumb { position: relative; width: 74px; height: 74px; border-radius: 18px; overflow: hidden; flex-shrink: 0; display: grid; place-items: center; background: linear-gradient(135deg, #eef3ff, #f5f0ff); border: 1px solid #e2e8f0; color: #4f8ef7; font-size: 26px; }
.mc-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--sx-ease); }
.mc-card:hover .mc-thumb img { transform: scale(1.12); }
.mc-thumb .mc-more { position: absolute; right: 4px; bottom: 4px; font-size: 10px; font-weight: 800; color: #fff; background: rgba(26,37,64,.85); padding: 2px 7px; border-radius: 999px; }
.mc-pname { font-size: 15px; font-weight: 800; color: #1a2540; line-height: 1.3; margin: 0 0 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.mc-pmeta { font-size: 12px; color: #64748b; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.mc-total { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; padding: 10px 14px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; }
.mc-total small { display: block; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
.mc-total b { font-size: 22px; font-weight: 900; letter-spacing: -.03em; line-height: 1; background: linear-gradient(90deg, #1a2540, #3b4f8a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-variant-numeric: tabular-nums; }
.mc-total b.soft { font-size: 15px; background: none; -webkit-text-fill-color: #64748b; color: #64748b; font-weight: 700; }
.mc-total.ok { background: #f0fdf4; border-color: #bbf7d0; }
.mc-total.ok b { background: linear-gradient(90deg, #15803d, #16a34a); -webkit-background-clip: text; background-clip: text; }
.mc-btn { margin-top: auto; border: 0; cursor: pointer; width: 100%; padding: 13px 18px; border-radius: 10px; font-weight: 700; font-size: 13px; color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 9px; background: linear-gradient(135deg, #1a2540, #2d3f6e); box-shadow: 0 10px 24px rgba(26,37,64,.28); position: relative; overflow: hidden; transition: transform .3s var(--sx-ease), box-shadow .3s; }
.mc-btn::after { content: ""; position: absolute; top: 0; left: -80%; width: 50%; height: 100%; transform: skewX(-22deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); transition: left .7s var(--sx-ease); }
.mc-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(79,142,247,.4); background: linear-gradient(135deg, #2d3f6e, #4f8ef7); }
.mc-btn:hover::after { left: 130%; }
.mc-btn svg { transition: transform .3s var(--sx-ease); }
.mc-btn:hover svg:last-child { transform: translateX(4px); }

/* stepper */
.mc-steps { position: relative; display: grid; grid-template-columns: repeat(var(--mc-n), 1fr); padding-top: 2px; }
.mc-steps-line { position: absolute; top: 12px; left: calc(50% / var(--mc-n)); right: calc(50% / var(--mc-n)); height: 3px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.mc-steps-line i { display: block; height: 100%; width: 100%; transform-origin: 0 50%; background: linear-gradient(90deg, #4f8ef7, #7c3aed); transition: transform 1.2s var(--sx-ease) .2s; }
.mc-steps-line i.bad { background: linear-gradient(90deg, #4f8ef7, #dc2626); }
.mc-step { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; }
.mc-dot { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 10px; font-weight: 800; background: #fff; border: 2px solid #cbd5e1; color: #94a3b8; transition: all .4s; }
.mc-step.done .mc-dot { background: #4f8ef7; border-color: #4f8ef7; color: #fff; }
.mc-step.now .mc-dot { background: linear-gradient(135deg, #4f8ef7, #7c3aed); border-color: transparent; color: #fff; animation: sx-pulse 2.4s infinite; }
.mc-step.bad .mc-dot { background: #dc2626; border-color: #dc2626; color: #fff; }
.mc-step-l { font-size: 10px; line-height: 1.2; font-weight: 700; color: #94a3b8; padding: 0 2px; }
.mc-step.done .mc-step-l { color: #64748b; } .mc-step.now .mc-step-l { color: #1a2540; } .mc-step.bad .mc-step-l { color: #dc2626; }

/* empty */
.mc-empty { text-align: center; padding: 56px 24px; background: #fff; border-radius: 20px; border: 1px dashed #cbd5e1; box-shadow: var(--sx-shadow-1); }
.mc-empty-art { position: relative; width: 150px; height: 150px; margin: 0 auto 22px; display: grid; place-items: center; }
.mc-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(79,142,247,.35); animation: mc-ring 3.2s ease-out infinite; }
.mc-ring.r2 { animation-delay: 1.4s; border-color: rgba(124,58,237,.35); }
.mc-empty-ico { width: 92px; height: 92px; border-radius: 28px; display: grid; place-items: center; font-size: 38px; color: #fff; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 22px 44px rgba(79,142,247,.45); transform: rotate(-6deg); }
.mc-empty h3 { font-size: 24px; font-weight: 900; letter-spacing: -.03em; color: #1a2540; margin: 0 0 8px; }
.mc-empty p { color: #64748b; font-size: 15px; max-width: 420px; margin: 0 auto 22px; line-height: 1.6; }
.mc-empty-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.mc-cta { display: inline-flex; align-items: center; gap: 9px; padding: 13px 26px; border-radius: 14px; font-weight: 800; font-size: 14px; color: #fff; text-decoration: none; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 12px 28px rgba(124,58,237,.35); transition: transform .3s var(--sx-ease), box-shadow .3s; border: 0; cursor: pointer; }
.mc-cta:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 18px 40px rgba(124,58,237,.5); color: #fff; }
.mc-cta.alt { background: #fff; color: #1a2540; border: 1.5px solid #cbd5e1; box-shadow: none; } .mc-cta.alt:hover { border-color: #4f8ef7; color: #4f8ef7; box-shadow: 0 10px 24px rgba(79,142,247,.2); }

/* skeleton */
.mc-skel-card { background: #fff; border: 1px solid #e8edf5; border-radius: 24px; padding: 24px; }
.mc-skel { border-radius: 8px; background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 45%, #eef2f7 65%); background-size: 200% 100%; animation: mc-shimmer 1.4s linear infinite; }
@keyframes mc-shimmer { to { background-position: -200% 0; } }

/* modal */
.mc-overlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(10,16,32,.62); backdrop-filter: blur(8px); animation: mc-fade .25s ease; }
.mc-modal { width: 100%; max-width: 780px; max-height: 92vh; display: flex; flex-direction: column; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.45); animation: mc-pop .45s var(--sx-ease); font-family: 'Outfit', sans-serif; }
.mc-modal.wide { max-width: 980px; }
.mc-modal *, .mc-modal *::before, .mc-modal *::after { box-sizing: border-box; }
@keyframes mc-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mc-pop { from { opacity: 0; transform: translateY(30px) scale(.94); } to { opacity: 1; transform: none; } }
.mc-mhead { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 28px 30px 26px; color: #fff; background: linear-gradient(160deg, #0f1824, #1a2540 60%, #14203a); flex-shrink: 0; }
.mc-mhead::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: linear-gradient(90deg, #4f8ef7, #7c3aed, #4f8ef7); }
.mc-meyebrow { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; font-weight: 800; color: #a5c4ff; }
.mc-mhead h2 { margin: 6px 0 6px; font-size: 28px; font-weight: 900; letter-spacing: -.03em; color: #fff; }
.mc-mhead p { margin: 0; font-size: 13px; color: rgba(255,255,255,.6); }
.mc-close { position: relative; z-index: 1; width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.1); color: #fff; cursor: pointer; display: grid; place-items: center; transition: transform .35s var(--sx-ease), background .2s; flex-shrink: 0; }
.mc-close:hover { background: rgba(255,255,255,.24); transform: rotate(90deg); }
.mc-mbody { overflow-y: auto; padding: 26px 30px; flex: 1; background: #f8fafc; }
.mc-mfoot { padding: 14px 30px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; justify-content: flex-end; flex-shrink: 0; }
.mc-mfoot .mc-cta { padding: 11px 26px; }
.mc-sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 22px; }
.mc-sum > div { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px 18px; }
.mc-sum small, .mc-lbl { display: block; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #94a3b8; font-weight: 800; margin-bottom: 8px; }
.mc-sum .big { font-size: 28px; font-weight: 900; letter-spacing: -.03em; color: #16a34a; line-height: 1; }
.mc-sec { display: flex; align-items: center; gap: 10px; margin: 6px 0 14px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: #1a2540; }
.mc-sec::before { content: ""; width: 4px; height: 20px; border-radius: 3px; background: linear-gradient(180deg, #4f8ef7, #7c3aed); }
.mc-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.mc-item-h { display: flex; gap: 16px; align-items: center; padding: 16px 18px; }
.mc-item-img { width: 84px; height: 84px; border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, #eef3ff, #f5f0ff); border: 1px solid #e2e8f0; display: grid; place-items: center; flex-shrink: 0; color: #4f8ef7; font-size: 28px; }
.mc-item-img img { width: 100%; height: 100%; object-fit: cover; }
.mc-item-t { font-size: 16px; font-weight: 800; color: #1a2540; margin: 0 0 6px; }
.mc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mc-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.mc-pill b { color: #1a2540; font-weight: 800; }
.mc-pill.blue { background: #eef3ff; border-color: #c7d9ff; color: #3b6fe0; }
.mc-item-sub { margin-left: auto; text-align: right; padding-left: 8px; }
.mc-item-sub b { display: block; font-size: 20px; font-weight: 900; color: #16a34a; letter-spacing: -.02em; }
.mc-item-sub small { font-size: 10px; letter-spacing: .1em; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
.mc-attrs { display: flex; flex-wrap: wrap; gap: 8px 18px; padding: 12px 18px; background: #f3f6fd; border-top: 1px solid #e2e8f0; font-size: 12.5px; color: #64748b; }
.mc-attrs span b { color: #1a2540; }
.mc-note { margin: 0 18px 14px; padding: 9px 13px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 12.5px; }
.mc-designs { padding: 14px 18px 18px; border-top: 1px solid #e2e8f0; }
.mc-design { display: flex; gap: 14px; padding: 12px; border-radius: 16px; background: linear-gradient(135deg, #faf8ff, #f3f7ff); border: 1px solid #ddd6fe; margin-top: 10px; }
.mc-design-img { width: 88px; height: 88px; border-radius: 14px; overflow: hidden; border: 2px solid #ddd6fe; flex-shrink: 0; cursor: zoom-in; position: relative; background: #fff; display: grid; place-items: center; color: #c4b5fd; font-size: 24px; padding: 0; }
.mc-design-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--sx-ease); }
.mc-design-img:hover img { transform: scale(1.15); }
.mc-design-b { flex: 1; min-width: 0; }
.mc-design-t { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.mc-design-t strong { font-size: 14px; font-weight: 800; color: #1a2540; display: flex; align-items: center; gap: 8px; }
.mc-design-t strong i { font-style: normal; width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: linear-gradient(135deg, #7c3aed, #4f8ef7); color: #fff; font-size: 11px; }
.mc-cost { font-weight: 800; font-size: 14px; color: #16a34a; }
.mc-cost.none { font-size: 11px; color: #d97706; background: #fffbeb; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 999px; }
.mc-kv { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mc-kv > div { background: #fff; border: 1px solid #e0e7ff; border-radius: 10px; padding: 7px 11px; }
.mc-kv > div.full { grid-column: 1 / -1; }
.mc-kv small { display: block; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: #94a3b8; font-weight: 800; }
.mc-kv span { font-size: 13px; font-weight: 700; color: #1a2540; }
.mc-lightbox { position: fixed; inset: 0; z-index: 10010; background: rgba(5,8,18,.9); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 20px; animation: mc-fade .2s; }
.mc-lightbox img { max-width: 90vw; max-height: 76vh; border-radius: 20px; box-shadow: 0 30px 80px rgba(0,0,0,.6); animation: mc-pop .4s var(--sx-ease); }
.mc-info { background: linear-gradient(135deg, #eef3ff, #f5f0ff); border: 1px solid #c7d9ff; border-radius: 18px; padding: 16px 20px; margin-bottom: 22px; }
.mc-info .mc-kv > div { border-color: #c7d9ff; }

/* formularios */
.mc-glass-card { position: relative; background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; box-shadow: 0 4px 8px rgba(15,23,42,.05), 0 36px 80px rgba(26,37,64,.2); overflow: hidden; }
.mc-glass-card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: linear-gradient(90deg, #4f8ef7, #7c3aed, #4f8ef7); background-size: 200% auto; animation: sx-shine 4s linear infinite; }
.mc-fsec { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; transition: border-color .3s, box-shadow .3s; }
.mc-fsec:focus-within { border-color: rgba(79,142,247,.45); box-shadow: 0 0 0 4px rgba(79,142,247,.08); }
.mc-fsec-h { display: flex; align-items: center; gap: 10px; margin: 0 0 16px; font-size: 12px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: #1a2540; }
.mc-fsec-h span { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-size: 13px; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 8px 18px rgba(79,142,247,.35); }
.mc-fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.mc-field label { display: block; margin-bottom: 7px; font-weight: 700; font-size: 13px; color: #1a2540; }
.mc-field label i { color: #dc2626; font-style: normal; }
.mc-input { width: 100%; padding: 12px 15px; font-size: 14px; color: #0f172a; background: #fff; border: 1.5px solid #dbe3ef; border-radius: 13px; outline: none; transition: border-color .25s, box-shadow .25s, transform .25s var(--sx-ease); appearance: none; -webkit-appearance: none; }
.mc-input:hover:not(:disabled):not([readonly]) { border-color: #b7c6e2; }
.mc-input:focus { border-color: #4f8ef7; box-shadow: 0 0 0 4px rgba(79,142,247,.18), 0 8px 24px rgba(79,142,247,.18); transform: translateY(-1px); }
.mc-input.err { border-color: #dc2626; background: #fef2f2; } .mc-input.err:focus { box-shadow: 0 0 0 4px rgba(220,38,38,.14); }
.mc-input.ok { border-color: #86efac; }
.mc-input[readonly] { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
.mc-input:disabled { opacity: .65; }
textarea.mc-input { resize: vertical; min-height: 76px; }
.mc-selwrap { position: relative; } .mc-selwrap > svg { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #64748b; }
.mc-selwrap select.mc-input { padding-right: 38px; cursor: pointer; }
.mc-err { margin: 6px 0 0; font-size: 12px; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 5px; animation: mc-shake .35s; }
.mc-hint { margin: 6px 0 0; font-size: 12px; color: #64748b; }
@keyframes mc-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.mc-save { border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 800; color: #fff; position: relative; overflow: hidden; background: linear-gradient(135deg, #4f8ef7, #7c3aed); background-size: 160% 100%; box-shadow: 0 14px 34px rgba(124,58,237,.38); transition: transform .3s var(--sx-ease), box-shadow .3s, background-position .5s; }
.mc-save::after { content: ""; position: absolute; top: 0; left: -80%; width: 50%; height: 100%; transform: skewX(-22deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent); animation: mc-glint 3.4s ease-in-out infinite; }
@keyframes mc-glint { 0%, 55% { left: -80%; } 100% { left: 140%; } }
.mc-save:hover:not(:disabled) { transform: translateY(-3px) scale(1.03); background-position: 100% 0; box-shadow: 0 20px 46px rgba(124,58,237,.52); }
.mc-save:disabled { cursor: not-allowed; opacity: .7; } .mc-save:disabled::after { display: none; }
.mc-ghostbtn { border: 1.5px solid #cbd5e1; cursor: pointer; padding: 13px 26px; border-radius: 14px; font-size: 14px; font-weight: 700; color: #475569; background: #fff; transition: all .25s; }
.mc-ghostbtn:hover:not(:disabled) { border-color: #1a2540; color: #1a2540; transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15,23,42,.1); }
.mc-spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: sx-spin .7s linear infinite; }

@media (max-width: 760px) {
  .mc-hero { padding: 36px 18px 30px; }
  .mc-wrap { padding: 0 16px 64px; }
  .mc-stat { padding: 10px 16px; min-width: 96px; }
  .mc-grid { grid-template-columns: 1fr; }
  .mc-fgrid { grid-template-columns: 1fr; }
  .mc-mhead { padding: 22px 20px; } .mc-mhead h2 { font-size: 22px; }
  .mc-mbody { padding: 18px 16px; } .mc-mfoot { padding: 12px 16px; }
  .mc-item-h { flex-wrap: wrap; } .mc-item-sub { margin-left: 0; text-align: left; padding-left: 0; width: 100%; }
  .mc-design { flex-direction: column; } .mc-design-img { width: 100%; height: 150px; }
  .mc-kv { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .mc-page *, .mc-modal *, .mc-overlay { animation: none !important; transition-duration: .01ms !important; }
}
`;
