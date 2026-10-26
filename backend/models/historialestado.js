'use strict';
/** Línea de tiempo de pedidos y cotizaciones: cada cambio de estado con su fecha y una nota opcional. */
module.exports = (sequelize, DataTypes) => {
    const HistorialEstado = sequelize.define('HistorialEstado', {
        HistorialID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        Tipo: { type: DataTypes.STRING(12), allowNull: false },      // 'venta' | 'cotizacion'
        RefID: { type: DataTypes.INTEGER, allowNull: false },        // VentaID o CotizacionID
        EstadoID: { type: DataTypes.INTEGER, allowNull: false },
        Estado: { type: DataTypes.STRING(60), allowNull: false },
        Nota: { type: DataTypes.STRING(300), allowNull: true },
        DocumentoID: { type: DataTypes.BIGINT, allowNull: true },    // quien hizo el cambio
        Fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'historial_estados', timestamps: false, indexes: [{ fields: ['Tipo', 'RefID'] }] });
    return HistorialEstado;
};
