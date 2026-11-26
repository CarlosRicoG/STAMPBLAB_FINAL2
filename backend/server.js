const db = require('./models');

const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { admin, adminParaEscritura } = require('./middleware/authMiddleware');
const { cotizacionEditable } = require('./middleware/cotizacionEditable');
const app = express();


const PORT = process.env.PORT || 3000;

// Detrás de un proxy inverso (Vercel/Render/nginx) la IP real viene en X-Forwarded-For: sin esto todos los usuarios
// comparten IP y el límite de intentos bloquearía a todos a la vez. TRUST_PROXY = número de proxies (p. ej. 1).
const trustProxy = (process.env.TRUST_PROXY || '').trim();
if (/^\d+$/.test(trustProxy)) { if (Number(trustProxy) > 0) app.set('trust proxy', Number(trustProxy)); }
else if (trustProxy && !['false', 'no'].includes(trustProxy.toLowerCase())) app.set('trust proxy', trustProxy === 'true' ? true : trustProxy);


// ==================== MIDDLEWARES ====================
// Orígenes permitidos (CORS_ORIGIN, separados por coma). En producción es obligatorio: sin él no se arranca.
const allowedOrigins = require('./config/cors').origenesPermitidos();
// Cabeceras de seguridad (las imagenes de diseños se sirven a otro origen: el frontend)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression()); // JSON y textos pesan mucho menos; las imágenes y los PDF ya vienen comprimidos y se dejan igual
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ['X-Token-Renovado']
}));

// Normaliza los mensajes de error: toda respuesta 4xx/5xx trae "message" y "mensaje"
// (el backend historicamente usaba ambos nombres y el frontend lee cualquiera de los dos)
app.use((req, res, next) => {
    const json = res.json.bind(res);
    res.json = (cuerpo) => {
        if (res.statusCode >= 400 && cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo)) {
            if (cuerpo.message && !cuerpo.mensaje) cuerpo.mensaje = cuerpo.message;
            else if (cuerpo.mensaje && !cuerpo.message) cuerpo.message = cuerpo.mensaje;
            // En producción los errores 5xx no exponen detalles internos (SQL, nombres de tablas o columnas, trazas)
            if (res.statusCode >= 500 && process.env.NODE_ENV === 'production') {
                delete cuerpo.error; delete cuerpo.stack; delete cuerpo.detalle;
            }
        }
        return json(cuerpo);
    };
    next();
});

// Los endpoints sin sesión (login, registro, recuperación) solo reciben JSON diminuto: 100 kb basta y evita que un anónimo envíe 12 MB.
// Los demás (comprobantes e imágenes de productos en base64) siguen con 12 MB.
const jsonPequeno = express.json({ limit: '100kb' });
const jsonGrande = express.json({ limit: '12mb' });
const RUTAS_SIN_SESION = new Set(['/api/login', '/api/registro', '/api/recuperar-password', '/api/restablecer-password']);
app.use((req, res, next) => (RUTAS_SIN_SESION.has(req.path) ? jsonPequeno : jsonGrande)(req, res, next));
app.use((req, res, next) => { if (req.body === undefined) req.body = {}; next(); }); // cuerpo vacío o de otro tipo: no rompe los controladores
app.use(express.urlencoded({ limit: '100kb', extended: true })); // nadie envía formularios grandes: los archivos van en JSON o multipart // antes del filtro: así también se revisan los formularios urlencoded
const saneamiento = require('./middleware/saneamiento');
app.use('/api', saneamiento.ocultarSecretos);
app.use('/api', saneamiento.rechazarHtml);
const path = require('path');
const fs = require('fs');

// Servir imágenes de diseños estáticamente
app.use('/uploads/disenos', express.static(path.join(__dirname, 'uploads', 'disenos')));
// Imágenes del catálogo (nombre aleatorio => se pueden cachear un año)
for (const carpeta of ['productos', 'tecnicas']) {
    fs.mkdirSync(path.join(__dirname, 'uploads', carpeta), { recursive: true });
    app.use('/uploads/' + carpeta, express.static(path.join(__dirname, 'uploads', carpeta), { maxAge: '365d', immutable: true }));
}

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, 'uploads', 'disenos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


