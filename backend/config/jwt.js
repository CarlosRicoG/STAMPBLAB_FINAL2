// Secreto para firmar/verificar JWT. Definir JWT_SECRET en .env (obligatorio en produccion).
const secret = process.env.JWT_SECRET || 'clave_secreta';
if (!process.env.JWT_SECRET) {
    console.warn('[seguridad] JWT_SECRET no esta definido: usando un secreto por defecto inseguro. Definelo en .env');
}
module.exports = secret;
