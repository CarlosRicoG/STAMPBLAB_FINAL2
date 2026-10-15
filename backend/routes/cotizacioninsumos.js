const express = require('express');
const router = express.Router();
const cotizacioninsumoController = require('../controllers/cotizacioninsumoController');

// GET /api/cotizacioninsumos - Obtener todas las cotizaciones de insumos
router.get('/', cotizacioninsumoController.getAllCotizacionInsumos);

// GET /api/cotizacioninsumos/:id - Obtener una cotización de insumo por ID
router.get('/:id', cotizacioninsumoController.getCotizacionInsumoById);

// POST /api/cotizacioninsumos - Crear una cotización de insumo
router.post('/', cotizacioninsumoController.createCotizacionInsumo);

// PUT /api/cotizacioninsumos/:id - Actualizar una cotización de insumo
router.put('/:id', cotizacioninsumoController.updateCotizacionInsumo);

// DELETE /api/cotizacioninsumos/:id - Eliminar una cotización de insumo
router.delete('/:id', cotizacioninsumoController.deleteCotizacionInsumo);

module.exports = router;