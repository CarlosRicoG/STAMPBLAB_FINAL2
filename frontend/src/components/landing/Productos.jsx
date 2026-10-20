import { useState, useEffect, useRef } from "react";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";
import Swal from "sweetalert2";
import usePlus from "../../hooks/usePlus";
import {
    FaSearch, FaBoxOpen, FaShoppingCart, FaTrash,
    FaEye, FaEdit, FaTimes, FaPlus, FaMinus,
    FaMotorcycle, FaExchangeAlt, FaCheckCircle, FaBolt, FaChevronRight,
    FaFilter, FaRegSadTear, FaShoppingBag, FaTshirt, FaCloudUploadAlt, FaFilePdf, FaCheck
} from "react-icons/fa";

/* ─── Paleta exacta del proyecto ─── */
const C = {
    navy: "#1a2540",
    accent: "#4f8ef7",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#d97706",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const FONT = "'Outfit', sans-serif";
const PER_PAGE = 8;
const CART_KEY = "cart_productos_landing";

const coloresHex = {
    "Rojo": "#ef4444", "Azul": "#3b82f6", "Verde": "#22c55e", "Amarillo": "#eab308",
    "Negro": "#0f172a", "Blanco": "#f0f0f0", "Rosa": "#ec4899", "Morado": "#a855f7",
    "Naranja": "#f97316", "Gris": "#94a3b8", "Cafe": "#92400e", "Café": "#92400e",
};

/* Swal siempre por encima de los modales */
const swalTop = (opts) => Swal.fire({ ...opts, customClass: { container: "swal-ontop", ...(opts.customClass || {}) } });

const saveCart = (c) => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch { } };
const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } };
const money = (n) => "$" + (Number(n) || 0).toLocaleString("es-CO");

