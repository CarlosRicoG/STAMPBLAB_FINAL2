'use strict';
/**
 * Vigencia de cotizaciones desde la aprobación y aviso previo de vencimiento.
 *  - cotizaciones.FechaAprobacion: desde cuándo corre la vigencia de una cotización aprobada.
 *  - cotizaciones.AvisoVencimiento y ventas.AvisoVencimiento: marcan que el cliente ya recibió el aviso (se envía una sola vez).
 * Idempotente: en una base nueva el baseline ya crea todo desde los modelos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cotizaciones = await queryInterface.describeTable('cotizaciones');
    if (!cotizaciones.FechaAprobacion) {
      await queryInterface.addColumn('cotizaciones', 'FechaAprobacion', { type: Sequelize.DATE, allowNull: true });
    }
    if (!cotizaciones.AvisoVencimiento) {
      await queryInterface.addColumn('cotizaciones', 'AvisoVencimiento', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }
    const ventas = await queryInterface.describeTable('ventas');
    if (!ventas.AvisoVencimiento) {
      await queryInterface.addColumn('ventas', 'AvisoVencimiento', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }
  },

  async down(queryInterface) {
    const cotizaciones = await queryInterface.describeTable('cotizaciones');
    if (cotizaciones.AvisoVencimiento) await queryInterface.removeColumn('cotizaciones', 'AvisoVencimiento');
    if (cotizaciones.FechaAprobacion) await queryInterface.removeColumn('cotizaciones', 'FechaAprobacion');
    const ventas = await queryInterface.describeTable('ventas');
    if (ventas.AvisoVencimiento) await queryInterface.removeColumn('ventas', 'AvisoVencimiento');
  },
};
