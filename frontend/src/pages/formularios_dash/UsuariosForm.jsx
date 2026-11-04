// src/pages/formularios_dash/usuariosForm.jsx
import { useState, useEffect } from "react";
import { FaTimes, FaUserPlus, FaUserEdit, FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import { errorContrasena } from "../../utils/validarContrasena";
import { createUsuario, updateUsuario, getRoles } from "../../Services/api-usuarios/usuarios";
import { C } from "../../config/tokens";

/* ── Estilos .cf-p- (pulido visual; sin dependencias) ── */
const CF_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
.cf-p-page, .cf-p-page *, .cf-p-overlay, .cf-p-overlay * { box-sizing: border-box; }
.cf-p-page { font-family: 'Outfit', sans-serif; min-height: 100%; background: #f8fafc; padding: 28px 32px; color: #0f172a; }
.cf-p-overlay { font-family: 'Outfit', sans-serif; }
@keyframes cfUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes cfFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cfPop { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes cfShim { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes cfSpin { to { transform: rotate(360deg); } }
@keyframes cfFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes cfMsg { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

/* Cabecera */
.cf-p-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; animation: cfUp .35s ease both; }
.cf-p-title { margin: 0; font-weight: 800; font-size: 22px; color: #1a2540; letter-spacing: -.02em; }
.cf-p-title::after { content: ""; display: block; width: 34px; height: 3px; border-radius: 3px; margin-top: 7px; background: linear-gradient(90deg, #4f8ef7, #7c3aed); transition: width .45s cubic-bezier(.2,.8,.2,1); }
.cf-p-page:hover .cf-p-title::after { width: 60px; }
.cf-p-sub { margin: 4px 0 0; color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cf-p-count { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, rgba(79,142,247,.14), rgba(124,58,237,.14)); color: #3b6fe0; border: 1px solid rgba(79,142,247,.25); border-radius: 999px; padding: 2px 11px; font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cf-p-tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

/* Botones */
.cf-p-btn { background: #1a2540; color: #fff; border: none; border-radius: 11px; padding: 10px 20px; font: 700 13px 'Outfit', sans-serif; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(26,37,64,.25); transition: transform .18s, background .18s, box-shadow .18s, opacity .18s; }
.cf-p-btn:hover:not(:disabled) { background: #2d3f6e; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(26,37,64,.3); }
.cf-p-btn:active:not(:disabled) { transform: none; }
.cf-p-btn:disabled { opacity: .6; cursor: not-allowed; }
.cf-p-btn-ghost { background: #f1f5f9; color: #475569; border: none; border-radius: 11px; padding: 10px 20px; font: 600 13px 'Outfit', sans-serif; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background .18s, transform .18s; }
.cf-p-btn-ghost:hover:not(:disabled) { background: #e2e8f0; }
.cf-p-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }
.cf-p-btn-soft { background: #f0f4ff; color: #4f8ef7; border: 1.5px solid #c7d9ff; border-radius: 11px; padding: 8px 18px; font: 700 12px 'Outfit', sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background .18s, color .18s; }
.cf-p-btn-soft:hover { background: #4f8ef7; color: #fff; }
.cf-p-btn-danger { background: #dc2626; color: #fff; border: none; border-radius: 11px; padding: 9px 18px; font: 700 12px 'Outfit', sans-serif; cursor: pointer; transition: background .18s; }
.cf-p-btn-danger:hover { background: #b91c1c; }
.cf-p-page button:focus-visible, .cf-p-overlay button:focus-visible, .cf-p-page select:focus-visible { outline: 3px solid rgba(79,142,247,.45); outline-offset: 2px; }

/* Buscador */
.cf-p-search { position: relative; }
.cf-p-search input { border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 10px 34px 10px 36px; font: 400 13px 'Outfit', sans-serif; outline: none; width: 250px; color: #0f172a; background: #fff; transition: border-color .18s, box-shadow .18s; }
.cf-p-search input:focus { border-color: #4f8ef7; box-shadow: 0 0 0 4px rgba(79,142,247,.14); }
.cf-p-search-ic { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.cf-p-search-x { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.cf-p-search-x:hover { background: #e2e8f0; }

/* Alerta de error */
.cf-p-alert { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; color: #dc2626; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; animation: cfUp .25s ease both; }
.cf-p-alert button { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 5px 14px; font: 700 12px 'Outfit', sans-serif; cursor: pointer; }

/* Tabla */
.cf-p-card { background: #fff; border-radius: 18px; box-shadow: 0 2px 16px rgba(15,23,42,.06), 0 0 0 1px #eef2f7; overflow: hidden; animation: cfUp .35s ease both; }
.cf-p-scroll { overflow-x: auto; }
.cf-p-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.cf-p-table thead tr { background: linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%); }
.cf-p-table th { background: transparent; color: #fff; font-size: 11px; font-weight: 700; padding: 13px 16px; white-space: nowrap; letter-spacing: .06em; text-transform: uppercase; text-align: left; }
.cf-p-table td { padding: 13px 16px; border-bottom: 1px solid #eef2f7; vertical-align: middle; color: #334155; }
.cf-p-table tbody tr:last-child td { border-bottom: none; }
.cf-p-row { transition: background .15s ease, box-shadow .15s ease; animation: cfUp .3s ease both; }
.cf-p-row:nth-child(even) { background: #fbfcfe; }
.cf-p-row:hover { background: #f3f7ff; box-shadow: inset 3px 0 0 #4f8ef7; }
.cf-p-ta-c { text-align: center !important; }
.cf-p-name { font-weight: 700; color: #1a2540; font-size: 13.5px; }
.cf-p-muted { color: #64748b; font-size: 12.5px; }
.cf-p-ell { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cf-p-who { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cf-p-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 2px 6px rgba(79,142,247,.3); }
.cf-p-avatar-sq { border-radius: 10px; font-size: 14px; }
.cf-p-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; border: 2px solid #e2e8f0; cursor: zoom-in; transition: transform .2s, box-shadow .2s; display: block; background: #fff; padding: 0; }
.cf-p-thumb:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(15,23,42,.18); }

/* Badges */
.cf-p-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; border: 1px solid; font: 700 11.5px 'Outfit', sans-serif; white-space: nowrap; line-height: 1.2; }
.cf-p-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; display: inline-block; flex-shrink: 0; }
.cf-p-b-ok { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.cf-p-b-off { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.cf-p-b-acc { background: #f0f4ff; color: #3b6fe0; border-color: #c7d9ff; }
.cf-p-b-vio { background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }
.cf-p-b-mut { background: #f1f5f9; color: #64748b; border-color: #e2e8f0; }
.cf-p-id { display: inline-block; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3px 9px; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }

/* Botones de accion */
.cf-p-actions { display: flex; gap: 6px; justify-content: center; }
.cf-p-ibtn { width: 32px; height: 32px; border-radius: 9px; border: 1.5px solid; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; background: #fff; transition: transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s; padding: 0; }
.cf-p-ibtn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(15,23,42,.14); }
.cf-p-ibtn:disabled { opacity: .4; cursor: not-allowed; }
.cf-p-i-view { color: #4f8ef7; border-color: #c7d9ff; background: #f0f4ff; }
.cf-p-i-view:hover:not(:disabled) { background: #4f8ef7; color: #fff; border-color: #4f8ef7; }
.cf-p-i-edit { color: #d97706; border-color: #fde68a; background: #fffbeb; }
.cf-p-i-edit:hover:not(:disabled) { background: #d97706; color: #fff; border-color: #d97706; }
.cf-p-i-state { color: #7c3aed; border-color: #ddd6fe; background: #f5f3ff; }
.cf-p-i-state:hover:not(:disabled) { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.cf-p-i-del { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
.cf-p-i-del:hover:not(:disabled) { background: #dc2626; color: #fff; border-color: #dc2626; }

/* Skeleton y estado vacio */
.cf-p-skel { height: 12px; border-radius: 6px; background: linear-gradient(90deg, #eef2f7 0, #f8fafc 120px, #eef2f7 240px); background-size: 800px 100%; animation: cfShim 1.2s linear infinite; }
.cf-p-skel-c { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
.cf-p-empty { text-align: center; padding: 56px 20px; }
.cf-p-empty-art { position: relative; width: 92px; height: 92px; margin: 0 auto 18px; display: flex; align-items: center; justify-content: center; }
.cf-p-empty-art::before, .cf-p-empty-art::after { content: ""; position: absolute; border-radius: 50%; border: 1.5px dashed #c7d9ff; }
.cf-p-empty-art::before { inset: 0; animation: cfSpin 24s linear infinite; }
.cf-p-empty-art::after { inset: 12px; border-style: solid; border-color: #e0e7ff; }
.cf-p-empty-ic { position: relative; z-index: 1; width: 54px; height: 54px; border-radius: 17px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 10px 24px rgba(79,142,247,.35); animation: cfFloat 4s ease-in-out infinite; }
.cf-p-empty-bad .cf-p-empty-ic { background: linear-gradient(135deg, #f87171, #dc2626); box-shadow: 0 10px 24px rgba(220,38,38,.3); }
.cf-p-empty h5 { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #1a2540; }
.cf-p-empty p { margin: 0 0 16px; font-size: 13px; color: #64748b; }

/* Paginacion */
.cf-p-pager { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid #eef2f7; background: #fff; flex-wrap: wrap; gap: 12px; }
.cf-p-pager-info { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13px; color: #64748b; }
.cf-p-pager-info strong { color: #1a2540; }
.cf-p-pager select { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 4px 10px; font: 400 12px 'Outfit', sans-serif; outline: none; color: #1a2540; cursor: pointer; background: #fff; }
.cf-p-pager select:focus { border-color: #4f8ef7; box-shadow: 0 0 0 3px rgba(79,142,247,.14); }
.cf-p-pages { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.cf-p-pg { min-width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; font: 600 13px 'Outfit', sans-serif; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0 8px; transition: background .18s, border-color .18s, color .18s, transform .15s; }
.cf-p-pg:hover:not(:disabled):not(.on) { background: #f0f4ff; border-color: #4f8ef7; color: #4f8ef7; transform: translateY(-1px); }
.cf-p-pg.on { background: #1a2540; border-color: #1a2540; color: #fff; font-weight: 700; cursor: default; }
.cf-p-pg:disabled { opacity: .4; cursor: not-allowed; }

/* Modales */
.cf-p-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; animation: cfFade .2s ease; overflow-y: auto; }
.cf-p-modal { background: #fff; border-radius: 20px; width: 100%; max-height: 92vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(15,23,42,.35); animation: cfPop .28s cubic-bezier(.2,.8,.2,1); }
.cf-p-mhead { position: relative; background: linear-gradient(120deg, #1a2540 0%, #2d3f6e 60%, #3b3f8f 100%); color: #fff; padding: 20px 24px; overflow: hidden; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.cf-p-mhead::after { content: ""; position: absolute; right: -60px; top: -80px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(79,142,247,.35), transparent 70%); pointer-events: none; }
.cf-p-mhead > * { position: relative; z-index: 1; }
.cf-p-mhead h3 { margin: 0; font-weight: 800; font-size: 16px; color: #fff; }
.cf-p-mhead p { margin: 2px 0 0; color: rgba(255,255,255,.7); font-size: 12px; }
.cf-p-mclose { width: 34px; height: 34px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,.28); background: rgba(255,255,255,.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .18s, transform .18s; flex-shrink: 0; }
.cf-p-mclose:hover:not(:disabled) { background: rgba(255,255,255,.22); transform: rotate(90deg); }
.cf-p-mclose:disabled { opacity: .5; cursor: not-allowed; }
.cf-p-mbody { padding: 20px 24px; overflow-y: auto; flex: 1; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; }
.cf-p-mfoot { padding: 14px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; background: #fff; flex-wrap: wrap; }
.cf-p-kv { background: #fff; border: 1px solid #e9eef5; border-radius: 12px; padding: 11px 14px; }
.cf-p-kv small { display: block; font-size: 11px; color: #64748b; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 3px; }
.cf-p-kv span, .cf-p-kv div { font-size: 13.5px; color: #1a2540; font-weight: 600; word-break: break-word; }
.cf-p-img-frame { text-align: center; }
.cf-p-img-frame img { max-height: 280px; max-width: 100%; border-radius: 12px; object-fit: contain; border: 2px solid #e2e8f0; background: #fff; }

/* Formularios */
.cf-p-form-wrap { max-width: 900px; margin: 0 auto; }
.cf-p-fcard { background: #fff; border-radius: 18px; box-shadow: 0 2px 16px rgba(15,23,42,.06), 0 0 0 1px #eef2f7; overflow: hidden; animation: cfUp .35s ease both; }
.cf-p-fhead { background: linear-gradient(120deg, #1a2540 0%, #2d3f6e 60%, #3b3f8f 100%); padding: 18px 24px; display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; }
.cf-p-fhead::after { content: ""; position: absolute; right: -50px; top: -70px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(79,142,247,.35), transparent 70%); pointer-events: none; }
.cf-p-fhead > * { position: relative; z-index: 1; }
.cf-p-fhead-ic { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; background: linear-gradient(135deg, #4f8ef7, #7c3aed); box-shadow: 0 6px 16px rgba(79,142,247,.4); flex-shrink: 0; }
.cf-p-fhead p { margin: 0; font-weight: 700; font-size: 14px; color: #fff; }
.cf-p-fhead small { display: block; color: rgba(255,255,255,.65); font-size: 12px; }
.cf-p-fbody { padding: 24px; }
.cf-p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.cf-p-col-2 { grid-column: 1 / -1; }
.cf-p-field { min-width: 0; animation: cfUp .35s ease both; }
.cf-p-label { display: block; margin-bottom: 6px; font-weight: 700; font-size: 13px; color: #1a2540; }
.cf-p-req { color: #dc2626; }
.cf-p-input { width: 100%; padding: 11px 14px; font: 400 13.5px 'Outfit', sans-serif; border: 1.5px solid #e2e8f0; border-radius: 11px; outline: none; color: #0f172a; background: #fff; transition: border-color .18s, box-shadow .18s, background .18s; }
textarea.cf-p-input { resize: vertical; min-height: 96px; line-height: 1.5; }
.cf-p-input::placeholder { color: #94a3b8; }
.cf-p-input:hover:not(:disabled):not(:focus) { border-color: #cbd5e1; }
.cf-p-input:focus { border-color: #4f8ef7; box-shadow: 0 0 0 4px rgba(79,142,247,.16); background: #fff; }
.cf-p-input:disabled, .cf-p-input[readonly] { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
.cf-p-input.cf-p-bad { border-color: #dc2626; background: #fef2f2; }
.cf-p-input.cf-p-bad:focus { box-shadow: 0 0 0 4px rgba(220,38,38,.15); }
.cf-p-input.cf-p-good { border-color: #16a34a; }
.cf-p-input.cf-p-good:focus { box-shadow: 0 0 0 4px rgba(22,163,74,.15); }
.cf-p-file { padding: 8px 10px; cursor: pointer; background: #f8fafc; border-style: dashed; }
.cf-p-file::file-selector-button { margin-right: 12px; border: none; border-radius: 8px; padding: 7px 14px; background: #1a2540; color: #fff; font: 700 12px 'Outfit', sans-serif; cursor: pointer; transition: background .18s; }
.cf-p-file:hover::file-selector-button { background: #2d3f6e; }
.cf-p-err { margin: 6px 0 0; font-size: 12px; color: #dc2626; font-weight: 600; display: flex; align-items: flex-start; gap: 6px; animation: cfMsg .2s ease both; }
.cf-p-err svg { margin-top: 2px; flex-shrink: 0; }
.cf-p-hint { margin: 6px 0 0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; gap: 8px; }
.cf-p-note { background: #f0f4ff; border: 1.5px solid #c7d9ff; border-radius: 12px; padding: 14px 16px; animation: cfUp .3s ease both; }
.cf-p-info { display: flex; align-items: flex-start; gap: 10px; background: #f0f4ff; border: 1.5px solid #c7d9ff; color: #3b6fe0; border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; font-weight: 500; animation: cfUp .3s ease both; }
.cf-p-info svg { margin-top: 2px; flex-shrink: 0; }
.cf-p-fact { display: flex; justify-content: center; gap: 12px; margin-top: 26px; flex-wrap: wrap; }
.cf-p-fact .cf-p-btn, .cf-p-fact .cf-p-btn-ghost { padding: 11px 28px; }
.cf-p-spin { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: cfSpin .7s linear infinite; display: inline-block; }
.cf-p-prev { border: 1.5px solid #c7d9ff; border-radius: 12px; overflow: hidden; animation: cfUp .3s ease both; }
.cf-p-prev-h { background: linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%); color: #fff; padding: 7px 14px; font-size: 12px; font-weight: 700; }
.cf-p-prev-b { padding: 14px; text-align: center; background: #fff; }
.cf-p-prev-b img { max-height: 250px; max-width: 100%; object-fit: contain; border-radius: 10px; }
.cf-p-modal .cf-p-fbody { overflow-y: auto; flex: 1; min-height: 0; }

@media (max-width: 760px) {
  .cf-p-page { padding: 18px 14px; }
  .cf-p-head { align-items: stretch; flex-direction: column; }
  .cf-p-tools { width: 100%; }
  .cf-p-search { flex: 1 1 100%; }
  .cf-p-search input { width: 100%; }
  .cf-p-tools .cf-p-btn { flex: 1 1 100%; }
  .cf-p-grid { grid-template-columns: 1fr; }
  .cf-p-fbody { padding: 18px; }
  .cf-p-fact .cf-p-btn, .cf-p-fact .cf-p-btn-ghost { flex: 1 1 100%; }
  .cf-p-pager { justify-content: center; }
  .cf-p-mfoot .cf-p-btn, .cf-p-mfoot .cf-p-btn-soft, .cf-p-mfoot .cf-p-btn-danger { flex: 1; justify-content: center; }
}
@media (max-width: 640px) {
  .cf-p-table, .cf-p-table tbody, .cf-p-table tr, .cf-p-table td { display: block; width: 100%; }
  .cf-p-table thead { display: none; }
  .cf-p-table tbody tr { padding: 10px 14px; border-bottom: 1px solid #eef2f7; }
  .cf-p-table tbody tr:nth-child(even) { background: #fff; }
  .cf-p-table td { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: none; padding: 6px 0; text-align: right; }
  .cf-p-table td[data-label]::before { content: attr(data-label); font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #94a3b8; text-align: left; flex-shrink: 0; }
  .cf-p-table td.cf-p-td-full { display: block; padding: 0; text-align: center; }
  .cf-p-actions { justify-content: flex-end; }
  .cf-p-ell { max-width: 200px; }
  .cf-p-who { flex-direction: row-reverse; text-align: right; }
}
@media (prefers-reduced-motion: reduce) {
  .cf-p-page *, .cf-p-overlay *, .cf-p-page *::before, .cf-p-overlay *::before, .cf-p-page *::after, .cf-p-overlay *::after { animation: none !important; transition: none !important; }
}
`;


const UsuariosForm = ({ onClose, onSave, usuario = null }) => {
  const [formData, setFormData] = useState({
    DocumentoID: "",
    Nombre: "",
    Correo: "",
    Direccion: "",
    Telefono: "",
    Contraseña: "",
    RolID: "",
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errors, setErrors] = useState({});
  const [verClave, setVerClave] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  useEffect(() => {
    if (usuario) {
      setFormData({
        DocumentoID: usuario.DocumentoID ? usuario.DocumentoID.toString() : "",
        Nombre: usuario.Nombre || "",
        Correo: usuario.Correo || "",
        Direccion: usuario.Direccion || "",
        Telefono: usuario.Telefono || "",
        Contraseña: "",
        RolID: usuario.RolID ? usuario.RolID.toString() : "",
      });
    }
  }, [usuario]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const result = await getRoles();
      if (result.estado && Array.isArray(result.datos)) {
        setRoles(result.datos.map(rol => ({ ...rol, RolID: rol.RolID.toString() })));
      } else setRoles([]);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const validarDocumento = (documento) => {
    const doc = String(documento || "").trim();
    if (!doc) return "El documento es obligatorio";
    if (!/^\d+$/.test(doc)) return "Solo números";
    if (doc.length < 7 || doc.length > 10) return "Entre 7 y 10 dígitos";
    return "";
  };

  const validarNombre = (nombre) => {
    const nom = String(nombre || "").trim();
    if (!nom) return "El nombre es obligatorio";
    if (nom.length < 3 || nom.length > 50) return "Entre 3 y 50 caracteres";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]+$/.test(nom)) return "Solo letras y espacios";
    return "";
  };

  const validarCorreo = (correo) => {
    const cor = String(correo || "").trim();
    if (!cor) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cor)) return "Correo inválido";
    return "";
  };

  const validarTelefono = (telefono) => {
    const tel = String(telefono || "").trim();
    if (!tel) return "El teléfono es obligatorio";
    if (!/^\d+$/.test(tel)) return "Solo números";
    if (tel.length < 7 || tel.length > 10) return "Entre 7 y 10 dígitos";
    return "";
  };

  const validarDireccion = (direccion) => {
    const dir = String(direccion || "").trim();
    if (!dir) return "La dirección es obligatoria";
    if (dir.length > 255) return "Máximo 255 caracteres";
    return "";
  };

  const validarContraseña = (contraseña, esEdicion) => {
    if (esEdicion && !contraseña) return "";
    const pass = String(contraseña || "");
    if (!pass) return "La contraseña es obligatoria";
    return errorContrasena(pass);
  };

  const validarRol = (rolID) => {
    if (!rolID || rolID === "") return "Debe seleccionar un rol";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    let error = "";
    switch (name) {
      case "DocumentoID": error = validarDocumento(value); break;
      case "Nombre": error = validarNombre(value); break;
      case "Correo": error = validarCorreo(value); break;
      case "Telefono": error = validarTelefono(value); break;
      case "Direccion": error = validarDireccion(value); break;
      case "Contraseña": error = validarContraseña(value, !!usuario); break;
      case "RolID": error = validarRol(value); break;
      default: break;
    }
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {
      DocumentoID: validarDocumento(formData.DocumentoID),
      Nombre: validarNombre(formData.Nombre),
      Correo: validarCorreo(formData.Correo),
      Telefono: validarTelefono(formData.Telefono),
      Direccion: validarDireccion(formData.Direccion),
      Contraseña: validarContraseña(formData.Contraseña, !!usuario),
      RolID: validarRol(formData.RolID),
    };
    const filteredErrors = {};
    Object.keys(newErrors).forEach(key => { if (newErrors[key]) filteredErrors[key] = newErrors[key]; });
    return filteredErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Por favor corrija los errores antes de continuar", confirmButtonColor: C.danger });
      return;
    }
    setLoading(true); setErrors({});
    try {
      const dataToSend = {
        DocumentoID: String(formData.DocumentoID).trim(),
        Nombre: String(formData.Nombre).trim(),
        Correo: String(formData.Correo).trim(),
        Telefono: String(formData.Telefono).trim(),
        Direccion: String(formData.Direccion).trim(),
        RolID: String(formData.RolID).trim(),
      };
      if (usuario) { if (formData.Contraseña && formData.Contraseña.trim()) dataToSend.Contraseña = String(formData.Contraseña).trim(); }
      else dataToSend.Contraseña = String(formData.Contraseña).trim();

      let result;
      if (usuario) result = await updateUsuario(usuario.DocumentoID, dataToSend);
      else result = await createUsuario(dataToSend);

      if (result.estado) {
        Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: "success", title: usuario ? "Usuario actualizado correctamente" : "Usuario creado correctamente" });
        onSave();
      } else throw new Error(result.mensaje || "Error al guardar usuario");
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.mensaje || error.message || "Error al guardar el usuario", confirmButtonColor: C.danger });
    } finally {
      setLoading(false);
    }
  };

  const tieneErrores = Object.values(errors).some(error => error !== "");

  /* Clase de estado del campo: rojo si hay error, verde si ya se validó y tiene valor */
  const cls = (campo) => {
    if (errors[campo]) return " cf-p-bad";
    if (errors[campo] === "" && String(formData[campo] ?? "") !== "") return " cf-p-good";
    return "";
  };
  const Err = (campo) => errors[campo]
    ? <p className="cf-p-err" id={`cf-p-usr-${campo}-err`} role="alert"><FaExclamationCircle size={12} /> {errors[campo]}</p>
    : null;
  const desc = (campo) => (errors[campo] ? `cf-p-usr-${campo}-err` : undefined);

  return (
    <>
      <style>{CF_CSS}</style>

      <div className="cf-p-page">
        <div className="cf-p-form-wrap">

          {/* ── HEADER ── */}
          <div className="cf-p-head">
            <h4 className="cf-p-title">{usuario ? "Editar Usuario" : "Crear Usuario"}</h4>
            <button type="button" onClick={onClose} className="cf-p-ibtn cf-p-i-del" disabled={loading} title="Cerrar formulario" aria-label="Cerrar formulario">
              <FaTimes size={13} />
            </button>
          </div>

          <form className="cf-p-fcard" onSubmit={handleSubmit} noValidate>
            <div className="cf-p-fhead">
              <div className="cf-p-fhead-ic" aria-hidden="true">{usuario ? <FaUserEdit /> : <FaUserPlus />}</div>
              <div>
                <p>{usuario ? `Editando: ${usuario.Nombre}` : "Nuevo Usuario"}</p>
                <small>{usuario ? `Documento: ${usuario.DocumentoID}` : "Completa los datos para registrar un nuevo usuario"}</small>
              </div>
            </div>

            <div className="cf-p-fbody">
              <div className="cf-p-grid">
                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-doc">Documento</label>
                  <input
                    id="cf-p-usr-doc"
                    type="text"
                    className={`cf-p-input${cls("DocumentoID")}`}
                    name="DocumentoID"
                    value={formData.DocumentoID}
                    onChange={handleChange}
                    disabled={loading || !!usuario}
                    readOnly={!!usuario}
                    required
                    aria-invalid={!!errors.DocumentoID}
                    aria-describedby={desc("DocumentoID")}
                  />
                  {Err("DocumentoID")}
                </div>

                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-nombre">Nombre Completo</label>
                  <input
                    id="cf-p-usr-nombre"
                    type="text"
                    className={`cf-p-input${cls("Nombre")}`}
                    name="Nombre"
                    value={formData.Nombre}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    aria-invalid={!!errors.Nombre}
                    aria-describedby={desc("Nombre")}
                  />
                  {Err("Nombre")}
                </div>

                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-correo">Correo Electrónico</label>
                  <input
                    id="cf-p-usr-correo"
                    type="email"
                    className={`cf-p-input${cls("Correo")}`}
                    name="Correo"
                    value={formData.Correo}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    aria-invalid={!!errors.Correo}
                    aria-describedby={desc("Correo")}
                  />
                  {Err("Correo")}
                </div>

                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-tel">Teléfono</label>
                  <input
                    id="cf-p-usr-tel"
                    type="text"
                    className={`cf-p-input${cls("Telefono")}`}
                    name="Telefono"
                    value={formData.Telefono}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    aria-invalid={!!errors.Telefono}
                    aria-describedby={desc("Telefono")}
                  />
                  {Err("Telefono")}
                </div>

                <div className="cf-p-field cf-p-col-2">
                  <label className="cf-p-label" htmlFor="cf-p-usr-dir">Dirección</label>
                  <input
                    id="cf-p-usr-dir"
                    type="text"
                    className={`cf-p-input${cls("Direccion")}`}
                    name="Direccion"
                    value={formData.Direccion}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    aria-invalid={!!errors.Direccion}
                    aria-describedby={desc("Direccion")}
                  />
                  {Err("Direccion")}
                </div>

                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-clave">
                    Contraseña
                    {usuario && <small style={{ color: C.muted, fontWeight: 500 }}> (opcional)</small>}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="cf-p-usr-clave"
                      type={verClave ? "text" : "password"}
                      className={`cf-p-input${cls("Contraseña")}`}
                      style={{ paddingRight: 42 }}
                      name="Contraseña"
                      value={formData.Contraseña}
                      onChange={handleChange}
                      disabled={loading}
                      required={!usuario}
                      aria-invalid={!!errors.Contraseña}
                      aria-describedby={desc("Contraseña")}
                    />
                    <button type="button" className="cf-p-search-x" style={{ right: 10, width: 26, height: 26 }}
                      onClick={() => setVerClave(v => !v)}
                      title={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      {verClave ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                    </button>
                  </div>
                  {Err("Contraseña")}
                  <p className="cf-p-hint"><span>8 a 100 caracteres, con letras y números</span></p>
                </div>

                <div className="cf-p-field">
                  <label className="cf-p-label" htmlFor="cf-p-usr-rol">Rol</label>
                  <select
                    id="cf-p-usr-rol"
                    className={`cf-p-input${cls("RolID")}`}
                    name="RolID"
                    value={formData.RolID}
                    onChange={handleChange}
                    disabled={loading || loadingRoles}
                    required
                    aria-invalid={!!errors.RolID}
                    aria-describedby={desc("RolID")}
                  >
                    <option value="">{loadingRoles ? "Cargando..." : "Seleccione un rol"}</option>
                    {roles.map((rol) => (
                      <option key={rol.RolID} value={rol.RolID}>{rol.Nombre}</option>
                    ))}
                  </select>
                  {Err("RolID")}
                </div>
              </div>

              <div className="cf-p-fact">
                <button type="submit" className="cf-p-btn" disabled={loading || loadingRoles || tieneErrores}>
                  {loading ? (
                    <><span className="cf-p-spin" role="status" aria-label="Guardando" />{usuario ? "Actualizando..." : "Guardando..."}</>
                  ) : (
                    usuario ? "Actualizar" : "Guardar"
                  )}
                </button>
                <button type="button" onClick={onClose} className="cf-p-btn-ghost" disabled={loading}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UsuariosForm;
