'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Rol extends Model {
    static associate(models) {
      // Un rol tiene muchos usuarios
      Rol.hasMany(models.Usuario, { 
        foreignKey: 'RolID',
        as: 'usuarios'
      });
      
      // Relación muchos a muchos con Permisos
      Rol.belongsToMany(models.Permiso, { 
        through: models.RolPermiso,
        foreignKey: 'RolID',
        otherKey: 'PermisoID',
        as: 'permisos'
      });
    }
  }
  
  Rol.init({
    RolID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    Descripcion: DataTypes.TEXT,
    Estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Rol',
    tableName: 'roles',
    timestamps: false
  });
  
  return Rol;
};