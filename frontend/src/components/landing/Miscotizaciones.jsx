import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaEye, FaBoxOpen, FaTshirt, FaPalette, FaImage, FaCheckCircle,
    FaTimesCircle, FaClock, FaExchangeAlt, FaRuler, FaTint,
    FaLayerGroup, FaChevronRight, FaCalendarAlt, FaFileAlt, FaDollarSign, FaArrowRight, FaThumbsUp
} from 'react-icons/fa';
import FooterComponent from './footer';
import NavbarComponent from './NavBarLanding';
import Swal from 'sweetalert2';
import usePlus from '../../hooks/usePlus';
import { cancelarCotizacion } from '../../Services/api-cotizaciones/cotizaciones';
import {
    aceptarCotizacion, rechazarCotizacion, getHistorialCotizacion, mensajeError
} from '../../Services/api-cliente/cliente';
import { escapeHtml } from '../../utils/escapeHtml';
import { desgloseCotizacion } from '../../utils/clienteUtils';
import { LineaTiempo, BotonWhatsApp, useConfigPublica, CLIENTE_CSS } from './clienteKit';
import {
    MC_CSS, formatPrecio, leerUsuario, MiCuentaHero, StatCard, PillTabs, Stepper,
    McModal, ModalHead, EmptyState, Skeletons
} from './miCuentaKit';

const esAprobadaConPrecio = (c) =>
    (Number(c.EstadoID) === 2 || c.estado?.Nombre === 'Aprobada') && parseFloat(c.ValorTotal) > 0;

const C = {
    navy: "#1a2540", accent: "#4f8ef7", success: "#16a34a", warning: "#d97706", danger: "#dc2626",
    info: "#0369a1", muted: "#64748b",
};

const estadoConfig = {
    'Pendiente': { color: C.warning, bg: "#fffbeb", border: "#fde68a", icon: <FaClock size={11} /> },
    'Aprobada': { color: C.success, bg: "#f0fdf4", border: "#bbf7d0", icon: <FaCheckCircle size={11} /> },
    'Rechazada': { color: C.danger, bg: "#fef2f2", border: "#fecaca", icon: <FaTimesCircle size={11} /> },
    'Cancelada': { color: C.danger, bg: "#fef2f2", border: "#fecaca", icon: <FaTimesCircle size={11} /> },
    'Procesada': { color: C.info, bg: "#e0f2fe", border: "#bae6fd", icon: <FaExchangeAlt size={11} /> },
};
const getEstado = (nombre) => estadoConfig[nombre] || { color: C.muted, bg: "#f1f5f9", border: "#e2e8f0", icon: <FaClock size={11} /> };

const FLUJO = ['Pendiente', 'Aprobada', 'Procesada'];
const pasosDe = (nombre) => {
    if (nombre === 'Rechazada' || nombre === 'Cancelada') return { steps: ['Pendiente', nombre], current: 1, failed: true };
    const i = FLUJO.indexOf(nombre);
    return { steps: FLUJO, current: i < 0 ? 0 : i, failed: false };
};

const formatearFecha = (fecha, conHora = false) =>
    new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {})
    });

const Badge = ({ children }) => {
    const e = getEstado(children);
    return (
        <span className="mc-badge" style={{ background: e.bg, color: e.color, borderColor: e.border }}>
            {children}
        </span>
    );
};

const ImagenModal = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div className="mc-lightbox" onClick={onClose}>
            <img src={src} alt="Diseño ampliado" onClick={e => e.stopPropagation()} />
            <button type="button" className="mc-cta" onClick={onClose}>Cerrar</button>
        </div>
    );
};

