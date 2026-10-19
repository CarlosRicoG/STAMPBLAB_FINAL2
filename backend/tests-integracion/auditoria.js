/**
 * Auditoría: quién hizo qué. Comprueba lo que se registra, lo que NO se registra (claves, imágenes, lecturas)
 * y que solo el administrador pueda consultarla.
 */
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const exp = (n, r, ...ok) => { const pass = ok.includes(r.s); if (!pass) bad++; console.log((pass ? 'OK   ' : 'FALLA') + ' ' + n.padEnd(76) + ' -> ' + r.s + (pass ? '' : ` (esperado ${ok.join('/')})`)); };
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + d : '')); };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const cli = (await call('POST', '/login', { Correo: 'cliente@stamplab.com', 'Contraseña': 'Cliente123*' })).j.token;
    const consulta = async (q = '') => (await call('GET', '/auditoria?limit=50' + q, null, adm)).j;
    const marca = 'ZZ-Audit-' + Date.now();

    console.log('--- acceso');
    exp('el administrador consulta la auditoría', await call('GET', '/auditoria', null, adm), 200);
    exp('un cliente NO puede consultarla', await call('GET', '/auditoria', null, cli), 403);
    exp('sin sesión NO se puede consultar', await call('GET', '/auditoria'), 401, 403);

    console.log('--- se registran las acciones que modifican datos');
    const c = await call('POST', '/colores', { Nombre: marca }, adm);
    const idColor = c.j?.color?.ColorID ?? c.j?.datos?.ColorID ?? c.j?.ColorID;
    await call('PUT', '/colores/' + idColor, { Nombre: marca + '-editado' }, adm);
    await call('DELETE', '/colores/' + idColor, null, adm);
    await espera(600);
    const reg = ((await consulta('&entidad=colores&q=' + encodeURIComponent(String(idColor)))).datos || []).filter((r) => String(r.EntidadID) === String(idColor));
    const por = (m) => reg.find((r) => r.Metodo === m);
    si('queda registrada la CREACIÓN (POST) con el ID de lo creado', !!por('POST') && String(por('POST').EntidadID) === String(idColor), JSON.stringify(reg.map((r) => r.Metodo + ':' + r.EntidadID)));
    si('queda registrada la EDICIÓN (PUT)', !!por('PUT') && String(por('PUT').EntidadID) === String(idColor));
    si('queda registrado el BORRADO (DELETE)', !!por('DELETE'));
    si('cada registro dice quién fue (documento y nombre) y su rol', reg.length > 0 && reg.every((r) => String(r.DocumentoID) === '1000000001' && r.Usuario === 'Administrador' && r.Rol === 1));
    si('guarda el resumen de lo enviado (nombre del color)', JSON.stringify(por('POST')?.Detalle).includes(marca));
    si('guarda la fecha y el código de respuesta', !!por('POST')?.Fecha && por('POST')?.Estado < 300);

    console.log('--- lo que NO se registra o se oculta');
    const antes = (await consulta()).total;
    await call('GET', '/colores', null, adm);
    await call('GET', '/ventas?limit=1&page=1', null, adm);
    await espera(400);
    si('las lecturas (GET) no se auditan', (await consulta()).total === antes);
    const antesLogin = (await consulta()).total;
    await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' });
    await espera(400);
    si('el login no se audita (no es un cambio de datos)', (await consulta()).total === antesLogin);

    const doc = String(4500000000 + Math.floor(Math.random() * 99999999));
    await call('POST', '/usuarios', { DocumentoID: doc, Nombre: marca + ' usuario', Correo: `aud_${doc}@test.com`, 'Contraseña': 'ClaveSecreta123', Telefono: '3001112222', Direccion: 'x', RolID: 2 }, adm);
    await call('PUT', '/usuarios/' + doc, { Nombre: marca + ' usuario', Telefono: '3001112222', Direccion: 'y', Contraseña: 'OtraSecreta456' }, adm);
    await espera(600);
    const crudo = JSON.stringify((await consulta('&entidad=usuarios')).datos);
    si('NUNCA se guarda una contraseña en claro (ni la creada ni la cambiada)', !crudo.includes('ClaveSecreta123') && !crudo.includes('OtraSecreta456'));
    si('la contraseña aparece redactada (***)', crudo.includes('***'));

    const png = 'data:image/png;base64,' + 'A'.repeat(4000);
    const p = await call('POST', '/productos', { Nombre: marca + ' prod', Descripcion: 'x', PrecioBase: 1000, ImagenProducto: png }, adm);
    const idProd = p.j?.datos?.ProductoID;
    await espera(600);
    const prodLog = JSON.stringify((await consulta('&entidad=productos&q=' + encodeURIComponent(marca))).datos);
    si('las imágenes en base64 no se guardan (se redactan)', !prodLog.includes('AAAAAAAAAA') && prodLog.includes('***'));

    console.log('--- intentos prohibidos');
    await call('POST', '/productos', { Nombre: marca + ' hack', PrecioBase: 1 }, cli);
    await espera(600);
    const prohibidos = (await consulta('&q=' + encodeURIComponent(marca + ' hack'))).datos || [];
    si('un cliente que intenta una acción de administrador queda registrado (403)', prohibidos.some((r) => r.Estado === 403 && String(r.DocumentoID) === '1000000002'));

    console.log('--- filtros y paginación');
    const f1 = await consulta('&entidad=colores');
    si('filtra por entidad', f1.datos.length > 0 && f1.datos.every((r) => r.Entidad === 'colores'));
    const f2 = await consulta('&metodo=DELETE');
    si('filtra por método', f2.datos.length > 0 && f2.datos.every((r) => r.Metodo === 'DELETE'));
    const f3 = await consulta('&usuario=1000000002');
    si('filtra por usuario', f3.datos.every((r) => String(r.DocumentoID) === '1000000002'));
    const f4 = await consulta('&desde=2999-01-01');
    si('filtra por fecha (nada en el futuro)', f4.total === 0);
    const pag = (await call('GET', '/auditoria?limit=2&page=1', null, adm)).j;
    si('pagina (limit=2)', pag.datos.length <= 2 && pag.totalPaginas >= 1 && Array.isArray(pag.entidades) && pag.entidades.length > 0);
    const inj = await call('GET', '/auditoria?usuario=1%20OR%201=1&q=%27%3B%20DROP%20TABLE%20ventas%3B--', null, adm);
    exp('una búsqueda con SQL malicioso no rompe nada', inj, 200);
    exp('las ventas siguen existiendo tras ese intento', await call('GET', '/ventas?limit=1&page=1', null, adm), 200);

    // limpieza
    if (idProd) await call('DELETE', '/productos/' + idProd, null, adm);
    await call('DELETE', '/usuarios/' + doc, null, adm);
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
