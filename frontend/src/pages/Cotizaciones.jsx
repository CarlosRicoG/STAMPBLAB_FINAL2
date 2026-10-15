import React, { useState, useEffect } from "react";
import { FaEye, FaCheck, FaTimes, FaSearch, FaPlus, FaDollarSign, FaImage, FaExchangeAlt, FaBan, FaFilePdf, FaPlusCircle, FaBoxOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Swal from "sweetalert2";
import { getCotizaciones, updateCotizacion, getCotizacionById, cancelarCotizacion } from "../Services/api-cotizaciones/cotizaciones";
import axios from "axios";
import FormularioCotizacion from './formularios_dash/FormularioCotizacion';

/* ── Tokens ── */
const C = {
  navy: "#1a2540",
  navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
  accent: "#4f8ef7",
  accentSoft: "#f0f4ff",
  accentBorder: "#c7d9ff",
  success: "#16a34a",
  successSoft: "#f0fdf4",
  warning: "#d97706",
  warningSoft: "#fffbeb",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  muted: "#64748b",
  text: "#0f172a",
  border: "#e2e8f0",
  bg: "#f8fafc",
  info: "#0369a1",
  infoSoft: "#e0f2fe",
};


const formatPrecio = (valor) =>
  (parseFloat(valor) || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });


const TH = {
  background: C.navyGrad, color: "#fff", fontSize: 12, fontWeight: 700,
  padding: "13px 16px", whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "left",
};

const Badge = ({ type, children }) => {
  const map = {
    success: { bg: C.successSoft, color: C.success, border: "#bbf7d0" },
    warning: { bg: C.warningSoft, color: C.warning, border: "#fde68a" },
    danger: { bg: C.dangerSoft, color: C.danger, border: "#fecaca" },
    accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
    navy: { bg: C.navy, color: "#fff", border: C.navy },
    info: { bg: C.infoSoft, color: C.info, border: "#bae6fd" },
    muted: { bg: "#f1f5f9", color: C.muted, border: C.border },
    pending: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    approved: { bg: C.successSoft, color: C.success, border: "#bbf7d0" },
    canceled: { bg: C.dangerSoft, color: C.danger, border: "#fecaca" },
    processed: { bg: C.infoSoft, color: C.info, border: "#bae6fd" },
  };
  const s = map[type] || map.muted;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700,
      fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 5,
    }}>{children}</span>
  );
};

const ActionBtn = ({ onClick, title, color, children, disabled }) => (
  <button onClick={onClick} title={title} disabled={disabled} style={{
    width: 32, height: 32, borderRadius: 8,
    border: `1.5px solid ${color}20`, background: `${color}0d`,
    color, cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.18s", opacity: disabled ? 0.5 : 1,
  }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = "translateY(-1px)"; } }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.transform = "none"; }}
  >{children}</button>
);

/* ── Paginación ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];

const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
  if (totalItems === 0) return null;

  const generarPaginas = () => {
    const paginas = [];
    const delta = 2;
    const rangoIzq = Math.max(2, paginaActual - delta);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + delta);
    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);
    return paginas;
  };

  const btnBase = {
    minWidth: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Outfit',sans-serif", transition: "all 0.18s", padding: "0 8px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
          Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> cotizaciones
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Por página:</span>
          <select value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}
            style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", color: C.navy, cursor: "pointer", background: "#fff" }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}>
            {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (paginaActual !== 1) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          <FaChevronLeft size={11} />
        </button>

        {generarPaginas().map((p, i) => (
          p === "..." ? (
            <span key={`e-${i}`} style={{ padding: "0 4px", color: C.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>…</span>
          ) : (
            <button key={p} onClick={() => onCambiarPagina(p)}
              style={{
                ...btnBase,
                background: p === paginaActual ? C.navy : "#fff",
                color: p === paginaActual ? "#fff" : C.muted,
                borderColor: p === paginaActual ? C.navy : C.border,
                fontWeight: p === paginaActual ? 700 : 600,
                cursor: p === paginaActual ? "default" : "pointer",
              }}
              onMouseEnter={e => { if (p !== paginaActual) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
              onMouseLeave={e => { if (p !== paginaActual) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}>
              {p}
            </button>
          )
        ))}

        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (paginaActual !== totalPaginas) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

/* ── Modal imagen ampliada ── */
const ImagenModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ animation: "fadeIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <img src={src} alt="Vista ampliada"
          style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onClose}
            style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 24, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Modal Detalle Cotización ── */
