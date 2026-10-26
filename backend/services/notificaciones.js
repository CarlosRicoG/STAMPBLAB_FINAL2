/**
 * Avisos de la tienda: cada evento genera (según corresponda) un correo y una notificación dentro de la aplicación,
 * tanto para el cliente como para el equipo (administradores).
 * Cada función recibe solo IDs, lee lo que necesita de la base y se llama SIN await después del commit:
 * un fallo de correo o de aviso jamás afecta la operación ni la respuesta.
 */
const db = require('../models');
const correo = require('./correo');
const plantillas = require('./plantillas');
const avisos = require('./avisos');
const configuracion = require('./config');

const seguro = (fn) => (...args) => fn(...args).catch((e) => console.error('[notificaciones]', e.message));
const cop = plantillas.cop;

/** Correos del equipo: ADMIN_NOTIFY_EMAIL (varios con coma) o, si no está, el correo de cada administrador. */
async function correosAdmin() {
    const manual = String(process.env.ADMIN_NOTIFY_EMAIL || '').split(',').map((c) => c.trim()).filter(Boolean);
    if (manual.length) return manual;
    const admins = await db.Usuario.findAll({ where: { RolID: 1 }, attributes: ['Correo'], raw: true });
    return admins.map((a) => a.Correo).filter(Boolean);
}
async function correoAAdmins({ asunto, html }) {
    for (const para of await correosAdmin()) await correo.enviar({ para, asunto, html });
}

const cargarVenta = (ventaId, extra = []) => db.Venta.findByPk(ventaId, {
    include: [{ model: db.Usuario, as: 'usuario' }, { model: db.Estado, as: 'estado' }, ...extra],
});
const cargarCotizacion = (id) => db.Cotizacion.findByPk(id, { include: [{ model: db.Usuario, as: 'usuario' }, { model: db.Estado, as: 'estado' }] });
const nombreCliente = (u) => u?.Nombre || 'Un cliente';

/** Variantes que quedaron en o por debajo del mínimo tras reservar el pedido (solo las que acaban de cruzar el umbral). */
async function variantesBajas(ventaId) {
    const { stockMinimo } = configuracion.leer();
    if (!stockMinimo) return [];
    const detalles = await db.DetalleVenta.findAll({ where: { VentaID: ventaId }, raw: true });
    const resultado = [];
    for (const d of detalles) {
        if (!d.InventarioID) continue;
        const inv = await db.InventarioProducto.findByPk(d.InventarioID, { raw: true });
        if (!inv || inv.Stock > stockMinimo || inv.Stock + d.Cantidad <= stockMinimo) continue; // solo si ACABA de cruzar el umbral
        const [p, c, t] = await Promise.all([db.Producto.findByPk(inv.ProductoID, { raw: true }), db.Color.findByPk(inv.ColorID, { raw: true }), db.Talla.findByPk(inv.TallaID, { raw: true })]);
        resultado.push({ producto: p?.Nombre || 'Producto', color: c?.Nombre || '—', talla: t?.Nombre || '—', stock: inv.Stock });
    }
    return resultado;
}

// ───────────────────────── Pedidos ─────────────────────────

