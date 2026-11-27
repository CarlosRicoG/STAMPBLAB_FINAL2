// Log de depuracion: solo en desarrollo (silencioso con NODE_ENV=production). Los errores siguen usando console.error.
const log = (...args) => {
    if (process.env.NODE_ENV !== 'production') console.log(...args);
};

// Ruta sin query y sin documentos (secuencias de 5 o más dígitos: Joi admite documentos desde 5)
log.enmascararRuta = (ruta) => String(ruta || '').split('?')[0].replace(/\d{5,}/g, '***');

// juan.perez@dominio.com -> ju***@dominio.com
log.enmascararCorreo = (correo) => {
    const m = /^([^@\s]+)@([^@\s]+)$/.exec(String(correo || '').trim());
    if (!m) return '***';
    return m[1].slice(0, m[1].length > 2 ? 2 : 1) + '***@' + m[2];
};

// "GET /api/usuarios/*** 200 12ms"
log.lineaPeticion = (req, estado, ms) => `${req.method} ${log.enmascararRuta(req.path)} ${estado} ${Math.round(ms)}ms`;

module.exports = log;
