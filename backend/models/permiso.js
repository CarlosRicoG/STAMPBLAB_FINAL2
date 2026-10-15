'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permiso extends Model {
    static associate(models) {
      // Relación muchos a muchos con Roles
      Permiso.belongsToMany(models.Rol, { 
        through: models.RolPermiso,
        foreignKey: 'PermisoID',
        otherKey: 'RolID',
        as: 'roles'
      });
      
      // Relación muchos a muchos con Privilegios
      Permiso.belongsToMany(models.Privilegio, { 
        through: models.PermisoPrivilegio,
        foreignKey: 'PermisoID',
        otherKey: 'PrivilegioID',
        as: 'privilegios'
      });
    }
  }
  
  Permiso.init({
    PermisoID: {
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
    modelName: 'Permiso',
    tableName: 'permisos',
    timestamps: false
  });
  
  return Permiso;
};