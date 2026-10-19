'use strict';
/** Registro de quién hizo qué: toda acción que modifica datos (POST/PUT/PATCH/DELETE) de un usuario con sesión. */
module.exports = (sequelize, DataTypes) => {
    const Auditoria = sequelize.define('Auditoria', {
        AuditoriaID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        DocumentoID: { type: DataTypes.BIGINT, allowNull: true, comment: 'Quien hizo la acción' },
        Rol: { type: DataTypes.INTEGER, allowNull: true },
        Metodo: { type: DataTypes.STRING(10), allowNull: false },
        Ruta: { type: DataTypes.STRING(255), allowNull: false },
        Entidad: { type: DataTypes.STRING(60), allowNull: true },
        EntidadID: { type: DataTypes.STRING(60), allowNull: true },
        Estado: { type: DataTypes.INTEGER, allowNull: true, comment: 'Código HTTP de la respuesta' },
        Detalle: { type: DataTypes.TEXT, allowNull: true, comment: 'Resumen del cuerpo (sin claves ni imágenes)' },
        IP: { type: DataTypes.STRING(64), allowNull: true },
    }, {
        tableName: 'auditoria',
        timestamps: false,
        indexes: [{ fields: ['Fecha'] }, { fields: ['DocumentoID'] }, { fields: ['Entidad', 'EntidadID'] }],
    });
    return Auditoria;
};
