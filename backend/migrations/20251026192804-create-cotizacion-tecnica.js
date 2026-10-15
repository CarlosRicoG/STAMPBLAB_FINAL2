'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CotizacionTecnicas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      DetalleCotizacionID: {
        type: Sequelize.INTEGER
      },
      TecnicaID: {
        type: Sequelize.INTEGER
      },
      ParteID: {
        type: Sequelize.INTEGER
      },
      ImagenDiseño: {
        type: Sequelize.STRING
      },
      Observaciones: {
        type: Sequelize.TEXT
      },
      CostoTecnica: {
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
    await queryInterface.dropTable('CotizacionTecnicas');
  }
};