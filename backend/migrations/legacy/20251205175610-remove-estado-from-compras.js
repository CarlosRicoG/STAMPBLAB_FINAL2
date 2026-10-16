'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la foreign key constraint primero (si existe)
    try {
      await queryInterface.removeConstraint('compras', 'compras_ibfk_1');
    } catch (error) {
      console.log('No se encontró constraint compras_ibfk_1, continuando...');
    }

    // Intentar con otro nombre común de constraint
    try {
      await queryInterface.removeConstraint('compras', 'fk_compras_estado');
    } catch (error) {
      console.log('No se encontró constraint fk_compras_estado, continuando...');
    }

    // Eliminar la columna EstadoID
    await queryInterface.removeColumn('compras', 'EstadoID');
  },

  async down(queryInterface, Sequelize) {
    // Restaurar la columna EstadoID por si necesitas revertir
    await queryInterface.addColumn('compras', 'EstadoID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Estados',
        key: 'EstadoID'
      }
    });
  }
};