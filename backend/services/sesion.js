/**
 * Sesiones: emisión de tokens, cierre de sesión real y renovación mientras el usuario está activo.
 *
 *  - Cada token lleva un identificador único (jti) y el identificador de su sesión (sid), que se hereda en cada renovación.
 *    "Cerrar sesión" revoca el sid: se corta toda la cadena (el token actual y cualquier token anterior copiado de esa
 *    sesión). Los tokens emitidos antes de existir el sid usan su jti como sid.
 *  - Tope absoluto: la sesión dura como máximo SESION_VIDA_MAXIMA_HORAS (24 por defecto) desde el inicio de sesión
 *    (claim ini, heredado al renovar). Pasado el tope ya no se renueva y hay que volver a iniciar sesión.
 *  - Cada token lleva la versión de sesión del usuario (sv). Al cambiar la contraseña la versión sube y TODAS las
 *    sesiones anteriores de ese usuario dejan de valer.
 *  - La validación no consulta la base en cada petición: usa una copia en memoria que se refresca cada 30 s
 *    (y al instante en el propio proceso), de modo que funciona también con varios servidores.
 *  - Renovación deslizante: si al token le queda menos de 30 min, la respuesta trae uno nuevo (cabecera X-Token-Renovado),
 *    nunca con vencimiento posterior al tope de la sesión.
 *  - Los sid revocados se guardan en la tabla sesiones_revocadas (columna Jti) hasta que la sesión ya no podría seguir viva.
 *  - Cuenta eliminada (cerrarCuenta): en vez de subir la versión (la fila se borra y otro servidor no lo vería) se guarda
 *    en sesiones_revocadas un "corte" por documento (Jti = usuario:<DocumentoID>:<segundos>): toda sesión iniciada antes de
 *    ese segundo deja de valer en todos los servidores. Si la persona se vuelve a registrar con el mismo documento, su cuenta
 *    nueva empieza en SesionesVersion 0 y sus sesiones (iniciadas después del corte) valen con normalidad.
 *  - El mapa de versiones se reconstruye entero en cada refresco: un documento que ya no tiene versión > 0 en la base
 *    (cuenta borrada o vuelta a crear) deja de arrastrar la versión anterior.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const JWT_SECRET = require('../config/jwt');
const db = require('../models');

const DURACION = process.env.SESION_DURACION || '2h';
const UMBRAL_RENOVACION_S = Number(process.env.SESION_UMBRAL_RENOVACION_S) || 30 * 60;
const REFRESCO_MS = 30 * 1000;
// Se lee en cada uso (no al cargar) para que un cambio de entorno en pruebas tenga efecto
const vidaMaximaS = () => {
    const horas = Number(process.env.SESION_VIDA_MAXIMA_HORAS);
    return (Number.isFinite(horas) && horas > 0 ? horas : 24) * 3600;
};
const ahoraS = () => Math.floor(Date.now() / 1000);

const revocados = new Set();         // jti / sid cerrados
const expiraRevocado = new Map();    // jti / sid -> ms de expiración (para purgar)
const versiones = new Map();         // DocumentoID -> versión de sesión vigente (solo los que cambiaron de clave)
const versionesLocales = new Map();  // DocumentoID -> { version, ms }: cambios hechos en este proceso (no se pierden en un refresco en curso)
const versionVista = new Map();      // DocumentoID -> ms en que se leyó/fijó su versión (para compararla con un corte)
const cortes = new Map();            // DocumentoID -> { corte (s), expira (ms) }: cuentas eliminadas
const REFRESCO_FORZADO_MIN_MS = 1000; // un token rechazado por versión puede forzar un refresco, como mucho uno por segundo
const PREFIJO_CORTE = 'usuario:';
const leerCorte = (jti) => { const m = /^usuario:(\d+):(\d+)$/.exec(String(jti)); return m ? { doc: m[1], corte: Number(m[2]) } : null; };
const anotarCorte = (doc, corte, expira) => {
    const previo = cortes.get(doc);
    if (!previo || previo.corte < corte) cortes.set(doc, { corte, expira });
};
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
            for (const f of filas) {
                const c = leerCorte(f.Jti);
                if (c) { anotarCorte(c.doc, c.corte, new Date(f.Expira).getTime()); continue; }
                revocados.add(f.Jti); expiraRevocado.set(f.Jti, new Date(f.Expira).getTime());
            }
            const usuarios = await db.Usuario.findAll({ where: { SesionesVersion: { [Op.gt]: 0 } }, attributes: ['DocumentoID', 'SesionesVersion'], raw: true });
            // Se reconstruye desde cero; solo se conservan los cambios de este proceso hechos mientras se consultaba
            const nuevas = new Map(usuarios.map((u) => [String(u.DocumentoID), u.SesionesVersion]));
            for (const [doc, { version, ms }] of versionesLocales) {
                if (ms >= ahora) nuevas.set(doc, Math.max(version, nuevas.get(doc) || 0));
                else versionesLocales.delete(doc);
            }
            versiones.clear(); versionVista.clear();
            for (const [doc, v] of nuevas) { versiones.set(doc, v); versionVista.set(doc, ahora); }
        } catch (e) {
            // Si la base falla no se tumba la API: se sigue con lo que ya hay en memoria
            console.error('No se pudo refrescar el estado de sesiones:', e.message);
        }
        for (const [jti, exp] of expiraRevocado) if (exp < Date.now()) { revocados.delete(jti); expiraRevocado.delete(jti); }
        for (const [doc, c] of cortes) if (c.expira < Date.now()) cortes.delete(doc);
    })();
    return refrescando;
}

/**
 * Token de sesión para un usuario. Sin `sesion` abre una sesión nueva (sid = jti, ini = ahora);
 * con `sesion` ({ sid, ini }) continúa esa sesión (renovación) sin pasar del tope de vida.
 */
