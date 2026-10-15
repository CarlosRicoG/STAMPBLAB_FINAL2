'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('productos', 'PrecioBase', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            after: 'Descripcion'
        });

        console.log('✅ Campo PrecioBase agregado a la tabla productos');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('productos', 'PrecioBase');
        console.log('❌ Campo PrecioBase eliminado de la tabla productos');
    }
};