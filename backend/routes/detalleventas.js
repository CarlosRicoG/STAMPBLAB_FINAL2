const express = require('express');
const router = express.Router();
const detalleventaController = require('../controllers/detalleventaController');

// GET /api/detalleventas - Obtener todos los detalles de venta
router.get('/', detalleventaController.getAllDetalleVentas);

// GET /api/detalleventas/:id - Obtener un detalle de venta por ID
router.get('/:id', detalleventaController.getDetalleVentaById);

// POST /api/detalleventas - Crear un detalle de venta
router.post('/', detalleventaController.createDetalleVenta);

// PUT /api/detalleventas/:id - Actualizar un detalle de venta
router.put('/:id', detalleventaController.updateDetalleVenta);

// DELETE /api/detalleventas/:id - Eliminar un detalle de venta
router.delete('/:id', detalleventaController.deleteDetalleVenta);

module.exports = router;