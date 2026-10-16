const { ESTADO_VENTA } = require('../config/estados');
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { verificarToken, admin, esAdmin } = require('../middleware/authMiddleware');
const { Venta } = require('../models');

// Un cliente solo ve y crea SUS ventas; el administrador ve todo.
const soloSuyas = (req, res, next) => {
    if (!esAdmin(req)) req.query.documentoID = String(req.usuario.id);
    next();
};
const ventaPropiaOAdmin = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const venta = await Venta.findByPk(req.params.id, { attributes: ['VentaID', 'DocumentoID'] });
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
        if (String(venta.DocumentoID) !== String(req.usuario.id)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para ver esta venta' });
        }
        next();
    } catch (e) { next(e); }
};
// Cliente: la venta queda a su nombre y siempre en estado Pendiente (8); no puede darse un estado a si mismo.
const ventaDelCliente = (req, res, next) => {
    if (!esAdmin(req)) { req.body.DocumentoID = String(req.usuario.id); req.body.EstadoID = ESTADO_VENTA.PENDIENTE; }
    next();
};


router.get('/dashboard', admin, ventaController.getDashboardData);
router.get('/dashboard/data', admin, ventaController.getDashboardData);

// GET /api/ventas - Obtener todas las ventas
router.get('/', verificarToken, soloSuyas, ventaController.getAllVentas);

// GET /api/ventas/:id - Obtener una venta por ID
router.get('/:id', verificarToken, ventaPropiaOAdmin, ventaController.getVentaById);

// POST /api/ventas - Crear una nueva venta con detalles
router.post('/', verificarToken, ventaDelCliente, ventaController.crearVenta);

// PUT /api/ventas/:id - Actualizar una venta
router.put('/:id', admin, ventaController.updateVenta);

// DELETE /api/ventas/:id - Eliminar una venta
router.delete('/:id', admin, ventaController.deleteVenta);


// Actualizar solo el estado (con lógica de devolución de stock)
router.patch('/:id/estado', admin, ventaController.updateEstadoVenta);


module.exports = router;