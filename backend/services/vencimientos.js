/**
 * Mantenimiento automático (corre cada hora y al arrancar):
 *  - Pedidos por transferencia sin comprobante válido pasadas PLAZO_PAGO_HORAS horas: se cancelan y devuelven el stock.
 *    (Los pedidos con comprobante en revisión y los de contra entrega NUNCA se cancelan solos.)
 *  - Cotizaciones sin respuesta pasados VIGENCIA_COTIZACION_DIAS días: pasan a Vencida. Si ya está aprobada, los días
 *    corren desde la aprobación (no desde que el cliente la pidió); si no, desde la fecha de la cotización.
 *  - Aviso previo (una sola vez): al cliente se le avisa antes de que su pedido se cancele por falta de pago
 *    o de que venza su cotización aprobada.
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

const HORAS_AVISO_PEDIDO = 24;
const DIAS_AVISO_COTIZACION = 1;

// Pedidos que pueden cancelarse solos si se pasa su plazo: transferencia sin comprobante válido (plazo en horas) y
// contra entrega (plazo en días). Los de transferencia con comprobante en revisión nunca se cancelan solos.
// `ahora` y los plazos fijan hasta qué fecha de venta cuenta como vencido.
const pedidosConPlazo = ({ ahora, plazoPagoHoras, plazoContraentregaDias, margenHoras = 0, desde = false }) => {
    const antes = (horas) => new Date(ahora.getTime() - (horas - margenHoras) * 3600 * 1000);
    const o = [];
    if (plazoPagoHoras) {
        o.push({
            MetodoPago: 'transferencia',
            FechaVenta: desde ? { [Op.between]: [antes(plazoPagoHoras + margenHoras), antes(plazoPagoHoras)] } : { [Op.lt]: antes(plazoPagoHoras) },
            [Op.or]: [{ ComprobanteTransferencia: null }, { ComprobanteTransferencia: '' }, { ComprobanteMotivoRechazo: { [Op.ne]: null } }],
        });
    }
    if (plazoContraentregaDias) {
        const h = plazoContraentregaDias * 24;
        o.push({
            MetodoPago: 'contraentrega',
            FechaVenta: desde ? { [Op.between]: [antes(h + margenHoras), antes(h)] } : { [Op.lt]: antes(h) },
        });
    }
    return o.length ? { EstadoID: ESTADO_VENTA.PENDIENTE, [Op.or]: o } : null;
};

async function cancelarPedidosSinPago(ahora = new Date()) {
    const { plazoPagoHoras, plazoContraentregaDias } = configuracion.leer();
    const donde = pedidosConPlazo({ ahora, plazoPagoHoras, plazoContraentregaDias });
    if (!donde) return 0;
    const candidatos = await db.Venta.findAll({ where: donde, attributes: ['VentaID', 'MetodoPago'], raw: true });
    let canceladas = 0;
    for (const { VentaID, MetodoPago } of candidatos) {
        const contraentrega = MetodoPago === 'contraentrega';
        const plazoHoras = contraentrega ? plazoContraentregaDias * 24 : plazoPagoHoras;
        const t = await db.sequelize.transaction();
        try {
            const venta = await db.Venta.findByPk(VentaID, { transaction: t, lock: t.LOCK.UPDATE });
            if (!venta || venta.EstadoID !== ESTADO_VENTA.PENDIENTE) { await t.rollback(); continue; }
            const detalles = await db.DetalleVenta.findAll({ where: { VentaID }, transaction: t });
            await inventario.devolver(detalles, t);
            await venta.update({ EstadoID: ESTADO_VENTA.CANCELADA }, { transaction: t });
            await historial.registrar({ tipo: 'venta', refId: VentaID, estadoId: ESTADO_VENTA.CANCELADA, nota: contraentrega ? `Cancelado automáticamente: pasaron ${plazoContraentregaDias} días sin concretar la entrega` : `Cancelado automáticamente: pasaron ${plazoPagoHoras} horas sin pago` }, t);
            await t.commit();
            canceladas++;
            notificaciones.pedidoVencido(VentaID, plazoHoras, contraentrega);
        } catch (e) {
            await t.rollback().catch(() => {});
            console.error(`[vencimientos] pedido #${VentaID}:`, e.message);
        }
    }
    return canceladas;
}

// Fecha desde la que corre la vigencia: la aprobación si ya fue aprobada; si no, la fecha de la cotización
const referenciaVigencia = (cot) => (cot.EstadoID === ESTADO_COTIZACION.APROBADA && cot.FechaAprobacion) || cot.FechaCotizacion;

// Cotizaciones cuya vigencia empezó antes de `limite`
const condicionVigencia = (limite, soloAprobadas = false) => {
    const aprobadas = {
        EstadoID: ESTADO_COTIZACION.APROBADA,
        [Op.or]: [{ FechaAprobacion: { [Op.lt]: limite } }, { FechaAprobacion: null, FechaCotizacion: { [Op.lt]: limite } }],
    };
    if (soloAprobadas) return aprobadas;
    return { [Op.or]: [{ EstadoID: { [Op.in]: [ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION] }, FechaCotizacion: { [Op.lt]: limite } }, aprobadas] };
};

async function vencerCotizaciones(ahora = new Date()) {
    const { vigenciaCotizacionDias } = configuracion.leer();
    if (!vigenciaCotizacionDias) return 0;
    const limite = new Date(ahora.getTime() - vigenciaCotizacionDias * 864e5);
    const candidatas = await db.Cotizacion.findAll({
        where: condicionVigencia(limite),
        attributes: ['CotizacionID'], raw: true,
    });
    let vencidas = 0;
    for (const { CotizacionID } of candidatas) {
        const t = await db.sequelize.transaction();
        try {
            const cot = await db.Cotizacion.findByPk(CotizacionID, { transaction: t, lock: t.LOCK.UPDATE });
            const noVencible = cot && ![ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION, ESTADO_COTIZACION.APROBADA].includes(cot.EstadoID);
            // Si el estado o la fecha de aprobación cambiaron mientras tanto, ya no corresponde vencerla
            if (!cot || noVencible || referenciaVigencia(cot) >= limite) { await t.rollback(); continue; }
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

/** Avisa una sola vez al cliente que su pedido se cancelará pronto si no paga. */
async function avisarPedidosPorVencer(ahora = new Date()) {
    const { plazoPagoHoras, plazoContraentregaDias } = configuracion.leer();
    // Margen de aviso: 24 h, o la mitad del plazo si es más corto. Una ventana por método de pago.
    const margen = (horas) => Math.min(HORAS_AVISO_PEDIDO, Math.floor(horas / 2));
    const ventanas = [
        { metodo: 'transferencia', plazo: plazoPagoHoras },
        { metodo: 'contraentrega', plazo: plazoContraentregaDias * 24 },
    ].filter((v) => v.plazo && margen(v.plazo) >= 1);
    let avisados = 0;
    for (const { metodo, plazo } of ventanas) {
        const donde = pedidosConPlazo({
            ahora, margenHoras: margen(plazo), desde: true,
            plazoPagoHoras: metodo === 'transferencia' ? plazo : 0, plazoContraentregaDias: metodo === 'contraentrega' ? plazo / 24 : 0,
        });
        // pedidosConPlazo con margen devuelve los pedidos que ya pasaron "plazo - margen" y aún no el plazo completo
        const candidatos = await db.Venta.findAll({ where: { ...donde, AvisoVencimiento: false }, attributes: ['VentaID', 'FechaVenta'], raw: true });
        avisados += await avisarPedidos(candidatos, plazo, metodo === 'contraentrega', ahora);
    }
    return avisados;
}

