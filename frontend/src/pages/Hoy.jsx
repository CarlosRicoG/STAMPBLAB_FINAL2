import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaSyncAlt, FaFileInvoiceDollar, FaReceipt, FaTruck, FaBoxes, FaCheckCircle,
    FaExclamationTriangle, FaSearchPlus, FaTimes, FaArrowRight, FaCheck, FaBan,
} from "react-icons/fa";
import Swal from "sweetalert2";
import API_BASE from "../config/api";
import { escapeHtml } from "../utils/escapeHtml";
import { getResumenHoy } from "../Services/api-resumen/resumen";
import { updateEstadoVenta, rechazarComprobante } from "../Services/api-ventas/ventas";
import { SIGUIENTE_NORMAL, NOMBRE_ESTADO_VENTA, ESTADOS_CON_FECHA, hoyISO } from "../Services/api-ventas/flujo";
import { ESTADO_VENTA } from "../config/estados";
import { EstadoBadge, fmtCOP, fmtFecha, fmtHora } from "./ModalDetalleVenta";
import { C } from "../config/tokens";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
.cf-p-hoy, .cf-p-hoy * { box-sizing: border-box; }
.cf-p-hoy { font-family: 'Outfit', sans-serif; background: ${C.bg}; min-height: 100%; padding: 28px 32px; }
.cf-p-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.cf-p-h1 { margin: 0; font-weight: 800; font-size: 22px; color: ${C.navy}; letter-spacing: -.02em; }
.cf-p-sub { margin: 3px 0 0; color: ${C.muted}; font-size: 13px; }
.cf-p-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 22px; }
.cf-p-kpi { font-family: inherit; text-align: left; cursor: pointer; background: #fff; border: 1px solid #eef2f7; border-radius: 16px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; box-shadow: 0 1px 3px rgba(15,23,42,.04); transition: transform .2s, box-shadow .2s; }
.cf-p-kpi:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15,23,42,.08); }
.cf-p-kpi:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.cf-p-kpi-ic { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; font-size: 17px; flex-shrink: 0; }
.cf-p-kpi b { display: block; font-size: 24px; font-weight: 800; color: ${C.navy}; line-height: 1; font-variant-numeric: tabular-nums; }
.cf-p-kpi span { font-size: 12px; color: ${C.muted}; font-weight: 600; }
.cf-p-sec { background: #fff; border: 1px solid #eef2f7; border-radius: 18px; margin-bottom: 18px; box-shadow: 0 2px 16px rgba(15,23,42,.05); overflow: hidden; }
.cf-p-sec-h { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%); color: #fff; }
.cf-p-sec-h h2 { margin: 0; font-size: 14px; font-weight: 800; letter-spacing: .02em; }
.cf-p-count { margin-left: auto; background: rgba(255,255,255,.18); border-radius: 999px; padding: 2px 11px; font-size: 12px; font-weight: 700; }
.cf-p-list { list-style: none; margin: 0; padding: 0; }
.cf-p-row { display: flex; align-items: center; gap: 14px; padding: 13px 18px; border-bottom: 1px solid #eef2f7; flex-wrap: wrap; }
.cf-p-row:last-child { border-bottom: none; }
.cf-p-row:hover { background: #f8faff; }
.cf-p-main { flex: 1; min-width: 200px; }
.cf-p-name { font-weight: 700; color: ${C.navy}; font-size: 14px; }
.cf-p-meta { font-size: 12px; color: ${C.muted}; margin-top: 2px; }
.cf-p-money { font-weight: 800; color: ${C.navy}; font-variant-numeric: tabular-nums; white-space: nowrap; }
.cf-p-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.cf-p-btn { border: 1.5px solid transparent; border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-family: 'Outfit', sans-serif; text-decoration: none; transition: transform .15s, box-shadow .15s, background .15s; white-space: nowrap; }
.cf-p-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,23,42,.14); }
.cf-p-btn:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.cf-p-btn:disabled { opacity: .55; cursor: not-allowed; }
.cf-p-btn.ok { background: ${C.success}; color: #fff; }
.cf-p-btn.nav { background: ${C.navy}; color: #fff; }
.cf-p-btn.viol { background: ${C.violet}; color: #fff; }
.cf-p-btn.ghost { background: #fff; color: ${C.navy}; border-color: ${C.border}; }
.cf-p-btn.bad { background: #fff; color: ${C.danger}; border-color: #fecaca; }
.cf-p-tag { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 700; border: 1px solid; white-space: nowrap; }
.cf-p-tag.warn { background: #fffbeb; color: #92400e; border-color: #fde68a; }
.cf-p-tag.bad { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.cf-p-thumb { width: 56px; height: 56px; border-radius: 12px; border: 1px solid ${C.border}; background: #f1f5f9; overflow: hidden; padding: 0; cursor: zoom-in; position: relative; flex-shrink: 0; display: grid; place-items: center; color: #94a3b8; }
.cf-p-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cf-p-thumb:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.cf-p-ok { text-align: center; padding: 26px 16px; color: ${C.muted}; font-size: 13px; }
.cf-p-ok svg { color: ${C.success}; font-size: 24px; display: block; margin: 0 auto 6px; }
.cf-p-ok b { display: block; color: ${C.navy}; font-size: 14px; }
.cf-p-skel { height: 14px; border-radius: 7px; background: linear-gradient(90deg,#eef2f7 0px,#f8fafc 120px,#eef2f7 240px); background-size: 800px 100%; animation: cf-p-shimmer 1.2s linear infinite; }
@keyframes cf-p-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
@keyframes cf-p-spin { to { transform: rotate(360deg); } }
.cf-p-spin { animation: cf-p-spin .8s linear infinite; }
.cf-p-err { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 14px; padding: 14px 18px; color: ${C.danger}; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.cf-p-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cf-p-table th { text-align: left; font-size: 11px; font-weight: 700; color: ${C.muted}; letter-spacing: .06em; text-transform: uppercase; padding: 10px 18px; border-bottom: 1px solid #eef2f7; background: #fbfcfe; }
.cf-p-table td { padding: 11px 18px; border-bottom: 1px solid #eef2f7; }
.cf-p-table tr:last-child td { border-bottom: none; }
.cf-p-lightbox { position: fixed; inset: 0; z-index: 1100; background: rgba(2,6,23,.88); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; padding: 24px; }
.cf-p-lightbox img { max-width: 92vw; max-height: 80vh; border-radius: 12px; background: #fff; }
@media (max-width: 640px) { .cf-p-hoy { padding: 20px 16px; } .cf-p-row { align-items: flex-start; } }
@media (prefers-reduced-motion: reduce) { .cf-p-skel, .cf-p-spin { animation: none; } .cf-p-btn, .cf-p-kpi { transition: none; } }
`;

const urlComprobante = (c) => (c && c.startsWith("/") ? `${API_BASE}${c}` : c);
const swalTop = (opts) => Swal.fire({ ...opts, didOpen: () => { const c = document.querySelector(".swal2-container"); if (c) c.style.zIndex = "99999"; } });
const errMsg = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
const refrescarMenu = () => { try { window.dispatchEvent(new Event("stamplab:refrescar-resumen")); } catch { /* sin window */ } };

const Seccion = ({ icono, titulo, cantidad, cargando, vacio, children }) => (
    <section className="cf-p-sec" aria-label={titulo}>
        <div className="cf-p-sec-h">{icono}<h2>{titulo}</h2>{!cargando && <span className="cf-p-count">{cantidad}</span>}</div>
        {cargando ? (
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
                <div className="cf-p-skel" style={{ width: "55%" }} /><div className="cf-p-skel" style={{ width: "80%" }} /><div className="cf-p-skel" style={{ width: "40%" }} />
            </div>
        ) : cantidad === 0 ? (
            <div className="cf-p-ok"><FaCheckCircle aria-hidden="true" /><b>Todo al día</b>{vacio}</div>
        ) : children}
    </section>
);

const Hoy = () => {
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [ocupado, setOcupado] = useState(null); // clave "tipo-id" de la acción en curso
    const [zoom, setZoom] = useState(null);
    const reqId = useRef(0);

    const cargar = useCallback(async () => {
        const id = ++reqId.current;
        setCargando(true); setError("");
        try {
            const r = await getResumenHoy();
            if (id !== reqId.current) return;
            setDatos({
                cotizacionesPendientes: r?.cotizacionesPendientes || [],
                comprobantesPorRevisar: r?.comprobantesPorRevisar || [],
                pedidosPorAvanzar: r?.pedidosPorAvanzar || [],
                stockBajo: r?.stockBajo || [],
            });
        } catch (e) {
            if (id !== reqId.current) return;
            setError(e?.response?.status === 404
                ? "La bandeja de hoy todavía no está disponible en el servidor."
                : "No pudimos cargar la bandeja de trabajo. Revisa tu conexión e inténtalo de nuevo.");
        } finally { if (id === reqId.current) setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        if (!zoom) return;
        const onKey = (e) => { if (e.key === "Escape") setZoom(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom]);

    const irA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

    const tras = async () => { refrescarMenu(); await cargar(); };

    /* ── Acciones ── */
    const marcarPagada = async (v) => {
        const r = await swalTop({
            title: `¿Marcar el pedido #${v.VentaID} como pagado?`,
            html: `<p style="margin:0">Cliente: <b>${escapeHtml(v.cliente || "N/A")}</b></p><p style="margin:6px 0 0">Total: <b>${escapeHtml(fmtCOP(v.total))}</b></p><p style="margin:8px 0 0;font-size:13px;color:#64748b">Confirma que revisaste el comprobante.</p>`,
            icon: "question", showCancelButton: true, confirmButtonText: "Sí, marcar como pagada", cancelButtonText: "Cancelar",
            confirmButtonColor: C.success, cancelButtonColor: C.navy,
        });
        if (!r.isConfirmed) return;
        setOcupado(`comp-${v.VentaID}`);
        try {
            await updateEstadoVenta(v.VentaID, ESTADO_VENTA.PAGADA);
            Swal.fire({ icon: "success", title: `Pedido #${v.VentaID} marcado como pagado`, toast: true, position: "top-end", timer: 2200, showConfirmButton: false });
            await tras();
        } catch (e) { swalTop({ icon: "error", title: "No se pudo marcar como pagada", text: errMsg(e, "Intenta de nuevo.") }); }
        finally { setOcupado(null); }
    };

    const rechazar = async (v) => {
        const r = await swalTop({
            title: `Rechazar comprobante del pedido #${v.VentaID}`,
            text: "El pedido seguirá Pendiente y se avisará al cliente para que suba uno nuevo.",
            input: "textarea", inputLabel: "Motivo del rechazo (5 a 300 caracteres)",
            inputPlaceholder: "Ej.: El valor transferido no coincide con el total.",
            inputAttributes: { maxlength: 300, "aria-label": "Motivo del rechazo" },
            showCancelButton: true, confirmButtonText: "Rechazar comprobante", cancelButtonText: "Cancelar",
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            inputValidator: (val) => {
                const t = (val || "").trim();
                if (t.length < 5) return "El motivo debe tener al menos 5 caracteres.";
                if (t.length > 300) return "El motivo no puede superar 300 caracteres.";
                return undefined;
            },
        });
        if (!r.isConfirmed) return;
        setOcupado(`comp-${v.VentaID}`);
        try {
            await rechazarComprobante(v.VentaID, r.value.trim());
            Swal.fire({ icon: "success", title: "Comprobante rechazado", text: "Se avisó al cliente por correo.", toast: true, position: "top-end", timer: 2600, showConfirmButton: false });
            await tras();
        } catch (e) { swalTop({ icon: "error", title: "No se pudo rechazar el comprobante", text: errMsg(e, "Intenta de nuevo.") }); }
        finally { setOcupado(null); }
    };

    const avanzar = async (v) => {
        const sig = SIGUIENTE_NORMAL[v.estadoID];
        if (!sig) return;
        const pideFecha = ESTADOS_CON_FECHA.includes(sig);
        const r = await swalTop({
            title: `Pedido #${v.VentaID} → ${NOMBRE_ESTADO_VENTA[sig]}`,
            html: `<p style="margin:0 0 10px;font-size:13px;color:#64748b">Cliente: <b>${escapeHtml(v.cliente || "N/A")}</b></p>`
                + (pideFecha ? `<label for="cf-p-fecha" style="display:block;text-align:left;font-size:12px;font-weight:700;margin:0 0 4px">Fecha estimada de entrega (opcional)</label><input id="cf-p-fecha" type="date" class="swal2-input" min="${hoyISO()}" style="margin:0 0 12px;width:100%">` : "")
                + `<label for="cf-p-nota" style="display:block;text-align:left;font-size:12px;font-weight:700;margin:0 0 4px">Nota para el cliente (opcional, máx. 300)</label><textarea id="cf-p-nota" class="swal2-textarea" maxlength="300" style="margin:0;width:100%"></textarea>`,
            showCancelButton: true, confirmButtonText: `Pasar a ${NOMBRE_ESTADO_VENTA[sig]}`, cancelButtonText: "Cancelar",
            confirmButtonColor: C.violet, cancelButtonColor: C.navy,
            preConfirm: () => {
                const nota = (document.getElementById("cf-p-nota")?.value || "").trim();
                const fecha = document.getElementById("cf-p-fecha")?.value || "";
                if (nota.length > 300) { Swal.showValidationMessage("La nota no puede superar 300 caracteres."); return false; }
                if (fecha && fecha < hoyISO()) { Swal.showValidationMessage("La fecha estimada no puede ser anterior a hoy."); return false; }
                return { nota, fecha };
            },
        });
        if (!r.isConfirmed) return;
        setOcupado(`ped-${v.VentaID}`);
        try {
            await updateEstadoVenta(v.VentaID, sig, { nota: r.value.nota || undefined, fechaEstimadaEntrega: r.value.fecha || undefined });
            Swal.fire({ icon: "success", title: `Pedido #${v.VentaID}: ${NOMBRE_ESTADO_VENTA[sig]}`, toast: true, position: "top-end", timer: 2200, showConfirmButton: false });
            await tras();
        } catch (e) { swalTop({ icon: "error", title: "No se pudo cambiar el estado", text: errMsg(e, "Intenta de nuevo.") }); }
        finally { setOcupado(null); }
    };

    const cots = datos?.cotizacionesPendientes || [];
    const comps = datos?.comprobantesPorRevisar || [];
    const peds = datos?.pedidosPorAvanzar || [];
    const stock = datos?.stockBajo || [];
    const total = cots.length + comps.length + peds.length;
    const k = (n) => (cargando && !datos ? "…" : n);

    return (
        <>
            <style>{CSS}</style>
            <div className="cf-p-hoy">
                <div className="cf-p-head">
                    <div>
                        <h1 className="cf-p-h1">Hoy</h1>
                        <p className="cf-p-sub">
                            {cargando && !datos ? "Preparando tu bandeja de trabajo..." : total === 0 ? "No tienes tareas pendientes. Buen trabajo." : `${total} tarea${total !== 1 ? "s" : ""} por atender`}
                        </p>
                    </div>
                    <button className="cf-p-btn ghost" onClick={cargar} disabled={cargando} aria-label="Actualizar la bandeja">
                        <FaSyncAlt className={cargando ? "cf-p-spin" : undefined} aria-hidden="true" /> Actualizar
                    </button>
                </div>

                {error && (
                    <div className="cf-p-err" role="alert">
                        <FaExclamationTriangle aria-hidden="true" /> {error}
                        <button className="cf-p-btn bad" onClick={cargar}>Reintentar</button>
                    </div>
                )}

                <div className="cf-p-kpis">
                    <button type="button" className="cf-p-kpi" onClick={() => irA("hoy-cotizaciones")}><span className="cf-p-kpi-ic" style={{ background: "#f0f4ff", color: C.accent }}><FaFileInvoiceDollar /></span><div><b>{k(cots.length)}</b><span>Cotizaciones por atender</span></div></button>
                    <button type="button" className="cf-p-kpi" onClick={() => irA("hoy-comprobantes")}><span className="cf-p-kpi-ic" style={{ background: "#fffbeb", color: C.warning }}><FaReceipt /></span><div><b>{k(comps.length)}</b><span>Comprobantes por revisar</span></div></button>
                    <button type="button" className="cf-p-kpi" onClick={() => irA("hoy-pedidos")}><span className="cf-p-kpi-ic" style={{ background: "#f5f3ff", color: C.violet }}><FaTruck /></span><div><b>{k(peds.length)}</b><span>Pedidos por avanzar</span></div></button>
                    <button type="button" className="cf-p-kpi" onClick={() => irA("hoy-stock")}><span className="cf-p-kpi-ic" style={{ background: "#fef2f2", color: C.danger }}><FaBoxes /></span><div><b>{k(stock.length)}</b><span>Variantes con stock bajo</span></div></button>
                </div>

                {!error && (
                    <>
                        <div id="hoy-cotizaciones">
                            <Seccion icono={<FaFileInvoiceDollar aria-hidden="true" />} titulo="Cotizaciones por atender" cantidad={cots.length} cargando={cargando && !datos}
                                vacio="No hay cotizaciones esperando respuesta.">
                                <ul className="cf-p-list">
                                    {cots.map(c => (
                                        <li key={c.CotizacionID} className="cf-p-row">
                                            <div className="cf-p-main">
                                                <div className="cf-p-name">Cotización #{c.CotizacionID} · {c.cliente || "Cliente sin nombre"}</div>
                                                <div className="cf-p-meta">{fmtFecha(c.fecha)} {fmtHora(c.fecha)}</div>
                                            </div>
                                            {c.sinPrecio && <span className="cf-p-tag warn"><FaExclamationTriangle size={10} aria-hidden="true" /> Sin precio</span>}
                                            <span className="cf-p-money">{fmtCOP(c.valorTotal)}</span>
                                            <div className="cf-p-actions">
                                                <button className="cf-p-btn nav" onClick={() => navigate(`/dashboard/cotizaciones?abrir=${c.CotizacionID}`)}>
                                                    Abrir cotización <FaArrowRight size={11} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Seccion>
                        </div>

                        <div id="hoy-comprobantes">
                            <Seccion icono={<FaReceipt aria-hidden="true" />} titulo="Comprobantes por revisar" cantidad={comps.length} cargando={cargando && !datos}
                                vacio="No hay comprobantes de transferencia pendientes de revisión.">
                                <ul className="cf-p-list">
                                    {comps.map(v => {
                                        const src = urlComprobante(v.comprobante);
                                        const enCurso = ocupado === `comp-${v.VentaID}`;
                                        return (
                                            <li key={v.VentaID} className="cf-p-row">
                                                <button className="cf-p-thumb" onClick={() => src && setZoom(src)} disabled={!src}
                                                    aria-label={`Ampliar comprobante del pedido ${v.VentaID}`} title="Ampliar comprobante">
                                                    {src ? <img src={src} alt={`Comprobante del pedido ${v.VentaID}`} loading="lazy" /> : <FaReceipt aria-hidden="true" />}
                                                    {src && <FaSearchPlus size={11} aria-hidden="true" style={{ position: "absolute", right: 4, bottom: 4, color: "#fff", filter: "drop-shadow(0 0 2px #000)" }} />}
                                                </button>
                                                <div className="cf-p-main">
                                                    <div className="cf-p-name">Pedido #{v.VentaID} · {v.cliente || "Cliente sin nombre"}</div>
                                                    <div className="cf-p-meta">{fmtFecha(v.fecha)} {fmtHora(v.fecha)}</div>
                                                    {v.motivoRechazo && <div style={{ marginTop: 4 }}><span className="cf-p-tag bad" title={v.motivoRechazo}>Ya rechazado antes: {v.motivoRechazo.length > 60 ? `${v.motivoRechazo.slice(0, 60)}…` : v.motivoRechazo}</span></div>}
                                                </div>
                                                <span className="cf-p-money">{fmtCOP(v.total)}</span>
                                                <div className="cf-p-actions">
                                                    <button className="cf-p-btn ok" onClick={() => marcarPagada(v)} disabled={enCurso}><FaCheck size={11} aria-hidden="true" /> Marcar como pagada</button>
                                                    <button className="cf-p-btn bad" onClick={() => rechazar(v)} disabled={enCurso}><FaBan size={11} aria-hidden="true" /> Rechazar comprobante</button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Seccion>
                        </div>

                        <div id="hoy-pedidos">
                            <Seccion icono={<FaTruck aria-hidden="true" />} titulo="Pedidos por avanzar" cantidad={peds.length} cargando={cargando && !datos}
                                vacio="No hay pedidos esperando el siguiente paso.">
                                <ul className="cf-p-list">
                                    {peds.map(v => {
                                        const sig = SIGUIENTE_NORMAL[v.estadoID];
                                        return (
                                            <li key={v.VentaID} className="cf-p-row">
                                                <div className="cf-p-main">
                                                    <div className="cf-p-name">Pedido #{v.VentaID} · {v.cliente || "Cliente sin nombre"}</div>
                                                    <div className="cf-p-meta">{fmtFecha(v.fecha)} {fmtHora(v.fecha)}</div>
                                                </div>
                                                <EstadoBadge id={v.estadoID} nombre={v.estado} />
                                                <span className="cf-p-money">{fmtCOP(v.total)}</span>
                                                <div className="cf-p-actions">
                                                    {sig ? (
                                                        <button className="cf-p-btn viol" onClick={() => avanzar(v)} disabled={ocupado === `ped-${v.VentaID}`}>
                                                            Pasar a {NOMBRE_ESTADO_VENTA[sig]} <FaArrowRight size={11} aria-hidden="true" />
                                                        </button>
                                                    ) : (
                                                        <Link className="cf-p-btn ghost" to="/dashboard/ventas">Ver pedidos</Link>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Seccion>
                        </div>

                        <div id="hoy-stock">
                            <Seccion icono={<FaBoxes aria-hidden="true" />} titulo="Stock bajo" cantidad={stock.length} cargando={cargando && !datos}
                                vacio="Ninguna variante está por debajo del stock mínimo.">
                                <div style={{ overflowX: "auto" }}>
                                    <table className="cf-p-table">
                                        <thead><tr><th>Producto</th><th>Color</th><th>Talla</th><th style={{ textAlign: "right" }}>Stock</th><th style={{ textAlign: "right" }}>Mínimo</th></tr></thead>
                                        <tbody>
                                            {stock.map(s => (
                                                <tr key={s.InventarioID}>
                                                    <td style={{ fontWeight: 700, color: C.navy }}>{s.producto}</td>
                                                    <td>{s.color || "—"}</td>
                                                    <td>{s.talla || "—"}</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, color: Number(s.stock) <= 0 ? C.danger : C.warning }}>{s.stock}</td>
                                                    <td style={{ textAlign: "right", color: C.muted }}>{s.minimo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ padding: "12px 18px", borderTop: "1px solid #eef2f7" }}>
                                    <Link className="cf-p-btn ghost" to="/dashboard/productos">Ir a Productos</Link>
                                </div>
                            </Seccion>
                        </div>
                    </>
                )}
            </div>

            {zoom && (
                <div className="cf-p-lightbox" role="dialog" aria-modal="true" aria-label="Comprobante ampliado" onClick={() => setZoom(null)}>
                    <img src={zoom} alt="Comprobante ampliado" onClick={e => e.stopPropagation()} />
                    <button className="cf-p-btn ghost" onClick={() => setZoom(null)}><FaTimes size={11} aria-hidden="true" /> Cerrar</button>
                </div>
            )}
        </>
    );
};

export default Hoy;
