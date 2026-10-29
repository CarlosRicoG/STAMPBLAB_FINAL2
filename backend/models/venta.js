'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      // Una venta pertenece a un usuario
      Venta.belongsTo(models.Usuario, {
        foreignKey: 'DocumentoID',
        as: 'usuario'
      });

      // Una venta tiene muchos detalles
      Venta.hasMany(models.DetalleVenta, {
        foreignKey: 'VentaID',
        as: 'detalles'
      });

      // Una venta pertenece a un estado
      Venta.belongsTo(models.Estado, {
        foreignKey: 'EstadoID',
        as: 'estado'
      });
    }
  }

  Venta.init({
    VentaID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    DocumentoID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'DocumentoID'
      }
    },
    FechaVenta: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    Subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    Total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    EstadoID: {
      type: DataTypes.INTEGER,
      references: {
        model: 'estados',
        key: 'EstadoID'
      }
    },
    // CAMPOS DE MÉTODO DE PAGO - TODOS OPCIONALES
    MetodoPago: {
      type: DataTypes.STRING(50),
      allowNull: true, 
      validate: {
        isIn: [['transferencia', 'contraentrega']]
      }
    },
    ComprobanteTransferencia: {
      type: DataTypes.TEXT('long'),
      allowNull: true 
    },
    FechaTransferencia: {
      type: DataTypes.DATE,
      allowNull: true 
    },
    NombreReceptor: {
      type: DataTypes.STRING(100),
      allowNull: true 
    },
    TelefonoEntrega: {
      type: DataTypes.STRING(20),
      allowNull: true 
    },
    DireccionEntrega: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Retiro en tienda o envío a domicilio (el costo de envío lo fija el servidor)
    TipoEntrega: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'retiro',
      validate: { isIn: [['retiro', 'envio']] }
    },
    CostoEnvio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    FechaEstimadaEntrega: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Motivo por el que el administrador rechazó el comprobante (el cliente puede subir otro)
    // true cuando ya se avisó al cliente que el pedido está por cancelarse por falta de pago
    AvisoVencimiento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    ComprobanteMotivoRechazo: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    // Datos del cliente al momento de pedir (el perfil puede cambiar después sin alterar el pedido)
    ContactoNombre: { type: DataTypes.STRING(100), allowNull: true },
    ContactoTelefono: { type: DataTypes.STRING(20), allowNull: true },
    ContactoDireccion: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    sequelize,
    modelName: 'Venta',
    tableName: 'ventas',
    timestamps: false
  });

  return Venta;
};