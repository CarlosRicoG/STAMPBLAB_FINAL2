const { Parte } = require('../models');

// Obtener todas las partes
exports.getAllPartes = async (req, res) => {
    try {
        const partes = await Parte.findAll();
        res.json(partes);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener partes',
            error: error.message
        });
    }
};

// Obtener una parte por ID
exports.getParteById = async (req, res) => {
    try {
        const parte = await Parte.findByPk(req.params.id);

        if (!parte) {
            return res.status(404).json({ message: 'Parte no encontrada' });
        }

        res.json(parte);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener parte',
            error: error.message
        });
    }
};

// Crear una nueva parte
exports.createParte = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const nuevaParte = await Parte.create({ Nombre });

        res.status(201).json({
            message: 'Parte creada exitosamente',
            parte: nuevaParte
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear parte',
            error: error.message
        });
    }
};

// Actualizar una parte
exports.updateParte = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const parte = await Parte.findByPk(req.params.id);

        if (!parte) {
            return res.status(404).json({ message: 'Parte no encontrada' });
        }

        await parte.update({ Nombre });

        res.json({
            message: 'Parte actualizada exitosamente',
            parte
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar parte',
            error: error.message
        });
    }
};

// Eliminar una parte
exports.deleteParte = async (req, res) => {
    try {
        const parte = await Parte.findByPk(req.params.id);

        if (!parte) {
            return res.status(404).json({ message: 'Parte no encontrada' });
        }

        await parte.destroy();

        res.json({ message: 'Parte eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar parte',
            error: error.message
        });
    }
};