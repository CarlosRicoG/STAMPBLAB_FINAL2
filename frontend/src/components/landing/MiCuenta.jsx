import React from "react";
import { Link } from "react-router-dom";
import {
    FaShoppingBag, FaFileInvoice, FaUserEdit, FaPalette, FaArrowRight, FaCheckCircle,
    FaExclamationTriangle, FaClock, FaThumbsUp, FaBoxOpen, FaRedo
} from "react-icons/fa";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import usePlus from "../../hooks/usePlus";
import { formatoFechaHoraCO, ultimoPedidoEnCurso } from "../../utils/clienteUtils";
import { useResumenCliente, CLIENTE_CSS, BotonWhatsApp, useConfigPublica } from "./clienteKit";
import { MC_CSS, formatPrecio, leerUsuario, MiCuentaHero, StatCard, Stepper, EmptyState, Skeletons } from "./miCuentaKit";
import { C } from "../../config/tokens";

const FLUJO = ["Pendiente", "Pagada", "En Producción", "Lista para Entrega", "Entregada"];
const pasosDe = (nombre) => {
    const i = FLUJO.indexOf(nombre);
    return { steps: FLUJO, current: i < 0 ? 0 : i, failed: false };
};

const CSS = `
.mcu-grid { display: grid; gap: 22px; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; }
.mcu-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px 22px; box-shadow: var(--sx-shadow-1); }
.mcu-panel h2 { margin: 0 0 14px; font-size: 15px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: #1a2540; display: flex; align-items: center; gap: 10px; }
.mcu-panel h2::before { content: ""; width: 4px; height: 20px; border-radius: 3px; background: linear-gradient(180deg, #4f8ef7, #7c3aed); }
.mcu-badge { margin-left: auto; min-width: 26px; height: 26px; padding: 0 8px; border-radius: 999px; background: #dc2626; color: #fff; font-size: 12px; font-weight: 800; display: grid; place-items: center; text-transform: none; letter-spacing: 0; }
.mcu-item { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 12px 14px; border-radius: 14px; border: 1.5px solid; margin-bottom: 10px; }
.mcu-item.ok { background: #f0fdf4; border-color: #bbf7d0; } .mcu-item.warn { background: #fffbeb; border-color: #fde68a; } .mcu-item.bad { background: #fef2f2; border-color: #fecaca; }
.mcu-item-t { display: flex; gap: 10px; align-items: flex-start; min-width: 0; flex: 1; font-size: 13.5px; color: #334155; line-height: 1.45; }
.mcu-item-t svg { flex-shrink: 0; margin-top: 3px; }
.mcu-item-t b { color: #1a2540; }
.mcu-quick { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
.mcu-q { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 16px; border: 1.5px solid #e2e8f0; background: #f8fafc; text-decoration: none; color: #1a2540; font-weight: 800; font-size: 14px; transition: transform .3s, border-color .3s, box-shadow .3s, background .3s; }
.mcu-q span { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #4f8ef7, #7c3aed); }
.mcu-q small { font-weight: 500; color: #64748b; font-size: 12px; }
.mcu-q:hover { transform: translateY(-4px); border-color: #4f8ef7; background: #fff; box-shadow: 0 14px 30px rgba(79,142,247,.18); color: #1a2540; }
.mcu-order { display: flex; gap: 14px; align-items: center; margin-bottom: 16px; }
.mcu-order-img { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg,#eef3ff,#f5f0ff); border: 1px solid #e2e8f0; display: grid; place-items: center; overflow: hidden; color: #4f8ef7; flex-shrink: 0; }
.mcu-order-img img { width: 100%; height: 100%; object-fit: contain; }
@media (max-width: 900px) { .mcu-grid { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .mcu-quick { grid-template-columns: 1fr; } }
`;

