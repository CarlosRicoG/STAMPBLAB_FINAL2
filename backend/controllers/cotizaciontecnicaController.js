// controllers/cotizaciontecnicaController.js
const { 
    CotizacionTecnica, 
    DetalleCotizacion, 
    Cotizacion 
} = require('../models');

// IMPORTAR LA FUNCIÓN DESDE cotizacionController
const { calcularValorTotalCotizacion } = require('./cotizacionController');

// ============================================
// ACTUALIZAR TÉCNICA Y RECALCULAR TOTAL
// ============================================
exports.updateCotizacionTecnica = async (req, res) => {
    try {
        const { CostoTecnica, ImagenDiseño, Observaciones } = req.body;

        const cotizacionTecnica = await CotizacionTecnica.findByPk(req.params.id, {
            include: [{ 
                model: DetalleCotizacion, 
                as: 'detalleCotizacion',
                include: [{ model: Cotizacion, as: 'cotizacion' }]
            }]
        });

        if (!cotizacionTecnica) {
            return res.status(404).json({ message: 'Técnica de cotización no encontrada' });
        }

        // Actualizar costo de técnica
        await cotizacionTecnica.update({
            CostoTecnica: CostoTecnica !== undefined ? parseFloat(CostoTecnica) : cotizacionTecnica.CostoTecnica,
            ImagenDiseño: ImagenDiseño || cotizacionTecnica.ImagenDiseño,
            Observaciones: Observaciones || cotizacionTecnica.Observaciones
        });

        // RECALCULAR VALOR TOTAL usando la función importada
        const cotizacionID = cotizacionTecnica.detalleCotizacion?.CotizacionID;
        if (cotizacionID) {
            const nuevoTotal = await calcularValorTotalCotizacion(cotizacionID);
            return res.json({
                message: 'Técnica actualizada y total recalculado',
                cotizacionTecnica,
                nuevoTotal
            });
        }

        res.json({
            message: 'Técnica de cotización actualizada',
            cotizacionTecnica
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Error al actualizar técnica de cotización',
            error: error.message
        });
    }
};

// ============================================
// OBTENER TODAS LAS TÉCNICAS
// ============================================
exports.getAllCotizacionTecnicas = async (req, res) => {
    try {
        const tecnicas = await CotizacionTecnica.findAll({
            include: ['tecnica', 'parte']
        });
        res.json(tecnicas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// OBTENER TÉCNICA POR ID
// ============================================
exports.getCotizacionTecnicaById = async (req, res) => {
    try {
        const tecnica = await CotizacionTecnica.findByPk(req.params.id, {
            include: ['tecnica', 'parte']
        });
        if (!tecnica) {
            return res.status(404).json({ message: 'Técnica no encontrada' });
        }
        res.json(tecnica);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// CREAR TÉCNICA
// ============================================
exports.createCotizacionTecnica = async (req, res) => {
    try {
        const tecnica = await CotizacionTecnica.create(req.body);
        res.status(201).json(tecnica);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// ELIMINAR TÉCNICA
// ============================================
exports.deleteCotizacionTecnica = async (req, res) => {
    try {
        const tecnica = await CotizacionTecnica.findByPk(req.params.id, {
            include: [{ 
                model: DetalleCotizacion, 
                as: 'detalleCotizacion'
            }]
        });
        
        if (!tecnica) {
            return res.status(404).json({ message: 'Técnica no encontrada' });
        }

        const cotizacionID = tecnica.detalleCotizacion?.CotizacionID;
        
        await tecnica.destroy();
        
        // Recalcular total después de eliminar
        if (cotizacionID) {
            await calcularValorTotalCotizacion(cotizacionID);
        }
        
        res.json({ message: 'Técnica eliminada y total recalculado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};