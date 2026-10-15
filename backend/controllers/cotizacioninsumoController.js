const { CotizacionInsumo, DetalleCotizacion, Insumo } = require('../models');

// Obtener todas las cotizaciones de insumos
exports.getAllCotizacionInsumos = async (req, res) => {
    try {
        const cotizacionInsumos = await CotizacionInsumo.findAll({
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Insumo, as: 'insumo' }
            ]
        });
        res.json(cotizacionInsumos);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotizaciones de insumos',
            error: error.message
        });
    }
};

// Obtener una cotización de insumo por ID
exports.getCotizacionInsumoById = async (req, res) => {
    try {
        const cotizacionInsumo = await CotizacionInsumo.findByPk(req.params.id, {
            include: [
                { model: DetalleCotizacion, as: 'detalleCotizacion' },
                { model: Insumo, as: 'insumo' }
            ]
        });

        if (!cotizacionInsumo) {
            return res.status(404).json({ message: 'Cotización de insumo no encontrada' });
        }

        res.json(cotizacionInsumo);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener cotización de insumo',
            error: error.message
        });
    }
};

// Crear una cotización de insumo
exports.createCotizacionInsumo = async (req, res) => {
    try {
        const { DetalleCotizacionID, InsumoID, CantidadRequerida } = req.body;

        const nuevaCotizacionInsumo = await CotizacionInsumo.create({
            DetalleCotizacionID,
            InsumoID,
            CantidadRequerida
        });

        res.status(201).json({
            message: 'Cotización de insumo creada exitosamente',
            cotizacionInsumo: nuevaCotizacionInsumo
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear cotización de insumo',
            error: error.message
        });
    }
};

// Actualizar una cotización de insumo
exports.updateCotizacionInsumo = async (req, res) => {
    try {
        const { CantidadRequerida } = req.body;

        const cotizacionInsumo = await CotizacionInsumo.findByPk(req.params.id);

        if (!cotizacionInsumo) {
            return res.status(404).json({ message: 'Cotización de insumo no encontrada' });
        }

        await cotizacionInsumo.update({
            CantidadRequerida: CantidadRequerida || cotizacionInsumo.CantidadRequerida
        });

        res.json({
            message: 'Cotización de insumo actualizada exitosamente',
            cotizacionInsumo
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar cotización de insumo',
            error: error.message
        });
    }
};

// Eliminar una cotización de insumo
exports.deleteCotizacionInsumo = async (req, res) => {
    try {
        const cotizacionInsumo = await CotizacionInsumo.findByPk(req.params.id);

        if (!cotizacionInsumo) {
            return res.status(404).json({ message: 'Cotización de insumo no encontrada' });
        }

        await cotizacionInsumo.destroy();

        res.json({ message: 'Cotización de insumo eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar cotización de insumo',
            error: error.message
        });
    }
};