/**
 * Cancelar pedido propio: reglas y devolucion de stock
 * Requisitos: backend corriendo (API_URL, por defecto http://127.0.0.1:3000/api) y base con los datos
 * de demostracion:  npm run db:reset  &&  node scripts/seed-demo-flujo.js
 * Cuentas: admin@stamplab.com / Admin123*  y  cliente@stamplab.com / Cliente123* (ver README).
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const eq = (n, a, b) => { const ok = a === b; if (!ok) bad++; console.log((ok ? 'OK   ' : 'FALLA') + ' ' + n + ': ' + a + (ok ? '' : ' (esperado ' + b + ')')); };
(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const stock = async () => (await call('GET', '/inventarioproducto/1')).j.Stock ?? (await call('GET', '/inventarioproducto/1')).j.datos?.Stock;
    const det = [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 2, PrecioUnitario: 25000, InventarioID: 1 }];

    const s0 = await stock();
    const v = await call('POST', '/ventas', { Subtotal: 50000, Total: 50000, detalles: det }, cli);
    const V = v.j.venta.VentaID;
    eq('stock tras pedido de 2', await stock(), s0 - 2);

    // otro cliente (temporal): el pedido ajeno no puede ser del administrador
    await call('POST', '/usuarios', { DocumentoID: 1666666666, Nombre: 'Otro Cliente Temporal', Correo: 'otro.temporal@stamplab.com', Telefono: '3000000000', 'Contraseña': 'Temporal123*', RolID: 2 }, adm);
    const vAdm = await call('POST', '/ventas', { DocumentoID: '1666666666', Subtotal: 25000, Total: 25000, EstadoID: 8, detalles: [det[0]].map(d => ({ ...d, Cantidad: 1 })) }, adm);
    const VA = vAdm.j.venta.VentaID;
    eq('cliente NO puede cancelar pedido ajeno', (await call('PATCH', '/ventas/' + VA + '/cancelar', null, cli)).s, 403);
    eq('sin sesion no puede cancelar', (await call('PATCH', '/ventas/' + V + '/cancelar')).s, 403);

    const ok = await call('PATCH', '/ventas/' + V + '/cancelar', null, cli);
    eq('cliente cancela su pedido pendiente', ok.s, 200);
    eq('stock devuelto', await stock(), s0 - 1); // queda el de 1 del admin
    const chk = await call('GET', '/ventas/' + V, null, cli);
    eq('estado queda Cancelada (12)', chk.j.EstadoID, 12);
    eq('cancelar de nuevo no vuelve a devolver stock', (await call('PATCH', '/ventas/' + V + '/cancelar', null, cli)).s >= 400 || (await stock()) === s0 - 1, true);

    // pedido ya pagado: el cliente no puede
    const v2 = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: [{ ...det[0], Cantidad: 1 }] }, cli);
    const V2 = v2.j.venta.VentaID;
    await call('PATCH', '/ventas/' + V2 + '/estado', { EstadoID: 9 }, adm);
    const no = await call('PATCH', '/ventas/' + V2 + '/cancelar', null, cli);
    eq('cliente NO puede cancelar un pedido ya pagado (400)', no.s, 400);
    console.log('      mensaje:', no.j.message);
    eq('el admin si puede cancelarlo', (await call('PATCH', '/ventas/' + V2 + '/cancelar', null, adm)).s, 200);

    // limpieza
    for (const id of [V, V2, VA]) { await call('PATCH', '/ventas/' + id + '/estado', { EstadoID: 12 }, adm); await call('DELETE', '/ventas/' + id, null, adm); }
    await call('DELETE', '/usuarios/1666666666', null, adm);
    await call('PUT', '/inventarioproducto/1', { Stock: s0, TelaID: 1, Estado: true }, adm);
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch(e => console.log('EXC', e));
