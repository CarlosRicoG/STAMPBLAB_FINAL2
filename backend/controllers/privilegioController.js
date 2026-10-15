const { Privilegio, Permiso } = require('../models');

// Obtener todos los privilegios
exports.getAllPrivilegios = async (req, res) => {
    try {
        const privilegios = await Privilegio.findAll({
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] }
                }
            ]
        });
        res.json(privilegios);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener privilegios',
            error: error.message
        });
    }
};

// Obtener un privilegio por ID
exports.getPrivilegioById = async (req, res) => {
    try {
        const privilegio = await Privilegio.findByPk(req.params.id, {
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] }
                }
            ]
        });

        if (!privilegio) {
            return res.status(404).json({ message: 'Privilegio no encontrado' });
        }

        res.json(privilegio);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener privilegio',
            error: error.message
        });
    }
};

// Crear un nuevo privilegio
exports.createPrivilegio = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const nuevoPrivilegio = await Privilegio.create({ Nombre });

        res.status(201).json({
            message: 'Privilegio creado exitosamente',
            privilegio: nuevoPrivilegio
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear privilegio',
            error: error.message
        });
    }
};

// Actualizar un privilegio
exports.updatePrivilegio = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const privilegio = await Privilegio.findByPk(req.params.id);

        if (!privilegio) {
            return res.status(404).json({ message: 'Privilegio no encontrado' });
        }

        await privilegio.update({ Nombre });

        res.json({
            message: 'Privilegio actualizado exitosamente',
            privilegio
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar privilegio',
            error: error.message
        });
    }
};

// Eliminar un privilegio
exports.deletePrivilegio = async (req, res) => {
    try {
        const privilegio = await Privilegio.findByPk(req.params.id);

        if (!privilegio) {
            return res.status(404).json({ message: 'Privilegio no encontrado' });
        }

        await privilegio.destroy();

        res.json({ message: 'Privilegio eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar privilegio',
            error: error.message
        });
    }
};