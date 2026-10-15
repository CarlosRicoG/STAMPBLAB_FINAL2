import {
    FaUsers, FaClipboardList, FaBox, FaTshirt, FaPalette,
    FaRuler, FaChartBar, FaCogs, FaUserCog, FaTools,
    FaShoppingCart, FaWarehouse, FaChartLine, FaClock,
    FaChevronDown, FaAngleDoubleLeft, FaAngleDoubleRight
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

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

/* ── Colores ── */
const BG         = "#1a2540";
const BG_HOVER   = "rgba(255,255,255,0.07)";
const BG_ACTIVE  = "rgba(255,255,255,0.15)";
const ACCENT     = "#4f8ef7";
const TEXT_MAIN  = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const DIVIDER    = "rgba(255,255,255,0.08)";

const Sidebar = () => {
    const location  = useLocation();
    const [open, setOpen]           = useState("ventas");
    const [collapsed, setCollapsed] = useState(false);

    const toggle = (key) => setOpen(prev => prev === key ? null : key);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

                .sb-group-btn {
                    width: 100%;
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 9px 12px;
                    border-radius: 10px;
                    gap: 10px;
                    transition: background 0.18s;
                    font-family: 'Outfit', sans-serif;
                    font-size: 13px;
                    font-weight: 600;
                    color: ${TEXT_MAIN};
                    letter-spacing: 0.01em;
                    text-align: left;
                    overflow: hidden;
                }
                .sb-group-btn:hover { background: ${BG_HOVER}; }

                .sb-group-btn .sb-icon {
                    flex-shrink: 0;
                    width: 28px;
                    height: 28px;
                    border-radius: 7px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                }

                .sb-chevron {
                    margin-left: auto;
                    flex-shrink: 0;
                    color: ${TEXT_MUTED};
                    transition: transform 0.25s ease;
                }
                .sb-chevron.open { transform: rotate(180deg); color: ${ACCENT}; }

                .sb-subnav {
                    overflow: hidden;
                    transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s;
                }

                .sb-link {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    padding: 7px 10px 7px 14px;
                    margin: 1px 0;
                    border-radius: 8px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 12.5px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.72);
                    text-decoration: none;
                    transition: all 0.18s;
                    position: relative;
                }
                .sb-link:hover {
                    background: ${BG_HOVER};
                    color: #fff;
                }
                .sb-link.active {
                    background: ${BG_ACTIVE};
                    color: #fff;
                    font-weight: 700;
                }
                .sb-link.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 20%;
                    height: 60%;
                    width: 3px;
                    border-radius: 0 3px 3px 0;
                    background: ${ACCENT};
                }

                .sb-link-icon {
                    flex-shrink: 0;
                    opacity: 0.7;
                }
                .sb-link.active .sb-link-icon { opacity: 1; color: ${ACCENT}; }

                .sb-collapse-btn {
                    width: 100%;
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    color: ${TEXT_MUTED};
                    font-family: 'Outfit', sans-serif;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.18s;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .sb-collapse-btn:hover { background: ${BG_HOVER}; color: #fff; }

                .sb-brand {
                    font-family: 'Outfit', sans-serif;
                    font-weight: 800;
                    font-size: 18px;
                    color: #fff;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .sb-divider {
                    height: 1px;
                    background: ${DIVIDER};
                    margin: 8px 0;
                }
            `}</style>

            {/* ── El aside ahora usa height: 100% para estirarse con el layout padre ── */}
            <aside style={{
                width: collapsed ? "68px" : "240px",
                height: "100%",          /* ← clave: ocupa todo el alto del flex padre */
                minHeight: "100vh",       /* ← fallback por si el padre no tiene altura */
                background: BG,
                display: "flex",
                flexDirection: "column",
                transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
                flexShrink: 0,
                overflow: "hidden",
                boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
                position: "sticky",       /* ← se queda fijo al hacer scroll */
                top: 0,
                alignSelf: "flex-start", /* ← necesario para sticky en flex */
            }}>

                {/* ── BRAND ── */}
                <div style={{
                    padding: "20px 16px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: `1px solid ${DIVIDER}`,
                    minHeight: 64,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: ACCENT,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${ACCENT}55`
                    }}>
                        <FaChartBar size={16} color="#fff" />
                    </div>
                    {!collapsed && <span className="sb-brand">Admin</span>}
                </div>

                {/* ── MENÚ ── */}
                <nav style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: "12px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}>
                    {menuItems.map((group) => (
                        <div key={group.key}>
                            <button
                                className="sb-group-btn"
                                onClick={() => toggle(group.key)}
                                title={collapsed ? group.title : undefined}
                            >
                                <span className="sb-icon">{group.icon}</span>
                                {!collapsed && (
                                    <>
                                        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {group.title}
                                        </span>
                                        <FaChevronDown
                                            size={11}
                                            className={`sb-chevron ${open === group.key ? "open" : ""}`}
                                        />
                                    </>
                                )}
                            </button>

                            {!collapsed && (
                                <div
                                    className="sb-subnav"
                                    style={{
                                        maxHeight: open === group.key ? `${group.items.length * 40}px` : "0px",
                                        opacity: open === group.key ? 1 : 0,
                                        paddingLeft: 8,
                                    }}
                                >
                                    {group.items.map(item => (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={`sb-link ${location.pathname === item.to ? "active" : ""}`}
                                        >
                                            <span className="sb-link-icon">{item.icon}</span>
                                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* ── COLAPSAR ── */}
                <div style={{ padding: "12px 8px", borderTop: `1px solid ${DIVIDER}` }}>
                    <button className="sb-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
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