const MiCuenta = () => {
    usePlus();
    const usuario = leerUsuario();
    const { cargando, cotizaciones, ventas, atencion, recargar } = useResumenCliente(true);
    const config = useConfigPublica();

    const fallo = !cargando && cotizaciones === null && ventas === null;
    const listaCot = cotizaciones || [];
    const listaVen = ventas || [];
    const enCurso = ultimoPedidoEnCurso(listaVen);
    const nEnCurso = listaVen.filter((v) => ![11, 12].includes(Number(v.EstadoID)) && !["Entregada", "Cancelada"].includes(v.estado?.Nombre)).length;
    const estadoEnCurso = enCurso?.estado?.Nombre || "Pendiente";
    const primerDetalle = enCurso?.detalles?.[0];

    return (
        <>
            <style>{MC_CSS + CLIENTE_CSS + CSS}</style>
            <NavbarComponent />

            <div className="mc-page">
                <MiCuentaHero title="Mi" accent="cuenta" nombre={usuario.Nombre || ""}
                    sub={`Hola${usuario.Nombre ? `, ${String(usuario.Nombre).split(" ")[0]}` : ""}. Aquí ves lo que necesita tu atención y accedes rápido a tus pedidos y cotizaciones.`}>
                    <div className="mc-stats">
                        <StatCard i={0} tone="blue" icon={<FaFileInvoice />} label="Cotizaciones" value={listaCot.length} />
                        <StatCard i={1} tone="amber" icon={<FaClock />} label="Pedidos en curso" value={nEnCurso} />
                        <StatCard i={2} tone="green" icon={<FaShoppingBag />} label="Compras" value={listaVen.length} />
                        <StatCard i={3} tone="violet" icon={<FaExclamationTriangle />} label="Por atender" value={atencion.total} />
                    </div>
                </MiCuentaHero>

                <div className="mc-wrap">
                    {cargando ? <Skeletons n={2} /> : fallo ? (
                        <EmptyState icon={<FaExclamationTriangle />} title="No pudimos cargar tu información"
                            text="Revisa tu conexión e intenta de nuevo. Mientras tanto puedes entrar directamente a tus compras o cotizaciones.">
                            <button type="button" className="mc-cta" onClick={recargar}><FaRedo size={12} /> Reintentar</button>
                            <Link to="/miscompras" className="mc-cta alt">Mis compras</Link>
                            <Link to="/miscotizaciones" className="mc-cta alt">Mis cotizaciones</Link>
                        </EmptyState>
                    ) : (
                        <div className="mcu-grid">
                            <div>
                                <section className="mcu-panel sx-reveal" aria-labelledby="mcu-atencion" style={{ marginBottom: 22 }}>
                                    <h2 id="mcu-atencion">Lo que necesita tu atención
                                        {atencion.total > 0 && <span className="mcu-badge" aria-label={`${atencion.total} pendientes`}>{atencion.total}</span>}
                                    </h2>

                                    {atencion.total === 0 && (
                                        <div className="ck-alert ok" role="status" style={{ marginBottom: 0 }}>
                                            <FaCheckCircle size={18} />
                                            <div><b>Todo al día</b><p>No tienes nada pendiente por ahora. ¿Quieres cotizar algo nuevo?</p></div>
                                        </div>
                                    )}

                                    {atencion.porAceptar.map((c) => (
                                        <div key={`c${c.CotizacionID}`} className="mcu-item ok">
                                            <div className="mcu-item-t"><FaThumbsUp color={C.success} /><span>Tu cotización <b>#{c.CotizacionID}</b> está lista por <b>${formatPrecio(c.ValorTotal)}</b>. Acéptala para crear tu pedido.</span></div>
                                            <Link to="/miscotizaciones" className="ck-btn green">Ver y aceptar</Link>
                                        </div>
                                    ))}

                                    {atencion.rechazados.map((v) => (
                                        <div key={`r${v.VentaID}`} className="mcu-item bad">
                                            <div className="mcu-item-t"><FaExclamationTriangle color={C.danger} /><span>El comprobante del pedido <b>#{v.VentaID}</b> fue rechazado: {v.ComprobanteMotivoRechazo}</span></div>
                                            <Link to="/miscompras" className="ck-btn">Subir uno nuevo</Link>
                                        </div>
                                    ))}

                                    {atencion.pendientesPago.slice(0, 5).map(({ venta, limite, restante }) => (
                                        <div key={`p${venta.VentaID}`} className={`mcu-item ${restante === "plazo vencido" ? "bad" : "warn"}`}>
                                            <div className="mcu-item-t"><FaClock color={C.warning} /><span>Pedido <b>#{venta.VentaID}</b> pendiente de pago por <b>${formatPrecio(venta.Total)}</b>.{limite ? <> Paga antes de <b>{formatoFechaHoraCO(limite)}</b> ({restante}).</> : null}</span></div>
                                            <Link to="/miscompras" className="ck-btn ghost">Ver pedido</Link>
                                        </div>
                                    ))}
                                    {atencion.pendientesPago.length > 5 && (
                                        <p className="ck-muted" style={{ margin: "8px 4px 0" }}>
                                            y {atencion.pendientesPago.length - 5} pedido(s) más pendientes de pago. <Link to="/miscompras">Ver todos en Mis compras</Link>
                                        </p>
                                    )}
                                </section>

                                <section className="mcu-panel sx-reveal" aria-labelledby="mcu-pedido">
                                    <h2 id="mcu-pedido">Tu último pedido en curso</h2>
                                    {!enCurso ? (
                                        <p className="ck-muted">No tienes pedidos en curso. Cuando hagas uno, aquí verás su avance.</p>
                                    ) : (
                                        <>
                                            <div className="mcu-order">
                                                <div className="mcu-order-img">
                                                    {primerDetalle?.producto?.ImagenProducto ? <img src={primerDetalle.producto.ImagenProducto} alt="" /> : <FaBoxOpen size={24} />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 900, color: C.navy, fontSize: 16 }}>Pedido #{enCurso.VentaID}</div>
                                                    <div className="ck-muted">{estadoEnCurso} · ${formatPrecio(enCurso.Total)}</div>
                                                </div>
                                            </div>
                                            <Stepper {...pasosDe(estadoEnCurso)} />
                                            <div className="ck-actions">
                                                <Link to="/miscompras" className="ck-btn">Ver detalle <FaArrowRight size={11} /></Link>
                                                <BotonWhatsApp numero={config?.whatsapp} texto={`Hola StampLab, tengo una consulta sobre mi pedido #${enCurso.VentaID}.`} />
                                            </div>
                                        </>
                                    )}
                                </section>
                            </div>

                            <section className="mcu-panel sx-reveal" aria-labelledby="mcu-acceso">
                                <h2 id="mcu-acceso">Acceso rápido</h2>
                                <nav className="mcu-quick" aria-label="Accesos rápidos de tu cuenta">
                                    <Link to="/miscompras" className="mcu-q"><span><FaShoppingBag /></span>Mis compras<small>Pedidos y seguimiento</small></Link>
                                    <Link to="/miscotizaciones" className="mcu-q"><span><FaFileInvoice /></span>Mis cotizaciones<small>Estado y precios</small></Link>
                                    <Link to="/editarperfil" className="mcu-q"><span><FaUserEdit /></span>Editar perfil<small>Tus datos de contacto</small></Link>
                                    <Link to="/cotizacionesLanding" className="mcu-q"><span><FaPalette /></span>Cotizar<small>Crea una nueva cotización</small></Link>
                                </nav>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default MiCuenta;
