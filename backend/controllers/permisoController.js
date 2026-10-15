const { Permiso, Rol, Privilegio } = require('../models');

// Obtener todos los permisos
exports.getAllPermisos = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            include: [
                {
                    model: Privilegio,
                    as: 'privilegios',
                    through: { attributes: [] }
                }
            ]
        });
        res.json(permisos);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener permisos',
            error: error.message
        });
    }
};

// Obtener un permiso por ID
exports.getPermisoById = async (req, res) => {
    try {
        const permiso = await Permiso.findByPk(req.params.id, {
            include: [
                {
                    model: Privilegio,
                    as: 'privilegios',
                    through: { attributes: [] }
                }
            ]
        });

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        res.json(permiso);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener permiso',
            error: error.message
        });
    }
};

// Crear un nuevo permiso
exports.createPermiso = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const nuevoPermiso = await Permiso.create({ Nombre });

        res.status(201).json({
            message: 'Permiso creado exitosamente',
            permiso: nuevoPermiso
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al crear permiso',
            error: error.message
        });
    }
};

// Actualizar un permiso
exports.updatePermiso = async (req, res) => {
    try {
        const { Nombre } = req.body;

        const permiso = await Permiso.findByPk(req.params.id);

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        await permiso.update({ Nombre });

        res.json({
            message: 'Permiso actualizado exitosamente',
            permiso
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al actualizar permiso',
            error: error.message
        });
    }
};

// Eliminar un permiso
exports.deletePermiso = async (req, res) => {
    try {
        const permiso = await Permiso.findByPk(req.params.id);

        if (!permiso) {
            return res.status(404).json({ message: 'Permiso no encontrado' });
        }

        await permiso.destroy();

        res.json({ message: 'Permiso eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({
            message: 'Error al eliminar permiso',
            error: error.message
        });
    }
};