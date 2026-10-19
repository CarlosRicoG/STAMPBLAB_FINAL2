'use strict';
/**
 * - usuarios.SesionesVersion: contador; al cambiar la contraseña sube y las sesiones anteriores dejan de valer.
 * - sesiones_revocadas: tokens cerrados con "Cerrar sesión".
 * - auditoria: registro de acciones que modifican datos.
 * Idempotente: en una base nueva el baseline ya crea todo desde los modelos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = (await queryInterface.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName).toLowerCase());

    const usuarios = await queryInterface.describeTable('usuarios');
    if (!usuarios.SesionesVersion) {
      await queryInterface.addColumn('usuarios', 'SesionesVersion', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    }

    if (!tablas.includes('sesiones_revocadas')) {
      await queryInterface.createTable('sesiones_revocadas', {
        Jti: { type: Sequelize.STRING(64), primaryKey: true },
        DocumentoID: { type: Sequelize.BIGINT, allowNull: true },
        Expira: { type: Sequelize.DATE, allowNull: false },
      });
    }

    if (!tablas.includes('auditoria')) {
      await queryInterface.createTable('auditoria', {
        AuditoriaID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        Fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        DocumentoID: { type: Sequelize.BIGINT, allowNull: true },
        Rol: { type: Sequelize.INTEGER, allowNull: true },
        Metodo: { type: Sequelize.STRING(10), allowNull: false },
        Ruta: { type: Sequelize.STRING(255), allowNull: false },
        Entidad: { type: Sequelize.STRING(60), allowNull: true },
        EntidadID: { type: Sequelize.STRING(60), allowNull: true },
        Estado: { type: Sequelize.INTEGER, allowNull: true },
        Detalle: { type: Sequelize.TEXT, allowNull: true },
        IP: { type: Sequelize.STRING(64), allowNull: true },
      });
      await queryInterface.addIndex('auditoria', ['Fecha']);
      await queryInterface.addIndex('auditoria', ['DocumentoID']);
      await queryInterface.addIndex('auditoria', ['Entidad', 'EntidadID']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auditoria');
    await queryInterface.dropTable('sesiones_revocadas');
    const usuarios = await queryInterface.describeTable('usuarios');
    if (usuarios.SesionesVersion) await queryInterface.removeColumn('usuarios', 'SesionesVersion');
  },
};