const pedidoRecibido = seguro(async (ventaId) => {
    const venta = await cargarVenta(ventaId, [{ model: db.DetalleVenta, as: 'detalles', include: [{ model: db.Producto, as: 'producto' }] }]);
    if (!venta) return;
    const cliente = venta.usuario;

    // Cliente
    if (cliente?.Correo) {
        const lineas = (venta.detalles || []).map((d) => ({ nombre: d.producto?.Nombre || 'Producto', cantidad: d.Cantidad, subtotal: (Number(d.PrecioUnitario) || 0) * (d.Cantidad || 0) }));
        const { asunto, html } = plantillas.pedidoRecibido({ usuario: cliente, venta, lineas });
        await correo.enviar({ para: cliente.Correo, asunto, html });
    }
    const { plazoPagoHoras } = configuracion.leer();
    await avisos.paraUsuario(venta.DocumentoID, {
        tipo: 'pedido', enlace: '/miscompras',
        mensaje: `Recibimos tu pedido #${venta.VentaID} por ${cop(venta.Total)}.${venta.MetodoPago === 'transferencia' && plazoPagoHoras ? ` Paga dentro de las próximas ${plazoPagoHoras} horas.` : ''}`,
    });

    // Equipo
    const aviso = `${nombreCliente(cliente)} hizo el pedido #${venta.VentaID} por ${cop(venta.Total)}${venta.MetodoPago ? ` (${venta.MetodoPago === 'transferencia' ? 'transferencia' : 'contra entrega'})` : ''}.`;
    await avisos.paraAdmins({ tipo: 'pedido', mensaje: aviso, enlace: '/dashboard/ventas-pendientes' });
    const m = plantillas.avisoAdmin({
        asunto: `Nuevo pedido #${venta.VentaID} de ${nombreCliente(cliente)}`, titulo: `Nuevo pedido #${venta.VentaID}`,
        filas: [['Cliente', nombreCliente(cliente)], ['Total', cop(venta.Total)], ['Pago', venta.MetodoPago || 'Por confirmar'], ['Entrega', venta.TipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda']],
        ruta: '/ventas-pendientes', boton: 'Revisar el pedido',
    });
    await correoAAdmins(m);
    if (venta.MetodoPago === 'transferencia' && venta.ComprobanteTransferencia) {
        await avisos.paraAdmins({ tipo: 'pago', mensaje: `Hay un comprobante por revisar en el pedido #${venta.VentaID} de ${nombreCliente(cliente)}.`, enlace: '/dashboard/ventas-pendientes' });
    }

    const bajas = await variantesBajas(ventaId);
    if (bajas.length) await stockBajo(bajas);
});

const pedidoEstado = seguro(async (ventaId, nota = null) => {
    const venta = await cargarVenta(ventaId);
    if (!venta) return;
    const nombre = venta.estado?.Nombre || 'Actualizado';
    if (venta.usuario?.Correo) {
        const { asunto, html } = plantillas.pedidoEstado({ usuario: venta.usuario, venta, estadoNombre: nombre, nota, fechaEstimada: venta.FechaEstimadaEntrega });
        await correo.enviar({ para: venta.usuario.Correo, asunto, html });
    }
    const extra = nota ? ` Nota: ${nota}` : '';
    const fecha = venta.FechaEstimadaEntrega && [10, 13].includes(venta.EstadoID) ? ` Entrega estimada: ${new Date(venta.FechaEstimadaEntrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.` : '';
    await avisos.paraUsuario(venta.DocumentoID, { tipo: 'pedido', enlace: '/miscompras', mensaje: `Tu pedido #${venta.VentaID} ahora está: ${nombre}.${fecha}${extra}` });
});

/** El cliente canceló su propio pedido pendiente. */
const pedidoCanceladoPorCliente = seguro(async (ventaId) => {
    const venta = await cargarVenta(ventaId);
    if (!venta) return;
    await avisos.paraAdmins({ tipo: 'pedido', mensaje: `${nombreCliente(venta.usuario)} canceló su pedido #${venta.VentaID}.`, enlace: '/dashboard/ventas' });
});

/** El cliente subió (o volvió a subir) un comprobante de transferencia. */
const comprobanteSubido = seguro(async (ventaId) => {
    const venta = await cargarVenta(ventaId);
    if (!venta) return;
    await avisos.paraAdmins({ tipo: 'pago', mensaje: `${nombreCliente(venta.usuario)} subió un comprobante para el pedido #${venta.VentaID} (${cop(venta.Total)}). Revísalo para confirmar el pago.`, enlace: '/dashboard/ventas-pendientes' });
    await correoAAdmins(plantillas.avisoAdmin({
        asunto: `Comprobante por revisar: pedido #${venta.VentaID}`, titulo: `Comprobante del pedido #${venta.VentaID}`,
        filas: [['Cliente', nombreCliente(venta.usuario)], ['Total', cop(venta.Total)]], ruta: '/ventas-pendientes', boton: 'Revisar comprobante',
    }));
});

/** El administrador rechazó el comprobante: se avisa al cliente con el motivo. */
const comprobanteRechazado = seguro(async (ventaId, motivo) => {
    const venta = await cargarVenta(ventaId);
    if (!venta) return;
    if (venta.usuario?.Correo) {
        const { asunto, html } = plantillas.comprobanteRechazado({ usuario: venta.usuario, venta, motivo });
        await correo.enviar({ para: venta.usuario.Correo, asunto, html });
    }
    await avisos.paraUsuario(venta.DocumentoID, { tipo: 'pago', enlace: '/miscompras', mensaje: `No pudimos validar el comprobante del pedido #${venta.VentaID}: ${motivo}. Sube uno nuevo desde "Mis compras".` });
});

/** Pedido cancelado automáticamente por no pagarse a tiempo. */
const pedidoVencido = seguro(async (ventaId, horas) => {
    const venta = await cargarVenta(ventaId);
    if (!venta) return;
    if (venta.usuario?.Correo) {
        const { asunto, html } = plantillas.pedidoVencido({ usuario: venta.usuario, venta, horas });
        await correo.enviar({ para: venta.usuario.Correo, asunto, html });
    }
    await avisos.paraUsuario(venta.DocumentoID, { tipo: 'pedido', enlace: '/miscompras', mensaje: `Cancelamos tu pedido #${venta.VentaID} porque pasaron más de ${horas} horas sin pago. Puedes volver a pedir con un clic.` });
    await avisos.paraAdmins({ tipo: 'pedido', mensaje: `El pedido #${venta.VentaID} de ${nombreCliente(venta.usuario)} se canceló solo por falta de pago.`, enlace: '/dashboard/ventas' });
});

// ───────────────────────── Cotizaciones ─────────────────────────

const cotizacionRecibida = seguro(async (cotizacionId) => {
    const cot = await cargarCotizacion(cotizacionId);
    if (!cot) return;
    if (cot.usuario?.Correo) {
        const { asunto, html } = plantillas.cotizacionRecibida({ usuario: cot.usuario, cotizacion: cot });
        await correo.enviar({ para: cot.usuario.Correo, asunto, html });
    }
    await avisos.paraUsuario(cot.DocumentoID, { tipo: 'cotizacion', enlace: '/miscotizaciones', mensaje: `Recibimos tu cotización #${cot.CotizacionID}. Te avisaremos cuando tengamos el precio.` });
    await avisos.paraAdmins({ tipo: 'cotizacion', mensaje: `${nombreCliente(cot.usuario)} envió la cotización #${cot.CotizacionID}. Falta ponerle precio.`, enlace: '/dashboard/cotizaciones' });
    await correoAAdmins(plantillas.avisoAdmin({
        asunto: `Nueva cotización #${cot.CotizacionID} de ${nombreCliente(cot.usuario)}`, titulo: `Nueva cotización #${cot.CotizacionID}`,
        filas: [['Cliente', nombreCliente(cot.usuario)], ['Estado', 'Pendiente de precio']], ruta: '/cotizaciones', boton: 'Poner precio',
    }));
});

const cotizacionEstado = seguro(async (cotizacionId) => {
    const cot = await cargarCotizacion(cotizacionId);
    if (!cot) return;
    const nombre = cot.estado?.Nombre || 'Actualizada';
    if (cot.usuario?.Correo) {
        const { asunto, html } = plantillas.cotizacionEstado({ usuario: cot.usuario, cotizacion: cot, estadoNombre: nombre });
        await correo.enviar({ para: cot.usuario.Correo, asunto, html });
    }
    const mensaje = nombre === 'Aprobada'
        ? `Tu cotización #${cot.CotizacionID} ya tiene precio: ${cop(cot.ValorTotal)}. Entra para aceptarla y crear tu pedido.`
        : `Tu cotización #${cot.CotizacionID} ahora está: ${nombre}.`;
    await avisos.paraUsuario(cot.DocumentoID, { tipo: 'cotizacion', enlace: '/miscotizaciones', mensaje });
});

/** El cliente respondió una cotización aprobada (aceptó, rechazó) o la canceló. */
const cotizacionRespuesta = seguro(async (cotizacionId, respuesta, detalle = null) => {
    const cot = await cargarCotizacion(cotizacionId);
    if (!cot) return;
    const quien = nombreCliente(cot.usuario);
    const mensajes = {
        aceptada: `${quien} aceptó la cotización #${cot.CotizacionID}${detalle ? ` y se creó el pedido #${detalle}` : ''}.`,
        rechazada: `${quien} rechazó la cotización #${cot.CotizacionID}${detalle ? `: ${detalle}` : ''}.`,
        cancelada: `${quien} canceló la cotización #${cot.CotizacionID}.`,
    };
    await avisos.paraAdmins({ tipo: 'cotizacion', mensaje: mensajes[respuesta] || `${quien} respondió la cotización #${cot.CotizacionID}.`, enlace: respuesta === 'aceptada' ? '/dashboard/ventas-pendientes' : '/dashboard/cotizaciones' });
});

const cotizacionVencida = seguro(async (cotizacionId, dias) => {
    const cot = await cargarCotizacion(cotizacionId);
    if (!cot) return;
    if (cot.usuario?.Correo) {
        const { asunto, html } = plantillas.cotizacionVencida({ usuario: cot.usuario, cotizacion: cot, dias });
        await correo.enviar({ para: cot.usuario.Correo, asunto, html });
    }
    await avisos.paraUsuario(cot.DocumentoID, { tipo: 'cotizacion', enlace: '/cotizacionesLanding', mensaje: `Tu cotización #${cot.CotizacionID} venció tras ${dias} días sin respuesta. Puedes generar una nueva.` });
});

// ───────────────────────── Inventario ─────────────────────────

const stockBajo = seguro(async (items) => {
    if (!items?.length) return;
    const { stockMinimo } = configuracion.leer();
    const resumen = items.slice(0, 3).map((i) => `${i.producto} ${i.color}/${i.talla} (${i.stock})`).join(', ');
    await avisos.paraAdmins({ tipo: 'stock', mensaje: `Stock bajo: ${resumen}${items.length > 3 ? ` y ${items.length - 3} más` : ''}.`, enlace: '/dashboard/hoy' });
    await correoAAdmins(plantillas.stockBajoAdmin({ items, minimo: stockMinimo }));
});

module.exports = {
    pedidoRecibido, pedidoEstado, pedidoCanceladoPorCliente, comprobanteSubido, comprobanteRechazado, pedidoVencido,
    cotizacionRecibida, cotizacionEstado, cotizacionRespuesta, cotizacionVencida, stockBajo,
};
