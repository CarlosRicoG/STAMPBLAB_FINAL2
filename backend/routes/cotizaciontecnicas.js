const express = require('express');
const router = express.Router();
const cotizaciontecnicaController = require('../controllers/cotizaciontecnicaController');

// GET /api/cotizaciontecnicas - Obtener todas las cotizaciones de técnicas
router.get('/', cotizaciontecnicaController.getAllCotizacionTecnicas);

// GET /api/cotizaciontecnicas/:id - Obtener una cotización de técnica por ID
router.get('/:id', cotizaciontecnicaController.getCotizacionTecnicaById);

// POST /api/cotizaciontecnicas - Crear una cotización de técnica
router.post('/', cotizaciontecnicaController.createCotizacionTecnica);

// PUT /api/cotizaciontecnicas/:id - Actualizar una cotización de técnica
router.put('/:id', cotizaciontecnicaController.updateCotizacionTecnica);

// DELETE /api/cotizaciontecnicas/:id - Eliminar una cotización de técnica
router.delete('/:id', cotizaciontecnicaController.deleteCotizacionTecnica);

module.exports = router;