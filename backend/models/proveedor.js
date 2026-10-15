'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    static associate(models) {
      Proveedor.hasMany(models.Compra, { 
        foreignKey: 'ProveedorRefId',
        sourceKey: 'id',
        as: 'compras'
      });
    }
  }
  
  Proveedor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
      // NO USAR field, porque la columna se llama 'id' directamente
    },
    Nit: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
      // ✅ NO USAR field, porque la columna se llama 'Nit' directamente
    },
    Nombre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Correo: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Telefono: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Direccion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Estado: {
      type: DataTypes.BOOLEAN,  // tinyint(1) en MySQL = BOOLEAN en Sequelize
      allowNull: true,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Proveedor',
    tableName: 'proveedores',
    timestamps: false
  });
  
  return Proveedor;
};