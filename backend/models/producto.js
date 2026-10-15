'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Producto extends Model {
        static associate(models) {
            Producto.hasMany(models.InventarioProducto, {
                foreignKey: 'ProductoID',
                as: 'inventario'
            });

            Producto.hasMany(models.DetalleVenta, {
                foreignKey: 'ProductoID',
                as: 'detallesVenta'
            });

            Producto.hasMany(models.DetalleCotizacion, {
                foreignKey: 'ProductoID',
                as: 'detallesCotizacion'
            });
        }
    }

    Producto.init({
        ProductoID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Descripcion: DataTypes.STRING,
        PrecioBase: {  // nuevo campo
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Precio base del producto sin adicionales'
        },
        ImagenProducto: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Producto',
        tableName: 'productos',
        timestamps: false
    });

    return Producto;
};