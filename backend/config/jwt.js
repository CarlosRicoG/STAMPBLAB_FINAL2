// Secreto para firmar/verificar JWT. Definir JWT_SECRET en .env (obligatorio en produccion).
const INSEGUROS = ['clave_secreta', 'cambiar'];
const secret = process.env.JWT_SECRET || 'clave_secreta';
const inseguro = !process.env.JWT_SECRET || INSEGUROS.includes(process.env.JWT_SECRET);
if (inseguro) {
    // En produccion NO se arranca con un secreto conocido: cualquiera podria fabricar un token de administrador
    if (process.env.NODE_ENV === 'production') {
        throw new Error('[seguridad] JWT_SECRET no esta definido o usa un valor de ejemplo. Define un secreto largo y aleatorio en el entorno.');
    }
    console.warn('[seguridad] JWT_SECRET no esta definido o es el valor de ejemplo: usando un secreto inseguro (solo valido en desarrollo).');
}
module.exports = secret;
