'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Paso 1: Agregar columna
        await queryInterface.addColumn('inventarioproducto', 'TelaID', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Referencia al insumo de tipo Tela',
            after: 'TallaID'
        });

        // Paso 2: Agregar clave foránea
        await queryInterface.addConstraint('inventarioproducto', {
            fields: ['TelaID'],
            type: 'foreign key',
            name: 'fk_inventario_tela',
            references: {
                table: 'insumos',
                field: 'InsumoID'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });

        // Paso 3: Crear índice
        await queryInterface.addIndex('inventarioproducto', ['TelaID'], {
            name: 'idx_inventario_tela'
        });
    },

    async down(queryInterface, Sequelize) {
        // Eliminar FK
        await queryInterface.removeConstraint('inventarioproducto', 'fk_inventario_tela');

        // Eliminar índice
        await queryInterface.removeIndex('inventarioproducto', 'idx_inventario_tela');

        // Eliminar columna
        await queryInterface.removeColumn('inventarioproducto', 'TelaID');
    }
};
