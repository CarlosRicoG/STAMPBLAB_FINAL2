'use strict';
/** Costo estándar de estampar una técnica en una parte de la prenda (agiliza poner precio a las cotizaciones). */
module.exports = (sequelize, DataTypes) => {
    const TarifaTecnica = sequelize.define('TarifaTecnica', {
        TarifaID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        TecnicaID: { type: DataTypes.INTEGER, allowNull: false },
        ParteID: { type: DataTypes.INTEGER, allowNull: false },
        Costo: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    }, { tableName: 'tarifas_tecnica', timestamps: false, indexes: [{ unique: true, fields: ['TecnicaID', 'ParteID'] }] });
    TarifaTecnica.associate = (models) => {
        TarifaTecnica.belongsTo(models.Tecnica, { foreignKey: 'TecnicaID', as: 'tecnica' });
        TarifaTecnica.belongsTo(models.Parte, { foreignKey: 'ParteID', as: 'parte' });
    };
    return TarifaTecnica;
};
