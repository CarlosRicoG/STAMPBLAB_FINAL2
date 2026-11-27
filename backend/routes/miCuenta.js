// routes/miCuenta.js — derechos del titular de los datos (Ley 1581 de 2012): acceso y supresión de la propia cuenta
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const miCuenta = require('../controllers/miCuentaController');

// La supresión pide la contraseña: con una sesión robada se podría intentar adivinarla. Se cuentan solo los intentos
// con contraseña incorrecta (403), por usuario (aunque cambie de IP); además server.js la limita por IP (limiteAuth).
const crearLimiteSupresion = () => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.SUPRIMIR_MAX_FALLOS) > 0 ? Number(process.env.SUPRIMIR_MAX_FALLOS) : 5,
    keyGenerator: (req) => 'suprimir:' + String(req.usuario?.id),
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode !== 403,
    standardHeaders: true, legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos con una contraseña incorrecta. Intenta de nuevo en unos minutos.', estado: false },
});

// GET /api/mi-cuenta/datos — descarga (JSON) de todos los datos propios
router.get('/datos', verificarToken, miCuenta.descargarDatos);

// POST /api/mi-cuenta/suprimir — { Contraseña } — elimina la cuenta y anonimiza los datos personales
router.post('/suprimir', verificarToken, crearLimiteSupresion(), miCuenta.suprimirCuenta);

module.exports = router;
module.exports.crearLimiteSupresion = crearLimiteSupresion;
