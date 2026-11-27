/**
 * Apagado limpio: con SIGTERM (docker stop, orquestadores) o SIGINT (Ctrl+C) se dejan de aceptar conexiones, se detienen
 * los trabajos periódicos, se terminan las peticiones en curso y se cierra la conexión a la base. Si algo se cuelga,
 * un temporizador de seguridad (10 s) fuerza la salida.
 */
function instalarApagado({ servidor, sequelize, detener = [], salir = (codigo) => process.exit(codigo), esperaMs = 10000, proceso = process }) {
    let cerrando = false;
    const apagar = async (senal) => {
        if (cerrando) return;
        cerrando = true;
        console.log(`${senal} recibido: cerrando el servidor...`);
        const seguro = setTimeout(() => { console.error('El apagado tardó demasiado: se fuerza la salida'); salir(1); }, esperaMs);
        seguro.unref?.();
        try {
            for (const fn of detener) { try { fn(); } catch { /* sigue con el resto */ } }
            await new Promise((resolver) => servidor.close(() => resolver()));
            await sequelize.close();
            clearTimeout(seguro);
            salir(0);
        } catch (e) {
            console.error('Error al apagar:', e.message);
            clearTimeout(seguro);
            salir(1);
        }
    };
    proceso.on('SIGTERM', () => apagar('SIGTERM'));
    proceso.on('SIGINT', () => apagar('SIGINT'));
    return apagar;
}

module.exports = { instalarApagado };
