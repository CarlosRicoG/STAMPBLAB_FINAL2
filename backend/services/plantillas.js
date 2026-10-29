/** Plantillas HTML de los correos al cliente (todo texto variable se escapa). */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
const URL_WEB = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function base({ titulo, saludo, cuerpo, boton }) {
    return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#1a2540;padding:22px 28px;"><span style="font-size:22px;font-weight:800;color:#ffffff;">Stamp<span style="color:#4f8ef7;">Lab</span></span></td></tr>
<tr><td style="padding:28px;">
<h2 style="margin:0 0 6px;color:#1a2540;font-size:20px;">${esc(titulo)}</h2>
<p style="margin:0 0 18px;color:#64748b;font-size:14px;">${esc(saludo)}</p>
${cuerpo}
${boton ? `<p style="margin:24px 0 0;"><a href="${esc(boton.url)}" style="display:inline-block;background:#4f8ef7;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:14px;">${esc(boton.texto)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;background:#f8fafc;color:#94a3b8;font-size:12px;">StampLab · Tu marca, nuestra pasión. Este mensaje es automático, no respondas a este correo.</td></tr>
</table></td></tr></table></body></html>`;
}

const fila = (k, v) => `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">${esc(k)}</td><td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;">${esc(v)}</td></tr>`;
const tabla = (filas) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">${filas.join('')}</table>`;
const primerNombre = (u) => String(u?.Nombre || 'cliente').split(' ')[0];

const MENSAJE_ESTADO = {
    Pendiente: 'Recibimos tu pedido y está pendiente de procesar.',
    Pagada: 'Confirmamos tu pago. ¡Gracias! Ya podemos continuar con tu pedido.',
    'En Producción': 'Tu pedido ya está en producción: estamos estampando tus prendas.',
    'Lista para Entrega': 'Tu pedido está listo. Pronto lo recibirás.',
    Entregada: 'Tu pedido fue entregado. ¡Esperamos que te encante!',
    Cancelada: 'Tu pedido fue cancelado. Si no lo solicitaste tú, contáctanos.',
};

function pedidoRecibido({ usuario, venta, lineas }) {
    const items = lineas.map((l) => `<tr><td style="padding:6px 0;color:#0f172a;font-size:13px;">${esc(l.nombre)} <span style="color:#64748b;">× ${esc(l.cantidad)}</span></td><td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:700;text-align:right;">${esc(cop(l.subtotal))}</td></tr>`).join('');
    return {
        asunto: `Recibimos tu pedido #${venta.VentaID}`,
        html: base({
            titulo: `¡Recibimos tu pedido #${venta.VentaID}!`, saludo: `Hola ${primerNombre(usuario)}, gracias por comprar en StampLab.`,
            cuerpo: tabla([items, fila('Total', cop(venta.Total)), fila('Pago', venta.MetodoPago === 'transferencia' ? 'Transferencia bancaria' : venta.MetodoPago === 'contraentrega' ? 'Contra entrega' : 'Por confirmar')]),
            boton: { texto: 'Ver mis compras', url: `${URL_WEB()}/miscompras` },
        }),
    };
}

function pedidoEstado({ usuario, venta, estadoNombre, nota = null, fechaEstimada = null }) {
    const entrega = fechaEstimada && ['En Producción', 'Lista para Entrega'].includes(estadoNombre)
        ? fila('Entrega estimada', new Date(fechaEstimada).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })) : '';
    const notaHtml = nota ? `<p style="margin:14px 0 0;padding:12px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;color:#075985;font-size:14px;"><b>Nota del equipo:</b> ${esc(nota)}</p>` : '';
    return {
        asunto: `Tu pedido #${venta.VentaID}: ${estadoNombre}`,
        html: base({
            titulo: `Tu pedido #${venta.VentaID} ahora está: ${estadoNombre}`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0 0 14px;color:#0f172a;font-size:14px;line-height:1.6;">${esc(MENSAJE_ESTADO[estadoNombre] || 'Actualizamos el estado de tu pedido.')}</p>${tabla([fila('Pedido', '#' + venta.VentaID), fila('Estado', estadoNombre), fila('Total', cop(venta.Total)), entrega])}${notaHtml}`,
            boton: { texto: 'Seguir mi pedido', url: `${URL_WEB()}/miscompras` },
        }),
    };
}

