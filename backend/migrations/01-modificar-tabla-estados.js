'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Agregar columna Tipo
        await queryInterface.addColumn('estados', 'Tipo', {
            type: Sequelize.ENUM('cotizacion', 'venta', 'compra'),
            allowNull: true, // Temporal para permitir datos existentes
            after: 'Nombre'
        });

        // 2. Agregar columna Descripcion
        await queryInterface.addColumn('estados', 'Descripcion', {
            type: Sequelize.TEXT,
            allowNull: true,
            after: 'Tipo'
        });

        // 3. Actualizar registros existentes (si los hay)
        // Esto es un ejemplo, ajusta según tus datos
        await queryInterface.sequelize.query(`
      UPDATE estados SET Tipo = 'cotizacion' WHERE Nombre IN ('Pendiente', 'Aprobada', 'Rechazada');
    `);

        // 4. Hacer el campo Tipo NOT NULL después de actualizar
        await queryInterface.changeColumn('estados', 'Tipo', {
            type: Sequelize.ENUM('cotizacion', 'venta', 'compra'),
            allowNull: false
        });

        // 5. Eliminar columna VentaID si existe (era incorrecta)
        const tableInfo = await queryInterface.describeTable('estados');
        if (tableInfo.VentaID) {
            await queryInterface.removeColumn('estados', 'VentaID');
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('estados', 'Descripcion');
        await queryInterface.removeColumn('estados', 'Tipo');
    }
};