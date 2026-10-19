/**
 * Política de contraseñas única para TODO el sistema (registro, restablecer, crear/editar usuario).
 * Devuelve un mensaje de error en español, o null si la contraseña es válida.
 */
const crypto = require('crypto');

function validarContrasena(contrasena) {
    if (typeof contrasena !== 'string'
        || contrasena.length < 8
        || contrasena.length > 100
        || !/[A-Za-z]/.test(contrasena)
        || !/\d/.test(contrasena)) {
        return 'La contraseña debe tener entre 8 y 100 caracteres e incluir letras y números';
    }
    return null;
}

/**
 * "Huella" corta del hash actual de la contraseña. Se mete en el enlace de recuperación: cuando la contraseña
 * cambia, la huella cambia y el enlace usado deja de servir (un solo uso).
 */
function huella(hashContrasena) {
    return crypto.createHash('sha256').update(String(hashContrasena)).digest('hex').slice(0, 16);
}

module.exports = { validarContrasena, huella };
