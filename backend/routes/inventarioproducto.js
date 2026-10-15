const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioproductoController');

// Obtener todo el inventario
router.get('/', inventarioController.getAllInventario);

// Obtener variantes de un producto específico
router.get('/producto/:productoId', inventarioController.getInventarioByProducto); 

// Obtener una variante por ID
router.get('/:id', inventarioController.getInventarioById);

// Crear variante
router.post('/', inventarioController.createInventario);

// Actualizar variante
router.put('/:id', inventarioController.updateInventario);

// Eliminar variante
router.delete('/:id', inventarioController.deleteInventario);

module.exports = router;