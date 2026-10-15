const express = require('express');
const router = express.Router();
const cotizacionproductoController = require('../controllers/cotizacionproductoController');

// GET /api/cotizacionproductos - Obtener todas las cotizaciones de productos
router.get('/', cotizacionproductoController.getAllCotizacionProductos);

// GET /api/cotizacionproductos/:id - Obtener una cotización de producto por ID
router.get('/:id', cotizacionproductoController.getCotizacionProductoById);

// POST /api/cotizacionproductos - Crear una cotización de producto
router.post('/', cotizacionproductoController.createCotizacionProducto);

// PUT /api/cotizacionproductos/:id - Actualizar una cotización de producto
router.put('/:id', cotizacionproductoController.updateCotizacionProducto);

// DELETE /api/cotizacionproductos/:id - Eliminar una cotización de producto
router.delete('/:id', cotizacionproductoController.deleteCotizacionProducto);

module.exports = router;