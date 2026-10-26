/**
 * Resumen para el administrador: contadores del menú y bandeja "Hoy".
 *   GET /api/resumen/pendientes   números (se consulta cada 30 s desde el menú)
 *   GET /api/resumen/hoy          listas para actuar sin abrir cada pantalla
 * (se monta con el middleware admin en server.js)
 */
const express = require('express');
const db = require('../models');
const { ESTADO_COTIZACION, ESTADO_VENTA } = require('../config/estados');
const configuracion = require('../services/config');

const router = express.Router();
const q = (sql, replacements) => db.sequelize.query(sql, { replacements, type: db.sequelize.QueryTypes.SELECT });
const uno = async (sql, replacements) => Number((await q(sql, replacements))[0]?.n || 0);

const SIN_PRECIO = `EXISTS (SELECT 1 FROM detallecotizacion d JOIN cotizaciontecnica t ON t.DetalleCotizacionID = d.DetalleCotizacionID
    WHERE d.CotizacionID = c.CotizacionID AND (t.CostoTecnica IS NULL OR t.CostoTecnica <= 0))`;
const COMPROBANTE_POR_REVISAR = `v.EstadoID = :pendiente AND v.MetodoPago = 'transferencia' AND v.ComprobanteTransferencia IS NOT NULL AND v.ComprobanteTransferencia <> '' AND v.ComprobanteMotivoRechazo IS NULL`;

async function stockBajo(limite = 50) {
    const { stockMinimo } = configuracion.leer();
    if (!stockMinimo) return [];
    return q(`SELECT i.InventarioID, p.Nombre AS producto, co.Nombre AS color, ta.Nombre AS talla, i.Stock AS stock, :minimo AS minimo
        FROM inventarioproducto i JOIN productos p ON p.ProductoID = i.ProductoID JOIN colores co ON co.ColorID = i.ColorID JOIN tallas ta ON ta.TallaID = i.TallaID
        WHERE i.Estado = 1 AND i.Stock <= :minimo ORDER BY i.Stock ASC, p.Nombre LIMIT ${Number(limite)}`, { minimo: stockMinimo });
}

router.get('/pendientes', async (req, res) => {
    try {
        const r = { pendiente: ESTADO_VENTA.PENDIENTE };
        const cotizacionesPendientes = await uno('SELECT COUNT(*) n FROM cotizaciones c WHERE c.EstadoID = :e', { e: ESTADO_COTIZACION.PENDIENTE });
        const cotizacionesSinPrecio = await uno(`SELECT COUNT(*) n FROM cotizaciones c WHERE c.EstadoID IN (:e, :r) AND ${SIN_PRECIO}`, { e: ESTADO_COTIZACION.PENDIENTE, r: ESTADO_COTIZACION.EN_REVISION });
        const cotizacionesAprobadasSinRespuesta = await uno('SELECT COUNT(*) n FROM cotizaciones c WHERE c.EstadoID = :e', { e: ESTADO_COTIZACION.APROBADA });
        const pedidosPendientes = await uno('SELECT COUNT(*) n FROM ventas v WHERE v.EstadoID = :e', { e: ESTADO_VENTA.PENDIENTE });
        const comprobantesPorRevisar = await uno(`SELECT COUNT(*) n FROM ventas v WHERE ${COMPROBANTE_POR_REVISAR}`, r);
        const porEstado = async (e) => uno('SELECT COUNT(*) n FROM ventas v WHERE v.EstadoID = :e', { e });
        const pedidosPorProducir = await porEstado(ESTADO_VENTA.PAGADA);
        const pedidosEnProduccion = await porEstado(ESTADO_VENTA.EN_PRODUCCION);
        const pedidosListos = await porEstado(ESTADO_VENTA.LISTA_ENTREGA);
        const stockBajoCount = (await stockBajo(500)).length;
        res.json({
            cotizacionesPendientes, cotizacionesSinPrecio, cotizacionesAprobadasSinRespuesta, pedidosPendientes, comprobantesPorRevisar,
            pedidosPorProducir, pedidosEnProduccion, pedidosListos, stockBajoCount,
            total: cotizacionesPendientes + comprobantesPorRevisar + pedidosPorProducir + pedidosListos,
        });
    } catch (e) {
        console.error('Error en resumen/pendientes:', e);
        res.status(500).json({ message: 'Error al calcular los pendientes' });
    }
});

router.get('/hoy', async (req, res) => {
    try {
        const cotizacionesPendientes = (await q(`SELECT c.CotizacionID, u.Nombre AS cliente, c.FechaCotizacion AS fecha, c.ValorTotal AS valorTotal, (${SIN_PRECIO}) AS sinPrecio
            FROM cotizaciones c LEFT JOIN usuarios u ON u.DocumentoID = c.DocumentoID WHERE c.EstadoID IN (:e, :r) ORDER BY c.FechaCotizacion ASC LIMIT 15`, { e: ESTADO_COTIZACION.PENDIENTE, r: ESTADO_COTIZACION.EN_REVISION }))
            .map((c) => ({ ...c, sinPrecio: !!Number(c.sinPrecio), valorTotal: Number(c.valorTotal) || 0 }));

        const comprobantesPorRevisar = (await q(`SELECT v.VentaID, u.Nombre AS cliente, v.Total AS total, v.FechaTransferencia AS fecha, v.ComprobanteTransferencia AS comprobante, v.ComprobanteMotivoRechazo AS motivoRechazo
            FROM ventas v LEFT JOIN usuarios u ON u.DocumentoID = v.DocumentoID WHERE ${COMPROBANTE_POR_REVISAR} ORDER BY v.FechaVenta ASC LIMIT 10`, { pendiente: ESTADO_VENTA.PENDIENTE }))
            .map((v) => ({ ...v, total: Number(v.total) || 0 }));

        const pedidosPorAvanzar = (await q(`SELECT v.VentaID, u.Nombre AS cliente, v.Total AS total, v.EstadoID AS estadoID, e.Nombre AS estado, v.FechaVenta AS fecha
            FROM ventas v LEFT JOIN usuarios u ON u.DocumentoID = v.DocumentoID JOIN estados e ON e.EstadoID = v.EstadoID
            WHERE v.EstadoID IN (:estados) ORDER BY v.FechaVenta ASC LIMIT 30`, { estados: [ESTADO_VENTA.PAGADA, ESTADO_VENTA.EN_PRODUCCION, ESTADO_VENTA.LISTA_ENTREGA] }))
            .map((v) => ({ ...v, total: Number(v.total) || 0 }));

        res.json({ cotizacionesPendientes, comprobantesPorRevisar, pedidosPorAvanzar, stockBajo: await stockBajo(30) });
    } catch (e) {
        console.error('Error en resumen/hoy:', e);
        res.status(500).json({ message: 'Error al armar la bandeja de hoy' });
    }
});

// Ejecuta ya el mantenimiento automático (pedidos sin pago, cotizaciones vencidas) y devuelve cuántos movió
router.post('/mantenimiento', async (req, res) => {
    try { res.json(await require('../services/vencimientos').ejecutar()); }
    catch (e) { res.status(500).json({ message: 'Error en el mantenimiento' }); }
});

module.exports = router;
