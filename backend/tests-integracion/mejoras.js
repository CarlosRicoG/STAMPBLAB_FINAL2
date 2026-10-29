/**
 * Mejoras de flujo: avisos en la campana (cliente y administrador), aceptar/rechazar cotizaciones, línea de tiempo,
 * comprobante rechazado, vencimientos automáticos, tarifas, bandeja de hoy, carrito, datos de contacto y entrega.
 * Requiere MAIL_MODO=archivo en el servidor para comprobar los correos al equipo (si no, esas comprobaciones se omiten).
 * Los vencimientos manipulan fechas directamente en la base (mismo .env que el servidor).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b === undefined ? undefined : JSON.stringify(b) });
    const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = txt; }
    return { s: r.status, j };
};
let bad = 0;
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + String(d).slice(0, 220) : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PNG = 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]).toString('base64');

(async () => {
    const login = async (c, p) => (await call('POST', '/login', { Correo: c, 'Contraseña': p })).j.token;
    const adm = await login('admin@stamplab.com', 'Admin123*');
    const cli = await login('cliente@stamplab.com', 'Cliente123*');
    const db = require('../models');
    const stock = async () => { const r = await call('GET', '/inventarioproducto/1', undefined, adm); return (r.j.datos || r.j).Stock; };
    const stock0 = await stock();
    const limpiar = { ventas: [], cots: [] };

    // un segundo cliente (temporal)
    await call('POST', '/registro', { Nombre: 'Otro Mejoras', Correo: 'otro.mejoras@stamplab.com', 'Contraseña': 'Otro12345*', DocumentoID: 1888888881, Telefono: '3009998888' });
    const otro = await login('otro.mejoras@stamplab.com', 'Otro12345*');

    const notifs = async (t, archivada = false) => (await call('GET', `/notificaciones?archivada=${archivada}`, undefined, t)).j;
    const hay = async (t, re) => { for (let i = 0; i < 20; i++) { const n = await notifs(t); if ((n.results || []).some((x) => re.test(x.mensaje))) return (n.results || []).find((x) => re.test(x.mensaje)); await espera(150); } return null; };
    const buzon = async () => (await call('GET', '/correos-prueba', undefined, adm)).j.datos;
    const hayCorreo = async (re) => { for (let i = 0; i < 20; i++) { const m = (await buzon()).find((c) => re.test(c.asunto)); if (m) return m; await espera(150); } return null; };
    const correosActivos = (await call('GET', '/correos-prueba', undefined, adm)).s === 200;

    const te = (await call('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
    const pa = (await call('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
    const cotizar = async (token) => {
        const r = await call('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 1, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 1, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 1 }], insumos: [{ InsumoID: 1, CantidadRequerida: 1 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'mejoras', CostoTecnica: 0 }] }] }, token);
        const id = r.j?.cotizacion?.CotizacionID; if (id) limpiar.cots.push(id); return id;
    };
    const aprobar = async (id, costo = 9000) => {
        const d = (await call('GET', '/cotizaciones/' + id, undefined, adm)).j;
        for (const x of d.detalles || []) for (const t of x.tecnicas || []) await call('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: costo }, adm);
        return (await call('PUT', '/cotizaciones/' + id, { EstadoID: 2 }, adm)).s;
    };
    const pedido = (o = {}) => ({ Subtotal: 99999, Total: 99999, metodoPago: 'transferencia', comprobanteTransferencia: PNG, detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 99999 }], ...o });

    console.log('--- configuración pública');
    let r = await call('GET', '/config-publica');
    si('trae plazo de pago, vigencia, costo de envío y stock mínimo', r.s === 200 && ['plazoPagoHoras', 'vigenciaCotizacionDias', 'costoEnvio', 'stockMinimo', 'whatsapp'].every((k) => k in r.j), JSON.stringify(r.j));

    console.log('--- el administrador se entera de lo que hace el cliente');
    const antesAdm = (await notifs(adm)).noLeidas;
    const C1 = await cotizar(cli);
    si('al cotizar, el administrador recibe una notificación', !!(await hay(adm, new RegExp(`cotización #${C1}`, 'i'))));
    si('y la del cliente confirma que la recibimos', !!(await hay(cli, new RegExp(`Recibimos tu cotización #${C1}`))));
    if (correosActivos) si('y un correo al equipo', !!(await hayCorreo(new RegExp(`Nueva cotización #${C1}`))));
    si('el contador de no leídas del administrador subió', (await call('GET', '/notificaciones/contador', undefined, adm)).j.noLeidas > antesAdm);

    console.log('--- el cliente acepta la cotización aprobada');
    r = await call('POST', `/cotizaciones/${C1}/aceptar`, {}, cli); si('no se puede aceptar una cotización que aún no tiene precio', r.s === 400, r.s);
    si('el admin la aprueba con precio', (await aprobar(C1)) === 200);
    si('el cliente recibe el aviso "ya tiene precio"', !!(await hay(cli, new RegExp(`cotización #${C1} ya tiene precio`, 'i'))));
    const cotAprob = (await call('GET', '/cotizaciones/' + C1, undefined, cli)).j;
    si('la cotización aprobada trae el valor calculado (no 0)', Number(cotAprob.ValorTotal) > 0, cotAprob.ValorTotal);
    r = await call('POST', `/cotizaciones/${C1}/aceptar`, {}, otro); si('otro cliente NO puede aceptarla', r.s === 403, r.s);
    r = await call('POST', `/cotizaciones/${C1}/aceptar`, {}, adm); si('(el admin usa "convertir", no "aceptar")', r.s === 403 || r.s === 400 || r.s === 201, r.s);
    if (r.s === 201) limpiar.ventas.push(r.j.venta.VentaID);
    const aceptable = r.s === 201 ? null : await call('POST', `/cotizaciones/${C1}/aceptar`, {}, cli);
    if (aceptable) {
        si('el cliente acepta: se crea su pedido pendiente', aceptable.s === 201 && aceptable.j.venta?.EstadoID === 8, aceptable.s + ' ' + JSON.stringify(aceptable.j).slice(0, 100));
        if (aceptable.s === 201) limpiar.ventas.push(aceptable.j.venta.VentaID);
        { const sNow = await stock(); si('el stock bajó 1 al aceptar', sNow === stock0 - 1, stock0 + ' -> ' + sNow); }
        r = await call('POST', `/cotizaciones/${C1}/aceptar`, {}, cli); si('aceptar dos veces no crea otro pedido', r.s === 400, r.s);
        si('el administrador recibe el aviso de que aceptó', !!(await hay(adm, new RegExp(`aceptó la cotización #${C1}`))));
        const cot = (await call('GET', '/cotizaciones/' + C1, undefined, cli)).j; si('la cotización queda Procesada (5)', cot.EstadoID === 5);
    }

    console.log('--- el cliente rechaza otra cotización');
    const C2 = await cotizar(cli); await aprobar(C2);
    r = await call('POST', `/cotizaciones/${C2}/rechazar`, { motivo: 'Está muy cara' }, cli); si('rechazar con motivo', r.s === 200, r.s);
    si('queda Rechazada (3)', (await call('GET', '/cotizaciones/' + C2, undefined, cli)).j.EstadoID === 3);
    si('el administrador recibe el aviso con el motivo', !!(await hay(adm, /rechazó la cotización #\d+: Está muy cara/)));
    r = await call('POST', `/cotizaciones/${C2}/rechazar`, {}, cli); si('no se rechaza dos veces', r.s === 400, r.s);

    console.log('--- línea de tiempo');
    r = await call('GET', `/cotizaciones/${C1}/historial`, undefined, cli); si('el cliente ve el historial de su cotización (recibida → aprobada → procesada)', r.s === 200 && r.j.length >= 3, JSON.stringify(r.j).slice(0, 150));
    r = await call('GET', `/cotizaciones/${C1}/historial`, undefined, otro); si('otro cliente no', r.s === 403, r.s);
    const V = aceptable?.j?.venta?.VentaID;
    if (V) { r = await call('GET', `/ventas/${V}/historial`, undefined, cli); si('el pedido creado ya tiene su historial', r.s === 200 && r.j.length >= 1 && /cotización/i.test(r.j[0].Nota || ''), JSON.stringify(r.j).slice(0, 150)); }

    console.log('--- notas y fecha estimada al cambiar de estado');
    const VP = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VP);
    si('al pedir, el administrador recibe el aviso del pedido y del comprobante', !!(await hay(adm, new RegExp(`pedido #${VP} por`))) && !!(await hay(adm, new RegExp(`comprobante por revisar en el pedido #${VP}`))));
    r = await call('PATCH', `/ventas/${VP}/estado`, { EstadoID: 9, nota: 'x'.repeat(301) }, adm); si('una nota de más de 300 caracteres se rechaza', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${VP}/estado`, { EstadoID: 9, nota: 'Pago verificado' }, adm); si('Pendiente → Pagada con nota', r.s === 200, r.s);
    r = await call('PATCH', `/ventas/${VP}/estado`, { EstadoID: 10, fechaEstimadaEntrega: '2020-01-01' }, adm); si('una fecha estimada pasada se rechaza', r.s === 400, r.s);
    const futura = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    r = await call('PATCH', `/ventas/${VP}/estado`, { EstadoID: 10, nota: 'Falta tinta blanca', fechaEstimadaEntrega: futura }, adm); si('→ En Producción con nota y fecha estimada', r.s === 200, r.s);
    const ven = (await call('GET', '/ventas/' + VP, undefined, cli)).j;
    si('el cliente ve la fecha estimada en su pedido', String(ven.FechaEstimadaEntrega || '').startsWith(futura), ven.FechaEstimadaEntrega);
    si('el cliente recibe un aviso con la nota y la fecha', !!(await hay(cli, /pedido #\d+ ahora está: En Producción\..*Falta tinta blanca/)));
    r = await call('GET', `/ventas/${VP}/historial`, undefined, cli);
    si('el historial lista todos los pasos con sus notas', r.s === 200 && r.j.length === 3 && r.j.some((h) => h.Nota === 'Pago verificado') && r.j.some((h) => h.Nota === 'Falta tinta blanca'), JSON.stringify(r.j).slice(0, 200));
    if (correosActivos) { const m = await hayCorreo(new RegExp(`Tu pedido #${VP}: En Producción`)); si('el correo al cliente incluye la nota del equipo', !!m && m.html.includes('Falta tinta blanca'), m?.html?.slice(0, 80)); }

    console.log('--- comprobante rechazado y vuelto a subir');
    const VR = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VR);
    r = await call('PATCH', `/ventas/${VR}/rechazar-comprobante`, { motivo: 'no' }, adm); si('un motivo muy corto se rechaza', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${VR}/rechazar-comprobante`, { motivo: 'La imagen no se ve' }, cli); si('el cliente no puede rechazar su propio comprobante', r.s === 403, r.s);
    r = await call('PATCH', `/ventas/${VR}/rechazar-comprobante`, { motivo: 'La imagen no se ve' }, adm); si('el administrador rechaza con motivo', r.s === 200, r.s);
    si('el cliente recibe el aviso con el motivo', !!(await hay(cli, new RegExp(`comprobante del pedido #${VR}: La imagen no se ve`))));
    if (correosActivos) si('y un correo', !!(await hayCorreo(new RegExp(`otro comprobante para tu pedido #${VR}`))));
    si('el pedido guarda el motivo', (await call('GET', '/ventas/' + VR, undefined, cli)).j.ComprobanteMotivoRechazo === 'La imagen no se ve');
    r = await call('PATCH', `/ventas/${VR}/comprobante`, { comprobanteTransferencia: PNG }, otro); si('otro cliente no puede subir el comprobante de mi pedido', r.s === 403, r.s);
    r = await call('PATCH', `/ventas/${VR}/comprobante`, { comprobanteTransferencia: '' }, cli); si('sin archivo se rechaza', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${VR}/comprobante`, { comprobanteTransferencia: PNG }, cli); si('el cliente sube uno nuevo', r.s === 200, r.s);
    si('el motivo de rechazo se borra', (await call('GET', '/ventas/' + VR, undefined, cli)).j.ComprobanteMotivoRechazo === null);
    si('el administrador recibe el aviso del nuevo comprobante', !!(await hay(adm, new RegExp(`subió un comprobante para el pedido #${VR}`))));
    await call('PATCH', `/ventas/${VR}/estado`, { EstadoID: 9 }, adm);
    r = await call('PATCH', `/ventas/${VR}/comprobante`, { comprobanteTransferencia: PNG }, cli); si('ya pagado: no se cambia el comprobante', r.s === 400, r.s);

    console.log('--- entrega y datos de contacto');
    r = await call('POST', '/ventas', pedido({ tipoEntrega: 'envio' }), cli); si('envío a domicilio sin dirección se rechaza', r.s === 400, r.s);
    await call('PUT', '/usuarios/1000000002', { Telefono: '3001110000', Nombre: 'Cliente Demo' }, cli);
    r = await call('POST', '/ventas', pedido({ tipoEntrega: 'envio', nombreReceptor: 'Ana', telefonoEntrega: '3000000001', direccionEntrega: 'Calle 9 # 8-7' }), cli);
    const VE = r.j?.venta?.VentaID; if (VE) limpiar.ventas.push(VE);
    si('envío a domicilio con datos: se crea y guarda el tipo y la dirección', r.s === 201 && r.j.venta.TipoEntrega === 'envio' && r.j.venta.DireccionEntrega === 'Calle 9 # 8-7', r.s + JSON.stringify(r.j).slice(0, 120));
    si('el pedido guarda el costo de envío del servidor', r.s === 201 && Number(r.j.venta.CostoEnvio) >= 0);
    await call('PUT', '/usuarios/1000000002', { Telefono: '3112223333', Nombre: 'Cliente Demo' }, cli);
    const veo = (await call('GET', '/ventas/' + VE, undefined, cli)).j;
    si('si el cliente cambia su teléfono después, el pedido conserva el de ese momento', veo.ContactoTelefono === '3001110000', veo.ContactoTelefono);
    r = await call('POST', '/ventas', pedido({ tipoEntrega: 'camion' }), cli); si('un tipo de entrega raro se trata como retiro (no rompe)', r.s === 201 && r.j.venta.TipoEntrega === 'retiro'); if (r.s === 201) limpiar.ventas.push(r.j.venta.VentaID);

    console.log('--- tarifas');
    r = await call('PUT', '/tarifas', { TecnicaID: tecnicaID, ParteID: parteID, Costo: 12000 }, cli); si('el cliente no puede fijar tarifas', r.s === 403, r.s);
    r = await call('PUT', '/tarifas', { TecnicaID: tecnicaID, ParteID: parteID, Costo: -5 }, adm); si('costo negativo se rechaza', r.s === 400, r.s);
    r = await call('PUT', '/tarifas', { TecnicaID: 99999, ParteID: parteID, Costo: 5 }, adm); si('técnica inexistente se rechaza', r.s === 400, r.s);
    r = await call('PUT', '/tarifas', { TecnicaID: tecnicaID, ParteID: parteID, Costo: 12000 }, adm); si('el administrador crea la tarifa', r.s === 201 || r.s === 200, r.s);
    const tarifaID = r.j.TarifaID;
    r = await call('PUT', '/tarifas', { TecnicaID: tecnicaID, ParteID: parteID, Costo: 13000 }, adm); si('la misma técnica+parte se actualiza (no se duplica)', r.s === 200 && r.j.TarifaID === tarifaID, r.s);
    r = await call('GET', '/tarifas/publicas'); si('el cliente (sin sesión) ve las tarifas públicas', r.s === 200 && r.j.some((t) => t.TecnicaID === tecnicaID && t.ParteID === parteID && t.Costo === 13000));
    r = await call('GET', '/tarifas', undefined, cli); si('el listado completo es solo del administrador', r.s === 403, r.s);
    const C3 = await cotizar(cli);
    r = await call('POST', `/cotizaciones/${C3}/aplicar-tarifas`, {}, cli); si('el cliente no aplica tarifas', r.s === 403, r.s);
    r = await call('POST', `/cotizaciones/${C3}/aplicar-tarifas`, {}, adm); si('el administrador aplica tarifas a los diseños sin costo', r.s === 200 && r.j.aplicadas === 1, JSON.stringify(r.j));
    const d3 = (await call('GET', '/cotizaciones/' + C3, undefined, adm)).j;
    si('el diseño quedó con el costo de la tarifa', Number(d3.detalles[0].tecnicas[0].CostoTecnica) === 13000);
    r = await call('POST', `/cotizaciones/${C3}/aplicar-tarifas`, {}, adm); si('aplicar otra vez no cambia nada', r.s === 200 && r.j.aplicadas === 0, JSON.stringify(r.j));
    si('ahora sí se puede aprobar sin asignar costos a mano', (await call('PUT', '/cotizaciones/' + C3, { EstadoID: 2 }, adm)).s === 200);
    r = await call('DELETE', '/tarifas/' + tarifaID, undefined, adm); si('el administrador elimina la tarifa', r.s === 200, r.s);

    console.log('--- bandeja y contadores del administrador');
    r = await call('GET', '/resumen/pendientes', undefined, cli); si('un cliente no ve los contadores', r.s === 403, r.s);
    r = await call('GET', '/resumen/pendientes', undefined, adm);
    si('los contadores traen todos los números', r.s === 200 && ['cotizacionesPendientes', 'cotizacionesSinPrecio', 'pedidosPendientes', 'comprobantesPorRevisar', 'pedidosPorProducir', 'pedidosListos', 'stockBajoCount', 'total'].every((k) => typeof r.j[k] === 'number'), JSON.stringify(r.j));
    r = await call('GET', '/resumen/hoy', undefined, adm);
    si('la bandeja "Hoy" trae sus cuatro listas', r.s === 200 && ['cotizacionesPendientes', 'comprobantesPorRevisar', 'pedidosPorAvanzar', 'stockBajo'].every((k) => Array.isArray(r.j[k])), JSON.stringify(r.j).slice(0, 150));
    si('el pedido en producción aparece en "por avanzar"', r.j.pedidosPorAvanzar.some((p) => p.VentaID === VP));
    r = await call('GET', '/resumen/hoy', undefined, cli); si('el cliente no ve la bandeja', r.s === 403, r.s);

    console.log('--- campana: gestionar notificaciones');
    const lista = await notifs(cli);
    si('el cliente ve sus notificaciones (con "hace", enlace y estado)', lista.results.length > 0 && lista.results.every((n) => n.id && n.mensaje && 'leida' in n && n.hace));
    si('y no las del administrador', !lista.results.some((n) => /aceptó la cotización/.test(n.mensaje)));
    const una = lista.results[0];
    r = await call('POST', `/notificaciones/${una.id}/leer`, {}, otro); si('otro usuario no puede tocar mis notificaciones', r.s === 404, r.s);
    r = await call('POST', `/notificaciones/${una.id}/leer`, {}, cli); si('marcar una como leída', r.s === 200);
    r = await call('POST', `/notificaciones/${una.id}/archivar`, {}, cli); si('archivar una', r.s === 200);
    si('pasa al historial', (await notifs(cli, true)).results.some((n) => n.id === una.id) && !(await notifs(cli)).results.some((n) => n.id === una.id));
    r = await call('POST', '/notificaciones/abc/leer', {}, cli); si('id con letras: 400 limpio', r.s === 400, r.s);
    r = await call('POST', '/notificaciones/leer-todas', {}, cli); si('marcar todas como leídas', r.s === 200 && (await call('GET', '/notificaciones/contador', undefined, cli)).j.noLeidas === 0);
    r = await call('GET', '/notificaciones'); si('sin sesión no se ven notificaciones', [401, 403].includes(r.s), r.s);
    const adminAntes = (await notifs(adm)).results.length;
    r = await call('POST', '/notificaciones/archivar-todas', {}, cli); si('archivar todas', r.s === 200 && (await notifs(cli)).results.length === 0);
    si('archivar las del cliente no toca las del administrador', (await notifs(adm)).results.length === adminAntes);

    console.log('--- carrito en el servidor');
    r = await call('GET', '/carrito', undefined, cli); si('carrito vacío al inicio', r.s === 200 && Array.isArray(r.j.items));
    r = await call('PUT', '/carrito', { items: [{ producto: { ProductoID: 1 }, cantidad: 2, precio: 50000 }] }, cli); si('guardar el carrito', r.s === 200);
    r = await call('GET', '/carrito', undefined, cli); si('se recupera igual (desde otro equipo)', r.j.items.length === 1 && r.j.items[0].cantidad === 2);
    r = await call('GET', '/carrito', undefined, otro); si('cada cliente tiene el suyo', r.j.items.length === 0);
    r = await call('PUT', '/carrito', { items: 'x' }, cli); si('un carrito que no es lista se rechaza', r.s === 400, r.s);
    r = await call('PUT', '/carrito', { items: new Array(201).fill({}) }, cli); si('más de 200 productos se rechaza', r.s === 400, r.s);
    r = await call('PUT', '/carrito', { items: [] }, cli);

    console.log('--- vencimientos automáticos (fechas movidas en la base)');
    const { Op } = require('sequelize');
    const sinPago = (await call('POST', '/ventas', pedido(), cli));
    // Un pedido por transferencia sin comprobante: el servidor exige comprobante al crear, así que se quita en la base
    const VSP = sinPago.j?.venta?.VentaID; limpiar.ventas.push(VSP);
    const VRV = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VRV);                       // con comprobante en revisión
    const VCE = (await call('POST', '/ventas', pedido({ metodoPago: 'contraentrega', comprobanteTransferencia: undefined, nombreReceptor: 'A', telefonoEntrega: '3000000000', direccionEntrega: 'Calle 1' }), cli)).j?.venta?.VentaID; limpiar.ventas.push(VCE); // contra entrega
    const VNUEVO = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VNUEVO);                  // reciente
    const VRECH = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VRECH);                    // comprobante rechazado
    await call('PATCH', `/ventas/${VRECH}/rechazar-comprobante`, { motivo: 'Ilegible, súbelo otra vez' }, adm);
    const hace3dias = new Date(Date.now() - 3 * 864e5);
    if (VSP) await db.Venta.update({ ComprobanteTransferencia: null, FechaVenta: hace3dias }, { where: { VentaID: VSP } });
    await db.Venta.update({ FechaVenta: hace3dias }, { where: { VentaID: [VRV, VCE, VRECH].filter(Boolean) } });
    const stockAntes = await stock();
    r = await call('POST', '/resumen/mantenimiento', {}, cli); si('el cliente no dispara el mantenimiento', r.s === 403, r.s);
    r = await call('POST', '/resumen/mantenimiento', {}, adm); si('el mantenimiento corre', r.s === 200 && r.j.pedidosCancelados >= 2, JSON.stringify(r.j));
    const est = async (id) => (await call('GET', '/ventas/' + id, undefined, adm)).j.EstadoID;
    si('el pedido sin pago a tiempo se canceló solo', (await est(VSP)) === 12);
    si('el que tenía el comprobante rechazado y sin corregir también', (await est(VRECH)) === 12);
    si('el que tiene el comprobante en revisión NO se cancela', (await est(VRV)) === 8);
    si('el de contra entrega NO se cancela', (await est(VCE)) === 8);
    si('el pedido reciente NO se cancela', (await est(VNUEVO)) === 8);
    si('el stock de los cancelados se devolvió (+2)', (await stock()) === stockAntes + 2, `${stockAntes} -> ${await stock()}`);
    si('el cliente recibe el aviso de la cancelación automática', !!(await hay(cli, new RegExp(`Cancelamos tu pedido #${VSP}`))));
    si('queda en el historial como cancelado automáticamente', (await call('GET', `/ventas/${VSP}/historial`, undefined, adm)).j.some((h) => /automáticamente/.test(h.Nota || '')));
    r = await call('POST', '/resumen/mantenimiento', {}, adm); si('correrlo de nuevo no cancela dos veces ni devuelve más stock', (await stock()) === stockAntes + 2 && r.j.pedidosCancelados === 0, JSON.stringify(r.j));

    const CV = await cotizar(cli); const CR = await cotizar(cli); const CN = await cotizar(cli);
    const CA = await cotizar(cli); const CP = await cotizar(cli);
    await db.Cotizacion.update({ FechaCotizacion: new Date(Date.now() - 40 * 864e5) }, { where: { CotizacionID: [CV, CR, CA, CP] } });
    await aprobar(CR); await aprobar(CA); await aprobar(CP);
    // CR lleva 40 días aprobada (vence); CA se acaba de aprobar aunque se pidió hace 40 días (NO vence); CP se aprobó hace 29,5 días (aviso previo)
    await db.Cotizacion.update({ FechaAprobacion: new Date(Date.now() - 40 * 864e5) }, { where: { CotizacionID: CR } });
    await db.Cotizacion.update({ FechaAprobacion: new Date(Date.now() - 29.5 * 864e5) }, { where: { CotizacionID: CP } });
    r = await call('POST', '/resumen/mantenimiento', {}, adm); si('vencen las cotizaciones de más de 30 días', r.s === 200 && r.j.cotizacionesVencidas >= 2, JSON.stringify(r.j));
    const ec = async (id) => (await call('GET', '/cotizaciones/' + id, undefined, adm)).j.EstadoID;
    si('la pendiente vieja quedó Vencida (7)', (await ec(CV)) === 7);
    si('la aprobada hace más de 30 días sin respuesta también', (await ec(CR)) === 7);
    si('una aprobada ahora NO vence aunque la cotización sea vieja (la vigencia corre desde la aprobación)', (await ec(CA)) === 2);
    si('la reciente sigue pendiente', (await ec(CN)) === 1);
    si('el cliente recibe el aviso de vencimiento', !!(await hay(cli, new RegExp(`cotización #${CV} venció`))));

    console.log('--- aviso previo de vencimiento');
    si('la cotización aprobada a punto de vencer avisa al cliente', !!(await hay(cli, new RegExp(`cotización #${CP} vence en`))));
    si('la que acaba de aprobarse NO recibe aviso', !(await hay(cli, new RegExp(`cotización #${CA} vence en`))));
    si('queda marcada como avisada', (await db.Cotizacion.findByPk(CP)).AvisoVencimiento === true);
    const avisosAntes = await db.Notificacion.count({ where: { Mensaje: { [Op.like]: `%cotización #${CP} vence%` } } });
    await call('POST', '/resumen/mantenimiento', {}, adm);
    si('el aviso se envía una sola vez', (await db.Notificacion.count({ where: { Mensaje: { [Op.like]: `%cotización #${CP} vence%` } } })) === avisosAntes && avisosAntes === 1, String(avisosAntes));
    const VPV = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VPV);
    if (VPV) await db.Venta.update({ ComprobanteTransferencia: null, FechaVenta: new Date(Date.now() - 30 * 3600 * 1000) }, { where: { VentaID: VPV } });
    r = await call('POST', '/resumen/mantenimiento', {}, adm);
    si('el pedido sin pago a 18 h de vencer avisa al cliente y sigue Pendiente', !!(await hay(cli, new RegExp(`pedido #${VPV} se cancelará`))) && (await est(VPV)) === 8, JSON.stringify(r.j));

    console.log('--- cancelar un pedido ya pagado: stock y reembolso');
    const base = await stock();
    const VPG = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VPG);
    si('el pedido reservó 1 unidad', (await stock()) === base - 1, `${base} -> ${await stock()}`);
    await call('PATCH', `/ventas/${VPG}/estado`, { EstadoID: 9 }, adm);
    r = await call('PATCH', `/ventas/${VPG}/estado`, { EstadoID: 12 }, adm);
    si('cancelar un pedido Pagada responde 200 con reembolso pendiente', r.s === 200 && r.j.reembolsoPendiente === true && r.j.stockDevuelto === true, JSON.stringify(r.j).slice(0, 200));
    si('el stock vuelve (la prenda no entró a producción)', (await stock()) === base, `${base} -> ${await stock()}`);
    si('el pedido queda con el reembolso pendiente', (await call('GET', '/ventas/' + VPG, undefined, adm)).j.ReembolsoPendiente === true);
    si('el historial lo deja anotado', (await call('GET', `/ventas/${VPG}/historial`, undefined, adm)).j.some((h) => /Reembolso pendiente/.test(h.Nota || '')));
    r = await call('PATCH', `/ventas/${VPG}/reembolsado`, {}, cli); si('el cliente no puede marcar el reembolso', r.s === 403, r.s);
    r = await call('PATCH', `/ventas/${VPG}/reembolsado`, {}, adm); si('el administrador marca el reembolso como realizado', r.s === 200 && r.j.venta.ReembolsoPendiente === false, JSON.stringify(r.j).slice(0, 160));
    r = await call('PATCH', `/ventas/${VPG}/reembolsado`, {}, adm); si('marcarlo dos veces se rechaza', r.s === 400, r.s);

    const VPR = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VPR);
    for (const e of [9, 10]) await call('PATCH', `/ventas/${VPR}/estado`, { EstadoID: e }, adm);
    r = await call('PATCH', `/ventas/${VPR}/estado`, { EstadoID: 12 }, adm);
    si('cancelar en producción deja reembolso pendiente pero NO repone el stock', r.s === 200 && r.j.reembolsoPendiente === true && r.j.stockDevuelto === false && (await stock()) === base - 1, `${JSON.stringify(r.j).slice(0, 120)} stock ${await stock()}`);
    const VPN = (await call('POST', '/ventas', pedido(), cli)).j?.venta?.VentaID; limpiar.ventas.push(VPN);
    r = await call('PATCH', `/ventas/${VPN}/estado`, { EstadoID: 12 }, adm);
    si('cancelar un pedido sin pagar no genera reembolso', r.s === 200 && r.j.reembolsoPendiente === false, JSON.stringify(r.j).slice(0, 120));

    console.log('--- contra entrega: plazo y aviso');
    const contra = async () => (await call('POST', '/ventas', pedido({ metodoPago: 'contraentrega', comprobanteTransferencia: undefined, nombreReceptor: 'A', telefonoEntrega: '3000000000', direccionEntrega: 'Calle 1' }), cli)).j?.venta?.VentaID;
    const CEV = await contra(); const CEA = await contra(); const CEN = await contra();
    limpiar.ventas.push(CEV, CEA, CEN);
    await db.Venta.update({ FechaVenta: new Date(Date.now() - 8 * 864e5) }, { where: { VentaID: CEV } });      // pasó el plazo de 7 días
    await db.Venta.update({ FechaVenta: new Date(Date.now() - 6.5 * 864e5) }, { where: { VentaID: CEA } });    // a menos de 24 h de vencer
    const baseCE = await stock();
    r = await call('POST', '/resumen/mantenimiento', {}, adm);
    si('el contra entrega de más de 7 días se canceló solo', (await est(CEV)) === 12, JSON.stringify(r.j));
    si('y devolvió su stock', (await stock()) === baseCE + 1, `${baseCE} -> ${await stock()}`);
    si('el cliente recibe el aviso de la cancelación por entrega', !!(await hay(cli, new RegExp(`Cancelamos tu pedido #${CEV}`))));
    si('el contra entrega a punto de vencer avisa y sigue Pendiente', !!(await hay(cli, new RegExp(`pedido #${CEA} se cancelará`))) && (await est(CEA)) === 8);
    si('el contra entrega reciente no se toca ni se avisa', (await est(CEN)) === 8 && !(await hay(cli, new RegExp(`pedido #${CEN} se cancelará`))));

    console.log('--- limpieza');
    for (const id of limpiar.ventas.filter(Boolean)) { await call('PATCH', `/ventas/${id}/estado`, { EstadoID: 12 }, adm); await call('DELETE', `/ventas/${id}`, undefined, adm); }
    for (const id of limpiar.cots.filter(Boolean)) { await call('PUT', `/cotizaciones/${id}/cancelar`, undefined, adm); await call('DELETE', `/cotizaciones/${id}`, undefined, adm); }
    await db.Notificacion.destroy({ where: { DocumentoID: 1888888881 } });
    await call('DELETE', '/usuarios/1888888881', undefined, adm);
    await call('POST', '/notificaciones/archivar-todas', {}, cli);
    const despues = await stock();
    // (cancelar un pedido ya pagado/en producción no devuelve stock por regla del negocio: se restaura a mano)
    if (despues !== stock0) await call('PUT', '/inventarioproducto/1', { Stock: stock0, TelaID: 1, Estado: true }, adm);
    await db.sequelize.close();
    console.log(bad ? '\n' + bad + ' FALLOS' : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
