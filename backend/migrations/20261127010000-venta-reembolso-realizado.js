'use strict';
/**
 * ventas.ReembolsoRealizadoEn: cuándo el administrador marcó como devuelto el dinero de un pedido cancelado (reembolso
 * pendiente, o "pago por verificar" cuyo pago sí llegó). Es el dato explícito que saca un pedido de la condición de
 * "pago por verificar" (utils/pagoPorVerificar), en vez de buscar texto en las notas del historial.
 * Los reembolsos ya marcados antes de esta columna se reconocen UNA vez por la nota exacta "Reembolso realizado" del historial
 * (la que emitía marcarReembolsado) y con ReembolsoPendiente = 0.
 * Idempotente (solo agrega la columna si falta y solo rellena las filas en NULL) y reversible.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ventas = await queryInterface.describeTable('ventas');
    if (!ventas.ReembolsoRealizadoEn) {
      await queryInterface.addColumn('ventas', 'ReembolsoRealizadoEn', { type: Sequelize.DATE, allowNull: true });
    }
    const tablas = (await queryInterface.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
    if (tablas.includes('historial_estados')) {
      await queryInterface.sequelize.query(
        // Solo la nota EXACTA que emitía marcarReembolsado (no una nota escrita a mano que empiece igual) y solo si el
        // reembolso ya no está pendiente
        "UPDATE ventas v JOIN (SELECT RefID, MAX(Fecha) AS Fecha FROM historial_estados WHERE Tipo = 'venta' AND Nota = 'Reembolso realizado' GROUP BY RefID) h "
        + 'ON h.RefID = v.VentaID SET v.ReembolsoRealizadoEn = h.Fecha WHERE v.ReembolsoRealizadoEn IS NULL AND v.ReembolsoPendiente = 0',
      );
    }
  },

  async down(queryInterface) {
    const ventas = await queryInterface.describeTable('ventas');
    if (ventas.ReembolsoRealizadoEn) await queryInterface.removeColumn('ventas', 'ReembolsoRealizadoEn');
  },
};
