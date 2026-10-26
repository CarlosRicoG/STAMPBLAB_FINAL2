'use strict';
/**
 * Mejoras de flujo: datos de entrega y seguimiento en ventas, historial de estados, tarifas por técnica y carrito del cliente.
 * Idempotente: en una base nueva el baseline ya crea todo desde los modelos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablas = (await queryInterface.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName).toLowerCase());
    const ventas = await queryInterface.describeTable('ventas');
    const columnas = {
      TipoEntrega: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'retiro' },
      CostoEnvio: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      FechaEstimadaEntrega: { type: Sequelize.DATE, allowNull: true },
      ComprobanteMotivoRechazo: { type: Sequelize.STRING(300), allowNull: true },
      ContactoNombre: { type: Sequelize.STRING(100), allowNull: true },
      ContactoTelefono: { type: Sequelize.STRING(20), allowNull: true },
      ContactoDireccion: { type: Sequelize.STRING(255), allowNull: true },
    };
    for (const [nombre, def] of Object.entries(columnas)) {
      if (!ventas[nombre]) await queryInterface.addColumn('ventas', nombre, def);
    }

    if (!tablas.includes('historial_estados')) {
      await queryInterface.createTable('historial_estados', {
        HistorialID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        Tipo: { type: Sequelize.STRING(12), allowNull: false },
        RefID: { type: Sequelize.INTEGER, allowNull: false },
        EstadoID: { type: Sequelize.INTEGER, allowNull: false },
        Estado: { type: Sequelize.STRING(60), allowNull: false },
        Nota: { type: Sequelize.STRING(300), allowNull: true },
        DocumentoID: { type: Sequelize.BIGINT, allowNull: true },
        Fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
      await queryInterface.addIndex('historial_estados', ['Tipo', 'RefID']);
    }

    if (!tablas.includes('tarifas_tecnica')) {
      await queryInterface.createTable('tarifas_tecnica', {
        TarifaID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        TecnicaID: { type: Sequelize.INTEGER, allowNull: false },
        ParteID: { type: Sequelize.INTEGER, allowNull: false },
        Costo: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      });
      await queryInterface.addIndex('tarifas_tecnica', ['TecnicaID', 'ParteID'], { unique: true });
    }

    if (!tablas.includes('carritos')) {
      await queryInterface.createTable('carritos', {
        DocumentoID: { type: Sequelize.BIGINT, primaryKey: true },
        Datos: { type: Sequelize.TEXT('long'), allowNull: false },
        Actualizado: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    if (!tablas.includes('notificaciones')) {
      await queryInterface.createTable('notificaciones', {
        NotificacionID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        DocumentoID: { type: Sequelize.BIGINT, allowNull: false },
        Tipo: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'sistema' },
        Mensaje: { type: Sequelize.STRING(400), allowNull: false },
        Enlace: { type: Sequelize.STRING(200), allowNull: true },
        Leida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        Archivada: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        Fecha: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
      await queryInterface.addIndex('notificaciones', ['DocumentoID', 'Archivada', 'Fecha']);
    }

    // Los pedidos y cotizaciones que ya existen arrancan su línea de tiempo con su estado actual
    const [ventasExistentes] = await queryInterface.sequelize.query(
      "SELECT v.VentaID, v.EstadoID, e.Nombre, v.FechaVenta FROM ventas v JOIN estados e ON e.EstadoID = v.EstadoID WHERE NOT EXISTS (SELECT 1 FROM historial_estados h WHERE h.Tipo = 'venta' AND h.RefID = v.VentaID)"
    );
    for (const v of ventasExistentes) {
      await queryInterface.bulkInsert('historial_estados', [{ Tipo: 'venta', RefID: v.VentaID, EstadoID: v.EstadoID, Estado: v.Nombre, Nota: null, DocumentoID: null, Fecha: v.FechaVenta || new Date() }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notificaciones');
    await queryInterface.dropTable('carritos');
    await queryInterface.dropTable('tarifas_tecnica');
    await queryInterface.dropTable('historial_estados');
    for (const c of ['TipoEntrega', 'CostoEnvio', 'FechaEstimadaEntrega', 'ComprobanteMotivoRechazo', 'ContactoNombre', 'ContactoTelefono', 'ContactoDireccion']) {
      await queryInterface.removeColumn('ventas', c).catch(() => {});
    }
  },
};
