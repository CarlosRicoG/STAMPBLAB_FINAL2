const db = require('./models');

const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { admin, adminParaEscritura } = require('./middleware/authMiddleware');
const app = express();


const PORT = process.env.PORT || 3000;


// ==================== MIDDLEWARES ====================
// Orígenes permitidos (CORS_ORIGIN, separados por coma)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,https://stamp-lab-proyecto.vercel.app')
    .split(',').map(o => o.trim());
// Cabeceras de seguridad (las imagenes de diseños se sirven a otro origen: el frontend)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const path = require('path');
const fs = require('fs');

// Servir imágenes de diseños estáticamente
app.use('/uploads/disenos', express.static(path.join(__dirname, 'uploads', 'disenos')));

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, 'uploads', 'disenos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


// Middleware para logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// ==================== RUTA PRINCIPAL ====================
app.get('/', (req, res) => {
    res.json({
        message: 'API de STAMPLAB funcionando correctamente',
        version: '1.0.0',
        documentacion: 'https://tu-dominio.com/api-docs',
        endpoints: {
            // Gestión de Usuarios y Permisos
            roles: '/api/roles',
            permisos: '/api/permisos',
            privilegios: '/api/privilegios',
            usuarios: '/api/usuarios',
            rolpermisos: '/api/rolpermisos',
            permisoprivilegios: '/api/permisoprivilegios',

            // Catálogo de Productos
            productos: '/api/productos',
            colores: '/api/colores',
            tallas: '/api/tallas',
            insumos: '/api/insumos',
            tecnicas: '/api/tecnicas',
            partes: '/api/partes',

            // Relaciones de Productos
            inventarioproducto: '/api/inventarioproducto',

            // Proveedores y Compras
            proveedores: '/api/proveedores',
            compras: '/api/compras',
            detallecompras: '/api/detallecompras',

            // Cotizaciones
            cotizaciones: '/api/cotizaciones',
            detallecotizaciones: '/api/detallecotizaciones',
            cotizaciontecnicas: '/api/cotizaciontecnicas',
            cotizaciontallas: '/api/cotizaciontallas',
            cotizacioncolores: '/api/cotizacioncolores',
            cotizacioninsumos: '/api/cotizacioninsumos',


            // Ventas
            ventas: '/api/ventas',
            detalleventas: '/api/detalleventas',
            estados: '/api/estados'
        }
    });
});

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
const detallecomprasRoutes = require('./routes/detallecompras');

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
const detalleventasRoutes = require('./routes/detalleventas');
const estadosRoutes = require('./routes/estados');

// Limite de intentos FALLIDOS por IP en login/registro/recuperacion (frena fuerza bruta)
const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_MAX_FALLOS) || 15,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.', estado: false }
});
app.use(['/api/login', '/api/registro', '/api/recuperar-password', '/api/restablecer-password', '/api/usuarios/login'], limiteAuth);

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
app.use('/api/detallecompras', admin, detallecomprasRoutes);

// Cotizaciones
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/detallecotizaciones', admin, detallecotizacionesRoutes);
app.use('/api/cotizaciontecnicas', admin, cotizaciontecnicasRoutes);
app.use('/api/cotizaciontallas', admin, cotizaciontallasRoutes);
app.use('/api/cotizacioncolores', admin, cotizacioncoloresRoutes);
app.use('/api/cotizacioninsumos', admin, cotizacioninsumosRoutes);

// Agrega esta línea después del bloque de cotizaciones
app.get('/api/cotizaciones/:cotizacionID/pdf', admin, cotizacionPdfController.descargarPdfCotizacion);

// Ventas
app.use('/api/ventas', ventasRoutes);
app.use('/api/detalleventas', admin, detalleventasRoutes);
app.use('/api/estados', adminParaEscritura, estadosRoutes);

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint no encontrado',
        path: req.url,
        sugerencia: 'Revisa la documentación en http://localhost:3000/'
    });
});

// Error interno del servidor (500)
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
    });
});

// ==================== INICIAR SERVIDOR ====================
db.sequelize.authenticate()
    .then(() => {
        console.log('Conexión a la base de datos exitosa');

        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('SERVIDOR STAMPLAB INICIADO CORRECTAMENTE');
            console.log('='.repeat(60));
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Base de datos: ${db.sequelize.config.database}`);
            console.log(`Dialect: ${db.sequelize.options.dialect}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(60));
            console.log('ENDPOINTS DISPONIBLES:');
            console.log('');
            console.log('Usuarios y Permisos:');
            console.log('   • http://localhost:' + PORT + '/api/roles');
            console.log('   • http://localhost:' + PORT + '/api/permisos');
            console.log('   • http://localhost:' + PORT + '/api/privilegios');
            console.log('   • http://localhost:' + PORT + '/api/usuarios');
            console.log('');
            console.log('Catálogo:');
            console.log('   • http://localhost:' + PORT + '/api/productos');
            console.log('   • http://localhost:' + PORT + '/api/colores');
            console.log('   • http://localhost:' + PORT + '/api/tallas');
            console.log('   • http://localhost:' + PORT + '/api/insumos');
            console.log('   • http://localhost:' + PORT + '/api/tecnicas');
            console.log('');
            console.log('Compras y Proveedores:');
            console.log('   • http://localhost:' + PORT + '/api/proveedores');
            console.log('   • http://localhost:' + PORT + '/api/compras');
            console.log('');
            console.log('Cotizaciones:');
            console.log('   • http://localhost:' + PORT + '/api/cotizaciones');
            console.log('   • http://localhost:' + PORT + '/api/detallecotizaciones');
            console.log('');
            console.log('Ventas:');
            console.log('   • http://localhost:' + PORT + '/api/ventas');
            console.log('   • http://localhost:' + PORT + '/api/detalleventas');
            console.log('');
            console.log('='.repeat(60));
            console.log('Todo listo para recibir peticiones');
            console.log('='.repeat(60) + '\n');
        });
    }).catch(err => {
        console.error('Error al conectar con la base de datos:', err);
        process.exit(1);
    });

