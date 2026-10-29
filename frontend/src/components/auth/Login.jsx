import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUsuario } from "../../Services/api-auth/auth";
import fondo from "../../assets/images/imagenfondo.webp";
import logo from "../../assets/images/nuevo_logo_stamplab.png";
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import Swal from "sweetalert2";
import usePlus from "../../hooks/usePlus";
import {
    FaEye, FaEyeSlash, FaEnvelope, FaLock, FaCheck, FaExclamation, FaExclamationCircle,
    FaArrowRight, FaBoxOpen, FaPalette, FaShippingFast, FaShieldAlt,
} from "react-icons/fa";
import { C } from "../../config/tokens";

/* ═══════════════════════════════════════════════════════════
   KIT DE AUTENTICACIÓN (compartido por Login, Registro,
   Recuperar y Restablecer). Clases con prefijo .au-
   ═══════════════════════════════════════════════════════════ */

/* ── Tokens de color ── */

export const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
.au-page, .au-page * { box-sizing: border-box; }
.au-page { --au-ease: cubic-bezier(.22,1,.36,1); --au-grad: linear-gradient(100deg,#4f8ef7 0%,#6d5ff0 55%,#7c3aed 100%);
  min-height: calc(100vh - 72px); display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding: 56px 20px 48px; font-family:'Outfit',sans-serif; isolation:isolate; }
.au-page .sx-blob { opacity:.62; } .au-page .sx-blob.b1 { animation-duration: 16s; width:560px; height:560px; } .au-page .sx-blob.b2 { width:520px; height:520px; } .au-page .sx-blob.b3 { left: 64%; top: 14%; opacity:.30; }
.au-glow-line { position:absolute; left:50%; top:0; width:min(900px,90%); height:1px; transform:translateX(-50%);
  background:linear-gradient(90deg,transparent,rgba(79,142,247,.7),rgba(124,58,237,.7),transparent); opacity:.6; }

/* ── Marco con borde degradado animado ── */
.au-frame { position:relative; z-index:1; width:100%; max-width:960px; padding:1.5px; border-radius:30px;
  background: linear-gradient(130deg, rgba(79,142,247,.95), rgba(124,58,237,.75) 30%, rgba(255,255,255,.10) 55%, rgba(79,142,247,.85) 80%, rgba(124,58,237,.9));
  background-size: 260% 260%; animation: au-border 9s linear infinite, au-rise .8s var(--au-ease) both;
  box-shadow: 0 50px 120px -30px rgba(0,0,0,.75), 0 30px 60px -30px rgba(79,142,247,.45), 0 0 0 1px rgba(255,255,255,.04); }
.au-frame.wide { max-width: 1080px; }
.au-frame::before { content:""; position:absolute; inset:-40px; z-index:-1; border-radius:60px; pointer-events:none;
  background: radial-gradient(closest-side, rgba(79,142,247,.30), transparent); filter: blur(30px); opacity:.7; }
.au-card { display:grid; grid-template-columns: 1fr 1fr; border-radius:28.5px; overflow:hidden; background:#fff; min-height:580px; }
.au-frame.wide .au-card { grid-template-columns: 380px 1fr; }

/* ── Panel visual (imagen) ── */
.au-visual { position:relative; overflow:hidden; color:#fff; display:flex; flex-direction:column; justify-content:space-between; padding:26px; min-height:100%; background:#0f1824; }
.au-photo-wrap { position:absolute; inset:-28px; transform: translate3d(calc(var(--px,0) * -22px), calc(var(--py,0) * -22px), 0); transition: transform .9s var(--au-ease); will-change: transform; }
.au-photo { position:absolute; inset:0; background-size:cover; background-position:center 35%; animation: au-kenburns 22s ease-in-out infinite alternate; }
.au-shade { position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(to top, rgba(10,16,30,.96) 0%, rgba(15,24,36,.78) 30%, rgba(26,37,64,.25) 62%, rgba(15,24,36,.38) 100%),
              linear-gradient(135deg, rgba(79,142,247,.30), transparent 45%, rgba(124,58,237,.35)); }
.au-shade::after { content:""; position:absolute; inset:0; opacity:.35; mix-blend-mode:overlay;
  background-image: radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px); background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, #000, transparent 55%); -webkit-mask-image: linear-gradient(to bottom, #000, transparent 55%); }
.au-brand { position:relative; z-index:2; display:inline-flex; align-items:center; gap:10px; align-self:flex-start; padding:6px 14px 6px 6px; border-radius:999px;
  background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.22); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  text-decoration:none; color:#fff; font-weight:800; font-size:13px; letter-spacing:.02em; transition: background .3s, transform .4s var(--au-ease); }
.au-brand:hover { background: rgba(255,255,255,.2); transform: translateY(-2px); color:#fff; }
.au-brand img { width:38px; height:38px; border-radius:50%; background:#fff; object-fit:contain; padding:3px; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.au-vtext { position:relative; z-index:2; }
.au-vtext .sx-eyebrow { color:#9cc0ff; }
.au-vtitle { margin:12px 0 10px; font-weight:900; font-size: clamp(30px, 3.4vw, 42px); line-height:1.02; letter-spacing:-.035em; color:#fff; text-shadow: 0 4px 30px rgba(0,0,0,.35); }
.au-vsub { margin:0; max-width: 340px; font-size:14px; line-height:1.6; color: rgba(255,255,255,.86); }
.au-dots { display:flex; gap:6px; margin-top:20px; }
.au-dots span { height:4px; width:14px; border-radius:4px; background: rgba(255,255,255,.3); }
.au-dots span.on { width:34px; background: var(--au-grad); }

/* Chips de cristal flotantes */
.au-chips { position:absolute; inset:0; z-index:2; pointer-events:none; transform: translate3d(calc(var(--px,0) * 16px), calc(var(--py,0) * 16px), 0); transition: transform .9s var(--au-ease); }
.au-chip { position:absolute; display:flex; align-items:center; gap:10px; padding:9px 14px 9px 9px; border-radius:16px;
  background: linear-gradient(150deg, rgba(26,37,64,.62), rgba(15,24,36,.42)); border:1px solid rgba(255,255,255,.26);
  backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow: 0 18px 40px -12px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.3);
  opacity:0; animation: au-chip-in .9s var(--au-ease) forwards, au-bob 5.5s ease-in-out infinite; }
.au-chip i { display:grid; place-items:center; width:32px; height:32px; border-radius:11px; font-style:normal; color:#fff; background: var(--au-grad); box-shadow: 0 6px 16px rgba(79,142,247,.5); font-size:14px; }
.au-chip b { display:block; font-size:14px; font-weight:800; line-height:1.1; color:#fff; }
.au-chip small { display:block; font-size:11px; color:rgba(255,255,255,.78); font-weight:500; }
.au-chip.c1 { top: 19%; right: 22px; animation-delay: .45s, .45s; }
.au-chip.c2 { top: 38%; left: 22px; animation-delay: .65s, -1.8s; }
.au-chip.c3 { top: 55%; right: 34px; animation-delay: .85s, -3.4s; }
.au-chip.c3 i { background: linear-gradient(135deg,#22c55e,#16a34a); box-shadow: 0 6px 16px rgba(22,163,74,.45); }

/* ── Panel de formulario ── */
.au-form { position:relative; padding: 44px 46px 38px; display:flex; flex-direction:column; justify-content:center; min-width:0;
  background: radial-gradient(500px 260px at 100% 0%, rgba(124,58,237,.07), transparent 60%), radial-gradient(420px 240px at 0% 100%, rgba(79,142,247,.07), transparent 60%), #fff; }
.au-frame.wide .au-form { padding: 38px 42px 32px; }
.au-stagger > * { opacity:0; animation: au-slide .7s var(--au-ease) both; }
.au-stagger > *:nth-child(1){animation-delay:.12s} .au-stagger > *:nth-child(2){animation-delay:.19s}
.au-stagger > *:nth-child(3){animation-delay:.26s} .au-stagger > *:nth-child(4){animation-delay:.33s}
.au-stagger > *:nth-child(5){animation-delay:.40s} .au-stagger > *:nth-child(6){animation-delay:.47s}
.au-stagger > *:nth-child(7){animation-delay:.54s}

/* Pestañas login / registro */
.au-tabs { position:relative; display:grid; grid-template-columns:1fr 1fr; padding:5px; margin-bottom:28px; border-radius:14px; background:#f1f5fb; border:1px solid #e6ecf5; }
.au-tabs a { position:relative; z-index:1; text-align:center; padding:9px 8px; border-radius:10px; font-weight:700; font-size:13px; color:#64748b; text-decoration:none; transition: color .3s; }
.au-tabs a:hover { color:#1a2540; }
.au-tabs a.on { color:#1a2540; }
.au-tabs .au-pill { position:absolute; top:5px; bottom:5px; width:calc(50% - 5px); border-radius:10px; background:#fff;
  box-shadow: 0 1px 2px rgba(15,23,42,.06), 0 6px 16px rgba(26,37,64,.10); }
.au-tabs .au-pill::after { content:""; position:absolute; left:22%; right:22%; bottom:-1px; height:2px; border-radius:2px; background: var(--au-grad); }
.au-tabs .au-pill.l { left:5px; animation: au-pill-l .55s var(--au-ease) both; }
.au-tabs .au-pill.r { left:50%; animation: au-pill-r .55s var(--au-ease) both; }

.au-head { margin-bottom: 26px; }
.au-badge { display:grid; place-items:center; width:52px; height:52px; border-radius:16px; color:#fff; font-size:20px; margin-bottom:16px; background: var(--au-grad); box-shadow: 0 14px 30px -6px rgba(79,142,247,.55); }
.au-badge.warn { background: linear-gradient(135deg,#f59e0b,#ea580c); box-shadow: 0 14px 30px -6px rgba(234,88,12,.45); }
.au-title { margin:0; font-weight:900; font-size:30px; line-height:1.1; letter-spacing:-.03em; color:#1a2540; }
.au-sub { margin:8px 0 0; font-size:14px; line-height:1.55; color:#64748b; }

/* ── Campo con icono + etiqueta flotante ── */
.au-field { margin-bottom: 16px; }
.au-ctrl { position:relative; display:flex; align-items:center; height:58px; border-radius:15px; background:#f6f8fc; border:1.5px solid #e3e9f3;
  transition: background .25s, border-color .25s, box-shadow .3s var(--au-ease), transform .3s var(--au-ease); }
.au-ctrl::before { content:""; position:absolute; inset:-1.5px; border-radius:inherit; padding:1.5px; pointer-events:none; opacity:0; transition: opacity .3s;
  background: linear-gradient(120deg,#4f8ef7,#7c3aed,#4f8ef7); background-size: 200% 100%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
.au-ctrl:hover { border-color:#c9d6ec; background:#f3f6fc; }
.au-field.is-focus .au-ctrl { background:#fff; border-color:transparent; box-shadow: 0 0 0 4px rgba(79,142,247,.13), 0 14px 30px -12px rgba(79,142,247,.45); }
.au-field.is-focus .au-ctrl::before { opacity:1; animation: au-flow 3s linear infinite; }
.au-field.is-ok .au-ctrl { border-color: rgba(22,163,74,.45); background:#fbfefc; }
.au-field.is-err .au-ctrl { border-color:#f19999; background:#fff6f6; animation: au-shake .42s; }
.au-field.is-err.is-focus .au-ctrl { box-shadow: 0 0 0 4px rgba(220,38,38,.12); }
.au-field.is-err.is-focus .au-ctrl::before { opacity:0; }
.au-field.is-dis .au-ctrl { opacity:.65; }
.au-ico { position:absolute; left:16px; top:50%; transform:translateY(-50%); display:grid; place-items:center; color:#94a3b8; font-size:15px; transition: color .25s, transform .35s var(--au-ease); pointer-events:none; }
.au-field.is-focus .au-ico { color:#4f8ef7; transform: translateY(-50%) scale(1.12); }
.au-field.is-ok .au-ico { color:#16a34a; }
.au-field.is-err .au-ico { color:#dc2626; }
.au-in { width:100%; height:100%; border:0 !important; outline:none !important; background:transparent !important; box-shadow:none !important;
  padding: 20px 14px 4px 46px; font: 500 15px 'Outfit', sans-serif; color:#0f172a; border-radius:inherit; }
.au-in::placeholder { color: transparent; transition: color .2s; }
.au-field.is-focus .au-in::placeholder { color:#a3afc2; }
.au-in:-webkit-autofill { -webkit-box-shadow: 0 0 0 60px #fff inset !important; -webkit-text-fill-color:#0f172a; }
.au-has-r .au-in { padding-right: 46px; } .au-has-r2 .au-in { padding-right: 82px; }
.au-lbl { position:absolute; left:46px; top:50%; transform:translateY(-50%); margin:0; font-size:14px; font-weight:500; color:#7b879b; pointer-events:none; white-space:nowrap; max-width: calc(100% - 60px); overflow:hidden; text-overflow:ellipsis;
  transition: top .25s var(--au-ease), font-size .25s var(--au-ease), color .25s, letter-spacing .25s; }
.au-lbl b { color:#dc2626; font-weight:700; margin-left:2px; }
.au-field.is-focus .au-lbl, .au-field.has-val .au-lbl, .au-in:-webkit-autofill ~ .au-lbl { top:15px; font-size:11px; font-weight:700; letter-spacing:.03em; color:#64748b; }
.au-field.is-focus .au-lbl { color:#4f8ef7; }
.au-field.is-err .au-lbl { color:#dc2626; }
.au-state { position:absolute; right:14px; top:50%; display:grid; place-items:center; width:22px; height:22px; border-radius:50%; color:#fff; font-size:10px; transform: translateY(-50%) scale(0); transition: transform .45s cubic-bezier(.34,1.56,.64,1); pointer-events:none; }
.au-has-r2 .au-state { right: 50px; }
.au-field.is-ok .au-state { transform: translateY(-50%) scale(1); background: linear-gradient(135deg,#22c55e,#16a34a); box-shadow: 0 4px 12px rgba(22,163,74,.4); }
.au-field.is-err .au-state { transform: translateY(-50%) scale(1); background:#dc2626; box-shadow: 0 4px 12px rgba(220,38,38,.35); }
.au-eye { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; background:transparent; width:36px; height:36px; border-radius:10px; color:#94a3b8; cursor:pointer; display:grid; place-items:center; transition: background .2s, color .2s; }
.au-eye:hover { background:#eef3ff; color:#4f8ef7; }
.au-msg { display:flex; align-items:flex-start; gap:6px; margin:7px 2px 0; font-size:12.5px; font-weight:600; line-height:1.35; animation: au-drop .35s var(--au-ease) both; }
.au-msg.err { color:#dc2626; } .au-msg.hint { color:#7b879b; font-weight:500; } .au-msg.ok { color:#16a34a; }
.au-msg svg { flex-shrink:0; margin-top:2px; }

/* ── Indicador de fuerza ── */
.au-meter { margin:10px 2px 0; animation: au-drop .35s var(--au-ease) both; }
.au-bars { display:grid; grid-template-columns: repeat(4,1fr); gap:6px; }
.au-bars span { height:5px; border-radius:5px; background:#e8edf5; position:relative; overflow:hidden; }
.au-bars span::after { content:""; position:absolute; inset:0; border-radius:inherit; background: var(--au-m, #e8edf5); transform: scaleX(0); transform-origin:left; transition: transform .45s var(--au-ease), background .3s; }
.au-bars span.on::after { transform: scaleX(1); }
.au-mrow { display:flex; justify-content:space-between; align-items:center; margin-top:7px; font-size:12px; color:#7b879b; font-weight:500; }
.au-mrow b { color: var(--au-m); font-weight:800; }
.au-reqs { display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
.au-req { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:999px; font-size:11px; font-weight:600; color:#7b879b; background:#f3f6fb; border:1px solid #e6ecf5; transition: all .3s; }
.au-req.on { color:#15803d; background:#effdf4; border-color:#bbf7d0; }
.au-req svg { font-size:9px; }

/* ── Botón principal ── */
.au-cta { position:relative; width:100%; height:56px; margin-top:8px; border:0; border-radius:15px; overflow:hidden; cursor:pointer; color:#fff;
  font: 800 15px 'Outfit', sans-serif; letter-spacing:.01em; background: linear-gradient(100deg,#4f8ef7,#6d5ff0 50%,#7c3aed,#4f8ef7); background-size: 220% 100%;
  box-shadow: 0 16px 34px -10px rgba(79,142,247,.65), 0 8px 18px -10px rgba(124,58,237,.6), inset 0 1px 0 rgba(255,255,255,.25);
  transition: transform .35s var(--au-ease), box-shadow .35s, background-position .8s var(--au-ease), filter .3s; }
.au-cta:not(:disabled):hover { transform: translateY(-2px); background-position: 100% 0; box-shadow: 0 22px 44px -12px rgba(124,58,237,.7), 0 10px 22px -10px rgba(79,142,247,.6), inset 0 1px 0 rgba(255,255,255,.25); }
.au-cta:not(:disabled):active { transform: translateY(0) scale(.985); }
.au-cta:focus-visible { outline: 3px solid rgba(79,142,247,.45); outline-offset: 3px; }
.au-cta::after { content:""; position:absolute; top:0; left:-75%; width:45%; height:100%; transform:skewX(-22deg); pointer-events:none;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent); animation: au-sheen 3.8s ease-in-out infinite; }
.au-cta:disabled { cursor:progress; filter: saturate(.75); }
.au-cta:disabled::after { animation-duration: 1.2s; }
.au-cta-in { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:10px; }
.au-arrow { transition: transform .35s var(--au-ease); }
.au-cta:not(:disabled):hover .au-arrow { transform: translateX(5px); }
.au-spin { width:18px; height:18px; border-radius:50%; border:2.5px solid rgba(255,255,255,.35); border-top-color:#fff; animation: au-rot .7s linear infinite; }

.au-links { margin-top:24px; display:flex; flex-direction:column; gap:10px; text-align:center; font-size:13.5px; color:#64748b; }
.au-links p { margin:0; }
.au-link { color:#4f8ef7 !important; font-weight:700; text-decoration:none !important; background: linear-gradient(90deg,#4f8ef7,#7c3aed) no-repeat 0 100% / 0 2px; padding-bottom:2px; transition: background-size .35s var(--au-ease), color .2s; }
.au-link:hover { background-size: 100% 2px; color:#6d5ff0 !important; }
.au-back { display:inline-flex; align-items:center; gap:8px; }
.au-back svg { transition: transform .3s var(--au-ease); } .au-back:hover svg { transform: translateX(-4px); }
.au-trust { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:22px; font-size:12.5px; color:rgba(255,255,255,.62); animation: au-rise .8s .5s var(--au-ease) both; }
.au-trust svg { color:#7fb0ff; }

/* ── Alertas ── */
.au-alert { display:flex; gap:12px; align-items:flex-start; padding:13px 14px; margin-bottom:18px; border-radius:14px; font-size:13px; font-weight:600; line-height:1.45; animation: au-pop .4s cubic-bezier(.34,1.56,.64,1) both; }
.au-alert i { display:grid; place-items:center; width:22px; height:22px; flex-shrink:0; border-radius:50%; color:#fff; font-size:10px; font-style:normal; }
.au-alert.err { background:#fff4f4; border:1.5px solid #fecaca; color:#b91c1c; } .au-alert.err i { background:#dc2626; }
.au-alert.ok { background:#f0fdf4; border:1.5px solid #bbf7d0; color:#15803d; } .au-alert.ok i { background:#16a34a; }
.au-alert.warn { background:#fffbeb; border:1.5px solid #fde68a; color:#b45309; } .au-alert.warn i { background:#d97706; }

/* ── Pantalla de éxito ── */
.au-success { text-align:center; padding: 6px 0 4px; }
.au-burst { position:relative; width:128px; height:128px; margin: 0 auto 22px; display:grid; place-items:center; }
.au-burst .ring { position:absolute; inset:14px; border-radius:50%; border:2px solid rgba(22,163,74,.35); animation: au-ring 2.4s ease-out infinite; }
.au-burst .ring.r2 { animation-delay: 1.2s; }
.au-burst .core { position:relative; width:88px; height:88px; border-radius:28px; display:grid; place-items:center; color:#fff; font-size:34px;
  background: linear-gradient(135deg,#4f8ef7,#7c3aed); box-shadow: 0 20px 40px -10px rgba(124,58,237,.55); animation: au-core .8s cubic-bezier(.34,1.56,.64,1) both; }
.au-burst .core.green { background: linear-gradient(135deg,#22c55e,#16a34a); box-shadow: 0 20px 40px -10px rgba(22,163,74,.55); }
.au-burst .tick { position:absolute; right:12px; bottom:12px; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:#fff; font-size:14px;
  background: linear-gradient(135deg,#22c55e,#16a34a); border:3px solid #fff; box-shadow: 0 6px 16px rgba(22,163,74,.45); animation: au-core .6s .45s cubic-bezier(.34,1.56,.64,1) both; }
.au-burst .spark { position:absolute; left:50%; top:50%; width:8px; height:8px; margin:-4px; border-radius:50%; opacity:0; animation: au-spark 1.1s .35s var(--au-ease) both; }
.au-success h3 { margin:0 0 8px; font-weight:900; font-size:26px; letter-spacing:-.02em; color:#1a2540; }
.au-success > p { margin:0 auto 6px; max-width:360px; font-size:14px; line-height:1.6; color:#64748b; }
.au-steps { display:grid; grid-template-columns: repeat(3,1fr); gap:10px; margin: 22px 0 24px; }
.au-step { padding:14px 8px 12px; border-radius:14px; background:#f6f8fc; border:1px solid #e6ecf5; font-size:12px; font-weight:600; color:#475569; line-height:1.35; opacity:0; animation: au-rise .6s var(--au-ease) both; }
.au-step:nth-child(1){animation-delay:.55s} .au-step:nth-child(2){animation-delay:.68s} .au-step:nth-child(3){animation-delay:.81s}
.au-step span { display:grid; place-items:center; width:26px; height:26px; margin:0 auto 8px; border-radius:9px; color:#fff; font-size:12px; font-weight:800; background: linear-gradient(135deg,#4f8ef7,#7c3aed); }

/* ── Grids ── */
.au-grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 0 14px; align-items:start; }

/* ── Animaciones ── */
@keyframes au-rise { from{opacity:0;transform:translateY(22px) scale(.985)} to{opacity:1;transform:none} }
@keyframes au-slide { from{opacity:0;transform:translateX(26px)} to{opacity:1;transform:none} }
@keyframes au-border { 0%{background-position:0% 50%} 100%{background-position:260% 50%} }
@keyframes au-kenburns { from{transform:scale(1.04) translate(0,0)} to{transform:scale(1.14) translate(-1.5%,-2%)} }
@keyframes au-chip-in { from{opacity:0; filter:blur(6px)} to{opacity:1; filter:none} }
@keyframes au-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes au-sheen { 0%,55%{left:-75%} 100%{left:140%} }
@keyframes au-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
@keyframes au-flow { to { background-position: 200% 0; } }
@keyframes au-drop { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }
@keyframes au-pop { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:none} }
@keyframes au-rot { to { transform: rotate(360deg); } }
@keyframes au-pill-l { from{left:50%} to{left:5px} }
@keyframes au-pill-r { from{left:5px} to{left:50%} }
@keyframes au-ring { from{transform:scale(.8);opacity:1} to{transform:scale(1.55);opacity:0} }
@keyframes au-core { from{transform:scale(0) rotate(-20deg);opacity:0} to{transform:none;opacity:1} }
@keyframes au-spark { 0%{opacity:0;transform:rotate(var(--a)) translateX(0) scale(.4)} 30%{opacity:1} 100%{opacity:0;transform:rotate(var(--a)) translateX(66px) scale(1)} }

/* ── Responsive ── */
@media (max-width: 1100px) { .au-frame.wide .au-card { grid-template-columns: 320px 1fr; } .au-frame.wide .au-chip.c2 { display:none; } }
@media (max-width: 860px) {
  .au-page { padding: 24px 16px 32px; justify-content:flex-start; }
  .au-frame, .au-frame.wide { border-radius:26px; }
  .au-card, .au-frame.wide .au-card { grid-template-columns: 1fr; min-height:0; border-radius:24.5px; }
  .au-visual { min-height: 200px; padding:18px; }
  .au-vtitle { font-size: 28px; margin:8px 0 0; }
  .au-vsub, .au-dots, .au-chip.c2, .au-chip.c3 { display:none; }
  .au-chip.c1 { top:16px; right:16px; padding:7px 11px 7px 7px; }
  .au-chip.c1 i { width:26px; height:26px; font-size:12px; border-radius:9px; }
  .au-brand img { width:32px; height:32px; }
  .au-form, .au-frame.wide .au-form { padding: 26px 20px 26px; }
  .au-title { font-size:26px; }
  .au-head { margin-bottom: 20px; }
  .au-tabs { margin-bottom: 22px; }
}
@media (max-width: 600px) { .au-grid2 { grid-template-columns: 1fr; } .au-steps { gap:8px; } .au-step { font-size:11px; padding:12px 6px 10px; } }
@media (prefers-reduced-motion: reduce) {
  .au-frame, .au-photo, .au-chip, .au-stagger > *, .au-cta::after, .au-trust, .au-field.is-err .au-ctrl, .au-field.is-focus .au-ctrl::before,
  .au-tabs .au-pill, .au-alert, .au-msg, .au-meter, .au-burst *, .au-step { animation: none !important; opacity: 1 !important; }
  .au-burst .spark { opacity: 0 !important; }
  .au-photo-wrap, .au-chips { transform: none !important; transition: none !important; }
  .au-cta, .au-ctrl, .au-lbl, .au-state, .au-bars span::after { transition: none !important; }
}
`;

/* ── Estructura: fondo animado + tarjeta (imagen | formulario) ── */
const CHIPS = [
    { cls: "c1", icon: <FaBoxOpen />, value: "+500", label: "pedidos" },
    { cls: "c2", icon: <FaPalette />, value: "4 técnicas", label: "de estampado" },
    { cls: "c3", icon: <FaShippingFast />, value: "Entrega", label: "a tiempo" },
];

export function AuthShell({ img, eyebrow, title, accent, subtitle, step = 0, wide = false, children }) {
    usePlus();
    const ref = useRef(null);
    const onMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    const onLeave = () => {
        ref.current?.style.setProperty("--px", "0");
        ref.current?.style.setProperty("--py", "0");
    };
    return (
        <div className="au-page sx-hero-bg">
            <style>{AUTH_CSS}</style>
            <div className="sx-blob b1" /><div className="sx-blob b2" /><div className="sx-blob b3" />
            <div className="au-glow-line" />
            <div className={`au-frame${wide ? " wide" : ""}`} ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
                <div className="au-card">
                    <aside className="au-visual">
                        <div className="au-photo-wrap"><div className="au-photo" style={{ backgroundImage: `url(${img})` }} /></div>
                        <div className="au-shade" />
                        <Link to="/landing" className="au-brand" aria-label="Ir al inicio de StampLab">
                            <img src={logo} alt="StampLab" /> STAMPLAB
                        </Link>
                        <div className="au-chips" aria-hidden="true">
                            {CHIPS.map(c => (
                                <div key={c.cls} className={`au-chip ${c.cls}`}>
                                    <i>{c.icon}</i>
                                    <div><b>{c.value}</b><small>{c.label}</small></div>
                                </div>
                            ))}
                        </div>
                        <div className="au-vtext">
                            <span className="sx-eyebrow">{eyebrow}</span>
                            <p className="au-vtitle">{title}{accent && <><br /><span className="sx-gradient-text">{accent}</span></>}</p>
                            {subtitle && <p className="au-vsub">{subtitle}</p>}
                            <div className="au-dots">{[0, 1, 2].map(i => <span key={i} className={i === step ? "on" : ""} />)}</div>
                        </div>
                    </aside>
                    <section className="au-form au-stagger">{children}</section>
                </div>
            </div>
            <p className="au-trust"><FaShieldAlt size={13} /> Conexión segura · Tus datos están protegidos</p>
        </div>
    );
}

/* ── Pestañas Iniciar sesión / Registrarme ── */
export function AuthTabs({ active }) {
    return (
        <nav className="au-tabs" aria-label="Acceso">
            <span className={`au-pill ${active === "login" ? "l" : "r"}`} />
            <Link to="/login" className={active === "login" ? "on" : ""} aria-current={active === "login" ? "page" : undefined}>Iniciar sesión</Link>
            <Link to="/signup" className={active === "signup" ? "on" : ""} aria-current={active === "signup" ? "page" : undefined}>Registrarme</Link>
        </nav>
    );
}

/* ── Campo con icono, etiqueta flotante y estado visual ── */
export function AuthField({ id, label, icon, type = "text", placeholder, value, onChange, onBlur, disabled, error, valid, required, autoComplete, inputMode, hint, children }) {
    const [focused, setFocused] = useState(false);
    const [show, setShow] = useState(false);
    const isPass = type === "password";
    const ok = !!valid && !error;
    const cls = ["au-field", focused && "is-focus", value && "has-val", error && "is-err", ok && "is-ok", disabled && "is-dis", isPass ? "au-has-r2" : "au-has-r"].filter(Boolean).join(" ");
    return (
        <div className={cls}>
            <div className="au-ctrl">
                <span className="au-ico">{icon}</span>
                <input
                    id={id}
                    className="au-in"
                    type={isPass && show ? "text" : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    aria-invalid={!!error}
                    aria-describedby={typeof error === "string" && error ? `${id}-err` : undefined}
                />
                <label htmlFor={id} className="au-lbl">{label}{required && <b>*</b>}</label>
                <span className="au-state" aria-hidden="true">{error ? <FaExclamation /> : <FaCheck />}</span>
                {isPass && (
                    <button type="button" className="au-eye" tabIndex={-1} onClick={() => setShow(v => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                        {show ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                )}
            </div>
            {typeof error === "string" && error
                ? <p key={error} id={`${id}-err`} className="au-msg err" role="alert"><FaExclamationCircle size={12} />{error}</p>
                : hint ? <p className="au-msg hint">{hint}</p> : null}
            {children}
        </div>
    );
}

/* ── Indicador de fuerza de contraseña (solo visual) ── */
const NIVELES = [
    { t: "Muy débil", c: "#dc2626" },
    { t: "Débil", c: "#ea580c" },
    { t: "Media", c: "#d97706" },
    { t: "Buena", c: "#4f8ef7" },
    { t: "Fuerte", c: "#16a34a" },
];
export function StrengthMeter({ value, detail = false }) {
    if (!value) return null;
    const reqs = [
        { t: "8+ caracteres", ok: value.length >= 8 },
        { t: "Mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(value) },
        { t: "Número", ok: /\d/.test(value) },
        { t: "Símbolo", ok: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(value) },
    ];
    let score = reqs.filter(r => r.ok).length;
    if (value.length < 4) score = 0;
    const n = NIVELES[score];
    return (
        <div className="au-meter" style={{ "--au-m": n.c }} aria-live="polite">
            <div className="au-bars">{[1, 2, 3, 4].map(i => <span key={i} className={score >= i ? "on" : ""} />)}</div>
            <div className="au-mrow"><span>Seguridad de la contraseña</span><b>{n.t}</b></div>
            {detail && (
                <div className="au-reqs">
                    {reqs.map(r => <span key={r.t} className={`au-req${r.ok ? " on" : ""}`}>{r.ok ? <FaCheck /> : <span style={{ width: 9, textAlign: "center" }}>•</span>}{r.t}</span>)}
                </div>
            )}
        </div>
    );
}

/* ── Botón principal con degradado, destello y spinner ── */
export function AuthButton({ loading, loadingText, children }) {
    return (
        <button type="submit" disabled={loading} className="au-cta" aria-busy={loading}>
            <span className="au-cta-in">
                {loading ? <><span className="au-spin" />{loadingText}</> : <>{children}<FaArrowRight className="au-arrow" size={14} /></>}
            </span>
        </button>
    );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════ LOGIN ═══════════════════════════════ */
const LoginLanding = () => {
    const [correo, setCorreo] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [loading, setLoading] = useState(false);
    const [tocado, setTocado] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await loginUsuario({ Correo: correo, Contraseña: contraseña });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("usuario", JSON.stringify({ Nombre: res.data.nombre, Correo: res.data.correo || res.data.Correo, DocumentoID: res.data.DocumentoID || res.data.documentoID, rol: res.data.rol, Telefono: res.data.telefono || "", Direccion: res.data.direccion || "" }));

            if (res.data.rol === 1 || res.data.rol === "1") {
                Swal.fire({ icon: "success", title: "¡Bienvenido Administrador!", text: res.data.nombre, timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
                navigate("/dashboard");
            } else {
                Swal.fire({ icon: "success", title: "¡Bienvenido!", text: res.data.nombre, timer: 1500, showConfirmButton: false, toast: true, position: "top-end" });
                // Cliente: vuelve a la ruta que pedía antes de iniciar sesión (solo rutas internas)
                let destino = "/landing";
                try {
                    const r = sessionStorage.getItem("redirectAfterLogin");
                    sessionStorage.removeItem("redirectAfterLogin");
                    if (r && r.startsWith("/") && !r.startsWith("//")) destino = r;
                } catch { /* sin storage */ }
                navigate(destino);
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

    const correoOk = EMAIL_RE.test(correo);
    const correoErr = tocado && correo && !correoOk ? "Revisa el formato del correo (ej. nombre@correo.com)." : "";

    return (
        <>
            <NavbarComponent />

            <AuthShell img={fondo} step={0} eyebrow="Tu taller de estampados" title="Bienvenido de" accent="vuelta"
                subtitle="Inicia sesión para gestionar tus pedidos y cotizaciones.">
                <AuthTabs active="login" />

                <div className="au-head">
                    <h1 className="au-title">Iniciar Sesión</h1>
                    <p className="au-sub">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleLogin}>
                    <AuthField id="login-correo" label="Correo electrónico" icon={<FaEnvelope />} type="email" autoComplete="email"
                        placeholder="Ingresa tu correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)}
                        onBlur={() => setTocado(true)} disabled={loading} valid={correoOk} error={correoErr} />
                    <AuthField id="login-pass" label="Contraseña" icon={<FaLock />} type="password" autoComplete="current-password"
                        placeholder="Ingresa tu contraseña" value={contraseña} onChange={e => setContraseña(e.target.value)} disabled={loading} />

                    <AuthButton loading={loading} loadingText="Iniciando sesión...">Iniciar Sesión</AuthButton>
                </form>

                <div className="au-links">
                    <p>¿No tienes una cuenta? <Link to="/signup" className="au-link">Registrarme</Link></p>
                    <p>¿Olvidaste tu contraseña? <Link to="/recuperarcontraseña" className="au-link">Recuperar contraseña</Link></p>
                </div>
            </AuthShell>

            <FooterComponent />
        </>
    );
};

export default LoginLanding;
