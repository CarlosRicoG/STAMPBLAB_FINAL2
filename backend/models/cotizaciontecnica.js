
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionTecnica extends Model {
    static associate(models) {
      // Pertenece a un detalle de cotización
      CotizacionTecnica.belongsTo(models.DetalleCotizacion, { 
        foreignKey: 'DetalleCotizacionID',
        as: 'detalleCotizacion'
      });
      
      // Pertenece a una técnica
      CotizacionTecnica.belongsTo(models.Tecnica, { 
        foreignKey: 'TecnicaID',
        as: 'tecnica'
      });
      
      // Pertenece a una parte
      CotizacionTecnica.belongsTo(models.Parte, { 
        foreignKey: 'ParteID',
        as: 'parte'
      });
    }
  }
  
  CotizacionTecnica.init({
    CotizacionTecnicaID: {
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
    TecnicaID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tecnicas',
        key: 'TecnicaID'
      }
    },
    ParteID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Partes',
        key: 'ParteID'
      }
    },
    ImagenDiseño: DataTypes.STRING,
    Observaciones: DataTypes.TEXT,
    CostoTecnica: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'CotizacionTecnica',
    tableName: 'cotizaciontecnica',
    timestamps: false
  });
  
  return CotizacionTecnica;
};