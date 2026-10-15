'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Cotizacion extends Model {
        static associate(models) {
            // Pertenece a Usuario
            Cotizacion.belongsTo(models.Usuario, {
                foreignKey: 'DocumentoID',
                as: 'usuario'
            });

            // Mantener:
            Cotizacion.hasMany(models.DetalleCotizacion, {
                foreignKey: 'CotizacionID',
                as: 'detalles'
            });

            Cotizacion.belongsTo(models.Estado, {
                foreignKey: 'EstadoID',
                as: 'estado'
            });
        }
    }

    Cotizacion.init({
        CotizacionID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        DocumentoID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios',
                key: 'DocumentoID'
            }
        },
        FechaCotizacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        ValorTotal: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        EstadoID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Estados',
                key: 'EstadoID'
            }
        }
    }, {
        sequelize,
        modelName: 'Cotizacion',
        tableName: 'cotizaciones',
        timestamps: false
    });

    return Cotizacion;
};