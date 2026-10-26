/**
 * Notificaciones dentro de la aplicación (campana). Cada usuario solo ve y gestiona las suyas.
 *   GET  /api/notificaciones?archivada=false&page=1   lista paginada (activas o historial)
 *   GET  /api/notificaciones/contador                  { noLeidas }
 *   POST /api/notificaciones/leer-todas | /archivar-todas
 *   POST /api/notificaciones/:id/leer | /archivar
 */
const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { verificarToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verificarToken);

const POR_PAGINA = 20;

const hace = (fecha) => {
    const seg = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 1000));
    if (seg < 60) return 'Hace un momento';
    const min = Math.floor(seg / 60); if (min < 60) return `Hace ${min} min`;
    const h = Math.floor(min / 60); if (h < 24) return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
    const d = Math.floor(h / 24); if (d < 30) return `Hace ${d} ${d === 1 ? 'día' : 'días'}`;
    return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
const aJson = (n) => ({ id: n.NotificacionID, tipo: n.Tipo, mensaje: n.Mensaje, enlace: n.Enlace, leida: !!n.Leida, archivada: !!n.Archivada, fecha: n.Fecha, hace: hace(n.Fecha) });
const mias = (req) => ({ DocumentoID: req.usuario.id });

router.get('/contador', async (req, res) => {
    try {
        const noLeidas = await db.Notificacion.count({ where: { ...mias(req), Archivada: false, Leida: false } });
        res.json({ noLeidas });
    } catch (e) { res.status(500).json({ message: 'Error al contar notificaciones' }); }
});

router.get('/', async (req, res) => {
    try {
        const pagina = Math.max(1, parseInt(req.query.page, 10) || 1);
        const archivada = String(req.query.archivada) === 'true';
        const { count, rows } = await db.Notificacion.findAndCountAll({
            where: { ...mias(req), Archivada: archivada }, order: [['Fecha', 'DESC'], ['NotificacionID', 'DESC']],
            limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA,
        });
        const noLeidas = await db.Notificacion.count({ where: { ...mias(req), Archivada: false, Leida: false } });
        res.json({ results: rows.map(aJson), next: pagina * POR_PAGINA < count, total: count, noLeidas });
    } catch (e) { res.status(500).json({ message: 'Error al listar notificaciones' }); }
});

router.post('/leer-todas', async (req, res) => {
    try {
        const [n] = await db.Notificacion.update({ Leida: true }, { where: { ...mias(req), Archivada: false, Leida: false } });
        res.json({ actualizadas: n });
    } catch (e) { res.status(500).json({ message: 'Error al marcar como leídas' }); }
});

router.post('/archivar-todas', async (req, res) => {
    try {
        const [n] = await db.Notificacion.update({ Archivada: true, Leida: true }, { where: { ...mias(req), Archivada: false } });
        res.json({ archivadas: n });
    } catch (e) { res.status(500).json({ message: 'Error al archivar' }); }
});

const sobreUna = (cambio) => async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Notificación no válida' });
        const [n] = await db.Notificacion.update(cambio, { where: { NotificacionID: id, ...mias(req) } });
        if (!n) return res.status(404).json({ message: 'Notificación no encontrada' });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: 'Error al actualizar la notificación' }); }
};
router.post('/:id/leer', sobreUna({ Leida: true }));
router.post('/:id/archivar', sobreUna({ Archivada: true, Leida: true }));

// Limpieza: lo archivado hace más de 90 días se borra (se invoca desde el trabajo de mantenimiento)
router.purgar = async () => db.Notificacion.destroy({ where: { Archivada: true, Fecha: { [Op.lt]: new Date(Date.now() - 90 * 864e5) } } });

module.exports = router;
