/**
 * Historial visible para el CLIENTE tras volver a registrarse con el documento de una cuenta suprimida.
 *
 * La fila de una cuenta suprimida se conserva (sus ventas la referencian). Si alguien se registra después con ese
 * documento, la fila se reutiliza y se fija usuarios.HistorialDesde = momento de la supresión (el SuprimidoEn guardado):
 * lo de esa fecha o anterior (pedidos, cotizaciones, facturas, línea de tiempo) NO se muestra al nuevo titular; solo lo
 * estrictamente posterior. Comparación estricta porque DATETIME guarda segundos: un pedido creado en el mismo segundo de
 * la supresión es del titular anterior. El administrador lo sigue viendo todo.
 * Las notificaciones y el carrito anteriores se borran al suprimir y otra vez al reutilizar la fila.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { esAdmin } = require('../middleware/authMiddleware');

/** Fecha desde la que el cliente ve su historial (null = todo). */
async function historialDesde(documentoId, transaction) {
    const u = await db.Usuario.findByPk(documentoId, { attributes: ['HistorialDesde'], raw: true, transaction });
    return u?.HistorialDesde || null;
}

/** Condición `where` para limitar una consulta del cliente a su historial visible. */
const desdeWhere = (campo, desde) => (desde ? { [campo]: { [Op.gt]: desde } } : {});

/** ¿Un registro con esta fecha es visible para el cliente? */
const visible = (fecha, desde) => !desde || (fecha != null && new Date(fecha).getTime() > new Date(desde).getTime());

/** Middleware: deja en req.historialDesde la fecha del cliente de la sesión (el administrador no tiene límite). */
async function historialDelCliente(req, res, next) {
    try {
        req.historialDesde = esAdmin(req) ? null : await historialDesde(req.usuario.id);
        next();
    } catch (e) { next(e); }
}

/**
 * Middleware para las operaciones del cliente que CREAN pedidos o cotizaciones: rechaza una cuenta suprimida.
 * Cubre la carrera con la supresión: una petición con un token emitido antes de suprimir que llegue después del commit.
 */
async function cuentaActiva(req, res, next) {
    try {
        if (esAdmin(req)) return next();
        const u = await db.Usuario.findByPk(req.usuario.id, { attributes: ['SuprimidoEn'], raw: true });
        if (!u || u.SuprimidoEn) return res.status(403).json({ mensaje: 'Tu cuenta ya no está activa.' });
        next();
    } catch (e) { next(e); }
}

module.exports = { historialDesde, desdeWhere, visible, historialDelCliente, cuentaActiva };
