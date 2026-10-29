/**
 * Dos defensas generales para toda la API:
 *  - rechazarHtml: ningún texto que llegue en el cuerpo puede traer etiquetas HTML (evita XSS almacenado).
 *  - ocultarSecretos: ninguna respuesta puede incluir hashes de contraseña ni datos internos de sesión,
 *    aunque un controlador olvide excluirlos.
 */
// Una sola clase repetida (sin cuantificadores anidados): evita el retroceso exponencial con cadenas enormes
const ETIQUETA = /<[\s/]*[a-zA-Z!?]/;
const CLAVES_LIBRES = new Set(['Contraseña', 'password', 'nuevaContraseña']); // las contraseñas pueden llevar cualquier símbolo
const SECRETOS = new Set(['Contraseña', 'SesionesVersion']);

function contieneHtml(valor, profundidad = 0) {
    if (profundidad > 12) return false;
    if (typeof valor === 'string') return ETIQUETA.test(valor); // se revisa el texto completo, sea cual sea su longitud
    if (Array.isArray(valor)) return valor.some((v) => contieneHtml(v, profundidad + 1));
    if (valor && typeof valor === 'object') return Object.entries(valor).some(([k, v]) => !CLAVES_LIBRES.has(k) && contieneHtml(v, profundidad + 1));
    return false;
}

function rechazarHtml(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && contieneHtml(req.body)) {
        const mensaje = 'El texto no puede contener etiquetas HTML (por ejemplo < o >).';
        return res.status(400).json({ estado: false, message: mensaje, mensaje, error: mensaje });
    }
    next();
}

function sinSecretos(valor, profundidad = 0) {
    if (profundidad > 15) return valor;
    if (Array.isArray(valor)) return valor.map((v) => sinSecretos(v, profundidad + 1));
    if (valor && typeof valor === 'object' && !(valor instanceof Date) && !Buffer.isBuffer(valor)) {
        const limpio = {};
        for (const k of Object.keys(valor)) if (!SECRETOS.has(k)) limpio[k] = sinSecretos(valor[k], profundidad + 1);
        return limpio;
    }
    return valor;
}

function ocultarSecretos(req, res, next) {
    const original = res.json.bind(res);
    res.json = (cuerpo) => {
        if (cuerpo === undefined || cuerpo === null) return original(cuerpo);
        let plano;
        try { plano = JSON.parse(JSON.stringify(cuerpo)); } catch { return original(cuerpo); }
        return original(sinSecretos(plano));
    };
    next();
}

module.exports = { rechazarHtml, ocultarSecretos, contieneHtml, sinSecretos };
