import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import FooterComponent from "./footer";
import NavbarComponent from "./NavBarLanding";
import { FaBoxOpen, FaEye, FaCreditCard, FaTruck, FaStore, FaReceipt, FaCalendarAlt, FaShoppingBag, FaWallet, FaCheckCircle, FaClock, FaChevronRight, FaArrowRight, FaExclamationTriangle, FaCloudUploadAlt, FaRedo } from "react-icons/fa";
import Swal from "sweetalert2";
import { descargarComprobante } from "../../Services/api-ventas/ventas";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";
import { getHistorialVenta, subirComprobanteVenta, archivoADataURL, mensajeError } from "../../Services/api-cliente/cliente";
import { guardarCarritoServidor } from "../../Services/api-carrito/carrito";
import { escapeHtml } from "../../utils/escapeHtml";
import { plazoDePagoAplica, fechaLimitePago, textoTiempoRestante, formatoFechaHoraCO, formatoFechaCO, validarComprobante, itemsParaVolverAPedir, fusionarCarritos, textoCostoEnvio } from "../../utils/clienteUtils";
import { LineaTiempo, BotonWhatsApp, useConfigPublica, CLIENTE_CSS } from "./clienteKit";
import usePlus from "../../hooks/usePlus";
import { MC_CSS, formatPrecio, leerUsuario, MiCuentaHero, StatCard, PillTabs, Stepper, McModal, ModalHead, EmptyState, Skeletons } from "./miCuentaKit";

const CART_KEY = "cart_productos_landing";
const esPendiente = (v) => (v.estado?.Nombre || "Pendiente") === "Pendiente";
const tieneComprobante = (v) => !!(v.ComprobanteTransferencia || v.TieneComprobante);
// Un pedido por transferencia pendiente puede (re)subir comprobante si lo rechazaron o si aún no tiene uno
const puedeSubirComprobante = (v) => esPendiente(v) && (!!v.ComprobanteMotivoRechazo || (v.MetodoPago === "transferencia" && !tieneComprobante(v)));

const C = { accent: "#4f8ef7", success: "#16a34a", warning: "#d97706", danger: "#dc2626", muted: "#64748b" };

