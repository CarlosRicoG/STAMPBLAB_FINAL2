/**
 * Recuperación de contraseña y política de claves: enlace de un solo uso, clave fuerte en todos los caminos,
 * y el token de recuperación no sirve como sesión.
 * Requisitos: backend corriendo, base de demostración. Crea y borra su propio usuario de prueba.
 * Como no hay correo en pruebas, el enlace se firma con el mismo JWT_SECRET del servidor
 * (el servidor local usa el valor por defecto; en Docker define JWT_SECRET en el entorno al ejecutar).
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const U = process.env.API_URL || 'http://127.0.0.1:3000/api';
// El secreto real del servidor: variable de entorno o backend/.env (si no, el valor por defecto)
try { require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); } catch { /* sin dotenv */ }
const SECRETO = process.env.JWT_SECRET || 'clave_secreta';
const call = async (m, p, b, t) => {
    const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined });
    let j; try { j = await r.json(); } catch { j = null; }
    return { s: r.status, j };
};
let bad = 0;
const exp = (n, r, ...ok) => { const pass = ok.includes(r.s); if (!pass) bad++; console.log((pass ? 'OK   ' : 'FALLA') + ' ' + n.padEnd(70) + ' -> ' + r.s + (pass ? '' : ` (esperado ${ok.join('/')}) ${JSON.stringify(r.j).slice(0, 100)}`)); };
const si = (n, c) => { if (!c) bad++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + n); };
const huella = (h) => crypto.createHash('sha256').update(String(h)).digest('hex').slice(0, 16);

(async () => {
    const adm = (await call('POST', '/login', { Correo: 'admin@stamplab.com', 'Contraseña': 'Admin123*' })).j.token;
    const doc = String(4300000000 + Math.floor(Math.random() * 99999999));
    const correo = `rec_${doc}@test.com`;
    const reg = await call('POST', '/registro', { DocumentoID: doc, Nombre: 'ZZ Recuperacion', Correo: correo, 'Contraseña': 'Original123*', Telefono: '3001112222' });
    exp('registro del usuario de prueba', reg, 201);

    try {
        console.log('--- política de contraseñas (mismas reglas en todos los caminos)');
        const debiles = [['muy corta', 'a1'], ['solo letras', 'soloLetrasLargas'], ['solo números', '123456789012'], ['demasiado larga', 'Aa1' + 'x'.repeat(120)]];
        for (const [nombre, clave] of debiles) {
            exp(`registro rechaza clave ${nombre}`, await call('POST', '/registro', { DocumentoID: '4399999999', Nombre: 'ZZ', Correo: 'zz_debil@test.com', 'Contraseña': clave }), 400);
        }
        const token = (await call('POST', '/login', { Correo: correo, 'Contraseña': 'Original123*' })).j.token;
        for (const [nombre, clave] of debiles) {
            exp(`editar perfil rechaza clave ${nombre}`, await call('PUT', '/usuarios/' + doc, { Nombre: 'ZZ Recuperacion', Telefono: '3001112222', Direccion: 'x', Contraseña: clave }, token), 400);
        }
        exp('el administrador no puede crear un usuario con clave débil', await call('POST', '/usuarios', { DocumentoID: '4388888888', Nombre: 'ZZ', Correo: 'zz_adm@test.com', 'Contraseña': 'abc', RolID: 2 }, adm), 400);

        console.log('--- enlace de recuperación');
        const hashActual = async () => {
            const M = require('child_process').execSync(`"C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -uroot --host=127.0.0.1 --port=3310 --protocol=tcp stamplab_unificado -N -e "SELECT Contraseña FROM usuarios WHERE DocumentoID=${doc}" 2>nul`).toString().trim();
            return M;
        };
        let local = true, hash;
        try { hash = await hashActual(); if (!hash.startsWith('$2')) local = false; } catch { local = false; }
        if (!local) { console.log('      (no se puede leer la base local: se omiten las pruebas del enlace de un solo uso)'); }
        else {
            const enlace = () => jwt.sign({ id: Number(doc), tipo: 'recuperacion', ph: huella(hash) }, SECRETO, { expiresIn: '1h' });
            const t1 = enlace();
            exp('el enlace NO sirve como sesión (rutas protegidas lo rechazan)', await call('GET', '/usuarios/' + doc, null, t1), 401);
            exp('clave débil en restablecer es rechazada', await call('POST', '/restablecer-password', { token: t1, nuevaContraseña: 'abcd' }), 400);
            exp('enlace con contraseña válida restablece', await call('POST', '/restablecer-password', { token: t1, nuevaContraseña: 'Nueva12345' }), 200);
            exp('el MISMO enlace ya no funciona (un solo uso)', await call('POST', '/restablecer-password', { token: t1, nuevaContraseña: 'Otra123456' }), 401);
            exp('se puede iniciar sesión con la nueva clave', await call('POST', '/login', { Correo: correo, 'Contraseña': 'Nueva12345' }), 200);
            exp('la clave anterior ya no sirve', await call('POST', '/login', { Correo: correo, 'Contraseña': 'Original123*' }), 401);
            exp('un enlace sin huella (formato antiguo) es rechazado', await call('POST', '/restablecer-password', { token: jwt.sign({ id: Number(doc), tipo: 'recuperacion' }, SECRETO, { expiresIn: '1h' }), nuevaContraseña: 'Otra123456' }), 401);
            exp('un token de sesión normal no vale como enlace', await call('POST', '/restablecer-password', { token, nuevaContraseña: 'Otra123456' }), 401);
            exp('un enlace vencido es rechazado', await call('POST', '/restablecer-password', { token: jwt.sign({ id: Number(doc), tipo: 'recuperacion', ph: 'x' }, SECRETO, { expiresIn: -10 }), nuevaContraseña: 'Otra123456' }), 401);
        }
        exp('pedir enlace para un correo inexistente responde igual que para uno existente', await call('POST', '/recuperar-password', { Correo: 'noexiste_zz@test.com' }), 200);

        console.log('--- login no revela quién existe');
        const a = await call('POST', '/login', { Correo: correo, 'Contraseña': 'incorrecta1' });
        const b = await call('POST', '/login', { Correo: 'noexiste_zz@test.com', 'Contraseña': 'incorrecta1' });
        si(`correo existente y no existente reciben la misma respuesta (${a.s} / ${b.s})`, a.s === b.s && a.j.mensaje === b.j.mensaje);
    } finally {
        await call('DELETE', '/usuarios/' + doc, null, adm);
    }
    console.log(bad ? ('\n' + bad + ' FALLOS') : '\nTODO OK');
})().catch((e) => { console.log('EXC', e); process.exit(1); });
