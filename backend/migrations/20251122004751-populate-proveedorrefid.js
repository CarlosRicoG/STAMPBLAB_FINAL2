"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Actualizar ProveedorRefId basándose en el Nit del ProveedorID
    await queryInterface.sequelize.query(`
      UPDATE compras c
      INNER JOIN proveedores p ON c.ProveedorID = p.Nit
      SET c.ProveedorRefId = p.id
      WHERE c.ProveedorID IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Limpiar ProveedorRefId
    await queryInterface.sequelize.query(`
      UPDATE compras 
      SET ProveedorRefId = NULL
    `);
  },
};