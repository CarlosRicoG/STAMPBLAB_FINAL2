// migrations/02-modificar-tabla-ventas.js
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Eliminar columna Estado (boolean) si existe
        const tableInfo = await queryInterface.describeTable('ventas');
        if (tableInfo.Estado && tableInfo.Estado.type === 'TINYINT(1)') {
            await queryInterface.removeColumn('ventas', 'Estado');
        }

        // 2. Agregar columna EstadoID
        if (!tableInfo.EstadoID) {
            await queryInterface.addColumn('ventas', 'EstadoID', {
                type: Sequelize.INTEGER,
                allowNull: true, // Temporal
                references: {
                    model: 'estados',
                    key: 'EstadoID'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }

        // 3. Asignar un estado por defecto a ventas existentes
        await queryInterface.sequelize.query(`
      UPDATE ventas 
      SET EstadoID = (SELECT EstadoID FROM estados WHERE Tipo = 'venta' LIMIT 1)
      WHERE EstadoID IS NULL;
    `);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('ventas', 'EstadoID');
        await queryInterface.addColumn('ventas', 'Estado', {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        });
    }
};