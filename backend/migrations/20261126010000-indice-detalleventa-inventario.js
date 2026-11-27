'use strict';
/**
 * Índice en detalleventa.InventarioID: al borrar una variante de inventario se buscan los pedidos Pendientes o Pagados
 * que la usan (deleteInventario) sin recorrer toda la tabla de detalles.
 * Idempotente y reversible.
 */
const TABLA = 'detalleventa';
const NOMBRE = 'detalleventa_inventario';

module.exports = {
  async up(queryInterface) {
    const existentes = (await queryInterface.showIndex(TABLA)).map((i) => i.name);
    if (!existentes.includes(NOMBRE)) await queryInterface.addIndex(TABLA, ['InventarioID'], { name: NOMBRE });
  },

  async down(queryInterface) {
    const existentes = (await queryInterface.showIndex(TABLA)).map((i) => i.name);
    if (existentes.includes(NOMBRE)) await queryInterface.removeIndex(TABLA, NOMBRE);
  },
};
