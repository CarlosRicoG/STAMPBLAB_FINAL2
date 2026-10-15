'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Un usuario pertenece a un rol
      Usuario.belongsTo(models.Rol, { 
        foreignKey: 'RolID',
        as: 'rol'
      });
      
      // Un usuario tiene muchas ventas
      Usuario.hasMany(models.Venta, { 
        foreignKey: 'DocumentoID',
        as: 'ventas'
      });
      
      // Un usuario tiene muchas cotizaciones
      Usuario.hasMany(models.Cotizacion, { 
        foreignKey: 'DocumentoID',
        as: 'cotizaciones'
      });
    }
  }
  
  Usuario.init({
    DocumentoID: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    Nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    Correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    Direccion: DataTypes.STRING,
    Telefono: DataTypes.STRING,
    Contraseña: {
      type: DataTypes.STRING,
      allowNull: false
    },
    RolID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'RolID'
      }
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
  });
  
  return Usuario;
};