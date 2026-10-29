'use strict';
/**
 * ventas.ReembolsoPendiente: se activa cuando se cancela un pedido que ya estaba pagado y falta devolver el dinero.
 * Idempotente: en una base nueva el baseline ya crea todo desde los modelos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ventas = await queryInterface.describeTable('ventas');
    if (!ventas.ReembolsoPendiente) {
      await queryInterface.addColumn('ventas', 'ReembolsoPendiente', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }
  },

  async down(queryInterface) {
    const ventas = await queryInterface.describeTable('ventas');
    if (ventas.ReembolsoPendiente) await queryInterface.removeColumn('ventas', 'ReembolsoPendiente');
  },
};
