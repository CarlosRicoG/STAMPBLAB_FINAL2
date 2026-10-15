// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middleware/authMiddleware');

// Ruta para obtener roles (útil para el formulario) - DEBE IR ANTES de las rutas con :id
router.get('/util/roles', verificarToken, async (req, res) => {
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

// POST /api/usuarios/login - Login de usuario (sin token, debe ir antes de las rutas protegidas)
router.post('/login', usuarioController.login);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', verificarToken, usuarioController.getAllUsuarios);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', verificarToken, usuarioController.getUsuarioById);

// POST /api/usuarios - Crear un nuevo usuario (sin token para permitir registro)
router.post('/', usuarioController.createUsuario);

// PUT /api/usuarios/:id - Actualizar un usuario
router.put('/:id', verificarToken, usuarioController.updateUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/:id', verificarToken, usuarioController.deleteUsuario);

module.exports = router;