/* ── Estados ── */
const estadoConfig = {
    "Pendiente": { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
    "Pagada": { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
    "En Producción": { bg: "#f0f4ff", color: C.accent, border: "#c7d9ff" },
    "Lista para Entrega": { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
    "Entregada": { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
    "Cancelada": { bg: "#fef2f2", color: C.danger, border: "#fecaca" },
};
const getEstado = (n) => estadoConfig[n] || { bg: "#f1f5f9", color: C.muted, border: "#e2e8f0" };

const FLUJO = ["Pendiente", "Pagada", "En Producción", "Lista para Entrega", "Entregada"];
const pasosDe = (nombre) => {
    if (nombre === "Cancelada") return { steps: ["Pendiente", "Cancelada"], current: 1, failed: true };
    const i = FLUJO.indexOf(nombre);
    return { steps: FLUJO, current: i < 0 ? 0 : i, failed: false };
};

const EstadoBadge = ({ nombre }) => {
    const s = getEstado(nombre);
    return <span className="mc-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>{nombre || "Pendiente"}</span>;
};

const MetodoPagoBadge = ({ metodo }) => {
    if (!metodo) return <span className="mc-pill"><FaStore size={10} /> Presencial</span>;
    if (metodo === "transferencia") return <span className="mc-pill blue"><FaCreditCard size={10} /> Transferencia</span>;
    return <span className="mc-pill" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: C.success }}><FaTruck size={10} /> Contraentrega</span>;
};

const formatFecha = (f) => new Date(f).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
const formatFechaHora = (f) => new Date(f).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* ════════════════════════════════════════
   MODAL DETALLE
════════════════════════════════════════ */
/* Botón para subir (o volver a subir) el comprobante de transferencia */
const BotonComprobante = ({ venta, etiqueta, onSubido }) => {
    const ref = useRef(null);
    const [subiendo, setSubiendo] = useState(false);
    const alElegir = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const err = validarComprobante(file);
        if (err) { Swal.fire({ icon: "warning", title: "Archivo no válido", text: err, confirmButtonColor: C.accent }); return; }
        setSubiendo(true);
        try {
            const dataUrl = await archivoADataURL(file);
            await subirComprobanteVenta(venta.VentaID, dataUrl);
            await Swal.fire({ icon: "success", title: "Comprobante enviado", text: "Lo revisaremos lo más pronto posible y te avisaremos.", confirmButtonColor: C.accent });
            onSubido?.();
        } catch (error) {
            const sinServicio = error?.response?.status === 404;
            Swal.fire({ icon: "error", title: "No se pudo subir el comprobante", text: sinServicio ? "Esta opción todavía no está disponible. Intenta más tarde." : mensajeError(error), confirmButtonColor: C.danger });
        } finally { setSubiendo(false); }
    };
    return (
        <>
            <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={alElegir}
                aria-label={`Elegir comprobante del pedido ${venta.VentaID}`} />
            <button type="button" className="ck-btn" disabled={subiendo} onClick={() => ref.current?.click()}>
                <FaCloudUploadAlt size={14} /> {subiendo ? "Subiendo..." : etiqueta}
            </button>
        </>
    );
};

/* Avisos del pedido pendiente: plazo para pagar, comprobante rechazado o faltante */
const AvisosPago = ({ venta, config, onSubido }) => {
    if (!esPendiente(venta)) return null;
    const limite = plazoDePagoAplica(venta) ? fechaLimitePago(venta.FechaVenta, config?.plazoPagoHoras) : null;
    const restante = textoTiempoRestante(limite);
    return (
        <>
            {venta.ComprobanteMotivoRechazo && (
                <div className="ck-alert bad" role="alert">
                    <FaExclamationTriangle size={18} />
                    <div>
                        <b>Tu comprobante fue rechazado</b>
                        <p>Motivo: {venta.ComprobanteMotivoRechazo}</p>
                        <BotonComprobante venta={venta} etiqueta="Subir un nuevo comprobante" onSubido={onSubido} />
                    </div>
                </div>
            )}
            {!venta.ComprobanteMotivoRechazo && venta.MetodoPago === "transferencia" && !tieneComprobante(venta) && (
                <div className="ck-alert warn" role="status">
                    <FaExclamationTriangle size={18} />
                    <div>
                        <b>Aún no has subido tu comprobante</b>
                        <p>Sube la foto de tu transferencia para que podamos confirmar el pago.</p>
                        <BotonComprobante venta={venta} etiqueta="Subir comprobante" onSubido={onSubido} />
                    </div>
                </div>
            )}
            {limite && (
                <div className={`ck-alert ${restante === "plazo vencido" ? "bad" : "info"}`}>
                    <FaClock size={18} />
                    <div>
                        <b>Paga antes de {formatoFechaHoraCO(limite)}</b>
                        <p>{restante === "plazo vencido" ? "El plazo ya venció: el pedido se cancelará automáticamente." : `Si no se paga a tiempo, el pedido se cancela solo y el stock se libera (${restante}).`}</p>
                    </div>
                </div>
            )}
        </>
    );
};

const ModalDetalle = ({ venta, onClose, config, onRecargar, onVolverAPedir }) => {
    const [historial, setHistorial] = useState(null);
    const [cargandoHist, setCargandoHist] = useState(true);
    const ventaID = venta?.VentaID;
    useEffect(() => {
        if (!ventaID) return undefined;
        let vivo = true;
        setCargandoHist(true);
        getHistorialVenta(ventaID).then((h) => { if (vivo) { setHistorial(h); setCargandoHist(false); } });
        return () => { vivo = false; };
    }, [ventaID]);
    if (!venta) return null;
    const estadoNombre = venta.estado?.Nombre || "Pendiente";
    const esEnvio = venta.TipoEntrega === "envio" || venta.MetodoPago === "contraentrega";
    const costoEnvio = parseFloat(venta.CostoEnvio) || 0;
    return (
        <McModal onClose={onClose}>
            <ModalHead eyebrow="Detalle de compra" title={`Compra #${venta.VentaID}`}
                sub={<><FaCalendarAlt size={10} style={{ marginRight: 6 }} />{formatFechaHora(venta.FechaVenta)}</>} onClose={onClose} />
            <div className="mc-mbody">
                <div className="mc-sum">
                    <div><small>Estado</small><EstadoBadge nombre={estadoNombre} /></div>
                    <div><small>Método de pago</small><MetodoPagoBadge metodo={venta.MetodoPago} /></div>
                    <div><small>Total</small><div className="big">${formatPrecio(venta.Total)}</div></div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "18px 18px 8px", marginBottom: 22 }}>
                    <small className="mc-lbl" style={{ marginBottom: 14 }}>Seguimiento del pedido</small>
                    <Stepper {...pasosDe(estadoNombre)} />
                    <div style={{ height: 10 }} />
                </div>

                <AvisosPago venta={venta} config={config} onSubido={onRecargar} />

                {venta.FechaEstimadaEntrega && estadoNombre !== "Cancelada" && estadoNombre !== "Entregada" && (
                    <div className="ck-alert ok" role="status">
                        <FaCalendarAlt size={18} />
                        <div><b>Fecha estimada de entrega</b><p>{formatoFechaCO(venta.FechaEstimadaEntrega)}</p></div>
                    </div>
                )}

                <LineaTiempo eventos={historial} cargando={cargandoHist} titulo="Línea de tiempo del pedido" />

                <div className="mc-info">
                    <small className="mc-lbl" style={{ color: "#3b6fe0" }}>Datos de entrega</small>
                    <div className="mc-kv">
                        <div className="full"><small>Tipo de entrega</small><span>{esEnvio ? "Envío a domicilio" : "Recoger en tienda"}</span></div>
                        {esEnvio ? (
                            <>
                                <div><small>Receptor</small><span>{venta.NombreReceptor || venta.ContactoNombre || "—"}</span></div>
                                <div><small>Teléfono</small><span>{venta.TelefonoEntrega || venta.ContactoTelefono || "—"}</span></div>
                                <div className="full"><small>Dirección</small><span>{venta.DireccionEntrega || venta.ContactoDireccion || "—"}</span></div>
                                <div className="full"><small>Costo de envío</small><span>{costoEnvio > 0 ? `$${formatPrecio(costoEnvio)}` : textoCostoEnvio(0)}</span></div>
                            </>
                        ) : (
                            <>
                                {venta.ContactoNombre && <div><small>Contacto</small><span>{venta.ContactoNombre}</span></div>}
                                {venta.ContactoTelefono && <div><small>Teléfono</small><span>{venta.ContactoTelefono}</span></div>}
                                <div className="full"><small>Retiro</small><span>Te avisaremos cuando tu pedido esté listo para recoger.</span></div>
                            </>
                        )}
                    </div>
                </div>

                <div className="mc-sec">Productos comprados</div>
                {venta.detalles?.map((det, i) => (
                    <div key={i} className="mc-item">
                        <div className="mc-item-h">
                            <div className="mc-item-img">
                                {det.producto?.ImagenProducto
                                    ? <img src={det.producto.ImagenProducto} alt="prod" style={{ objectFit: "contain" }} />
                                    : <FaBoxOpen style={{ opacity: .5 }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p className="mc-item-t">{det.producto?.Nombre || "Producto"}</p>
                                <div className="mc-chips">
                                    <span className="mc-pill">Cantidad: <b>{det.Cantidad}</b></span>
                                    {det.color && <span className="mc-pill">Color: <b>{det.color?.Nombre}</b></span>}
                                    {det.talla && <span className="mc-pill">Talla: <b>{det.talla?.Nombre}</b></span>}
                                    <span className="mc-pill">P. Unit: <b>${formatPrecio(det.PrecioUnitario)}</b></span>
                                </div>
                            </div>
                            <div className="mc-item-sub">
                                <small>Subtotal</small>
                                <b>${formatPrecio(det.Cantidad * parseFloat(det.PrecioUnitario || 0))}</b>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mc-mfoot" style={{ gap: 10, flexWrap: "wrap" }}>
                <BotonWhatsApp numero={config?.whatsapp} texto={`Hola StampLab, tengo una consulta sobre mi pedido #${venta.VentaID}.`} />
                {(estadoNombre === "Entregada" || estadoNombre === "Cancelada") && (
                    <button type="button" className="ck-btn ghost" onClick={() => onVolverAPedir(venta)}><FaRedo size={12} /> Volver a pedir</button>
                )}
                <button type="button" className="mc-btn" style={{ width: "auto" }} onClick={() => descargarComprobante(venta.VentaID).catch(() => Swal.fire({ icon: "error", title: "No se pudo descargar el comprobante" }))}><FaReceipt size={13} /> Descargar comprobante</button>
                <button type="button" className="mc-cta" onClick={onClose}>Cerrar</button>
            </div>
        </McModal>
    );
};

/* ════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════ */
const MisCompras = () => {
    usePlus();
    const [filtro, setFiltro] = useState("Todos");
    const nombreUsuario = leerUsuario().Nombre || "";
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [documentoID, setDocumentoID] = useState(null);
    const [reordenando, setReordenando] = useState(false);
    const config = useConfigPublica();
    const navigate = useNavigate();

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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas?documentoID=${encodeURIComponent(documentoID)}&limit=1000&page=1`);
            const data = await response.json();

            // Mostrar TODAS las ventas del usuario (con y sin MetodoPago)
            // El endpoint devuelve { datos, total, ... } y ya viene filtrado por cliente
            const lista = Array.isArray(data) ? data : (data.datos || []);
            const ventasUsuario = lista.filter(v => String(v.DocumentoID) === String(documentoID));

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
            if (!response.ok) throw new Error("detalle");
            const data = await response.json();
            setVentaSeleccionada(data);
        } catch (error) {
            console.error("Error al cargar detalle:", error);
            Swal.fire({ icon: "error", title: "No pudimos cargar el detalle", text: "Revisa tu conexión e intenta de nuevo.", confirmButtonColor: "#1a2540" });
        }
    };

    // Tras subir un comprobante: refresca la lista y el detalle abierto
    const recargarTodo = async () => {
        await cargarVentas();
        if (ventaSeleccionada) await verDetalle(ventaSeleccionada.VentaID);
    };

    // Volver a pedir: agrega al carrito lo que siga disponible, con el precio ACTUAL del catálogo
    const volverAPedir = async (venta) => {
        if (reordenando) return;
        setReordenando(true);
        try {
            const [pRes, tRes] = await Promise.all([getProductos(), getTallas()]);
            const catalogo = pRes?.datos || pRes || [];
            const tallasCat = tRes?.datos || tRes || [];
            const { items, omitidos } = itemsParaVolverAPedir(venta, Array.isArray(catalogo) ? catalogo : [], Array.isArray(tallasCat) ? tallasCat : []);
            const lista = (arr) => arr.length
                ? `<ul style="text-align:left;margin:8px 0 0;padding-left:20px;font-size:13px;color:#475569">${arr.map(o => `<li><b>${escapeHtml(o.nombre)}</b>: ${escapeHtml(o.motivo)}</li>`).join("")}</ul>`
                : "";
            if (items.length === 0) {
                Swal.fire({ icon: "info", title: "No pudimos agregar este pedido", html: `<p style="margin:0">Ninguno de los productos está disponible ahora mismo.</p>${lista(omitidos)}`, confirmButtonColor: "#1a2540" });
                return;
            }
            let actual = [];
            try { actual = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { actual = []; }
            const nuevo = fusionarCarritos(actual, items);
            try { localStorage.setItem(CART_KEY, JSON.stringify(nuevo)); } catch { /* sin storage */ }
            guardarCarritoServidor(nuevo); // si falla, el carrito local sigue valiendo
            const r = await Swal.fire({
                icon: omitidos.length ? "warning" : "success",
                title: `${items.length} ${items.length === 1 ? "producto agregado" : "productos agregados"} al carrito`,
                html: `<p style="margin:0">Usamos los precios actuales del catálogo.</p>${omitidos.length ? `<p style="margin:10px 0 0;font-weight:700">No pudimos agregar:</p>${lista(omitidos)}` : ""}`,
                showCancelButton: true, confirmButtonText: "Ir al carrito", cancelButtonText: "Seguir aquí", confirmButtonColor: "#4f8ef7", cancelButtonColor: "#1a2540",
            });
            if (r.isConfirmed) navigate("/productosLanding", { state: { abrirCarrito: true } });
        } catch (error) {
            Swal.fire({ icon: "error", title: "No se pudo volver a pedir", text: "No pudimos consultar el catálogo. Intenta de nuevo en unos minutos.", confirmButtonColor: "#dc2626" });
        } finally { setReordenando(false); }
    };

    // Cancelar un pedido propio (solo si sigue Pendiente): el servidor devuelve el stock
    const cancelarPedido = async (venta) => {
        const r = await Swal.fire({
            icon: "warning",
            title: "¿Cancelar este pedido?",
            html: `<p style="margin:0">Pedido <b>#${venta.VentaID}</b> por <b>$${formatPrecio(venta.Total)}</b>.<br/>Esta acción no se puede deshacer.</p>`,
            showCancelButton: true,
            confirmButtonText: "Sí, cancelar pedido",
            cancelButtonText: "No, conservarlo",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
        });
        if (!r.isConfirmed) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${venta.VentaID}/cancelar`, { method: "PATCH" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.mensaje || "No se pudo cancelar el pedido");
            await Swal.fire({ icon: "success", title: "Pedido cancelado", text: "Tu pedido fue cancelado.", timer: 1800, showConfirmButton: false });
            await cargarVentas();
        } catch (err) {
            Swal.fire({ icon: "error", title: "No se pudo cancelar", text: err.message, confirmButtonColor: "#1a2540" });
        }
    };

    const nomEstado = (v) => v.estado?.Nombre || "Pendiente";
    const estados = ["Todos", ...new Set(ventas.map(nomEstado))];
    const visibles = filtro === "Todos" ? ventas : ventas.filter(v => nomEstado(v) === filtro);
    const tabs = estados.map(e => ({ key: e, label: e === "Todos" ? "Todas" : e, count: e === "Todos" ? ventas.length : ventas.filter(v => nomEstado(v) === e).length }));
    const totalGastado = ventas.filter(v => nomEstado(v) !== "Cancelada").reduce((s, v) => s + (parseFloat(v.Total) || 0), 0);
    const enCurso = ventas.filter(v => !["Entregada", "Cancelada"].includes(nomEstado(v))).length;
    const entregadas = ventas.filter(v => nomEstado(v) === "Entregada").length;

    return (
        <>
            <style>{MC_CSS + CLIENTE_CSS + `
.mc-cancel { margin-top: 10px; width: 100%; padding: 11px 16px; border-radius: 10px; border: 1.5px solid #fecaca; background: #fff; color: #dc2626; font: 700 13px "Outfit", sans-serif; cursor: pointer; transition: background .25s, color .25s, transform .25s, box-shadow .25s; }
.mc-cancel:hover { background: #dc2626; color: #fff; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(220,38,38,.28); }
`}</style>
            <NavbarComponent />

            <div className="mc-page">
                <MiCuentaHero title="Mis" accent="Compras" nombre={nombreUsuario}
                    sub="Todo tu historial de pedidos en un solo lugar, con seguimiento paso a paso.">
                    <div className="mc-stats">
                        <StatCard i={0} tone="blue" icon={<FaShoppingBag />} label="Compras" value={ventas.length} />
                        <StatCard i={1} tone="amber" icon={<FaClock />} label="En curso" value={enCurso} />
                        <StatCard i={2} tone="green" icon={<FaCheckCircle />} label="Entregadas" value={entregadas} />
                        <StatCard i={3} tone="violet" icon={<FaWallet />} label="Total gastado" value={totalGastado} format={(n) => `$${formatPrecio(n)}`} />
                    </div>
                </MiCuentaHero>

                <div className="mc-wrap">

                    {cargando ? <Skeletons n={3} /> : ventas.length === 0 ? (
                        <EmptyState icon={<FaShoppingBag />} title="No tienes compras aún" text="Cuando realices un pedido, aparecerá aquí con su seguimiento. Explora nuestros estampados y encuentra el tuyo.">
                            <Link to="/productosLanding" className="mc-cta">Explorar productos <FaArrowRight size={12} /></Link>
                            <Link to="/cotizacionesLanding" className="mc-cta alt">Cotizar un diseño</Link>
                        </EmptyState>
                    ) : (
                        <>
                            <div className="mc-bar sx-reveal">
                                <PillTabs items={tabs} value={filtro} onChange={setFiltro} />
                                <span className="mc-bar-t">{visibles.length} {visibles.length === 1 ? "compra encontrada" : "compras encontradas"}</span>
                            </div>

                            <div className="mc-grid" key={filtro}>
                                {visibles.map((venta, idx) => {
                                    const estadoNombre = nomEstado(venta);
                                    const est = getEstado(estadoNombre);
                                    const primerDetalle = venta.detalles?.[0] || {};
                                    const n = venta.detalles?.length || 0;
                                    return (
                                        <div key={venta.VentaID} className="mc-card sx-reveal" style={{ "--sx-i": idx % 6, "--mc-c": est.color }}>
                                            <div className="mc-card-top">
                                                <div>
                                                    <div className="mc-id"><small>Compra</small>#{venta.VentaID}</div>
                                                    <span className="mc-date"><FaCalendarAlt size={10} />{formatFecha(venta.FechaVenta)}</span>
                                                </div>
                                                <EstadoBadge nombre={estadoNombre} />
                                            </div>
                                            <div className="mc-card-body">
                                                <div className="mc-prod">
                                                    <div className="mc-thumb">
                                                        {primerDetalle.producto?.ImagenProducto
                                                            ? <img src={primerDetalle.producto.ImagenProducto} alt="prod" style={{ objectFit: "contain" }} />
                                                            : <FaBoxOpen style={{ opacity: .5 }} />}
                                                        {n > 1 && <span className="mc-more">+{n - 1}</span>}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p className="mc-pname">{primerDetalle.producto?.Nombre || "Producto"}</p>
                                                        <div className="mc-pmeta">
                                                            <span className="mc-pill">{n} {n === 1 ? "artículo" : "artículos"}</span>
                                                            <MetodoPagoBadge metodo={venta.MetodoPago} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Stepper {...pasosDe(estadoNombre)} />

                                                <div className="mc-total ok">
                                                    <div><small>Total</small><b>${formatPrecio(venta.Total)}</b></div>
                                                    <FaReceipt size={20} color="#16a34a" style={{ opacity: .45 }} />
                                                </div>

                                                {estadoNombre === "Pendiente" && (() => {
                                                    const limite = plazoDePagoAplica(venta) ? fechaLimitePago(venta.FechaVenta, config?.plazoPagoHoras) : null;
                                                    return (
                                                        <>
                                                            {venta.ComprobanteMotivoRechazo && (
                                                                <div className="ck-alert bad" role="alert" style={{ margin: 0 }}>
                                                                    <FaExclamationTriangle size={16} />
                                                                    <div>
                                                                        <b>Comprobante rechazado</b>
                                                                        <p>{venta.ComprobanteMotivoRechazo}</p>
                                                                        <BotonComprobante venta={venta} etiqueta="Subir un nuevo comprobante" onSubido={cargarVentas} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!venta.ComprobanteMotivoRechazo && puedeSubirComprobante(venta) && (
                                                                <BotonComprobante venta={venta} etiqueta="Subir comprobante" onSubido={cargarVentas} />
                                                            )}
                                                            {limite && (
                                                                <p className="ck-note" style={{ margin: 0, fontWeight: 700, color: "#92400e" }}>
                                                                    <FaClock size={11} /> Paga antes de {formatoFechaHoraCO(limite)}
                                                                </p>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                <button type="button" className="mc-btn" onClick={() => verDetalle(venta.VentaID)}>
                                                    <FaEye size={14} /> Ver detalle <FaChevronRight size={10} />
                                                </button>
                                                {(estadoNombre === "Entregada" || estadoNombre === "Cancelada") && (
                                                    <button type="button" className="ck-btn ghost" disabled={reordenando} onClick={() => volverAPedir(venta)}>
                                                        <FaRedo size={12} /> Volver a pedir
                                                    </button>
                                                )}
                                                {estadoNombre === "Pendiente" && (
                                                    <button type="button" className="mc-cancel" onClick={() => cancelarPedido(venta)}>
                                                        Cancelar pedido
                                                    </button>
                                                )}
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

            {ventaSeleccionada && (
                <ModalDetalle venta={ventaSeleccionada} onClose={() => setVentaSeleccionada(null)} config={config} onRecargar={recargarTodo} onVolverAPedir={volverAPedir} />
            )}
        </>
    );
};

export default MisCompras;
