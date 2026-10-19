const sesion = require('../services/sesion');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');

const ROL_ADMIN = 1;

/** Exige un token JWT válido. Deja los datos en req.usuario = { id (DocumentoID), rol }. */
const verificarToken = async (req, res, next) => {
    let datos;
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ mensaje: 'Token no proporcionado' });
        }
        datos = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        if (datos.tipo) throw new Error('token de otro tipo (p. ej. recuperación) no sirve como sesión');
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
    // Sesión cerrada (logout) o invalidada por cambio de contraseña
    if (!(await sesion.estaVigente(datos))) {
        return res.status(401).json({ mensaje: 'La sesión fue cerrada o ya no es válida. Inicia sesión de nuevo.' });
    }
    req.usuario = datos;
    // Renovación deslizante: mientras el usuario está activo la sesión no se corta
    const nuevo = sesion.renovacion(datos);
    if (nuevo) res.setHeader('X-Token-Renovado', nuevo);
    next();
};

const esAdmin = (req) => Number(req.usuario?.rol) === ROL_ADMIN;

/** Solo administradores (usar después de verificarToken). */
const soloAdmin = (req, res, next) => {
    if (!esAdmin(req)) {
        return res.status(403).json({ mensaje: 'Acceso restringido a administradores' });
    }
    next();
};

/** Cadena lista para usar: token válido + rol administrador. */
const admin = [verificarToken, soloAdmin];

/**
 * Solo protege las operaciones que MODIFICAN datos (POST/PUT/PATCH/DELETE) exigiendo administrador.
 * Las lecturas (GET) quedan públicas: catálogo de la tienda (productos, colores, tallas…).
 */
const adminParaEscritura = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    return verificarToken(req, res, (err) => (err ? next(err) : soloAdmin(req, res, next)));
};

/** Permite al propio usuario o a un administrador. `param` es el parámetro de ruta con el DocumentoID. */
const propioOAdmin = (param = 'id') => (req, res, next) => {
    if (esAdmin(req) || String(req.usuario?.id) === String(req.params[param])) return next();
    return res.status(403).json({ mensaje: 'No tienes permiso para ver o modificar estos datos' });
};

module.exports = verificarToken;
module.exports.verificarToken = verificarToken;
module.exports.soloAdmin = soloAdmin;
module.exports.admin = admin;
module.exports.adminParaEscritura = adminParaEscritura;
module.exports.propioOAdmin = propioOAdmin;
module.exports.esAdmin = esAdmin;
