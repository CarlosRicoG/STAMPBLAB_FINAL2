const express = require('express');
const router = express.Router();
const parteController = require('../controllers/parteController');

// GET /api/partes - Obtener todas las partes
router.get('/', parteController.getAllPartes);

// GET /api/partes/:id - Obtener una parte por ID
router.get('/:id', parteController.getParteById);

// POST /api/partes - Crear una nueva parte
router.post('/', parteController.createParte);

// PUT /api/partes/:id - Actualizar una parte
router.put('/:id', parteController.updateParte);

// DELETE /api/partes/:id - Eliminar una parte
router.delete('/:id', parteController.deleteParte);

module.exports = router;