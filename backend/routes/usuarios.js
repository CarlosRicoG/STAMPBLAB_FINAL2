// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middleware/authMiddleware');
const { admin, esAdmin, propioOAdmin } = require('../middleware/authMiddleware');

// Un cliente no puede cambiarse el rol ni el documento al editar su perfil.
const sinCambiarRol = (req, res, next) => {
    if (!esAdmin(req)) { delete req.body.RolID; delete req.body.DocumentoID; }
    next();
};

// Ruta para obtener roles (útil para el formulario) - DEBE IR ANTES de las rutas con :id
router.get('/util/roles', admin, async (req, res) => {
    try {
        const db = require('../models');
        const roles = await db.Rol.findAll({
            attributes: ['RolID', 'Nombre']
        });
        res.json({
            estado: true,
            datos: roles
        });
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error al obtener roles',
            error: error.message
        });
    }
});

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', admin, usuarioController.getAllUsuarios);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', verificarToken, propioOAdmin('id'), usuarioController.getUsuarioById);

// POST /api/usuarios - Crear un nuevo usuario (sin token para permitir registro)
router.post('/', admin, usuarioController.createUsuario);

// PUT /api/usuarios/:id - Actualizar un usuario
router.put('/:id', verificarToken, propioOAdmin('id'), sinCambiarRol, usuarioController.updateUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/:id', admin, usuarioController.deleteUsuario);

module.exports = router;