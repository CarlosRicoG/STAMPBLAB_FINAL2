'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // describeTable para comprobar columnas existentes (hace la migración idempotente)
    const table = await queryInterface.describeTable('insumos');

    // Comprobamos variantes de mayúsculas por si acaso
    if (!table.Tipo && !table.tipo) {
      await queryInterface.addColumn('insumos', 'Tipo', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Otro'
      });
      console.log('Columna Tipo agregada a Insumos.');
    } else {
      console.log('Columna Tipo ya existe — saltando addColumn.');
    }
  },

  async down (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Insumos');
    if (table.Tipo || table.tipo) {
      await queryInterface.removeColumn('insumos', 'Tipo');
      console.log('Columna Tipo removida de Insumos.');
    } else {
      console.log('Columna Tipo no existe — saltando removeColumn.');
    }
  }
};