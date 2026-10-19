/**
 * Sesiones: emisión de tokens, cierre de sesión real y renovación mientras el usuario está activo.
 *
 *  - Cada token lleva un identificador único (jti). "Cerrar sesión" lo revoca: aunque alguien lo haya copiado, ya no sirve.
 *  - Cada token lleva la versión de sesión del usuario (sv). Al cambiar la contraseña la versión sube y TODAS las
 *    sesiones anteriores de ese usuario dejan de valer.
 *  - La validación no consulta la base en cada petición: usa una copia en memoria que se refresca cada 30 s
 *    (y al instante en el propio proceso), de modo que funciona también con varios servidores.
 *  - Renovación deslizante: si al token le queda menos de 30 min, la respuesta trae uno nuevo (cabecera X-Token-Renovado).
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const JWT_SECRET = require('../config/jwt');
const db = require('../models');

const DURACION = process.env.SESION_DURACION || '2h';
const UMBRAL_RENOVACION_S = Number(process.env.SESION_UMBRAL_RENOVACION_S) || 30 * 60;
const REFRESCO_MS = 30 * 1000;

const revocados = new Set();         // jti cerrados
const expiraRevocado = new Map();    // jti -> ms de expiración (para purgar)
const versiones = new Map();         // DocumentoID -> versión de sesión vigente (solo los que cambiaron de clave)
let ultimoRefresco = 0;
let refrescando = null;

/** Carga desde la base lo que otros procesos hayan revocado. Seguro de llamar muchas veces. */
async function refrescar(forzar = false) {
    const ahora = Date.now();
    if (!forzar && ahora - ultimoRefresco < REFRESCO_MS) return refrescando;
    ultimoRefresco = ahora;
    refrescando = (async () => {
        try {
            await db.SesionRevocada.destroy({ where: { Expira: { [Op.lt]: new Date() } } });
            const filas = await db.SesionRevocada.findAll({ attributes: ['Jti', 'Expira'], raw: true });
            for (const f of filas) { revocados.add(f.Jti); expiraRevocado.set(f.Jti, new Date(f.Expira).getTime()); }
            const usuarios = await db.Usuario.findAll({ where: { SesionesVersion: { [Op.gt]: 0 } }, attributes: ['DocumentoID', 'SesionesVersion'], raw: true });
            for (const u of usuarios) versiones.set(String(u.DocumentoID), u.SesionesVersion);
        } catch (e) {
            // Si la base falla no se tumba la API: se sigue con lo que ya hay en memoria
            console.error('No se pudo refrescar el estado de sesiones:', e.message);
        }
        for (const [jti, exp] of expiraRevocado) if (exp < Date.now()) { revocados.delete(jti); expiraRevocado.delete(jti); }
    })();
    return refrescando;
}

/** Token de sesión nuevo para un usuario. */
function emitir(usuario) {
    return jwt.sign(
        { id: usuario.DocumentoID, rol: usuario.RolID, jti: crypto.randomUUID(), sv: usuario.SesionesVersion || 0 },
        JWT_SECRET,
        { expiresIn: DURACION }
    );
}

/** ¿El token (ya verificado) sigue siendo válido? */
async function estaVigente(datos) {
    await refrescar();
    if (datos.jti && revocados.has(datos.jti)) return false;
    if ((datos.sv || 0) < (versiones.get(String(datos.id)) || 0)) return false;
    return true;
}

/** Cierra una sesión (logout). */
async function revocar(datos) {
    if (!datos.jti) return;
    const expira = new Date((datos.exp || Math.floor(Date.now() / 1000) + 7200) * 1000);
    revocados.add(datos.jti);
    expiraRevocado.set(datos.jti, expira.getTime());
    await db.SesionRevocada.findOrCreate({ where: { Jti: datos.jti }, defaults: { Jti: datos.jti, DocumentoID: datos.id, Expira: expira } });
}

/** Invalida todas las sesiones anteriores de un usuario (p. ej. al cambiar su contraseña). */
async function revocarTodas(documentoID, transaction) {
    await db.Usuario.increment('SesionesVersion', { by: 1, where: { DocumentoID: documentoID }, transaction });
    const u = await db.Usuario.findByPk(documentoID, { attributes: ['SesionesVersion'], transaction });
    if (u) versiones.set(String(documentoID), u.SesionesVersion);
}

/** Si al token le queda poco, devuelve uno nuevo; si no, null. */
function renovacion(datos) {
    if (!datos.exp || datos.tipo) return null;
    const restante = datos.exp - Math.floor(Date.now() / 1000);
    if (restante > UMBRAL_RENOVACION_S) return null;
    return emitir({ DocumentoID: datos.id, RolID: datos.rol, SesionesVersion: datos.sv });
}

module.exports = { emitir, estaVigente, revocar, revocarTodas, renovacion, refrescar };
