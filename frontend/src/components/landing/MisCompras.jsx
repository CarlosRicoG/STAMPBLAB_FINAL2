import { useState, useEffect } from "react";
import FooterComponent from "./footer";
import NavbarComponent from "./NavBarLanding";
import { FaBoxOpen, FaEye, FaCreditCard, FaTruck, FaStore, FaTimes, FaReceipt } from "react-icons/fa";

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
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
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};


const formatPrecio = (valor) =>
    (parseFloat(valor) || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
});


/* ── Badge de estado ── */
const estadoConfig = {
    "Pendiente": { bg: C.warningSoft, color: C.warning, border: C.warningBorder },
    "Pagada": { bg: C.successSoft, color: C.success, border: C.successBorder },
    "En Producción": { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
    "Lista para Entrega": { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
    "Entregada": { bg: C.successSoft, color: C.success, border: C.successBorder },
    "Cancelada": { bg: C.dangerSoft, color: C.danger, border: C.dangerBorder },
};

const EstadoBadge = ({ nombre }) => {
    const s = estadoConfig[nombre] || { bg: "#f1f5f9", color: C.muted, border: C.border };
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {nombre || "Pendiente"}
        </span>
    );
};

/* ── Badge método de pago ── */
const MetodoPagoBadge = ({ metodo }) => {
    if (!metodo) return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            <FaStore size={10} /> Presencial
        </span>
    );
    if (metodo === "transferencia") return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            <FaCreditCard size={10} /> Transferencia
        </span>
    );
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.successSoft, color: C.success, border: `1px solid ${C.successBorder}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            <FaTruck size={10} /> Contraentrega
        </span>
    );
};

const formatFecha = (f) => new Date(f).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
const formatFechaHora = (f) => new Date(f).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* ════════════════════════════════════════
   MODAL DETALLE
════════════════════════════════════════ */
const ModalDetalle = ({ venta, onClose }) => {
    if (!venta) return null;
    const estadoNombre = venta.estado?.Nombre || "Pendiente";

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
            <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 760, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 16px 56px rgba(0,0,0,0.22)", fontFamily: "'Outfit',sans-serif", animation: "popIn 0.25s ease" }}>

                {/* Header */}
                <div style={{ background: C.navyGrad, padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <FaReceipt size={16} color="rgba(255,255,255,0.8)" />
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#fff" }}>Compra #{venta.VentaID}</p>
                        </div>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{formatFechaHora(venta.FechaVenta)}</p>
                    </div>
                    <button onClick={onClose}
                        style={{ width: 32, height: 32, borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>

                    {/* Info rápida */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
                        <div style={{ background: C.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estado</p>
                            <EstadoBadge nombre={estadoNombre} />
                        </div>
                        <div style={{ background: C.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Método de pago</p>
                            <MetodoPagoBadge metodo={venta.MetodoPago} />
                        </div>
                        <div style={{ background: C.successSoft, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.successBorder}` }}>
                            <p style={{ margin: "0 0 4px", fontSize: 11, color: C.success, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</p>
                            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.success }}>${formatPrecio(venta.Total)}</p>
                        </div>
                    </div>

                    {/* Datos de entrega (contraentrega) */}
                    {venta.MetodoPago === "contraentrega" && (
                        <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos de entrega</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                                <p style={{ margin: 0, color: C.navy }}><span style={{ color: C.muted }}>Receptor:</span> <strong>{venta.NombreReceptor || "—"}</strong></p>
                                <p style={{ margin: 0, color: C.navy }}><span style={{ color: C.muted }}>Teléfono:</span> <strong>{venta.TelefonoEntrega || "—"}</strong></p>
                                <p style={{ margin: 0, color: C.navy, gridColumn: "1/-1" }}><span style={{ color: C.muted }}>Dirección:</span> <strong>{venta.DireccionEntrega || "—"}</strong></p>
                            </div>
                        </div>
                    )}

                    {/* Productos */}
                    <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: C.navy, borderBottom: `2px solid ${C.accent}`, paddingBottom: 8 }}>
                        Productos comprados
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {venta.detalles?.map((det, i) => (
                            <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", background: C.bg, display: "flex", gap: 16, alignItems: "flex-start" }}>
                                {/* Imagen */}
                                <div style={{ width: 80, height: 80, borderRadius: 10, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                    {det.producto?.ImagenProducto
                                        ? <img src={det.producto.ImagenProducto} alt="prod" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        : <FaBoxOpen size={24} color={C.muted} style={{ opacity: 0.4 }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: C.navy }}>{det.producto?.Nombre || "Producto"}</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: C.muted, marginBottom: 10 }}>
                                        <span>Cantidad: <strong style={{ color: C.navy }}>{det.Cantidad}</strong></span>
                                        {det.color && <span>Color: <strong style={{ color: C.navy }}>{det.color?.Nombre}</strong></span>}
                                        {det.talla && <span>Talla: <strong style={{ color: C.navy }}>{det.talla?.Nombre}</strong></span>}
                                        <span>P. Unit: <strong style={{ color: C.navy }}>${formatPrecio(det.PrecioUnitario)}</strong></span>
                                    </div>
                                    <div style={{ background: C.successSoft, border: `1px solid ${C.successBorder}`, borderRadius: 8, padding: "6px 12px", display: "inline-block" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: C.success }}>
                                            Subtotal: ${formatPrecio(det.Cantidad * parseFloat(det.PrecioUnitario || 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", background: C.bg, flexShrink: 0 }}>
                    <button onClick={onClose}
                        style={{ background: C.danger, color: "#ffff", border: `1.5px solid ${C.dangerBorder}`, borderRadius: 10, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        <FaTimes size={12} /> Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════ */
const MisCompras = () => {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [documentoID, setDocumentoID] = useState(null);

    useEffect(() => {
        const usuarioStorage = localStorage.getItem("usuario");
        if (usuarioStorage) {
            try {
                const userData = JSON.parse(usuarioStorage);
                setDocumentoID(userData.DocumentoID);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (documentoID) cargarVentas();
    }, [documentoID]);

    const cargarVentas = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`);
            const data = await response.json();

            // ✅ FIX: Mostrar TODAS las ventas del usuario (con y sin MetodoPago)
            // Antes el filtro `!v.MetodoPago` excluía las compras del Landing (transferencia/contraentrega)
            const ventasUsuario = Array.isArray(data)
                ? data.filter(v => String(v.DocumentoID) === String(documentoID))
                : [];

            // Ordenar de más reciente a más antigua
            ventasUsuario.sort((a, b) => new Date(b.FechaVenta) - new Date(a.FechaVenta));
            setVentas(ventasUsuario);
        } catch (error) {
            console.error("Error al cargar compras:", error);
            setVentas([]);
        } finally {
            setCargando(false);
        }
    };

    const verDetalle = async (ventaID) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${ventaID}`);
            const data = await response.json();
            setVentaSeleccionada(data);
        } catch (error) {
            console.error("Error al cargar detalle:", error);
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .compra-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .compra-card:hover { transform: translateY(-4px); box-shadow: 0 10px 32px rgba(26,37,64,0.13) !important; }
        .ver-btn:hover { opacity: 0.88 !important; }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>

                {/* ── Hero header ── */}
                <div style={{ background: C.navyGrad, padding: "44px 32px 50px" }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
                        <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: "-0.02em" }}>Mis Compras</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                            Historial de todas tus compras
                        </p>
                    </div>
                </div>

                {/* ── Contenido ── */}
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 60px" }}>

                    {/* Loading */}
                    {cargando ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
                            <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            <p style={{ color: C.muted, fontSize: 14, fontWeight: 600 }}>Cargando tus compras...</p>
                        </div>

                    ) : ventas.length === 0 ? (
                        /* Empty state */
                        <div style={{ textAlign: "center", padding: "72px 20px", animation: "fadeIn 0.3s ease" }}>
                            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.accentSoft, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                                <FaBoxOpen size={30} color={C.accent} />
                            </div>
                            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 18, color: C.navy }}>No tienes compras aún</p>
                            <p style={{ margin: 0, fontSize: 14, color: C.muted }}>Cuando realices un pedido, aparecerá aquí</p>
                        </div>

                    ) : (
                        <>
                            {/* Contador */}
                            <p style={{ margin: "0 0 22px", fontSize: 13, color: C.muted, fontWeight: 600 }}>
                                {ventas.length} {ventas.length === 1 ? "compra encontrada" : "compras encontradas"}
                            </p>

                            {/* Grid de compras */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, animation: "fadeIn 0.3s ease" }}>
                                {ventas.map(venta => {
                                    const estadoNombre = venta.estado?.Nombre || "Pendiente";
                                    const primerDetalle = venta.detalles?.[0] || {};

                                    return (
                                        <div key={venta.VentaID} className="compra-card"
                                            style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(26,37,64,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                                            {/* Card header */}
                                            <div style={{ background: C.navyGrad, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#fff" }}>Compra #{venta.VentaID}</p>
                                                    <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{formatFecha(venta.FechaVenta)}</p>
                                                </div>
                                                <EstadoBadge nombre={estadoNombre} />
                                            </div>

                                            {/* Card body */}
                                            <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

                                                {/* Producto preview */}
                                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                    <div style={{ width: 64, height: 64, borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                                        {primerDetalle.producto?.ImagenProducto
                                                            ? <img src={primerDetalle.producto.ImagenProducto} alt="prod" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                            : <FaBoxOpen size={20} color={C.muted} style={{ opacity: 0.4 }} />}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 13, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {primerDetalle.producto?.Nombre || "Producto"}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                                                            {venta.detalles?.length || 0} {venta.detalles?.length === 1 ? "artículo" : "artículos"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Método de pago */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <MetodoPagoBadge metodo={venta.MetodoPago} />
                                                </div>

                                                {/* Total */}
                                                <div style={{ background: C.successSoft, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: "10px 14px" }}>
                                                    <p style={{ margin: "0 0 2px", fontSize: 11, color: C.success, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</p>
                                                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.success }}>${formatPrecio(venta.Total)}</p>
                                                </div>

                                                {/* Botón */}
                                                <button className="ver-btn" onClick={() => verDetalle(venta.VentaID)}
                                                    style={{ width: "100%", background: C.navyGrad, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "opacity 0.15s" }}>
                                                    <FaEye size={13} /> Ver detalle
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <FooterComponent />

            {/* Modal */}
            {ventaSeleccionada && (
                <ModalDetalle venta={ventaSeleccionada} onClose={() => setVentaSeleccionada(null)} />
            )}
        </>
    );
};

export default MisCompras;