function emitir(usuario, sesion = null) {
    const jti = crypto.randomUUID();
    const datos = { id: usuario.DocumentoID, rol: usuario.RolID, jti, sid: sesion?.sid || jti, ini: sesion?.ini || ahoraS(), sv: usuario.SesionesVersion || 0 };
    const token = jwt.sign(datos, JWT_SECRET, { expiresIn: DURACION });
    const tope = datos.ini + vidaMaximaS();
    if (jwt.decode(token).exp <= tope) return token;
    return jwt.sign(datos, JWT_SECRET, { expiresIn: Math.max(1, tope - ahoraS()) });
}

// Identificador de la sesión del token (los tokens anteriores al sid usan su jti) y su inicio
const sidDe = (datos) => datos.sid || datos.jti;
const inicioDe = (datos) => datos.ini || datos.iat || ahoraS();

/** ¿El token (ya verificado) sigue siendo válido? */
async function estaVigente(datos) {
    await refrescar();
    if (datos.jti && revocados.has(datos.jti)) return false;
    if (sidDe(datos) && revocados.has(sidDe(datos))) return false;
    const doc = String(datos.id);
    if (!versionVigente(datos, doc)) {
        // Puede que la versión en memoria sea de una cuenta ya borrada y recreada en otro servidor (dentro de los 30 s
        // del refresco): se vuelve a leer la base (como mucho una vez por segundo) antes de rechazar.
        if (Date.now() - ultimoRefresco < REFRESCO_FORZADO_MIN_MS) return false;
        await refrescar(true);
        if (!versionVigente(datos, doc)) return false;
    }
    const corte = cortes.get(doc);
    // Sesión abierta antes de eliminar la cuenta. Estricto (<): una sesión de la cuenta nueva iniciada en el mismo segundo
    // de la eliminación (registrarse y entrar enseguida) debe valer; los tokens solo guardan segundos.
    if (corte && inicioDe(datos) < corte.corte) return false;
    return true;
}

