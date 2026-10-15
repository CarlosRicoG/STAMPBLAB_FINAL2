'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Cambiar el tipo de dato de imagenTecnica a LONGTEXT
        await queryInterface.changeColumn('tecnicas', 'imagenTecnica', {
            type: Sequelize.TEXT('long'),
            allowNull: true,
            comment: 'Imagen en formato Base64, URL o ruta local'
        });

        console.log('✅ Columna imagenTecnica cambiada a LONGTEXT exitosamente');
    },

    down: async (queryInterface, Sequelize) => {
        // Revertir el cambio (volver a VARCHAR)
        await queryInterface.changeColumn('tecnicas', 'imagenTecnica', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        console.log('⏪ Columna imagenTecnica revertida a VARCHAR(255)');
    }
};