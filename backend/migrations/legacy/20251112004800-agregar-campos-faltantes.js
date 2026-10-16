'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    // Helper function para verificar si una columna existe
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
      );
      return results.length > 0;
    };

    // 1. Agregar CantidadNecesaria a ProductoInsumo (si no existe)
    if (!(await columnExists('ProductoInsumo', 'CantidadNecesaria'))) {
      await queryInterface.addColumn('ProductoInsumo', 'CantidadNecesaria', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        after: 'InsumoID'
      });
    }

    // 2. Agregar campos a DetalleVentas (si no existen)
    if (!(await columnExists('DetalleVentas', 'ColorID'))) {
      await queryInterface.addColumn('DetalleVentas', 'ColorID', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Colores',
          key: 'ColorID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!(await columnExists('DetalleVentas', 'TallaID'))) {
      await queryInterface.addColumn('DetalleVentas', 'TallaID', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Tallas',
          key: 'TallaID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!(await columnExists('DetalleVentas', 'Cantidad'))) {
      await queryInterface.addColumn('DetalleVentas', 'Cantidad', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    if (!(await columnExists('DetalleVentas', 'PrecioUnitario'))) {
      await queryInterface.addColumn('DetalleVentas', 'PrecioUnitario', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    // 3. Agregar PrecioUnitario a DetalleCompra (si no existe)
    if (!(await columnExists('DetalleCompra', 'PrecioUnitario'))) {
      await queryInterface.addColumn('DetalleCompra', 'PrecioUnitario', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    // 4. Cambiar Estado de Compras a EstadoID
    const hasEstadoID = await columnExists('Compras', 'EstadoID');
    const hasEstado = await columnExists('Compras', 'Estado');

    if (!hasEstadoID) {
      await queryInterface.addColumn('Compras', 'EstadoID', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Estados',
          key: 'EstadoID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Migrar datos si existe la columna Estado
      if (hasEstado) {
        await queryInterface.sequelize.query(`
          UPDATE Compras 
          SET EstadoID = CASE 
            WHEN Estado = 'pendiente' THEN 1
            WHEN Estado = 'recibido' THEN 2
            WHEN Estado = 'cancelado' THEN 3
            ELSE 1
          END
          WHERE Estado IS NOT NULL
        `);
      }
    }

    // Eliminar columna vieja Estado si existe
    if (hasEstado) {
      await queryInterface.removeColumn('Compras', 'Estado');
    }

    // 5. Agregar unique a Correo en Usuarios (verificar si ya existe)
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Usuarios' 
        AND CONSTRAINT_NAME = 'usuarios_correo_unique'
    `);

    if (constraints.length === 0) {
      await queryInterface.addConstraint('Usuarios', {
        fields: ['Correo'],
        type: 'unique',
        name: 'usuarios_correo_unique'
      });
    }

  },

  down: async (queryInterface, Sequelize) => {
    // Helper function
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
      );
      return results.length > 0;
    };

    // Revertir en orden inverso
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Usuarios' 
        AND CONSTRAINT_NAME = 'usuarios_correo_unique'
    `);
    if (constraints.length > 0) {
      await queryInterface.removeConstraint('Usuarios', 'usuarios_correo_unique');
    }

    if (!(await columnExists('Compras', 'Estado'))) {
      await queryInterface.addColumn('Compras', 'Estado', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (await columnExists('Compras', 'EstadoID')) {
      await queryInterface.removeColumn('Compras', 'EstadoID');
    }

    if (await columnExists('DetalleCompra', 'PrecioUnitario')) {
      await queryInterface.removeColumn('DetalleCompra', 'PrecioUnitario');
    }
    if (await columnExists('DetalleVentas', 'PrecioUnitario')) {
      await queryInterface.removeColumn('DetalleVentas', 'PrecioUnitario');
    }
    if (await columnExists('DetalleVentas', 'Cantidad')) {
      await queryInterface.removeColumn('DetalleVentas', 'Cantidad');
    }
    if (await columnExists('DetalleVentas', 'TallaID')) {
      await queryInterface.removeColumn('DetalleVentas', 'TallaID');
    }
    if (await columnExists('DetalleVentas', 'ColorID')) {
      await queryInterface.removeColumn('DetalleVentas', 'ColorID');
    }
    if (await columnExists('ProductoInsumo', 'CantidadNecesaria')) {
      await queryInterface.removeColumn('ProductoInsumo', 'CantidadNecesaria');
    }
  }
};