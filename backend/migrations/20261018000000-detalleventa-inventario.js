'use strict';
/**
 * detalleventa.InventarioID: la variante EXACTA de inventario que se descontó al vender.
 * Antes solo se guardaba producto/color/talla, y al devolver stock (cancelar/editar/borrar) se "adivinaba" la
 * variante; si existían dos telas con el mismo color y talla, el stock podía volver a la variante equivocada.
 *
 * Idempotente: en una base nueva el baseline ya crea la columna desde el modelo.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('detalleventa');
    if (!cols.InventarioID) {
      await queryInterface.addColumn('detalleventa', 'InventarioID', { type: Sequelize.INTEGER, allowNull: true });
    }
  },
  async down(queryInterface) {
    const cols = await queryInterface.describeTable('detalleventa');
    if (cols.InventarioID) await queryInterface.removeColumn('detalleventa', 'InventarioID');
  },
};
