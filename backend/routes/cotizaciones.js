const { validar, esquemas } = require('../middleware/validar');
const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const { verificarToken, admin, esAdmin, propioOAdmin } = require('../middleware/authMiddleware');
const { Cotizacion, Tecnica, Parte } = require('../models');
const { ESTADO_COTIZACION } = require('../config/estados');

const { historialDesde, visible, historialDelCliente, cuentaActiva } = require('../services/historialCliente');
// Cotización del titular anterior de una cuenta suprimida (cliente que se volvió a registrar): para él no existe
const delHistorialVisible = async (cot, req) => visible(cot.FechaCotizacion, await historialDesde(req.usuario.id));

// Un cliente solo ve sus cotizaciones; el administrador ve todo.
const cotizacionPropiaOAdmin = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const cot = await Cotizacion.findByPk(req.params.id, { attributes: ['CotizacionID', 'DocumentoID', 'FechaCotizacion'] });
        if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (String(cot.DocumentoID) !== String(req.usuario.id)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para ver esta cotización' });
        }
        if (!(await delHistorialVisible(cot, req))) return res.status(404).json({ message: 'Cotización no encontrada' });
        next();
    } catch (e) { next(e); }
};
// Cliente: la cotizacion siempre queda a su nombre.
const noExiste = 'La técnica o la parte del diseño no existe. Actualiza la página e inténtalo de nuevo.';
const cotizacionDelCliente = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        req.body.DocumentoID = req.usuario.id;
        delete req.body.FechaCotizacion; // la fecha la pone el servidor (de ella dependen la vigencia y los plazos)
        const tecnicasIDs = new Set(), partesIDs = new Set();
        for (const d of Array.isArray(req.body.detalles) ? req.body.detalles : []) {
            if (!d || typeof d !== 'object') continue;
            delete d.PrecioUnitario; // el cliente no fija precios
            for (const t of Array.isArray(d.tecnicas) ? d.tecnicas : []) {
                if (!t || typeof t !== 'object') continue;
                t.CostoTecnica = 0; // lo asigna el administrador al revisar el diseño
                // La imagen del diseño es el nombre de un archivo subido antes con /upload-diseno, nunca una URL ni una ruta
                for (const campo of ['ImagenDiseño', 'ImagenDiseno']) {
                    if (t[campo] != null && t[campo] !== '' && !/^[\w.-]{1,120}$/.test(String(t[campo]))) {
                        return res.status(400).json({ message: 'La imagen del diseño no es válida. Vuelve a subirla e inténtalo de nuevo.' });
                    }
                }
                if (t.TecnicaID == null || t.ParteID == null) return res.status(400).json({ message: noExiste });
                tecnicasIDs.add(t.TecnicaID); partesIDs.add(t.ParteID);
            }
        }
        // Una consulta por tabla (antes eran dos por diseño): todas las técnicas y partes citadas deben existir
        if (tecnicasIDs.size) {
            const [tecnicas, partes] = await Promise.all([
                Tecnica.findAll({ where: { TecnicaID: [...tecnicasIDs] }, attributes: ['TecnicaID'], raw: true }),
                Parte.findAll({ where: { ParteID: [...partesIDs] }, attributes: ['ParteID'], raw: true }),
            ]);
            const hay = (filas, campo, ids) => { const s = new Set(filas.map((f) => String(f[campo]))); return [...ids].every((id) => s.has(String(id))); };
            if (!hay(tecnicas, 'TecnicaID', tecnicasIDs) || !hay(partes, 'ParteID', partesIDs)) return res.status(400).json({ message: noExiste });
        }
        next();
    } catch (e) { next(e); }
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
        // Extensión Y tipo declarado deben ser de imagen (JPG, PNG, GIF, WEBP)
        const extensionOk = /^\.(jpe?g|png|gif|webp)$/.test(path.extname(file.originalname).toLowerCase());
        const tipoOk = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
        if (extensionOk && tipoOk) return cb(null, true);
        cb(new Error('Formato no permitido: sube una imagen JPG, PNG, GIF o WEBP'));
    }
});

// Convierte los errores de multer (formato, tamaño) en respuestas 400 claras
const subirImagen = (req, res, next) => upload.single('imagen')(req, res, (err) => {
    if (!err) return next();
    const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el máximo permitido de 5 MB' : err.message;
    return res.status(400).json({ message: mensaje, mensaje });
});

