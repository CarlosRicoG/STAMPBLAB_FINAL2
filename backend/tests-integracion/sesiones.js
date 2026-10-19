/**
 * Sesiones: cierre real (logout), invalidación al cambiar la contraseña, renovación deslizante y compatibilidad.
 * Requisitos: backend corriendo + base de demostración. Crea y borra su propio usuario de prueba.
 * La parte de renovación firma tokens con el JWT_SECRET real (variable de entorno o backend/.env).
 */
const jwt = require('jsonwebtoken');
try { require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); } catch { /* sin dotenv */ }
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
const SECRETO = process.env.JWT_SECRET || 'clave_secreta';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j, h: r.headers };
};
let bad = 0;
const exp = (n, r, ...ok) => { const pass = ok.includes(r.s); if (!pass) bad++; console.log((pass ? 'OK   ' : 'FALLA') + ' ' + n.padEnd(78) + ' -> ' + r.s + (pass ? '' : ` (esperado ${ok.join('/')}) ${JSON.stringify(r.j).slice(0, 90)}`)); };
const si = (n, c, d = '') => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n + (!c && d ? '  -> ' + d : '')); };

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const doc = String(4400000000 + Math.floor(Math.random() * 99999999));
    const correo = `ses_${doc}@test.com`;
    await call('POST', '/registro', { DocumentoID: doc, Nombre: 'ZZ Sesiones', Correo: correo, 'Contraseña': 'Sesion12345', Telefono: '3001112222' });
    const login = async (clave = 'Sesion12345') => (await call('POST', '/login', { Correo: correo, 'Contraseña': clave })).j?.token;

    try {
        console.log('--- cerrar sesión de verdad');
        const t1 = await login(), t2 = await login();
        const claims = jwt.decode(t1);
        si('el token lleva identificador único (jti) y versión de sesión (sv)', !!claims.jti && claims.sv === 0, JSON.stringify(claims));
        si('dos inicios de sesión generan identificadores distintos', jwt.decode(t2).jti !== claims.jti);
        exp('el token sirve antes de cerrar sesión', await call('GET', '/usuarios/' + doc, null, t1), 200);
        exp('POST /logout cierra la sesión', await call('POST', '/logout', null, t1), 200);
        exp('el MISMO token ya no sirve (aunque no haya vencido)', await call('GET', '/usuarios/' + doc, null, t1), 401);
        exp('cerrar sesión otra vez con ese token también es rechazado', await call('POST', '/logout', null, t1), 401);
        exp('la OTRA sesión del mismo usuario sigue abierta', await call('GET', '/usuarios/' + doc, null, t2), 200);
        exp('logout sin token es rechazado', await call('POST', '/logout'), 401, 403);

        console.log('--- cambiar la contraseña cierra TODAS las sesiones');
        const a = await login(), b = await login();
        exp('cambiar la clave desde Editar perfil', await call('PUT', '/usuarios/' + doc, { Nombre: 'ZZ Sesiones', Telefono: '3001112222', Direccion: 'x', Contraseña: 'Nueva12345' }, a), 200);
        exp('la sesión que la cambió queda cerrada', await call('GET', '/usuarios/' + doc, null, a), 401);
        exp('las demás sesiones abiertas con la clave anterior también', await call('GET', '/usuarios/' + doc, null, b), 401);
        const c = await login('Nueva12345');
        si('con la clave nueva se inicia sesión y el token lleva versión nueva (sv=1)', !!c && jwt.decode(c).sv === 1, String(c && jwt.decode(c).sv));
        exp('esa sesión nueva funciona', await call('GET', '/usuarios/' + doc, null, c), 200);

        console.log('--- renovación mientras se usa');
        const fresco = c;
        const r0 = await call('GET', '/usuarios/' + doc, null, fresco);
        si('con 2 h de vida NO se renueva (sin cabecera)', !r0.h.get('x-token-renovado'));
        const porVencer = jwt.sign({ id: Number(doc), rol: 2, jti: 'prueba-' + doc, sv: 1 }, SECRETO, { expiresIn: 600 });
        const r1 = await call('GET', '/usuarios/' + doc, null, porVencer);
        const nuevo = r1.h.get('x-token-renovado');
        si('con 10 min de vida la respuesta trae un token nuevo (X-Token-Renovado)', r1.s === 200 && !!nuevo, 'estado ' + r1.s);
        if (nuevo) {
            si('el token nuevo vive ~2 h y es otro distinto', jwt.decode(nuevo).exp - jwt.decode(nuevo).iat >= 7000 && jwt.decode(nuevo).jti !== 'prueba-' + doc);
            exp('el token nuevo funciona', await call('GET', '/usuarios/' + doc, null, nuevo), 200);
        }

        console.log('--- compatibilidad y robustez');
        // formato anterior (sin jti ni sv) de un usuario que NO ha cambiado su clave: sigue valiendo
        const antiguoAdmin = jwt.sign({ id: 1000000001, rol: 1 }, SECRETO, { expiresIn: '2h' });
        exp('un token con el formato anterior (sin jti/sv) sigue valiendo si no cambió la clave', await call('GET', '/ventas?limit=1&page=1', null, antiguoAdmin), 200);
        exp('pero un token anterior (sin sv) de quien YA cambió su clave NO vale', await call('GET', '/usuarios/' + doc, null, jwt.sign({ id: Number(doc), rol: 2 }, SECRETO, { expiresIn: '2h' })), 401);
        exp('el token de una versión anterior a la clave actual NO vale', await call('GET', '/usuarios/' + doc, null, jwt.sign({ id: Number(doc), rol: 2, jti: 'x', sv: 0 }, SECRETO, { expiresIn: '2h' })), 401);
        exp('un token firmado con otro secreto es rechazado', await call('GET', '/usuarios/' + doc, null, jwt.sign({ id: Number(doc), rol: 2 }, 'otro-secreto')), 401);

        console.log('--- el administrador no se ve afectado');
        exp('el administrador sigue operando', await call('GET', '/ventas?limit=1&page=1', null, adm), 200);
    } finally {
        await call('DELETE', '/usuarios/' + doc, null, adm);
    }
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