function cotizacionRecibida({ usuario, cotizacion }) {
    return {
        asunto: `Recibimos tu cotización #${cotizacion.CotizacionID}`,
        html: base({
            titulo: `Recibimos tu cotización #${cotizacion.CotizacionID}`, saludo: `Hola ${primerNombre(usuario)}, ya estamos revisando tu diseño.`,
            cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Te avisaremos por este medio cuando tengamos el precio de cada diseño. Normalmente respondemos en pocas horas.</p>`,
            boton: { texto: 'Ver mis cotizaciones', url: `${URL_WEB()}/miscotizaciones` },
        }),
    };
}

function cotizacionEstado({ usuario, cotizacion, estadoNombre }) {
    const aprobada = estadoNombre === 'Aprobada';
    const texto = aprobada
        ? `¡Buenas noticias! Tu cotización fue aprobada por un total de ${cop(cotizacion.ValorTotal)}. Entra a "Mis cotizaciones" para aceptarla y crear tu pedido (o rechazarla si no te convence).`
        : estadoNombre === 'Rechazada' ? 'No pudimos aprobar tu cotización. Contáctanos y la ajustamos contigo.'
            : estadoNombre === 'Cancelada' ? 'Tu cotización fue cancelada.' : `El estado de tu cotización cambió a ${estadoNombre}.`;
    return {
        asunto: `Tu cotización #${cotizacion.CotizacionID}: ${estadoNombre}`,
        html: base({
            titulo: `Tu cotización #${cotizacion.CotizacionID}: ${estadoNombre}`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0 0 14px;color:#0f172a;font-size:14px;line-height:1.6;">${esc(texto)}</p>${aprobada ? tabla([fila('Cotización', '#' + cotizacion.CotizacionID), fila('Total', cop(cotizacion.ValorTotal))]) : ''}`,
            boton: { texto: 'Ver mis cotizaciones', url: `${URL_WEB()}/miscotizaciones` },
        }),
    };
}

function comprobanteRechazado({ usuario, venta, motivo }) {
    return {
        asunto: `Necesitamos otro comprobante para tu pedido #${venta.VentaID}`,
        html: base({
            titulo: `Revisa el comprobante de tu pedido #${venta.VentaID}`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0 0 14px;color:#0f172a;font-size:14px;line-height:1.6;">No pudimos validar el comprobante que subiste. Motivo:</p><p style="margin:0 0 14px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b;font-size:14px;">${esc(motivo)}</p><p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Puedes subir uno nuevo desde "Mis compras". Tu pedido sigue reservado mientras tanto.</p>`,
            boton: { texto: 'Subir nuevo comprobante', url: `${URL_WEB()}/miscompras` },
        }),
    };
}

function pedidoVencido({ usuario, venta, horas, contraentrega }) {
    if (contraentrega) {
        return {
            asunto: `Tu pedido #${venta.VentaID} fue cancelado`,
            html: base({
                titulo: `Cancelamos tu pedido #${venta.VentaID}`, saludo: `Hola ${primerNombre(usuario)},`,
                cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Pasaron más de ${esc(Math.round(horas / 24))} días sin poder concretar la entrega, así que liberamos las prendas reservadas. Si aún las quieres, puedes volver a pedir desde "Mis compras" con un solo clic.</p>`,
                boton: { texto: 'Volver a pedir', url: `${URL_WEB()}/miscompras` },
            }),
        };
    }
    return {
        asunto: `Tu pedido #${venta.VentaID} fue cancelado por falta de pago`,
        html: base({
            titulo: `Cancelamos tu pedido #${venta.VentaID}`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Pasaron más de ${esc(horas)} horas sin recibir el pago, así que liberamos las prendas reservadas. Si aún las quieres, puedes volver a pedir desde "Mis compras" con un solo clic.</p>`,
            boton: { texto: 'Volver a pedir', url: `${URL_WEB()}/miscompras` },
        }),
    };
}

function cotizacionVencida({ usuario, cotizacion, dias }) {
    return {
        asunto: `Tu cotización #${cotizacion.CotizacionID} venció`,
        html: base({
            titulo: `Tu cotización #${cotizacion.CotizacionID} venció`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Pasaron ${esc(dias)} días sin respuesta y los precios pueden haber cambiado. Si todavía te interesa, genera una cotización nueva y te respondemos rápido.</p>`,
            boton: { texto: 'Cotizar de nuevo', url: `${URL_WEB()}/cotizacionesLanding` },
        }),
    };
}

function pedidoPorVencer({ usuario, venta, horas, contraentrega }) {
    if (contraentrega) {
        return {
            asunto: `Tu pedido #${venta.VentaID} se cancelará pronto si no coordinamos la entrega`,
            html: base({
                titulo: `Tu pedido #${venta.VentaID} está por vencer`, saludo: `Hola ${primerNombre(usuario)},`,
                cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Todavía no hemos podido coordinar la entrega. Si no lo logramos en unas ${esc(horas)} horas, cancelaremos el pedido y liberaremos las prendas reservadas. Escríbenos para conservarlo.</p>`,
                boton: { texto: 'Ver mi pedido', url: `${URL_WEB()}/miscompras` },
            }),
        };
    }
    return {
        asunto: `Tu pedido #${venta.VentaID} se cancelará pronto si no recibimos el pago`,
        html: base({
            titulo: `Tu pedido #${venta.VentaID} está por vencer`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Todavía no recibimos tu pago. Si no lo hacemos en unas ${esc(horas)} horas, cancelaremos el pedido y liberaremos las prendas reservadas. Puedes subir tu comprobante desde "Mis compras".</p>`,
            boton: { texto: 'Subir comprobante', url: `${URL_WEB()}/miscompras` },
        }),
    };
}

function cotizacionPorVencer({ usuario, cotizacion, dias }) {
    return {
        asunto: `Tu cotización #${cotizacion.CotizacionID} vence pronto`,
        html: base({
            titulo: `Tu cotización #${cotizacion.CotizacionID} vence pronto`, saludo: `Hola ${primerNombre(usuario)},`,
            cuerpo: `<p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;">Tu cotización ya tiene precio y vence en ${esc(dias)} día(s). Si quieres hacer el pedido, acéptala antes de que venza; después tendrías que cotizar de nuevo.</p>`,
            boton: { texto: 'Ver mi cotización', url: `${URL_WEB()}/cotizacionesLanding` },
        }),
    };
}

// ── Avisos para el equipo (administradores) ──
const URL_ADMIN = () => URL_WEB() + '/dashboard';

function avisoAdmin({ asunto, titulo, filas, ruta, boton }) {
    return {
        asunto,
        html: base({
            titulo, saludo: 'Aviso automático para el equipo de StampLab.',
            cuerpo: tabla(filas.map(([k, v]) => fila(k, v))),
            boton: { texto: boton || 'Abrir el panel', url: URL_ADMIN() + (ruta || '') },
        }),
    };
}

function stockBajoAdmin({ items, minimo }) {
    const lista = items.map((i) => fila(`${i.producto} · ${i.color} · ${i.talla}`, `${i.stock} u.`));
    return {
        asunto: `Stock bajo: ${items.length} variante(s) por debajo de ${minimo} unidades`,
        html: base({
            titulo: 'Stock bajo', saludo: `Estas variantes están en ${minimo} unidades o menos.`,
            cuerpo: tabla(lista), boton: { texto: 'Ver la bandeja de hoy', url: URL_ADMIN() + '/hoy' },
        }),
    };
}

module.exports = { pedidoRecibido, pedidoEstado, cotizacionRecibida, cotizacionEstado, comprobanteRechazado, pedidoVencido, cotizacionVencida, pedidoPorVencer, cotizacionPorVencer, avisoAdmin, stockBajoAdmin, esc, cop };