// Versión del token frente a la conocida. Si la cuenta se eliminó (hay corte), el token es de una sesión posterior al
// corte y la versión en memoria se conoció antes del corte, esa versión es de la cuenta borrada: no se aplica.
function versionVigente(datos, doc) {
    const conocida = versiones.get(doc) || 0;
    if ((datos.sv || 0) >= conocida) return true;
    const corte = cortes.get(doc);
    return Boolean(corte && inicioDe(datos) >= corte.corte && (versionVista.get(doc) || 0) < (corte.corte + 1) * 1000);
}

/** Cierra una sesión (logout): revoca su sid, con lo que ningún token de esa sesión (ni anterior ni renovado) sirve. */
async function revocar(datos) {
    const sid = sidDe(datos);
    if (!sid) return;
    // Se guarda hasta que la sesión ya no podría seguir viva: el mayor entre el exp del token y el tope de la sesión
    const expira = new Date(Math.max(datos.exp || ahoraS() + 7200, inicioDe(datos) + vidaMaximaS()) * 1000);
    revocados.add(sid);
    expiraRevocado.set(sid, expira.getTime());
    await db.SesionRevocada.findOrCreate({ where: { Jti: sid }, defaults: { Jti: sid, DocumentoID: datos.id, Expira: expira } });
}

/** Invalida todas las sesiones anteriores de un usuario (p. ej. al cambiar su contraseña). */
async function revocarTodas(documentoID, transaction) {
    await db.Usuario.increment('SesionesVersion', { by: 1, where: { DocumentoID: documentoID }, transaction });
    const u = await db.Usuario.findByPk(documentoID, { attributes: ['SesionesVersion'], transaction });
    if (u) {
        versiones.set(String(documentoID), u.SesionesVersion);
        versionVista.set(String(documentoID), Date.now());
        versionesLocales.set(String(documentoID), { version: u.SesionesVersion, ms: Date.now() });
    }
}

/**
 * Cuenta eliminada: corta todas sus sesiones (en todos los servidores) sin depender de la fila del usuario, que se va a
 * borrar. Si alguien se registra después con el mismo documento, sus sesiones nuevas valen (empieza en versión 0).
 * Con `transaction` el corte se guarda dentro de ella y NO se aplica en memoria: devuelve `aplicar`, que el llamador
 * ejecuta tras el commit (si la transacción se deshace, las sesiones siguen como estaban). Sin transacción se aplica ya.
 */
async function cerrarCuenta(documentoID, { transaction } = {}) {
    const doc = String(documentoID);
    const corte = ahoraS();
    // Ninguna sesión iniciada antes del corte puede seguir viva pasada la vida máxima: hasta ahí se guarda
    const expira = new Date((corte + vidaMaximaS()) * 1000);
    const jti = `${PREFIJO_CORTE}${doc}:${corte}`;
    await db.SesionRevocada.findOrCreate({ where: { Jti: jti }, defaults: { Jti: jti, DocumentoID: documentoID, Expira: expira }, transaction });
    const aplicar = () => {
        anotarCorte(doc, corte, expira.getTime());
        versiones.delete(doc);
        versionVista.delete(doc);
        versionesLocales.delete(doc);
    };
    if (!transaction) aplicar();
    return aplicar;
}

/** Si al token le queda poco, devuelve uno nuevo de la misma sesión; si no (o si la sesión llegó a su tope), null. */
function renovacion(datos) {
    if (!datos.exp || datos.tipo) return null;
    const restante = datos.exp - ahoraS();
    if (restante > UMBRAL_RENOVACION_S) return null;
    const ini = inicioDe(datos);
    // Pasado el tope (o si un token nuevo no duraría más que el actual) no se renueva: hay que iniciar sesión otra vez
    if (ini + vidaMaximaS() <= Math.max(ahoraS(), datos.exp)) return null;
    return emitir({ DocumentoID: datos.id, RolID: datos.rol, SesionesVersion: datos.sv }, { sid: sidDe(datos), ini });
}

module.exports = { emitir, estaVigente, revocar, revocarTodas, cerrarCuenta, renovacion, refrescar };
