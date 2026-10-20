'use strict';
/** Se elimina el historial de actividad (auditoria): ya no se usa. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('auditoria').catch(() => {});
  },
  async down() { /* irreversible a propósito: la tabla ya no forma parte del sistema */ },
};
