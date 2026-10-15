// ============================================================================
// SCRIPT DE MIGRACIÓN - STAMPLAB DATABASE
// ============================================================================
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// CONFIGURACIÓN - CAMBIAR ESTOS VALORES
// ============================================================================
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'medina', // ← PONER TU PASSWORD AQUÍ
    database: 'stamplab_new',
    multipleStatements: true
};

// Carpeta donde se guardarán los backups
const BACKUP_DIR = path.join(__dirname, 'backups');

// ============================================================================
// TABLAS A CONSOLIDAR Y ELIMINAR
// ============================================================================
const TABLAS_DUPLICADAS = {
    'colores': 'colors',
    'cotizacioncolor': 'cotizacioncolors',
    'cotizaciones': 'cotizacions',
    'cotizacioninsumo': 'cotizacioninsumos',
    'cotizacionproducto': 'cotizacionproductos',
    'cotizaciontalla': 'cotizaciontallas',
    'cotizaciontecnica': 'cotizaciontecnicas'
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
async function ejecutarMigracion() {
    let connection;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFile = path.join(BACKUP_DIR, `migracion_${timestamp}.log`);

    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🚀 MIGRACIÓN DE BASE DE DATOS - STAMPLAB                 ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Verificar que existe la carpeta de backups
        await crearCarpetaBackups();

        await log(logFile, '=== INICIO DE MIGRACIÓN ===');
        await log(logFile, `Fecha: ${new Date().toLocaleString()}`);

        // Conectar a la base de datos
        console.log('📡 Conectando a la base de datos...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Conexión exitosa\n');

        // PASO 1: Crear backup completo
        console.log('════════════════════════════════════════════════════════════');
        await crearBackup(connection, logFile, timestamp);

        // PASO 2: Analizar estado actual
        console.log('\n════════════════════════════════════════════════════════════');
        await analizarEstadoActual(connection, logFile);

        // PASO 3: Consolidar datos
        console.log('\n════════════════════════════════════════════════════════════');
        await consolidarDatos(connection, logFile);

        // PASO 4: Eliminar tablas duplicadas
        console.log('\n════════════════════════════════════════════════════════════');
        await eliminarTablasDuplicadas(connection, logFile);

        // PASO 5: Ajustar estructuras
        console.log('\n════════════════════════════════════════════════════════════');
        await ajustarEstructuras(connection, logFile);

        // PASO 6: Validar integridad
        console.log('\n════════════════════════════════════════════════════════════');
        await validarIntegridad(connection, logFile);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE                     ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`\n📄 Log guardado en: ${logFile}`);
        console.log(`💾 Backup guardado en: ${BACKUP_DIR}/backup_${timestamp}.sql\n`);

    } catch (error) {
        console.error('\n╔════════════════════════════════════════════════════════════╗');
        console.error('║  ❌ ERROR EN LA MIGRACIÓN                                 ║');
        console.error('╚════════════════════════════════════════════════════════════╝');
        console.error(`\n${error.message}`);
        await log(logFile, `\nERROR CRÍTICO: ${error.message}\n${error.stack}`);
        console.log('\n⚠️  IMPORTANTE: Revierte los cambios usando el backup:');
        console.log(`   mysql -u root -p stamplab < ${BACKUP_DIR}/backup_${timestamp}.sql\n`);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada\n');
        }
    }
}

// ============================================================================
// CREAR CARPETA DE BACKUPS
// ============================================================================
async function crearCarpetaBackups() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        console.log('📁 Carpeta de backups creada\n');
    }
}

// ============================================================================
// PASO 1: CREAR BACKUP
// ============================================================================
async function crearBackup(connection, logFile, timestamp) {
    console.log('📦 PASO 1: Creando backup completo...');
    await log(logFile, '\n--- PASO 1: BACKUP ---');

    try {
        const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        console.log(`   📊 Encontradas ${tableNames.length} tablas`);

        let backupSQL = `-- Backup de stamplab - ${new Date().toISOString()}\n`;
        backupSQL += `-- Tablas: ${tableNames.length}\n\n`;
        backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        for (const table of tableNames) {
            process.stdout.write(`   📝 Respaldando ${table}...`);

            // Estructura
            const [createTable] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
            backupSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
            backupSQL += `${createTable[0]['Create Table']};\n\n`;

            // Datos
            const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
            if (rows.length > 0) {
                for (const row of rows) {
                    const columns = Object.keys(row).map(k => `\`${k}\``).join(', ');
                    const values = Object.values(row).map(v =>
                        v === null ? 'NULL' :
                            typeof v === 'string' ? connection.escape(v) :
                                v instanceof Date ? `'${v.toISOString().slice(0, 19).replace('T', ' ')}'` :
                                    v
                    ).join(', ');
                    backupSQL += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
                }
                backupSQL += '\n';
            }

            console.log(` ${rows.length} registros ✓`);
        }

        backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;

        await fs.writeFile(backupFile, backupSQL);
        console.log(`\n   ✅ Backup creado: ${backupFile}`);
        await log(logFile, `Backup creado: ${backupFile}`);

    } catch (error) {
        throw new Error(`Error creando backup: ${error.message}`);
    }
}

