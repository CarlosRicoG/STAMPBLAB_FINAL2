const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

// GET /api/roles - Obtener todos los roles
router.get('/', rolController.getAllRoles);

// GET /api/roles/:id - Obtener un rol por ID
router.get('/:id', rolController.getRolById);

// POST /api/roles - Crear un nuevo rol
router.post('/', rolController.createRol);

// PUT /api/roles/:id - Actualizar un rol
router.put('/:id', rolController.updateRol);

// DELETE /api/roles/:id - Eliminar un rol
router.delete('/:id', rolController.deleteRol);

// POST /api/roles/:id/permisos - Asignar permisos a un rol
router.post('/:id/permisos', rolController.asignarPermisos);

module.exports = router;