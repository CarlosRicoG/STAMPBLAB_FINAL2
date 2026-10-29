const { validar, esquemas } = require('../middleware/validar');
const { ESTADO_VENTA } = require('../config/estados');
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { verificarToken, admin, esAdmin } = require('../middleware/authMiddleware');
const facturaController = require('../controllers/facturaController');
const { Venta, Producto, Talla } = require('../models');

// Un cliente solo ve y crea SUS ventas; el administrador ve todo.
const soloSuyas = (req, res, next) => {
    if (!esAdmin(req)) req.documentoForzado = String(req.usuario.id); // (req.query es de solo lectura en Express 5)
    next();
};
const ventaPropiaOAdmin = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const venta = await Venta.findByPk(req.params.id, { attributes: ['VentaID', 'DocumentoID'] });
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
        if (String(venta.DocumentoID) !== String(req.usuario.id)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para ver esta venta' });
        }
        next();
    } catch (e) { next(e); }
};

// Un cliente solo puede cancelar SU pedido mientras siga Pendiente (el admin puede en cualquier momento).
const soloPendienteSiCliente = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        const venta = await Venta.findByPk(req.params.id, { attributes: ['VentaID', 'EstadoID'] });
        if (venta && venta.EstadoID !== ESTADO_VENTA.PENDIENTE) {
            return res.status(400).json({ message: 'Solo puedes cancelar pedidos que aún estén pendientes. Contáctanos si ya está en proceso.' });
        }
        next();
    } catch (e) { next(e); }
};
// Cliente: la venta queda a su nombre y siempre en estado Pendiente (8); no puede darse un estado a si mismo.
const ventaDelCliente = (req, res, next) => {
    if (!esAdmin(req)) { req.body.DocumentoID = String(req.usuario.id); req.body.EstadoID = ESTADO_VENTA.PENDIENTE; }
    next();
};

// Cliente: el precio no se confía al navegador. Cada línea debe costar al menos precio base + talla del catálogo
// (la tela puede sumar más) y el subtotal/total se recalculan aquí, no se toman de lo que envíe el cliente.
const preciosDelCliente = async (req, res, next) => {
    try {
        if (esAdmin(req)) return next();
        let suma = 0;
        for (const d of req.body.detalles || []) {
            // Todo producto del cliente sale de una variante (color y talla): así siempre se valida y descuenta stock
            if (!d.ColorID || !d.TallaID) {
                return res.status(400).json({ message: 'Cada producto del pedido debe indicar color y talla' });
            }
            delete d.TraePrenda; // el cliente no puede marcar líneas como "prenda propia" para saltarse el inventario
            const producto = await Producto.findByPk(d.ProductoID, { attributes: ['ProductoID', 'PrecioBase'] });
            if (!producto) return res.status(404).json({ message: `Producto ${d.ProductoID} no encontrado` });
            const talla = d.TallaID ? await Talla.findByPk(d.TallaID, { attributes: ['Precio'] }) : null;
            const minimo = (parseFloat(producto.PrecioBase) || 0) + (parseFloat(talla?.Precio) || 0);
            const unitario = Number(d.PrecioUnitario);
            if (!Number.isFinite(unitario) || unitario + 0.5 < minimo) {
                return res.status(400).json({ message: 'El precio de un producto no coincide con el catálogo. Actualiza la página e inténtalo de nuevo.' });
            }
            suma += unitario * Number(d.Cantidad);
        }
        req.body.Subtotal = suma;
        req.body.Total = suma;
        next();
    } catch (e) { next(e); }
};

router.get('/dashboard', admin, ventaController.getDashboardData);
router.get('/dashboard/data', admin, ventaController.getDashboardData);

// GET /api/ventas - Obtener todas las ventas
router.get('/', verificarToken, soloSuyas, ventaController.getAllVentas);

// GET /api/ventas/:id - Obtener una venta por ID
router.get('/:id', verificarToken, ventaPropiaOAdmin, ventaController.getVentaById);

// POST /api/ventas - Crear una nueva venta con detalles
router.post('/', verificarToken, ventaDelCliente, validar(esquemas.venta), preciosDelCliente, ventaController.crearVenta);

// PUT /api/ventas/:id - Actualizar una venta
router.put('/:id', admin, validar(esquemas.ventaEdicion), ventaController.updateVenta);

// DELETE /api/ventas/:id - Eliminar una venta
router.delete('/:id', admin, ventaController.deleteVenta);


// Actualizar solo el estado (con lógica de devolución de stock)
router.patch('/:id/estado', admin, ventaController.updateEstadoVenta);

// Seguimiento y comprobante de pago
router.get('/:id/historial', verificarToken, ventaPropiaOAdmin, ventaController.historial);
router.patch('/:id/rechazar-comprobante', admin, ventaController.rechazarComprobante);
router.patch('/:id/comprobante', verificarToken, ventaPropiaOAdmin, ventaController.subirComprobante);

// GET /api/ventas/:id/factura - comprobante de venta en PDF (el dueño del pedido o un administrador)
router.get('/:id/factura', verificarToken, ventaPropiaOAdmin, facturaController.descargarComprobante);

// PATCH /api/ventas/:id/cancelar - cancelar un pedido (devuelve el stock si estaba pendiente)
router.patch('/:id/cancelar', verificarToken, ventaPropiaOAdmin, soloPendienteSiCliente, (req, res) => {
    req.body = { EstadoID: ESTADO_VENTA.CANCELADA };
    return ventaController.updateEstadoVenta(req, res);
});


module.exports = router;