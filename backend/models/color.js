'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Color extends Model {
        static associate(models) {
            // Relación con InventarioProducto
            Color.hasMany(models.InventarioProducto, {
                foreignKey: 'ColorID',
                as: 'inventario'
            });

            // Relación con CotizacionColor (si existe)
            Color.hasMany(models.CotizacionColor, {
                foreignKey: 'ColorID',
                as: 'cotizacionesColor'
            });

            // Relación con DetalleVenta (si existe)
            Color.hasMany(models.DetalleVenta, {
                foreignKey: 'ColorID',
                as: 'detallesVenta'
            });
        }
    }

    Color.init({
        ColorID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Nombre: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Color',
        tableName: 'colores',
        timestamps: false
    });

    return Color;
};