'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DetalleCotizacions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      DocumentoID: {
        type: Sequelize.INTEGER
      },
      CotizacionID: {
        type: Sequelize.INTEGER
      },
      Cantidad: {
        type: Sequelize.INTEGER
      },
      TraePrenda: {
        type: Sequelize.BOOLEAN
      },
      PrendaDescripcion: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('DetalleCotizacions');
  }
};