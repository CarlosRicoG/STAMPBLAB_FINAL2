// migrations/04-agregar-precio-unitario-detallecompra.js
'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('detallecompra');

        if (!tableInfo.PrecioUnitario) {
            await queryInterface.addColumn('detallecompra', 'PrecioUnitario', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Precio al que se compró'
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('detallecompra', 'PrecioUnitario');
    }
};