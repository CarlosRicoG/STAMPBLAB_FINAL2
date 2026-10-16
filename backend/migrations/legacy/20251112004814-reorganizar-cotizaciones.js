'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    // 1. Agregar DocumentoID a Cotizaciones
    await queryInterface.addColumn('Cotizaciones', 'DocumentoID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'DocumentoID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Migrar DocumentoID de DetalleCotizacion a Cotizaciones
    const hasDetalle = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM DetalleCotizacion',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (hasDetalle[0].count > 0) {
      await queryInterface.sequelize.query(`
        UPDATE Cotizaciones c
        SET DocumentoID = (
          SELECT dc.DocumentoID 
          FROM DetalleCotizacion dc
          WHERE dc.CotizacionID = c.CotizacionID 
          LIMIT 1
        )
        WHERE c.DocumentoID IS NULL
      `);
    }

    // 3. Eliminar DocumentoID de DetalleCotizacion
    await queryInterface.removeColumn('DetalleCotizacion', 'DocumentoID');

    // 4. Agregar ProductoID a DetalleCotizacion
    await queryInterface.addColumn('DetalleCotizacion', 'ProductoID', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Productos',
        key: 'ProductoID'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 5. Eliminar tabla CotizacionProducto si existe
    const tables = await queryInterface.showAllTables();
    if (tables.includes('CotizacionProducto')) {
      await queryInterface.dropTable('CotizacionProducto');
    }

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('DetalleCotizacion', 'ProductoID');
    
    await queryInterface.addColumn('DetalleCotizacion', 'DocumentoID', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.removeColumn('Cotizaciones', 'DocumentoID');
  }
};