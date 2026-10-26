'use strict';
/** Notificaciones dentro de la aplicación (campana del panel): una fila por destinatario. */
module.exports = (sequelize, DataTypes) => {
    const Notificacion = sequelize.define('Notificacion', {
        NotificacionID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        DocumentoID: { type: DataTypes.BIGINT, allowNull: false },          // destinatario
        Tipo: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'sistema' }, // cotizacion | pedido | pago | stock | sistema
        Mensaje: { type: DataTypes.STRING(400), allowNull: false },
        Enlace: { type: DataTypes.STRING(200), allowNull: true },           // ruta del frontend a la que lleva
        Leida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        Archivada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        Fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'notificaciones', timestamps: false, indexes: [{ fields: ['DocumentoID', 'Archivada', 'Fecha'] }] });
    return Notificacion;
};
