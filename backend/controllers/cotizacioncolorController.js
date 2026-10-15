const { CotizacionColor, DetalleCotizacion, Color } = require('../models');

// Obtener todas las cotizaciones de colores
exports.getAllCotizacionColores = async (req, res) => {
    try {
        const cotizacionColores = await CotizacionColor.findAll({
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Color, as: 'color' }
            ]
        });
        res.json(cotizacionColores);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotizaciones de colores',
            error: error.message
        });
    }
};

// Obtener una cotización de color por ID
exports.getCotizacionColorById = async (req, res) => {
    try {
        const cotizacionColor = await CotizacionColor.findByPk(req.params.id, {
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Color, as: 'color' }
            ]
        });

        if (!cotizacionColor) {
            return res.status(404).json({ message: 'Cotización de color no encontrada' });
        }

        res.json(cotizacionColor);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotización de color',
            error: error.message
        });
    }
};

// Crear una cotización de color
exports.createCotizacionColor = async (req, res) => {
    try {
        const { DetalleCotizacionID, ColorID, Cantidad } = req.body;

        const nuevaCotizacionColor = await CotizacionColor.create({
            DetalleCotizacionID,
            ColorID,
            Cantidad
        });

        res.status(201).json({
            message: 'Cotización de color creada exitosamente',
            cotizacionColor: nuevaCotizacionColor
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear cotización de color',
            error: error.message
        });
    }
};

// Actualizar una cotización de color
exports.updateCotizacionColor = async (req, res) => {
    try {
        const { Cantidad } = req.body;

        const cotizacionColor = await CotizacionColor.findByPk(req.params.id);

        if (!cotizacionColor) {
            return res.status(404).json({ message: 'Cotización de color no encontrada' });
        }

        await cotizacionColor.update({
            Cantidad: Cantidad || cotizacionColor.Cantidad
        });

        res.json({
            message: 'Cotización de color actualizada exitosamente',
            cotizacionColor
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar cotización de color',
            error: error.message
        });
    }
};

// Eliminar una cotización de color
exports.deleteCotizacionColor = async (req, res) => {
    try {
        const cotizacionColor = await CotizacionColor.findByPk(req.params.id);

        if (!cotizacionColor) {
            return res.status(404).json({ message: 'Cotización de color no encontrada' });
        }

        await cotizacionColor.destroy();

        res.json({ message: 'Cotización de color eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar cotización de color',
            error: error.message
        });
    }
};