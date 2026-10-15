const { CotizacionProducto, DetalleCotizacion, Producto } = require('../models');

// Obtener todas las cotizaciones de productos
exports.getAllCotizacionProductos = async (req, res) => {
    try {
        const cotizacionProductos = await CotizacionProducto.findAll({
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Producto, as: 'producto' }
            ]
        });
        res.json(cotizacionProductos);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotizaciones de productos',
            error: error.message
        });
    }
};

// Obtener una cotización de producto por ID
exports.getCotizacionProductoById = async (req, res) => {
    try {
        const cotizacionProducto = await CotizacionProducto.findByPk(req.params.id, {
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Producto, as: 'producto' }
            ]
        });

        if (!cotizacionProducto) {
            return res.status(404).json({ message: 'Cotización de producto no encontrada' });
        }

        res.json(cotizacionProducto);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotización de producto',
            error: error.message
        });
    }
};

// Crear una cotización de producto
exports.createCotizacionProducto = async (req, res) => {
    try {
        const { DetalleCotizacionID, ProductoID, Cantidad, PrecioUnitario, Subtotal } = req.body;

        const nuevaCotizacionProducto = await CotizacionProducto.create({
            DetalleCotizacionID,
            ProductoID,
            Cantidad,
            PrecioUnitario,
            Subtotal
        });

        res.status(201).json({
            message: 'Cotización de producto creada exitosamente',
            cotizacionProducto: nuevaCotizacionProducto
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear cotización de producto',
            error: error.message
        });
    }
};

// Actualizar una cotización de producto
exports.updateCotizacionProducto = async (req, res) => {
    try {
        const { Cantidad, PrecioUnitario, Subtotal } = req.body;

        const cotizacionProducto = await CotizacionProducto.findByPk(req.params.id);

        if (!cotizacionProducto) {
            return res.status(404).json({ message: 'Cotización de producto no encontrada' });
        }

        await cotizacionProducto.update({
            Cantidad: Cantidad || cotizacionProducto.Cantidad,
            PrecioUnitario: PrecioUnitario !== undefined ? PrecioUnitario : cotizacionProducto.PrecioUnitario,
            Subtotal: Subtotal !== undefined ? Subtotal : cotizacionProducto.Subtotal
        });

        res.json({
            message: 'Cotización de producto actualizada exitosamente',
            cotizacionProducto
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar cotización de producto',
            error: error.message
        });
    }
};

// Eliminar una cotización de producto
exports.deleteCotizacionProducto = async (req, res) => {
    try {
        const cotizacionProducto = await CotizacionProducto.findByPk(req.params.id);

        if (!cotizacionProducto) {
            return res.status(404).json({ message: 'Cotización de producto no encontrada' });
        }

        await cotizacionProducto.destroy();

        res.json({ message: 'Cotización de producto eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar cotización de producto',
            error: error.message
        });
    }
};