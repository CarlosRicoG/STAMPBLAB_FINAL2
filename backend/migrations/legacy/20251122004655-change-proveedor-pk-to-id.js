"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const tableDescription = await queryInterface.describeTable("proveedores");
      
      // Verificar si id ya es PK
      if (tableDescription.id && tableDescription.id.primaryKey) {
        console.log("⚠ id ya es PK en proveedores, verificando Nit...");
        
        // Asegurar que Nit sea único si no lo es
        try {
          await queryInterface.addConstraint("proveedores", {
            fields: ["Nit"],
            type: "unique",
            name: "unique_proveedor_nit"
          }, { transaction });
          console.log("✓ Constraint UNIQUE en Nit agregado");
        } catch (e) {
          console.log("⚠ Constraint UNIQUE en Nit ya existe");
        }
        
        await transaction.commit();
        return;
      }

      // 1. Eliminar FK de compras que apunta a proveedores.Nit (si existe)
      const foreignKeys = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'compras' 
         AND COLUMN_NAME = 'ProveedorID' 
         AND REFERENCED_TABLE_NAME = 'proveedores'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const fk of foreignKeys) {
        await queryInterface.removeConstraint("compras", fk.CONSTRAINT_NAME, { transaction });
        console.log(`✓ FK ${fk.CONSTRAINT_NAME} eliminada`);
      }

      // 2. Quitar la PK actual (sea Nit o lo que sea)
      try {
        await queryInterface.removeConstraint("proveedores", "PRIMARY", { transaction });
        console.log("✓ PK anterior eliminada");
      } catch (e) {
        console.log("⚠ No hay PK para eliminar");
      }

      // 3. Si id no existe, agregarla SIN autoincrement primero
      if (!tableDescription.id) {
        await queryInterface.addColumn("proveedores", "id", {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          first: true
        }, { transaction });
        console.log("✓ Columna id agregada");
        
        // Poblar con valores secuenciales
        await queryInterface.sequelize.query(`
          SET @count = 0;
          UPDATE proveedores SET id = @count:= @count + 1;
        `, { transaction });
        console.log("✓ Columna id poblada");
      }

      // 4. Ahora establecer id como PK con autoincrement (en un solo paso)
      await queryInterface.sequelize.query(`
        ALTER TABLE proveedores 
        MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
      `, { transaction });
      console.log("✓ id establecido como PK con AUTO_INCREMENT");

      // 5. Mantener Nit como único
      try {
        await queryInterface.addConstraint("proveedores", {
          fields: ["Nit"],
          type: "unique",
          name: "unique_proveedor_nit"
        }, { transaction });
        console.log("✓ Constraint UNIQUE en Nit agregado");
      } catch (e) {
        console.log("⚠ Constraint UNIQUE en Nit ya existe o falló");
      }

      await transaction.commit();
      console.log("✓ Migración completada exitosamente");
    } catch (error) {
      await transaction.rollback();
      console.error("✗ Error en migración:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revertir: quitar PK de id
      await queryInterface.removeConstraint("proveedores", "PRIMARY", { transaction });
      
      // Eliminar índice único de Nit
      try {
        await queryInterface.removeConstraint("proveedores", "unique_proveedor_nit", { transaction });
      } catch (e) {
        console.log("Constraint unique_proveedor_nit no existe");
      }
      
      // Restaurar Nit como PK
      await queryInterface.addConstraint("proveedores", {
        fields: ["Nit"],
        type: "primary key",
        name: "PRIMARY"
      }, { transaction });
      
      // Eliminar columna id
      await queryInterface.removeColumn("proveedores", "id", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};