const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');


router.get('/dashboard', ventaController.getDashboardData);

// GET /api/ventas - Obtener todas las ventas
router.get('/', ventaController.getAllVentas);

// GET /api/ventas/:id - Obtener una venta por ID
router.get('/:id', ventaController.getVentaById);

// POST /api/ventas - Crear una nueva venta con detalles
router.post('/', ventaController.crearVenta);

// PUT /api/ventas/:id - Actualizar una venta
router.put('/:id', ventaController.updateVenta);

// DELETE /api/ventas/:id - Eliminar una venta
router.delete('/:id', ventaController.deleteVenta);


// Actualizar solo el estado (con lógica de devolución de stock)
router.patch('/:id/estado', ventaController.updateEstadoVenta);


module.exports = router;