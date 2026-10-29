'use strict';
/**
 * El DocumentoID (cédula/NIT/pasaporte) era INT de 32 bits (máx. 2.147.483.647) y un documento
 * de 10 dígitos más grande fallaba con "Out of range value". Pasa a BIGINT en las 3 tablas que lo usan.
 * En una base nueva (creada por el baseline desde los modelos) ya es BIGINT y esto no cambia nada.
 *
 * MySQL no deja cambiar el tipo de una columna referenciada por claves foráneas: se leen las FK
 * que apuntan a usuarios.DocumentoID, se eliminan, se cambia el tipo y se recrean idénticas.
 */
const TABLAS = ['usuarios', 'ventas', 'cotizaciones'];

async function cambiarTipo(queryInterface, tipo) {
  const sequelize = queryInterface.sequelize;
  const q = (sql, opts = {}) => sequelize.query(sql, opts);
  const { QueryTypes } = require('sequelize');

  // Si las 3 columnas ya tienen el tipo destino (base nueva creada por el baseline) no hay nada que cambiar:
  // se evita tocar las claves foráneas, que además se nombran distinto según el motor (MySQL / MariaDB).
  const columnas = await q(
    `SELECT TABLE_NAME AS tabla, DATA_TYPE AS tipo FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'DocumentoID' AND TABLE_NAME IN (:tablas)`,
    { replacements: { tablas: TABLAS }, type: QueryTypes.SELECT }
  );
  if (columnas.length === TABLAS.length && columnas.every((c) => String(c.tipo).toLowerCase() === tipo.toLowerCase())) return;

  // Claves foráneas que referencian usuarios.DocumentoID (con sus reglas ON UPDATE / ON DELETE)
  const fks = await q(
    `SELECT k.CONSTRAINT_NAME AS nombre, k.TABLE_NAME AS tabla, k.COLUMN_NAME AS columna,
            r.UPDATE_RULE AS onUpdate, r.DELETE_RULE AS onDelete
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME = 'usuarios'
        AND k.REFERENCED_COLUMN_NAME = 'DocumentoID'`,
    { type: QueryTypes.SELECT }
  );

  for (const fk of fks) await q(`ALTER TABLE \`${fk.tabla}\` DROP FOREIGN KEY \`${fk.nombre}\``);
  for (const t of TABLAS) await q(`ALTER TABLE \`${t}\` MODIFY \`DocumentoID\` ${tipo} NOT NULL`);
  for (const fk of fks) {
    await q(
      `ALTER TABLE \`${fk.tabla}\` ADD CONSTRAINT \`${fk.nombre}\` FOREIGN KEY (\`${fk.columna}\`)
         REFERENCES \`usuarios\` (\`DocumentoID\`) ON UPDATE ${fk.onUpdate} ON DELETE ${fk.onDelete}`
    );
  }
}

module.exports = {
  up: (queryInterface) => cambiarTipo(queryInterface, 'BIGINT'),
  down: (queryInterface) => cambiarTipo(queryInterface, 'INT'),
};
