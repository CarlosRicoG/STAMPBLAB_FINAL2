/**
 * Mantenimiento automático (corre cada hora y al arrancar):
 *  - Pedidos por transferencia sin comprobante válido pasadas PLAZO_PAGO_HORAS horas: se cancelan y devuelven el stock.
 *    (Los pedidos con comprobante en revisión y los de contra entrega NUNCA se cancelan solos.)
 *  - Cotizaciones sin respuesta pasados VIGENCIA_COTIZACION_DIAS días: pasan a Vencida.
 *  - Notificaciones archivadas hace más de 90 días se borran.
 * Cada pedido/cotización se procesa bajo bloqueo y en su propia transacción: si falla uno, los demás siguen.
 */
const { Op } = require('sequelize');
const db = require('../models');
const inventario = require('./inventario');
const historial = require('./historial');
const notificaciones = require('./notificaciones');
const configuracion = require('./config');
const { ESTADO_VENTA, ESTADO_COTIZACION } = require('../config/estados');

async function cancelarPedidosSinPago(ahora = new Date()) {
    const { plazoPagoHoras } = configuracion.leer();
    if (!plazoPagoHoras) return 0;
    const limite = new Date(ahora.getTime() - plazoPagoHoras * 3600 * 1000);
    const candidatos = await db.Venta.findAll({
        where: {
            EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', FechaVenta: { [Op.lt]: limite },
            [Op.or]: [{ ComprobanteTransferencia: null }, { ComprobanteTransferencia: '' }, { ComprobanteMotivoRechazo: { [Op.ne]: null } }],
        },
        attributes: ['VentaID'], raw: true,
    });
    let canceladas = 0;
    for (const { VentaID } of candidatos) {
        const t = await db.sequelize.transaction();
        try {
            const venta = await db.Venta.findByPk(VentaID, { transaction: t, lock: t.LOCK.UPDATE });
            if (!venta || venta.EstadoID !== ESTADO_VENTA.PENDIENTE) { await t.rollback(); continue; }
            const detalles = await db.DetalleVenta.findAll({ where: { VentaID }, transaction: t });
            await inventario.devolver(detalles, t);
            await venta.update({ EstadoID: ESTADO_VENTA.CANCELADA }, { transaction: t });
            await historial.registrar({ tipo: 'venta', refId: VentaID, estadoId: ESTADO_VENTA.CANCELADA, nota: `Cancelado automáticamente: pasaron ${plazoPagoHoras} horas sin pago` }, t);
            await t.commit();
            canceladas++;
            notificaciones.pedidoVencido(VentaID, plazoPagoHoras);
        } catch (e) {
            await t.rollback().catch(() => {});
            console.error(`[vencimientos] pedido #${VentaID}:`, e.message);
        }
    }
    return canceladas;
}

async function vencerCotizaciones(ahora = new Date()) {
    const { vigenciaCotizacionDias } = configuracion.leer();
    if (!vigenciaCotizacionDias) return 0;
    const limite = new Date(ahora.getTime() - vigenciaCotizacionDias * 864e5);
    const candidatas = await db.Cotizacion.findAll({
        where: { EstadoID: { [Op.in]: [ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION, ESTADO_COTIZACION.APROBADA] }, FechaCotizacion: { [Op.lt]: limite } },
        attributes: ['CotizacionID'], raw: true,
    });
    let vencidas = 0;
    for (const { CotizacionID } of candidatas) {
        const t = await db.sequelize.transaction();
        try {
            const cot = await db.Cotizacion.findByPk(CotizacionID, { transaction: t, lock: t.LOCK.UPDATE });
            if (!cot || ![ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION, ESTADO_COTIZACION.APROBADA].includes(cot.EstadoID)) { await t.rollback(); continue; }
            await cot.update({ EstadoID: ESTADO_COTIZACION.VENCIDA }, { transaction: t });
            await historial.registrar({ tipo: 'cotizacion', refId: CotizacionID, estadoId: ESTADO_COTIZACION.VENCIDA, nota: `Venció tras ${vigenciaCotizacionDias} días sin respuesta` }, t);
            await t.commit();
            vencidas++;
            notificaciones.cotizacionVencida(CotizacionID, vigenciaCotizacionDias);
        } catch (e) {
            await t.rollback().catch(() => {});
            console.error(`[vencimientos] cotización #${CotizacionID}:`, e.message);
        }
    }
    return vencidas;
}

async function purgarNotificaciones() {
    return db.Notificacion.destroy({ where: { Archivada: true, Fecha: { [Op.lt]: new Date(Date.now() - 90 * 864e5) } } });
}

async function ejecutar() {
    const resultado = { pedidosCancelados: 0, cotizacionesVencidas: 0, notificacionesBorradas: 0 };
    try { resultado.pedidosCancelados = await cancelarPedidosSinPago(); } catch (e) { console.error('[vencimientos] pedidos:', e.message); }
    try { resultado.cotizacionesVencidas = await vencerCotizaciones(); } catch (e) { console.error('[vencimientos] cotizaciones:', e.message); }
    try { resultado.notificacionesBorradas = await purgarNotificaciones(); } catch (e) { console.error('[vencimientos] notificaciones:', e.message); }
    return resultado;
}

let temporizador = null;
function iniciar() {
    if (temporizador || process.env.JOBS_DESACTIVADOS === '1' || process.env.NODE_ENV === 'test') return;
    setTimeout(() => ejecutar().catch(() => {}), 30 * 1000).unref();
    temporizador = setInterval(() => ejecutar().catch(() => {}), 60 * 60 * 1000);
    temporizador.unref();
}

module.exports = { ejecutar, cancelarPedidosSinPago, vencerCotizaciones, purgarNotificaciones, iniciar };
