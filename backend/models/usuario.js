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
      type: DataTypes.BIGINT,
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
        model: 'roles',
        key: 'RolID'
      }
    },
    // Contador de versión de sesión: al cambiar la contraseña sube y los tokens anteriores dejan de valer
    SesionesVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Prueba de la autorización de tratamiento de datos (Ley 1581 de 2012 / Decreto 1377 de 2013): cuándo y qué versión
    // de la política aceptó en el registro. Null en usuarios creados por el administrador desde el panel.
    PrivacidadAceptadaEn: { type: DataTypes.DATE, allowNull: true },
    PrivacidadVersion: { type: DataTypes.STRING(50), allowNull: true },
    // Cuenta suprimida a pedido del titular: la fila se conserva anonimizada para no perder sus ventas (ver miCuentaController)
    SuprimidoEn: { type: DataTypes.DATE, allowNull: true },
    // Al volver a registrarse con el documento de una cuenta suprimida: el cliente solo ve lo posterior a esta fecha
    // (sus pedidos y cotizaciones anteriores son del titular suprimido). Null = ve todo. Ver services/historialCliente
    HistorialDesde: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
  });
  
  return Usuario;
};