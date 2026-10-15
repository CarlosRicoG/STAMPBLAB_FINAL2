'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Privilegio extends Model {
    static associate(models) {
      // Relación muchos a muchos con Permisos
      Privilegio.belongsToMany(models.Permiso, { 
        through: models.PermisoPrivilegio,
        foreignKey: 'PrivilegioID',
        otherKey: 'PermisoID',
        as: 'permisos'
      });
    }
  }
  
  Privilegio.init({
    PrivilegioID: {
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
    modelName: 'Privilegio',
    tableName: 'privilegios',
    timestamps: false
  });
  
  return Privilegio;
};