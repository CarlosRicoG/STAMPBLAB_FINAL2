const express = require('express');
const router = express.Router();
const tecnicaController = require('../controllers/tecnicaController');

router.get('/', tecnicaController.getAllTecnicas);
router.get('/:id', tecnicaController.getTecnicaById);
router.post('/', tecnicaController.createTecnica);
router.put('/:id', tecnicaController.updateTecnica);
router.delete('/:id', tecnicaController.deleteTecnica);

module.exports = router;
