/**
 * GET /api/salud: 200 { estado: 'ok' } si la base de datos responde; 503 { estado: 'error' } si no (o si tarda más de
 * `esperaMs`). Nunca devuelve detalles internos. Lo usa el healthcheck de docker-compose.
 */
module.exports = (sequelize, { esperaMs = 3000 } = {}) => async (req, res) => {
    let temporizador;
    try {
        await Promise.race([
            sequelize.authenticate(),
            new Promise((_, rechazar) => { temporizador = setTimeout(() => rechazar(new Error('tiempo agotado')), esperaMs); }),
        ]);
        res.json({ estado: 'ok' });
    } catch {
        res.status(503).json({ estado: 'error' });
    } finally {
        clearTimeout(temporizador);
    }
};
