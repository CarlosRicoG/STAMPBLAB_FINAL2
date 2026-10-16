// migrations/03-modificar-tabla-compras.js
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('compras');

        // 1. Eliminar columna Estado (varchar) si existe
        if (tableInfo.Estado && tableInfo.Estado.type.includes('VARCHAR')) {
            await queryInterface.removeColumn('compras', 'Estado');
        }

        // 2. Agregar columna EstadoID si no existe
        if (!tableInfo.EstadoID) {
            await queryInterface.addColumn('compras', 'EstadoID', {
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

        // 3. Asignar un estado por defecto
        await queryInterface.sequelize.query(`
      UPDATE compras 
      SET EstadoID = (SELECT EstadoID FROM estados WHERE Tipo = 'compra' LIMIT 1)
      WHERE EstadoID IS NULL;
    `);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('compras', 'EstadoID');
        await queryInterface.addColumn('compras', 'Estado', {
            type: Sequelize.STRING,
            defaultValue: 'pendiente'
        });
    }
};