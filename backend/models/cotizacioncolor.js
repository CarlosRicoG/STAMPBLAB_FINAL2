'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionColor extends Model {
    static associate(models) {
      // Pertenece a un detalle de cotización
      CotizacionColor.belongsTo(models.DetalleCotizacion, { 
        foreignKey: 'DetalleCotizacionID',
        as: 'detalleCotizacion'
      });
      
      // Pertenece a un color
      CotizacionColor.belongsTo(models.Color, { 
        foreignKey: 'ColorID',
        as: 'color'
      });
    }
  }
  
  CotizacionColor.init({
    CotizacionColorID: {
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
    ColorID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Colores',
        key: 'ColorID'
      }
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CotizacionColor',
    tableName: 'cotizacioncolor',
    timestamps: false
  });
  
  return CotizacionColor;
};