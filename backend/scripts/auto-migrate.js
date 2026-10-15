'use strict';

const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');
const db = require('../models');

// Configuración
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const DRY_RUN = process.env.DRY_RUN === 'true'; // Si true, solo muestra cambios sin ejecutar

// Mapeo de tipos Sequelize a MySQL
const TYPE_MAPPINGS = {
    'INTEGER': ['int', 'integer', 'int(11)'],
    'BIGINT': ['bigint', 'bigint(20)'],
    'STRING': ['varchar', 'varchar(255)'],
    'TEXT': ['text', 'mediumtext', 'longtext'],
    'BOOLEAN': ['tinyint', 'tinyint(1)', 'boolean'],
    'DATE': ['datetime', 'timestamp'],
    'DECIMAL': ['decimal'],
    'FLOAT': ['float'],
    'DOUBLE': ['double']
};

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Obtener información de la base de datos
async function getDatabaseTables() {
    const tables = await db.sequelize.query(
        `SELECT TABLE_NAME 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_TYPE = 'BASE TABLE'`,
        { type: QueryTypes.SELECT }
    );
    return tables.map(t => t.TABLE_NAME.toLowerCase());
}

async function getTableColumns(tableName) {
    const columns = await db.sequelize.query(
        `SELECT 
      COLUMN_NAME as name,
      DATA_TYPE as type,
      COLUMN_TYPE as fullType,
      IS_NULLABLE as nullable,
      COLUMN_KEY as key_type,
      COLUMN_DEFAULT as defaultValue,
      EXTRA as extra
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION`,
        {
            replacements: [tableName],
            type: QueryTypes.SELECT
        }
    );
    return columns;
}

async function getTableForeignKeys(tableName) {
    const fks = await db.sequelize.query(
        `SELECT 
      CONSTRAINT_NAME as name,
      COLUMN_NAME as \`column\`,
      REFERENCED_TABLE_NAME as referencedTable,
      REFERENCED_COLUMN_NAME as referencedColumn
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
    AND REFERENCED_TABLE_NAME IS NOT NULL`,
        {
            replacements: [tableName],
            type: QueryTypes.SELECT
        }
    );
    return fks;
}

// Normalizar tipo de Sequelize
function normalizeSequelizeType(type) {
    if (!type) return 'STRING';

    const typeStr = type.toString().toUpperCase();

    if (typeStr.includes('INTEGER') || typeStr.includes('INT')) return 'INTEGER';
    if (typeStr.includes('BIGINT')) return 'BIGINT';
    if (typeStr.includes('STRING') || typeStr.includes('VARCHAR')) return 'STRING';
    if (typeStr.includes('TEXT')) return 'TEXT';
    if (typeStr.includes('BOOLEAN') || typeStr.includes('TINYINT(1)')) return 'BOOLEAN';
    if (typeStr.includes('DATE') || typeStr.includes('DATETIME')) return 'DATE';
    if (typeStr.includes('DECIMAL')) return 'DECIMAL';
    if (typeStr.includes('FLOAT')) return 'FLOAT';
    if (typeStr.includes('DOUBLE')) return 'DOUBLE';

    return 'STRING';
}

// Comparar tipos
function typesMatch(sequelizeType, mysqlType) {
    const normalizedSeq = normalizeSequelizeType(sequelizeType);
    const mysqlLower = mysqlType.toLowerCase();

    const mappings = TYPE_MAPPINGS[normalizedSeq] || [];
    return mappings.some(mapping => mysqlLower.startsWith(mapping));
}

// Analizar modelos
function getModelInfo(modelName) {
    const model = db[modelName];
    if (!model) return null;

    const tableName = model.tableName || model.name.toLowerCase();
    const attributes = model.rawAttributes;
    const associations = model.associations || {};

    return {
        modelName,
        tableName,
        attributes,
        associations
    };
}

// Generar migración
class MigrationGenerator {
    constructor() {
        this.changes = {
            createTables: [],
            dropTables: [],
            addColumns: [],
            removeColumns: [],
            modifyColumns: [],
            addForeignKeys: [],
            dropForeignKeys: []
        };
    }

