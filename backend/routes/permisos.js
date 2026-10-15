const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');

// GET /api/permisos - Obtener todos los permisos
router.get('/', permisoController.getAllPermisos);

// GET /api/permisos/:id - Obtener un permiso por ID
router.get('/:id', permisoController.getPermisoById);

// POST /api/permisos - Crear un nuevo permiso
router.post('/', permisoController.createPermiso);

// PUT /api/permisos/:id - Actualizar un permiso
router.put('/:id', permisoController.updatePermiso);

// DELETE /api/permisos/:id - Eliminar un permiso
router.delete('/:id', permisoController.deletePermiso);

module.exports = router;