// Registro de peticiones (solo fuera de producción, ver utils/log): método, ruta sin query y con los documentos
// enmascarados, estado y duración. Nunca la URL completa (podría llevar correos, documentos o tokens).
const log = require('./utils/log');
app.use((req, res, next) => {
    if (req.path === '/api/salud') return next(); // el healthcheck llama cada pocos segundos
    const inicio = process.hrtime.bigint();
    const peticion = { method: req.method, path: req.path }; // ahora: dentro de un router req.path pierde el prefijo
    res.on('finish', () => log(log.lineaPeticion(peticion, res.statusCode, Number(process.hrtime.bigint() - inicio) / 1e6)));
    next();
});


// ==================== RUTA PRINCIPAL ====================
app.get('/', (req, res) => res.json({ nombre: 'API de STAMPLAB', estado: 'ok' }));

// Salud: 200 si la base responde, 503 si no (healthcheck de docker-compose)
app.get('/api/salud', require('./routes/salud')(db.sequelize));

// ==================== IMPORTAR RUTAS ====================

// Gestión de Usuarios y Permisos
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const permisosRoutes = require('./routes/permisos');
const privilegiosRoutes = require('./routes/privilegios');
const usuariosRoutes = require('./routes/usuarios');
const rolpermisosRoutes = require('./routes/rolpermisos');
const permisoprivilegiosRoutes = require('./routes/permisoprivilegios');

// Catálogo de Productos
const productosRoutes = require('./routes/productos');
const coloresRoutes = require('./routes/colores');
const tallasRoutes = require('./routes/tallas');
const insumosRoutes = require('./routes/insumos');
const tecnicasRoutes = require('./routes/tecnicas');
const partesRoutes = require('./routes/partes');

// Relaciones de Productos
const inventarioproductoRoutes = require('./routes/inventarioproducto');

// Proveedores y Compras
const proveedoresRoutes = require('./routes/proveedores');
const comprasRoutes = require('./routes/compras');

// Cotizaciones
const cotizacionesRoutes = require('./routes/cotizaciones');
const detallecotizacionesRoutes = require('./routes/detallecotizaciones');
const cotizaciontecnicasRoutes = require('./routes/cotizaciontecnicas');
const cotizaciontallasRoutes = require('./routes/cotizaciontallas');
const cotizacioncoloresRoutes = require('./routes/cotizacioncolores');
const cotizacioninsumosRoutes = require('./routes/cotizacioninsumos');
const cotizacionPdfController = require('./controllers/cotizacionPdfController');

// Ventas
const ventasRoutes = require('./routes/ventas');
const estadosRoutes = require('./routes/estados');

// Limite de intentos FALLIDOS por IP en login/registro/recuperacion (frena fuerza bruta)
const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_MAX_FALLOS) || 15,
    // Solo cuentan los intentos que PARECEN fuerza bruta (401 credenciales malas, 403, 404 usuario inexistente).
    // Un 400 (formulario mal llenado) o un 409 (duplicado) no cuentan, ni los exitosos.
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode < 400 || res.statusCode === 400 || res.statusCode === 409,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.', estado: false }
});
app.use(['/api/login', '/api/registro', '/api/recuperar-password', '/api/restablecer-password'], limiteAuth);

// Estas dos rutas responden "bien" aunque se abuse de ellas (200 siempre / 400 por duplicado): se limitan TODAS las
// peticiones por IP para frenar el envío masivo de correos de recuperación y la creación/enumeración masiva de cuentas.
const limitePorIp = (limit, mensaje) => rateLimit({
    windowMs: 60 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
    message: { mensaje, estado: false },
});
app.use('/api/recuperar-password', limitePorIp(Number(process.env.RECUPERAR_MAX_HORA) || 5, 'Demasiadas solicitudes de recuperación. Intenta de nuevo en una hora.'));
app.use('/api/registro', limitePorIp(Number(process.env.REGISTRO_MAX_HORA) || 20, 'Demasiados registros desde esta conexión. Intenta de nuevo más tarde.'));

// ==================== USAR RUTAS ====================
// admin = token valido + rol Administrador. adminParaEscritura = lectura publica (catalogo de la tienda),
// pero crear/editar/borrar solo administradores.

