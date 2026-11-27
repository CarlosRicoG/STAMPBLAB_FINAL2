import Swal from "sweetalert2";
import axios from "axios";
import { escapeHtml } from "../../utils/escapeHtml";
import { updateCotizacion, getCotizacionById, cancelarCotizacion } from "../../Services/api-cotizaciones/cotizaciones";
import API_BASE from "../../config/api";
import { ESTADO_COTIZACION } from "../../config/estados";
import { C } from "../../config/tokens";
import { formatPrecio } from "../../utils/formato";
import { swalEncima } from "../../utils/alertas";
import { estadoDe, sinCosto } from "./cotizacionUtils";

/**
 * Acciones sobre una cotización (cancelar, aprobar, convertir a venta) con sus confirmaciones.
 * Recibe el estado de la página para cerrar/recargar el detalle y la tabla igual que antes.
 */
export default function useAccionesCotizacion({ cotizacionSeleccionada, setCotizacionSeleccionada, recargar, recargarDetalle }) {
  const handleCancelarCotizacion = async (cotizacion) => {
    const { nombre: estadoNombre } = estadoDe(cotizacion);
    const result = await swalEncima({
      title: '¿Cancelar esta cotización?',
      html: `<p><strong>Cotización #${cotizacion.CotizacionID}</strong></p><p>Cliente: ${escapeHtml(cotizacion.usuario?.Nombre || 'N/A')}</p><p>Estado actual: <strong>${escapeHtml(estadoNombre)}</strong></p><p style="color:#64748b;font-size:13px">Esta acción no se puede deshacer.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: C.danger, cancelButtonColor: C.navy,
      confirmButtonText: 'Sí, cancelar', cancelButtonText: 'No, mantener'
    });
    if (!result.isConfirmed) return;
    try {
      await cancelarCotizacion(cotizacion.CotizacionID);
      setCotizacionSeleccionada(null);
      Swal.fire({ icon: 'success', title: '¡Cotización cancelada!', timer: 2000, showConfirmButton: false });
      recargar();
    } catch (error) {
      swalEncima({ icon: 'error', title: 'Error al cancelar', text: error.response?.data?.message || error.message });
    }
  };

  const handleAprobar = async (cotizacionID) => {
    let response;
    try { response = await getCotizacionById(cotizacionID); }
    catch { Swal.fire("Error", "No se pudo cargar la cotización", "error"); return; }
    const faltan = response.detalles?.flatMap(d => d.tecnicas || []).filter(sinCosto) || [];
    if (faltan.length > 0) {
      await swalEncima({
        icon: "warning", title: "No se puede aprobar",
        html: `<p>Hay <strong>${faltan.length}</strong> diseño(s) sin costo asignado.</p><p style="color:#64748b;font-size:13px">Abre el detalle y asigna el costo de cada diseño.</p>`,
        showCancelButton: true, confirmButtonText: "Asignar costos", cancelButtonText: "Cerrar", confirmButtonColor: C.accent, cancelButtonColor: C.muted,
      }).then(r => { if (r.isConfirmed) setCotizacionSeleccionada(response); });
      return;
    }
    const ok = await swalEncima({
      title: `¿Aprobar la cotización #${cotizacionID}?`,
      html: `<p>Total: <strong>$${formatPrecio(response.ValorTotal)}</strong></p><p style="color:#64748b;font-size:13px">Después de aprobarla ya no podrás modificar los costos.</p>`,
      icon: "question", showCancelButton: true, confirmButtonText: "Sí, aprobar", cancelButtonText: "Cancelar",
      confirmButtonColor: C.success, cancelButtonColor: C.muted,
    });
    if (!ok.isConfirmed) return;
    try {
      await updateCotizacion(cotizacionID, { EstadoID: ESTADO_COTIZACION.APROBADA });
      Swal.fire({ icon: "success", title: "¡Cotización aprobada!", timer: 1500, showConfirmButton: false });
      if (cotizacionSeleccionada?.CotizacionID === cotizacionID) await recargarDetalle(cotizacionID);
      recargar();
    } catch (error) {
      swalEncima({ icon: "error", title: "No se pudo aprobar", text: error.response?.data?.message || error.message });
    }
  };

  const handleConvertirAVenta = async (cotizacionID) => {
    const result = await swalEncima({
      title: '¿Convertir cotización a venta?',
      html: `<p style="color:#64748b;font-size:13px">Se creará una venta pendiente y se descontará el stock de cada variante.</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, convertir', cancelButtonText: 'Cancelar',
      confirmButtonColor: C.success, cancelButtonColor: C.muted
    });
    if (!result.isConfirmed) return;
    try {
      const response = await axios.post(`${API_BASE}/api/cotizaciones/${cotizacionID}/convertir-a-venta`);
      setCotizacionSeleccionada(null);
      Swal.fire({ icon: 'success', title: '¡Conversión exitosa!', text: `Venta #${response.data.venta.VentaID} creada`, timer: 2500, showConfirmButton: false });
      recargar();
    } catch (error) {
      swalEncima({ icon: 'error', title: 'No se pudo convertir', text: error.response?.data?.message || error.message || 'Error desconocido' });
    }
  };

  return { handleCancelarCotizacion, handleAprobar, handleConvertirAVenta };
}
