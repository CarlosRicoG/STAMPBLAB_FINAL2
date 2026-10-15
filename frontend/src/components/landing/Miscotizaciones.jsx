import React, { useState, useEffect } from 'react';
import {
    FaEye, FaBoxOpen, FaTshirt, FaPalette, FaImage, FaCheckCircle,
    FaTimesCircle, FaClock, FaExchangeAlt, FaTag, FaRuler, FaTint,
    FaLayerGroup, FaChevronRight, FaStar, FaCalendarAlt
} from 'react-icons/fa';
import FooterComponent from './footer';
import NavbarComponent from './NavBarLanding';

// ── Design tokens ──
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyDeep: "linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    purple: "#7c3aed",
    purpleSoft: "#f5f3ff",
    purpleBorder: "#ddd6fe",
    info: "#0369a1",
    infoSoft: "#e0f2fe",
    infoBorder: "#bae6fd",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    white: "#ffffff",
};


const formatPrecio = (valor) =>
    (parseFloat(valor) || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });


const estadoConfig = {
    'Pendiente': { color: C.warning, bg: C.warningSoft, border: C.warningBorder, icon: <FaClock size={11} />, type: "warning" },
    'Aprobada': { color: C.success, bg: C.successSoft, border: C.successBorder, icon: <FaCheckCircle size={11} />, type: "success" },
    'Rechazada': { color: C.danger, bg: C.dangerSoft, border: C.dangerBorder, icon: <FaTimesCircle size={11} />, type: "danger" },
    'Cancelada': { color: C.danger, bg: C.dangerSoft, border: C.dangerBorder, icon: <FaTimesCircle size={11} />, type: "danger" },
    'Procesada': { color: C.info, bg: C.infoSoft, border: C.infoBorder, icon: <FaExchangeAlt size={11} />, type: "info" },
};
const getEstado = (nombre) => estadoConfig[nombre] || { color: C.muted, bg: "#f1f5f9", border: C.border, icon: <FaClock size={11} />, type: "muted" };

const formatearFecha = (fecha, conHora = false) =>
    new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {})
    });

// ── Badge ──
const Badge = ({ children, tipo }) => {
    const e = getEstado(children);
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: e.bg, color: e.color, border: `1px solid ${e.border}`,
            borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif"
        }}>
            {e.icon} {children}
        </span>
    );
};

