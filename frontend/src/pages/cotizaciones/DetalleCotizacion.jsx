import React, { useState, useEffect } from "react";
import {
  FaCheck, FaDollarSign, FaImage, FaExchangeAlt, FaBan, FaFilePdf, FaBoxOpen, FaUser, FaTshirt, FaMagic,
  FaEnvelope, FaPhone, FaIdCard, FaTimes, FaSave, FaPalette, FaRulerHorizontal, FaLayerGroup, FaWhatsapp, FaTags,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { aplicarTarifasCotizacion } from "../../Services/api-tarifas/tarifas";
import { whatsappUrl } from "../../Services/api-ventas/flujo";
import API_BASE from "../../config/api";
import { C } from "../../config/tokens";
import { formatPrecio } from "../../utils/formato";
import { swalEncima } from "../../utils/alertas";
import { estadoDe, urlDiseno, infoDetalle, precioUnitarioDetalle, sinCosto, validarCosto } from "./cotizacionUtils";
import { Badge, ImagenModal } from "./componentes";

/* ── Línea de tiempo del estado ── */
const Timeline = ({ estado }) => {
  const terminalMalo = estado === "Cancelada" || estado === "Rechazada";
  const orden = ["Pendiente", "Aprobada", "Procesada"];
  const idx = orden.indexOf(estado);
  const pasos = terminalMalo ? ["Pendiente", estado] : orden;
  return (
    <div className="cz-timeline">
      {pasos.map((p, i) => {
        let cls = "";
        if (terminalMalo) cls = i === 0 ? "done" : "bad";
        else if (i < idx || (estado === "Procesada" && i === idx)) cls = "done";
        else if (i === idx) cls = "now";
        const icon = cls === "done" ? "✓" : cls === "bad" ? "✕" : i + 1;
        return (
          <React.Fragment key={p}>
            {i > 0 && <span className={`cz-line ${cls === "done" || (cls === "now") || cls === "bad" ? "done" : ""}`} />}
            <span className={`cz-step ${cls}`}><i>{icon}</i>{p === "Procesada" ? "Procesada (venta)" : p}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── Tarjeta de diseño con costo editable ── */
const DisenoCard = ({ tec, editable, onGuardar, onVerImagen }) => {
  const [valor, setValor] = useState(tec.CostoTecnica && parseFloat(tec.CostoTecnica) > 0 ? String(parseFloat(tec.CostoTecnica)) : "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const img = urlDiseno(tec);
  const falta = sinCosto(tec);
  const cambiado = valor !== (falta ? "" : String(parseFloat(tec.CostoTecnica)));

  const guardar = async () => {
    const e = validarCosto(valor);
    setError(e);
    if (e) return;
    setGuardando(true);
    try { await onGuardar(tec.CotizacionTecnicaID, parseFloat(valor.trim().replace(",", "."))); }
    finally { setGuardando(false); }
  };

  return (
    <div className={`cz-design ${falta ? "missing" : ""}`}>
      <div className="cz-dimg" onClick={() => img && onVerImagen(img)} style={{ cursor: img ? "zoom-in" : "default" }}>
        {img
          ? <><img loading="lazy" decoding="async" src={img} alt="Diseño" onError={e => { e.currentTarget.style.display = "none"; }} /><span className="cz-zoomhint">Ampliar</span></>
          : <div style={{ textAlign: "center", color: C.violet, opacity: .45 }}><FaImage size={34} /><p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700 }}>Sin imagen</p></div>}
      </div>
      <div className="cz-dinfo">
        <p><b>Técnica:</b> {tec.tecnica?.Nombre || "N/A"}</p>
        <p><b>Parte:</b> {tec.parte?.Nombre || "N/A"}</p>
        {tec.Observaciones && <p style={{ color: C.muted, fontSize: 12 }}><b style={{ color: C.text }}>Obs.:</b> {tec.Observaciones}</p>}
        <div className="cz-cost">
          {editable ? (
            <>
              <div className="cz-money">
                <input aria-label="Costo del diseño" inputMode="numeric" placeholder="Costo por unidad" value={valor}
                  className={error ? "err" : ""}
                  onChange={e => { setValor(e.target.value); if (error) setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") guardar(); }} />
              </div>
              <button className={`cz-btn sm ${cambiado ? "green" : "ghost"}`} onClick={guardar} disabled={guardando || !cambiado} title="Guardar costo">
                {guardando ? <span style={{ width: 12, height: 12, border: "2px solid #fff6", borderTopColor: C.white, borderRadius: "50%", animation: "cz-spin .7s linear infinite" }} /> : <FaSave size={11} />}
                {falta ? "Asignar" : "Guardar"}
              </button>
            </>
          ) : (
            <span className="cz-val" style={{ color: falta ? C.danger : C.success }}>
              {falta ? "Sin precio" : `$${formatPrecio(tec.CostoTecnica)}`}
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{falta ? "" : " / unidad"}</span>
            </span>
          )}
        </div>
        {error && <p style={{ color: C.danger, fontSize: 11, fontWeight: 600 }}>{error}</p>}
        {editable && falta && !error && <p style={{ color: C.danger, fontSize: 11, fontWeight: 600 }}>Falta asignar el costo</p>}
      </div>
    </div>
  );
};

/* ── Modal Detalle Cotización ── */
const DetalleCotizacion = ({ cotizacion, onClose, onRecargar, onAprobar, onConvertirAVenta, onCancelar }) => {
  const [imagenModal, setImagenModal] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !imagenModal) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imagenModal, onClose]);

  const { nombre: estadoNombre, type: estadoType } = estadoDe(cotizacion);
  const puedeEditarCostos = estadoNombre === "Pendiente";
  const todasTecnicas = cotizacion.detalles?.flatMap(d => d.tecnicas || []) || [];
  const faltantes = todasTecnicas.filter(sinCosto).length;

  const handleGuardarCosto = async (tecnicaID, costo) => {
    try {
      await axios.put(`${API_BASE}/api/cotizaciontecnicas/${tecnicaID}`, { CostoTecnica: costo });
      await onRecargar(cotizacion.CotizacionID);
      Swal.fire({ icon: "success", title: "Costo guardado", text: "Total recalculado", toast: true, position: "top-end", timer: 1800, showConfirmButton: false });
    } catch (error) {
      swalEncima({ icon: "error", title: "No se pudo asignar el costo", text: error.response?.data?.message || error.message });
    }
  };

  const [aplicando, setAplicando] = useState(false);
  const handleAplicarTarifas = async () => {
    setAplicando(true);
    try {
      const r = await aplicarTarifasCotizacion(cotizacion.CotizacionID);
      await onRecargar(cotizacion.CotizacionID);
      const aplicadas = Number(r?.aplicadas) || 0;
      const sinTarifa = Number(r?.sinTarifa) || 0;
      swalEncima({
        icon: aplicadas > 0 ? (sinTarifa > 0 ? "info" : "success") : "warning",
        title: `${aplicadas} aplicada${aplicadas !== 1 ? "s" : ""}, ${sinTarifa} sin tarifa`,
        text: sinTarifa > 0 ? "Los diseños sin tarifa deben costearse a mano (o crea la tarifa en Servicios > Tarifas)." : undefined,
        confirmButtonColor: C.accent,
      });
    } catch (error) {
      const noExiste = error.response?.status === 404;
      swalEncima({ icon: "error", title: "No se pudieron aplicar las tarifas", text: noExiste ? "Esta función aún no está disponible en el servidor." : (error.response?.data?.message || error.message) });
    } finally { setAplicando(false); }
  };

  const handleDescargarPdf = async () => {
    if (faltantes > 0) {
      await swalEncima({ icon: 'warning', title: 'No se puede descargar el PDF', html: `<p>Hay <strong>${faltantes}</strong> diseño(s) sin precio asignado.</p>`, confirmButtonText: 'Entendido', confirmButtonColor: C.warning });
      return;
    }
    setDescargando(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cotizaciones/${cotizacion.CotizacionID}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cotizacion_${cotizacion.CotizacionID}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(link.href);
    } catch (error) {
      let msg = 'Error desconocido';
      if (error.response?.data instanceof Blob) {
        try { const texto = await error.response.data.text(); msg = JSON.parse(texto).message || msg; } catch { /* la respuesta no es JSON: se usa el mensaje de texto */ }
      } else { msg = error.response?.data?.message || error.message || msg; }
      swalEncima({ icon: 'error', title: 'Error al generar el PDF', text: msg, confirmButtonColor: C.danger });
    } finally { setDescargando(false); }
  };

  const u = cotizacion.usuario || {};
  const waUrl = whatsappUrl(u.Telefono, `Hola ${u.Nombre || ""}, te escribimos de STAMPLAB sobre tu cotización #${cotizacion.CotizacionID}.`.replace(/\s+,/, ","));
  const iniciales = (u.Nombre || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
  const subtotalCalc = (cotizacion.detalles || []).reduce((s, d) => s + precioUnitarioDetalle(d) * (d.Cantidad || 0), 0);
  const totalUnidades = (cotizacion.detalles || []).reduce((s, d) => s + (d.Cantidad || 0), 0);

  return (
    <div className="cz-overlay" onClick={onClose}>
      <div className="cz-modal" role="dialog" aria-modal="true" aria-label={`Cotización ${cotizacion.CotizacionID}`} onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="cz-mhead">
          <div className="cz-mhead-row">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h5 style={{ margin: 0, fontWeight: 800, fontSize: 21, letterSpacing: "-.02em" }}>Cotización #{cotizacion.CotizacionID}</h5>
                <Badge type={estadoType} dot>{estadoNombre}</Badge>
              </div>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 12.5 }}>
                {new Date(cotizacion.FechaCotizacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {" · "}{cotizacion.detalles?.length || 0} producto(s) · {totalUnidades} unidad(es)
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div className="cz-total-head">
                <small>Valor total</small>
                <strong>${formatPrecio(cotizacion.ValorTotal)}</strong>
              </div>
              <button className="cz-close" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
            </div>
          </div>
          <Timeline estado={estadoNombre} />
        </div>

        {/* Cuerpo */}
        <div className="cz-mbody">
          {puedeEditarCostos && faltantes > 0 && (
            <div className="cz-alert warn" style={{ flexWrap: "wrap" }}>
              <FaDollarSign /> <span style={{ flex: 1, minWidth: 200 }}>Faltan {faltantes} diseño(s) por costear. Asigna el costo por unidad de cada diseño para poder aprobar y descargar el PDF.</span>
              <button className="cz-btn sm blue" onClick={handleAplicarTarifas} disabled={aplicando} title="Rellena el costo de los diseños sin precio con las tarifas por técnica y parte">
                <FaTags size={11} /> {aplicando ? "Aplicando..." : "Aplicar tarifas"}
              </button>
            </div>
          )}
          {estadoNombre === "Aprobada" && (
            <div className="cz-alert info"><FaExchangeAlt /> Cotización aprobada: ya puedes convertirla a venta (se descontará el stock de cada variante).</div>
          )}

          <div className="cz-grid2">
            <div className="cz-card">
              <p className="cz-label">Cliente</p>
              <div className="cz-client">
                <div className="cz-avatar">{iniciales || <FaUser />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 800, color: C.navy, fontSize: 16 }}>{u.Nombre || "N/A"}</p>
                  <div className="cz-client-grid">
                    <div><FaIdCard /><span>{u.DocumentoID || "N/A"}</span></div>
                    <div><FaPhone /><span>{u.Telefono || "Sin teléfono"}</span></div>
                    <div style={{ gridColumn: "1 / -1" }}><FaEnvelope /><span>{u.Correo || "Sin correo"}</span></div>
                  </div>
                  {waUrl && (
                    <a className="cz-btn sm ghost" href={waUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 10, textDecoration: "none", color: "#15803d", borderColor: C.successBorder, background: C.successSoft }}>
                      <FaWhatsapp size={14} /> Escribir por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="cz-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p className="cz-label">Resumen</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="cz-chip">{cotizacion.detalles?.length || 0} producto(s)</span>
                  <span className="cz-chip violet">{todasTecnicas.length} diseño(s)</span>
                  {faltantes > 0 && <span className="cz-chip amber">{faltantes} sin costo</span>}
                </div>
              </div>
              {estadoNombre === "Aprobada" && (
                <button className="cz-btn blue" onClick={() => onConvertirAVenta(cotizacion.CotizacionID)} style={{ justifyContent: "center" }}>
                  <FaExchangeAlt size={12} /> Convertir a Venta
                </button>
              )}
              {estadoNombre === "Pendiente" && (
                <button className="cz-btn green" onClick={() => onAprobar(cotizacion.CotizacionID)} style={{ justifyContent: "center" }}>
                  <FaCheck size={12} /> Aprobar cotización
                </button>
              )}
            </div>
          </div>

          <p className="cz-label" style={{ fontSize: 12, color: C.navy }}>Productos y diseños</p>

          {cotizacion.detalles?.length > 0 ? cotizacion.detalles.map((detalle, index) => {
            const info = infoDetalle(detalle);
            const unit = precioUnitarioDetalle(detalle);
            return (
              <div key={detalle.DetalleCotizacionID} className="cz-prod" style={{ animationDelay: `${index * 0.06}s` }}>
                <div className="cz-prod-head">
                  {info.imagen ? (
                    <img loading="lazy" decoding="async" className="cz-prod-img" src={info.imagen} alt={info.nombre} onClick={() => setImagenModal(info.imagen)} />
                  ) : (
                    <div className="cz-prod-img" style={{ cursor: "default", background: info.tipo === "personalizado" ? C.purpleSoft : C.warningSoft }}>
                      {info.tipo === "personalizado" ? <FaMagic size={24} color={C.violet} /> : <FaTshirt size={24} color={C.warning} />}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Producto {index + 1}</p>
                    <h6 style={{ color: C.navy, fontWeight: 800, margin: "2px 0 0", fontSize: 16 }}>{info.nombre}</h6>
                    <div className="cz-chips">
                      <span className="cz-chip" style={{ background: C.navy, color: C.white, borderColor: C.navy }}>{detalle.Cantidad} unidad(es)</span>
                      {info.tipo === "personalizado" && <span className="cz-chip violet"><FaMagic size={9} /> Personalizado</span>}
                      {info.tipo === "prenda" && <span className="cz-chip amber"><FaTshirt size={9} /> Prenda propia</span>}
                      {detalle.colores?.map(c => <span key={`c${c.CotizacionColorID || c.ColorID}`} className="cz-chip"><FaPalette size={9} /> {c.color?.Nombre}</span>)}
                      {detalle.tallas?.map(t => <span key={`t${t.CotizacionTallaID || t.TallaID}`} className="cz-chip"><FaRulerHorizontal size={9} /> Talla {t.talla?.Nombre}</span>)}
                      {detalle.insumos?.map(i => <span key={`i${i.CotizacionInsumoID || i.InsumoID}`} className="cz-chip"><FaLayerGroup size={9} /> {i.insumo?.Nombre}</span>)}
                    </div>
                    {info.desc && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#92400e", background: C.warningSoft, border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px" }}><strong>Descripción:</strong> {info.desc}</p>}
                  </div>
                  <div className="cz-sub">
                    <small>Subtotal</small>
                    <strong>${formatPrecio(unit * (detalle.Cantidad || 0))}</strong>
                    <div style={{ fontSize: 11, color: C.muted }}>{detalle.Cantidad} × ${formatPrecio(unit)}</div>
                  </div>
                </div>
                <div className="cz-designs">
                  <p style={{ margin: "0 0 12px", fontWeight: 800, color: C.violet, fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".08em" }}>
                    Diseños aplicados ({detalle.tecnicas?.length || 0})
                  </p>
                  {detalle.tecnicas?.length > 0 ? (
                    <div className="cz-dgrid">
                      {detalle.tecnicas.map(tec => (
                        <DisenoCard key={`${tec.CotizacionTecnicaID}-${tec.CostoTecnica}`} tec={tec} editable={puedeEditarCostos}
                          onGuardar={handleGuardarCosto} onVerImagen={setImagenModal} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>Este producto no lleva diseños.</p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="cz-empty"><div className="cz-empty-ico"><FaBoxOpen /></div>No hay productos en esta cotización</div>
          )}

          <div className="cz-summary">
            <div className="cz-summary-box">
              <div><span>Productos (con diseños)</span><span>${formatPrecio(subtotalCalc)}</span></div>
              <div><span>Unidades</span><span>{totalUnidades}</span></div>
              <div className="tot"><span>Total cotización</span><strong>${formatPrecio(cotizacion.ValorTotal)}</strong></div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="cz-mfoot">
          <div>
            <button className="cz-btn red" onClick={handleDescargarPdf} disabled={descargando}
              title={faltantes > 0 ? "Hay diseños sin precio" : "Descargar PDF"} style={faltantes > 0 ? { background: C.muted } : undefined}>
              <FaFilePdf /> {descargando ? "Generando..." : "Descargar PDF"}
            </button>
            {(estadoNombre === "Pendiente" || estadoNombre === "Aprobada") && (
              <button className="cz-btn outline-red" onClick={() => onCancelar(cotizacion)}><FaBan size={12} /> Cancelar cotización</button>
            )}
          </div>
          <button className="cz-btn navy" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />
    </div>
  );
};

export default DetalleCotizacion;
