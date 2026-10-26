/**
 * Línea de tiempo de pedidos y cotizaciones. Cada cambio de estado deja una fila con fecha y nota opcional.
 * Registrar NUNCA debe tumbar la operación principal: los errores solo se anotan.
 */
const db = require('../models');

/**
 * @param {{tipo:'venta'|'cotizacion', refId:number, estadoId:number, nota?:string, documentoId?:number}} dato
 * @param {object} [transaction] transacción de Sequelize (si la operación principal ya tiene una)
 */
async function registrar({ tipo, refId, estadoId, nota = null, documentoId = null }, transaction) {
    try {
        const estado = await db.Estado.findByPk(estadoId, { attributes: ['Nombre'], transaction });
        await db.HistorialEstado.create({
            Tipo: tipo, RefID: refId, EstadoID: estadoId, Estado: estado?.Nombre || String(estadoId),
            Nota: nota ? String(nota).trim().slice(0, 300) || null : null, DocumentoID: documentoId,
        }, { transaction });
    } catch (e) {
        console.error('[historial]', e.message);
    }
}

async function listar(tipo, refId) {
    const filas = await db.HistorialEstado.findAll({ where: { Tipo: tipo, RefID: refId }, order: [['Fecha', 'ASC'], ['HistorialID', 'ASC']], raw: true });
    return filas.map((f) => ({ Fecha: f.Fecha, EstadoID: f.EstadoID, Estado: f.Estado, Nota: f.Nota }));
}

module.exports = { registrar, listar };
