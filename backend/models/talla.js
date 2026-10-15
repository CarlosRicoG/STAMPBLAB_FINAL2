'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Talla extends Model {
        static associate(models) {
            // Relación con InventarioProducto
            Talla.hasMany(models.InventarioProducto, {
                foreignKey: 'TallaID',
                as: 'inventario'
            });

            // Relación con CotizacionTalla (si existe)
            Talla.hasMany(models.CotizacionTalla, {
                foreignKey: 'TallaID',
                as: 'cotizacionesTalla'
            });

            // Relación con DetalleVenta (si existe)
            Talla.hasMany(models.DetalleVenta, {
                foreignKey: 'TallaID',
                as: 'detallesVenta'
            });
        }
    }

    Talla.init({
        TallaID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Nombre: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        Precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: null
        }
    }, {
        sequelize,
        modelName: 'Talla',
        tableName: 'tallas',
        timestamps: false
    });

    return Talla;
};