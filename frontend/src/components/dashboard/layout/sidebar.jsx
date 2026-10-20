import {
    FaUsers, FaClipboardList, FaBox, FaTshirt, FaPalette,
    FaRuler, FaChartBar, FaCogs, FaUserCog, FaTools,
    FaShoppingCart, FaWarehouse, FaChartLine, FaClock,
    FaChevronDown, FaAngleDoubleLeft, FaAngleDoubleRight
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const menuItems = [
    {
        title: "Configuración",
        key: "roles",
        icon: <FaCogs size={15} />,
        items: [
            { to: "/dashboard/roles", label: "Roles", icon: <FaClipboardList size={13} /> }
        ]
    },
    {
        title: "Gestión de Usuarios",
        key: "usuarios",
        icon: <FaUserCog size={15} />,
        items: [
            { to: "/dashboard/usuarios", label: "Usuarios", icon: <FaUsers size={13} /> },
            { to: "/dashboard/clientes", label: "Clientes", icon: <FaUsers size={13} /> },
        ]
    },
    {
        title: "Servicios",
        key: "tecnicas",
        icon: <FaTools size={15} />,
        items: [
            { to: "/dashboard/tecnicas", label: "Técnicas", icon: <FaTools size={13} /> },
        ]
    },
    {
        title: "Ventas",
        key: "ventas",
        icon: <FaShoppingCart size={15} />,
        items: [
            { to: "/dashboard/ventas-pendientes", label: "Pedidos Pendientes", icon: <FaClock size={13} /> },
            { to: "/dashboard/ventas",            label: "Pedidos",            icon: <FaBox size={13} /> },
            { to: "/dashboard/cotizaciones",      label: "Cotizaciones",       icon: <FaClipboardList size={13} /> },
            { to: "/dashboard/productos",         label: "Productos",          icon: <FaBox size={13} /> },
        ]
    },
    {
        title: "Características",
        key: "caracteristicasproducto",
        icon: <FaTshirt size={15} />,
        items: [
            { to: "/dashboard/tallas",  label: "Tallas",  icon: <FaRuler size={13} /> },
            { to: "/dashboard/colores", label: "Colores", icon: <FaPalette size={13} /> }
        ]
    },
    {
        title: "Insumos",
        key: "insumos",
        icon: <FaBox size={15} />,
        items: [
            { to: "/dashboard/insumos", label: "Insumos", icon: <FaBox size={13} /> },
        ]
    },
    {
        title: "Compras",
        key: "procesocompras",
        icon: <FaWarehouse size={15} />,
        items: [
            { to: "/dashboard/pedidos",      label: "Compras",      icon: <FaClipboardList size={13} /> },
            { to: "/dashboard/proveedores",  label: "Proveedores",  icon: <FaWarehouse size={13} /> }
        ]
    },
    {
        title: "Indicadores",
        key: "indicadores",
        icon: <FaChartBar size={15} />,
        items: [
            { to: "/dashboard/mediciondesempeño", label: "Medición y Desempeño", icon: <FaChartLine size={13} /> }
        ]
    }
];

/* Rutas internas que pertenecen a un ítem del menú (para marcarlo activo) */
const ALIAS = {
    "/dashboard": "/dashboard/mediciondesempeño",
    "/dashboard/agregar-producto": "/dashboard/productos",
    "/dashboard/cotizaciones/nueva": "/dashboard/cotizaciones",
};

/* La URL llega codificada (mediciondesempe%C3%B1o): se decodifica para comparar */
const rutaActiva = (pathname) => {
    let p = pathname;
    try { p = decodeURIComponent(pathname); } catch { /* ruta mal codificada */ }
    p = p.replace(/\/+$/, "") || "/";
    if (p.startsWith("/dashboard/editar-producto")) return "/dashboard/productos";
    return ALIAS[p] || p;
};

const grupoDeRuta = (ruta) => menuItems.find(g => g.items.some(i => i.to === ruta))?.key || null;

const COLLAPSE_KEY = "cf_sidebar_collapsed";

/* ── Colores ── */
const BG         = "#1a2540";
const ACCENT     = "#4f8ef7";
const TEXT_MAIN  = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const DIVIDER    = "rgba(255,255,255,0.08)";

/*
 * Estilos .cf-* compartidos por las páginas de Configuración, Usuarios e Indicadores.
 * Se inyectan desde la barra lateral porque está montada en todo el panel administrativo.
 */
const CF_SHARED_CSS = `
@keyframes cf-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes cf-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cf-pop { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes cf-shimmer { 0% { background-position: -460px 0; } 100% { background-position: 460px 0; } }
@keyframes cf-shake { 10%,90% { transform: translateX(-1px); } 20%,80% { transform: translateX(2px); } 30%,50%,70% { transform: translateX(-3px); } 40%,60% { transform: translateX(3px); } }
@keyframes cf-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes cf-spin { to { transform: rotate(360deg); } }
@keyframes cf-pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,.45); } 70% { box-shadow: 0 0 0 6px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }

.cf-page { animation: cf-fade-up .35s ease both; }
.cf-title::after { content: ""; display: block; width: 34px; height: 3px; border-radius: 3px; margin-top: 7px;
  background: linear-gradient(90deg, #4f8ef7, #7c3aed); transition: width .45s cubic-bezier(.2,.8,.2,1); }
.cf-page:hover .cf-title::after { width: 60px; }

.cf-btn { position: relative; overflow: hidden; transition: transform .18s, box-shadow .18s, background .18s, opacity .18s !important; }
.cf-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(26,37,64,.28) !important; }
.cf-btn:active:not(:disabled) { transform: translateY(0) scale(.98); }
.cf-btn::after { content: ""; position: absolute; top: 0; left: -75%; width: 45%; height: 100%; transform: skewX(-20deg);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent); transition: left .6s ease; pointer-events: none; }
.cf-btn:hover:not(:disabled)::after { left: 130%; }
.cf-btn-ghost { transition: background .18s, color .18s, border-color .18s !important; }
.cf-btn-ghost:hover:not(:disabled) { background: #e2e8f0 !important; color: #1a2540 !important; }

.cf-search input { transition: border-color .2s, box-shadow .2s, width .3s !important; }
.cf-search input:focus { border-color: #4f8ef7 !important; box-shadow: 0 0 0 4px rgba(79,142,247,.15); }
.cf-search svg { transition: color .2s; }
.cf-search:focus-within svg { color: #4f8ef7 !important; }

.cf-table-card { transition: box-shadow .25s; }
.cf-table-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,.09), 0 0 0 1px #e8eef8 !important; }
.cf-row { animation: cf-fade-up .32s ease both; }
.cf-row td { transition: background .15s, box-shadow .15s; vertical-align: middle; }
.cf-row:hover td { background: #eef4ff; }
.cf-row:hover td:first-child { box-shadow: inset 3px 0 0 #4f8ef7; }

.cf-ib { transition: transform .18s, background .18s, color .18s, box-shadow .18s, border-color .18s !important; }
.cf-ib:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 6px 14px rgba(15,23,42,.14); }
.cf-ib:active { transform: scale(.95); }
.cf-ib-view:hover  { background: #4f8ef7 !important; color: #fff !important; border-color: #4f8ef7 !important; }
.cf-ib-edit:hover  { background: #d97706 !important; color: #fff !important; border-color: #d97706 !important; }
.cf-ib-del:hover   { background: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; }
.cf-ib-state:hover { background: #7c3aed !important; color: #fff !important; border-color: #7c3aed !important; }

.cf-skel { display: block; height: 12px; border-radius: 6px;
  background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%); background-size: 920px 100%;
  animation: cf-shimmer 1.25s linear infinite; }

.cf-empty { padding: 50px 16px; text-align: center; animation: cf-fade-up .4s ease both; }
.cf-empty-ic { width: 66px; height: 66px; border-radius: 20px; margin: 0 auto 14px; display: grid; place-items: center;
  background: linear-gradient(135deg, #eef4ff, #f3e8ff); color: #4f8ef7; font-size: 26px;
  box-shadow: 0 10px 24px rgba(79,142,247,.18); animation: cf-float 3.2s ease-in-out infinite; }
.cf-empty-t { margin: 0 0 4px; font-weight: 800; font-size: 15px; color: #1a2540; }
.cf-empty-s { margin: 0 0 16px; font-size: 13px; color: #64748b; }

.cf-badge { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.cf-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; display: inline-block; }
.cf-dot-live { animation: cf-pulse-dot 2s infinite; }

.cf-overlay { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); animation: cf-fade .2s ease both; }
.cf-modal { animation: cf-pop .3s cubic-bezier(.2,.8,.2,1) both; }
.cf-field { transition: transform .18s, box-shadow .18s, background .18s; }
.cf-field:hover { background: #eef4ff !important; transform: translateX(3px); }
.cf-x { transition: background .18s, transform .25s !important; }
.cf-x:hover { background: rgba(255,255,255,.28) !important; transform: rotate(90deg); }

.cf-form { animation: cf-pop .32s cubic-bezier(.2,.8,.2,1) both; }
.cf-form .form-label { font-size: 13px; margin-bottom: 6px; }
.cf-form .form-control, .cf-form .form-select, .cf-input {
  border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13.5px; padding: 9px 13px;
  transition: border-color .18s, box-shadow .18s, background .18s; }
.cf-form .form-control:focus, .cf-form .form-select:focus, .cf-input:focus {
  border-color: #4f8ef7 !important; box-shadow: 0 0 0 4px rgba(79,142,247,.15) !important; outline: none; }
.cf-form .form-control.is-invalid, .cf-form .form-select.is-invalid, .cf-input.cf-invalid {
  border-color: #dc2626 !important; background-color: #fff7f7; animation: cf-shake .38s ease; }
.cf-form .form-control.is-invalid:focus, .cf-input.cf-invalid:focus { box-shadow: 0 0 0 4px rgba(220,38,38,.12) !important; }
.cf-form .form-control:disabled, .cf-form .form-control[readonly], .cf-form .form-select:disabled { background: #f1f5f9; color: #64748b; }
.cf-form .invalid-feedback, .cf-err { display: flex !important; align-items: center; gap: 6px; color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 6px; animation: cf-fade-up .2s ease both; }
.cf-form .invalid-feedback::before, .cf-err::before { content: "!"; display: inline-grid; place-items: center; width: 15px; height: 15px; border-radius: 50%;
  background: #dc2626; color: #fff; font-size: 10px; font-weight: 800; flex-shrink: 0; }
.cf-hint { display: block; margin-top: 5px; font-size: 11.5px; color: #94a3b8; }
.cf-section { background: #fff; border: 1px solid #eef2f7; border-radius: 16px; padding: 22px; }

.cf-kpi { position: relative; overflow: hidden; transition: transform .25s, box-shadow .25s; animation: cf-fade-up .4s ease both; }
.cf-kpi:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(15,23,42,.10); }
.cf-kpi::after { content: ""; position: absolute; right: -28px; top: -28px; width: 110px; height: 110px; border-radius: 50%;
  background: currentColor; opacity: .06; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.cf-kpi:hover::after { transform: scale(1.35); }
.cf-kpi-ic { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
.cf-kpi:hover .cf-kpi-ic { transform: rotate(-8deg) scale(1.08); }
.cf-chart { transition: transform .25s, box-shadow .25s; animation: cf-fade-up .45s ease both; }
.cf-chart:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(15,23,42,.08), 0 0 0 1px #e8eef8 !important; }

.cf-pager button { transition: all .18s; }
.cf-pager button:not(:disabled):hover { transform: translateY(-1px); }

@media (prefers-reduced-motion: reduce) {
  .cf-page, .cf-row, .cf-kpi, .cf-chart, .cf-form, .cf-modal, .cf-empty, .cf-empty-ic, .cf-skel { animation: none !important; }
}
`;

const Sidebar = () => {
    const location  = useLocation();
    const actual    = rutaActiva(location.pathname);
    const [open, setOpen] = useState(() => grupoDeRuta(actual) || "ventas");
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
    });

    // Al navegar, abre el grupo que contiene la ruta actual
    useEffect(() => {
        const g = grupoDeRuta(actual);
        if (g) setOpen(g);
    }, [actual]);

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* sin storage */ }
    }, [collapsed]);

    const toggle = (key) => {
        // Colapsado: el grupo no puede desplegarse, así que se expande la barra y se abre
        if (collapsed) { setCollapsed(false); setOpen(key); return; }
        setOpen(prev => prev === key ? null : key);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                ${CF_SHARED_CSS}

                /* La columna del layout se adapta al ancho real de la barra (colapsar libera espacio) */
                aside.col-2:has(> .cf-sb) { flex: 0 0 auto; width: auto; max-width: none; }
                aside.col-2:has(> .cf-sb) + .col-10 { flex: 1 1 0; width: auto; max-width: none; min-width: 0; }

                .cf-sb { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
                .cf-sb nav::-webkit-scrollbar { width: 6px; }
                .cf-sb nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 6px; }

                .sb-group-btn {
                    width: 100%; background: none; border: none; cursor: pointer;
                    display: flex; align-items: center; padding: 9px 12px; border-radius: 10px; gap: 10px;
                    transition: background 0.2s, color 0.2s;
                    font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
                    color: ${TEXT_MAIN}; letter-spacing: 0.01em; text-align: left; overflow: hidden; position: relative;
                }
                .sb-group-btn:hover { background: rgba(255,255,255,0.07); }
                .sb-group-btn:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 1px; }
                .sb-group-btn .sb-icon {
                    flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.08); color: rgba(255,255,255,.85);
                    transition: background .25s, color .25s, transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .25s;
                }
                .sb-group-btn:hover .sb-icon { transform: scale(1.08) rotate(-6deg); background: rgba(255,255,255,0.14); color: #fff; }
                .sb-group.has-active > .sb-group-btn .sb-icon {
                    background: linear-gradient(135deg, ${ACCENT}, #7c3aed); color: #fff;
                    box-shadow: 0 6px 16px rgba(79,142,247,.4);
                }
                .sb-group.has-active > .sb-group-btn { color: #fff; }

                .sb-chevron { margin-left: auto; flex-shrink: 0; color: ${TEXT_MUTED}; transition: transform 0.3s cubic-bezier(.2,.8,.2,1), color .2s; }
                .sb-chevron.open { transform: rotate(180deg); color: ${ACCENT}; }

                /* Submenú: animación de altura real con grid (sin cálculos de max-height) */
                .sb-subnav { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .32s cubic-bezier(.4,0,.2,1), opacity .25s; }
                .sb-subnav.open { grid-template-rows: 1fr; opacity: 1; }
                .sb-subnav > div { overflow: hidden; min-height: 0; }
                .sb-subnav-inner { position: relative; margin: 2px 0 4px 26px; padding-left: 8px; }
                .sb-subnav-inner::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 1px; background: rgba(255,255,255,.1); }

                .sb-link {
                    display: flex; align-items: center; gap: 9px; padding: 7px 10px 7px 12px; margin: 2px 0;
                    border-radius: 8px; font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 500;
                    color: rgba(255,255,255,0.68); text-decoration: none; position: relative;
                    transition: background .2s, color .2s, padding-left .25s cubic-bezier(.2,.8,.2,1);
                }
                .sb-link:hover { background: rgba(255,255,255,0.07); color: #fff; padding-left: 16px; }
                .sb-link:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 1px; }
                .sb-link::before {
                    content: ''; position: absolute; left: -9px; top: 50%; height: 0; width: 3px; border-radius: 3px;
                    background: linear-gradient(180deg, ${ACCENT}, #7c3aed); transform: translateY(-50%);
                    transition: height .3s cubic-bezier(.2,.8,.2,1);
                }
                .sb-link.active {
                    background: linear-gradient(90deg, rgba(79,142,247,.24), rgba(124,58,237,.10));
                    color: #fff; font-weight: 700;
                }
                .sb-link.active::before { height: 70%; }
                .sb-link-icon { flex-shrink: 0; opacity: 0.65; transition: opacity .2s, color .2s, transform .25s; display: inline-flex; }
                .sb-link:hover .sb-link-icon { opacity: 1; transform: scale(1.1); }
                .sb-link.active .sb-link-icon { opacity: 1; color: ${ACCENT}; }

                .sb-collapse-btn {
                    width: 100%; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 12px; border-radius: 10px;
                    color: ${TEXT_MUTED}; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600;
                    transition: all 0.2s; letter-spacing: 0.05em; text-transform: uppercase;
                }
                .sb-collapse-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
                .sb-collapse-btn svg { transition: transform .25s; }
                .sb-collapse-btn:hover svg { transform: translateX(${collapsed ? "3px" : "-3px"}); }

                .sb-brand { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 18px; color: #fff; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; animation: cf-fade .3s ease both; }
                .sb-brand-ic { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
                .sb-brand-wrap:hover .sb-brand-ic { transform: rotate(-10deg) scale(1.06); }
                .sb-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; animation: cf-fade .25s ease both; }
            `}</style>

            {/* ── El aside usa height: 100% para estirarse con el layout padre ── */}
            <aside className="cf-sb" style={{
                width: collapsed ? "72px" : "240px",
                height: "100%",
                minHeight: "100vh",
                background: `linear-gradient(180deg, ${BG} 0%, #18223b 60%, #141d33 100%)`,
                display: "flex",
                flexDirection: "column",
                transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
                flexShrink: 0,
                overflow: "hidden",
                boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
                position: "sticky",
                top: 0,
                alignSelf: "flex-start",
            }}>

                {/* ── BRAND ── */}
                <div className="sb-brand-wrap" style={{
                    padding: "20px 18px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                    borderBottom: `1px solid ${DIVIDER}`, minHeight: 64,
                }}>
                    <div className="sb-brand-ic" style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, boxShadow: `0 6px 16px ${ACCENT}55`
                    }}>
                        <FaChartBar size={16} color="#fff" />
                    </div>
                    {!collapsed && <span className="sb-brand">Admin</span>}
                </div>

                {/* ── MENÚ ── */}
                <nav style={{
                    flex: 1, overflowY: "auto", overflowX: "hidden",
                    padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2,
                }}>
                    {menuItems.map((group) => {
                        const tieneActivo = group.items.some(i => i.to === actual);
                        const abierto = !collapsed && open === group.key;
                        return (
                            <div key={group.key} className={`sb-group ${tieneActivo ? "has-active" : ""}`}>
                                <button
                                    className="sb-group-btn"
                                    onClick={() => toggle(group.key)}
                                    title={collapsed ? group.title : undefined}
                                    aria-expanded={abierto}
                                    style={collapsed ? { justifyContent: "center", padding: "9px 0" } : undefined}
                                >
                                    <span className="sb-icon">{group.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span className="sb-label">{group.title}</span>
                                            <FaChevronDown size={11} className={`sb-chevron ${abierto ? "open" : ""}`} />
                                        </>
                                    )}
                                </button>

                                {!collapsed && (
                                    <div className={`sb-subnav ${abierto ? "open" : ""}`}>
                                        <div>
                                            <div className="sb-subnav-inner">
                                                {group.items.map(item => (
                                                    <Link
                                                        key={item.to}
                                                        to={item.to}
                                                        tabIndex={abierto ? 0 : -1}
                                                        className={`sb-link ${actual === item.to ? "active" : ""}`}
                                                        aria-current={actual === item.to ? "page" : undefined}
                                                    >
                                                        <span className="sb-link-icon">{item.icon}</span>
                                                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {item.label}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* ── COLAPSAR ── */}
                <div style={{ padding: "12px 8px", borderTop: `1px solid ${DIVIDER}` }}>
                    <button className="sb-collapse-btn" onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? "Expandir menú" : "Colapsar menú"}>
                        {collapsed
                            ? <FaAngleDoubleRight size={14} />
                            : <><FaAngleDoubleLeft size={14} /> <span>Colapsar</span></>
                        }
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
