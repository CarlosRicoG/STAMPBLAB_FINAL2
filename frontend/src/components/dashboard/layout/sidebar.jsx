import {
    FaUsers, FaClipboardList, FaBox, FaTshirt, FaPalette,
    FaRuler, FaChartBar, FaCogs, FaUserCog, FaTools,
    FaShoppingCart, FaWarehouse, FaChartLine, FaBars, FaClock
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const menuItems = [
    {
        title: "Configuración",
        key: "roles",
        icon: <FaCogs className="me-2" />,
        items: [
            { to: "/dashboard/roles", label: "Roles", icon: <FaClipboardList className="me-2" /> }
        ]
    },
    {
        title: "Gestión de Usuarios",
        key: "usuarios",
        icon: <FaUserCog className="me-2" />,
        items: [
            { to: "/dashboard/usuarios", label: "Usuarios", icon: <FaUsers className="me-2" /> },
        ]
    },
    {
        title: "Servicios",
        key: "tecnicas",
        icon: <FaTools className="me-2" />,
        items: [
            { to: "/dashboard/tecnicas", label: "Técnicas", icon: <FaTools className="me-2" /> },
        ]
    },
    {
        title: "Ventas",
        key: "ventas",
        icon: <FaShoppingCart className="me-2" />,
        items: [
            { to: "/dashboard/ventas-pendientes", label: "Ventas Pendientes", icon: <FaClock className="me-2" /> },
            { to: "/dashboard/ventas", label: "Ventas", icon: <FaBox className="me-2" /> },
            { to: "/dashboard/cotizaciones", label: "Cotizaciones", icon: <FaClipboardList className="me-2" /> },
            { to: "/dashboard/productos", label: "Productos", icon: <FaBox className="me-2" /> },
        ]
    },
    {
        title: "Características Producto",
        key: "caracteristicasproducto",
        icon: <FaTshirt className="me-2" />,
        items: [
            { to: "/dashboard/tallas", label: "Tallas", icon: <FaRuler className="me-2" /> },
            { to: "/dashboard/colores", label: "Colores", icon: <FaPalette className="me-2" /> }
        ]
    },
    {
        title: "Administración Insumos",
        key: "insumos",
        icon: <FaBox className="me-2" />,
        items: [
            { to: "/dashboard/insumos", label: "Insumos", icon: <FaBox className="me-2" /> },
        ]
    },
    {
        title: "Proceso Compras",
        key: "procesocompras",
        icon: <FaWarehouse className="me-2" />,
        items: [
            { to: "/dashboard/pedidos", label: "Compras", icon: <FaClipboardList className="me-2" /> },
            { to: "/dashboard/proveedores", label: "Proveedores", icon: <FaWarehouse className="me-2" /> }
        ]
    },
    {
        title: "Indicadores",
        key: "indicadores",
        icon: <FaChartBar className="me-2" />,
        items: [
            { to: "/dashboard/mediciondesempeño", label: "Medición y Desempeño", icon: <FaChartLine className="me-2" /> }
        ]
    }
];

const Sidebar = () => {
    const location = useLocation();
    const [open, setOpen] = useState("ventas"); // Cambié el default a "ventas" para que se vea abierto
    const [collapsed, setCollapsed] = useState(false);

    const handleToggle = (key) => {
        setOpen(open === key ? null : key);
    };

    return (
        <aside
            className="d-flex flex-column p-3 bg-primary"
            style={{
                width: collapsed ? "80px" : "250px",
                transition: "width 0.3s ease",
                height: "160vh",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                color: "#fff",
                overflow: "hidden"
            }}
        >
            {/* Header con ADMIN + botón */}
            <div
                className="d-flex align-items-center mb-3"
                style={{
                    borderBottom: "2px solid rgba(255,255,255,0.3)",
                    paddingBottom: "8px"
                }}
            >
                {!collapsed && (
                    <span
                        className="fw-bold fs-5 flex-grow-1"
                        style={{
                            color: "#fff",
                            letterSpacing: 2
                        }}
                    >
                        ADMIN
                    </span>
                )}

                <div
                    className={collapsed ? "w-100 d-flex justify-content-center" : ""}
                >
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="btn btn-link"
                        style={{
                            color: "#fff",
                            fontSize: "24px",
                            fontWeight: "bold",
                            transition: "transform 0.2s",
                            padding: collapsed ? "6px 10px" : "0"
                        }}
                    >
                        <FaBars className="me-4" />
                    </button>
                </div>
            </div>

            {/* Menú */}
            <nav className="flex-grow-1" style={{ overflowY: "auto" }}>
                {menuItems.map((group, idx) => (
                    <div key={group.key} className={idx === menuItems.length - 1 ? "" : "mb-2"}>
                        <button
                            className="btn btn-link text-white w-100 d-flex align-items-center justify-content-between px-0"
                            style={{
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: 15,
                                opacity: 0.9
                            }}
                            onClick={() => handleToggle(group.key)}
                            tabIndex={0}
                        >
                            <span className="d-flex align-items-center">
                                {group.icon}
                                {!collapsed && group.title}
                            </span>
                            {!collapsed && (
                                <span
                                    style={{
                                        fontSize: 18,
                                        transition: "transform 0.2s",
                                        transform: open === group.key ? "rotate(90deg)" : "rotate(0deg)"
                                    }}
                                ></span>
                            )}
                        </button>

                        {/* Submenú */}
                        {!collapsed && (
                            <ul
                                className="nav flex-column ps-3"
                                style={{
                                    maxHeight: open === group.key ? `${group.items.length * 65}px` : "0",
                                    overflow: "hidden",
                                    transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)"
                                }}
                            >
                                {group.items.map((item) => (
                                    <li className="nav-item mb-1" key={item.to}>
                                        <Link
                                            to={item.to}
                                            className={`nav-link d-flex align-items-center ${location.pathname === item.to ? "text-white" : "active"
                                                }`}
                                            style={{
                                                background: location.pathname === item.to
                                                    ? "rgba(255,255,255,0.2)"
                                                    : "transparent",
                                                color: location.pathname === item.to
                                                    ? "#fff"
                                                    : "rgba(255,255,255,0.85)",
                                                borderRadius: 8,
                                                fontWeight: location.pathname === item.to ? 700 : 500,
                                                boxShadow: location.pathname === item.to
                                                    ? "0 2px 6px rgba(0,0,0,0.3)"
                                                    : "none",
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            {item.icon}
                                            {!collapsed && item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;