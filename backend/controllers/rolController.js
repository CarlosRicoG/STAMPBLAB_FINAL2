const { Rol, Usuario, Permiso } = require('../models');

// Roles protegidos del sistema que no se pueden eliminar ni modificar completamente
const ROLES_PROTEGIDOS = ['Administrador', 'Cliente'];

// Validar nombre del rol
const validarNombreRol = (nombre) => {
    if (!nombre || nombre.trim().length === 0) {
        return 'El nombre del rol es obligatorio';
    }
    
    const nombreTrim = nombre.trim();
    
    if (nombreTrim.length < 3) {
        return 'El nombre del rol debe tener al menos 3 caracteres';
    }
    
    if (nombreTrim.length > 40) {
        return 'El nombre del rol no puede tener más de 40 caracteres';
    }
    
    // Permitir letras, números, espacios y algunos caracteres especiales
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(nombreTrim)) {
        return 'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos';
    }
    
    return null;
};

// Validar descripción
const validarDescripcion = (descripcion) => {
    if (!descripcion || descripcion.trim().length === 0) {
        return 'La descripción es obligatoria';
    }
    
    const descripcionTrim = descripcion.trim();
    
    if (descripcionTrim.length < 10) {
        return 'La descripción debe tener al menos 10 caracteres';
    }
    
    if (descripcionTrim.length > 100) {
        return 'La descripción no puede tener más de 100 caracteres';
    }
    
    return null;
};

// Verificar si es un rol protegido
const esRolProtegido = (nombreRol) => {
    return ROLES_PROTEGIDOS.some(
        protegido => protegido.toLowerCase() === nombreRol.toLowerCase()
    );
};

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['DocumentoID', 'Nombre']
                },
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['PermisoID', 'Nombre']
                }
            ]
        });
        
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener roles',
            error: error.message
        });
    }
};

// Obtener un rol por ID
exports.getRolById = async (req, res) => {
    try {
        const rol = await Rol.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['DocumentoID', 'Nombre']
                },
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['PermisoID', 'Nombre']
                }
            ]
        });

        if (!rol) {
            return res.status(404).json({ 
                estado: false,
                mensaje: 'Rol no encontrado' 
            });
        }

        res.json({
            estado: true,
            datos: rol
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener rol',
            error: error.message
        });
    }
};

// Crear un nuevo rol
exports.createRol = async (req, res) => {
    try {
        const { Nombre, Descripcion, Estado } = req.body;

        // Validar nombre
        const errorNombre = validarNombreRol(Nombre);
        if (errorNombre) {
            return res.status(400).json({
                estado: false,
                mensaje: errorNombre
            });
        }

        // Validar descripción
        const errorDescripcion = validarDescripcion(Descripcion);
        if (errorDescripcion) {
            return res.status(400).json({
                estado: false,
                mensaje: errorDescripcion
            });
        }

        // Verificar si ya existe un rol con ese nombre
        const rolExistente = await Rol.findOne({
            where: { Nombre: Nombre.trim() }
        });

        if (rolExistente) {
            return res.status(400).json({
                estado: false,
                mensaje: `Ya existe un rol con el nombre "${Nombre.trim()}"`
            });
        }

        // No permitir crear roles con nombres protegidos
        if (esRolProtegido(Nombre.trim())) {
            return res.status(400).json({
                estado: false,
                mensaje: `No se puede crear un rol con el nombre "${Nombre.trim()}" porque está reservado por el sistema`
            });
        }

        const nuevoRol = await Rol.create({
            Nombre: Nombre.trim(),
            Descripcion: Descripcion.trim(),
            Estado: Estado !== undefined ? Estado : true
        });

        res.status(201).json({
            estado: true,
            mensaje: 'Rol creado exitosamente',
            datos: nuevoRol
        });
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al crear rol',
            error: error.message
        });
    }
};

