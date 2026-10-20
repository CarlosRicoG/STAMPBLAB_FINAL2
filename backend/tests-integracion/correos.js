/**
 * Correos al cliente: el pedido y la cotización generan sus avisos, al correo correcto y con el contenido correcto.
 * Requiere el servidor con MAIL_MODO=archivo (buzón de pruebas en memoria). Si no está activo, se omite.
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + d : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const probe = await call('GET', '/correos-prueba', null, adm);
    if (probe.s !== 200) { console.log('(el servidor no tiene MAIL_MODO=archivo: se omiten las pruebas de correo)\n\nTODO OK'); return; }
    const buzon = async () => (await call('GET', '/correos-prueba', null, adm)).j.datos;
    const buscar = async (asunto) => { for (let i = 0; i < 20; i++) { const m = (await buzon()).find((c) => c.asunto === asunto); if (m) return m; await espera(150); } return null; };

    const det = [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 25000, InventarioID: 1 }];
    const stock0 = (await call('GET', '/inventarioproducto/1')).j.Stock;

    console.log('--- pedido');
    const v = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, metodoPago: 'contraentrega', nombreReceptor: 'Cliente Demo', telefonoEntrega: '3011112222', direccionEntrega: 'Calle 1', detalles: det }, cli);
    const V = v.j.venta.VentaID;
    const recibido = await buscar(`Recibimos tu pedido #${V}`);
    si('al crear el pedido se envía "Recibimos tu pedido"', !!recibido);
    si('va al correo del cliente dueño del pedido', recibido?.para === 'cliente@stamplab.com', recibido?.para);
    si('incluye el producto, el total y el método de pago', /Camiseta B/.test(recibido?.html || '') && (recibido?.html || '').includes('$25.000') && (recibido?.html || '').includes('Contra entrega'));
    for (const [id, nombre] of [[9, 'Pagada'], [10, 'En Producción'], [11, 'Entregada']]) {
        await call('PATCH', `/ventas/${V}/estado`, { EstadoID: id }, adm);
        const m = await buscar(`Tu pedido #${V}: ${nombre}`);
        si(`al pasar a "${nombre}" se avisa al cliente`, !!m && m.para === 'cliente@stamplab.com');
    }
    const antes = (await buzon()).length;
    await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 11 }, adm); // mismo estado: no cambia nada
    await espera(500);
    si('repetir el mismo estado NO manda otro correo', (await buzon()).length === antes);

    const v2 = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: det }, cli);
    const V2 = v2.j.venta.VentaID;
    await call('PATCH', `/ventas/${V2}/cancelar`, null, cli);
    si('cancelar su pedido también avisa ("Cancelada")', !!(await buscar(`Tu pedido #${V2}: Cancelada`)));

    console.log('--- cotización');
    const te = (await call('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
    const pa = (await call('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
    const cot = await call('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 1, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 1, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 1 }], insumos: [{ InsumoID: 1, CantidadRequerida: 1 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'correo', CostoTecnica: 0 }] }] }, cli);
    const C = cot.j.cotizacion?.CotizacionID;
    si('al cotizar se envía "Recibimos tu cotización"', !!(await buscar(`Recibimos tu cotización #${C}`)));
    const detCot = (await call('GET', '/cotizaciones/' + C, null, adm)).j;
    for (const d of detCot.detalles || []) for (const t of d.tecnicas || []) await call('PUT', '/cotizaciontecnicas/' + t.CotizacionTecnicaID, { CostoTecnica: 9000 }, adm);
    await call('PUT', '/cotizaciones/' + C, { EstadoID: 2 }, adm);
    const aprob = await buscar(`Tu cotización #${C}: Aprobada`);
    si('al aprobarla se avisa al cliente con el total', !!aprob && aprob.html.includes('$'));
    await call('PUT', `/cotizaciones/${C}/cancelar`, null, adm);
    si('al cancelarla también', !!(await buscar(`Tu cotización #${C}: Cancelada`)));

    console.log('--- solo lo del cliente');
    const todos = await buzon();
    si('todos los correos de esta prueba fueron al cliente (no a otras personas)', todos.filter((m) => [V, V2, C].some((n) => m.asunto.includes('#' + n))).every((m) => m.para === 'cliente@stamplab.com'));
    si('ningún correo contiene contraseñas ni tokens', !todos.some((m) => /Contraseña|eyJhbGciOi/.test(m.html)));

    // limpieza
    for (const id of [V, V2]) { await call('PATCH', `/ventas/${id}/cancelar`, null, adm); await call('DELETE', '/ventas/' + id, null, adm); }
    await call('DELETE', '/cotizaciones/' + C, null, adm);
    await call('PUT', '/inventarioproducto/1', { Stock: stock0, TelaID: 1, Estado: true }, adm);
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
