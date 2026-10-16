'use strict';
/**
 * Migración BASE: crea todas las tablas a partir de los modelos actuales.
 *
 * - En una base de datos VACÍA crea el esquema completo (npm run db:setup).
 * - En una base que ya existe es segura: sync() solo crea lo que falta, no altera ni borra nada.
 *
 * Las migraciones históricas (2025) están en migrations/legacy: asumían la base antigua y no
 * funcionan sobre una base vacía, por eso quedaron archivadas.
 */
module.exports = {
  async up() {
    const db = require('../models');
    // Las claves foráneas se declaran en orden arbitrario: se desactiva su verificación
    // solo mientras se crean las tablas (cada conexión nueva del pool).
    db.sequelize.addHook('afterConnect', (conn) => conn.promise().query('SET FOREIGN_KEY_CHECKS=0'));
    try {
      await db.sequelize.sync();
    } finally {
      await db.sequelize.close();
    }
  },

  async down() {
    // No se revierte la creación del esquema base (sería destructivo).
  },
};
