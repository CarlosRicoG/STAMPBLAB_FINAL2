'use strict';
/** Tokens de sesión cerrados (logout) antes de su vencimiento. Se purgan solos al vencer. */
module.exports = (sequelize, DataTypes) => {
    const SesionRevocada = sequelize.define('SesionRevocada', {
        Jti: { type: DataTypes.STRING(64), primaryKey: true },
        DocumentoID: { type: DataTypes.BIGINT, allowNull: true },
        Expira: { type: DataTypes.DATE, allowNull: false },
    }, { tableName: 'sesiones_revocadas', timestamps: false });
    return SesionRevocada;
};
