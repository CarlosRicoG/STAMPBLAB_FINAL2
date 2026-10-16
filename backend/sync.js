const db = require('./models');

// Las FK se crean en orden arbitrario: se desactivan solo durante el sync
db.sequelize.addHook('afterConnect', conn => conn.promise().query('SET FOREIGN_KEY_CHECKS=0'));

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