const express = require('express');
const router = express.Router();
const tallaController = require('../controllers/tallaController');

// GET /api/tallas - Obtener todas las tallas
router.get('/', tallaController.getAllTallas);

// GET /api/tallas/:id - Obtener una talla por ID
router.get('/:id', tallaController.getTallaById);

// POST /api/tallas - Crear una nueva talla
router.post('/', tallaController.createTalla);

// PUT /api/tallas/:id - Actualizar una talla
router.put('/:id', tallaController.updateTalla);

// DELETE /api/tallas/:id - Eliminar una talla
router.delete('/:id', tallaController.deleteTalla);

module.exports = router;