const db = require('./models');

async function syncDatabase() {
    try {
        console.log('Sincronizando base de datos...');

        // force: true elimina las tablas existentes y las recrea
        // alter: true modifica las tablas existentes sin eliminarlas
        await db.sequelize.sync({ force: true });

        console.log('Base de datos sincronizada correctamente');
        console.log('Todas las tablas han sido creadas');

        process.exit(0);
    } catch (error) {
        console.error('Error al sincronizar base de datos:', error);
        process.exit(1);
    }
}

syncDatabase();