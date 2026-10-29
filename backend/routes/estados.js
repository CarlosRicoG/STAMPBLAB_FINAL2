const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estadoController');

// Los estados se cargan con `node scripts/seed-base.js` (IDs fijos de config/estados.js); no hay ruta pública para crearlos.

router.get('/',estadoController.getAllEstados);
router.get('/tipo/:tipo', estadoController.getEstadosByTipo);
router.get('/:id', estadoController.getEstadoById);
router.post('/', estadoController.createEstado);
router.put('/:id', estadoController.updateEstado);
router.delete('/:id', estadoController.deleteEstado);

module.exports = router;