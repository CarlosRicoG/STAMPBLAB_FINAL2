'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    static associate(models) {
      // Una compra pertenece a un proveedor mediante ProveedorRefId
      Compra.belongsTo(models.Proveedor, {
        foreignKey: 'ProveedorRefId',
        targetKey: 'id',
        as: 'proveedor'
      });

      // Una compra tiene muchos detalles
      Compra.hasMany(models.DetalleCompra, {
        foreignKey: 'CompraID',
        as: 'detalles'
      });
    }
  }

  Compra.init({
    CompraID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ProveedorID: {
      type: DataTypes.STRING(255),
      allowNull: false  // ✅ Cambiar a NOT NULL según tu BD
    },
    ProveedorRefId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Proveedor',
        key: 'id'
      },
      comment: 'FK al id del proveedor'
    },
    FechaCompra: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Compra',
    tableName: 'compras',
    timestamps: false
  });

  return Compra;
};