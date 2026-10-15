const { PermisoPrivilegio, Permiso, Privilegio } = require('../models');

// Obtener todas las relaciones permiso-privilegio
exports.getAllPermisoPrivilegios = async (req, res) => {
    try {
        const permisoPrivilegios = await PermisoPrivilegio.findAll({
            include: [
                { model: Permiso, as: 'permiso' },
                { model: Privilegio, as: 'privilegio' }
            ]
        });
        res.json(permisoPrivilegios);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener relaciones permiso-privilegio',
            error: error.message
        });
    }
};

// Obtener una relación por ID
exports.getPermisoPrivilegioById = async (req, res) => {
    try {
        const permisoPrivilegio = await PermisoPrivilegio.findByPk(req.params.id, {
            include: [
                { model: Permiso, as: 'permiso' },
                { model: Privilegio, as: 'privilegio' }
            ]
        });

        if (!permisoPrivilegio) {
            return res.status(404).json({ message: 'Relación no encontrada' });
        }

        res.json(permisoPrivilegio);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener relación',
            error: error.message
        });
    }
};

// Asignar un privilegio a un permiso
exports.createPermisoPrivilegio = async (req, res) => {
    try {
        const { PermisoID, PrivilegioID } = req.body;

        const nuevoPermisoPrivilegio = await PermisoPrivilegio.create({
            PermisoID,
            PrivilegioID
        });

        res.status(201).json({
            message: 'Privilegio asignado al permiso exitosamente',
            permisoPrivilegio: nuevoPermisoPrivilegio
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al asignar privilegio',
            error: error.message
        });
    }
};

// Eliminar una relación permiso-privilegio
exports.deletePermisoPrivilegio = async (req, res) => {
    try {
        const permisoPrivilegio = await PermisoPrivilegio.findByPk(req.params.id);

        if (!permisoPrivilegio) {
            return res.status(404).json({ message: 'Relación no encontrada' });
        }

        await permisoPrivilegio.destroy();

        res.json({ message: 'Privilegio removido del permiso exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar relación',
            error: error.message
        });
    }
};