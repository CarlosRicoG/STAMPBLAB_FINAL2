'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RolPermiso extends Model {
    static associate(models) {
      // Tabla intermedia, no necesita asociaciones adicionales
    }
  }
  
  RolPermiso.init({
    RolPermisoID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    RolID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'RolID'
      }
    },
    PermisoID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Permisos',
        key: 'PermisoID'
      }
    }
  }, {
    sequelize,
    modelName: 'RolPermiso',
    tableName: 'rolpermiso',
    timestamps: false
  });
  
  return RolPermiso;
};