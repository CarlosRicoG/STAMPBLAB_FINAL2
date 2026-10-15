const express = require('express');
const router = express.Router();
const detallecompraController = require('../controllers/detallecompraController');

// GET /api/detallecompras - Obtener todos los detalles de compra
router.get('/', detallecompraController.getAllDetalleCompras);

// GET /api/detallecompras/:id - Obtener un detalle de compra por ID
router.get('/:id', detallecompraController.getDetalleCompraById);

// POST /api/detallecompras - Crear un detalle de compra
router.post('/', detallecompraController.createDetalleCompra);

// PUT /api/detallecompras/:id - Actualizar un detalle de compra
router.put('/:id', detallecompraController.updateDetalleCompra);

// DELETE /api/detallecompras/:id - Eliminar un detalle de compra
router.delete('/:id', detallecompraController.deleteDetalleCompra);

module.exports = router;