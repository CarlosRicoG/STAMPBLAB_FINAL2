'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.removeColumn('detalleventa', 'TecnicaID');
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn('detalleventa', 'TecnicaID', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Tecnicas',
        key: 'TecnicaID'
      }
    });
  }
};
