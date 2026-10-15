const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// GET /api/productos - Obtener todos los productos
router.get('/', productoController.getAllProductos);

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', productoController.getProductoById);

// POST /api/productos - Crear un nuevo producto
router.post('/', productoController.createProducto);

// PUT /api/productos/:id - Actualizar un producto
router.put('/:id', productoController.updateProducto);

// DELETE /api/productos/:id - Eliminar un producto
router.delete('/:id', productoController.deleteProducto);


module.exports = router;