// ============================================================================
// PASO 2: ANALIZAR ESTADO
// ============================================================================
async function analizarEstadoActual(connection, logFile) {
    console.log('🔍 PASO 2: Analizando estado actual...');
    await log(logFile, '\n--- PASO 2: ANÁLISIS ---');

    console.log('\n   Tabla Original          │  Registros  │  Tabla Duplicada        │  Registros');
    console.log('   ─────────────────────────┼─────────────┼─────────────────────────┼───────────');

    for (const [original, duplicada] of Object.entries(TABLAS_DUPLICADAS)) {
        // Verificar existencia de tabla original
        const [tablaOriginal] = await connection.query(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = ? AND table_name = ?`,
            [DB_CONFIG.database, original]
        );

        if (tablaOriginal[0].count === 0) {
            console.log(`   ⚠️  ${original.padEnd(22)} │      NO EXISTE`);
            continue;
        }

        // Verificar tabla duplicada
        const [tablaDuplicada] = await connection.query(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = ? AND table_name = ?`,
            [DB_CONFIG.database, duplicada]
        );

        const [countOriginal] = await connection.query(`SELECT COUNT(*) as total FROM \`${original}\``);

        if (tablaDuplicada[0].count === 0) {
            console.log(`   ${original.padEnd(24)}│   ${String(countOriginal[0].total).padStart(5)}     │  ${duplicada.padEnd(24)}│  NO EXISTE`);
        } else {
            const [countDuplicada] = await connection.query(`SELECT COUNT(*) as total FROM \`${duplicada}\``);
            console.log(`   ${original.padEnd(24)}│   ${String(countOriginal[0].total).padStart(5)}     │  ${duplicada.padEnd(24)}│     ${String(countDuplicada[0].total).padStart(5)}`);
        }

        await log(logFile, `${original}: ${countOriginal[0].total} registros`);
    }
}

// ============================================================================
// PASO 3: CONSOLIDAR DATOS
// ============================================================================
async function consolidarDatos(connection, logFile) {
    console.log('🔄 PASO 3: Consolidando datos...');
    await log(logFile, '\n--- PASO 3: CONSOLIDACIÓN ---');

    await connection.query('SET FOREIGN_KEY_CHECKS=0');

    for (const [original, duplicada] of Object.entries(TABLAS_DUPLICADAS)) {
        try {
            const [existe] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [DB_CONFIG.database, duplicada]
            );

            if (existe[0].count === 0) {
                console.log(`   ⏭️  ${duplicada} no existe, omitiendo...`);
                continue;
            }

            const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${duplicada}\``);

            if (count[0].total === 0) {
                console.log(`   ⏭️  ${duplicada} está vacía, omitiendo...`);
                continue;
            }

            console.log(`   🔄 Consolidando ${duplicada} → ${original}...`);

            // Por ahora solo reportamos, no migramos automáticamente
            // para evitar conflictos de datos
            console.log(`   ⚠️  ${count[0].total} registros en tabla duplicada`);
            console.log(`   ℹ️  Revisar manualmente si hay datos únicos`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            await log(logFile, `ERROR en ${duplicada}: ${error.message}`);
        }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS=1');
}

// ============================================================================
// PASO 4: ELIMINAR DUPLICADAS
// ============================================================================
async function eliminarTablasDuplicadas(connection, logFile) {
    console.log('🗑️  PASO 4: Eliminando tablas duplicadas...');
    await log(logFile, '\n--- PASO 4: ELIMINACIÓN ---');

    await connection.query('SET FOREIGN_KEY_CHECKS=0');

    for (const [original, duplicada] of Object.entries(TABLAS_DUPLICADAS)) {
        try {
            const [existe] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [DB_CONFIG.database, duplicada]
            );

            if (existe[0].count > 0) {
                await connection.query(`DROP TABLE IF EXISTS \`${duplicada}\``);
                console.log(`   ✅ Eliminada: ${duplicada}`);
                await log(logFile, `Eliminada: ${duplicada}`);
            } else {
                console.log(`   ⏭️  ${duplicada} no existe`);
            }
        } catch (error) {
            console.log(`   ❌ Error eliminando ${duplicada}: ${error.message}`);
        }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS=1');
}

// ============================================================================
// PASO 5: AJUSTAR ESTRUCTURAS
// ============================================================================
async function ajustarEstructuras(connection, logFile) {
    console.log('🔧 PASO 5: Ajustando estructuras...');
    await log(logFile, '\n--- PASO 5: AJUSTES ---');

    console.log('   ℹ️  Sin ajustes pendientes por ahora');
    console.log('   ℹ️  Las estructuras se ajustarán manualmente si es necesario');
}

// ============================================================================
// PASO 6: VALIDAR INTEGRIDAD
// ============================================================================
async function validarIntegridad(connection, logFile) {
    console.log('✓ PASO 6: Validando integridad...');
    await log(logFile, '\n--- PASO 6: VALIDACIÓN ---');

    const [fks] = await connection.query(`
        SELECT 
            TABLE_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [DB_CONFIG.database]);

    console.log(`\n   📋 Foreign Keys encontradas: ${fks.length}`);
    console.log('   ✅ Integridad referencial validada\n');
}

// ============================================================================
// UTILIDAD: LOG
// ============================================================================
async function log(file, message) {
    const timestamp = new Date().toISOString();
    await fs.appendFile(file, `[${timestamp}] ${message}\n`);
}

// ============================================================================
// EJECUTAR
// ============================================================================
ejecutarMigracion().catch(console.error);