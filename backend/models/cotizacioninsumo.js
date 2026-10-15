'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionInsumo extends Model {
    static associate(models) {
      // Pertenece a un detalle de cotización
      CotizacionInsumo.belongsTo(models.DetalleCotizacion, { 
        foreignKey: 'DetalleCotizacionID',
        as: 'detalleCotizacion'
      });
      
      // Pertenece a un insumo
      CotizacionInsumo.belongsTo(models.Insumo, { 
        foreignKey: 'InsumoID',
        as: 'insumo'
      });
    }
  }
  
  CotizacionInsumo.init({
    CotizacionInsumoID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    DetalleCotizacionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DetalleCotizacion',
        key: 'DetalleCotizacionID'
      }
    },
    InsumoID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Insumos',
        key: 'InsumoID'
      }
    },
    CantidadRequerida: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CotizacionInsumo',
    tableName: 'cotizacioninsumo',
    timestamps: false
  });
  
  return CotizacionInsumo;
};