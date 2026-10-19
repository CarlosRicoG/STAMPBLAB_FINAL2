const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const router = express.Router();

// GET /api/auditoria?page=1&limit=20&usuario=&entidad=&metodo=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&q=
// (solo administradores: se monta con el middleware admin en server.js)
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const where = {};
        if (req.query.usuario) where.DocumentoID = String(req.query.usuario).replace(/\D/g, '') || -1;
        if (req.query.entidad) where.Entidad = String(req.query.entidad);
        if (req.query.metodo) where.Metodo = String(req.query.metodo).toUpperCase();
        if (req.query.desde || req.query.hasta) {
            where.Fecha = {};
            if (req.query.desde) where.Fecha[Op.gte] = new Date(req.query.desde + 'T00:00:00');
            if (req.query.hasta) where.Fecha[Op.lte] = new Date(req.query.hasta + 'T23:59:59');
        }
        if (req.query.q) {
            const q = `%${String(req.query.q).slice(0, 80)}%`;
            where[Op.or] = [{ Ruta: { [Op.like]: q } }, { Detalle: { [Op.like]: q } }, { EntidadID: { [Op.like]: q } }];
        }

        const { count, rows } = await db.Auditoria.findAndCountAll({ where, order: [['AuditoriaID', 'DESC']], limit, offset: (page - 1) * limit });

        // Nombre de quien hizo la acción
        const docs = [...new Set(rows.map((r) => r.DocumentoID).filter(Boolean))];
        const usuarios = docs.length ? await db.Usuario.findAll({ where: { DocumentoID: docs }, attributes: ['DocumentoID', 'Nombre'], raw: true }) : [];
        const nombre = new Map(usuarios.map((u) => [String(u.DocumentoID), u.Nombre]));
        const datos = rows.map((r) => {
            const f = r.toJSON();
            let detalle = null;
            try { detalle = f.Detalle ? JSON.parse(f.Detalle) : null; } catch { detalle = { texto: f.Detalle }; }
            return { ...f, Detalle: detalle, Usuario: nombre.get(String(f.DocumentoID)) || null };
        });

        // Entidades disponibles para el filtro
        const entidades = (await db.Auditoria.findAll({ attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('Entidad')), 'Entidad']], raw: true })).map((e) => e.Entidad).filter(Boolean).sort();

        res.json({ datos, total: count, pagina: page, totalPaginas: Math.max(1, Math.ceil(count / limit)), limit, entidades });
    } catch (error) {
        console.error('Error al consultar la auditoría:', error);
        res.status(500).json({ message: 'Error al consultar la auditoría', error: error.message });
    }
});

module.exports = router;