    addCreateTable(tableName, columns) {
        this.changes.createTables.push({ tableName, columns });
    }

    addDropTable(tableName) {
        this.changes.dropTables.push(tableName);
    }

    addColumn(tableName, columnName, definition) {
        this.changes.addColumns.push({ tableName, columnName, definition });
    }

    addModifyColumn(tableName, columnName, oldDef, newDef) {
        this.changes.modifyColumns.push({ tableName, columnName, oldDef, newDef });
    }

    addForeignKey(tableName, columnName, references) {
        this.changes.addForeignKeys.push({ tableName, columnName, references });
    }

    hasChanges() {
        return Object.values(this.changes).some(arr => arr.length > 0);
    }

    generateMigrationFile() {
        if (!this.hasChanges()) {
            log('\n✓ No se detectaron cambios. La base de datos está sincronizada.', 'green');
            return null;
        }

        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const filename = `${timestamp}-auto-migration.js`;
        const filepath = path.join(MIGRATIONS_DIR, filename);

        let upCode = '';
        let downCode = '';

        // Crear tablas
        this.changes.createTables.forEach(({ tableName, columns }) => {
            log(`  → Crear tabla: ${tableName}`, 'green');
            upCode += `
    // Crear tabla ${tableName}
    await queryInterface.createTable('${tableName}', {
${this._generateColumnDefinitions(columns)}
    });
`;
            downCode += `
    await queryInterface.dropTable('${tableName}');
`;
        });

        // Agregar columnas
        this.changes.addColumns.forEach(({ tableName, columnName, definition }) => {
            log(`  → Agregar columna: ${tableName}.${columnName}`, 'green');
            upCode += `
    // Agregar columna ${columnName} a ${tableName}
    await queryInterface.addColumn('${tableName}', '${columnName}', ${this._formatColumnDef(definition)});
`;
            downCode += `
    await queryInterface.removeColumn('${tableName}', '${columnName}');
`;
        });

        // Modificar columnas
        this.changes.modifyColumns.forEach(({ tableName, columnName, newDef }) => {
            log(`  → Modificar columna: ${tableName}.${columnName}`, 'yellow');
            upCode += `
    // Modificar columna ${columnName} en ${tableName}
    await queryInterface.changeColumn('${tableName}', '${columnName}', ${this._formatColumnDef(newDef)});
`;
        });

        // Agregar foreign keys
        this.changes.addForeignKeys.forEach(({ tableName, columnName, references }) => {
            log(`  → Agregar FK: ${tableName}.${columnName} -> ${references.model}.${references.key}`, 'cyan');
            upCode += `
    // Agregar foreign key en ${tableName}.${columnName}
    await queryInterface.addConstraint('${tableName}', {
      fields: ['${columnName}'],
      type: 'foreign key',
      name: 'fk_${tableName}_${columnName}',
      references: {
        table: '${references.model.toLowerCase()}',
        field: '${references.key}'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
`;
            downCode += `
    await queryInterface.removeConstraint('${tableName}', 'fk_${tableName}_${columnName}');
`;
        });

        const migrationContent = `'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    ${upCode}
  },

  async down(queryInterface, Sequelize) {
    ${downCode}
  }
};
`;

        // Crear directorio si no existe
        if (!fs.existsSync(MIGRATIONS_DIR)) {
            fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        }

        fs.writeFileSync(filepath, migrationContent);
        log(`\n✓ Migración generada: ${filename}`, 'bright');

        return filepath;
    }

    _generateColumnDefinitions(columns) {
        return Object.entries(columns)
            .map(([name, def]) => {
                return `      ${name}: ${this._formatColumnDef(def)}`;
            })
            .join(',\n');
    }

