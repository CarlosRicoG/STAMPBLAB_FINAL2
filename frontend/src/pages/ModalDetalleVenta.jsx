import { descargarComprobante, getHistorialVenta, rechazarComprobante, marcarReembolsado } from "../Services/api-ventas/ventas";
import { getConfigPublica } from "../Services/api-resumen/resumen";
import { whatsappUrl, fechaLimitePago } from "../Services/api-ventas/flujo";
import { referenciaPlazoPago } from "../utils/clienteUtils";
import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import { FaCreditCard, FaTruck, FaInfoCircle, FaTimes, FaUser, FaReceipt, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaIdCard, FaCheck, FaBan, FaBoxOpen, FaStore, FaWhatsapp, FaHistory, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { ESTADO_VENTA } from "../config/estados";
import { C } from "../config/tokens";
import { fmtCOP } from "../utils/formato";
import VisorComprobante, { LightboxComprobante } from "../components/VisorComprobante";
import { VT, VT_CSS, estiloEstado, fmtFecha, fmtHora, iniciales, colorHex } from "./ventas/ventasUi";
import { EstadoBadge, TimelineEstado } from "./ventas/componentesVenta";
import { esPagoPorVerificar } from "../utils/pagoPorVerificar";
import { swalEncima } from "../utils/alertas";

/* ══════════════════════════════════════════════════════════ */
let configCache = null; // /config-publica casi no cambia: se consulta una sola vez por sesión de la página

const ModalDetalleVenta = ({ venta, onClose, footerExtra, onActualizado }) => {
    const [zoom, setZoom] = useState(false);
    const [historial, setHistorial] = useState(null); // null = cargando, [] = sin datos o error
    const [config, setConfig] = useState(configCache);
    const [motivoLocal, setMotivoLocal] = useState(undefined); // undefined = usar el de la venta
    const [rechazando, setRechazando] = useState(false);
    const [reembolsoHecho, setReembolsoHecho] = useState(false);
    const [marcandoReembolso, setMarcandoReembolso] = useState(false);
    const [pagoResuelto, setPagoResuelto] = useState(false); // "pago por verificar" ya cerrado desde este modal
    const [resolviendoPago, setResolviendoPago] = useState(false);
    const ventaID = venta?.VentaID;

    useEffect(() => {
        if (!ventaID) return;
        let vivo = true;
        setHistorial(null); setMotivoLocal(undefined); setPagoResuelto(false);
        getHistorialVenta(ventaID)
            .then(h => { if (vivo) setHistorial(Array.isArray(h) ? h : []); })
            .catch(() => { if (vivo) setHistorial([]); });
        return () => { vivo = false; };
    }, [ventaID]);

    useEffect(() => {
        if (configCache) return;
        let vivo = true;
        getConfigPublica().then(c => { configCache = c || {}; if (vivo) setConfig(configCache); }).catch(() => { });
        return () => { vivo = false; };
    }, []);

    const handleReembolso = async () => {
        const r = await Swal.fire({
            icon: "question", title: "¿Ya devolviste el dinero?",
            text: "Marca el reembolso como realizado solo cuando el cliente ya recibió su dinero.",
            showCancelButton: true, confirmButtonText: "Sí, ya lo devolví", cancelButtonText: "Todavía no",
            didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; },
        });
        if (!r.isConfirmed) return;
        setMarcandoReembolso(true);
        try {
            await marcarReembolsado(venta.VentaID);
            setReembolsoHecho(true);
            onActualizado?.();
        } catch (e) {
            Swal.fire({ icon: "error", title: "No se pudo marcar el reembolso", text: e?.response?.data?.message || e?.message || "Intenta de nuevo.",
                didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
        } finally { setMarcandoReembolso(false); }
    };

    const handleRechazar = async () => {
        const r = await Swal.fire({
            title: "Rechazar comprobante",
            text: "El pedido seguirá Pendiente y se avisará al cliente para que suba uno nuevo. Indica el motivo.",
            input: "textarea", inputLabel: "Motivo del rechazo (5 a 300 caracteres)",
            inputPlaceholder: "Ej.: El valor transferido no coincide con el total del pedido.",
            inputAttributes: { maxlength: 300, "aria-label": "Motivo del rechazo" },
            showCancelButton: true, confirmButtonText: "Rechazar comprobante", cancelButtonText: "Cancelar",
            confirmButtonColor: VT.danger, cancelButtonColor: VT.navy,
            didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; },
            inputValidator: (v) => {
                const t = (v || "").trim();
                if (t.length < 5) return "El motivo debe tener al menos 5 caracteres.";
                if (t.length > 300) return "El motivo no puede superar 300 caracteres.";
                return undefined;
            },
        });
        if (!r.isConfirmed) return;
        setRechazando(true);
        try {
            const motivo = r.value.trim();
            await rechazarComprobante(ventaID, motivo, venta?.FechaTransferencia);
            setMotivoLocal(motivo);
            Swal.fire({ icon: "success", title: "Comprobante rechazado", text: "Se avisó al cliente por correo.", timer: 2200, showConfirmButton: false,
                didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
            onActualizado?.();
        } catch (e) {
            Swal.fire({ icon: "error", title: "No se pudo rechazar el comprobante", text: e?.response?.data?.message || e?.message || "Intenta de nuevo.",
                didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
        } finally { setRechazando(false); }
    };

    /* ── Pago por verificar (pedido cancelado con un comprobante sin revisar) ── */
    const handlePagoDevuelto = async () => {
        const r = await swalEncima({
            icon: "question", title: "¿El pago llegó y ya lo devolviste?",
            text: "Confírmalo solo si el dinero del comprobante sí entró y ya se lo devolviste al cliente.",
            showCancelButton: true, confirmButtonText: "Sí, llegó y lo devolví", cancelButtonText: "Todavía no",
        });
        if (!r.isConfirmed) return;
        setResolviendoPago(true);
        try {
            await marcarReembolsado(ventaID);
            setPagoResuelto(true);
            onActualizado?.();
        } catch (e) {
            swalEncima({ icon: "error", title: "No se pudo registrar el reembolso", text: e?.response?.data?.message || e?.message || "Intenta de nuevo." });
        } finally { setResolviendoPago(false); }
    };

    const handleSinPago = async () => {
        const r = await swalEncima({
            title: "No hubo pago / comprobante no válido",
            text: "El pedido ya está cancelado: solo queda constancia de que no hubo pago. Indica el motivo.",
            input: "textarea", inputLabel: "Motivo (5 a 300 caracteres)",
            inputPlaceholder: "Ej.: El valor nunca llegó a la cuenta.",
            inputAttributes: { maxlength: 300, "aria-label": "Motivo" },
            showCancelButton: true, confirmButtonText: "Registrar", cancelButtonText: "Cancelar",
            confirmButtonColor: VT.danger, cancelButtonColor: VT.navy,
            inputValidator: (v) => {
                const t = (v || "").trim();
                if (t.length < 5) return "El motivo debe tener al menos 5 caracteres.";
                if (t.length > 300) return "El motivo no puede superar 300 caracteres.";
                return undefined;
            },
        });
        if (!r.isConfirmed) return;
        setResolviendoPago(true);
        try {
            const motivo = r.value.trim();
            await rechazarComprobante(ventaID, motivo, venta?.FechaTransferencia);
            setMotivoLocal(motivo);
            setPagoResuelto(true);
            onActualizado?.();
        } catch (e) {
            swalEncima({ icon: "error", title: "No se pudo registrar", text: e?.response?.data?.message || e?.message || "Intenta de nuevo." });
        } finally { setResolviendoPago(false); }
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") { if (zoom) setZoom(false); else onClose?.(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom, onClose]);

    if (!venta) return null;

    const estadoNombre = venta.estado?.Nombre || estiloEstado(venta.EstadoID).nombre;
    const detalles = venta.detalles || [];
    const unidades = detalles.reduce((a, d) => a + (parseInt(d.Cantidad) || 0), 0);
    const subtotalCalc = detalles.reduce((a, d) => a + (parseInt(d.Cantidad) || 0) * (parseFloat(d.PrecioUnitario) || 0), 0);
    const subtotal = venta.Subtotal != null ? parseFloat(venta.Subtotal) : subtotalCalc;
    const total = venta.Total != null ? parseFloat(venta.Total) : subtotal;
    const fecha = venta.FechaVenta ? new Date(venta.FechaVenta) : null;
    const fechaLarga = fecha
        ? fecha.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + fmtHora(venta.FechaVenta)
        : "-";
    const cliente = venta.usuario || {};
    const metodo = venta.MetodoPago;
    const motivoRechazo = motivoLocal !== undefined ? motivoLocal : venta.ComprobanteMotivoRechazo;
    const pendiente = venta.EstadoID === ESTADO_VENTA.PENDIENTE;
    const esEnvio = venta.TipoEntrega === "envio";
    const hayEntrega = !!venta.TipoEntrega;
    // Receptor y dirección que el cliente escribió al pagar: contra entrega y también envío pagado por transferencia
    const conDatosEntrega = metodo === "contraentrega" || esEnvio || !!venta.DireccionEntrega;
    const costoEnvio = parseFloat(venta.CostoEnvio) || 0;
    const telefonoCliente = venta.ContactoTelefono || cliente.Telefono || venta.TelefonoEntrega;
    const waUrl = whatsappUrl(telefonoCliente, `Hola ${venta.ContactoNombre || cliente.Nombre || ""}, te escribimos de STAMPLAB sobre tu pedido #${venta.VentaID}.`.replace(/\s+,/, ","));
    const limitePago = pendiente ? fechaLimitePago(referenciaPlazoPago(venta), config?.plazoPagoHoras) : null;
    // Las fechas "YYYY-MM-DD" se interpretan como día local (new Date() las toma como UTC y mostraría el día anterior)
    const fe = venta.FechaEstimadaEntrega ? String(venta.FechaEstimadaEntrega).slice(0, 10) : "";
    const fechaEstimada = /^\d{4}-\d{2}-\d{2}$/.test(fe) ? new Date(+fe.slice(0, 4), +fe.slice(5, 7) - 1, +fe.slice(8, 10)) : null;
    const fmtLarga = (d) => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) + " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="vt-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }} role="dialog" aria-modal="true" aria-label={`Detalle de la venta ${venta.VentaID}`}>
            <style>{VT_CSS}</style>
            <div className="vt-modal" style={{ maxWidth: 980 }}>
                {/* Cabecera */}
                <div className="vt-mhead">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, position: "relative", zIndex: 1 }}>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }}>Detalle del pedido</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>Venta #{venta.VentaID}</h2>
                                <EstadoBadge id={venta.EstadoID} nombre={estadoNombre} size="lg" />
                            </div>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,.75)", textTransform: "capitalize" }}>{fechaLarga}</p>
                        </div>
                        <button className="vt-mclose" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="vt-mbody">
                    {/* Timeline */}
                    <div className="vt-sec" style={{ marginBottom: 14 }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: C.purpleSoft, color: VT.violet }}><FaCheck /></span>Seguimiento del pedido</p>
                        <TimelineEstado estadoID={venta.EstadoID} />
                        {fechaEstimada && venta.EstadoID !== 12 && venta.EstadoID !== 11 && (
                            <div className="vt-kv" style={{ marginTop: 14, color: VT.violet, fontWeight: 700 }}>
                                <FaCalendarAlt size={12} style={{ color: VT.violet }} />
                                <span>Entrega estimada: {fechaEstimada.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                            </div>
                        )}
                    </div>

                    {venta.ReembolsoPendiente && !reembolsoHecho && (
                        <div role="alert" style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                <FaInfoCircle style={{ marginTop: 2, flexShrink: 0 }} />
                                <span><b>Reembolso pendiente:</b> este pedido ya estaba pagado cuando se canceló. Devuelve el dinero al cliente y márcalo aquí.</span>
                            </span>
                            <button className="vt-btn-ghost" onClick={handleReembolso} disabled={marcandoReembolso}>{marcandoReembolso ? "Guardando..." : "Marcar reembolso realizado"}</button>
                        </div>
                    )}

                    {esPagoPorVerificar(venta) && !pagoResuelto && (
                        <div role="alert" className="vt-pago-verificar" style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                <FaInfoCircle style={{ marginTop: 2, flexShrink: 0 }} />
                                <span><b>Pago por verificar:</b> este pedido se canceló con un comprobante de transferencia que nadie revisó. Confirma si el pago llegó (y se devolvió) o si no hubo pago.</span>
                            </span>
                            <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button className="vt-btn-ghost" onClick={handlePagoDevuelto} disabled={resolviendoPago}>{resolviendoPago ? "Guardando..." : "El pago llegó y ya lo devolví"}</button>
                                <button className="vt-btn-ghost" onClick={handleSinPago} disabled={resolviendoPago} style={{ color: VT.danger, background: C.dangerSoft }}>No hubo pago / comprobante no válido</button>
                            </span>
                        </div>
                    )}

                    {limitePago && (
                        <div role="status" style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#92400e", fontWeight: 600, display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <FaClock style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>
                                Plazo de pago: el cliente debe pagar antes del {fmtLarga(limitePago)}
                                {limitePago < new Date() ? " (plazo vencido: el sistema cancelará el pedido automáticamente)." : ". Pasado ese plazo el pedido se cancela solo y el stock vuelve al inventario."}
                            </span>
                        </div>
                    )}

                    <div className="vt-grid-3" style={{ marginBottom: 14 }}>
                        {/* Cliente */}
                        <div className="vt-sec" style={{ animationDelay: ".04s" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaUser /></span>Cliente</p>
                            <div className="vt-client">
                                <div className="vt-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{iniciales(cliente.Nombre)}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div className="vt-client-name" style={{ fontSize: 15 }}>{cliente.Nombre || "Sin nombre"}</div>
                                    <div className="vt-client-sub"><FaIdCard size={11} /> {venta.DocumentoID || "N/A"}</div>
                                </div>
                            </div>
                            {cliente.Correo && <div className="vt-kv"><FaEnvelope size={12} /><span style={{ wordBreak: "break-all" }}>{cliente.Correo}</span></div>}
                            {cliente.Telefono && <div className="vt-kv"><FaPhoneAlt size={12} /><span>{cliente.Telefono}</span></div>}
                        </div>

                        {/* Pago */}
                        <div className="vt-sec" style={{ animationDelay: ".08s" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.successSoft, color: VT.success }}><FaCreditCard /></span>Método de pago</p>
                            {metodo === "transferencia" ? (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.accentSoft, color: VT.accent, borderColor: VT.accentBorder }}><FaCreditCard /> Transferencia bancaria</span>
                                    {venta.FechaTransferencia && <div className="vt-kv"><FaReceipt size={12} /><span>Transferido el {fmtFecha(venta.FechaTransferencia)} · {fmtHora(venta.FechaTransferencia)}</span></div>}
                                    {!venta.ComprobanteTransferencia && <div className="vt-kv" style={{ color: VT.warning }}><FaInfoCircle size={12} /><span>Sin comprobante adjunto</span></div>}
                                </>
                            ) : metodo === "contraentrega" ? (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.successSoft, color: VT.success, borderColor: VT.successBorder }}><FaTruck /> Pago contraentrega</span>
                                    <div className="vt-kv"><FaInfoCircle size={12} /><span>El cliente paga al recibir el pedido.</span></div>
                                </>
                            ) : (
                                <>
                                    <span className="vt-badge vt-badge-lg" style={{ background: VT.warningSoft, color: "#92400e", borderColor: VT.warningBorder }}><FaInfoCircle /> Venta presencial</span>
                                    <div className="vt-kv"><FaInfoCircle size={12} /><span>Sin método de pago registrado.</span></div>
                                </>
                            )}
                        </div>

                        {/* Totales */}
                        <div className="vt-sec" style={{ animationDelay: ".12s", display: "flex", flexDirection: "column" }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: C.purpleSoft, color: VT.violet }}><FaReceipt /></span>Resumen</p>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: VT.muted, marginBottom: 6 }}>
                                <span>Productos</span><strong style={{ color: VT.navy }}>{detalles.length} ítem(s) · {unidades} und.</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: VT.muted }}>
                                <span>Subtotal</span><strong style={{ color: VT.navy }}>{fmtCOP(subtotal)}</strong>
                            </div>
                            <div className="vt-total-box" style={{ marginTop: "auto" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: .8 }}>Total</span>
                                <span data-testid="vt-total" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>{fmtCOP(total)}</span>
                            </div>
                        </div>
                    </div>

                    {(hayEntrega || venta.ContactoNombre || venta.ContactoTelefono || venta.ContactoDireccion || waUrl) && (
                        <div className="vt-sec" style={{ marginBottom: 14 }}>
                            <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaTruck /></span>Entrega y contacto del pedido</p>
                            <div className="vt-grid-3" style={{ gap: 10 }}>
                                {[
                                    { ic: esEnvio ? <FaTruck /> : <FaStore />, l: "Tipo de entrega", v: hayEntrega ? (esEnvio ? "Envío a domicilio" : "Retiro en tienda") : "—" },
                                    { ic: <FaReceipt />, l: "Costo de envío", v: hayEntrega ? (esEnvio ? (costoEnvio > 0 ? fmtCOP(costoEnvio) : "Sin costo") : "No aplica") : "—" },
                                    { ic: <FaUser />, l: "Contacto", v: venta.ContactoNombre },
                                    { ic: <FaPhoneAlt />, l: "Teléfono de contacto", v: venta.ContactoTelefono },
                                    { ic: <FaMapMarkerAlt />, l: "Dirección de contacto", v: venta.ContactoDireccion },
                                ].map(x => (
                                    <div key={x.l} style={{ background: VT.bg, borderRadius: 12, padding: "10px 12px", border: "1px solid #eef2f7" }}>
                                        <div style={{ fontSize: 11, color: VT.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{x.ic}{x.l}</div>
                                        <div style={{ fontSize: 13.5, color: VT.navy, fontWeight: 600, marginTop: 3, wordBreak: "break-word" }}>{x.v || "—"}</div>
                                    </div>
                                ))}
                            </div>
                            {waUrl && (
                                <a className="vt-btn-ghost" href={waUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", marginTop: 12, color: "#15803d", background: VT.successSoft }}>
                                    <FaWhatsapp size={15} /> Escribir por WhatsApp
                                </a>
                            )}
                        </div>
                    )}

                    {(conDatosEntrega || venta.ComprobanteTransferencia) && (
                        <div className="vt-grid-2" style={{ marginBottom: 14, gridTemplateColumns: conDatosEntrega && venta.ComprobanteTransferencia ? "1fr 1fr" : "1fr" }}>
                            {conDatosEntrega && (
                                <div className="vt-sec">
                                    <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.successSoft, color: VT.success }}><FaTruck /></span>Datos de entrega</p>
                                    <div className="vt-grid-3" style={{ gap: 10 }}>
                                        {[
                                            { ic: <FaUser />, l: "Recibe", v: venta.NombreReceptor },
                                            { ic: <FaPhoneAlt />, l: "Teléfono", v: venta.TelefonoEntrega },
                                            { ic: <FaMapMarkerAlt />, l: "Dirección", v: venta.DireccionEntrega },
                                        ].map(x => (
                                            <div key={x.l} style={{ background: VT.bg, borderRadius: 12, padding: "10px 12px", border: "1px solid #eef2f7" }}>
                                                <div style={{ fontSize: 11, color: VT.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{x.ic}{x.l}</div>
                                                <div style={{ fontSize: 13.5, color: VT.navy, fontWeight: 600, marginTop: 3, wordBreak: "break-word" }}>{x.v || "—"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {venta.ComprobanteTransferencia && (
                                <div className="vt-sec">
                                    <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaReceipt /></span>Comprobante de transferencia</p>
                                    <VisorComprobante comprobante={venta.ComprobanteTransferencia} ventaID={venta.VentaID} onZoom={() => setZoom(true)}>
                                        {pendiente && metodo === "transferencia" && (
                                            <button className="vt-btn-ghost" onClick={handleRechazar} disabled={rechazando}
                                                style={{ display: "inline-flex", alignItems: "center", gap: 7, color: VT.danger, background: C.dangerSoft }}>
                                                <FaBan /> {rechazando ? "Rechazando..." : "Rechazar comprobante"}
                                            </button>
                                        )}
                                    </VisorComprobante>
                                    {motivoRechazo && (
                                        <div role="status" style={{ marginTop: 12, background: C.dangerSoft, border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#991b1b", fontWeight: 600 }}>
                                            Comprobante rechazado. Motivo: <span style={{ fontWeight: 500 }}>{motivoRechazo}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Historial */}
                    <div className="vt-sec" style={{ marginBottom: 14 }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: C.purpleSoft, color: VT.violet }}><FaHistory /></span>Historial del pedido</p>
                        {historial === null ? (
                            <div><div className="vt-skel" style={{ width: "60%", marginBottom: 8 }} /><div className="vt-skel" style={{ width: "40%" }} /></div>
                        ) : historial.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: VT.muted }}>Todavía no hay movimientos registrados para este pedido.</p>
                        ) : (
                            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                {historial.map((h, i) => {
                                    const s = estiloEstado(h.EstadoID ?? h.Estado);
                                    return (
                                        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                            <span className="vt-dot" style={{ background: s.color, width: 10, height: 10, marginTop: 5 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: VT.navy }}>
                                                    {h.Estado || s.nombre}
                                                    <span style={{ fontWeight: 500, color: VT.muted, marginLeft: 8, fontSize: 12 }}>{fmtFecha(h.Fecha)} · {fmtHora(h.Fecha)}</span>
                                                </div>
                                                {h.Nota && <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2, wordBreak: "break-word" }}>{h.Nota}</div>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    {/* Productos */}
                    <div className="vt-sec" style={{ animationDelay: ".16s" }}>
                        <p className="vt-sec-title"><span className="vt-sec-ic" style={{ background: VT.accentSoft, color: VT.accent }}><FaBoxOpen /></span>Productos vendidos</p>
                        {detalles.length > 0 ? (
                            <div>
                                {detalles.map((d, i) => {
                                    const hex = colorHex(d.color?.Nombre);
                                    const lineTotal = (parseInt(d.Cantidad) || 0) * (parseFloat(d.PrecioUnitario) || 0);
                                    return (
                                        <div key={d.DetalleVentaID || i} className="vt-item">
                                            <div className="vt-thumb">
                                                {d.producto?.ImagenProducto
                                                    ? <img loading="lazy" decoding="async" src={d.producto.ImagenProducto} alt={d.producto?.Nombre} />
                                                    : <FaBoxOpen style={{ color: "#cbd5e1" }} size={22} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, color: VT.navy, fontSize: 14 }}>{d.producto?.Nombre || "Producto sin nombre"}</div>
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                                    <span className="vt-chip">{hex && <span className="vt-swatch" style={{ background: hex }} />}{d.color?.Nombre || "Sin color"}</span>
                                                    <span className="vt-chip">Talla {d.talla?.Nombre || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right", fontSize: 12.5, color: VT.muted, whiteSpace: "nowrap" }}>
                                                {d.Cantidad} × {fmtCOP(d.PrecioUnitario)}
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 100, fontWeight: 800, color: VT.navy, fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>
                                                {fmtCOP(lineTotal)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, paddingTop: 12, marginTop: 4, borderTop: "1px solid #e2e8f0", fontSize: 13, color: VT.muted }}>
                                    <span>Subtotal <strong style={{ color: VT.navy, marginLeft: 6 }}>{fmtCOP(subtotal)}</strong></span>
                                    <span>Total <strong style={{ color: VT.success, marginLeft: 6, fontSize: 15 }}>{fmtCOP(total)}</strong></span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ textAlign: "center", color: VT.muted, padding: 24, margin: 0, fontSize: 13 }}>No hay productos en esta venta</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="vt-mfoot">
                    <button className="vt-btn-ghost" onClick={() => descargarComprobante(venta.VentaID).catch(() => alert("No se pudo descargar el comprobante"))}>Descargar comprobante</button>
                    {footerExtra}
                    <button className={footerExtra ? "vt-btn-ghost" : "vt-btn-primary"} onClick={onClose}>Cerrar</button>
                </div>
            </div>

            {zoom && venta.ComprobanteTransferencia && (
                <LightboxComprobante comprobante={venta.ComprobanteTransferencia} className="vt-lightbox" onCerrar={() => setZoom(false)} imgStyle={{ cursor: "default" }}>
                    <span style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>Clic fuera de la imagen o Esc para cerrar</span>
                </LightboxComprobante>
            )}
        </div>
    );
};

export default ModalDetalleVenta;
