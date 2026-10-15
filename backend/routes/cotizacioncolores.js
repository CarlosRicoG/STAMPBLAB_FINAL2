const express = require('express');
const router = express.Router();
const cotizacioncolorController = require('../controllers/cotizacioncolorController');

// GET /api/cotizacioncolores - Obtener todas las cotizaciones de colores
router.get('/', cotizacioncolorController.getAllCotizacionColores);

// GET /api/cotizacioncolores/:id - Obtener una cotización de color por ID
router.get('/:id', cotizacioncolorController.getCotizacionColorById);

// POST /api/cotizacioncolores - Crear una cotización de color
router.post('/', cotizacioncolorController.createCotizacionColor);

// PUT /api/cotizacioncolores/:id - Actualizar una cotización de color
router.put('/:id', cotizacioncolorController.updateCotizacionColor);

// DELETE /api/cotizacioncolores/:id - Eliminar una cotización de color
router.delete('/:id', cotizacioncolorController.deleteCotizacionColor);

module.exports = router;