const ModalDetalleCotizacion = ({ cotizacion, onClose, onActualizar, onConvertirAVenta }) => {
  const [imagenModal, setImagenModal] = useState(null);

  const handleAsignarCostoTecnica = async (tecnicaID) => {
    const estadoNombre = cotizacion.estado?.Nombre || "Pendiente";
    if (estadoNombre === "Aprobada" || estadoNombre === "Cancelada" || estadoNombre === "Procesada") {
      Swal.fire({
        icon: "warning",
        title: "Acción no permitida",
        text: `No se puede modificar el costo de técnicas en cotizaciones con estado: ${estadoNombre}`,
      });
      return;
    }

    const tecnicaActual = cotizacion.detalles
      .flatMap((d) => d.tecnicas || [])
      .find((t) => t.CotizacionTecnicaID === tecnicaID);

    const { value: costo, isConfirmed } = await Swal.fire({
      title: "Asignar Costo de Técnica",
      input: "text",                          // "text" para interceptar letras antes de parsear
      inputLabel: "Costo en pesos (COP)",
      inputPlaceholder: "Ej: 25000",
      inputValue: tecnicaActual?.CostoTecnica
        ? String(tecnicaActual.CostoTecnica)
        : "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputAttributes: { inputmode: "numeric" },
      inputValidator: (value) => {
        // 1. Campo vacío
        if (!value || value.trim() === "") {
          return "Debes ingresar un valor. No puedes dejar este campo vacío.";
        }
        // 2. Contiene letras u otros caracteres no numéricos (permite punto y coma como decimal)
        if (!/^[0-9]+([.,][0-9]{1,2})?$/.test(value.trim())) {
          return "Solo se permiten números. No uses letras ni símbolos especiales.";
        }
        // 3. Valor negativo (no aplica con la regex de arriba, pero por si acaso)
        const parsed = parseFloat(value.trim().replace(",", "."));
        if (isNaN(parsed)) {
          return "El valor ingresado no es un número válido.";
        }
        if (parsed < 0) {
          return "El costo no puede ser negativo.";
        }
        // 4. Cero
        if (parsed === 0) {
          return "El costo debe ser mayor a $0. Si deseas cancelar, usa el botón Cancelar.";
        }
        // 5. Límite razonable (opcional, ajusta según tu negocio)
        if (parsed > 99_999_999) {
          return "El valor es demasiado alto. Verifica que sea correcto.";
        }
      },
    });

    // Si el usuario cerró el modal o canceló — isConfirmed es false
    if (!isConfirmed) return;

    // Parsear (acepta tanto punto como coma decimal)
    const costoFinal = parseFloat(String(costo).trim().replace(",", "."));

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/cotizaciontecnicas/${tecnicaID}`,
        { CostoTecnica: costoFinal }
      );
      Swal.fire({
        icon: "success",
        title: "Costo asignado",
        text: "Total recalculado",
        timer: 2000,
        showConfirmButton: false,
      });
      onActualizar();
      onClose();
    } catch {
      Swal.fire("Error", "No se pudo asignar el costo", "error");
    }
  };

  const handleDescargarPdf = async () => {
    const todasLasTecnicas = cotizacion.detalles?.flatMap(d => d.tecnicas || []) || [];
    const tecnicasSinCosto = todasLasTecnicas.filter(t => !t.CostoTecnica || parseFloat(t.CostoTecnica) === 0);
    if (tecnicasSinCosto.length > 0) {
      await Swal.fire({ icon: 'warning', title: 'No se puede descargar el PDF', html: `<p>Hay <strong>${tecnicasSinCosto.length}</strong> diseño(s) sin precio asignado.</p>`, confirmButtonText: 'Entendido', confirmButtonColor: '#ffc107' });
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/cotizaciones/${cotizacion.CotizacionID}/pdf`;
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cotizacion_${cotizacion.CotizacionID}.pdf`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(link.href);
    } catch (error) {
      let msg = 'Error desconocido';
      if (error.response?.data instanceof Blob) {
        try { const texto = await error.response.data.text(); msg = JSON.parse(texto).message || msg; } catch (_) { }
      } else { msg = error.response?.data?.message || error.message || msg; }
      Swal.fire({ icon: 'error', title: 'Error al generar el PDF', text: msg, confirmButtonColor: '#d33' });
    }
  };

  const estadoNombre = cotizacion.estado?.Nombre || "Pendiente";
  const puedeEditarCostos = estadoNombre === "Pendiente";
  const esAprobada = estadoNombre === "Aprobada";
  const esProcesada = estadoNombre === "Procesada";
  const esCancelada = estadoNombre === "Cancelada";
  const hayTecnicasSinCosto = cotizacion.detalles?.flatMap(d => d.tecnicas || []).some(t => !t.CostoTecnica || parseFloat(t.CostoTecnica) === 0);

  const estadoBadgeType = esAprobada ? "approved" : esCancelada ? "canceled" : esProcesada ? "processed" : "pending";
  const estadoBgColor = esAprobada ? C.successSoft : esCancelada ? C.dangerSoft : esProcesada ? C.infoSoft : C.warningSoft;
  const estadoBorderColor = esAprobada ? C.success : esCancelada ? C.danger : esProcesada ? C.info : C.warning;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 1100, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.25s ease" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ background: C.navyGrad, padding: "18px 26px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h5 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 18 }}>Cotización #{cotizacion.CotizacionID}</h5>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              {new Date(cotizacion.FechaCotizacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "24px 26px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 20 }}>
            <div style={{ background: C.accentSoft, borderRadius: 14, padding: "18px 20px", border: `1px solid ${C.border}` }}>
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Información del Cliente</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["Nombre", cotizacion.usuario?.Nombre || "N/A"], ["Documento", cotizacion.usuario?.DocumentoID || "N/A"], ["Correo", cotizacion.usuario?.Correo || "N/A"], ["Teléfono", cotizacion.usuario?.Telefono || "N/A"]].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{label}</p>
                    <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: 13 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: estadoBgColor, borderRadius: 14, padding: "18px 20px", border: `2px solid ${estadoBorderColor}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Estado</p>
                <Badge type={estadoBadgeType}>{estadoNombre}</Badge>
                {esAprobada && (
                  <button onClick={() => onConvertirAVenta(cotizacion.CotizacionID)}
                    style={{ marginTop: 10, padding: "7px 14px", background: C.info, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif" }}>
                    <FaExchangeAlt size={11} /> Convertir a Venta
                  </button>
                )}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: C.muted }}>VALOR TOTAL</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.navy }}>${formatPrecio(cotizacion.ValorTotal)}</p>
              </div>
            </div>
          </div>

          <h6 style={{ fontWeight: 700, color: C.navy, marginBottom: 14, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>Detalles de Productos</h6>

          {cotizacion.detalles?.length > 0 ? cotizacion.detalles.map((detalle, index) => (
            <div key={detalle.DetalleCotizacionID} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16, background: "#fafcff" }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 14, alignItems: "flex-start" }}>
                <img
                  src={detalle.TraePrenda ? "https://via.placeholder.com/90?text=Prenda" : (detalle.producto?.ImagenProducto || "https://via.placeholder.com/90")}
                  alt={detalle.producto?.Nombre}
                  onClick={() => { const src = !detalle.TraePrenda && detalle.producto?.ImagenProducto; if (src) setImagenModal(src); }}
                  style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}`, cursor: (!detalle.TraePrenda && detalle.producto?.ImagenProducto) ? "pointer" : "default", transition: "transform 0.2s" }}
                  onMouseEnter={e => { if (!detalle.TraePrenda && detalle.producto?.ImagenProducto) e.target.style.transform = "scale(1.08)"; }}
                  onMouseLeave={e => e.target.style.transform = "none"}
                />
                <div style={{ flex: 1 }}>
                  <h6 style={{ color: C.navy, fontWeight: 800, marginBottom: 6, fontSize: 14 }}>
                    Producto {index + 1}: {detalle.TraePrenda ? "Prenda del cliente" : (detalle.producto?.Nombre || "Sin nombre")}
                  </h6>
                  {detalle.TraePrenda && (
                    <div style={{ background: C.warningSoft, padding: "8px 12px", borderRadius: 8, border: `1px solid #fde68a`, marginBottom: 8 }}>
                      <p style={{ margin: 0, color: "#92400e", fontSize: 12 }}><strong>Descripción:</strong> {detalle.PrendaDescripcion || "Sin descripción"}</p>
                    </div>
                  )}
                  <p style={{ margin: 0, color: C.muted, fontSize: 13 }}><strong style={{ color: C.navy }}>Cantidad:</strong> {detalle.Cantidad} unidades</p>
                </div>
              </div>
              {detalle.tecnicas?.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#7c3aed", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Diseños Aplicados ({detalle.tecnicas.length})</p>
                  {detalle.tecnicas.map(tec => (
                    <div key={tec.CotizacionTecnicaID} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                      {tec.ImagenUrl ? (
                        <div style={{ flexShrink: 0 }}>
                          <img src={tec.ImagenUrl} alt="Diseño" onClick={() => setImagenModal(tec.ImagenUrl)}
                            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `2px solid ${C.border}`, cursor: "pointer", transition: "transform 0.2s" }}
                            onMouseEnter={e => e.target.style.transform = "scale(1.08)"}
                            onMouseLeave={e => e.target.style.transform = "none"} />
                          <p style={{ margin: "4px 0 0", fontSize: 10, color: C.muted, textAlign: "center" }}>Click para ampliar</p>
                        </div>
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f5f3ff", border: `2px dashed #ddd6fe`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FaImage style={{ color: "#7c3aed", opacity: 0.3, fontSize: 24 }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px", fontSize: 13 }}><strong style={{ color: "#7c3aed" }}>Técnica:</strong> {tec.tecnica?.Nombre || "N/A"}</p>
                        <p style={{ margin: "0 0 3px", fontSize: 13 }}><strong style={{ color: "#7c3aed" }}>Parte:</strong> {tec.parte?.Nombre || "N/A"}</p>
                        {tec.Observaciones && <p style={{ margin: "0 0 3px", fontSize: 12, color: C.muted }}><strong style={{ color: C.text }}>Observaciones:</strong> {tec.Observaciones}</p>}
                      </div>
                      <div style={{ textAlign: "right", minWidth: 140 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: (!tec.CostoTecnica || parseFloat(tec.CostoTecnica) === 0) ? C.danger : C.success }}>
                          {(!tec.CostoTecnica || parseFloat(tec.CostoTecnica) === 0) ? "Sin precio" : `$${formatPrecio(tec.CostoTecnica)}`}
                        </p>
                        <button onClick={() => handleAsignarCostoTecnica(tec.CotizacionTecnicaID)} disabled={!puedeEditarCostos}
                          style={{ padding: "5px 12px", background: puedeEditarCostos ? C.warning : C.muted, color: puedeEditarCostos ? "#000" : "#fff", border: "none", borderRadius: 7, cursor: puedeEditarCostos ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, fontFamily: "'Outfit',sans-serif" }}>
                          <FaDollarSign size={11} />{puedeEditarCostos ? "Asignar" : "Bloqueado"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!detalle.TraePrenda && (detalle.tallas?.length > 0 || detalle.colores?.length > 0 || detalle.insumos?.length > 0) && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {detalle.tallas?.length > 0 && <p style={{ margin: 0, fontSize: 12 }}><strong>Tallas:</strong> {detalle.tallas.map(t => `${t.talla?.Nombre} (${t.Cantidad})`).join(", ")}</p>}
                    {detalle.colores?.length > 0 && <p style={{ margin: 0, fontSize: 12 }}><strong>Colores:</strong> {detalle.colores.map(c => `${c.color?.Nombre} (${c.Cantidad})`).join(", ")}</p>}
                    {detalle.insumos?.length > 0 && <p style={{ margin: 0, fontSize: 12 }}><strong>Telas:</strong> {detalle.insumos.map(i => `${i.insumo?.Nombre} × ${i.CantidadRequerida}`).join(", ")}</p>}
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>No hay detalles</div>
          )}
        </div>
        <div style={{ padding: "14px 26px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={handleDescargarPdf} title={hayTecnicasSinCosto ? "Hay diseños sin precio" : "Descargar PDF"}
            style={{ padding: "9px 20px", background: hayTecnicasSinCosto ? C.muted : C.danger, color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 7, fontSize: 13, opacity: hayTecnicasSinCosto ? 0.7 : 1, fontFamily: "'Outfit',sans-serif" }}>
            <FaFilePdf /> Descargar PDF
          </button>
          <button onClick={onClose}
            style={{ padding: "9px 22px", background: C.navy, color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            Cerrar
          </button>
        </div>
      </div>
      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
const Cotizaciones = () => {

  // AGREGA estos dos estados junto a los demás:
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);
  const [modalKey, setModalKey] = useState(0);

  /* ── Paginación ── */
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);


  // Carga inicial
  useEffect(() => { cargarCotizaciones(1, itemsPorPagina, "", "Todos"); }, []);

  // Debounce en búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPaginaActual(1);
      cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado);
    }, 350);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  // Cambio de filtro de estado
  useEffect(() => {
    setPaginaActual(1);
    cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado);
  }, [filtroEstado]);


  const mapeoEstados = { 1: "Pendiente", 2: "Aprobada", 3: "Rechazada", 4: "Cancelada", 5: "Convertir a venta" };

  const cargarCotizaciones = async (page, limit, search, estado) => {
    setCargando(true);
    try {
      const response = await getCotizaciones({ page, limit, search, estado });
      const data = response.datos || [];
      setTotalItems(response.total || 0);
      setTotalPaginas(response.totalPaginas || 1);
      setCotizaciones(data);
    } catch { Swal.fire("Error", "No se pudieron cargar las cotizaciones", "error"); }
    finally { setCargando(false); }
  };

  const handleCerrarFormulario = () => { setMostrarFormulario(false); setModalKey(prev => prev + 1); cargarCotizaciones(1, itemsPorPagina, busqueda, filtroEstado); };
  const handleCerrarDetalle = async () => { setMostrarDetalle(false); setCotizacionSeleccionada(null); await cargarCotizaciones(paginaActual, itemsPorPagina, busqueda, filtroEstado); };

  const cotizacionesFiltradas = cotizaciones;

  /* ── Paginado ── */
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const desde = totalItems === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);
  const cotizacionesPagina = cotizaciones;      // el backend ya pagina


  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarCotizaciones(nuevaPagina, itemsPorPagina, busqueda, filtroEstado);
    }
  };

  const handleCambiarItemsPorPagina = (n) => {
    setItemsPorPagina(n);
    setPaginaActual(1);
    cargarCotizaciones(1, n, busqueda, filtroEstado);
  };

  const handleVerDetalle = async (cotizacionID) => {
    try {
      const response = await getCotizacionById(cotizacionID);
      setCotizacionSeleccionada(response); setMostrarDetalle(true);
    } catch { Swal.fire("Error", "No se pudo cargar el detalle", "error"); }
  };

  const handleCancelarCotizacion = async (cotizacion) => {
    const estadoNombre = cotizacion.estado?.Nombre || mapeoEstados[cotizacion.EstadoID] || "Pendiente";
    const result = await Swal.fire({
      title: '¿Cancelar esta cotización?',
      html: `<p><strong>Cotización #${cotizacion.CotizacionID}</strong></p><p>Cliente: ${cotizacion.usuario?.Nombre || 'N/A'}</p><p>Estado actual: <strong>${estadoNombre}</strong></p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: C.danger, cancelButtonColor: C.navy,
      confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No, mantener'
    });
    if (result.isConfirmed) {
      try {
        setCargando(true);
        await cancelarCotizacion(cotizacion.CotizacionID);
        Swal.fire({ icon: 'success', title: '¡Cotización cancelada!', timer: 2000, showConfirmButton: false });
        cargarCotizaciones();
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al cancelar', text: error.response?.data?.message || error.message });
      } finally { setCargando(false); }
    }
  };

  const handleCambiarEstado = async (cotizacionID, nuevoEstado) => {
    if (nuevoEstado === "Aprobada") {
      const response = await getCotizacionById(cotizacionID);
      const tecnicasSinCosto = response.detalles?.flatMap(d => d.tecnicas || []).filter(t => !t.CostoTecnica || parseFloat(t.CostoTecnica) === 0) || [];
      if (tecnicasSinCosto.length > 0) {
        await Swal.fire({ icon: "warning", title: "No se puede aprobar", html: `<p>Hay ${tecnicasSinCosto.length} técnica(s) sin costo asignado.</p>`, confirmButtonText: "Entendido", confirmButtonColor: C.warning });
        return;
      }
    }
    const estadoID = nuevoEstado === "Aprobada" ? 2 : nuevoEstado === "Cancelada" ? 4 : 1;
    try {
      await updateCotizacion(cotizacionID, { EstadoID: estadoID });
      Swal.fire({ icon: "success", title: nuevoEstado === "Aprobada" ? "¡Cotización aprobada!" : "Estado actualizado", timer: 1500, showConfirmButton: false });
      cargarCotizaciones();
    } catch { Swal.fire("Error", "No se pudo actualizar el estado", "error"); }
  };

  const handleConvertirAVenta = async (cotizacionID) => {
    const result = await Swal.fire({
      title: '¿Convertir cotización a venta?', icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, convertir', cancelButtonText: 'Cancelar',
      confirmButtonColor: C.success, cancelButtonColor: C.muted
    });
    if (result.isConfirmed) {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/cotizaciones/${cotizacionID}/convertir-a-venta`);
        Swal.fire({ icon: 'success', title: '¡Conversión exitosa!', text: `Venta ID: #${response.data.venta.VentaID}`, timer: 2500, showConfirmButton: false });
        cargarCotizaciones();
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'No se pudo convertir', text: error.response?.data?.message || error.message || 'Error desconocido' });
      }
    }
  };

  const getEstadoInfo = (c) => {
    const nombre = c.estado?.Nombre || mapeoEstados[c.EstadoID] || mapeoEstados[c.estado?.EstadoID] || "Pendiente";
    const map = {
      Pendiente: { type: "pending", label: "Pendiente" },
      Aprobada: { type: "approved", label: "Aprobada" },
      Cancelada: { type: "canceled", label: "Cancelada" },
      Procesada: { type: "processed", label: "Procesada" },
    };
    return { ...(map[nombre] || map.Pendiente), nombre };
  };

  const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : "—";

  const obtenerPrimerProducto = (detalles) => {
    if (!Array.isArray(detalles) || detalles.length === 0) return { Nombre: "Sin producto", ImagenProducto: null, Cantidad: 0 };
    const primerDetalle = detalles[0];
    if (primerDetalle.TraePrenda) return { Nombre: "Prenda propia", ImagenProducto: null, Cantidad: primerDetalle.Cantidad || 0, esPrendaPropia: true };
    const producto = primerDetalle.producto || {};
    return { Nombre: producto.Nombre || "Producto", ImagenProducto: producto.ImagenProducto || null, Cantidad: primerDetalle.Cantidad || 0 };
  };

  const pendientes = cotizaciones.filter(c => (c.estado?.Nombre || "Pendiente") === "Pendiente").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .cot-row:hover { background: #f0f4ff !important; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Cotizaciones</h4>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
              {totalItems} cotización{totalItems !== 1 ? "es" : ""} ·{" "}
              <span style={{ color: C.warning, fontWeight: 700 }}>{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</span>
            </p>
          </div>
          <button onClick={() => setMostrarFormulario(true)}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 12px ${C.navy}33`, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <FaPlusCircle size={15} /> Agregar Cotización
          </button>
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", cursor: "pointer", color: C.text, background: "#fff" }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}>
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <div style={{ position: "relative", width: 280 }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
            <input type="text" placeholder="Buscar cotización..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border} />
          </div>
        </div>

        {/* TABLA */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["ID", "Imagen", "Cliente", "Producto", "Fecha", "Estado", "Valor Total", "Acciones"].map((h, i) => (
                    <th key={i} style={{ ...TH, textAlign: i >= 5 ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <span style={{ color: C.muted, fontSize: 13 }}>Cargando cotizaciones...</span>
                  </td></tr>
                ) : cotizacionesFiltradas.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: C.muted }}>
                    <FaBoxOpen size={36} style={{ opacity: 0.2, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                    {cotizaciones.length === 0 ? "No hay cotizaciones registradas" : "No se encontraron cotizaciones"}
                  </td></tr>
                ) : (
                  cotizacionesPagina.map((cot, idx) => {
                    const producto = obtenerPrimerProducto(cot.detalles);
                    const { nombre: estadoNombre, type: estadoType } = getEstadoInfo(cot);
                    return (
                      <tr key={cot.CotizacionID} className="cot-row"
                        style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s", animation: "fadeIn 0.3s ease both", animationDelay: `${idx * 0.03}s` }}>
                        <td style={{ padding: "12px 16px" }}><Badge type="navy">#{cot.CotizacionID}</Badge></td>
                        <td style={{ padding: "10px 16px" }}>
                          {producto.ImagenProducto ? (
                            <img src={producto.ImagenProducto} alt={producto.Nombre}
                              onClick={() => setImagenModal(producto.ImagenProducto)}
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 9, cursor: "pointer", border: `2px solid ${C.border}`, transition: "transform 0.2s, box-shadow 0.2s" }}
                              onMouseEnter={e => { e.target.style.transform = "scale(1.12)"; e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)"; }}
                              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "none"; }}
                            />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 9, background: C.accentSoft, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FaBoxOpen style={{ color: C.muted, opacity: 0.4, fontSize: 18 }} />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, color: C.navy }}>{cot.usuario?.Nombre || "Sin nombre"}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>CC: {cot.usuario?.DocumentoID || "N/A"}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: C.navy, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {producto.Nombre}
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{producto.Cantidad} ud{producto.Cantidad !== 1 ? "s" : ""}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{formatearFecha(cot.FechaCotizacion)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <Badge type={estadoType}>{estadoNombre}</Badge>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <Badge type="success">${formatPrecio(cot.ValorTotal)}</Badge>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                            <ActionBtn onClick={() => handleVerDetalle(cot.CotizacionID)} title="Ver detalle" color={C.accent}><FaEye size={12} /></ActionBtn>
                            {estadoNombre === "Pendiente" && (
                              <>
                                <ActionBtn onClick={() => handleCambiarEstado(cot.CotizacionID, "Aprobada")} title="Aprobar" color={C.success}><FaCheck size={12} /></ActionBtn>
                                <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.danger}><FaBan size={12} /></ActionBtn>
                              </>
                            )}
                            {estadoNombre === "Aprobada" && (
                              <>
                                <ActionBtn onClick={() => handleConvertirAVenta(cot.CotizacionID)} title="Convertir a venta" color={C.info}><FaExchangeAlt size={12} /></ActionBtn>
                                <ActionBtn onClick={() => handleCancelarCotizacion(cot)} title="Cancelar" color={C.warning}><FaBan size={12} /></ActionBtn>
                              </>
                            )}
                            {estadoNombre === "Cancelada" && <Badge type="canceled">Cancelada</Badge>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINACIÓN ── */}
          {!cargando && (
            <Paginacion
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              totalItems={totalItems}
              itemsPorPagina={itemsPorPagina}
              onCambiarPagina={handleCambiarPagina}
              onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
              desde={desde}
              hasta={hasta}
            />
          )}
        </div>
      </div>

      <ImagenModal src={imagenModal} onClose={() => setImagenModal(null)} />

      {mostrarDetalle && cotizacionSeleccionada && (
        <ModalDetalleCotizacion
          cotizacion={cotizacionSeleccionada}
          onClose={handleCerrarDetalle}
          onActualizar={cargarCotizaciones}
          onConvertirAVenta={handleConvertirAVenta}
        />
      )}

      {mostrarFormulario && (
        <FormularioCotizacion
          key={modalKey}
          onClose={handleCerrarFormulario}
          onActualizar={cargarCotizaciones}
        />
      )}
    </>
  );
};

export default Cotizaciones;