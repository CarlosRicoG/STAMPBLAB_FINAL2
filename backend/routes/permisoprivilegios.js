const express = require('express');
const router = express.Router();
const permisoprivilegioController = require('../controllers/permisoprivilegioController');

// GET /api/permisoprivilegios - Obtener todas las relaciones permiso-privilegio
router.get('/', permisoprivilegioController.getAllPermisoPrivilegios);

// GET /api/permisoprivilegios/:id - Obtener una relación por ID
router.get('/:id', permisoprivilegioController.getPermisoPrivilegioById);

// POST /api/permisoprivilegios - Asignar un privilegio a un permiso
router.post('/', permisoprivilegioController.createPermisoPrivilegio);

// DELETE /api/permisoprivilegios/:id - Eliminar una relación permiso-privilegio
router.delete('/:id', permisoprivilegioController.deletePermisoPrivilegio);

module.exports = router;