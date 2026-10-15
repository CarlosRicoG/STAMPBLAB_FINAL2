'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tecnica extends Model {
    static associate(models) {

      Tecnica.hasMany(models.CotizacionTecnica, { 
        foreignKey: 'TecnicaID',
        as: 'cotizacionesTecnica'
      });
    }
  }

  Tecnica.init({
    TecnicaID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        },
        len: {
          args: [4, 100],
          msg: 'El nombre debe tener entre 4 y 100 caracteres'
        }
      }
    },
    imagenTecnica: {
      type: DataTypes.TEXT('long'), 
      allowNull: true,
      comment: 'Puede ser Base64, URL o ruta local'
    },
    Descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Tecnica',
    tableName: 'tecnicas',
    timestamps: false
  });

  return Tecnica;
};