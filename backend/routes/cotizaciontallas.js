const express = require('express');
const router = express.Router();
const cotizaciontallaController = require('../controllers/cotizaciontallaController');

// GET /api/cotizaciontallas - Obtener todas las cotizaciones de tallas
router.get('/', cotizaciontallaController.getAllCotizacionTallas);

// GET /api/cotizaciontallas/:id - Obtener una cotización de talla por ID
router.get('/:id', cotizaciontallaController.getCotizacionTallaById);

// POST /api/cotizaciontallas - Crear una cotización de talla
router.post('/', cotizaciontallaController.createCotizacionTalla);

// PUT /api/cotizaciontallas/:id - Actualizar una cotización de talla
router.put('/:id', cotizaciontallaController.updateCotizacionTalla);

// DELETE /api/cotizaciontallas/:id - Eliminar una cotización de talla
router.delete('/:id', cotizaciontallaController.deleteCotizacionTalla);

module.exports = router;