// Actualizar un rol
exports.updateRol = async (req, res) => {
    try {
        const { Nombre, Descripcion, Estado } = req.body;

        const rol = await Rol.findByPk(req.params.id);

        if (!rol) {
            return res.status(404).json({ 
                estado: false,
                mensaje: 'Rol no encontrado' 
            });
        }

        // Verificar si es un rol protegido
        const rolProtegido = esRolProtegido(rol.Nombre);

        // Si es rol protegido, solo permitir editar descripción
        if (rolProtegido) {
            // Verificar si intentan cambiar el nombre
            if (Nombre && Nombre.trim() !== rol.Nombre) {
                return res.status(403).json({
                    estado: false,
                    mensaje: `No se puede cambiar el nombre del rol "${rol.Nombre}" porque es un rol del sistema`
                });
            }

            // Verificar si intentan cambiar el estado
            if (Estado !== undefined && Estado !== rol.Estado) {
                return res.status(403).json({
                    estado: false,
                    mensaje: `No se puede cambiar el estado del rol "${rol.Nombre}" porque es un rol del sistema`
                });
            }

            // Solo permitir cambiar descripción
            if (Descripcion) {
                const errorDescripcion = validarDescripcion(Descripcion);
                if (errorDescripcion) {
                    return res.status(400).json({
                        estado: false,
                        mensaje: errorDescripcion
                    });
                }

                await rol.update({
                    Descripcion: Descripcion.trim()
                });
            }
        } else {
            // Si no es rol protegido, permitir editar todo
            const datosActualizar = {};

            if (Nombre) {
                const errorNombre = validarNombreRol(Nombre);
                if (errorNombre) {
                    return res.status(400).json({
                        estado: false,
                        mensaje: errorNombre
                    });
                }

                // Verificar que el nuevo nombre no sea un nombre protegido
                if (esRolProtegido(Nombre.trim())) {
                    return res.status(400).json({
                        estado: false,
                        mensaje: `No se puede usar el nombre "${Nombre.trim()}" porque está reservado por el sistema`
                    });
                }

                // Verificar que no exista otro rol con ese nombre
                if (Nombre.trim() !== rol.Nombre) {
                    const nombreExiste = await Rol.findOne({
                        where: { Nombre: Nombre.trim() }
                    });

                    if (nombreExiste) {
                        return res.status(400).json({
                            estado: false,
                            mensaje: `Ya existe otro rol con el nombre "${Nombre.trim()}"`
                        });
                    }
                }

                datosActualizar.Nombre = Nombre.trim();
            }

            if (Descripcion) {
                const errorDescripcion = validarDescripcion(Descripcion);
                if (errorDescripcion) {
                    return res.status(400).json({
                        estado: false,
                        mensaje: errorDescripcion
                    });
                }
                datosActualizar.Descripcion = Descripcion.trim();
            }

            if (Estado !== undefined) {
                datosActualizar.Estado = Estado;
            }

            await rol.update(datosActualizar);
        }

        // Recargar el rol con sus relaciones
        const rolActualizado = await Rol.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['DocumentoID', 'Nombre']
                },
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['PermisoID', 'Nombre']
                }
            ]
        });

        res.json({
            estado: true,
            mensaje: 'Rol actualizado exitosamente',
            datos: rolActualizado
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al actualizar rol',
            error: error.message
        });
    }
};

// Eliminar un rol
exports.deleteRol = async (req, res) => {
    try {
        const rol = await Rol.findByPk(req.params.id);

        if (!rol) {
            return res.status(404).json({ 
                estado: false,
                mensaje: 'Rol no encontrado' 
            });
        }

        // No permitir eliminar roles protegidos
        if (esRolProtegido(rol.Nombre)) {
            return res.status(403).json({
                estado: false,
                mensaje: `No se puede eliminar el rol "${rol.Nombre}" porque es un rol del sistema necesario para el funcionamiento de la aplicación`
            });
        }

        // Verificar si hay usuarios con este rol
        const usuariosConRol = await Usuario.count({
            where: { RolID: req.params.id }
        });

        if (usuariosConRol > 0) {
            return res.status(400).json({
                estado: false,
                mensaje: `No se puede eliminar el rol "${rol.Nombre}" porque hay ${usuariosConRol} usuario(s) asignado(s) a este rol`
            });
        }

        await rol.destroy();

        res.json({ 
            estado: true,
            mensaje: 'Rol eliminado exitosamente' 
        });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al eliminar rol',
            error: error.message
        });
    }
};

// Asignar permisos a un rol
exports.asignarPermisos = async (req, res) => {
    try {
        const { permisosIds } = req.body;
        const rol = await Rol.findByPk(req.params.id);

        if (!rol) {
            return res.status(404).json({ 
                estado: false,
                mensaje: 'Rol no encontrado' 
            });
        }

        const permisos = await Permiso.findAll({
            where: { PermisoID: permisosIds }
        });

        await rol.setPermisos(permisos);

        const rolConPermisos = await Rol.findByPk(req.params.id, {
            include: [{ model: Permiso, as: 'permisos' }]
        });

        res.json({
            estado: true,
            mensaje: 'Permisos asignados exitosamente',
            datos: rolConPermisos
        });
    } catch (error) {
        console.error('Error al asignar permisos:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al asignar permisos',
            error: error.message
        });
    }
};