// Gestión de Usuarios y Permisos
app.use('/api', authRoutes);
app.use('/api/roles', admin, rolesRoutes);
app.use('/api/permisos', admin, permisosRoutes);
app.use('/api/privilegios', admin, privilegiosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/rolpermisos', admin, rolpermisosRoutes);
app.use('/api/permisoprivilegios', admin, permisoprivilegiosRoutes);

// Catálogo de Productos
app.use('/api/productos', adminParaEscritura, productosRoutes);
app.use('/api/colores', adminParaEscritura, coloresRoutes);
app.use('/api/tallas', adminParaEscritura, tallasRoutes);
app.use('/api/insumos', adminParaEscritura, insumosRoutes);
app.use('/api/tecnicas', adminParaEscritura, tecnicasRoutes);
app.use('/api/partes', adminParaEscritura, partesRoutes);

// Relaciones de Productos
app.use('/api/inventarioproducto', adminParaEscritura, inventarioproductoRoutes);

// Proveedores y Compras
app.use('/api/proveedores', admin, proveedoresRoutes);
app.use('/api/compras', admin, comprasRoutes);

// Cotizaciones
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/detallecotizaciones', admin, cotizacionEditable('DetalleCotizacion'), detallecotizacionesRoutes);
app.use('/api/cotizaciontecnicas', admin, cotizacionEditable('CotizacionTecnica'), cotizaciontecnicasRoutes);
app.use('/api/cotizaciontallas', admin, cotizacionEditable('CotizacionTalla'), cotizaciontallasRoutes);
app.use('/api/cotizacioncolores', admin, cotizacionEditable('CotizacionColor'), cotizacioncoloresRoutes);
app.use('/api/cotizacioninsumos', admin, cotizacionEditable('CotizacionInsumo'), cotizacioninsumosRoutes);

// Agrega esta línea después del bloque de cotizaciones
app.get('/api/cotizaciones/:cotizacionID/pdf', admin, cotizacionPdfController.descargarPdfCotizacion);

// Ventas
app.use('/api/ventas', ventasRoutes);
app.use('/api/estados', adminParaEscritura, estadosRoutes);

// Mejoras de flujo: notificaciones (campana), bandeja del administrador, tarifas, carrito y configuración pública
app.get('/api/config-publica', (req, res) => res.json(require('./services/config').leer()));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/resumen', admin, require('./routes/resumen'));
app.use('/api/tarifas', require('./routes/tarifas'));
app.use('/api/carrito', require('./routes/carrito'));

// Buzón de pruebas (solo con MAIL_MODO=archivo y fuera de producción): lista los últimos correos "enviados"
if (require('./services/correo').modo() === 'archivo') {
    app.get('/api/correos-prueba', admin, (req, res) => res.json({ datos: require('./services/correo').buzon }));
}

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Error interno del servidor (500)
app.use((err, req, res, next) => {
    const estado = err.status || err.statusCode;
    if (estado >= 400 && estado < 500) {
        const mensaje = estado === 413 ? 'El contenido enviado es demasiado grande' : 'La solicitud no es válida';
        return res.status(estado).json({ message: mensaje, mensaje });
    }
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
    });
});

// ==================== INICIAR SERVIDOR ====================
db.sequelize.authenticate()
    .then(() => {
        console.log(`Conexión a la base de datos ${db.sequelize.config.database} exitosa`);
        const servidor = app.listen(PORT, () => {
            const vencimientos = require('./services/vencimientos');
            const limpiezaDisenos = require('./services/limpiezaDisenos');
            vencimientos.iniciar(); // cancela pedidos sin pago y vence cotizaciones cada hora
            limpiezaDisenos.iniciar(); // borra imágenes de diseño subidas y nunca usadas
            require('./services/apagado').instalarApagado({
                servidor, sequelize: db.sequelize, detener: [vencimientos.detener, limpiezaDisenos.detener],
            });
            console.log(`STAMPLAB API escuchando en el puerto ${PORT} (${process.env.NODE_ENV || 'development'})`);
        });
    }).catch(err => {
        console.error('Error al conectar con la base de datos:', err);
        process.exit(1);
    });