/* ══════════════════════════════════
   CSS (prefijo cat-)
══════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
.cat-page, .cat-page *, .cat-layer, .cat-layer * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
.cat-page { background: linear-gradient(180deg, #f8fafc, #eef2f9 70%); min-height: 100vh; }
.cat-layer button { font-family: 'Outfit', sans-serif; }
.swal-ontop { z-index: 99999 !important; }

/* Hero */
.cat-hero { padding: 50px 24px 54px; text-align: center; }
.cat-hero h1 { font: 900 clamp(1.8rem, 4vw, 2.6rem)/1.1 'Outfit', sans-serif; letter-spacing: -.02em; margin: 8px 0 8px; color: #fff; }
.cat-hero p.cat-lead { color: rgba(255,255,255,.66); font-size: 17px; line-height: 1.65; max-width: 560px; margin: 0 auto 26px; font-size: 15px; }
.cat-hero .sx-eyebrow { color: #8db4ff; }
.cat-search { position: relative; max-width: 440px; margin: 0 auto; padding: 3px 6px; border-radius: 14px; display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(16px) saturate(150%); -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 20px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.2); transition: box-shadow .3s, border-color .3s, transform .3s var(--sx-ease); }
.cat-search.on { border-color: #4f8ef7; box-shadow: 0 20px 60px rgba(0,0,0,.35), 0 0 0 5px rgba(79,142,247,.25); transform: translateY(-2px); }
.cat-search svg.cat-s-ico { margin-left: 14px; color: rgba(255,255,255,.7); flex-shrink: 0; }
.cat-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: #fff; font: 500 14px 'Outfit', sans-serif; padding: 9px 6px; }
.cat-search input::placeholder { color: rgba(255,255,255,.55); }
.cat-search .cat-clear { border: 0; background: rgba(255,255,255,.16); color: #fff; width: 34px; height: 34px; border-radius: 12px; cursor: pointer; display: grid; place-items: center; transition: background .2s; }
.cat-search .cat-clear:hover { background: rgba(255,255,255,.3); }
.cat-stats { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.cat-stat { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; border-radius: 999px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); }
.cat-stat b { color: #fff; font-weight: 800; }

/* Barra de filtros */
.cat-wrap { max-width: 1100px; margin: 0 auto; padding: 30px 24px 70px; }
.cat-filters { margin-top: -62px; position: relative; z-index: 3; background: rgba(255,255,255,.9); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(226,232,240,.9); border-radius: 22px; box-shadow: var(--sx-shadow-2); padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.cat-frow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cat-flabel { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--sx-muted); min-width: 78px; }
.cat-fchip { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--sx-border); background: #fff; font: 700 13px 'Outfit', sans-serif; color: var(--sx-text); cursor: pointer; transition: all .25s var(--sx-ease); }
.cat-fchip:hover { transform: translateY(-2px); border-color: #4f8ef7; color: #3b6fe0; box-shadow: 0 8px 18px rgba(79,142,247,.18); }
.cat-fchip.on { background: var(--sx-grad); color: #fff; border-color: transparent; box-shadow: 0 8px 22px rgba(79,142,247,.4); }
.cat-dot { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.18); flex-shrink: 0; }
.cat-info { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin: 0 2px 22px; font-size: 14px; color: var(--sx-muted); font-weight: 600; }
.cat-info b { color: var(--sx-text); }
.cat-link { background: none; border: 0; color: #3b6fe0; font: 700 13px 'Outfit', sans-serif; cursor: pointer; padding: 4px 2px; }
.cat-link:hover { text-decoration: underline; }

/* Grid y tarjetas */
.cat-grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.cat-card { height: 100%; display: flex; flex-direction: column; border-radius: 22px; }
.cat-media { position: relative; height: 200px; background: radial-gradient(circle at 50% 35%, #fff 0%, #eef2fb 75%); display: grid; place-items: center; cursor: pointer; }
.cat-media img { width: 100%; height: 100%; object-fit: contain; padding: 14px; display: block; }
.cat-empty-img { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8; font-size: 12px; font-weight: 600; }
.cat-badge { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 800; color: #15803d; background: rgba(240,253,244,.92); border: 1px solid #bbf7d0; backdrop-filter: blur(6px); }
.cat-badge i { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 0 rgba(22,163,74,.6); animation: cat-ping 2s infinite; }
.cat-eye { position: absolute; top: 12px; right: 12px; width: 38px; height: 38px; border-radius: 13px; border: 0; background: rgba(255,255,255,.92); color: #1a2540; cursor: pointer; display: grid; place-items: center; box-shadow: 0 6px 16px rgba(15,23,42,.14); opacity: 0; transform: translateY(-6px) scale(.9); transition: all .35s var(--sx-ease); }
.sx-card:hover .cat-eye, .cat-eye:focus-visible { opacity: 1; transform: none; }
.cat-eye:hover { background: #1a2540; color: #fff; }
.cat-body { padding: 13px 14px 14px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.cat-name { margin: 0; font-weight: 800; font-size: 15px; line-height: 1.3; color: var(--sx-text); }
.cat-desc { margin: 0; font-size: 13.5px; color: var(--sx-muted); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cat-sizes { display: flex; flex-wrap: wrap; gap: 5px; }
.cat-size { min-width: 30px; text-align: center; padding: 3px 9px; border-radius: 8px; font-size: 11px; font-weight: 800; color: #3b6fe0; background: #f0f4ff; border: 1px solid #c7d9ff; transition: all .2s; }
.cat-size:hover { background: #4f8ef7; color: #fff; border-color: #4f8ef7; }
.cat-colors { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cat-colors .cat-dot { width: 18px; height: 18px; cursor: default; transition: transform .25s var(--sx-ease), box-shadow .25s; }
.cat-colors .cat-dot:hover { transform: scale(1.35) translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,.25); }
.cat-foot { margin-top: auto; padding-top: 14px; border-top: 1px dashed var(--sx-border); display: flex; flex-direction: column; gap: 12px; }
.cat-price small { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--sx-muted); }
.cat-price strong { font: 900 20px/1.1 'Outfit', sans-serif; background: var(--sx-grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.cat-actions { display: flex; gap: 8px; }
.cat-actions .sx-btn { flex: 1; padding: 9px 12px; font-size: 13px; border-radius: 10px; }
.cat-ghost { flex: 0 0 auto !important; background: #f0f4ff !important; color: #3b6fe0 !important; border: 1.5px solid #c7d9ff !important; box-shadow: none !important; }
.cat-ghost:hover { background: #e0e9ff !important; color: #2b5ccc !important; box-shadow: 0 8px 20px rgba(79,142,247,.2) !important; }

/* Skeleton */
.cat-skel { background: #fff; border: 1px solid var(--sx-border); border-radius: 22px; overflow: hidden; }
.cat-sh { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 600px 100%; animation: cat-shimmer 1.4s infinite linear; border-radius: 8px; }

/* Estado vacío */
.cat-state { text-align: center; padding: 70px 20px; }
.cat-state-ico { width: 104px; height: 104px; border-radius: 32px; margin: 0 auto 22px; display: grid; place-items: center; font-size: 40px; color: #fff; background: var(--sx-grad); box-shadow: 0 18px 44px rgba(79,142,247,.4); animation: sx-bob 4.5s ease-in-out infinite; }
.cat-state h3 { margin: 0 0 8px; font: 900 26px 'Outfit', sans-serif; letter-spacing: -.02em; color: var(--sx-text); }
.cat-state p { margin: 0 0 22px; color: var(--sx-muted); font-size: 15px; }

/* Paginación */
.cat-pager { margin-top: 48px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.cat-more { display: inline-flex; align-items: center; gap: 10px; padding: 14px 30px; border-radius: 16px; border: 2px solid var(--sx-border); background: #fff; color: var(--sx-text); font: 800 14px 'Outfit', sans-serif; cursor: pointer; transition: all .3s var(--sx-ease); box-shadow: var(--sx-shadow-1); }
.cat-more:hover { border-color: #4f8ef7; color: #3b6fe0; transform: translateY(-3px); box-shadow: 0 14px 32px rgba(79,142,247,.22); }
.cat-more span { background: #f0f4ff; color: #3b6fe0; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
.cat-pages { display: flex; gap: 6px; }
.cat-pages button { width: 38px; height: 38px; border-radius: 12px; border: 1.5px solid var(--sx-border); background: #fff; color: var(--sx-muted); font: 800 13px 'Outfit', sans-serif; cursor: pointer; transition: all .2s; }
.cat-pages button:hover { border-color: #4f8ef7; color: #3b6fe0; }
.cat-pages button.on { background: #1a2540; border-color: #1a2540; color: #fff; }

/* Botón flotante carrito */
.cat-fab { position: fixed; bottom: 26px; right: 26px; z-index: 7000; width: 56px; height: 56px; border-radius: 50%; border: 0; cursor: pointer; display: grid; place-items: center; color: #fff;
  background: linear-gradient(90deg,#1a2540,#2d3f6e); box-shadow: 0 8px 28px rgba(26,37,64,.42); transition: transform .3s var(--sx-ease); }
.cat-fab:hover { transform: translateY(-4px) scale(1.06) rotate(-4deg); }
.cat-fab.bump { animation: cat-bump .6s var(--sx-ease); }
.cat-fab-n { position: absolute; top: -8px; right: -8px; min-width: 26px; height: 26px; padding: 0 6px; border-radius: 999px; background: #ef4444; color: #fff; font: 800 12px 'Outfit', sans-serif; display: grid; place-items: center; border: 3px solid #fff; animation: cat-pop .45s var(--sx-ease); }

/* Capas / modales */
.cat-overlay { position: fixed; inset: 0; z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(10,16,30,.62); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); animation: cat-fade .25s ease; }
.cat-modal { position: relative; background: #fff; border-radius: 28px; width: 100%; max-height: 92vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 100px rgba(0,0,0,.45); animation: cat-modal .4s var(--sx-ease); }
.cat-x { position: absolute; top: 14px; right: 14px; z-index: 5; width: 40px; height: 40px; border-radius: 14px; border: 0; cursor: pointer; display: grid; place-items: center; background: rgba(255,255,255,.92); color: #1a2540; box-shadow: 0 6px 18px rgba(0,0,0,.18); transition: transform .3s var(--sx-ease), background .2s; }
.cat-x:hover { transform: rotate(90deg) scale(1.08); background: #1a2540; color: #fff; }
.cat-x.dark { background: rgba(255,255,255,.14); color: #fff; box-shadow: none; }
.cat-x.dark:hover { background: rgba(255,255,255,.3); }

/* Modal producto */
.cat-pm { max-width: 600px; flex-direction: column; border-radius: 20px; }
.cat-pm-gal { flex: 0 0 240px; height: 240px; position: relative; background: radial-gradient(circle at 50% 35%, #fff 0%, #eef2fb 80%); display: grid; place-items: center; overflow: hidden; }
.cat-pm-gal img { width: 100%; height: 100%; object-fit: contain; padding: 18px; transition: transform .9s var(--sx-ease); cursor: zoom-in; }
.cat-pm-gal:hover img { transform: scale(1.12); }
.cat-pm-gal .cat-badge { top: auto; bottom: 12px; left: 12px; }
.cat-pmbar { position: absolute; top: 0; left: 0; right: 0; z-index: 2; padding: 13px 16px; background: linear-gradient(135deg,#0f1824,#1a2540 60%,#2d3f6e); display: flex; justify-content: space-between; align-items: center; color: #fff; font-weight: 800; font-size: 14px; }
.cat-pm-gal .cat-blob { position: absolute; width: 280px; height: 280px; border-radius: 50%; filter: blur(60px); opacity: .35; background: var(--sx-violet); bottom: -80px; left: -60px; pointer-events: none; }
.cat-pm-info { flex: 1; padding: 20px 22px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cat-pm-tag { font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #4f8ef7; }
.cat-pm-info h2 { margin: 0; font: 900 20px/1.2 'Outfit', sans-serif; color: var(--sx-text); }
.cat-pm-price { font: 900 20px/1.2 'Outfit', sans-serif; white-space: nowrap; background: var(--sx-grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
.cat-pm-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px; }
.cat-pm-desc { margin: 0 0 12px; color: var(--sx-muted); font-size: 15px; line-height: 1.65; }
.cat-lbl { margin: 14px 0 10px; font-size: 11px; font-weight: 800; color: var(--sx-muted); text-transform: uppercase; letter-spacing: .12em; }
.cat-lbl span { color: var(--sx-text); text-transform: none; letter-spacing: 0; font-size: 14px; margin-left: 6px; }
.cat-swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.cat-sw { position: relative; width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(0,0,0,.14); cursor: pointer; padding: 0; transition: transform .3s var(--sx-ease), box-shadow .3s; box-shadow: 0 4px 10px rgba(0,0,0,.14); }
.cat-sw::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; border: 2.5px solid transparent; transform: scale(.7); opacity: 0; transition: all .35s var(--sx-ease); }
.cat-sw:hover { transform: scale(1.12); }
.cat-sw.on::after { opacity: 1; transform: scale(1); border-color: #4f8ef7; border-image: none; box-shadow: 0 0 0 3px rgba(79,142,247,.18); }
.cat-sw .cat-check { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.55)); opacity: 0; transform: scale(.4); transition: all .3s var(--sx-ease); }
.cat-sw.on .cat-check { opacity: 1; transform: none; }
.cat-pills { display: flex; flex-wrap: wrap; gap: 9px; }
.cat-pill { min-width: 46px; padding: 7px 16px; border-radius: 999px; border: 2px solid var(--sx-border); background: #fff; color: var(--sx-text); font: 800 14px 'Outfit', sans-serif; cursor: pointer; transition: all .25s var(--sx-ease); }
.cat-pill:hover { border-color: #4f8ef7; transform: translateY(-2px); }
.cat-pill.on { background: var(--sx-grad); color: #fff; border-color: transparent; box-shadow: 0 10px 24px rgba(79,142,247,.4); transform: translateY(-2px) scale(1.05); }
.cat-stock { margin: 14px 0 0; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
.cat-buy { margin-top: 6px; padding-top: 10px; }
.cat-qty-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.cat-qty { display: inline-flex; align-items: center; border: 2px solid var(--sx-border); border-radius: 10px; overflow: hidden; background: #fff; }
.cat-qty button { width: 38px; height: 42px; border: 0; background: #f8fafc; color: var(--sx-text); cursor: pointer; display: grid; place-items: center; transition: background .2s, color .2s; }
.cat-qty button:hover { background: #4f8ef7; color: #fff; }
.cat-qty span { width: 44px; text-align: center; font-weight: 900; font-size: 16px; color: var(--sx-text); }
.cat-total { text-align: right; }
.cat-total small { display: block; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--sx-muted); }
.cat-total strong { font: 900 26px/1.1 'Outfit', sans-serif; color: var(--sx-text); letter-spacing: -.02em; }
.cat-buy .sx-btn { flex: 1; padding: 12px 16px; font-size: 14px; border-radius: 12px; }
.cat-buyrow { display: flex; gap: 10px; align-items: center; }

/* Drawer carrito */
.cat-scrim { position: fixed; inset: 0; background: rgba(10,16,30,.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 8998; transition: opacity .3s; }
.cat-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 95vw; background: #f8fafc; z-index: 8999; display: flex; flex-direction: column; transition: transform .45s var(--sx-ease); box-shadow: -20px 0 60px rgba(0,0,0,.3); }
.cat-dh { padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; color: #fff; position: relative; overflow: hidden; }
.cat-dh .sx-blob { opacity: .4; }
.cat-dh-in { display: flex; align-items: center; gap: 13px; position: relative; z-index: 1; }
.cat-dh-ico { width: 36px; height: 36px; border-radius: 10px; background: var(--sx-grad); display: grid; place-items: center; box-shadow: 0 10px 24px rgba(79,142,247,.5); }
.cat-dh h3 { margin: 0; font: 800 15px 'Outfit', sans-serif; }
.cat-dh small { color: rgba(255,255,255,.6); font-size: 13px; }
.cat-list { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.cat-item { display: flex; gap: 14px; padding: 12px; background: #fff; border: 1px solid var(--sx-border); border-radius: 18px; box-shadow: var(--sx-shadow-1); animation: cat-slide .5s var(--sx-ease) both; animation-delay: calc(var(--i, 0) * 60ms); }
.cat-item-img { width: 66px; height: 66px; border-radius: 14px; background: radial-gradient(circle at 50% 35%, #fff, #eef2fb); overflow: hidden; flex-shrink: 0; display: grid; place-items: center; border: 1px solid var(--sx-border); }
.cat-item-img img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.cat-item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.cat-item-name { margin: 0; font-weight: 800; font-size: 15px; color: var(--sx-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-item-var { display: flex; gap: 6px; flex-wrap: wrap; }
.cat-item-var span { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: #f0f4ff; color: #3b6fe0; border: 1px solid #c7d9ff; }
.cat-item-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.cat-mini-qty { display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 11px; padding: 2px; }
.cat-mini-qty button { width: 28px; height: 28px; border: 0; border-radius: 9px; background: transparent; cursor: pointer; color: var(--sx-text); display: grid; place-items: center; transition: background .2s; }
.cat-mini-qty button:hover { background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.1); }
.cat-mini-qty span { min-width: 26px; text-align: center; font-weight: 800; font-size: 14px; }
.cat-item-price { font-weight: 900; font-size: 16px; color: var(--sx-text); }
.cat-item-btns { display: flex; gap: 5px; }
.cat-ib { width: 28px; height: 28px; border-radius: 9px; border: 0; cursor: pointer; display: grid; place-items: center; transition: transform .2s var(--sx-ease); }
.cat-ib:hover { transform: scale(1.15); }
.cat-ib.edit { background: #f0f4ff; color: #4f8ef7; } .cat-ib.del { background: #fef2f2; color: #dc2626; }
.cat-dfoot { padding: 18px 20px 20px; background: #fff; border-top: 1px solid var(--sx-border); box-shadow: 0 -12px 30px rgba(15,23,42,.06); }
.cat-sum { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--sx-muted); font-weight: 600; margin-bottom: 6px; }
.cat-sum.big { color: var(--sx-text); font-weight: 800; font-size: 16px; margin: 10px 0 16px; padding-top: 12px; border-top: 1px dashed var(--sx-border); }
.cat-sum.big strong { font: 900 20px 'Outfit', sans-serif; letter-spacing: -.03em; }
.cat-dfoot .sx-btn { width: 100%; padding: 13px; font-size: 14px; border-radius: 12px; animation: sx-pulse 2.4s infinite; }
.cat-secure { text-align: center; margin: 12px 0 0; font-size: 12px; color: var(--sx-muted); }

/* Pago */
.cat-pay { max-width: 500px; border-radius: 20px; }
.cat-ph { padding: 17px 22px; color: #fff; position: relative; overflow: hidden; flex-shrink: 0; }
.cat-ph h3 { margin: 0; font: 800 16px 'Outfit', sans-serif; position: relative; z-index: 1; }
.cat-ph p { margin: 0; font-size: 12px; color: rgba(255,255,255,.65); position: relative; z-index: 1; }
.cat-ph p strong { color: #fbbf24; }
.cat-steps { display: flex; align-items: center; margin-top: 18px; position: relative; z-index: 1; }
.cat-step { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.5); white-space: nowrap; }
.cat-step b { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; background: rgba(255,255,255,.12); border: 1.5px solid rgba(255,255,255,.25); transition: all .4s var(--sx-ease); }
.cat-step.on { color: #fff; } .cat-step.on b { background: var(--sx-grad); border-color: transparent; box-shadow: 0 6px 18px rgba(79,142,247,.6); transform: scale(1.1); }
.cat-step.done { color: rgba(255,255,255,.85); } .cat-step.done b { background: #16a34a; border-color: transparent; }
.cat-step-line { flex: 1; height: 2px; margin: 0 10px; background: rgba(255,255,255,.18); border-radius: 2px; min-width: 14px; }
.cat-pb { overflow-y: auto; padding: 18px 22px; flex: 1; }
.cat-sumbox { background: #f8fafc; border: 1px solid var(--sx-border); border-radius: 18px; padding: 16px 18px; margin-bottom: 22px; }
.cat-sumrow { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; font-size: 14px; color: var(--sx-text); }
.cat-sumrow em { font-style: normal; color: var(--sx-muted); font-size: 12px; }
.cat-sumrow b { white-space: nowrap; }
.cat-sumtot { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 12px; font-weight: 800; }
.cat-sumtot strong { font: 900 22px 'Outfit', sans-serif; background: var(--sx-grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.cat-methods { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.cat-method { position: relative; text-align: left; padding: 12px 44px 12px 12px; border-radius: 12px; border: 2px solid var(--sx-border); background: #f8fafc; cursor: pointer; transition: all .35s var(--sx-ease); display: grid; grid-template-columns: 40px 1fr; column-gap: 12px; align-items: center; }
.cat-method:hover { transform: translateY(-4px); border-color: #a5c2fb; box-shadow: 0 14px 30px rgba(79,142,247,.16); }
.cat-method.on { border-color: #4f8ef7; background: linear-gradient(160deg, #f0f4ff, #f5f0ff); box-shadow: 0 14px 34px rgba(79,142,247,.28); }
.cat-m-ico { grid-row: 1 / 3; width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; font-size: 16px; background: #eef2f7; color: var(--sx-muted); transition: all .35s var(--sx-ease); }
.cat-method.on .cat-m-ico { background: var(--sx-grad); color: #fff; box-shadow: 0 10px 22px rgba(79,142,247,.4); transform: rotate(-6deg) scale(1.08); }
.cat-method strong { font-size: 13px; color: var(--sx-text); font-weight: 800; }
.cat-method span.d { font-size: 11px; color: var(--sx-muted); line-height: 1.4; }
.cat-m-ck { position: absolute; top: 50%; margin-top: -12px; right: 12px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: #4f8ef7; color: #fff; font-size: 11px; opacity: 0; transform: scale(.3); transition: all .35s var(--sx-ease); }
.cat-method.on .cat-m-ck { opacity: 1; transform: none; }
.cat-sec { animation: cat-down .35s var(--sx-ease); }
.cat-field { margin-bottom: 14px; }
.cat-field label { display: block; font-size: 11px; font-weight: 800; color: var(--sx-muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
.cat-input { width: 100%; padding: 10px 13px; border: 2px solid var(--sx-border); border-radius: 10px; font: 500 14px 'Outfit', sans-serif; color: var(--sx-text); outline: none; background: #fff; transition: border-color .2s, box-shadow .2s; }
.cat-input:focus { border-color: #4f8ef7; box-shadow: 0 0 0 4px rgba(79,142,247,.16); }
.cat-input.err { border-color: #dc2626; }
.cat-err { margin: 5px 0 0; font-size: 12px; color: #dc2626; font-weight: 700; }
.cat-drop { border: 2px dashed #a5c2fb; border-radius: 18px; padding: 24px 16px; text-align: center; cursor: pointer; background: #f0f4ff; transition: all .3s var(--sx-ease); }
.cat-drop:hover { transform: translateY(-2px); background: #e6eeff; border-color: #4f8ef7; }
.cat-drop.err { border-color: #dc2626; background: #fef2f2; } .cat-drop.ok { border-color: #16a34a; background: #f0fdf4; }
.cat-drop-ico { width: 54px; height: 54px; border-radius: 17px; margin: 0 auto 10px; display: grid; place-items: center; font-size: 22px; color: #fff; background: var(--sx-grad); box-shadow: 0 10px 24px rgba(79,142,247,.35); }
.cat-pf { padding: 16px 26px 20px; border-top: 1px solid var(--sx-border); flex-shrink: 0; background: #fff; }
.cat-pf .sx-btn { width: 100%; padding: 13px; font-size: 14px; border-radius: 12px; }
.cat-pf .sx-btn:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; transform: none; }
.cat-pf .sx-btn:disabled::after { display: none; }
.cat-spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: sx-spin .8s linear infinite; }

/* Éxito */
.cat-ok { max-width: 420px; padding: 40px 32px 32px; text-align: center; }
.cat-ok-ico { width: 92px; height: 92px; border-radius: 50%; margin: 0 auto 18px; display: grid; place-items: center; font-size: 44px; color: #fff; background: linear-gradient(135deg, #16a34a, #22c55e); box-shadow: 0 0 0 10px rgba(22,163,74,.12), 0 18px 40px rgba(22,163,74,.4); animation: cat-pop .6s var(--sx-ease); }
.cat-ok h2 { margin: 0 0 8px; font: 900 28px 'Outfit', sans-serif; letter-spacing: -.03em; color: var(--sx-text); }
.cat-ok p { margin: 0 0 18px; color: var(--sx-muted); font-size: 15px; line-height: 1.6; }
.cat-ok-n { display: inline-block; margin-bottom: 22px; padding: 12px 26px; border-radius: 16px; background: var(--sx-grad-soft); border: 1.5px solid rgba(79,142,247,.3); }
.cat-ok-n small { display: block; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--sx-muted); }
.cat-ok-n b { font: 900 32px 'Outfit', sans-serif; color: #4f8ef7; }
.cat-ok .sx-btn { width: 100%; }

/* Animaciones */
@keyframes cat-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
@keyframes cat-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cat-modal { from { opacity: 0; transform: translateY(40px) scale(.94); } to { opacity: 1; transform: none; } }
@keyframes cat-slide { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes cat-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
@keyframes cat-pop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
@keyframes cat-bump { 0% { transform: scale(1); } 30% { transform: scale(1.25) rotate(-8deg); } 60% { transform: scale(.92); } 100% { transform: scale(1); } }
@keyframes cat-ping { 70% { box-shadow: 0 0 0 7px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }

@media (max-width: 860px) {
  .cat-pm { flex-direction: column; overflow-y: auto; }
  .cat-pm-gal { flex: 0 0 auto; min-height: 0; height: 280px; }
  .cat-pm-gal img { padding: 18px; }
  .cat-pm-info { overflow: visible; padding: 24px 22px 24px; }
  .cat-pm-info h2 { font-size: 24px; }
}
@media (max-width: 640px) {
  .cat-hero { padding: 56px 18px 104px; }
  .cat-wrap { padding: 0 14px 80px; }
  .cat-filters { padding: 14px; border-radius: 18px; }
  .cat-flabel { min-width: 100%; }
  .cat-frow { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
  .cat-frow::-webkit-scrollbar { display: none; }
  .cat-fchip { flex-shrink: 0; }
  .cat-frow .cat-flabel { min-width: auto; }
  .cat-grid { grid-template-columns: 1fr; gap: 20px; }
  .cat-overlay { padding: 10px; }
  .cat-methods { grid-template-columns: 1fr; }
  .cat-pb { padding: 18px; } .cat-ph { padding: 20px 18px; } .cat-pf { padding: 14px 18px 18px; }
  .cat-step span { display: none; } .cat-step.on span { display: inline; }
  .cat-fab { bottom: 18px; right: 18px; width: 60px; height: 60px; }
  .cat-eye { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cat-page *, .cat-layer *, .cat-fab, .cat-fab-n { animation: none !important; transition-duration: .01ms !important; }
}
`;

/* ══════════════════════════════════
   MODAL PRODUCTO (ver + agregar/editar)
══════════════════════════════════ */
const ProductModal = ({ product, open, onClose, tallas, onAddToCart, initColor = "", initTalla = "", initQty = 1, editMode = false }) => {
    const [color, setColor] = useState(initColor);
    const [talla, setTalla] = useState(initTalla);
    const [qty, setQty] = useState(initQty);

    useEffect(() => { if (open) { setColor(initColor); setTalla(initTalla); setQty(initQty); } }, [open, product]);
    if (!open || !product) return null;

    const vars = product.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
    const coloresDisp = [...new Set(vars.map(i => i.color?.Nombre).filter(Boolean))];
    const tallasDisp = [...new Set(vars.filter(i => !color || i.color?.Nombre === color).map(i => i.talla?.Nombre).filter(Boolean))];
    const stock = (() => {
        if (!color && !talla) return 999;
        const v = vars.find(i => (!color || i.color?.Nombre === color) && (!talla || i.talla?.Nombre === talla));
        return v?.Stock || 0;
    })();
    const precio = (() => {
        const base = parseFloat(product.PrecioBase) || 0;
        const t = tallas.find(t => t.Nombre === talla);
        return base + (parseFloat(t?.Precio) || 0);
    })();

    const handleAdd = () => {
        if (coloresDisp.length > 0 && !color) { swalTop({ icon: "warning", title: "Selecciona un color", timer: 1400, showConfirmButton: false }); return; }
        if (tallasDisp.length > 0 && !talla) { swalTop({ icon: "warning", title: "Selecciona una talla", timer: 1400, showConfirmButton: false }); return; }
        if (qty > stock) { swalTop({ icon: "warning", title: `Solo hay ${stock} en stock`, timer: 1600, showConfirmButton: false }); return; }
        onAddToCart({ producto: product, color, talla, cantidad: qty, precio });
        onClose();
    };

    return (
        <div className="cat-layer cat-overlay" onClick={onClose}>
            <div className="cat-modal cat-pm" onClick={e => e.stopPropagation()}>
                {/* Galería */}
                <div className="cat-pm-gal">
                    <div className="cat-pmbar"><span>{editMode ? "Editar ítem del carrito" : "Detalle del producto"}</span><button className="cat-x dark" style={{ position: "static", width: 30, height: 30, borderRadius: 8 }} onClick={onClose} aria-label="Cerrar"><FaTimes size={12} /></button></div>
                    {product.ImagenProducto
                        ? <img src={product.ImagenProducto} alt={product.Nombre} onError={e => e.target.style.display = "none"} />
                        : <div className="cat-empty-img"><FaBoxOpen size={64} style={{ opacity: .35 }} />Sin imagen</div>}
                    <span className="cat-badge"><i /> Disponible</span>
                </div>

                {/* Info */}
                <div className="cat-pm-info">
                    <div className="cat-pm-head"><h2>{product.Nombre}</h2><span className="cat-pm-price">{money(precio)}</span></div>
                    {product.Descripcion && <p className="cat-pm-desc">{product.Descripcion}</p>}

                    {coloresDisp.length > 0 && (
                        <div>
                            <p className="cat-lbl">Color<span>{color || "—"}</span></p>
                            <div className="cat-swatches">
                                {coloresDisp.map(c => (
                                    <button key={c} onClick={() => { setColor(c); setTalla(""); }} title={c} aria-label={c}
                                        className={`cat-sw ${color === c ? "on" : ""}`} style={{ background: coloresHex[c] || "#ccc" }}>
                                        <span className="cat-check" style={c === "Blanco" ? { color: "#1a2540", filter: "none" } : undefined}><FaCheck /></span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tallasDisp.length > 0 && (
                        <div>
                            <p className="cat-lbl">Talla<span>{talla || "—"}</span></p>
                            <div className="cat-pills">
                                {tallasDisp.map(t => (
                                    <button key={t} onClick={() => setTalla(t)} className={`cat-pill ${talla === t ? "on" : ""}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {color && talla && (
                        <p className="cat-stock" style={{ color: stock > 5 ? C.success : stock > 0 ? C.warning : C.danger }}>
                            {stock > 5 ? `✓ ${stock} disponibles` : stock > 0 ? `⚠ Solo ${stock} en stock` : "✗ Sin stock para esta combinación"}
                        </p>
                    )}

                    <div className="cat-buy">
                        <div className="cat-buyrow">
                            <div className="cat-qty">
                                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos"><FaMinus size={12} /></button>
                                <span>{qty}</span>
                                <button onClick={() => setQty(Math.min(stock || 99, qty + 1))} aria-label="Más"><FaPlus size={12} /></button>
                            </div>
                            <button className="sx-btn sx-btn-dark" onClick={handleAdd}>
                                <FaShoppingCart size={13} /> {editMode ? "Actualizar ítem" : "Agregar al carrito"}
                            </button>
                        </div>
                        <p className="cat-total" style={{ margin: "8px 0 0" }}><small style={{ display: "inline" }}>Total: </small><strong style={{ fontSize: 16 }}>{money(precio * qty)}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   CARRITO DRAWER
══════════════════════════════════ */
const CartDrawer = ({ open, onClose, cart, onRemove, onUpdateQty, onEdit, onCheckout }) => {
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const nItems = cart.reduce((s, i) => s + i.cantidad, 0);
    return (
        <div className="cat-layer">
            <div className="cat-scrim" onClick={onClose} style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} />
            <aside className="cat-drawer" style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}>
                <div className="cat-dh sx-hero-bg">
                    <span className="sx-blob b1" style={{ width: 200, height: 200 }} />
                    <div className="cat-dh-in">
                        <div className="cat-dh-ico"><FaShoppingBag size={20} color="#fff" /></div>
                        <div>
                            <h3>Mi carrito</h3>
                            <small>{nItems} {nItems === 1 ? "ítem" : "ítems"}</small>
                        </div>
                    </div>
                    <button className="cat-x dark" style={{ position: "relative", top: 0, right: 0 }} onClick={onClose} aria-label="Cerrar carrito"><FaTimes size={14} /></button>
                </div>

                <div className="cat-list">
                    {cart.length === 0 ? (
                        <div className="cat-state" style={{ padding: "50px 10px" }}>
                            <div className="cat-state-ico" style={{ width: 88, height: 88, fontSize: 34, borderRadius: 28 }}><FaShoppingCart /></div>
                            <h3 style={{ fontSize: 22 }}>Tu carrito está vacío</h3>
                            <p>Agrega productos para comenzar</p>
                            <button className="sx-btn sx-btn-sm" onClick={onClose}><FaTshirt /> Explorar catálogo</button>
                        </div>
                    ) : cart.map((item, idx) => (
                        <div key={idx} className="cat-item" style={{ "--i": idx }}>
                            <div className="cat-item-img">
                                {item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <FaBoxOpen size={22} color={C.muted} />}
                            </div>
                            <div className="cat-item-main">
                                <p className="cat-item-name">{item.nombre}</p>
                                <div className="cat-item-var">
                                    {item.color && <span><i className="cat-dot" style={{ width: 10, height: 10, background: coloresHex[item.color] || "#ccc" }} />{item.color}</span>}
                                    {item.talla && <span>Talla {item.talla}</span>}
                                    {!item.color && !item.talla && <span>Sin variante</span>}
                                </div>
                                <div className="cat-item-row">
                                    <div className="cat-mini-qty">
                                        <button onClick={() => onUpdateQty(idx, item.cantidad - 1)} aria-label="Menos"><FaMinus size={9} /></button>
                                        <span>{item.cantidad}</span>
                                        <button onClick={() => onUpdateQty(idx, item.cantidad + 1)} aria-label="Más"><FaPlus size={9} /></button>
                                    </div>
                                    <div className="cat-item-btns">
                                        <button className="cat-ib edit" onClick={() => onEdit(idx)} title="Editar"><FaEdit size={12} /></button>
                                        <button className="cat-ib del" onClick={() => onRemove(idx)} title="Eliminar"><FaTrash size={12} /></button>
                                    </div>
                                </div>
                                <span className="cat-item-price">{money(item.precio * item.cantidad)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {cart.length > 0 && (
                    <div className="cat-dfoot">
                        <div className="cat-sum"><span>Subtotal ({nItems} ítems)</span><span>{money(total)}</span></div>
                        <div className="cat-sum"><span>Envío</span><span>Se coordina al finalizar</span></div>
                        <div className="cat-sum big"><span>Total</span><strong>{money(total)}</strong></div>
                        <button className="sx-btn" onClick={onCheckout}>
                            <FaBolt size={14} /> Comprar ahora <FaChevronRight size={12} />
                        </button>
                        <p className="cat-secure">Pago seguro · Transferencia o contra entrega</p>
                    </div>
                )}
            </aside>
        </div>
    );
};

/* ══════════════════════════════════
   MODAL PAGO
══════════════════════════════════ */
const PaymentModal = ({ open, onClose, cart, onSuccess }) => {
    const [method, setMethod] = useState("");
    const [comprobanteFile, setComprobanteFile] = useState(null);
    const [comprobantePreview, setComprobantePreview] = useState(null);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const enviandoRef = useRef(false); // seguro contra doble clic
    const fileInputRef = useRef(null);
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

    // ✅ Autocompletar con datos del usuario al abrir
    useEffect(() => {
        if (open) {
            setMethod("");
            setComprobanteFile(null);
            setComprobantePreview(null);
            setFecha("");
            setErrors({});
            setDireccion("");

            // Cargar nombre y teléfono del usuario logueado
            try {
                const raw = localStorage.getItem("usuario");
                const u = raw ? JSON.parse(raw) : null;
                setNombre(u?.nombre || u?.Nombre || "");
                setTelefono(u?.telefono || u?.Telefono || "");
            } catch {
                setNombre("");
                setTelefono("");
            }
        }
    }, [open]);

    if (!open) return null;

    // ✅ Solo imágenes y PDF
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
        if (!allowed.includes(file.type)) {
            swalTop({
                icon: "warning",
                title: "Archivo no permitido",
                text: "Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF.",
                timer: 2500,
                showConfirmButton: false
            });
            e.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            swalTop({ icon: "warning", title: "Archivo muy grande", text: "El archivo no puede superar 5MB.", timer: 2000, showConfirmButton: false });
            e.target.value = "";
            return;
        }

        setComprobanteFile(file);
        if (file.type === "application/pdf") {
            setComprobantePreview("pdf");
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => setComprobantePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const toBase64 = (file) => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });

    // ✅ Validaciones
    const validate = () => {
        const newErrors = {};
        if (method === "transferencia") {
            if (!comprobanteFile) newErrors.comprobante = "Debes subir el comprobante de pago";
        }
        if (method === "contraentrega") {
            if (!nombre.trim()) {
                newErrors.nombre = "El nombre es obligatorio";
            } else if (/\d/.test(nombre)) {
                newErrors.nombre = "El nombre no puede contener números";
            }
            if (!telefono.trim()) {
                newErrors.telefono = "El teléfono es obligatorio";
            } else if (!/^\d+$/.test(telefono.replace(/[\s\-]/g, ""))) {
                newErrors.telefono = "El teléfono solo puede contener números";
            }
            if (!direccion.trim()) newErrors.direccion = "La dirección es obligatoria";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!method) {
            swalTop({ icon: "warning", title: "Selecciona un método de pago", timer: 1500, showConfirmButton: false });
            return;
        }
        if (!validate()) return;

        const raw = localStorage.getItem("usuario");
        const usuarioLocal = raw ? JSON.parse(raw) : null;
        const docID = usuarioLocal?.documentoID || usuarioLocal?.DocumentoID;

        if (!docID) {
            swalTop({ icon: "error", title: "Sesión no encontrada", text: "Por favor inicia sesión nuevamente.", confirmButtonColor: C.navy });
            return;
        }

        if (enviandoRef.current) return;
        enviandoRef.current = true;
        setLoading(true);
        try {
            let comprobanteBase64 = null;
            if (comprobanteFile) comprobanteBase64 = await toBase64(comprobanteFile);

            const detalles = cart.map(item => ({
                ProductoID: item.producto.ProductoID,
                Cantidad: item.cantidad,
                PrecioUnitario: item.precio,
                ColorID: item.producto.inventario?.find(i => i.color?.Nombre === item.color && i.talla?.Nombre === item.talla)?.ColorID || null,
                TallaID: item.producto.inventario?.find(i => i.color?.Nombre === item.color && i.talla?.Nombre === item.talla)?.TallaID || null,
            }));

            const payload = {
                DocumentoID: docID,
                Subtotal: total,
                Total: total,
                detalles,
                metodoPago: method,
                ...(method === "transferencia" ? {
                    comprobanteTransferencia: comprobanteBase64 || comprobanteFile?.name,
                    fechaTransferencia: fecha || new Date().toISOString()
                } : {}),
                ...(method === "contraentrega" ? {
                    nombreReceptor: nombre,
                    telefonoEntrega: telefono,
                    direccionEntrega: direccion
                } : {}),
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "Error al procesar");
            onSuccess(data.venta?.VentaID);
        } catch (err) {
            swalTop({ icon: "error", title: "Error al procesar", text: err.message, confirmButtonColor: C.accent });
        } finally {
            enviandoRef.current = false;
            setLoading(false);
        }
    };

    const methods = [
        { id: "transferencia", icon: <FaExchangeAlt />, label: "Transferencia bancaria", desc: "Sube foto o PDF de tu comprobante" },
        { id: "contraentrega", icon: <FaMotorcycle />, label: "Contra entrega", desc: "Paga al recibir tu pedido" },
    ];

    const ErrorMsg = ({ field }) => errors[field]
        ? <p className="cat-err">⚠ {errors[field]}</p>
        : null;

    const stepCls = (n) => {
        const cur = method ? 3 : 2;
        return n < cur ? "done" : n === cur ? "on" : "";
    };

    return (
        <div className="cat-layer cat-overlay" onClick={onClose}>
            <div className="cat-modal cat-pay" onClick={e => e.stopPropagation()}>

                <div className="cat-ph sx-hero-bg">
                    <span className="sx-blob b1" style={{ width: 240, height: 240 }} />
                    <span className="sx-blob b2" style={{ width: 200, height: 200 }} />
                    <button className="cat-x dark" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
                    <h3>Finalizar compra</h3>
                    <p>Total: <strong>{money(total)}</strong></p>
                </div>

                <div className="cat-pb">
                    <div className="cat-sumbox">
                        <p className="cat-lbl" style={{ margin: "0 0 8px" }}>Resumen del pedido</p>
                        {cart.map((item, i) => (
                            <div key={i} className="cat-sumrow">
                                <span>
                                    {item.nombre} × {item.cantidad}
                                    {(item.color || item.talla) && <em> ({[item.color, item.talla].filter(Boolean).join("/")})</em>}
                                </span>
                                <b>{money(item.precio * item.cantidad)}</b>
                            </div>
                        ))}
                        <div className="cat-sumtot"><span>Total</span><strong>{money(total)}</strong></div>
                    </div>

                    <p className="cat-lbl" style={{ margin: "0 0 10px" }}>Método de pago</p>
                    <div className="cat-methods">
                        {methods.map(m => (
                            <div key={m.id} role="button" tabIndex={0}
                                className={`cat-method ${method === m.id ? "on" : ""}`}
                                onClick={() => { setMethod(m.id); setErrors({}); }}
                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setMethod(m.id); setErrors({}); } }}>
                                <span className="cat-m-ck"><FaCheck /></span>
                                <div className="cat-m-ico">{m.icon}</div>
                                <strong>{m.label}</strong>
                                <span className="d">{m.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── TRANSFERENCIA ── */}
                    {method === "transferencia" && (
                        <div className="cat-sec">
                            <p className="cat-lbl" style={{ margin: "0 0 8px" }}>Comprobante de pago *</p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`cat-drop ${errors.comprobante ? "err" : comprobanteFile ? "ok" : ""}`}
                            >
                                {comprobanteFile ? (
                                    comprobantePreview === "pdf" ? (
                                        <div>
                                            <div className="cat-drop-ico" style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}><FaFilePdf /></div>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.success }}>{comprobanteFile.name}</p>
                                            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>PDF cargado · {(comprobanteFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <img src={comprobantePreview} alt="comprobante" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 12, objectFit: "contain", marginBottom: 8 }} />
                                            <p style={{ margin: 0, fontSize: 13, color: C.success, fontWeight: 800 }}>✓ {comprobanteFile.name}</p>
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <div className="cat-drop-ico"><FaCloudUploadAlt /></div>
                                        <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: errors.comprobante ? C.danger : "#3b6fe0" }}>Haz clic para subir</p>
                                        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Solo JPG, PNG, WEBP o PDF · Máx. 5MB</p>
                                    </div>
                                )}
                            </div>
                            <ErrorMsg field="comprobante" />

                            {comprobanteFile && (
                                <button onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    style={{ background: "#fef2f2", border: "1px solid #fecaca", color: C.danger, borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
                                    ✕ Cambiar archivo
                                </button>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />

                            <div className="cat-field" style={{ marginTop: 14 }}>
                                <label>Fecha de transferencia (opcional)</label>
                                <input type="date" className="cat-input" value={fecha} onChange={e => setFecha(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* ── CONTRAENTREGA ── */}
                    {method === "contraentrega" && (
                        <div className="cat-sec">
                            <div className="cat-field">
                                <label>Nombre del receptor *</label>
                                <input
                                    type="text"
                                    className={`cat-input ${errors.nombre ? "err" : ""}`}
                                    placeholder="Nombre completo"
                                    value={nombre}
                                    onChange={e => {
                                        // ✅ No permite números
                                        const val = e.target.value.replace(/[0-9]/g, "");
                                        setNombre(val);
                                        if (errors.nombre) setErrors(prev => ({ ...prev, nombre: "" }));
                                    }}
                                />
                                <ErrorMsg field="nombre" />
                            </div>

                            <div className="cat-field">
                                <label>Teléfono de entrega *</label>
                                <input
                                    type="tel"
                                    className={`cat-input ${errors.telefono ? "err" : ""}`}
                                    placeholder="Ej: 300 123 4567"
                                    value={telefono}
                                    onChange={e => {
                                        // ✅ Solo números, espacios y guiones
                                        const val = e.target.value.replace(/[^0-9\s\-]/g, "");
                                        setTelefono(val);
                                        if (errors.telefono) setErrors(prev => ({ ...prev, telefono: "" }));
                                    }}
                                />
                                <ErrorMsg field="telefono" />
                            </div>

                            <div className="cat-field">
                                <label>Dirección de entrega *</label>
                                <input
                                    type="text"
                                    className={`cat-input ${errors.direccion ? "err" : ""}`}
                                    placeholder="Calle, barrio, ciudad..."
                                    value={direccion}
                                    onChange={e => {
                                        setDireccion(e.target.value);
                                        if (errors.direccion) setErrors(prev => ({ ...prev, direccion: "" }));
                                    }}
                                />
                                <ErrorMsg field="direccion" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="cat-pf">
                    <button className="sx-btn sx-btn-dark" onClick={handleSubmit} disabled={loading || !method}>
                        {loading
                            ? <><span className="cat-spin" /> Procesando...</>
                            : <><FaCheckCircle size={16} /> Confirmar pedido</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
const ProductosLanding = () => {
    usePlus();
    const [search, setSearch] = useState("");
    const [productos, setProductos] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    const [page, setPage] = useState(1);
    const [filtroColor, setFiltroColor] = useState("");
    const [filtroTalla, setFiltroTalla] = useState("");
    const [cart, setCart] = useState(() => loadCart());
    const [cartOpen, setCartOpen] = useState(false);
    const [cartBounce, setCartBounce] = useState(false);
    const [productModal, setProductModal] = useState({ open: false, product: null, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { saveCart(cart); }, [cart]);
    useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [pRes, tRes] = await Promise.all([getProductos(), getTallas()]);
            const data = pRes.datos || pRes;
            setProductos(data.filter(p => p.inventario?.some(i => i.Stock > 0 && i.Estado)));
            setTallas(tRes.datos || tRes);
        } catch (e) { console.error(e); }
        finally { setCargando(false); }
    };

    const obtenerPrecio = (p) => {
        const base = parseFloat(p.PrecioBase) || 0;
        const vars = p.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
        if (!vars.length) return base;
        const ids = [...new Set(vars.map(i => i.TallaID))].sort((a, b) => a - b);
        const tMin = tallas.find(t => t.TallaID === ids[0]);
        return base + (parseFloat(tMin?.Precio) || 0);
    };
    const obtenerColores = (p) => [...new Set(p.inventario?.filter(i => i.Stock > 0 && i.Estado).map(i => i.color?.Nombre).filter(Boolean))];
    const obtenerTallas = (p) => [...new Set(p.inventario?.filter(i => i.Stock > 0 && i.Estado).map(i => i.talla?.Nombre).filter(Boolean))];

    /* Abrir modal producto normal o edición de carrito */
    const openProductModal = (p, editIdx = null) => {
        if (editIdx !== null) {
            const item = cart[editIdx];
            setProductModal({ open: true, product: item.producto, editIdx, initColor: item.color, initTalla: item.talla, initQty: item.cantidad });
        } else {
            setProductModal({ open: true, product: p, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
        }
    };
    const closeProductModal = () => setProductModal(m => ({ ...m, open: false }));

    /* Agregar / editar en carrito */
    const handleAddToCart = ({ producto, color, talla, cantidad, precio }) => {
        const raw = localStorage.getItem("usuario");
        if (!raw) {
            saveCart(cart); // Guardar antes de redirigir
            swalTop({
                icon: "warning", title: "Inicia sesión para comprar",
                text: "Tu carrito está guardado, no perderás nada.",
                confirmButtonText: "Iniciar sesión", cancelButtonText: "Cancelar",
                showCancelButton: true, confirmButtonColor: C.navy
            }).then(r => { if (r.isConfirmed) navigate("/login"); });
            return;
        }
        const { editIdx } = productModal;
        setCart(prev => {
            let updated;
            if (editIdx !== null) {
                updated = prev.map((item, i) => i === editIdx ? { ...item, color, talla, cantidad, precio } : item);
            } else {
                const ex = prev.findIndex(i => i.producto.ProductoID === producto.ProductoID && i.color === color && i.talla === talla);
                if (ex >= 0) {
                    updated = prev.map((item, i) => i === ex ? { ...item, cantidad: item.cantidad + cantidad } : item);
                } else {
                    updated = [...prev, { producto, nombre: producto.Nombre, imagen: producto.ImagenProducto, color, talla, cantidad, precio }];
                }
            }
            saveCart(updated);
            return updated;
        });
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 700);
        swalTop({ icon: "success", title: editIdx !== null ? "Ítem actualizado" : `¡${producto.Nombre} agregado!`, timer: 1400, showConfirmButton: false, position: "top-end", toast: true });
    };

    const handleRemove = (idx) => setCart(prev => { const u = prev.filter((_, i) => i !== idx); saveCart(u); return u; });
    const handleUpdateQty = (idx, qty) => {
        if (qty < 1) { handleRemove(idx); return; }
        setCart(prev => { const u = prev.map((item, i) => i === idx ? { ...item, cantidad: qty } : item); saveCart(u); return u; });
    };

    /* Checkout */
    const handleCheckout = () => {
        const raw = localStorage.getItem("usuario");
        if (!raw) {
            saveCart(cart);
            swalTop({
                icon: "warning", title: "Inicia sesión para continuar",
                text: "Tu carrito está guardado, no perderás nada.",
                confirmButtonText: "Iniciar sesión", cancelButtonText: "Cancelar",
                showCancelButton: true, confirmButtonColor: C.navy
            }).then(r => { if (r.isConfirmed) navigate("/login"); });
            return;
        }

        // Verificar que tenga documentoID válido
        const usuarioLocal = JSON.parse(raw);
        const docID = usuarioLocal?.documentoID || usuarioLocal?.DocumentoID;
        if (!docID || isNaN(Number(docID))) {
            swalTop({
                icon: "warning", title: "Sesión inválida",
                text: "Por favor cierra sesión e inicia nuevamente.",
                confirmButtonColor: C.navy
            });
            return;
        }

        setCartOpen(false);
        setTimeout(() => setPaymentOpen(true), 220);
    };

    const handlePaymentSuccess = (ventaId) => {
        setPaymentOpen(false);
        setCart([]);
        localStorage.removeItem(CART_KEY);
        setOrderSuccess(ventaId);
    };

    const usuario = (() => { try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; } })();

    /* Opciones de filtro derivadas de los datos (solo vista) */
    const todosColores = [...new Set(productos.flatMap(obtenerColores))];
    const todasTallas = [...new Set(productos.flatMap(obtenerTallas))];
    const hayFiltros = !!(search || filtroColor || filtroTalla);
    const limpiar = () => { setSearch(""); setFiltroColor(""); setFiltroTalla(""); setPage(1); };

    const filtered = productos.filter(p =>
        p.Nombre.toLowerCase().includes(search.toLowerCase()) &&
        (!filtroColor || obtenerColores(p).includes(filtroColor)) &&
        (!filtroTalla || obtenerTallas(p).includes(filtroTalla))
    );
    const totalPgs = Math.ceil(filtered.length / PER_PAGE);
    const pageProds = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const cartTotal = cart.reduce((s, i) => s + i.cantidad, 0);

    return (
        <>
            <style>{CSS}</style>

            <NavbarComponent />

            {/* Botón flotante carrito */}
            <button className={`cat-fab ${cartBounce ? "bump" : ""} ${cartTotal > 0 ? "sx-pulse" : ""}`} onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
                <FaShoppingCart size={20} />
                {cartTotal > 0 && <span key={cartTotal} className="cat-fab-n">{cartTotal > 99 ? "99+" : cartTotal}</span>}
            </button>

            {/* Modales */}
            <CartDrawer
                open={cartOpen} onClose={() => setCartOpen(false)}
                cart={cart} onRemove={handleRemove} onUpdateQty={handleUpdateQty}
                onEdit={(idx) => { setCartOpen(false); setTimeout(() => openProductModal(null, idx), 200); }}
                onCheckout={handleCheckout}
            />
            <ProductModal
                product={productModal.product} open={productModal.open}
                onClose={closeProductModal} tallas={tallas}
                onAddToCart={handleAddToCart}
                initColor={productModal.initColor} initTalla={productModal.initTalla} initQty={productModal.initQty}
                editMode={productModal.editIdx !== null}
            />
            <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} cart={cart} usuario={usuario} onSuccess={handlePaymentSuccess} />

            {/* Pedido exitoso */}
            {orderSuccess && (
                <div className="cat-layer cat-overlay" style={{ zIndex: 9999 }}>
                    <div className="cat-modal cat-ok">
                        <div className="cat-ok-ico"><FaCheckCircle /></div>
                        <h2>¡Pedido confirmado!</h2>
                        <p>Tu pedido fue registrado. Pronto te contactaremos.</p>
                        <div className="cat-ok-n"><small>Número de pedido</small><b>#{orderSuccess}</b></div>
                        <button className="sx-btn" onClick={() => setOrderSuccess(null)}>Ok</button>
                    </div>
                </div>
            )}

            {/* Página */}
            <div className="cat-page">

                {/* Hero */}
                <section className="sx-hero-bg cat-hero">
                    <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
                    <div className="sx-wrap sx-hero-in">
                        <span className="sx-eyebrow">Catálogo STAMPLAB</span>
                        <h1>Nuestros <span className="sx-gradient-text">Productos</span></h1>
                        <p className="cat-lead">Agrega al carrito y elige tu método de pago al finalizar</p>
                        <div className={`cat-search ${searchFocused ? "on" : ""}`}>
                            <FaSearch size={16} className="cat-s-ico" />
                            <input type="text" placeholder="Buscar productos..." value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
                            {search && <button className="cat-clear" onClick={() => { setSearch(""); setPage(1); }} aria-label="Borrar búsqueda"><FaTimes size={12} /></button>}
                        </div>
                    </div>
                </section>

                {/* Contenido */}
                <div className="cat-wrap">

                    {/* Barra info */}
                    {!cargando && (
                        <div className="cat-info">
                            <span>
                                <b>{filtered.length}</b> {filtered.length === 1 ? "producto" : "productos"}
                                {search && <span style={{ color: C.accent }}> · "{search}"</span>}
                                {totalPgs > 1 && <span> · Pág. {page}/{totalPgs}</span>}
                            </span>
                            <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                {cartTotal > 0 && <button className="sx-btn sx-btn-dark sx-btn-sm" onClick={() => setCartOpen(true)}><FaShoppingCart size={11} /> {cartTotal} en carrito</button>}
                                {hayFiltros && <button className="cat-link" onClick={limpiar}>Limpiar ✕</button>}
                            </span>
                        </div>
                    )}

                    {/* Skeleton */}
                    {cargando ? (
                        <div className="cat-grid" style={{ marginTop: 28 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="cat-skel">
                                    <div className="cat-sh" style={{ aspectRatio: "1/1", borderRadius: 0 }} />
                                    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div className="cat-sh" style={{ height: 18, width: "70%" }} />
                                        <div className="cat-sh" style={{ height: 12 }} />
                                        <div className="cat-sh" style={{ height: 12, width: "50%" }} />
                                        <div className="cat-sh" style={{ height: 44, marginTop: 10, borderRadius: 13 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="cat-state">
                            <div className="cat-state-ico">{hayFiltros ? <FaRegSadTear /> : <FaBoxOpen />}</div>
                            <h3>{hayFiltros ? "Sin resultados" : "Sin productos disponibles"}</h3>
                            <p>{search ? `No encontramos "${search}"` : hayFiltros ? "Ningún producto coincide con esos filtros." : "No hay productos en este momento."}</p>
                            {hayFiltros && <button className="sx-btn" onClick={limpiar}>Ver todos</button>}
                        </div>
                    ) : (
                        <>
                            <div className="cat-grid">
                                {pageProds.map((p, idx) => {
                                    const tallasP = obtenerTallas(p);
                                    const coloresP = obtenerColores(p);
                                    const precio = obtenerPrecio(p);
                                    return (
                                        <div key={p.ProductoID} className="sx-reveal" style={{ "--sx-i": idx % 4 }}>
                                            <article className="sx-card cat-card">
                                                <div className="cat-media sx-zoom" onClick={() => openProductModal(p)}>
                                                    {p.ImagenProducto
                                                        ? <img src={p.ImagenProducto} alt={p.Nombre} onError={e => { e.target.style.display = "none"; }} />
                                                        : <div className="cat-empty-img"><FaBoxOpen size={38} style={{ opacity: .4 }} />Sin imagen</div>}
                                                    <span className="cat-badge"><i /> Disponible</span>
                                                    <button className="cat-eye" onClick={(e) => { e.stopPropagation(); openProductModal(p); }} title="Ver detalle" aria-label="Ver detalle"><FaEye size={15} /></button>
                                                </div>
                                                <div className="cat-body">
                                                    <h3 className="cat-name">{p.Nombre}</h3>
                                                    {p.Descripcion && <p className="cat-desc">{p.Descripcion}</p>}
                                                    {tallasP.length > 0 && <div className="cat-sizes">{tallasP.map(t => <span key={t} className="cat-size">{t}</span>)}</div>}
                                                    {coloresP.length > 0 && (
                                                        <div className="cat-colors">
                                                            {coloresP.map(c => <i key={c} title={c} className="cat-dot" style={{ background: coloresHex[c] || "#ccc" }} />)}
                                                        </div>
                                                    )}
                                                    <div className="cat-foot">
                                                        <div className="cat-price"><small>Desde</small><strong>{money(precio)}</strong></div>
                                                        <div className="cat-actions">
                                                            <button className="sx-btn sx-btn-dark" onClick={() => openProductModal(p)}><FaShoppingCart size={13} /> Agregar</button>
                                                            <button className="sx-btn cat-ghost" onClick={() => openProductModal(p)}><FaEye size={13} /> Ver</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Paginación */}
                            {totalPgs > 1 && (
                                <div className="cat-pager">
                                    {page < totalPgs && (
                                        <button className="cat-more" onClick={() => setPage(p => p + 1)}>
                                            Ver más productos
                                            <span>{Math.max(0, filtered.length - page * PER_PAGE)} restantes</span>
                                        </button>
                                    )}
                                    <div className="cat-pages">
                                        {Array.from({ length: totalPgs }, (_, i) => i + 1).map(n => (
                                            <button key={n} className={n === page ? "on" : ""} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{n}</button>
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Mostrando {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} productos</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default ProductosLanding;
