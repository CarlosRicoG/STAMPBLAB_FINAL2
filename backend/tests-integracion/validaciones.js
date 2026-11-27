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
    const base = { DocumentoID: '555000123', Nombre: 'ZZ Validacion', Correo: 'zz_val@x.com', Telefono: '3001234567', 'Contraseña': 'Valida123*', AceptaPrivacidad: true, VersionPolitica: 'pruebas-integracion' };
    // Habeas data (Ley 1581 de 2012): sin la autorización expresa no hay registro
    exp('registro: sin aceptar la política de datos', await call('POST', '/registro', { ...base, AceptaPrivacidad: false }), 400);
    exp('registro: sin la casilla de la política', await call('POST', '/registro', { ...base, AceptaPrivacidad: undefined }), 400);
    exp('registro: sin la versión de la política', await call('POST', '/registro', { ...base, VersionPolitica: undefined }), 400);
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

    console.log('--- DERECHOS DEL TITULAR (Ley 1581)');
    const tNuevo = (await call('POST', '/login', { Correo: base.Correo, 'Contraseña': base.Contraseña })).j?.token;
    const misDatos = await call('GET', '/mi-cuenta/datos', undefined, tNuevo);
    exp('descargar mis datos', misDatos, 200);
    const datosOk = misDatos.j?.perfil?.Correo === base.Correo && misDatos.j?.perfil?.Contraseña === undefined
        && misDatos.j?.autorizacionPrivacidad?.version === base.VersionPolitica && Boolean(misDatos.j?.autorizacionPrivacidad?.aceptadaEn);
    exp('la descarga trae perfil y prueba de la autorización, sin contraseña', { s: datosOk ? 200 : 500 }, 200);
    exp('descargar mis datos sin sesión', await call('GET', '/mi-cuenta/datos'), 401, 403);
    // Un pedido en curso impide suprimir; cancelado, ya no
    const pedidoTitular = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: det() }, tNuevo);
    exp('el titular hace un pedido', pedidoTitular, 201);
    const idPedido = pedidoTitular.j?.venta?.VentaID;
    exp('suprimir con un pedido en curso: 409', await call('POST', '/mi-cuenta/suprimir', { 'Contraseña': base.Contraseña }, tNuevo), 409);
    if (idPedido) exp('el titular cancela su pedido', await call('PATCH', '/ventas/' + idPedido + '/cancelar', {}, tNuevo), 200);
    // Pago por verificar: pedido por transferencia con comprobante, cancelado antes de que el equipo lo revisara
    const PNG = 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]).toString('base64');
    const pedidoPago = await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, metodoPago: 'transferencia', comprobanteTransferencia: PNG, detalles: det() }, tNuevo);
    exp('el titular hace un pedido por transferencia (el comprobante va con el pedido)', pedidoPago, 201);
    const idPago = pedidoPago.j?.venta?.VentaID;
    if (idPago) {
        const cancelado = await call('PATCH', '/ventas/' + idPago + '/cancelar', {}, tNuevo);
        exp('lo cancela con el comprobante sin revisar (pago por verificar)', { s: cancelado.s === 200 && cancelado.j?.pagoPorVerificar ? 200 : 500 }, 200);
        const bloqueo = await call('POST', '/mi-cuenta/suprimir', { 'Contraseña': base.Contraseña }, tNuevo);
        exp('suprimir con un pago por verificar: 409', { s: bloqueo.s === 409 && /pago por verificar/.test(bloqueo.j?.mensaje || '') ? 409 : bloqueo.s }, 409);
        exp('el cliente no puede cerrar su propio pago por verificar', await call('PATCH', '/ventas/' + idPago + '/rechazar-comprobante', { motivo: 'No hubo pago' }, tNuevo), 403);
        exp('el admin registra que no hubo pago (motivo)', await call('PATCH', '/ventas/' + idPago + '/rechazar-comprobante', { motivo: 'No llegó ningún pago a la cuenta' }, adm), 200);
        exp('ya cerrado: no se puede marcar como reembolsado', await call('PATCH', '/ventas/' + idPago + '/reembolsado', {}, adm), 400);
    }
    exp('suprimir con contraseña incorrecta', await call('POST', '/mi-cuenta/suprimir', { 'Contraseña': 'Incorrecta1' }, tNuevo), 403);
    exp('suprimir mi cuenta', await call('POST', '/mi-cuenta/suprimir', { 'Contraseña': base.Contraseña }, tNuevo), 200);
    exp('la sesión de la cuenta suprimida ya no vale', await call('GET', '/mi-cuenta/datos', undefined, tNuevo), 401);
    exp('la sesión de la cuenta suprimida no crea pedidos', await call('POST', '/ventas', { Subtotal: 25000, Total: 25000, detalles: det() }, tNuevo), 401, 403);
    exp('la cuenta suprimida no inicia sesión', await call('POST', '/login', { Correo: base.Correo, 'Contraseña': base.Contraseña }), 401);
    if (idPedido) {
        const vistaAdmin = await call('GET', '/ventas/' + idPedido, undefined, adm);
        exp('el admin conserva el pedido (cifras) sin datos de contacto', { s: vistaAdmin.s === 200 && vistaAdmin.j?.ContactoNombre === 'Titular suprimido' && !vistaAdmin.j?.ContactoTelefono ? 200 : 500 }, 200);
    }
    exp('el titular puede volver a registrarse con su documento', await call('POST', '/registro', base), 201);
    exp('un segundo registro con el mismo documento ya no reutiliza la fila', await call('POST', '/registro', { ...base, Correo: 'zz_val2@x.com' }), 400, 409);
    const tOtra = (await call('POST', '/login', { Correo: base.Correo, 'Contraseña': base.Contraseña })).j?.token;
    if (idPedido) {
        const lista = await call('GET', '/ventas?page=1&limit=50', undefined, tOtra);
        exp('el nuevo titular NO ve en su lista los pedidos del suprimido', { s: lista.s === 200 && !(lista.j?.datos || []).some((v) => v.VentaID === idPedido) ? 200 : 500 }, 200);
        exp('el nuevo titular NO abre el pedido del suprimido', await call('GET', '/ventas/' + idPedido, undefined, tOtra), 404);
        exp('ni su factura', await call('GET', '/ventas/' + idPedido + '/factura', undefined, tOtra), 404);
        exp('ni su línea de tiempo', await call('GET', '/ventas/' + idPedido + '/historial', undefined, tOtra), 404);
        const exportado = await call('GET', '/mi-cuenta/datos', undefined, tOtra);
        exp('ni aparece en "descargar mis datos"', { s: exportado.s === 200 && !(exportado.j?.pedidos || []).some((v) => v.VentaID === idPedido) ? 200 : 500 }, 200);
        exp('el admin sigue viendo el pedido', await call('GET', '/ventas/' + idPedido, undefined, adm), 200);
        await call('DELETE', '/ventas/' + idPedido, null, adm);
    }
    if (idPago) await call('DELETE', '/ventas/' + idPago, null, adm);
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