// Límite de subidas de diseños por usuario (no por IP): DISENOS_MAX_HORA por hora (30 por defecto).
// Cada subida ocupa disco hasta que la limpieza periódica borra las que no se usaron (services/limpiezaDisenos).
const rateLimit = require('express-rate-limit');
const crearLimiteDisenos = () => rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.DISENOS_MAX_HORA) > 0 ? Number(process.env.DISENOS_MAX_HORA) : 30,
    keyGenerator: (req) => 'usuario:' + String(req.usuario?.id),
    skip: (req) => esAdmin(req), // el administrador no tiene límite (carga diseños desde el panel)
    standardHeaders: true, legacyHeaders: false,
    message: { message: 'Has subido demasiadas imágenes en la última hora. Intenta de nuevo más tarde.', mensaje: 'Has subido demasiadas imágenes en la última hora. Intenta de nuevo más tarde.', estado: false },
});
const limiteDisenos = crearLimiteDisenos();

// ── Subir imagen de diseño ──
router.post('/upload-diseno', verificarToken, limiteDisenos, subirImagen, (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });
    res.json({ filename: req.file.filename });
});

// ── Servir imagen por nombre ──
router.get('/imagen/:filename', cotizacionController.getImagenDiseno);

router.get('/', admin, cotizacionController.getAllCotizaciones);
router.get('/usuario/:documentoID', verificarToken, propioOAdmin('documentoID'), historialDelCliente, cotizacionController.getCotizacionesByUsuario);
router.get('/:id/historial', verificarToken, cotizacionPropiaOAdmin, cotizacionController.historialCotizacion);
router.get('/:id', verificarToken, cotizacionPropiaOAdmin, cotizacionController.getCotizacionById);
router.put('/:id', admin, cotizacionController.updateCotizacion);
router.delete('/:id', admin, cotizacionController.deleteCotizacion);
// Se valida ANTES de cotizacionDelCliente: así las listas ya vienen acotadas (100 productos, 20 diseños) al consultar la base
router.post('/inteligente', verificarToken, cuentaActiva, validar(esquemas.cotizacion), cotizacionDelCliente, cotizacionController.createCotizacionInteligente);
router.post('/completa', admin, validar(esquemas.cotizacion), cotizacionController.createCotizacionCompleta);
router.post('/:cotizacionID/convertir-a-venta', admin, cotizacionController.convertirCotizacionAVenta);
// El administrador cancela cualquiera; el cliente solo la suya y mientras siga Pendiente
const cancelarPropiaOAdmin = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const cot = await Cotizacion.findByPk(req.params.cotizacionID, { attributes: ['CotizacionID', 'DocumentoID', 'EstadoID', 'FechaCotizacion'] });
        if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (String(cot.DocumentoID) !== String(req.usuario.id)) return res.status(403).json({ mensaje: 'No tienes permiso para modificar esta cotización' });
        if (!(await delHistorialVisible(cot, req))) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (cot.EstadoID !== ESTADO_COTIZACION.PENDIENTE) {
            return res.status(400).json({ message: 'Solo puedes cancelar cotizaciones que aún estén pendientes. Contáctanos si ya está en proceso.' });
        }
        next();
    } catch (e) { next(e); }
};
router.put('/:cotizacionID/cancelar', verificarToken, cancelarPropiaOAdmin, cotizacionController.cancelarCotizacion);

// El cliente responde a una cotización aprobada (acepta = se crea el pedido; rechaza); línea de tiempo; tarifas
const respuestaPropia = async (req, res, next) => {
    try {
        const cot = await Cotizacion.findByPk(req.params.cotizacionID, { attributes: ['CotizacionID', 'DocumentoID', 'EstadoID', 'FechaCotizacion'] });
        if (!cot) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (String(cot.DocumentoID) !== String(req.usuario.id)) return res.status(403).json({ mensaje: 'No tienes permiso para responder esta cotización' });
        if (!(await delHistorialVisible(cot, req))) return res.status(404).json({ message: 'Cotización no encontrada' });
        if (cot.EstadoID !== ESTADO_COTIZACION.APROBADA) return res.status(400).json({ message: 'Solo puedes responder cotizaciones que ya tienen precio (aprobadas)' });
        next();
    } catch (e) { next(e); }
};
router.post('/:cotizacionID/aceptar', verificarToken, respuestaPropia, cotizacionController.aceptarCotizacion);
router.post('/:cotizacionID/rechazar', verificarToken, respuestaPropia, cotizacionController.rechazarCotizacion);
router.post('/:cotizacionID/aplicar-tarifas', admin, cotizacionController.aplicarTarifas);

module.exports = router;
module.exports.cotizacionDelCliente = cotizacionDelCliente;
module.exports.crearLimiteDisenos = crearLimiteDisenos;
module.exports.cotizacionPropiaOAdmin = cotizacionPropiaOAdmin;
module.exports.cancelarPropiaOAdmin = cancelarPropiaOAdmin;
module.exports.respuestaPropia = respuestaPropia;