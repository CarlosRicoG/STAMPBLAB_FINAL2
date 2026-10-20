/**
 * Pruebas "a propósito para dañarlo": entradas maliciosas o absurdas desde el cliente y el administrador.
 * Regla: el servidor nunca debe responder 5xx, ni aceptar precios/estados/datos ajenos, ni dejar el stock descuadrado.
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t, extra = {}) => {
    const r = await fetch(U + p, { method: m, headers: { ...(extra.raw ? {} : { 'Content-Type': 'application/json' }), ...(t ? { Authorization: 'Bearer ' + t } : {}), ...(extra.headers || {}) }, body: b === undefined ? undefined : (extra.raw ? b : JSON.stringify(b)) });
    const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = txt; }
    return { s: r.status, j };
};
let bad = 0;
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + String(d).slice(0, 200) : '')); };
const sin5xx = (n, r) => si(n + ' (sin error 500)', r.s < 500, `${r.s} ${JSON.stringify(r.j).slice(0, 150)}`);
const rechazado = (r) => r.s >= 400 && r.s < 500;

(async () => {
    const login = async (c, p) => (await call('POST', '/login', { Correo: c, 'Contraseña': p })).j.token;
    const adm = await login('admin@stamplab.com', 'Admin123*');
    const cli = await login('cliente@stamplab.com', 'Cliente123*');
    const stock = async () => (await call('GET', '/inventarioproducto/1')).j.Stock;
    const stock0 = await stock();
    const creadas = [];
    const linea = (o = {}) => ({ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 99999, ...o });
    const pedido = (o = {}) => ({ Subtotal: 99999, Total: 99999, detalles: [linea()], ...o });

    console.log('--- CLIENTE: pedidos con datos manipulados');
    let r = await call('POST', '/ventas', pedido({ detalles: [linea({ PrecioUnitario: 1 })], Subtotal: 1, Total: 1 }), cli);
    si('comprar con precio $1 se rechaza', rechazado(r), `${r.s}`);
    if (r.s === 201) creadas.push(r.j.venta.VentaID);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ PrecioUnitario: -500 })] }), cli);
    si('precio negativo se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ PrecioUnitario: 'gratis' })] }), cli);
    si('precio con texto se rechaza', rechazado(r), r.s);
    for (const cant of [0, -3, 1.5, 'abc', 1e9, null]) {
        r = await call('POST', '/ventas', pedido({ detalles: [linea({ Cantidad: cant })] }), cli);
        si(`cantidad ${JSON.stringify(cant)} se rechaza`, rechazado(r), r.s);
        if (r.s === 201) creadas.push(r.j.venta.VentaID);
    }
    r = await call('POST', '/ventas', pedido({ detalles: [] }), cli); si('pedido sin productos se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', { Subtotal: 1, Total: 1 }, cli); si('pedido sin detalles se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ ProductoID: 999999 })] }), cli); si('producto inexistente se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ ColorID: 999999 })] }), cli); si('color inexistente se rechaza', rechazado(r), r.s); sin5xx('color inexistente', r);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ TallaID: 999999 })] }), cli); si('talla inexistente se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', pedido({ detalles: 'x' }), cli); sin5xx('detalles como texto', r);
    r = await call('POST', '/ventas', pedido({ detalles: [null] }), cli); sin5xx('línea nula', r);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ ProductoID: { $gt: 0 } })] }), cli); si('ProductoID como objeto (inyección NoSQL) se rechaza', rechazado(r), r.s);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ ProductoID: "1 OR 1=1" })] }), cli); si('ProductoID con SQL se rechaza', rechazado(r), r.s);

    console.log('--- CLIENTE: no puede ponerse estado, dueño ni pagar por otro');
    r = await call('POST', '/ventas', { ...pedido(), DocumentoID: 1000000001, EstadoID: 11, metodoPago: 'contraentrega', nombreReceptor: 'A', telefonoEntrega: '3000000000', direccionEntrega: 'Calle 1' }, cli);
    si('crea el pedido pero lo fuerza a Pendiente y a su nombre', r.s === 201 && r.j.venta.EstadoID === 8 && String(r.j.venta.DocumentoID) === '1000000002', JSON.stringify(r.j).slice(0, 150));
    const V = r.j?.venta?.VentaID; if (V) creadas.push(V);
    si('el total lo calcula el servidor (no el que mandó el cliente)', r.s === 201 && Number(r.j.venta.Total) === 99999);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 9 }, cli); si('el cliente no puede marcar su pedido como Pagada', r.s === 403, r.s);
    r = await call('PUT', `/ventas/${V}`, { EstadoID: 11, Total: 1 }, cli); si('el cliente no puede editar su venta', r.s === 403, r.s);
    r = await call('DELETE', `/ventas/${V}`, undefined, cli); si('el cliente no puede borrar ventas', r.s === 403, r.s);
    // Otro cliente (temporal) con su propio pedido: el cliente de la prueba no debe poder tocarlo
    const OTRO = 1987654321;
    await call('POST', '/registro', { Nombre: 'Otro Cliente', Correo: 'otro.cliente@stamplab.com', 'Contraseña': 'Otro12345*', DocumentoID: OTRO, Telefono: '3001234567' });
    const otroTok = await login('otro.cliente@stamplab.com', 'Otro12345*');
    const ajena = await call('POST', '/ventas', pedido(), otroTok);
    const VA = ajena.j?.venta?.VentaID;
    si('(preparación) el otro cliente creó su pedido', !!VA, JSON.stringify(ajena.j).slice(0, 120));
    r = await call('GET', '/ventas/' + VA, undefined, cli); si('el cliente no ve el pedido de otro', r.s === 403, r.s);
    r = await call('GET', '/ventas', undefined, cli);
    si('SIN filtro, el cliente solo ve SUS ventas (nunca las de otros)', r.s === 200 && (r.j.datos || []).length > 0 && r.j.datos.every((v) => String(v.DocumentoID) === '1000000002'), JSON.stringify([...new Set((r.j.datos||[]).map((v) => v.DocumentoID))]));
    r = await call('GET', '/ventas?documentoID=' + OTRO, undefined, cli);
    si('el filtro documentoID no deja ver ventas de otros', (r.j.datos || r.j).every?.((v) => String(v.DocumentoID) === '1000000002'));
    r = await call('PATCH', `/ventas/${VA}/cancelar`, undefined, cli); si('no puede cancelar el pedido de otro', r.s === 403, r.s);
    r = await call('GET', `/ventas/${VA}/factura`, undefined, cli); si('no descarga el comprobante de otro', r.s === 403, r.s);
    r = await call('GET', '/ventas/' + V + '/factura', undefined, cli); si('su comprobante sí lo ve', r.s === 200);
    const cotAjena = await call('POST', '/cotizaciones/inteligente', { detalles: [{ ProductoID: 1, Cantidad: 1, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 1, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 1 }], insumos: [{ InsumoID: 1, CantidadRequerida: 1 }], tecnicas: [{ TecnicaID: 1, ParteID: 1, Observaciones: 'x' }] }] }, otroTok);
    const CA = cotAjena.j?.cotizacion?.CotizacionID;
    if (CA) { r = await call('GET', '/cotizaciones/' + CA, undefined, cli); si('el cliente no ve la cotización de otro', r.s === 403, r.s); }

    console.log('--- CLIENTE: cotizaciones manipuladas');
    const te = (await call('GET', '/tecnicas')).j; const tecnicaID = (te.datos || te)[0].TecnicaID;
    const pa = (await call('GET', '/partes')).j; const parteID = (pa.datos || pa)[0].ParteID;
    const det = (o = {}) => ({ ProductoID: 1, Cantidad: 1, TraePrenda: false, tallas: [{ TallaID: 1, Cantidad: 1, PrecioTalla: 0 }], colores: [{ ColorID: 1, Cantidad: 1 }], insumos: [{ InsumoID: 1, CantidadRequerida: 1 }], tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, ImagenDiseño: '', Observaciones: 'x', CostoTecnica: 0 }], ...o });
    r = await call('POST', '/cotizaciones/inteligente', { detalles: [det({ tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, Observaciones: 'x', CostoTecnica: 0 }] })] }, cli);
    si('cotización normal funciona', r.s === 201, r.s + JSON.stringify(r.j).slice(0, 120));
    const C = r.j?.cotizacion?.CotizacionID; if (C) {
        const d = (await call('GET', '/cotizaciones/' + C, undefined, adm)).j;
        const tec = d.detalles?.[0]?.tecnicas?.[0];
        si('el costo del diseño lo pone el admin: el cliente no lo fija', Number(tec?.CostoTecnica || 0) === 0, JSON.stringify(tec).slice(0, 100));
    }
    r = await call('POST', '/cotizaciones/inteligente', { detalles: [det({ tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, Observaciones: 'x', CostoTecnica: -99999999 }] })] }, cli);
    sin5xx('costo de técnica negativo', r);
    if (r.s === 201) { const dd = (await call('GET', '/cotizaciones/' + r.j.cotizacion.CotizacionID, undefined, adm)).j; si('costo negativo enviado por el cliente se ignora', Number(dd.detalles?.[0]?.tecnicas?.[0]?.CostoTecnica || 0) >= 0); creadas.push(['c', r.j.cotizacion.CotizacionID]); }
    for (const cant of [0, -1, 'x', 1e9]) { r = await call('POST', '/cotizaciones/inteligente', { detalles: [det({ Cantidad: cant })] }, cli); si(`cotizar cantidad ${JSON.stringify(cant)} se rechaza`, rechazado(r), r.s); if (r.s === 201) creadas.push(['c', r.j.cotizacion?.CotizacionID]); }
    r = await call('POST', '/cotizaciones/inteligente', { detalles: [] }, cli); si('cotización vacía se rechaza', rechazado(r), r.s);
    r = await call('POST', '/cotizaciones/inteligente', {}, cli); si('cotización sin cuerpo se rechaza', rechazado(r), r.s); sin5xx('cotización sin cuerpo', r);
    r = await call('POST', '/cotizaciones/inteligente', { detalles: [det({ tecnicas: [{ TecnicaID: 999999, ParteID: parteID }] })] }, cli); si('técnica inexistente se rechaza', rechazado(r), r.s);
    const xss = '<script>alert(1)</script>"\' OR 1=1;--' + 'A'.repeat(3000);
    r = await call('POST', '/cotizaciones/inteligente', { detalles: [det({ tecnicas: [{ TecnicaID: tecnicaID, ParteID: parteID, Observaciones: xss, CostoTecnica: 0 }] })] }, cli);
    sin5xx('observación enorme con HTML/SQL', r); if (r.s === 201) creadas.push(['c', r.j.cotizacion.CotizacionID]);
    r = await call('POST', '/cotizaciones/inteligente', { DocumentoID: 1000000001, detalles: [det()] }, cli);
    si('el cliente no puede cotizar a nombre de otro', r.s !== 201 || String(r.j.cotizacion?.DocumentoID) === '1000000002', JSON.stringify(r.j).slice(0, 120));
    if (r.s === 201) creadas.push(['c', r.j.cotizacion.CotizacionID]);
    if (C) {
        r = await call('PUT', '/cotizaciones/' + C, { EstadoID: 2 }, cli); si('el cliente no puede aprobar su cotización', r.s === 403, r.s);
        r = await call('POST', `/cotizaciones/${C}/convertir-a-venta`, {}, cli); si('el cliente no puede convertir cotización en venta', [401, 403].includes(r.s), r.s);
        r = await call('PUT', '/cotizaciontecnicas/1', { CostoTecnica: 1 }, cli); si('el cliente no puede ponerle precio a un diseño', r.s === 403, r.s);
        r = await call('GET', '/cotizaciones/9999', undefined, cli); si('cotización inexistente: 404 limpio', r.s === 404 || r.s === 403, r.s);
        creadas.push(['c', C]);
    }

    console.log('--- CLIENTE: archivos y rutas');
    const fd = new FormData(); fd.append('imagen', new Blob(['<?php echo 1; ?>'], { type: 'image/png' }), '../../evil.php');
    r = await fetch(U + '/cotizaciones/upload-diseno', { method: 'POST', body: fd }); const rj = await r.json().catch(() => ({}));
    si('subir un .php disfrazado de imagen se rechaza', r.status >= 400 && r.status < 500, r.status + JSON.stringify(rj).slice(0, 100));
    const fd2 = new FormData(); fd2.append('imagen', new Blob([Buffer.alloc(6 * 1024 * 1024)], { type: 'image/png' }), 'grande.png');
    r = await fetch(U + '/cotizaciones/upload-diseno', { method: 'POST', body: fd2 }); si('archivo de más de 5 MB se rechaza', r.status >= 400 && r.status < 500, r.status);
    r = await fetch(U.replace('/api', '') + '/uploads/../.env'); si('no se puede leer .env por /uploads/../', r.status !== 200 || !(await r.text()).includes('JWT_SECRET'));
    r = await fetch(U.replace('/api', '') + '/uploads/%2e%2e/.env'); si('ni con %2e%2e', r.status !== 200 || !(await r.text()).includes('JWT_SECRET'));
    r = await call('POST', '/ventas', '{"detalles": [', cli, { raw: true, headers: { 'Content-Type': 'application/json' } }); si('JSON roto: 400 y no 500', r.s === 400, r.s);
    r = await call('POST', '/ventas', 'a'.repeat(15 * 1024 * 1024), cli, { raw: true, headers: { 'Content-Type': 'application/json' } }); si('cuerpo de 15 MB se rechaza (413/400)', [400, 413].includes(r.s), r.s);
    r = await call('POST', '/ventas', 'x=1', cli, { raw: true, headers: { 'Content-Type': 'text/plain' } }); sin5xx('cuerpo de texto plano', r);

    console.log('--- CLIENTE: sesión y cuenta');
    for (const t of ['', 'abc', 'Bearer', cli + 'x', cli.split('.').slice(0, 2).join('.') + '.']) {
        r = await call('GET', '/ventas', undefined, t || undefined, { headers: t === 'Bearer' ? { Authorization: 'Bearer ' } : {} });
        si(`token inválido (${t.slice(0, 12) || 'vacío'}) → 401/403`, [401, 403].includes(r.s), r.s);
    }
    const alg = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ id: 1000000001, rol: 1 })).toString('base64url') + '.';
    r = await call('GET', '/usuarios', undefined, alg); si('token alg=none no da acceso de admin', [401, 403].includes(r.s), r.s);
    r = await call('GET', '/usuarios', undefined, cli); si('el cliente no lista usuarios', r.s === 403, r.s);
    r = await call('GET', '/usuarios/1000000001', undefined, cli); si('el cliente no ve el perfil de otro', r.s === 403, r.s);
    r = await call('PUT', '/usuarios/1000000001', { Nombre: 'hack' }, cli); si('el cliente no edita a otro', r.s === 403, r.s);
    r = await call('PUT', '/usuarios/1000000002', { IDRol: 1 }, cli); si('el cliente no se hace administrador', r.s === 403 || r.s === 400 || (await call('GET', '/usuarios', undefined, cli)).s === 403, r.s);
    r = await call('POST', '/registro', { Nombre: 'Hack', Correo: 'hack@x.com', 'Contraseña': 'Abc12345*', DocumentoID: 1234567890, IDRol: 1 });
    if (r.s === 201 || r.s === 200) { const lt = await login('hack@x.com', 'Abc12345*'); si('registrarse mandando IDRol=1 NO da rol de admin', (await call('GET', '/usuarios', undefined, lt)).s === 403); await call('DELETE', '/usuarios/1234567890', undefined, adm); }
    else si('registro con IDRol=1 no crea admin', true);
    for (const c of ["admin@stamplab.com'--", "' OR '1'='1", 'a'.repeat(5000) + '@x.com']) {
        r = await call('POST', '/login', { Correo: c, 'Contraseña': "' OR '1'='1" }); si('login con inyección SQL no entra', [400, 401].includes(r.s), r.s);
    }
    r = await call('POST', '/login', { Correo: { $ne: null }, 'Contraseña': { $ne: null } }); si('login con objetos no entra', [400, 401].includes(r.s), r.s);
    r = await call('POST', '/login', {}); si('login vacío: 400', r.s === 400 || r.s === 401, r.s);
    r = await call('POST', '/registro', { Nombre: '<img src=x onerror=alert(1)>', Correo: 'x@y.com', 'Contraseña': '123', DocumentoID: 'abc' }); si('registro con datos basura se rechaza', rechazado(r), r.s);

    console.log('--- ADMINISTRADOR: abusos y errores humanos');
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 999 }, adm); si('estado inexistente se rechaza', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 3 }, adm); si('estado de cotización en una venta se rechaza', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 'x' }, adm); si('estado con texto se rechaza', r.s === 400, r.s);
    r = await call('PATCH', '/ventas/99999999/estado', { EstadoID: 9 }, adm); si('venta inexistente: 404', r.s === 404, r.s);
    r = await call('PATCH', '/ventas/abc/estado', { EstadoID: 9 }, adm); sin5xx('id de venta con letras', r);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 12 }, adm); si('cancelar devuelve stock', r.s === 200);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 9 }, adm); si('no se reactiva una venta cancelada', r.s === 400, r.s);
    r = await call('PATCH', `/ventas/${V}/estado`, { EstadoID: 12 }, adm); si('cancelar dos veces no devuelve stock doble', r.s === 200 || r.s === 400);
    r = await call('DELETE', '/ventas/99999999', undefined, adm); si('borrar venta inexistente: 404', r.s === 404, r.s);
    r = await call('POST', '/ventas', pedido({ detalles: [linea({ Cantidad: 100000 })] }), adm); si('el admin tampoco puede vender más del stock', rechazado(r), r.s);
    r = await call('POST', '/ventas', { DocumentoID: 99999999999, Subtotal: 1, Total: 1, detalles: [linea()] }, adm); si('venta a un cliente que no existe se rechaza', rechazado(r), r.s); if (r.s === 201) creadas.push(r.j.venta.VentaID);
    r = await call('POST', '/colores', { Nombre: '' }, adm); si('color sin nombre se rechaza', rechazado(r), r.s);
    r = await call('POST', '/colores', { Nombre: 'x'.repeat(500) }, adm); sin5xx('color con nombre de 500 letras', r);
    r = await call('POST', '/tallas', { Nombre: 'XL', Precio: -5 }, adm); si('talla con precio negativo se rechaza', rechazado(r), r.s); if (r.s === 201) await call('DELETE', '/tallas/' + (r.j.TallaID || r.j.talla?.TallaID), undefined, adm);
    r = await call('POST', '/productos', { Nombre: 'Prueba', PrecioBase: -1 }, adm); si('producto con precio negativo se rechaza', rechazado(r), r.s);
    r = await call('POST', '/usuarios', { Nombre: '', Correo: 'no-es-correo', 'Contraseña': '1' }, adm); si('usuario con datos inválidos se rechaza', rechazado(r), r.s);
    r = await call('GET', '/cotizaciones/abc', undefined, adm); sin5xx('cotización con id de letras', r);
    r = await call('GET', '/ventas?page=-1&limit=abc', undefined, adm); sin5xx('paginación con basura', r);
    r = await call('GET', "/ventas?q=' OR 1=1 --&estado=%00", undefined, adm); sin5xx('búsqueda con SQL', r);
    r = await call('GET', '/ruta-que-no-existe', undefined, adm); si('ruta inexistente: 404 limpio', r.s === 404, r.s);

    console.log('--- limpieza');
    if (VA) { await call('PATCH', `/ventas/${VA}/estado`, { EstadoID: 12 }, adm); await call('DELETE', `/ventas/${VA}`, undefined, adm); }
    if (CA) { await call('PUT', `/cotizaciones/${CA}/cancelar`, undefined, adm); await call('DELETE', `/cotizaciones/${CA}`, undefined, adm); }
    await call('DELETE', '/usuarios/' + OTRO, undefined, adm);
    for (const x of creadas) {
        if (Array.isArray(x)) { await call('PUT', `/cotizaciones/${x[1]}/cancelar`, undefined, adm); await call('DELETE', `/cotizaciones/${x[1]}`, undefined, adm); }
        else { await call('PATCH', `/ventas/${x}/estado`, { EstadoID: 12 }, adm); await call('DELETE', `/ventas/${x}`, undefined, adm); }
    }
    const despues = await stock();
    si('el stock quedó igual que al empezar', despues === stock0, `antes ${stock0} después ${despues}`);
    if (despues !== stock0) await call('PUT', '/inventarioproducto/1', { Stock: stock0, TelaID: 1, Estado: true }, adm);
    console.log(bad ? '\n' + bad + ' FALLOS' : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
