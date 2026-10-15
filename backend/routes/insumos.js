const express = require('express');
const router = express.Router();
const insumoController = require('../controllers/insumoController');

// GET /api/insumos - Obtener todos los insumos
router.get('/', insumoController.getAllInsumos);

// GET /api/insumos/:id - Obtener un insumo por ID
router.get('/:id', insumoController.getInsumoById);

// POST /api/insumos - Crear un nuevo insumo
router.post('/', insumoController.createInsumo);

// Cambiar estado del insumo
router.patch('/:id/estado', insumoController.cambiarEstadoInsumo);

// PUT /api/insumos/:id - Actualizar un insumo
router.put('/:id', insumoController.updateInsumo);

// DELETE /api/insumos/:id - Eliminar un insumo
router.delete('/:id', insumoController.deleteInsumo);

module.exports = router;