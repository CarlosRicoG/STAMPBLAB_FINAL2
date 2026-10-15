'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionProducto extends Model {
    static associate(models) {
      // Pertenece a un detalle de cotización
      CotizacionProducto.belongsTo(models.DetalleCotizacion, { 
        foreignKey: 'DetalleCotizacionID',
        as: 'detalleCotizacion'
      });
      
      // Pertenece a un producto
      CotizacionProducto.belongsTo(models.Producto, { 
        foreignKey: 'ProductoID',
        as: 'producto'
      });
    }
  }
  
  CotizacionProducto.init({
    CotizacionProductoID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    DetalleCotizacionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DetalleCotizacion',
        key: 'DetalleCotizacionID'
      }
    },
    ProductoID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Productos',
        key: 'ProductoID'
      }
    },
    Cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    PrecioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    Subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CotizacionProducto',
    tableName: 'CotizacionProducto',
    timestamps: false
  });
  
  return CotizacionProducto;
};