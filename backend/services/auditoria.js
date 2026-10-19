/**
 * Auditoría: registra QUIÉN hizo QUÉ y CUÁNDO en toda acción que modifica datos (POST/PUT/PATCH/DELETE)
 * hecha por un usuario con sesión. Se guarda en la tabla `auditoria` sin bloquear la respuesta.
 *
 *  - Solo se registran respuestas exitosas (2xx/3xx) y los intentos prohibidos (403) de usuarios autenticados.
 *  - Nunca se guardan contraseñas, tokens, comprobantes ni imágenes: se redactan antes de escribir.
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');
const db = require('../models');

const METODOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Rutas que no se auditan (autenticación propia o ruido)
const OMITIR = /^\/(login|registro|logout|recuperar-password|restablecer-password|usuarios\/login|cotizaciones\/upload-diseno)(\/|$)/;
const SECRETO = /contrase|password|token|comprobante|imagen|base64|firma/i;

/** Resumen seguro del cuerpo de la petición. */
function resumir(valor, profundidad = 0) {
    if (valor === null || valor === undefined) return valor;
    if (typeof valor === 'string') return valor.length > 120 ? valor.slice(0, 120) + '…' : valor;
    if (typeof valor !== 'object') return valor;
    if (Array.isArray(valor)) return profundidad >= 2 ? `[${valor.length} elementos]` : valor.slice(0, 5).map((v) => resumir(v, profundidad + 1)).concat(valor.length > 5 ? [`… +${valor.length - 5}`] : []);
    if (profundidad >= 2) return '{…}';
    const salida = {};
    for (const [k, v] of Object.entries(valor)) salida[k] = SECRETO.test(k) ? '***' : resumir(v, profundidad + 1);
    return salida;
}

/** Busca el primer campo numérico que termine en "ID" en la respuesta (p. ej. venta.VentaID) para saber qué se creó. */
function idCreado(cuerpo, profundidad = 0) {
    if (!cuerpo || typeof cuerpo !== 'object' || profundidad > 2) return null;
    for (const [k, v] of Object.entries(cuerpo)) {
        // La clave primaria es siempre el primer campo *ID del objeto (p. ej. venta.VentaID)
        if (/ID$/.test(k) && (typeof v === 'number' || /^\d+$/.test(String(v)))) return String(v);
    }
    for (const v of Object.values(cuerpo)) {
        const r = idCreado(v, profundidad + 1);
        if (r) return r;
    }
    return null;
}

function middleware() {
    return (req, res, next) => {
        if (!METODOS.has(req.method)) return next();

        // Se captura el cuerpo de la respuesta para conocer el ID de lo que se creó
        let respuesta;
        const json = res.json.bind(res);
        res.json = (c) => { respuesta = c; return json(c); };

        res.on('finish', () => {
            try {
                const ruta = (req.originalUrl || req.url).split('?')[0].replace(/^\/api/, '');
                if (OMITIR.test(ruta)) return;
                const exito = res.statusCode < 400;
                if (!exito && res.statusCode !== 403) return;

                const token = (req.headers.authorization || '').replace('Bearer ', '');
                if (!token) return;
                let datos;
                try { datos = jwt.verify(token, JWT_SECRET); } catch { return; }
                if (datos.tipo) return;

                const partes = ruta.split('/').filter(Boolean);
                const entidad = partes[0] || null;
                let entidadId = partes[1] && !/^(dashboard|estado|inteligente|completa|util|usuario|imagen|detalle|producto)$/i.test(partes[1]) ? partes[1] : null;
                if (!entidadId && req.method === 'POST' && exito) entidadId = idCreado(respuesta);
                const accion = partes.slice(2).join('/') || null;

                const detalle = JSON.stringify({ ...(accion ? { accion } : {}), ...(Object.keys(req.body || {}).length ? { cuerpo: resumir(req.body) } : {}) });
                db.Auditoria.create({
                    DocumentoID: datos.id, Rol: datos.rol, Metodo: req.method, Ruta: ruta.slice(0, 255),
                    Entidad: entidad && entidad.slice(0, 60), EntidadID: entidadId && String(entidadId).slice(0, 60),
                    Estado: res.statusCode, Detalle: detalle.length > 1500 ? detalle.slice(0, 1500) + '…' : detalle,
                    IP: (req.ip || '').slice(0, 64),
                }).catch((e) => console.error('No se pudo registrar la auditoría:', e.message));
            } catch (e) {
                console.error('Error en auditoría:', e.message);
            }
        });
        next();
    };
}

module.exports = { middleware, resumir, idCreado };
