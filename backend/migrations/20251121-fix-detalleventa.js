'use strict';

/** 
 * Migración Final Corregida
 * - NO crea CotizacionProducto
 * - NO agrega Compras.Estado (ya existe)
 * - Recrea DetalleVenta completa
 * - NO modifica campos TINYINT (son compatibles con BOOLEAN)
 */

module.exports = {
    async up(queryInterface, Sequelize) {

        // ==========================================
        // 1. RECREAR TABLA DetalleVenta
        // ==========================================
        console.log('🗑️  Eliminando tabla detalleventa...');
        await queryInterface.dropTable('detalleventa');

        console.log('📋 Creando tabla detalleventa con estructura correcta...');
        await queryInterface.createTable('detalleventa', {
            DetalleVentaID: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            VentaID: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            ProductoID: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            ColorID: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            TallaID: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            TecnicaID: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            Cantidad: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            PrecioUnitario: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            }
        });

        // ==========================================
        // 2. AGREGAR FOREIGN KEYS A DetalleVenta
        // ==========================================
        console.log('🔗 Agregando foreign keys a detalleventa...');

        await queryInterface.addConstraint('detalleventa', {
            fields: ['VentaID'],
            type: 'foreign key',
            name: 'fk_detalleventa_venta',
            references: {
                table: 'ventas',
                field: 'VentaID'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        await queryInterface.addConstraint('detalleventa', {
            fields: ['ProductoID'],
            type: 'foreign key',
            name: 'fk_detalleventa_producto',
            references: {
                table: 'productos',
                field: 'ProductoID'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        await queryInterface.addConstraint('detalleventa', {
            fields: ['ColorID'],
            type: 'foreign key',
            name: 'fk_detalleventa_color',
            references: {
                table: 'colores',
                field: 'ColorID'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });

        await queryInterface.addConstraint('detalleventa', {
            fields: ['TallaID'],
            type: 'foreign key',
            name: 'fk_detalleventa_talla',
            references: {
                table: 'tallas',
                field: 'TallaID'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });

        await queryInterface.addConstraint('detalleventa', {
            fields: ['TecnicaID'],
            type: 'foreign key',
            name: 'fk_detalleventa_tecnica',
            references: {
                table: 'tecnicas',
                field: 'TecnicaID'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });

        console.log('✅ Migración completada exitosamente');
    },

    async down(queryInterface, Sequelize) {
        console.log('⏪ Revirtiendo cambios...');

        // Eliminar constraints
        await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_tecnica');
        await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_talla');
        await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_color');
        await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_producto');
        await queryInterface.removeConstraint('detalleventa', 'fk_detalleventa_venta');

        // Eliminar tabla
        await queryInterface.dropTable('detalleventa');

        console.log('✅ Rollback completado');
    }
};