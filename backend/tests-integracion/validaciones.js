/**
 * Validacion de entrada en el servidor (cantidades, correo, contraseña, documento)
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
const exp = (n, r, ...ok) => { const pass = ok.includes(r.s); if (!pass) bad++; console.log((pass ? 'OK   ' : 'FALLA') + ' ' + n.padEnd(62) + ' -> ' + r.s + (r.s === 400 ? '  "' + String(r.j?.mensaje).slice(0, 70) + '"' : '') + (pass ? '' : '  (esperado ' + ok.join('/') + ')')); };

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const stockDB = async () => (await call('GET', '/inventarioproducto/1')).j;
    const det = (o = {}) => [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 25000, InventarioID: 1, ...o }];

    console.log('--- VENTAS');
    exp('cantidad negativa (-50)', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: det({ Cantidad: -50 }) }, cli), 400);
    exp('cantidad 0', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: det({ Cantidad: 0 }) }, cli), 400);
    exp('cantidad decimal (1.5)', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: det({ Cantidad: 1.5 }) }, cli), 400);
    exp('cantidad absurda (10 millones)', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: det({ Cantidad: 10000000 }) }, cli), 400);
    exp('precio unitario negativo', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: det({ PrecioUnitario: -5 }) }, cli), 400);
    exp('total negativo', await call('POST', '/ventas', { Subtotal: -1, Total: -1, detalles: det() }, cli), 400);
    exp('sin productos', await call('POST', '/ventas', { Subtotal: 1, Total: 1, detalles: [] }, cli), 400);
    exp('metodo de pago invalido', await call('POST', '/ventas', { Subtotal: 1, Total: 1, metodoPago: 'bitcoin', detalles: det() }, cli), 400);
    const ok = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: det() }, cli);
    exp('venta valida', ok, 201);
    if (ok.j?.venta) {
        exp('editar venta con cantidad negativa', await call('PUT', '/ventas/' + ok.j.venta.VentaID, { EstadoID: 8, Subtotal: 1, Total: 1, detalles: det({ Cantidad: -3 }) }, adm), 400);
        exp('cambio de estado (sin detalles) sigue funcionando', await call('PUT', '/ventas/' + ok.j.venta.VentaID, { EstadoID: 8 }, adm), 200);
        await call('DELETE', '/ventas/' + ok.j.venta.VentaID, null, adm);
    }

    console.log('--- COTIZACIONES');
    exp('cotizacion con cantidad negativa', await call('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: -2, tecnicas: [] }] }, cli), 400);
    exp('cotizacion sin productos', await call('POST', '/cotizaciones/inteligente', { detalles: [] }, cli), 400);

    console.log('--- REGISTRO / LOGIN');
    const base = { DocumentoID: '555000123', Nombre: 'ZZ Validacion', Correo: 'zz_val@x.com', Telefono: '3001234567', 'Contraseña': 'Valida123*' };
    exp('registro: correo invalido', await call('POST', '/registro', { ...base, Correo: 'no-es-correo' }), 400);
    exp('registro: contraseña corta', await call('POST', '/registro', { ...base, 'Contraseña': 'a1' }), 400);
    exp('registro: contraseña sin numeros', await call('POST', '/registro', { ...base, 'Contraseña': 'soloLetrasLargas' }), 400);
    exp('registro: documento con letras', await call('POST', '/registro', { ...base, DocumentoID: 'abc123' }), 400);
    exp('registro: telefono con letras', await call('POST', '/registro', { ...base, Telefono: 'llamame' }), 400);
    exp('registro: sin nombre', await call('POST', '/registro', { ...base, Nombre: '' }), 400);
    const reg = await call('POST', '/registro', base);
    exp('registro valido', reg, 201);
    exp('login valido del nuevo usuario', await call('POST', '/login', { Correo: base.Correo, 'Contraseña': base.Contraseña }), 200);
    exp('login con correo mal formado', await call('POST', '/login', { Correo: 'xx', 'Contraseña': 'a' }), 400);
    exp('login contraseña incorrecta (no cambia: 401)', await call('POST', '/login', { Correo: base.Correo, 'Contraseña': 'Incorrecta1' }), 401);
    await call('DELETE', '/usuarios/555000123', null, adm);

    console.log('--- MENSAJES DE ERROR NORMALIZADOS');
    const e1 = await call('GET', '/ventas');
    si = (n, c) => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n); };
    si('403 trae "mensaje"', typeof e1.j?.mensaje === 'string');
    const e2 = await call('POST', '/compras', { ProveedorRefId: 1, detalles: [] }, adm);
    si('compras 400 trae "message" y "mensaje"', typeof e2.j?.message === 'string' && typeof e2.j?.mensaje === 'string');
    const e3 = await call('GET', '/productos/99999');
    si('404 trae "message" y "mensaje"', typeof e3.j?.message === 'string' && typeof e3.j?.mensaje === 'string');

    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch(e => console.log('EXC', e));