async function avisarPedidos(candidatos, plazoPagoHoras, contraentrega, ahora) {
    let avisados = 0;
    for (const { VentaID, FechaVenta } of candidatos) {
        try {
            // Reclamo atómico: si dos ejecuciones coinciden, solo una envía el aviso
            const [n] = await db.Venta.update({ AvisoVencimiento: true }, { where: { VentaID, AvisoVencimiento: false } });
            if (!n) continue;
            const horasRestantes = Math.max(1, Math.round((new Date(FechaVenta).getTime() + plazoPagoHoras * 3600 * 1000 - ahora.getTime()) / 3600000));
            notificaciones.pedidoPorVencer(VentaID, horasRestantes, contraentrega);
            avisados++;
        } catch (e) { console.error(`[vencimientos] aviso pedido #${VentaID}:`, e.message); }
    }
    return avisados;
}

/** Avisa una sola vez al cliente que su cotización aprobada está por vencer. */
async function avisarCotizacionesPorVencer(ahora = new Date()) {
    const { vigenciaCotizacionDias } = configuracion.leer();
    if (!vigenciaCotizacionDias || vigenciaCotizacionDias <= DIAS_AVISO_COTIZACION) return 0;
    const limiteAviso = new Date(ahora.getTime() - (vigenciaCotizacionDias - DIAS_AVISO_COTIZACION) * 864e5);
    const candidatas = await db.Cotizacion.findAll({
        where: { ...condicionVigencia(limiteAviso, true), AvisoVencimiento: false },
        attributes: ['CotizacionID'], raw: true,
    });
    let avisadas = 0;
    for (const { CotizacionID } of candidatas) {
        try {
            const [n] = await db.Cotizacion.update({ AvisoVencimiento: true }, { where: { CotizacionID, AvisoVencimiento: false, EstadoID: ESTADO_COTIZACION.APROBADA } });
            if (!n) continue;
            notificaciones.cotizacionPorVencer(CotizacionID, DIAS_AVISO_COTIZACION);
            avisadas++;
        } catch (e) { console.error(`[vencimientos] aviso cotización #${CotizacionID}:`, e.message); }
    }
    return avisadas;
}

async function purgarNotificaciones() {
    return db.Notificacion.destroy({ where: { Archivada: true, Fecha: { [Op.lt]: new Date(Date.now() - 90 * 864e5) } } });
}

async function ejecutar() {
    const resultado = { pedidosCancelados: 0, cotizacionesVencidas: 0, pedidosAvisados: 0, cotizacionesAvisadas: 0, notificacionesBorradas: 0 };
    try { resultado.pedidosCancelados = await cancelarPedidosSinPago(); } catch (e) { console.error('[vencimientos] pedidos:', e.message); }
    try { resultado.cotizacionesVencidas = await vencerCotizaciones(); } catch (e) { console.error('[vencimientos] cotizaciones:', e.message); }
    // Los avisos van después de los vencimientos: lo que ya venció no se avisa
    try { resultado.pedidosAvisados = await avisarPedidosPorVencer(); } catch (e) { console.error('[vencimientos] avisos de pedidos:', e.message); }
    try { resultado.cotizacionesAvisadas = await avisarCotizacionesPorVencer(); } catch (e) { console.error('[vencimientos] avisos de cotizaciones:', e.message); }
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

module.exports = { ejecutar, cancelarPedidosSinPago, vencerCotizaciones, avisarPedidosPorVencer, avisarCotizacionesPorVencer, purgarNotificaciones, iniciar };
