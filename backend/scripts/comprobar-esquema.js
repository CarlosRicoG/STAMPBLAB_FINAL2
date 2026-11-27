#!/usr/bin/env node
'use strict';
/**
 * Compara el esquema de la base migrada con los modelos de Sequelize y falla (código 1) si no coinciden.
 *
 * Para cada modelo: la tabla existe, cada atributo tiene su columna con un tipo equivalente y la misma nulabilidad,
 * y la tabla no tiene columnas que el modelo no declare. Detecta el caso típico de cambiar un modelo sin escribir la
 * migración (o al revés). Tablas sin modelo (p. ej. SequelizeMeta o tablas antiguas) solo se informan.
 *
 * Uso: node scripts/comprobar-esquema.js   (lee DB_* como el resto del backend; en CI va después de db:setup)
 */
const db = require('../models');

const { sequelize } = db;
const qi = sequelize.getQueryInterface();

// Lleva un tipo (del modelo o de la base) a una forma comparable entre MySQL 8 y MariaDB:
// mayúsculas, sin espacios, sin ancho de visualización en enteros (salvo TINYINT(1) = BOOLEAN) y sinónimos unificados.
function normalizarTipo(tipo) {
  let t = String(tipo).toUpperCase().replace(/\s+/g, '').replace(/"/g, "'");
  t = t.replace(/^INTEGER/, 'INT');
  if (t === 'BOOLEAN' || t === 'BOOL') t = 'TINYINT(1)';
  if (!/^TINYINT\(1\)/.test(t)) t = t.replace(/^(TINYINT|SMALLINT|MEDIUMINT|INT|BIGINT)\(\d+\)/, '$1');
  t = t.replace(/(UNSIGNED|ZEROFILL)/g, (m) => ` ${m}`).trim();
  // MariaDB guarda JSON como LONGTEXT con CHECK; MySQL lo informa como JSON
  if (t === 'JSON') t = 'LONGTEXT';
  // Sequelize emite DATETIME para DATE y DATE para DATEONLY
  return t;
}

function tipoDelModelo(attr) {
  const type = attr.type;
  // ENUM necesita la función de escape del dialecto para generar su SQL
  if (typeof type.toSql === 'function') return type.toSql({ escape: (v) => sequelize.escape(v) });
  return type.key || String(type);
}

async function comprobar() {
  const errores = [];
  const avisos = [];
  const tablasConModelo = new Set();
  const tablasEnBase = (await qi.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
  const existe = new Map(tablasEnBase.map((t) => [t.toLowerCase(), t]));

  const modelos = Object.values(sequelize.models).sort((a, b) => a.name.localeCompare(b.name));
  for (const modelo of modelos) {
    const tabla = modelo.getTableName();
    const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName;
    tablasConModelo.add(nombreTabla.toLowerCase());
    const real = existe.get(nombreTabla.toLowerCase());
    if (!real) {
      errores.push(`${modelo.name}: falta la tabla \`${nombreTabla}\``);
      continue;
    }
    const columnas = await qi.describeTable(real);
    const porNombre = new Map(Object.entries(columnas).map(([k, v]) => [k.toLowerCase(), { nombre: k, ...v }]));
    const declaradas = new Set();

    for (const attr of Object.values(modelo.rawAttributes)) {
      const campo = attr.field || attr.fieldName;
      declaradas.add(campo.toLowerCase());
      const col = porNombre.get(campo.toLowerCase());
      if (!col) {
        errores.push(`${nombreTabla}.${campo}: falta la columna`);
        continue;
      }
      const esperado = normalizarTipo(tipoDelModelo(attr));
      const obtenido = normalizarTipo(col.type);
      if (esperado !== obtenido) {
        errores.push(`${nombreTabla}.${campo}: tipo ${obtenido} en la base, ${esperado} en el modelo`);
      }
      const nuloModelo = attr.primaryKey ? false : attr.allowNull !== false;
      if (nuloModelo !== col.allowNull) {
        errores.push(`${nombreTabla}.${campo}: ${col.allowNull ? 'admite' : 'no admite'} NULL en la base y el modelo dice lo contrario`);
      }
    }
    for (const [clave, col] of porNombre) {
      if (!declaradas.has(clave)) errores.push(`${nombreTabla}.${col.nombre}: columna en la base que el modelo no declara`);
    }
  }

  for (const t of tablasEnBase) {
    if (!tablasConModelo.has(t.toLowerCase()) && t.toLowerCase() !== 'sequelizemeta') avisos.push(`tabla \`${t}\` sin modelo`);
  }
  return { errores, avisos, modelos: modelos.length };
}

comprobar()
  .then(({ errores, avisos, modelos }) => {
    avisos.forEach((a) => console.log(`aviso: ${a}`));
    if (errores.length) {
      console.error(`El esquema migrado NO coincide con los modelos (${errores.length} diferencias):`);
      errores.forEach((e) => console.error(`  - ${e}`));
      process.exitCode = 1;
    } else {
      console.log(`Esquema migrado coincide con los ${modelos} modelos (columnas, tipos y nulabilidad).`);
    }
  })
  .catch((err) => {
    console.error('No se pudo comprobar el esquema:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
