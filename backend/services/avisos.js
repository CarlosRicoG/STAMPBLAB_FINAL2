/**
 * Notificaciones dentro de la aplicación (campana). Crear un aviso NUNCA debe tumbar la operación principal.
 */
const db = require('../models');

const RECORTE = 400;

async function paraUsuario(documentoId, { tipo = 'sistema', mensaje, enlace = null }) {
    try {
        if (!documentoId || !mensaje) return;
        await db.Notificacion.create({ DocumentoID: documentoId, Tipo: tipo, Mensaje: String(mensaje).slice(0, RECORTE), Enlace: enlace });
    } catch (e) {
        console.error('[avisos]', e.message);
    }
}

/** Todos los administradores reciben el aviso (rol 1). */
async function paraAdmins({ tipo = 'sistema', mensaje, enlace = null }) {
    try {
        const admins = await db.Usuario.findAll({ where: { RolID: 1 }, attributes: ['DocumentoID'], raw: true });
        await Promise.all(admins.map((a) => paraUsuario(a.DocumentoID, { tipo, mensaje, enlace })));
    } catch (e) {
        console.error('[avisos]', e.message);
    }
}

module.exports = { paraUsuario, paraAdmins };
