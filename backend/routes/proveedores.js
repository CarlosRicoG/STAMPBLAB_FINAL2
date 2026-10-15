const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

// GET /api/proveedores - Obtener todos los proveedores
router.get('/', proveedorController.getAllProveedores);

// GET /api/proveedores/:nit - Obtener un proveedor por NIT
router.get('/:nit', proveedorController.getProveedorByNit);

// POST /api/proveedores - Crear un nuevo proveedor
router.post('/', proveedorController.createProveedor);

// PUT /api/proveedores/:nit - Actualizar un proveedor
router.put('/:nit', proveedorController.updateProveedor);

// DELETE /api/proveedores/:nit - Eliminar un proveedor
router.delete('/:nit', proveedorController.deleteProveedor);

module.exports = router;