'use strict';
/**
 * ventas.ComprobanteFechaRechazo: cuándo se rechazó el comprobante de transferencia. El plazo de pago de un pedido con
 * el comprobante rechazado corre desde esa fecha (antes corría desde la fecha del pedido y podía cancelarse en minutos).
 * A los pedidos pendientes que ya tienen un rechazo se les pone la fecha de hoy: reciben el plazo completo desde ahora
 * (y se habilita de nuevo su aviso previo, como al rechazar desde el panel).
 * Idempotente: en una base nueva el baseline ya crea todo desde los modelos.
 */
const { ESTADO_VENTA } = require('../config/estados');

module.exports = {
  async up(queryInterface, Sequelize) {
    const ventas = await queryInterface.describeTable('ventas');
    if (!ventas.ComprobanteFechaRechazo) {
      await queryInterface.addColumn('ventas', 'ComprobanteFechaRechazo', { type: Sequelize.DATE, allowNull: true });
      // Con el plazo nuevo también vuelve a corresponder el aviso previo
      await queryInterface.bulkUpdate('ventas', { ComprobanteFechaRechazo: new Date(), AvisoVencimiento: false },
        { EstadoID: ESTADO_VENTA.PENDIENTE, ComprobanteMotivoRechazo: { [Sequelize.Op.ne]: null } });
    }
  },

  async down(queryInterface) {
    const ventas = await queryInterface.describeTable('ventas');
    if (ventas.ComprobanteFechaRechazo) await queryInterface.removeColumn('ventas', 'ComprobanteFechaRechazo');
  },
};
