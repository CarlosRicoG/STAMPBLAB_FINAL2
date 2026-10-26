'use strict';
/** Carrito del cliente guardado en el servidor (para no perderlo al cambiar de equipo). */
module.exports = (sequelize, DataTypes) => {
    const Carrito = sequelize.define('Carrito', {
        DocumentoID: { type: DataTypes.BIGINT, primaryKey: true },
        Datos: { type: DataTypes.TEXT('long'), allowNull: false },
        Actualizado: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'carritos', timestamps: false });
    return Carrito;
};
