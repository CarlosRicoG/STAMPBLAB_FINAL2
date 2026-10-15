'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PermisoPrivilegio extends Model {
    static associate(models) {
      // Tabla intermedia
    }
  }
  
  PermisoPrivilegio.init({
    PermisoPrivilegioID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    PermisoID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Permisos',
        key: 'PermisoID'
      }
    },
    PrivilegioID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Privilegios',
        key: 'PrivilegioID'
      }
    }
  }, {
    sequelize,
    modelName: 'PermisoPrivilegio',
    tableName: 'permisoprivilegio',
    timestamps: false
  });
  
  return PermisoPrivilegio;
};