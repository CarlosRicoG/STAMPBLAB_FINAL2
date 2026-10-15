'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class InventarioProducto extends Model {
        static associate(models) {
            InventarioProducto.belongsTo(models.Producto, {
                foreignKey: 'ProductoID',
                as: 'producto'
            });

            InventarioProducto.belongsTo(models.Color, {
                foreignKey: 'ColorID',
                as: 'color'
            });

            InventarioProducto.belongsTo(models.Talla, {
                foreignKey: 'TallaID',
                as: 'talla'
            });

            // Nueva relación con Insumo (Tela)
            InventarioProducto.belongsTo(models.Insumo, {
                foreignKey: 'TelaID',
                as: 'tela'
            });
        }
    }

    InventarioProducto.init({
        InventarioID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ProductoID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Productos',
                key: 'ProductoID'
            }
        },
        ColorID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Colores',
                key: 'ColorID'
            }
        },
        TallaID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Tallas',
                key: 'TallaID'
            }
        },
        
        TelaID: {
            type: DataTypes.INTEGER,
            allowNull: true, // Puede ser NULL para productos sin tela
            references: {
                model: 'Insumos',
                key: 'InsumoID'
            }
        },
        Stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        Estado: {
            type: DataTypes.TINYINT(1),
            allowNull: true,
            defaultValue: 1
        }
    }, {
        sequelize,
        modelName: 'InventarioProducto',
        tableName: 'inventarioproducto',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return InventarioProducto;
};