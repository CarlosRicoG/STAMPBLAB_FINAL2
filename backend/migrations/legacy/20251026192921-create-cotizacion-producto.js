'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CotizacionProductos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      DetalleCotizacionID: {
        type: Sequelize.INTEGER
      },
      ProductoID: {
        type: Sequelize.INTEGER
      },
      Cantidad: {
        type: Sequelize.INTEGER
      },
      PrecioUnitario: {
        type: Sequelize.DECIMAL
      },
      Subtotal: {
        type: Sequelize.DECIMAL
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CotizacionProductos');
  }
};