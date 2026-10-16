'use strict';
// Las imagenes se guardan como base64 (data URL): VARCHAR(255)/TEXT se quedan cortos.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('productos', 'ImagenProducto', { type: Sequelize.TEXT('long'), allowNull: true });
    await queryInterface.changeColumn('ventas', 'ComprobanteTransferencia', { type: Sequelize.TEXT('long'), allowNull: true });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('productos', 'ImagenProducto', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('ventas', 'ComprobanteTransferencia', { type: Sequelize.TEXT, allowNull: true });
  }
};
