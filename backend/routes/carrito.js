/**
 * Carrito del cliente en el servidor (para no perderlo al cambiar de equipo).
 *   GET /api/carrito           -> { items: [...] }
 *   PUT /api/carrito { items } -> { ok: true }
 */
const express = require('express');
const db = require('../models');
const { verificarToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(verificarToken);

router.get('/', async (req, res) => {
    try {
        const fila = await db.Carrito.findByPk(req.usuario.id);
        let items = [];
        try { items = fila ? JSON.parse(fila.Datos) : []; } catch { items = []; }
        res.json({ items: Array.isArray(items) ? items : [] });
    } catch (e) { res.status(500).json({ message: 'Error al leer el carrito' }); }
});

router.put('/', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length > 200) return res.status(400).json({ message: 'El carrito debe ser una lista de hasta 200 productos' });
        const datos = JSON.stringify(items);
        if (datos.length > 2 * 1024 * 1024) return res.status(400).json({ message: 'El carrito es demasiado grande' });
        await db.Carrito.upsert({ DocumentoID: req.usuario.id, Datos: datos, Actualizado: new Date() });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: 'Error al guardar el carrito' }); }
});

module.exports = router;