    _formatColumnDef(def) {
        const parts = [];

        // Tipo
        let type = 'Sequelize.STRING';
        if (def.type) {
            const typeStr = def.type.toString();
            if (typeStr.includes('INTEGER')) {
                type = 'Sequelize.INTEGER';
            } else if (typeStr.includes('DECIMAL')) {
                const match = typeStr.match(/DECIMAL\((\d+),\s*(\d+)\)/);
                if (match) {
                    type = `Sequelize.DECIMAL(${match[1]}, ${match[2]})`;
                } else {
                    type = 'Sequelize.DECIMAL(10, 2)';
                }
            } else if (typeStr.includes('TEXT')) {
                type = 'Sequelize.TEXT';
            } else if (typeStr.includes('BOOLEAN') || typeStr.includes('TINYINT(1)')) {
                type = 'Sequelize.BOOLEAN';
            } else if (typeStr.includes('DATE')) {
                type = 'Sequelize.DATE';
            } else if (typeStr.includes('STRING')) {
                const match = typeStr.match(/STRING\((\d+)\)/);
                if (match) {
                    type = `Sequelize.STRING(${match[1]})`;
                } else {
                    type = 'Sequelize.STRING';
                }
            }
        }

        parts.push(`type: ${type}`);

        if (def.primaryKey) parts.push('primaryKey: true');
        if (def.autoIncrement) parts.push('autoIncrement: true');
        if (def.allowNull === false) parts.push('allowNull: false');
        if (def.unique) parts.push('unique: true');

        if (def.defaultValue !== undefined && def.defaultValue !== null) {
            if (def.defaultValue.toString() === 'NOW') {
                parts.push('defaultValue: Sequelize.NOW');
            } else if (typeof def.defaultValue === 'string') {
                parts.push(`defaultValue: '${def.defaultValue}'`);
            } else {
                parts.push(`defaultValue: ${def.defaultValue}`);
            }
        }

        if (def.references) {
            parts.push(`references: {
        model: '${def.references.model.toLowerCase()}',
        key: '${def.references.key}'
      }`);
        }

        return `{\n        ${parts.join(',\n        ')}\n      }`;
    }

    printSummary() {
        log('\n' + '='.repeat(60), 'bright');
        log('RESUMEN DE CAMBIOS DETECTADOS', 'bright');
        log('='.repeat(60), 'bright');

        if (this.changes.createTables.length > 0) {
            log(`\n📋 Tablas a crear: ${this.changes.createTables.length}`, 'green');
            this.changes.createTables.forEach(({ tableName }) => {
                log(`   • ${tableName}`, 'green');
            });
        }

        if (this.changes.addColumns.length > 0) {
            log(`\n➕ Columnas a agregar: ${this.changes.addColumns.length}`, 'green');
            this.changes.addColumns.forEach(({ tableName, columnName }) => {
                log(`   • ${tableName}.${columnName}`, 'green');
            });
        }

        if (this.changes.modifyColumns.length > 0) {
            log(`\n🔧 Columnas a modificar: ${this.changes.modifyColumns.length}`, 'yellow');
            this.changes.modifyColumns.forEach(({ tableName, columnName }) => {
                log(`   • ${tableName}.${columnName}`, 'yellow');
            });
        }

        if (this.changes.addForeignKeys.length > 0) {
            log(`\n🔗 Foreign Keys a agregar: ${this.changes.addForeignKeys.length}`, 'cyan');
            this.changes.addForeignKeys.forEach(({ tableName, columnName, references }) => {
                log(`   • ${tableName}.${columnName} -> ${references.model}.${references.key}`, 'cyan');
            });
        }

        if (this.changes.dropTables.length > 0) {
            log(`\n⚠️  Tablas huérfanas en BD (no en modelos): ${this.changes.dropTables.length}`, 'yellow');
            this.changes.dropTables.forEach(tableName => {
                log(`   • ${tableName} (NO SE ELIMINARÁ AUTOMÁTICAMENTE)`, 'yellow');
            });
        }

        log('\n' + '='.repeat(60) + '\n', 'bright');
    }
}

