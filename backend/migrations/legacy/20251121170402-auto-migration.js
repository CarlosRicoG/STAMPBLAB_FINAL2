'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    
    // Agregar columna Estado a compras
    await queryInterface.addColumn('compras', 'Estado', {
        type: Sequelize.STRING,
        defaultValue: 'pendiente'
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

  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.removeColumn('compras', 'Estado');

  }
};
