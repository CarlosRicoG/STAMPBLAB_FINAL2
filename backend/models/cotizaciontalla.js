'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionTalla extends Model {
    static associate(models) {
      // Pertenece a un detalle de cotización
      CotizacionTalla.belongsTo(models.DetalleCotizacion, { 
        foreignKey: 'DetalleCotizacionID',
        as: 'detalleCotizacion'
      });
      
      // Pertenece a una talla
      CotizacionTalla.belongsTo(models.Talla, { 
        foreignKey: 'TallaID',
        as: 'talla'
      });
    }
  }
  
  CotizacionTalla.init({
    CotizacionTallaID: {
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
    TallaID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tallas',
        key: 'TallaID'
      }
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    PrecioTalla: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CotizacionTalla',
    tableName: 'cotizaciontalla',
    timestamps: false
  });
  
  return CotizacionTalla;
};