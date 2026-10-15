const express = require('express');
const router = express.Router();
const privilegioController = require('../controllers/privilegioController');

// GET /api/privilegios - Obtener todos los privilegios
router.get('/', privilegioController.getAllPrivilegios);

// GET /api/privilegios/:id - Obtener un privilegio por ID
router.get('/:id', privilegioController.getPrivilegioById);

// POST /api/privilegios - Crear un nuevo privilegio
router.post('/', privilegioController.createPrivilegio);

// PUT /api/privilegios/:id - Actualizar un privilegio
router.put('/:id', privilegioController.updatePrivilegio);

// DELETE /api/privilegios/:id - Eliminar un privilegio
router.delete('/:id', privilegioController.deletePrivilegio);

module.exports = router;
