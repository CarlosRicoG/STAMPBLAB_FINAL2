'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    
    // Crear tabla CotizacionProducto
    await queryInterface.createTable('CotizacionProducto', {
      CotizacionProductoID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      DetalleCotizacionID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
        model: 'detallecotizacion',
        key: 'DetalleCotizacionID'
      }
      },
      ProductoID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
        model: 'productos',
        key: 'ProductoID'
      }
      },
      Cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      PrecioUnitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      Subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      }
    });

    // Agregar columna Estado a compras
    await queryInterface.addColumn('compras', 'Estado', {
        type: Sequelize.STRING,
        defaultValue: 'pendiente'
      });

    // Agregar columna DocumentoID a detallecotizacion
    await queryInterface.addColumn('detallecotizacion', 'DocumentoID', {
        type: Sequelize.INTEGER,
        references: {
        model: 'usuarios',
        key: 'DocumentoID'
      }
      });

    // Agregar columna DetalleVentaID a detalleventa
    await queryInterface.addColumn('detalleventa', 'DetalleVentaID', {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      });

    // Agregar columna ColorID a detalleventa
    await queryInterface.addColumn('detalleventa', 'ColorID', {
        type: Sequelize.INTEGER,
        references: {
        model: 'colores',
        key: 'ColorID'
      }
      });

    // Agregar columna TallaID a detalleventa
    await queryInterface.addColumn('detalleventa', 'TallaID', {
        type: Sequelize.INTEGER,
        references: {
        model: 'tallas',
        key: 'TallaID'
      }
      });

    // Agregar columna Cantidad a detalleventa
    await queryInterface.addColumn('detalleventa', 'Cantidad', {
        type: Sequelize.INTEGER,
        allowNull: false
      });

    // Agregar columna PrecioUnitario a detalleventa
    await queryInterface.addColumn('detalleventa', 'PrecioUnitario', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      });

    // Modificar columna TraePrenda en detallecotizacion
    await queryInterface.changeColumn('detallecotizacion', 'TraePrenda', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });

    // Modificar columna Estado en insumos
    await queryInterface.changeColumn('insumos', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });

    // Modificar columna Estado en inventarioproducto
    await queryInterface.changeColumn('inventarioproducto', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: 1
      });

    // Modificar columna Estado en proveedores
    await queryInterface.changeColumn('proveedores', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });

    // Modificar columna Estado en roles
    await queryInterface.changeColumn('roles', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });

    // Modificar columna Estado en tecnicas
    await queryInterface.changeColumn('tecnicas', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });

    // Modificar columna Estado en ventas
    await queryInterface.changeColumn('ventas', 'Estado', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });

    // Agregar foreign key en detallecotizacion.DocumentoID
    await queryInterface.addConstraint('detallecotizacion', {
      fields: ['DocumentoID'],
      type: 'foreign key',
      name: 'fk_detallecotizacion_DocumentoID',
      references: {
        table: 'usuarios',
        field: 'DocumentoID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Agregar foreign key en detalleventa.VentaID
    await queryInterface.addConstraint('detalleventa', {
      fields: ['VentaID'],
      type: 'foreign key',
      name: 'fk_detalleventa_VentaID',
      references: {
        table: 'ventas',
        field: 'VentaID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Agregar foreign key en detalleventa.ProductoID
    await queryInterface.addConstraint('detalleventa', {
      fields: ['ProductoID'],
      type: 'foreign key',
      name: 'fk_detalleventa_ProductoID',
      references: {
        table: 'productos',
        field: 'ProductoID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Agregar foreign key en detalleventa.ColorID
    await queryInterface.addConstraint('detalleventa', {
      fields: ['ColorID'],
      type: 'foreign key',
      name: 'fk_detalleventa_ColorID',
      references: {
        table: 'colores',
        field: 'ColorID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Agregar foreign key en detalleventa.TallaID
    await queryInterface.addConstraint('detalleventa', {
      fields: ['TallaID'],
      type: 'foreign key',
      name: 'fk_detalleventa_TallaID',
      references: {
        table: 'tallas',
        field: 'TallaID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Agregar foreign key en detalleventa.TecnicaID
    await queryInterface.addConstraint('detalleventa', {
      fields: ['TecnicaID'],
      type: 'foreign key',
      name: 'fk_detalleventa_TecnicaID',
      references: {
        table: 'tecnicas',
        field: 'TecnicaID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.dropTable('CotizacionProducto');

    await queryInterface.removeColumn('compras', 'Estado');

    await queryInterface.removeColumn('detallecotizacion', 'DocumentoID');

    await queryInterface.removeColumn('detalleventa', 'DetalleVentaID');

    await queryInterface.removeColumn('detalleventa', 'ColorID');

    await queryInterface.removeColumn('detalleventa', 'TallaID');

    await queryInterface.removeColumn('detalleventa', 'Cantidad');

    await queryInterface.removeColumn('detalleventa', 'PrecioUnitario');

    await queryInterface.removeConstraint('detallecotizacion', 'fk_detallecotizacion_DocumentoID');

    await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_VentaID');

    await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_ProductoID');

    await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_ColorID');

    await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_TallaID');

    await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_TecnicaID');

  }
};
