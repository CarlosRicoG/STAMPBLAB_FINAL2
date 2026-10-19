/**
 * Avisos al cliente. Cada función recibe solo un ID, lee lo que necesita de la base y envía el correo.
 * Se llaman SIN await después del commit: un fallo de correo jamás afecta la operación ni la respuesta.
 */
const db = require('../models');
const correo = require('./correo');
const plantillas = require('./plantillas');

const seguro = (fn) => (...args) => fn(...args).catch((e) => console.error('[notificaciones]', e.message));

const pedidoRecibido = seguro(async (ventaId) => {
    const venta = await db.Venta.findByPk(ventaId, { include: [{ model: db.Usuario, as: 'usuario' }, { model: db.DetalleVenta, as: 'detalles', include: [{ model: db.Producto, as: 'producto' }] }] });
    if (!venta?.usuario?.Correo) return;
    const lineas = (venta.detalles || []).map((d) => ({ nombre: d.producto?.Nombre || 'Producto', cantidad: d.Cantidad, subtotal: (Number(d.PrecioUnitario) || 0) * (d.Cantidad || 0) }));
    const { asunto, html } = plantillas.pedidoRecibido({ usuario: venta.usuario, venta, lineas });
    await correo.enviar({ para: venta.usuario.Correo, asunto, html });
});

const pedidoEstado = seguro(async (ventaId) => {
    const venta = await db.Venta.findByPk(ventaId, { include: [{ model: db.Usuario, as: 'usuario' }, { model: db.Estado, as: 'estado' }] });
    if (!venta?.usuario?.Correo) return;
    const { asunto, html } = plantillas.pedidoEstado({ usuario: venta.usuario, venta, estadoNombre: venta.estado?.Nombre || 'Actualizado' });
    await correo.enviar({ para: venta.usuario.Correo, asunto, html });
});

const cotizacionRecibida = seguro(async (cotizacionId) => {
    const cot = await db.Cotizacion.findByPk(cotizacionId, { include: [{ model: db.Usuario, as: 'usuario' }] });
    if (!cot?.usuario?.Correo) return;
    const { asunto, html } = plantillas.cotizacionRecibida({ usuario: cot.usuario, cotizacion: cot });
    await correo.enviar({ para: cot.usuario.Correo, asunto, html });
});

const cotizacionEstado = seguro(async (cotizacionId) => {
    const cot = await db.Cotizacion.findByPk(cotizacionId, { include: [{ model: db.Usuario, as: 'usuario' }, { model: db.Estado, as: 'estado' }] });
    if (!cot?.usuario?.Correo) return;
    const { asunto, html } = plantillas.cotizacionEstado({ usuario: cot.usuario, cotizacion: cot, estadoNombre: cot.estado?.Nombre || 'Actualizada' });
    await correo.enviar({ para: cot.usuario.Correo, asunto, html });
});

module.exports = { pedidoRecibido, pedidoEstado, cotizacionRecibida, cotizacionEstado };
