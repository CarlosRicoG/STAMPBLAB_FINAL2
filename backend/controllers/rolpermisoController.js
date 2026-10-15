const { RolPermiso, Rol, Permiso } = require('../models');

// Obtener todas las relaciones rol-permiso
exports.getAllRolPermisos = async (req, res) => {
    try {
        const rolPermisos = await RolPermiso.findAll({
            include: [
                { model: Rol, as: 'rol' },
                { model: Permiso, as: 'permiso' }
            ]
        });
        res.json(rolPermisos);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener relaciones rol-permiso',
            error: error.message
        });
    }
};

// Obtener una relación por ID
exports.getRolPermisoById = async (req, res) => {
    try {
        const rolPermiso = await RolPermiso.findByPk(req.params.id, {
            include: [
                { model: Rol, as: 'rol' },
                { model: Permiso, as: 'permiso' }
            ]
        });

        if (!rolPermiso) {
            return res.status(404).json({ message: 'Relación no encontrada' });
        }

        res.json(rolPermiso);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener relación',
            error: error.message
        });
    }
};

// Asignar un permiso a un rol
exports.createRolPermiso = async (req, res) => {
    try {
        const { RolID, PermisoID } = req.body;

        const nuevoRolPermiso = await RolPermiso.create({
            RolID,
            PermisoID
        });

        res.status(201).json({
            message: 'Permiso asignado al rol exitosamente',
            rolPermiso: nuevoRolPermiso
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al asignar permiso',
            error: error.message
        });
    }
};

// Eliminar una relación rol-permiso
exports.deleteRolPermiso = async (req, res) => {
    try {
        const rolPermiso = await RolPermiso.findByPk(req.params.id);

        if (!rolPermiso) {
            return res.status(404).json({ message: 'Relación no encontrada' });
        }

        await rolPermiso.destroy();

        res.json({ message: 'Permiso removido del rol exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar relación',
            error: error.message
        });
    }
};