// ─────────────────────────────────────────────────────
// MODAL DETALLE
// ─────────────────────────────────────────────────────
const ModalDetalleCotizacion = ({ cotizacion, onClose, onCancelar, cancelando = false, documentoID, config, onAceptar, onRechazar, procesando = false }) => {
    const [imagenAmpliada, setImagenAmpliada] = useState(null);
    const [historial, setHistorial] = useState(null);
    const [cargandoHist, setCargandoHist] = useState(true);
    useEffect(() => {
        let vivo = true;
        setCargandoHist(true);
        getHistorialCotizacion(cotizacion.CotizacionID).then((h) => { if (vivo) { setHistorial(h); setCargandoHist(false); } });
        return () => { vivo = false; };
    }, [cotizacion.CotizacionID]);
    const estadoNombre = cotizacion.estado?.Nombre || 'Pendiente';
    const puedeResponder = esAprobadaConPrecio(cotizacion) && (cotizacion.DocumentoID == null || String(cotizacion.DocumentoID) === String(documentoID));
    const desglose = desgloseCotizacion(cotizacion);
    const plazo = config?.plazoPagoHoras ?? 48;
    // Solo se puede cancelar una cotización Pendiente (EstadoID 1) que pertenece al cliente
    const esPendiente = Number(cotizacion.EstadoID) === 1 || (cotizacion.EstadoID == null && estadoNombre === 'Pendiente');
    const esDelCliente = cotizacion.DocumentoID == null || String(cotizacion.DocumentoID) === String(documentoID);
    const puedeCancelar = esPendiente && esDelCliente && !!onCancelar;
    const paso = pasosDe(estadoNombre);

    return (
        <>
            <ImagenModal src={imagenAmpliada} onClose={() => setImagenAmpliada(null)} />
            <McModal onClose={onClose} wide>
                <ModalHead eyebrow="Detalle de cotización" title={`Cotización #${cotizacion.CotizacionID}`}
                    sub={<><FaCalendarAlt size={10} style={{ marginRight: 6 }} />{formatearFecha(cotizacion.FechaCotizacion, true)}</>}
                    onClose={onClose} />

                <div className="mc-mbody">
                    <div className="mc-sum">
                        <div style={{ gridColumn: "span 1" }}>
                            <small>Estado</small>
                            <Badge>{estadoNombre}</Badge>
                            <div style={{ marginTop: 16 }}><Stepper {...paso} /></div>
                        </div>
                        <div>
                            <small>Valor total</small>
                            {parseFloat(cotizacion.ValorTotal) > 0
                                ? <div className="big">${formatPrecio(cotizacion.ValorTotal)}</div>
                                : <div className="big" style={{ fontSize: 18, color: C.muted }}>Pendiente de cotizar</div>}
                        </div>
                    </div>

                    {puedeResponder && (
                        <div className="ck-price" role="region" aria-label="Precio de tu cotización">
                            <small className="mc-lbl" style={{ color: C.success }}>Tu cotización está lista</small>
                            {desglose.lineas.map((l, i) => (
                                <React.Fragment key={i}>
                                    <div className="ck-price-row"><span>{l.nombre} × {l.cantidad}</span><b>${formatPrecio(l.subtotal)}</b></div>
                                    {l.prenda > 0 && <div className="ck-price-row sub"><span>Prenda</span><span>${formatPrecio(l.prenda)}</span></div>}
                                    {l.disenos > 0 && <div className="ck-price-row sub"><span>Diseños (estampado)</span><span>${formatPrecio(l.disenos)}</span></div>}
                                </React.Fragment>
                            ))}
                            <div className="ck-price-tot"><span>Total</span><strong>${formatPrecio(cotizacion.ValorTotal)}</strong></div>
                            <p className="ck-note">
                                Si aceptas, <b>se crea tu pedido y se reserva el stock</b>. Tendrás <b>{plazo} horas</b> para pagarlo; pasado ese plazo el pedido se cancela solo y el stock se libera.
                                Si no te interesa, puedes rechazarla y nos cuentas el motivo (opcional).
                            </p>
                            <div className="ck-actions">
                                <button type="button" className="ck-btn green" disabled={procesando} onClick={() => onAceptar(cotizacion)}>
                                    <FaThumbsUp size={13} /> {procesando ? 'Procesando...' : 'Aceptar y hacer pedido'}
                                </button>
                                <button type="button" className="ck-btn danger" disabled={procesando} onClick={() => onRechazar(cotizacion)}>
                                    <FaTimesCircle size={13} /> No me interesa
                                </button>
                            </div>
                        </div>
                    )}

                    <LineaTiempo eventos={historial} cargando={cargandoHist} titulo="Seguimiento de la cotización" />

                    <div className="mc-sec">Productos cotizados ({cotizacion.detalles?.length || 0})</div>

                    {cotizacion.detalles?.map((detalle, index) => {
                        const esPrendaPropia = detalle.TraePrenda;
                        return (
                            <div key={index} className="mc-item">
                                <div className="mc-item-h">
                                    <div className="mc-item-img">
                                        {esPrendaPropia ? <FaTshirt /> : detalle.producto?.ImagenProducto
                                            ? <img src={detalle.producto.ImagenProducto} alt="" />
                                            : <FaBoxOpen style={{ opacity: .5 }} />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p className="mc-item-t">Producto {index + 1}: {esPrendaPropia ? "Prenda del cliente" : (detalle.producto?.Nombre || "Sin nombre")}</p>
                                        <div className="mc-chips">
                                            <span className="mc-pill blue"><b>Cantidad:</b> {detalle.Cantidad} unidad{detalle.Cantidad !== 1 ? "es" : ""}</span>
                                        </div>
                                    </div>
                                </div>

                                {esPrendaPropia && detalle.PrendaDescripcion && (
                                    <div className="mc-note"><strong>Descripción:</strong> {detalle.PrendaDescripcion}</div>
                                )}

                                {!esPrendaPropia && (detalle.tallas?.length > 0 || detalle.colores?.length > 0 || detalle.insumos?.length > 0) && (
                                    <div className="mc-attrs">
                                        {detalle.tallas?.length > 0 && (
                                            <span><FaRuler size={11} color={C.accent} /> <b>Tallas:</b> {detalle.tallas.map(t => `${t.talla?.Nombre} (${t.Cantidad})`).join(", ")}</span>
                                        )}
                                        {detalle.colores?.length > 0 && (
                                            <span><FaTint size={11} color={C.accent} /> <b>Colores:</b> {detalle.colores.map(c => `${c.color?.Nombre} (${c.Cantidad})`).join(", ")}</span>
                                        )}
                                        {detalle.insumos?.length > 0 && (
                                            <span><FaLayerGroup size={11} color={C.accent} /> <b>Telas:</b> {detalle.insumos.map(i => `${i.insumo?.Nombre} × ${i.CantidadRequerida}`).join(", ")}</span>
                                        )}
                                    </div>
                                )}

                                {detalle.tecnicas?.length > 0 && (
                                    <div className="mc-designs">
                                        <div className="mc-lbl" style={{ color: "#7c3aed", display: "flex", alignItems: "center", gap: 7, marginBottom: 0 }}>
                                            <FaPalette size={12} /> Diseños aplicados ({detalle.tecnicas.length})
                                        </div>
                                        {detalle.tecnicas.map((tec, tidx) => {
                                            let subparte = "";
                                            let observacion = tec.Observaciones || "";
                                            if (observacion.startsWith("Subparte: ")) {
                                                const partes = observacion.split(" - ");
                                                subparte = partes[0].replace("Subparte: ", "").trim();
                                                observacion = partes.slice(1).join(" - ").trim();
                                            }
                                            return (
                                                <div key={tidx} className="mc-design">
                                                    {tec.ImagenUrl ? (
                                                        <button type="button" className="mc-design-img" onClick={() => setImagenAmpliada(tec.ImagenUrl)} title="Click para ampliar">
                                                            <img src={tec.ImagenUrl} alt="Diseño" onError={e => { e.target.style.display = "none"; }} />
                                                        </button>
                                                    ) : (
                                                        <div className="mc-design-img" style={{ cursor: "default", borderStyle: "dashed" }}><FaImage /></div>
                                                    )}
                                                    <div className="mc-design-b">
                                                        <div className="mc-design-t">
                                                            <strong><i>{tidx + 1}</i>{tec.tecnica?.Nombre || "Técnica N/A"}</strong>
                                                            {tec.CostoTecnica && parseFloat(tec.CostoTecnica) > 0
                                                                ? <span className="mc-cost">${formatPrecio(tec.CostoTecnica)}</span>
                                                                : <span className="mc-cost none">Sin precio asignado</span>}
                                                        </div>
                                                        <div className="mc-kv">
                                                            <div><small>Parte de la prenda</small><span>{tec.parte?.Nombre || "N/A"}</span></div>
                                                            <div><small>Subparte</small><span style={{ color: subparte ? undefined : C.muted, fontWeight: subparte ? 700 : 400 }}>{subparte || "No especificada"}</span></div>
                                                            {observacion && <div className="full"><small>Observaciones</small><span>{observacion}</span></div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mc-mfoot" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <BotonWhatsApp numero={config?.whatsapp} texto={`Hola StampLab, tengo una consulta sobre mi cotización #${cotizacion.CotizacionID}.`} />
                    {puedeCancelar && (
                        <button type="button" className="mc-cta alt" disabled={cancelando} onClick={() => onCancelar(cotizacion)}
                            style={{ color: C.danger, borderColor: C.danger }}>
                            <FaTimesCircle size={12} /> {cancelando ? "Cancelando..." : "Cancelar cotización"}
                        </button>
                    )}
                    <button type="button" className="mc-cta" onClick={onClose}>Cerrar</button>
                </div>
            </McModal>
        </>
    );
};

// ─────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────
const MisCotizaciones = () => {
    usePlus();
    const [cotizaciones, setCotizaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [documentoID, setDocumentoID] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("Todos");
    const [cancelando, setCancelando] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const config = useConfigPublica();
    const navigate = useNavigate();
    const nombreUsuario = leerUsuario().Nombre || "";

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
        } catch {
            Swal.fire({ icon: "error", title: "No pudimos cargar el detalle", text: "Revisa tu conexión e intenta de nuevo.", confirmButtonColor: C.navy });
        }
    };

    const cerrarDetalle = () => { setMostrarDetalle(false); setCotizacionSeleccionada(null); };
    const textoError = (err) => err?.response?.status === 404
        ? "Esta opción todavía no está disponible. Intenta de nuevo más tarde."
        : mensajeError(err);

    const handleAceptar = async (cot) => {
        const plazo = config?.plazoPagoHoras ?? 48;
        const r = await Swal.fire({
            icon: "question", title: "¿Aceptar y hacer pedido?",
            html: `<p style="margin:0 0 8px">Cotización <b>#${escapeHtml(cot.CotizacionID)}</b> por un total de <b>$${escapeHtml(formatPrecio(cot.ValorTotal))}</b>.</p>
<p style="margin:0;font-size:14px;color:#475569">Al aceptar se <b>crea tu pedido</b> y se <b>reserva el stock</b>. Tendrás <b>${escapeHtml(plazo)} horas</b> para pagarlo; pasado ese plazo se cancela automáticamente.</p>`,
            showCancelButton: true, confirmButtonText: "Sí, aceptar y hacer pedido", cancelButtonText: "Todavía no",
            confirmButtonColor: C.success, cancelButtonColor: C.navy,
        });
        if (!r.isConfirmed) return;
        setProcesando(true);
        try {
            const res = await aceptarCotizacion(cot.CotizacionID);
            const ventaId = res?.venta?.VentaID;
            cerrarDetalle();
            await cargarCotizaciones();
            const fin = await Swal.fire({
                icon: "success",
                title: ventaId ? `Pedido #${escapeHtml(ventaId)} creado` : "Pedido creado",
                html: `<p style="margin:0;font-size:14px;color:#475569">Tu pedido ya está en <a href="/miscompras"><b>Mis compras</b></a>. Recuerda pagarlo dentro de las próximas <b>${escapeHtml(plazo)} horas</b> para no perder la reserva.</p>`,
                showCancelButton: true, confirmButtonText: "Ir a Mis compras", cancelButtonText: "Quedarme aquí",
                confirmButtonColor: C.accent, cancelButtonColor: C.navy,
            });
            if (fin.isConfirmed) navigate("/miscompras");
        } catch (err) {
            Swal.fire({ icon: "error", title: "No se pudo crear el pedido", text: textoError(err), confirmButtonColor: C.danger });
        } finally { setProcesando(false); }
    };

    const handleRechazar = async (cot) => {
        const r = await Swal.fire({
            icon: "question", title: "¿No te interesa esta cotización?",
            text: "Cuéntanos el motivo (opcional). Nos ayuda a mejorar nuestras propuestas.",
            input: "textarea", inputPlaceholder: "Ej: el precio es más alto de lo que esperaba",
            inputAttributes: { maxlength: 300, "aria-label": "Motivo (opcional)" },
            showCancelButton: true, confirmButtonText: "Rechazar cotización", cancelButtonText: "Volver",
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
        });
        if (!r.isConfirmed) return;
        setProcesando(true);
        try {
            await rechazarCotizacion(cot.CotizacionID, r.value || "");
            cerrarDetalle();
            await cargarCotizaciones();
            Swal.fire({ icon: "success", title: "Cotización rechazada", text: "Gracias por avisarnos. Puedes crear una nueva cuando quieras.", confirmButtonColor: C.navy });
        } catch (err) {
            Swal.fire({ icon: "error", title: "No se pudo rechazar", text: textoError(err), confirmButtonColor: C.danger });
        } finally { setProcesando(false); }
    };

    const handleCancelar = async (cot) => {
        const r = await Swal.fire({
            icon: "warning", title: "¿Cancelar cotización?",
            text: `Se cancelará la cotización #${cot.CotizacionID}. Esta acción no se puede deshacer.`,
            showCancelButton: true, confirmButtonText: "Sí, cancelar", cancelButtonText: "No, volver",
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
        });
        if (!r.isConfirmed) return;
        setCancelando(true);
        try {
            await cancelarCotizacion(cot.CotizacionID);
            setMostrarDetalle(false); setCotizacionSeleccionada(null);
            await cargarCotizaciones();
            Swal.fire({ icon: "success", title: "Cotización cancelada", timer: 1800, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: "error", title: "No se pudo cancelar", text: err.response?.data?.mensaje || err.response?.data?.message || err.message || "Intenta nuevamente.", confirmButtonColor: C.danger });
        } finally { setCancelando(false); }
    };

    const nombreEstado = (c) => c.estado?.Nombre || "Pendiente";
    const estadosFiltro = ["Todos", ...new Set(cotizaciones.map(nombreEstado))];
    const cotizacionesFiltradas = filtroEstado === "Todos" ? cotizaciones : cotizaciones.filter(c => nombreEstado(c) === filtroEstado);
    const valorCotizado = cotizaciones.reduce((s, c) => s + (parseFloat(c.ValorTotal) || 0), 0);

    const tabs = estadosFiltro.map(est => ({
        key: est,
        label: est === "Todos" ? "Todas" : est,
        count: est === "Todos" ? cotizaciones.length : cotizaciones.filter(c => nombreEstado(c) === est).length,
    }));

    return (
        <>
            <style>{MC_CSS + CLIENTE_CSS}</style>
            <NavbarComponent />

            <div className="mc-page">
                <MiCuentaHero title="Mis" accent="Cotizaciones" nombre={nombreUsuario}
                    sub="Sigue el estado de cada cotización, revisa los diseños aplicados y el valor asignado.">
                    <div className="mc-stats">
                        <StatCard i={0} tone="blue" icon={<FaFileAlt />} label="Total" value={cotizaciones.length} />
                        <StatCard i={1} tone="amber" icon={<FaClock />} label="Pendientes" value={cotizaciones.filter(c => c.estado?.Nombre === "Pendiente").length} />
                        <StatCard i={2} tone="green" icon={<FaCheckCircle />} label="Aprobadas" value={cotizaciones.filter(c => c.estado?.Nombre === "Aprobada").length} />
                        <StatCard i={3} tone="violet" icon={<FaDollarSign />} label="Valor cotizado" value={valorCotizado} format={(n) => `$${formatPrecio(n)}`} />
                    </div>
                </MiCuentaHero>

                <div className="mc-wrap">

                    {cargando ? <Skeletons n={3} /> : (
                        <>
                            {cotizaciones.length > 0 && (
                                <div className="mc-bar sx-reveal">
                                    <PillTabs items={tabs} value={filtroEstado} onChange={setFiltroEstado} />
                                    <span className="mc-bar-t">{cotizacionesFiltradas.length} resultado{cotizacionesFiltradas.length !== 1 ? "s" : ""}</span>
                                </div>
                            )}

                            {cotizacionesFiltradas.length === 0 ? (
                                <EmptyState icon={<FaBoxOpen />}
                                    title={cotizaciones.length === 0 ? "Aún no tienes cotizaciones" : "Sin cotizaciones con este estado"}
                                    text={cotizaciones.length === 0 ? "Cuando realices una cotización aparecerá aquí. Cuéntanos tu idea y la hacemos realidad." : "Prueba seleccionando otro filtro."}>
                                    {cotizaciones.length === 0 ? (
                                        <>
                                            <Link to="/cotizacionesLanding" className="mc-cta">Cotizar ahora <FaArrowRight size={12} /></Link>
                                            <Link to="/productosLanding" className="mc-cta alt">Ver productos</Link>
                                        </>
                                    ) : (
                                        <button type="button" className="mc-cta alt" onClick={() => setFiltroEstado("Todos")}>Ver todas</button>
                                    )}
                                </EmptyState>
                            ) : (
                                <div className="mc-grid" key={filtroEstado}>
                                    {cotizacionesFiltradas.map((cot, idx) => {
                                        const estadoNombre = nombreEstado(cot);
                                        const est = getEstado(estadoNombre);
                                        const primerDetalle = cot.detalles?.[0] || {};
                                        const esPrendaPropia = primerDetalle.TraePrenda;
                                        const totalDisenos = cot.detalles?.reduce((s, d) => s + (d.tecnicas?.length || 0), 0) || 0;
                                        const nDet = cot.detalles?.length || 0;
                                        const conValor = cot.ValorTotal > 0;

                                        return (
                                            <div key={cot.CotizacionID} className="mc-card sx-reveal" style={{ "--sx-i": idx % 6, "--mc-c": est.color }}>
                                                <div className="mc-card-top">
                                                    <div>
                                                        <div className="mc-id"><small>Cotización</small>#{cot.CotizacionID}</div>
                                                        <span className="mc-date"><FaCalendarAlt size={10} />{formatearFecha(cot.FechaCotizacion)}</span>
                                                    </div>
                                                    <Badge>{estadoNombre}</Badge>
                                                </div>

                                                <div className="mc-card-body">
                                                    <div className="mc-prod">
                                                        <div className="mc-thumb">
                                                            {esPrendaPropia ? <FaTshirt /> : primerDetalle.producto?.ImagenProducto
                                                                ? <img src={primerDetalle.producto.ImagenProducto} alt="" />
                                                                : <FaBoxOpen style={{ opacity: .5 }} />}
                                                            {nDet > 1 && <span className="mc-more">+{nDet - 1}</span>}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p className="mc-pname">{esPrendaPropia ? "Prenda del cliente" : (primerDetalle.producto?.Nombre || "Producto")}</p>
                                                            <div className="mc-pmeta">
                                                                <span className="mc-pill">{nDet} producto{nDet !== 1 ? "s" : ""}</span>
                                                                <span className="mc-pill blue"><FaPalette size={10} /> {totalDisenos} diseño{totalDisenos !== 1 ? "s" : ""}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Stepper {...pasosDe(estadoNombre)} />

                                                    <div className={`mc-total ${conValor ? "ok" : ""}`}>
                                                        <div>
                                                            <small>Valor total</small>
                                                            <b className={conValor ? "" : "soft"}>{conValor ? `$${formatPrecio(cot.ValorTotal)}` : "Pendiente de cotizar"}</b>
                                                        </div>
                                                    </div>

                                                    {esAprobadaConPrecio(cot) && (
                                                        <p className="ck-note" style={{ margin: 0, color: C.success, fontWeight: 700 }}>
                                                            Tu cotización está lista: revísala y acéptala para crear tu pedido.
                                                        </p>
                                                    )}

                                                    <button type="button" className="mc-btn" onClick={() => verDetalle(cot.CotizacionID)}>
                                                        <FaEye size={14} /> Ver detalle <FaChevronRight size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {mostrarDetalle && cotizacionSeleccionada && (
                <ModalDetalleCotizacion cotizacion={cotizacionSeleccionada} onCancelar={handleCancelar} cancelando={cancelando} documentoID={documentoID}
                    config={config} onAceptar={handleAceptar} onRechazar={handleRechazar} procesando={procesando} onClose={cerrarDetalle} />
            )}

            <FooterComponent />
        </>
    );
};

export default MisCotizaciones;
