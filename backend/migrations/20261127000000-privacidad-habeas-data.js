'use strict';
/**
 * Habeas data (Ley 1581 de 2012 / Decreto 1377 de 2013) en usuarios:
 *  - PrivacidadAceptadaEn / PrivacidadVersion: prueba de la autorización de tratamiento de datos dada en el registro
 *    (null en las cuentas existentes y en las que crea el administrador desde el panel).
 *  - SuprimidoEn: cuándo el titular pidió suprimir su cuenta. La fila se conserva anonimizada (sus ventas la referencian
 *    con ON DELETE CASCADE y las cifras contables deben conservarse).
 *  - HistorialDesde: si alguien se vuelve a registrar con el documento de una cuenta suprimida, desde cuándo ve su historial.
 * Idempotente (solo agrega las columnas que falten) y reversible.
 */
const COLUMNAS = (Sequelize) => ({
  PrivacidadAceptadaEn: { type: Sequelize.DATE, allowNull: true },
  PrivacidadVersion: { type: Sequelize.STRING(50), allowNull: true },
  SuprimidoEn: { type: Sequelize.DATE, allowNull: true },
  HistorialDesde: { type: Sequelize.DATE, allowNull: true },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    const usuarios = await queryInterface.describeTable('usuarios');
    for (const [nombre, definicion] of Object.entries(COLUMNAS(Sequelize))) {
      if (!usuarios[nombre]) await queryInterface.addColumn('usuarios', nombre, definicion);
    }
  },

  async down(queryInterface, Sequelize) {
    const usuarios = await queryInterface.describeTable('usuarios');
    for (const nombre of Object.keys(COLUMNAS(Sequelize))) {
      if (usuarios[nombre]) await queryInterface.removeColumn('usuarios', nombre);
    }
  },
};
