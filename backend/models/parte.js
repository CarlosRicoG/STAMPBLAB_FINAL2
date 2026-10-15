'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Parte extends Model {
    static associate(models) {
      // Relación con CotizacionTecnica
      Parte.hasMany(models.CotizacionTecnica, { 
        foreignKey: 'ParteID',
        as: 'cotizacionesTecnica'
      });
    }
  }
  
  Parte.init({
    ParteID: {
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
    modelName: 'Parte',
    tableName: 'partes',
    timestamps: false
  });
  
  return Parte;
};