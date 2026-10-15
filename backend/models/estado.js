'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Estado extends Model {
    static associate(models) {
      // Un estado tiene muchas ventas
      Estado.hasMany(models.Venta, { 
        foreignKey: 'EstadoID',
        as: 'ventas'
      });
      
      // Un estado tiene muchas cotizaciones
      Estado.hasMany(models.Cotizacion, { 
        foreignKey: 'EstadoID',
        as: 'cotizaciones'
      });
    }
  }
  
  Estado.init({
    EstadoID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    Tipo: {
      type: DataTypes.ENUM('cotizacion', 'venta'),
      allowNull: false,
      comment: 'Define a qué módulo pertenece este estado'
    },
    Descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Estado',
    tableName: 'estados',
    timestamps: false
  });
  
  return Estado;
};