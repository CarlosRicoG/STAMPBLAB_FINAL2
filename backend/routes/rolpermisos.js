const express = require('express');
const router = express.Router();
const rolpermisoController = require('../controllers/rolpermisoController');

// GET /api/rolpermisos - Obtener todas las relaciones rol-permiso
router.get('/', rolpermisoController.getAllRolPermisos);

// GET /api/rolpermisos/:id - Obtener una relación por ID
router.get('/:id', rolpermisoController.getRolPermisoById);

// POST /api/rolpermisos - Asignar un permiso a un rol
router.post('/', rolpermisoController.createRolPermiso);

// DELETE /api/rolpermisos/:id - Eliminar una relación rol-permiso
router.delete('/:id', rolpermisoController.deleteRolPermiso);

module.exports = router;