const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const { verificarToken, admin, esAdmin, propioOAdmin } = require('../middleware/authMiddleware');
const { Cotizacion } = require('../models');

// Un cliente solo ve sus cotizaciones; el administrador ve todo.
const cotizacionPropiaOAdmin = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const cot = await Cotizacion.findByPk(req.params.id, { attributes: ['CotizacionID', 'DocumentoID'] });
        if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (String(cot.DocumentoID) !== String(req.usuario.id)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para ver esta cotización' });
        }
        next();
    } catch (e) { next(e); }
};
// Cliente: la cotizacion siempre queda a su nombre.
const cotizacionDelCliente = (req, res, next) => {
    if (!esAdmin(req)) req.body.DocumentoID = req.usuario.id;
    next();
};
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Configuración de multer para imágenes de diseños ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'disenos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
    }
});

// ── Subir imagen de diseño ──
router.post('/upload-diseno', verificarToken, upload.single('imagen'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });
    res.json({ filename: req.file.filename });
});

// ── Servir imagen por nombre ──
router.get('/imagen/:filename', cotizacionController.getImagenDiseno);

router.get('/', admin, cotizacionController.getAllCotizaciones);
router.get('/usuario/:documentoID', verificarToken, propioOAdmin('documentoID'), cotizacionController.getCotizacionesByUsuario);
router.get('/:id', verificarToken, cotizacionPropiaOAdmin, cotizacionController.getCotizacionById);
router.put('/detalle/:id', admin, require('../controllers/detallecotizacionController').updateDetalleCotizacion);
router.put('/:id', admin, cotizacionController.updateCotizacion);
router.delete('/:id', admin, cotizacionController.deleteCotizacion);
router.post('/inteligente', verificarToken, cotizacionDelCliente, cotizacionController.createCotizacionInteligente);
router.post('/completa', admin, cotizacionController.createCotizacionCompleta);
router.post('/:cotizacionID/convertir-a-venta', admin, cotizacionController.convertirCotizacionAVenta);
router.put('/:cotizacionID/cancelar', admin, cotizacionController.cancelarCotizacion);

module.exports = router;