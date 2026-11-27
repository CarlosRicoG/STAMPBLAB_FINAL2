/**
 * "Pago por verificar": pedido por transferencia que se canceló estando Pendiente con un comprobante que nadie revisó.
 * Puede que el cliente sí haya pagado. El administrador lo resuelve con un dato explícito en la venta:
 *  - PATCH /api/ventas/:id/reembolsado         → el pago llegó y se devolvió (ReembolsoRealizadoEn = ahora)
 *  - PATCH /api/ventas/:id/rechazar-comprobante → no hubo pago / comprobante no válido (ComprobanteMotivoRechazo = motivo)
 * Fuente única de la regla: la usan ventaController (al cancelar y al resolver) y la supresión de cuentas (miCuentaController).
 */
const { Op } = require('sequelize');
const { ESTADO_VENTA } = require('../config/estados');

/** Condición `where` de las ventas con un pago por verificar (sin el filtro por cliente). */
const wherePagoPorVerificar = () => ({
    EstadoID: ESTADO_VENTA.CANCELADA,
    MetodoPago: 'transferencia',
    ReembolsoPendiente: false,
    ReembolsoRealizadoEn: null,
    ComprobanteMotivoRechazo: null,
    ComprobanteTransferencia: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
});

/** Misma regla sobre una venta ya leída. `tieneComprobante` indica si su comprobante existe y no está vacío. */
const esPagoPorVerificar = (venta, tieneComprobante) => Boolean(venta)
    && Number(venta.EstadoID) === ESTADO_VENTA.CANCELADA
    && venta.MetodoPago === 'transferencia'
    && !venta.ReembolsoPendiente
    && !venta.ReembolsoRealizadoEn
    && !venta.ComprobanteMotivoRechazo
    && Boolean(tieneComprobante);

module.exports = { wherePagoPorVerificar, esPagoPorVerificar };
