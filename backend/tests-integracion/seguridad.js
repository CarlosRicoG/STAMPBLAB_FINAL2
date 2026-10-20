/**
 * Seguridad: que puede hacer un visitante, un cliente y un administrador
 * Requisitos: backend corriendo (API_URL, por defecto http://127.0.0.1:3000/api) y base con los datos
 * de demostracion:  npm run db:reset  &&  node scripts/seed-demo-flujo.js
 * Cuentas: admin@stamplab.com / Admin123*  y  cliente@stamplab.com / Cliente123* (ver README).
 * La prueba de fuerza bruta BLOQUEA tu IP 15 minutos: solo corre con --fuerza-bruta.
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const exp = (n, r, ...ok) => {
    const pass = ok.includes(r.s);
    if (!pass) bad++;
    console.log((pass ? 'OK   ' : 'FALLA') + ' ' + n.padEnd(58) + ' -> ' + r.s + (pass ? '' : '  (esperado ' + ok.join('/') + ')'));
};
const si = (n, cond) => { if (!cond) bad++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + n); };

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const CLI = 1000000002, ADM = 1000000001;

    // La prueba crea sus PROPIOS datos del cliente (no depende de los datos de demostracion) y los borra al final
    const vProp = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 25000, InventarioID: 1 }] }, cli);
    const VPROP = vProp.j?.venta?.VentaID;
    const cProp = await call('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 1, TraePrenda: false, tecnicas: [] }] }, cli);
    const CPROP = cProp.j?.venta?.VentaID ?? cProp.j?.cotizacion?.CotizacionID ?? cProp.j?.CotizacionID;

    console.log('--- ANONIMO');
    for (const p of ['/productos', '/colores', '/tallas', '/insumos', '/tecnicas', '/partes', '/estados', '/inventarioproducto/producto/1'])
        exp('GET ' + p + ' (catalogo publico)', await call('GET', p), 200);
    for (const p of ['/ventas', '/ventas/1', '/cotizaciones', '/cotizaciones/1', '/compras', '/proveedores', '/usuarios', '/roles', '/permisos', '/detalleventas', '/ventas/dashboard'])
        exp('GET ' + p + ' (privado)', await call('GET', p), 401, 403);
    for (const [m, p, b] of [['POST', '/productos', { Nombre: 'x', PrecioBase: 1 }], ['PUT', '/productos/1', { Nombre: 'x' }], ['DELETE', '/productos/1'], ['POST', '/colores', { Nombre: 'ZZ' }], ['POST', '/compras', {}], ['POST', '/ventas', { DocumentoID: '1', detalles: [] }], ['POST', '/cotizaciones/inteligente', {}], ['POST', '/usuarios', {}], ['PATCH', '/ventas/1/estado', { EstadoID: 12 }], ['DELETE', '/ventas/1']])
        exp(m + ' ' + p + ' (escritura)', await call(m, p, b), 401, 403);

    console.log('--- CLIENTE');
    exp('GET /productos', await call('GET', '/productos', null, cli), 200);
    const mine = await call('GET', '/ventas?limit=50&page=1', null, cli);
    exp('GET /ventas (solo las suyas)', mine, 200);
    si('ventas ajenas en la lista = 0', (mine.j.datos || []).every(v => String(v.DocumentoID) === String(CLI)));
    const otro = await call('GET', '/ventas?documentoID=' + ADM + '&limit=50&page=1', null, cli);
    si('pedir ventas de otro usuario devuelve solo las suyas', (otro.j.datos || []).every(v => String(v.DocumentoID) === String(CLI)));
    exp('GET /ventas/:id (suya)', await call('GET', '/ventas/' + VPROP, null, cli), 200);
    exp('GET /ventas/999 (no existe)', await call('GET', '/ventas/999', null, cli), 404);
    exp('GET /cotizaciones (todas) bloqueado', await call('GET', '/cotizaciones', null, cli), 403);
    exp('GET /cotizaciones/usuario/propio', await call('GET', '/cotizaciones/usuario/' + CLI, null, cli), 200);
    exp('GET /cotizaciones/usuario/ajeno bloqueado', await call('GET', '/cotizaciones/usuario/' + ADM, null, cli), 403);
    if (CPROP) exp('GET /cotizaciones/:id (suya)', await call('GET', '/cotizaciones/' + CPROP, null, cli), 200);
    for (const [m, p, b] of [['GET', '/compras'], ['GET', '/proveedores'], ['GET', '/usuarios'], ['GET', '/roles'], ['POST', '/productos', { Nombre: 'x', PrecioBase: 1 }], ['DELETE', '/productos/1'], ['PUT', '/ventas/1', { EstadoID: 12 }], ['PATCH', '/ventas/1/estado', { EstadoID: 12 }], ['DELETE', '/ventas/1'], ['PUT', '/cotizaciones/1', { EstadoID: 2 }], ['POST', '/cotizaciones/1/convertir-a-venta'], ['GET', '/ventas/dashboard'], ['POST', '/usuarios', { DocumentoID: '1', Nombre: 'x', Correo: 'x@x.com', 'Contraseña': 'x', RolID: 1 }], ['DELETE', '/usuarios/' + ADM]])
        exp(m + ' ' + p + ' (solo admin)', await call(m, p, b, cli), 403);
    exp('GET /usuarios/propio', await call('GET', '/usuarios/' + CLI, null, cli), 200);
    exp('GET /usuarios/otro bloqueado', await call('GET', '/usuarios/' + ADM, null, cli), 403);
    exp('PUT perfil propio (intentando RolID:1)', await call('PUT', '/usuarios/' + CLI, { Nombre: 'Cliente Demo', Telefono: '3011112222', Direccion: 'Calle 1 # 2-3', RolID: 1 }, cli), 200);
    const post = await call('GET', '/usuarios/' + CLI, null, adm);
    const rolDespues = Number(post.j?.RolID ?? post.j?.datos?.RolID ?? post.j?.usuario?.RolID);
    si('intento de subirse a admin NO funciona (rol sigue ' + rolDespues + ')', rolDespues === 2);
    exp('PUT perfil ajeno bloqueado', await call('PUT', '/usuarios/' + ADM, { Nombre: 'hack' }, cli), 403);

    const v = await call('POST', '/ventas', { DocumentoID: String(ADM), Subtotal: 99999, Total: 99999, EstadoID: 9, detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 99999 }] }, cli);
    exp('POST /ventas como cliente', v, 201);
    const vid = v.j?.venta?.VentaID;
    const chk = await call('GET', '/ventas/' + vid, null, adm);
    si('venta del cliente queda a su nombre (' + chk.j.DocumentoID + ') y Pendiente (' + chk.j.EstadoID + ')', chk.j.DocumentoID == CLI && chk.j.EstadoID == 8);
    await call('DELETE', '/ventas/' + vid, null, adm);

    console.log('--- REGISTRO PUBLICO');
    const reg = await call('POST', '/registro', { DocumentoID: '888000999', Nombre: 'ZZ Intruso', Correo: 'zz_intruso@x.com', 'Contraseña': 'Intruso123*', Telefono: '3000000000', RolID: 1 });
    exp('POST /registro con RolID:1', reg, 201);
    si('rol asignado = ' + reg.j.usuario?.RolID + ' (debe ser 2, cliente)', reg.j.usuario?.RolID === 2);
    await call('DELETE', '/usuarios/888000999', null, adm);

    console.log('--- ADMIN');
    for (const p of ['/ventas?limit=5&page=1', '/ventas/' + VPROP, '/cotizaciones', '/compras', '/proveedores', '/usuarios', '/roles', '/ventas/dashboard', '/permisos'])
        exp('GET ' + p, await call('GET', p, null, adm), 200);
    const c = await call('POST', '/colores', { Nombre: 'ZZ Color' }, adm);
    exp('POST /colores', c, 200, 201);
    const id = c.j?.color?.ColorID ?? c.j?.datos?.ColorID ?? c.j?.ColorID;
    if (id) exp('DELETE /colores', await call('DELETE', '/colores/' + id, null, adm), 200);

    console.log('--- LIMITE DE INTENTOS NO AFECTA A QUIEN INICIA SESION BIEN');
    let seguidos = 0;
    for (let i = 0; i < 25; i++) { const r = await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' }); if (r.s === 200) seguidos++; }
    si('25 inicios de sesion correctos seguidos nunca se bloquean (' + seguidos + '/25)', seguidos === 25);

    console.log('--- TOKENS');
    exp('token basura', await call('GET', '/ventas', null, 'abc.def.ghi'), 401);

    if (process.argv.includes('--fuerza-bruta')) {
        console.log('--- FUERZA BRUTA');
        let bloqueado = false;
        for (let i = 0; i < 25; i++) { const r = await call('POST', '/login', { Correo: 'noexiste@x.com', 'Contraseña': 'mal' }); if (r.s === 429) { bloqueado = true; console.log('      bloqueado en el intento', i + 1); break; } }
        si('limite de intentos fallidos de login (429)', bloqueado);
    }
    // limpieza de los datos de prueba
    if (VPROP) await call('DELETE', '/ventas/' + VPROP, null, adm);
    if (CPROP) await call('DELETE', '/cotizaciones/' + CPROP, null, adm);
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch(e => console.log('EXC', e));
