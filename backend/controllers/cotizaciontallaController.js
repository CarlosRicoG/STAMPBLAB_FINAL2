const { CotizacionTalla, DetalleCotizacion, Talla } = require('../models');

// Obtener todas las cotizaciones de tallas
exports.getAllCotizacionTallas = async (req, res) => {
    try {
        const cotizacionTallas = await CotizacionTalla.findAll({
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Talla, as: 'talla' }
            ]
        });
        res.json(cotizacionTallas);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotizaciones de tallas',
            error: error.message
        });
    }
};

// Obtener una cotización de talla por ID
exports.getCotizacionTallaById = async (req, res) => {
    try {
        const cotizacionTalla = await CotizacionTalla.findByPk(req.params.id, {
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Talla, as: 'talla' }
            ]
        });

        if (!cotizacionTalla) {
            return res.status(404).json({ message: 'Cotización de talla no encontrada' });
        }

        res.json(cotizacionTalla);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotización de talla',
            error: error.message
        });
    }
};

// Crear una cotización de talla
exports.createCotizacionTalla = async (req, res) => {
    try {
        const { DetalleCotizacionID, TallaID, Cantidad, PrecioTalla } = req.body;

        const nuevaCotizacionTalla = await CotizacionTalla.create({
            DetalleCotizacionID,
            TallaID,
            Cantidad,
            PrecioTalla
        });

        res.status(201).json({
            message: 'Cotización de talla creada exitosamente',
            cotizacionTalla: nuevaCotizacionTalla
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear cotización de talla',
            error: error.message
        });
    }
};

// Actualizar una cotización de talla
exports.updateCotizacionTalla = async (req, res) => {
    try {
        const { Cantidad, PrecioTalla } = req.body;

        const cotizacionTalla = await CotizacionTalla.findByPk(req.params.id);

        if (!cotizacionTalla) {
            return res.status(404).json({ message: 'Cotización de talla no encontrada' });
        }

        await cotizacionTalla.update({
            Cantidad: Cantidad || cotizacionTalla.Cantidad,
            PrecioTalla: PrecioTalla !== undefined ? PrecioTalla : cotizacionTalla.PrecioTalla
        });

        res.json({
            message: 'Cotización de talla actualizada exitosamente',
            cotizacionTalla
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar cotización de talla',
            error: error.message
        });
    }
};

// Eliminar una cotización de talla
exports.deleteCotizacionTalla = async (req, res) => {
    try {
        const cotizacionTalla = await CotizacionTalla.findByPk(req.params.id);

        if (!cotizacionTalla) {
            return res.status(404).json({ message: 'Cotización de talla no encontrada' });
        }

        await cotizacionTalla.destroy();

        res.json({ message: 'Cotización de talla eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar cotización de talla',
            error: error.message
        });
    }
};