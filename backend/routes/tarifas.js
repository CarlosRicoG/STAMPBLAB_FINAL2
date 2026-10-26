/**
 * Tarifas: costo estándar de estampar una técnica en una parte de la prenda.
 *   GET    /api/tarifas/publicas   (sin sesión) para el estimado del cliente
 *   GET    /api/tarifas            (admin) con nombres
 *   PUT    /api/tarifas            (admin) { TecnicaID, ParteID, Costo } crea o actualiza
 *   DELETE /api/tarifas/:id        (admin)
 */
const express = require('express');
const db = require('../models');
const { admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/publicas', async (req, res) => {
    try {
        const filas = await db.TarifaTecnica.findAll({ attributes: ['TecnicaID', 'ParteID', 'Costo'], raw: true });
        res.json(filas.map((f) => ({ ...f, Costo: Number(f.Costo) })));
    } catch (e) { res.status(500).json({ message: 'Error al consultar las tarifas' }); }
});

router.get('/', admin, async (req, res) => {
    try {
        const filas = await db.TarifaTecnica.findAll({
            include: [{ model: db.Tecnica, as: 'tecnica', attributes: ['Nombre'] }, { model: db.Parte, as: 'parte', attributes: ['Nombre'] }],
            order: [['TecnicaID', 'ASC'], ['ParteID', 'ASC']],
        });
        res.json(filas.map((f) => ({ ...f.toJSON(), Costo: Number(f.Costo) })));
    } catch (e) { res.status(500).json({ message: 'Error al consultar las tarifas' }); }
});

router.put('/', admin, async (req, res) => {
    try {
        const TecnicaID = parseInt(req.body.TecnicaID, 10);
        const ParteID = parseInt(req.body.ParteID, 10);
        const Costo = Number(req.body.Costo);
        if (!Number.isInteger(TecnicaID) || !Number.isInteger(ParteID)) return res.status(400).json({ message: 'Elige una técnica y una parte' });
        if (!Number.isFinite(Costo) || Costo < 0 || Costo > 1e8) return res.status(400).json({ message: 'El costo debe ser un número entre 0 y 100.000.000' });
        if (!(await db.Tecnica.findByPk(TecnicaID)) || !(await db.Parte.findByPk(ParteID))) return res.status(400).json({ message: 'La técnica o la parte no existe' });
        const [fila, creada] = await db.TarifaTecnica.findOrCreate({ where: { TecnicaID, ParteID }, defaults: { Costo } });
        if (!creada) await fila.update({ Costo });
        res.status(creada ? 201 : 200).json({ ...fila.toJSON(), Costo: Number(Costo) });
    } catch (e) { res.status(500).json({ message: 'Error al guardar la tarifa' }); }
});

router.delete('/:id', admin, async (req, res) => {
    try {
        const n = await db.TarifaTecnica.destroy({ where: { TarifaID: parseInt(req.params.id, 10) || 0 } });
        if (!n) return res.status(404).json({ message: 'Tarifa no encontrada' });
        res.json({ message: 'Tarifa eliminada' });
    } catch (e) { res.status(500).json({ message: 'Error al eliminar la tarifa' }); }
});

module.exports = router;
