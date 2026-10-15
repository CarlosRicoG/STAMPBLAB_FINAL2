const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

// GET /api/compras - Obtener todas las compras
router.get('/', compraController.getAllCompras);

// GET /api/compras/:id - Obtener una compra por ID
router.get('/:id', compraController.getCompraById);

// POST /api/compras - Crear una nueva compra con detalles
router.post('/', compraController.createCompra);

// PUT /api/compras/:id - Actualizar una compra
router.put('/:id', compraController.updateCompra);

// DELETE /api/compras/:id - Eliminar una compra
router.delete('/:id', compraController.deleteCompra);

module.exports = router;