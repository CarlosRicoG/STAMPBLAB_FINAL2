'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la tabla productoinsumo
    await queryInterface.dropTable('productoinsumo');

    console.log('✅ Tabla productoinsumo eliminada exitosamente');
  },

  async down(queryInterface, Sequelize) {
    // Recrear la tabla por si necesitas revertir la migración
    await queryInterface.createTable('productoinsumo', {
      ProductoInsumoID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ProductoID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'productos',
          key: 'ProductoID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      InsumoID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'insumos',
          key: 'InsumoID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      CantidadNecesaria: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cantidad de insumo por unidad de producto'
      }
    });

    console.log('⚠️ Tabla productoinsumo recreada (rollback)');
  }
};