// Función principal de análisis
async function analyzeAndGenerate() {
    try {
        log('\n🔍 Iniciando análisis de base de datos...', 'bright');

        const generator = new MigrationGenerator();

        // Obtener tablas de BD
        const dbTables = await getDatabaseTables();
        log(`\n✓ Tablas en BD: ${dbTables.length}`, 'cyan');

        // Obtener modelos
        const modelNames = Object.keys(db).filter(
            key => !['sequelize', 'Sequelize'].includes(key)
        );
        log(`✓ Modelos definidos: ${modelNames.length}`, 'cyan');

        const modelTables = new Set();

        // Analizar cada modelo
        for (const modelName of modelNames) {
            const modelInfo = getModelInfo(modelName);
            if (!modelInfo) continue;

            const { tableName, attributes } = modelInfo;
            modelTables.add(tableName.toLowerCase());

            log(`\n📊 Analizando modelo: ${modelName} (tabla: ${tableName})`, 'blue');

            // Verificar si la tabla existe
            if (!dbTables.includes(tableName.toLowerCase())) {
                log(`  ⚠️  Tabla no existe en BD`, 'red');
                generator.addCreateTable(tableName, attributes);
                continue;
            }

            // Obtener columnas de BD
            const dbColumns = await getTableColumns(tableName);
            const dbColumnNames = dbColumns.map(c => c.name.toLowerCase());

            // Obtener FKs de BD
            const dbFKs = await getTableForeignKeys(tableName);
            const dbFKMap = {};
            dbFKs.forEach(fk => {
                dbFKMap[fk.column.toLowerCase()] = fk;
            });

            // Comparar columnas
            for (const [attrName, attrDef] of Object.entries(attributes)) {
                const columnName = attrName;

                if (!dbColumnNames.includes(columnName.toLowerCase())) {
                    log(`  ➕ Columna faltante: ${columnName}`, 'yellow');
                    generator.addColumn(tableName, columnName, attrDef);

                    // Verificar si necesita FK
                    if (attrDef.references) {
                        generator.addForeignKey(tableName, columnName, attrDef.references);
                    }
                } else {
                    // Verificar tipo
                    const dbColumn = dbColumns.find(c => c.name.toLowerCase() === columnName.toLowerCase());
                    if (dbColumn && !typesMatch(attrDef.type, dbColumn.type)) {
                        log(`  🔧 Tipo diferente en ${columnName}: modelo=${normalizeSequelizeType(attrDef.type)}, BD=${dbColumn.type}`, 'yellow');
                        generator.addModifyColumn(tableName, columnName, dbColumn, attrDef);
                    }

                    // Verificar FK faltante
                    if (attrDef.references && !dbFKMap[columnName.toLowerCase()]) {
                        log(`  🔗 FK faltante en ${columnName}`, 'cyan');
                        generator.addForeignKey(tableName, columnName, attrDef.references);
                    }
                }
            }
        }

        // Detectar tablas huérfanas
        for (const dbTable of dbTables) {
            if (!modelTables.has(dbTable)) {
                log(`\n⚠️  Tabla huérfana en BD: ${dbTable} (no hay modelo)`, 'yellow');
                generator.addDropTable(dbTable);
            }
        }

        // Imprimir resumen
        generator.printSummary();

        // Generar archivo de migración
        if (!DRY_RUN) {
            const filepath = generator.generateMigrationFile();
            if (filepath) {
                log(`\n📝 Para aplicar la migración, ejecuta:`, 'bright');
                log(`   npx sequelize-cli db:migrate`, 'cyan');
                log(`\n📝 Para revertir:`, 'bright');
                log(`   npx sequelize-cli db:migrate:undo`, 'cyan');
            }
        } else {
            log('\n⚠️  Modo DRY_RUN activado - no se generó archivo', 'yellow');
        }

        log('\n✅ Análisis completado\n', 'green');

    } catch (error) {
        log(`\n❌ Error durante el análisis: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

// Ejecutar
if (require.main === module) {
    analyzeAndGenerate();
}

module.exports = { analyzeAndGenerate, MigrationGenerator };

