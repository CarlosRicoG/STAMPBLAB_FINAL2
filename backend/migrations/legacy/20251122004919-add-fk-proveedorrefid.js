"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar la FK que apunta a proveedores.id
    await queryInterface.addConstraint("compras", {
      fields: ["ProveedorRefId"],
      type: "foreign key",
      name: "fk_compras_proveedorRefId",
      references: {
        table: "proveedores",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("compras", "fk_compras_proveedorRefId");
  },
};