// ── Imagen ampliada ──
const ImagenModal = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ animation: "modalIn 0.22s ease" }}>
                <img src={src} alt="Diseño ampliado" style={{ maxWidth: "88vw", maxHeight: "78vh", borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", objectFit: "contain" }} />
                <div style={{ textAlign: "center", marginTop: 18 }}>
                    <button onClick={onClose} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 24, padding: "9px 26px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────
// MODAL DETALLE
// ─────────────────────────────────────────────────────
const ModalDetalleCotizacion = ({ cotizacion, onClose }) => {
    const [imagenAmpliada, setImagenAmpliada] = useState(null);
    const estadoNombre = cotizacion.estado?.Nombre || 'Pendiente';
    const est = getEstado(estadoNombre);

    return (
        <>
            <ImagenModal src={imagenAmpliada} onClose={() => setImagenAmpliada(null)} />

            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                onClick={onClose}>
                <div style={{ background: C.white, borderRadius: 22, width: "100%", maxWidth: 980, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalIn 0.25s ease", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ background: C.navyDeep, padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: -50, left: -50, width: 250, height: 250, background: "radial-gradient(circle,rgba(79,142,247,0.13) 0%,transparent 65%)", pointerEvents: "none" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 22, color: "#fff", letterSpacing: "-0.02em", fontFamily: "'Outfit',sans-serif" }}>
                                Cotización #{cotizacion.CotizacionID}
                            </h2>
                            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Outfit',sans-serif" }}>
                                <FaCalendarAlt size={10} style={{ marginRight: 5 }} />
                                {formatearFecha(cotizacion.FechaCotizacion, true)}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>✕</button>
                    </div>

                    {/* Accent line */}
                    <div style={{ height: 3, background: "linear-gradient(90deg,#4f8ef7 0%,#7c3aed 50%,#4f8ef7 100%)" }} />

                    {/* Body */}
                    <div style={{ overflowY: "auto", flex: 1, padding: "26px 28px" }}>

                        {/* Resumen estado + valor */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                            <div style={{ background: est.bg, border: `1.5px solid ${est.border}`, borderRadius: 16, padding: "18px 20px" }}>
                                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Outfit',sans-serif" }}>Estado</p>
                                <Badge>{estadoNombre}</Badge>
                            </div>
                            <div style={{ background: C.successSoft, border: `1.5px solid ${C.successBorder}`, borderRadius: 16, padding: "18px 20px" }}>
                                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Outfit',sans-serif" }}>Valor Total</p>
                                <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.success, letterSpacing: "-0.02em", fontFamily: "'Outfit',sans-serif" }}>
                                    ${formatPrecio(cotizacion.ValorTotal)}
                                </p>
                                {cotizacion.ValorTotal === 0 && (
                                    <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Pendiente de asignación</p>
                                )}
                            </div>
                        </div>

                        {/* Título sección detalles */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(180deg,#4f8ef7,#7c3aed)" }} />
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>
                                Productos cotizados ({cotizacion.detalles?.length || 0})
                            </p>
                        </div>

                        {cotizacion.detalles?.map((detalle, index) => {
                            const esPrendaPropia = detalle.TraePrenda;
                            return (
                                <div key={index} style={{ border: `1.5px solid ${C.border}`, borderRadius: 18, marginBottom: 18, overflow: "hidden", background: "#fafcff" }}>

                                    {/* Cabecera producto */}
                                    <div style={{ padding: "16px 20px", borderBottom: `1.5px solid ${C.border}`, display: "flex", gap: 16, alignItems: "center" }}>
                                        {/* Imagen producto */}
                                        <div style={{ width: 80, height: 80, borderRadius: 14, overflow: "hidden", border: `2px solid ${C.border}`, flexShrink: 0, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {esPrendaPropia ? (
                                                <FaTshirt size={32} style={{ color: C.accent, opacity: 0.5 }} />
                                            ) : detalle.producto?.ImagenProducto ? (
                                                <img src={detalle.producto.ImagenProducto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                <FaBoxOpen size={28} style={{ color: C.muted, opacity: 0.4 }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 16, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                                Producto {index + 1}: {esPrendaPropia ? "Prenda del cliente" : (detalle.producto?.Nombre || "Sin nombre")}
                                            </p>
                                            {esPrendaPropia && detalle.PrendaDescripcion && (
                                                <div style={{ background: C.warningSoft, border: `1px solid ${C.warningBorder}`, borderRadius: 8, padding: "6px 12px", marginBottom: 6 }}>
                                                    <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontFamily: "'Outfit',sans-serif" }}>
                                                        <strong>Descripción:</strong> {detalle.PrendaDescripcion}
                                                    </p>
                                                </div>
                                            )}
                                            <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                                <strong style={{ color: C.navy }}>Cantidad:</strong> {detalle.Cantidad} unidad{detalle.Cantidad !== 1 ? "es" : ""}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tallas / colores / telas (solo si no es prenda propia) */}
                                    {!esPrendaPropia && (detalle.tallas?.length > 0 || detalle.colores?.length > 0 || detalle.insumos?.length > 0) && (
                                        <div style={{ padding: "12px 20px", borderBottom: `1.5px solid ${C.border}`, display: "flex", gap: 20, flexWrap: "wrap", background: C.accentSoft }}>
                                            {detalle.tallas?.length > 0 && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <FaRuler size={12} style={{ color: C.accent }} />
                                                    <span style={{ fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                                                        <strong style={{ color: C.navy }}>Tallas:</strong>{" "}
                                                        <span style={{ color: C.muted }}>{detalle.tallas.map(t => `${t.talla?.Nombre} (${t.Cantidad})`).join(", ")}</span>
                                                    </span>
                                                </div>
                                            )}
                                            {detalle.colores?.length > 0 && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <FaTint size={12} style={{ color: C.accent }} />
                                                    <span style={{ fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                                                        <strong style={{ color: C.navy }}>Colores:</strong>{" "}
                                                        <span style={{ color: C.muted }}>{detalle.colores.map(c => `${c.color?.Nombre} (${c.Cantidad})`).join(", ")}</span>
                                                    </span>
                                                </div>
                                            )}
                                            {detalle.insumos?.length > 0 && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <FaLayerGroup size={12} style={{ color: C.accent }} />
                                                    <span style={{ fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>
                                                        <strong style={{ color: C.navy }}>Telas:</strong>{" "}
                                                        <span style={{ color: C.muted }}>{detalle.insumos.map(i => `${i.insumo?.Nombre} × ${i.CantidadRequerida}`).join(", ")}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Diseños aplicados */}
                                    {detalle.tecnicas?.length > 0 && (
                                        <div style={{ padding: "16px 20px" }}>
                                            <p style={{ margin: "0 0 14px", fontWeight: 700, color: C.purple, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                                                <FaPalette size={13} /> Diseños aplicados ({detalle.tecnicas.length})
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                {detalle.tecnicas.map((tec, tidx) => {
                                                    // Parsear observaciones para extraer subparte y observación
                                                    let subparte = "";
                                                    let observacion = tec.Observaciones || "";
                                                    if (observacion.startsWith("Subparte: ")) {
                                                        const partes = observacion.split(" - ");
                                                        subparte = partes[0].replace("Subparte: ", "").trim();
                                                        observacion = partes.slice(1).join(" - ").trim();
                                                    }

                                                    return (
                                                        <div key={tidx} style={{ background: C.white, border: `1.5px solid ${C.purpleBorder}`, borderRadius: 14, overflow: "hidden", transition: "box-shadow 0.2s" }}
                                                            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px rgba(124,58,237,0.12)`}
                                                            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

                                                            {/* Header del diseño */}
                                                            <div style={{ background: `linear-gradient(90deg, ${C.purpleSoft} 0%, ${C.accentSoft} 100%)`, padding: "10px 16px", borderBottom: `1px solid ${C.purpleBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>
                                                                        {tidx + 1}
                                                                    </div>
                                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                                                        {tec.tecnica?.Nombre || "Técnica N/A"}
                                                                    </p>
                                                                </div>
                                                                <div style={{ textAlign: "right" }}>
                                                                    {tec.CostoTecnica && parseFloat(tec.CostoTecnica) > 0 ? (
                                                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.success, fontFamily: "'Outfit',sans-serif" }}>
                                                                            ${formatPrecio(tec.CostoTecnica)}
                                                                        </p>
                                                                    ) : (
                                                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.warning, background: C.warningSoft, border: `1px solid ${C.warningBorder}`, borderRadius: 20, padding: "2px 10px", fontFamily: "'Outfit',sans-serif" }}>
                                                                            Sin precio asignado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Cuerpo del diseño */}
                                                            <div style={{ padding: "14px 16px", display: "flex", gap: 16, alignItems: "flex-start" }}>

                                                                {/* Imagen del diseño */}
                                                                {tec.ImagenUrl ? (
                                                                    <div style={{ flexShrink: 0 }}>
                                                                        <div style={{ width: 90, height: 90, borderRadius: 12, overflow: "hidden", border: `2px solid ${C.purpleBorder}`, cursor: "pointer", position: "relative" }}
                                                                            onClick={() => setImagenAmpliada(tec.ImagenUrl)}
                                                                            onMouseEnter={e => { e.currentTarget.querySelector('.img-overlay').style.opacity = "1"; }}
                                                                            onMouseLeave={e => { e.currentTarget.querySelector('.img-overlay').style.opacity = "0"; }}>
                                                                            <img src={tec.ImagenUrl} alt="Diseño"
                                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                                onError={e => { e.target.style.display = "none"; }}
                                                                            />
                                                                            <div className="img-overlay" style={{ position: "absolute", inset: 0, background: "rgba(121, 113, 113, 0.56)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", borderRadius: 10 }}>
                                                                                <p style={{ margin: 0, color: "#fff", fontSize: 10, fontWeight: 700, textAlign: "center", fontFamily: "'Outfit',sans-serif" }}>Ampliar</p>
                                                                            </div>
                                                                        </div>
                                                                        <p style={{ margin: "5px 0 0", fontSize: 9, color: C.muted, textAlign: "center", fontFamily: "'Outfit',sans-serif" }}>Click para ampliar</p>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ width: 90, height: 90, borderRadius: 12, background: C.purpleSoft, border: `2px dashed ${C.purpleBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                        <FaImage size={26} style={{ color: C.purple, opacity: 0.3 }} />
                                                                    </div>
                                                                )}

                                                                {/* Info del diseño — ORGANIZADA */}
                                                                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                                                                    {/* Parte */}
                                                                    <div style={{ background: C.accentSoft, borderRadius: 10, padding: "8px 12px", border: `1px solid ${C.accentBorder}` }}>
                                                                        <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>Parte de la prenda</p>
                                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{tec.parte?.Nombre || "N/A"}</p>
                                                                    </div>

                                                                    {/* Subparte */}
                                                                    <div style={{ background: subparte ? C.accentSoft : C.bg, borderRadius: 10, padding: "8px 12px", border: `1px solid ${C.accentBorder}` }}>
                                                                        <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>Subparte</p>
                                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: subparte ? 700 : 400, color: subparte ? C.navy : C.muted, fontFamily: "'Outfit',sans-serif" }}>{subparte || "No especificada"}</p>
                                                                    </div>

                                                                    {/* Observaciones — span completo si hay contenido */}
                                                                    {observacion && (
                                                                        <div style={{ gridColumn: "1/-1", background: C.accentSoft, borderRadius: 10, padding: "8px 12px", border: `1px solid ${C.accentBorder}` }}>
                                                                            <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>Observaciones</p>
                                                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>{observacion}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", background: C.bg }}>
                        <button onClick={onClose} style={{ padding: "10px 24px", background: C.navy, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────
const MisCotizaciones = () => {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [documentoID, setDocumentoID] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    useEffect(() => {
        const u = localStorage.getItem("usuario");
        if (u) setDocumentoID(JSON.parse(u).DocumentoID);
    }, []);

    useEffect(() => {
        if (documentoID) cargarCotizaciones();
    }, [documentoID]);

    const cargarCotizaciones = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/usuario/${documentoID}`);
            const data = await res.json();
            setCotizaciones(Array.isArray(data) ? data : []);
        } catch { setCotizaciones([]); }
        finally { setCargando(false); }
    };

    const verDetalle = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/${id}`);
            const data = await res.json();
            setCotizacionSeleccionada(data);
            setMostrarDetalle(true);
        } catch { console.error("Error al cargar detalle"); }
    };

    const estadosFiltro = ["Todos", ...new Set(cotizaciones.map(c => c.estado?.Nombre || "Pendiente"))];
    const cotizacionesFiltradas = filtroEstado === "Todos" ? cotizaciones : cotizaciones.filter(c => (c.estado?.Nombre || "Pendiente") === filtroEstado);

    // ── Loading ──
    if (cargando) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes modalIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 44, height: 44, border: `4px solid ${C.border}`, borderTop: `4px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ color: C.muted, fontSize: 14 }}>Cargando tus cotizaciones...</p>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                .cot-card { transition: all 0.24s cubic-bezier(.4,0,.2,1) !important; }
                .cot-card:hover { transform: translateY(-6px) !important; border-color: ${C.accent} !important; box-shadow: 0 16px 40px rgba(79,142,247,0.16) !important; }
                .img-overlay { pointer-events: none; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: ${C.bg}; }
                ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
            `}</style>

            <NavbarComponent />

            {/* HERO */}
            <section style={{ background: C.navyDeep, position: "relative", overflow: "hidden", padding: "48px 32px 40px", textAlign: "center" }}>
                <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, background: "radial-gradient(circle,rgba(79,142,247,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -60, right: -40, width: 300, height: 300, background: "radial-gradient(circle,rgba(124,58,237,0.10) 0%,transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, marginBottom: 16, fontFamily: "'Outfit',sans-serif" }}>
                        <FaStar size={9} /> Mi cuenta
                    </div>
                    <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 10px", fontFamily: "'Outfit',sans-serif" }}>
                        Mis <span style={{ background: "linear-gradient(90deg,#4f8ef7,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Cotizaciones</span>
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, maxWidth: 460, margin: "0 auto", fontFamily: "'Outfit',sans-serif" }}>
                        Aquí puedes ver el estado y detalle de todas tus cotizaciones realizadas.
                    </p>
                    {/* Stats */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                        {[
                            { val: cotizaciones.length, label: "Total" },
                            { val: cotizaciones.filter(c => c.estado?.Nombre === "Pendiente").length, label: "Pendientes" },
                            { val: cotizaciones.filter(c => c.estado?.Nombre === "Aprobada").length, label: "Aprobadas" },
                        ].map(({ val, label }) => (
                            <div key={label} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "12px 22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, backdropFilter: "blur(8px)" }}>
                                <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{val}</span>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <div style={{ height: 3, background: "linear-gradient(90deg,#4f8ef7 0%,#7c3aed 50%,#4f8ef7 100%)" }} />

            {/* CONTENIDO */}
            <div style={{ background: C.bg, minHeight: "calc(100vh - 80px)", padding: "32px 24px", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                    {/* Filtros */}
                    {cotizaciones.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                            {estadosFiltro.map(est => {
                                const active = filtroEstado === est;
                                const cfg = est === "Todos" ? null : getEstado(est);
                                return (
                                    <button key={est} onClick={() => setFiltroEstado(est)} style={{
                                        padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: 12,
                                        fontFamily: "'Outfit',sans-serif", cursor: "pointer", border: `1.5px solid ${active ? (cfg?.color || C.navy) : C.border}`,
                                        background: active ? (cfg?.bg || C.accentSoft) : C.white, color: active ? (cfg?.color || C.navy) : C.muted,
                                        transition: "all 0.2s"
                                    }}>
                                        {est === "Todos" ? `Todas (${cotizaciones.length})` : `${est} (${cotizaciones.filter(c => (c.estado?.Nombre || "Pendiente") === est).length})`}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Sin cotizaciones */}
                    {cotizacionesFiltradas.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "72px 0", background: C.white, borderRadius: 20, border: `1.5px solid ${C.border}` }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30, color: C.accent }}>
                                <FaBoxOpen />
                            </div>
                            <p style={{ fontWeight: 800, fontSize: 18, color: C.navy, margin: "0 0 8px", fontFamily: "'Outfit',sans-serif" }}>
                                {cotizaciones.length === 0 ? "Aún no tienes cotizaciones" : "Sin cotizaciones con este estado"}
                            </p>
                            <p style={{ color: C.muted, fontSize: 13, margin: 0, fontFamily: "'Outfit',sans-serif" }}>
                                {cotizaciones.length === 0 ? "Cuando realices una cotización aparecerá aquí." : "Prueba seleccionando otro filtro."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                            {cotizacionesFiltradas.map((cot, idx) => {
                                const estadoNombre = cot.estado?.Nombre || 'Pendiente';
                                const est = getEstado(estadoNombre);
                                const primerDetalle = cot.detalles?.[0] || {};
                                const esPrendaPropia = primerDetalle.TraePrenda;
                                const totalDisenos = cot.detalles?.reduce((s, d) => s + (d.tecnicas?.length || 0), 0) || 0;

                                return (
                                    <div key={cot.CotizacionID} className="cot-card"
                                        style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 18, overflow: "hidden", cursor: "default", animation: "fadeUp 0.35s ease both", animationDelay: `${idx * 0.05}s` }}>

                                        {/* Header de la card */}
                                        <div style={{ background: C.navyDeep, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, background: "radial-gradient(circle,rgba(79,142,247,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                                                <div>
                                                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#ffff", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>Cotización</p>
                                                    <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>#{cot.CotizacionID}</p>
                                                </div>
                                                <Badge>{estadoNombre}</Badge>
                                            </div>
                                            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#ffff", fontFamily: "'Outfit',sans-serif", position: "relative", zIndex: 1 }}>
                                                <FaCalendarAlt size={9} style={{ marginRight: 4 }} />{formatearFecha(cot.FechaCotizacion)}
                                            </p>
                                        </div>

                                        {/* Cuerpo de la card */}
                                        <div style={{ padding: "18px 20px" }}>
                                            {/* Producto principal */}
                                            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                                                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", border: `2px solid ${C.border}`, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    {esPrendaPropia ? (
                                                        <FaTshirt size={24} style={{ color: C.accent, opacity: 0.5 }} />
                                                    ) : primerDetalle.producto?.ImagenProducto ? (
                                                        <img src={primerDetalle.producto.ImagenProducto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <FaBoxOpen size={20} style={{ color: C.muted, opacity: 0.4 }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 14, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>
                                                        {esPrendaPropia ? "Prenda del cliente" : (primerDetalle.producto?.Nombre || "Producto")}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                                        {cot.detalles?.length || 0} producto{cot.detalles?.length !== 1 ? "s" : ""} · {totalDisenos} diseño{totalDisenos !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Valor */}
                                            <div style={{ background: cot.ValorTotal > 0 ? C.successSoft : C.bg, border: `1.5px solid ${cot.ValorTotal > 0 ? C.successBorder : C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Outfit',sans-serif" }}>Valor Total</p>
                                                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: cot.ValorTotal > 0 ? C.success : C.muted, fontFamily: "'Outfit',sans-serif" }}>
                                                    {cot.ValorTotal > 0 ? `$${formatPrecio(cot.ValorTotal)}` : "Pendiente de cotizar"}
                                                </p>
                                            </div>

                                            {/* Botón ver detalle */}
                                            <button onClick={() => verDetalle(cot.CotizacionID)} style={{
                                                width: "100%", padding: "11px", background: C.navyGrad, color: "#fff",
                                                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
                                                cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center",
                                                justifyContent: "center", gap: 8, transition: "opacity 0.2s"
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                                                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                                <FaEye size={13} /> Ver Detalle Completo <FaChevronRight size={10} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {mostrarDetalle && cotizacionSeleccionada && (
                <ModalDetalleCotizacion cotizacion={cotizacionSeleccionada} onClose={() => { setMostrarDetalle(false); setCotizacionSeleccionada(null); }} />
            )}

            <FooterComponent />
        </>
    );
};

export default MisCotizaciones;