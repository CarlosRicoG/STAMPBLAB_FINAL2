/**
 * Orígenes permitidos por CORS (CORS_ORIGIN, separados por coma).
 * En producción es obligatorio: sin CORS_ORIGIN el servidor NO arranca (igual que con JWT_SECRET), en vez de abrirse a
 * unos orígenes por defecto que quizá no son los del despliegue. Fuera de producción se usan los de desarrollo.
 */
const DESARROLLO = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://stamp-lab-proyecto.vercel.app'];

function origenesPermitidos(env = process.env) {
    const lista = String(env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
    if (lista.length) return lista;
    if (env.NODE_ENV === 'production') {
        throw new Error('[seguridad] CORS_ORIGIN no está definido: en producción hay que indicar el origen del frontend (p. ej. https://tienda.com).');
    }
    return DESARROLLO;
}

module.exports = { origenesPermitidos };
