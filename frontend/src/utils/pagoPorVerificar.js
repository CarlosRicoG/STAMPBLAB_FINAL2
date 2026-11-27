import { ESTADO_VENTA } from "../config/estados";

/**
 * "Pago por verificar": pedido por transferencia que se canceló con un comprobante que nadie revisó (puede que el
 * cliente sí haya pagado). Misma regla que backend/utils/pagoPorVerificar.js. El panel lo resuelve con
 * PATCH /ventas/:id/reembolsado (el pago llegó y se devolvió) o PATCH /ventas/:id/rechazar-comprobante (no hubo pago).
 * Acepta tanto la venta con el comprobante completo como la que solo trae TieneComprobante (0/1).
 */
export const esPagoPorVerificar = (venta) => Boolean(venta)
    && Number(venta.EstadoID) === ESTADO_VENTA.CANCELADA
    && venta.MetodoPago === "transferencia"
    && Boolean(venta.TieneComprobante || venta.ComprobanteTransferencia)
    && !venta.ComprobanteMotivoRechazo
    && !venta.ReembolsoPendiente
    && !venta.ReembolsoRealizadoEn;
