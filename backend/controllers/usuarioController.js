const { validarContrasena } = require('../utils/contrasenas');
const { ESTADO_VENTA, ESTADO_COTIZACION } = require('../config/estados');
const log = require('../utils/log');
const sesion = require('../services/sesion');
const { Usuario, Rol } = require('../models');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { Op } = require('sequelize');


// ==================== OBTENER TODOS LOS USUARIOS ====================
exports.getAllUsuarios = async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(100000, Math.max(1, parseInt(req.query.limit) || (req.query.page ? 10 : 100000))); // sin page/limit: devuelve todo
        const search = (req.query.search || "").trim();
        const offset = (page - 1) * limit;

        // Solo clientes (RolID = 2) — si no se manda rol, trae todos
        const rolID  = req.query.rolID ? parseInt(req.query.rolID) : null;

        const where = {};
        if (rolID) where.RolID = rolID;

        if (search) {
            where[Op.or] = [
                { Nombre:      { [Op.like]: `%${search}%` } },
                { DocumentoID: { [Op.like]: `%${search}%` } },
                { Correo:      { [Op.like]: `%${search}%` } },
                { Telefono:    { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Usuario.findAndCountAll({
            where,
            include: [{ model: Rol, as: 'rol', attributes: ['RolID', 'Nombre'] }],
            attributes: { exclude: ['Contraseña'] },
            order: [['Nombre', 'ASC']],
            limit,
            offset,
            distinct: true
        });

        const usuariosFormateados = rows.map(u => {
            const j = u.toJSON();
            return { ...j, RolNombre: j.rol?.Nombre || null };
        });

        res.json({
            datos:        usuariosFormateados,
            total:        count,
            pagina:       page,
            totalPaginas: Math.ceil(count / limit),
            limit
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ estado: false, mensaje: 'Error al obtener usuarios', error: error.message });
    }
};


// ==================== OBTENER UN USUARIO POR ID ====================
exports.getUsuarioById = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            include: [
                {
                    model: Rol,
                    as: 'rol',
                    attributes: ['RolID', 'Nombre']
                }
            ],
            attributes: { exclude: ['Contraseña'] }
        });

        if (!usuario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        const usuarioJSON = usuario.toJSON();
        res.json({
            ...usuarioJSON,
            RolNombre: usuarioJSON.rol ? usuarioJSON.rol.Nombre : null
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// ==================== CREAR USUARIO ====================
exports.createUsuario = async (req, res) => {
    try {
        const { DocumentoID, Nombre, Correo, Direccion, Telefono, Contraseña, RolID } = req.body;

        log('\n' + '='.repeat(60));
        log('CREAR USUARIO - INICIO');
        log('='.repeat(60));
        log('Body:', JSON.stringify({ ...req.body, Contraseña: '***' }, null, 2));

        // Validación de datos obligatorios
        if (!DocumentoID || !Nombre || !Correo || !Contraseña || !RolID) {
            return res.status(400).json({
                estado: false,
                mensaje: 'Los campos DocumentoID, Nombre, Correo, Contraseña y RolID son obligatorios'
            });
        }

        const errorClave = validarContrasena(Contraseña);
        if (errorClave) {
            return res.status(400).json({ estado: false, mensaje: errorClave });
        }

        // Validacion: Verificar si ya existe un administrador y se intenta crear otro
        if (RolID == 1) { // RolID 1 = Administrador
            const adminExistente = await Usuario.findOne({ where: { RolID: 1 } });
            if (adminExistente) {
                log('Ya existe un usuario administrador');
                return res.status(400).json({
                    estado: false,
                    mensaje: 'Ya existe un usuario con rol de Administrador. Solo puede haber uno en el sistema.'
                });
            }
        }

        // Verificar si ya existe un usuario con el mismo correo
        const existeCorreo = await Usuario.findOne({ where: { Correo } });
        if (existeCorreo) {
            return res.status(400).json({
                estado: false,
                mensaje: 'El correo ya está registrado'
            });
        }

        // Verificar si ya existe un usuario con el mismo DocumentoID
        const usuarioExistente = await Usuario.findByPk(DocumentoID);
        if (usuarioExistente) {
            return res.status(400).json({
                estado: false,
                mensaje: 'El documento ya está registrado'
            });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(Contraseña, 10);

        // Preparar todos los datos
        const datosUsuario = {
            DocumentoID,
            Nombre,
            Correo,
            Direccion: Direccion || null,
            Telefono: Telefono || null,
            Contraseña: hashedPassword,
            RolID
        };

        log('Guardando usuario...');

        // Crear el usuario
        const nuevoUsuario = await Usuario.create(datosUsuario);

        log('Usuario creado exitosamente');
        log('='.repeat(60) + '\n');

        // No enviar la contraseña en la respuesta
        const usuarioRespuesta = nuevoUsuario.toJSON();
        delete usuarioRespuesta.Contraseña;

        res.status(201).json({
            estado: true,
            mensaje: 'Usuario creado correctamente',
            datos: usuarioRespuesta
        });

    } catch (error) {
        console.error('Error al crear usuario:', error.message);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al crear usuario',
            error: error.message
        });
    }
};

// ==================== ACTUALIZAR USUARIO ====================
exports.updateUsuario = async (req, res) => {
    try {
        const { Nombre, Correo, Direccion, Telefono, RolID, Contraseña } = req.body;

        log('\n' + '='.repeat(60));
        log('ACTUALIZAR USUARIO');
        log('='.repeat(60));
        log('ID:', req.params.id);

        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Validacion: Si el usuario actual es Admin, no se puede cambiar su rol
        if (usuario.RolID == 1 && RolID && RolID != 1) {
            log('❌ Intento de cambiar rol de administrador');
            return res.status(400).json({
                estado: false,
                mensaje: 'No se puede cambiar el rol del Administrador'
            });
        }

        // Validacion: Si se intenta asignar rol Admin a otro usuario
        if (RolID == 1 && usuario.RolID != 1) {
            const adminExistente = await Usuario.findOne({ where: { RolID: 1 } });
            if (adminExistente && adminExistente.DocumentoID != usuario.DocumentoID) {
                log('Ya existe otro administrador');
                return res.status(400).json({
                    estado: false,
                    mensaje: 'Ya existe un usuario con rol de Administrador. Solo puede haber uno en el sistema.'
                });
            }
        }

        // Verificar si el correo ya existe en otro usuario
        if (Correo && Correo !== usuario.Correo) {
            const existeCorreo = await Usuario.findOne({ where: { Correo } });
            if (existeCorreo && existeCorreo.DocumentoID !== usuario.DocumentoID) {
                return res.status(400).json({
                    estado: false,
                    mensaje: 'El correo ya está registrado en otro usuario'
                });
            }
        }

        // Preparar datos para actualizar
        const datosActualizar = {
            Nombre: Nombre || usuario.Nombre,
            Correo: Correo || usuario.Correo,
            Direccion: Direccion !== undefined ? Direccion : usuario.Direccion,
            Telefono: Telefono !== undefined ? Telefono : usuario.Telefono,
            RolID: RolID || usuario.RolID
        };

        // Si se envió contraseña nueva, hashearla
        if (Contraseña && Contraseña.trim() !== '') {
            const errorClave = validarContrasena(Contraseña);
            if (errorClave) {
                return res.status(400).json({ estado: false, mensaje: errorClave });
            }
            datosActualizar.Contraseña = await bcrypt.hash(Contraseña, 10);
        }

        await usuario.update(datosActualizar);
        // Cambiaron la clave: las sesiones abiertas con la anterior dejan de valer
        if (datosActualizar.Contraseña) await sesion.revocarTodas(usuario.DocumentoID);

        // Obtener usuario actualizado con rol
        const usuarioActualizado = await Usuario.findByPk(req.params.id, {
            include: [
                {
                    model: Rol,
                    as: 'rol',
                    attributes: ['RolID', 'Nombre']
                }
            ],
            attributes: { exclude: ['Contraseña'] }
        });

        const usuarioJSON = usuarioActualizado.toJSON();
        const usuarioRespuesta = {
            ...usuarioJSON,
            RolNombre: usuarioJSON.rol ? usuarioJSON.rol.Nombre : null
        };

        log('Usuario actualizado');
        log('='.repeat(60) + '\n');

        res.json({
            estado: true,
            mensaje: 'Usuario actualizado exitosamente',
            datos: usuarioRespuesta
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// ==================== ELIMINAR USUARIO ====================
exports.deleteUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                estado: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // No se puede eliminar al administrador
        if (usuario.RolID == 1) {
            log('Intento de eliminar al administrador');
            return res.status(400).json({
                estado: false,
                mensaje: 'No se puede eliminar al usuario Administrador'
            });
        }

        // La FK ventas.DocumentoID es ON DELETE CASCADE: borrar el usuario borraría
        // también sus pedidos. Se bloquea si tiene pedidos (salvo cancelados) o
        // cotizaciones activas (Pendiente, Aprobada, En revisión).
        const docID = usuario.DocumentoID ?? req.params.id;
        if (db.Venta?.count) {
            const ventasActivas = await db.Venta.count({
                where: { DocumentoID: docID, EstadoID: { [Op.notIn]: [ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA] } }
            });
            if (ventasActivas > 0) {
                return res.status(400).json({
                    estado: false,
                    mensaje: `No se puede eliminar: el usuario tiene ${ventasActivas} pedido(s) activo(s).`
                });
            }
            const ventasEntregadas = await db.Venta.count({ where: { DocumentoID: docID, EstadoID: ESTADO_VENTA.ENTREGADA } });
            if (ventasEntregadas > 0) {
                return res.status(400).json({
                    estado: false,
                    mensaje: `No se puede eliminar: el usuario tiene ${ventasEntregadas} pedido(s) entregado(s) en su historial.`
                });
            }
        }
        if (db.Cotizacion?.count) {
            const cotizacionesActivas = await db.Cotizacion.count({
                where: { DocumentoID: docID, EstadoID: { [Op.in]: [ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.APROBADA, ESTADO_COTIZACION.EN_REVISION] } }
            });
            if (cotizacionesActivas > 0) {
                return res.status(400).json({
                    estado: false,
                    mensaje: `No se puede eliminar: el usuario tiene ${cotizacionesActivas} cotización(es) activa(s).`
                });
            }
        }

        // Se invalidan sus sesiones ANTES de borrar (después ya no existe la fila donde se guarda la versión de sesión)
        await sesion.revocarTodas(docID).catch(() => {});
        await usuario.destroy();

        res.json({
            estado: true,
            mensaje: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                estado: false,
                mensaje: 'No se puede eliminar: el usuario tiene cotizaciones u otros registros asociados en el sistema.',
                message: 'No se puede eliminar: el registro está en uso en otros módulos (ventas, cotizaciones, compras, etc.)'
            });
        }
        
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al eliminar usuario',
            error: error.message
        });
    }
};
