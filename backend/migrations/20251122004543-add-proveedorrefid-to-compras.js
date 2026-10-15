"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar la nueva columna ProveedorRefId (sin FK aún)
    await queryInterface.addColumn("compras", "ProveedorRefId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "ProveedorID"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("compras", "ProveedorRefId");
  },
};