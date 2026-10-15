// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        // Aceptar tanto mayúsculas como minúsculas
        const Correo = req.body.Correo || req.body.correo;
        const Contraseña = req.body.Contraseña || req.body.contraseña;

        console.log('Login intento:', { Correo, Contraseña: '***' });

        if (!Correo || !Contraseña) {
            return res.status(400).json({
                mensaje: 'Correo y contraseña son obligatorios'
            });
        }

        // Buscar usuario por correo
        const usuario = await db.Usuario.findOne({
            where: { Correo: Correo }
        });

        if (!usuario) {
            console.log('Usuario no encontrado:', Correo);
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        console.log('Usuario encontrado:', usuario.Correo);

        // Comparar contraseñas
        const passwordValida = await bcrypt.compare(Contraseña, usuario.Contraseña);

        if (!passwordValida) {
            console.log('Contraseña incorrecta para:', Correo);
            return res.status(401).json({
                mensaje: 'Contraseña incorrecta'
            });
        }

        // Crear token JWT
        const token = jwt.sign(
            { id: usuario.DocumentoID, rol: usuario.RolID },
            'clave_secreta', // Usa variable de entorno en producción
            { expiresIn: '2h' }
        );

        console.log('Login exitoso:', usuario.Nombre);

        // Usar DocumentoID con mayúscula
        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            DocumentoID: usuario.DocumentoID,  // Mayuscula
            documentoID: usuario.DocumentoID,  // También en minúscula para mejor compatibilidad
            rol: usuario.RolID,
            nombre: usuario.Nombre,
            correo: usuario.Correo,
            telefono: usuario.Telefono,
            direccion: usuario.Direccion
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
});


// ==================== REGISTRO ====================
router.post('/registro', async (req, res) => {
    try {
        const { DocumentoID, Nombre, Correo, Telefono, Direccion, Contraseña, RolID } = req.body;

        // Validación de datos obligatorios
        if (!DocumentoID || !Nombre || !Correo || !Contraseña) {
            return res.status(400).json({
                mensaje: 'Faltan campos obligatorios'
            });
        }

        // Verificar si el correo ya existe
        const correoExiste = await db.Usuario.findOne({
            where: { Correo }
        });

        if (correoExiste) {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        // Verificar si el documento ya existe
        const documentoExiste = await db.Usuario.findByPk(DocumentoID);

        if (documentoExiste) {
            return res.status(400).json({
                mensaje: 'El documento ya está registrado'
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(Contraseña, 10);

        // Crear usuario
        const nuevoUsuario = await db.Usuario.create({
            DocumentoID,
            Nombre,
            Correo,
            Telefono: Telefono || '',
            Direccion: Direccion || '',
            Contraseña: hashedPassword,
            RolID: RolID || 2 // Por defecto, rol Cliente
        });

        console.log('Usuario registrado:', nuevoUsuario.Correo);

        // Crear token automáticamente después del registro
        const token = jwt.sign(
            { id: nuevoUsuario.DocumentoID, rol: nuevoUsuario.RolID },
            'clave_secreta',
            { expiresIn: '2h' }
        );

        // No enviar la contraseña en la respuesta
        const usuarioRespuesta = nuevoUsuario.toJSON();
        delete usuarioRespuesta.Contraseña;

        // ✅ CORRECCIÓN: Usar DocumentoID con mayúscula
        res.status(201).json({
            estado: true,
            mensaje: 'Usuario registrado correctamente',
            usuario: usuarioRespuesta,
            token,
            DocumentoID: nuevoUsuario.DocumentoID,  // ✅ MAYÚSCULA
            documentoID: nuevoUsuario.DocumentoID,  // ✅ También minúscula para retrocompatibilidad
            nombre: nuevoUsuario.Nombre,
            correo: nuevoUsuario.Correo,
            rol: nuevoUsuario.RolID
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({
            mensaje: 'Error al registrar usuario',
            error: error.message
        });
    }
});


// ==================== RECUPERAR CONTRASEÑA ====================
router.post('/recuperar-password', async (req, res) => {
    try {
        const { Correo } = req.body;

        if (!Correo) {
            return res.status(400).json({
                mensaje: 'El correo es obligatorio'
            });
        }

        // Buscar usuario por correo
        const usuario = await db.Usuario.findOne({
            where: { Correo }
        });

        if (!usuario) {
            // Por seguridad, no revelar si el correo existe o no
            return res.json({
                mensaje: 'Si el correo existe, recibirás un enlace de recuperación'
            });
        }

        // Generar token temporal (válido por 1 hora)
        const token = jwt.sign(
            { id: usuario.DocumentoID, tipo: 'recuperacion' },
            'clave_secreta',
            { expiresIn: '1h' }
        );

        // URL del frontend para restablecer contraseña
        const urlRecuperacion = `http://localhost:5173/restablecercontraseña?token=${token}`;

        // Configurar nodemailer
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            service: 'gmail', // o el servicio que uses
            auth: {
                user: 'medipapoy23@gmail.com', // Cambia esto
                pass: 'dafrcvvuvglxexwg' // Usa contraseña de aplicación de Gmail
            }
        });

        const mailOptions = {
            from: 'STAMPLAB <medipapoy23@gmail.com>',
            to: usuario.Correo,
            subject: 'Recuperación de Contraseña - STAMPLAB',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Recuperación de Contraseña</h2>
                    <p>Hola <strong>${usuario.Nombre}</strong>,</p>
                    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <a href="${urlRecuperacion}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                              color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Restablecer Contraseña
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Este enlace es válido por 1 hora.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Si no solicitaste este cambio, ignora este correo.
                    </p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="color: #999; font-size: 12px;">STAMPLAB - Sistema de Gestión</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log('Email de recuperación enviado a:', usuario.Correo);

        res.json({
            mensaje: 'Si el correo existe, recibirás un enlace de recuperación',
            estado: true
        });

    } catch (error) {
        console.error('Error al recuperar contraseña:', error);
        res.status(500).json({
            mensaje: 'Error al procesar la solicitud',
            error: error.message
        });
    }
});


// ==================== RESTABLECER CONTRASEÑA ====================
router.post('/restablecer-password', async (req, res) => {
    try {
        const { token, nuevaContraseña } = req.body;

        if (!token || !nuevaContraseña) {
            return res.status(400).json({ 
                mensaje: 'Token y nueva contraseña son obligatorios' 
            });
        }

        // Validar longitud de contraseña
        if (nuevaContraseña.length < 4) {
            return res.status(400).json({ 
                mensaje: 'La contraseña debe tener al menos 4 caracteres' 
            });
        }

        // Verificar el token
        let decoded;
        try {
            decoded = jwt.verify(token, 'clave_secreta');
        } catch (error) {
            return res.status(401).json({ 
                mensaje: 'El token es inválido o ha expirado' 
            });
        }

        // Verificar que sea un token de recuperación
        if (decoded.tipo !== 'recuperacion') {
            return res.status(401).json({ 
                mensaje: 'Token no válido para esta operación' 
            });
        }

        // Buscar usuario
        const usuario = await db.Usuario.findByPk(decoded.id);

        if (!usuario) {
            return res.status(404).json({ 
                mensaje: 'Usuario no encontrado' 
            });
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);

        // Actualizar contraseña
        await usuario.update({ 
            Contraseña: hashedPassword 
        });

        console.log('Contraseña actualizada para:', usuario.Correo);

        res.json({ 
            mensaje: 'Contraseña restablecida correctamente',
            estado: true
        });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ 
            mensaje: 'Error al restablecer contraseña', 
            error: error.message 
        });
    }
});



module.exports = router;