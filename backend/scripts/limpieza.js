// ============================================================================
// SCRIPT DE LIMPIEZA - TABLAS DUPLICADAS RESTANTES
// ============================================================================
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'medina', // ← PONER TU PASSWORD AQUÍ
    database: 'stamplab_new',
    multipleStatements: true
};

const BACKUP_DIR = path.join(__dirname, 'backups');

// ============================================================================
// TABLAS ADICIONALES A ELIMINAR
// ============================================================================
const TABLAS_ADICIONALES = {
    'detallecompra': 'detallecompras',
    'detallecotizacion': 'detallecotizacions',
    'detalleventa': 'detalleventas',
    'permisoprivilegio': 'permisoprivilegios',
    'productocolor': 'productocolors',
    'productoinsumo': 'productoinsumos',
    'productotalla': 'productotallas',
    'proveedores': 'proveedors',
    'rolpermiso': 'rolpermisos',
    'roles': 'rols',
    'ventas': 'venta'  // Aquí decidimos cuál es la correcta
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
async function limpiezaAdicional() {
    let connection;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFile = path.join(BACKUP_DIR, `limpieza_${timestamp}.log`);
    
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🧹 LIMPIEZA DE TABLAS DUPLICADAS RESTANTES              ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        
        await log(logFile, '=== LIMPIEZA ADICIONAL ===');
        
        console.log('📡 Conectando...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Conexión exitosa\n');
        
        // PASO 1: Analizar tablas restantes
        console.log('🔍 Analizando tablas restantes...\n');
        console.log('   Tabla Original          │  Registros  │  Tabla Duplicada        │  Registros');
        console.log('   ─────────────────────────┼─────────────┼─────────────────────────┼───────────');
        
        let tablasConDatos = [];
        
        for (const [original, duplicada] of Object.entries(TABLAS_ADICIONALES)) {
            const [existeOriginal] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [DB_CONFIG.database, original]
            );
            
            const [existeDuplicada] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.tables 
                 WHERE table_schema = ? AND table_name = ?`,
                [DB_CONFIG.database, duplicada]
            );
            
            if (existeOriginal[0].count === 0) {
                console.log(`   ⚠️  ${original.padEnd(22)} │  NO EXISTE`);
                continue;
            }
            
            if (existeDuplicada[0].count === 0) {
                console.log(`   ✓  ${original.padEnd(22)} │       OK      │  ${duplicada.padEnd(24)}│  NO EXISTE`);
                continue;
            }
            
            const [countOriginal] = await connection.query(`SELECT COUNT(*) as total FROM \`${original}\``);
            const [countDuplicada] = await connection.query(`SELECT COUNT(*) as total FROM \`${duplicada}\``);
            
            const registrosOrig = countOriginal[0].total;
            const registrosDup = countDuplicada[0].total;
            
            console.log(`   ${original.padEnd(24)}│   ${String(registrosOrig).padStart(5)}     │  ${duplicada.padEnd(24)}│     ${String(registrosDup).padStart(5)}`);
            
            if (registrosDup > 0) {
                tablasConDatos.push({ original, duplicada, registros: registrosDup });
            }
            
            await log(logFile, `${original}: ${registrosOrig} | ${duplicada}: ${registrosDup}`);
        }
        
        // PASO 2: Advertencia si hay datos
        if (tablasConDatos.length > 0) {
            console.log('\n⚠️  ADVERTENCIA: Las siguientes tablas tienen datos:');
            tablasConDatos.forEach(t => {
                console.log(`   - ${t.duplicada}: ${t.registros} registros`);
            });
            console.log('\n❌ NO SE ELIMINARÁN automáticamente.');
            console.log('   Por favor, revisa manualmente estos datos antes de eliminar.\n');
            await log(logFile, '\nADVERTENCIA: Tablas con datos no eliminadas');
            return;
        }
        
        // PASO 3: Eliminar tablas vacías
        console.log('\n🗑️  Eliminando tablas duplicadas vacías...');
        await connection.query('SET FOREIGN_KEY_CHECKS=0');
        
        let eliminadas = 0;
        for (const [original, duplicada] of Object.entries(TABLAS_ADICIONALES)) {
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
                    eliminadas++;
                }
            } catch (error) {
                console.log(`   ❌ Error eliminando ${duplicada}: ${error.message}`);
            }
        }
        
        await connection.query('SET FOREIGN_KEY_CHECKS=1');
        
        console.log(`\n✅ Total eliminadas: ${eliminadas} tablas`);
        
        // PASO 4: Verificación final
        console.log('\n🔍 Verificando tablas restantes...');
        const [todasTablas] = await connection.query('SHOW TABLES');
        const tablas = todasTablas.map(t => Object.values(t)[0]);
        
        const duplicadosRestantes = tablas.filter(t => 
            t.endsWith('s') && 
            !['roles', 'colores', 'tallas', 'permisos', 'privilegios', 'usuarios', 'productos', 'insumos', 'estados', 'ventas', 'compras', 'proveedores', 'cotizaciones', 'partes', 'tecnicas'].includes(t)
        );
        
        if (duplicadosRestantes.length > 0) {
            console.log('\n⚠️  Posibles duplicados restantes:');
            duplicadosRestantes.forEach(t => console.log(`   - ${t}`));
        } else {
            console.log('   ✅ No se detectaron más duplicados');
        }
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ LIMPIEZA COMPLETADA                                   ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        await log(logFile, `ERROR: ${error.message}`);
    } finally {
        if (connection) await connection.end();
    }
}

async function log(file, message) {
    const timestamp = new Date().toISOString();
    await fs.appendFile(file, `[${timestamp}] ${message}\n`);
}

limpiezaAdicional().catch(console.error);