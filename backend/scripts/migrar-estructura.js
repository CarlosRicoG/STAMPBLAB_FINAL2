// ============================================================================
// SCRIPT DE MIGRACIÓN - ACTUALIZAR ESTRUCTURA DE BASE DE DATOS
// ============================================================================
// Este script actualiza la estructura para eliminar ProductoColor/ProductoTalla
// y usar solo InventarioProducto
// ============================================================================

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'medina', // ← TU PASSWORD
    database: 'STAMPLAB_NEW',
    multipleStatements: true
};

const BACKUP_DIR = path.join(__dirname, 'backups');

async function migrarEstructura() {
    let connection;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFile = path.join(BACKUP_DIR, `migracion_estructura_${timestamp}.log`);
    
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🔄 MIGRACIÓN DE ESTRUCTURA - INVENTARIO PRODUCTO        ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        
        await log(logFile, '=== MIGRACIÓN DE ESTRUCTURA ===');
        
        // Conectar
        console.log('📡 Conectando a la base de datos...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Conexión exitosa\n');
        
        // PASO 1: Backup
        console.log('═══════════════════════════════════════════════════════════');
        await crearBackup(connection, logFile, timestamp);
        
        // PASO 2: Verificar InventarioProducto existe
        console.log('\n═══════════════════════════════════════════════════════════');
        await verificarInventario(connection, logFile);
        
        // PASO 3: Agregar campos faltantes
        console.log('\n═══════════════════════════════════════════════════════════');
        await agregarCamposFaltantes(connection, logFile);
        
        // PASO 4: Eliminar tablas obsoletas
        console.log('\n═══════════════════════════════════════════════════════════');
        await eliminarTablasObsoletas(connection, logFile);
        
        // PASO 5: Validar estructura final
        console.log('\n═══════════════════════════════════════════════════════════');
        await validarEstructura(connection, logFile);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  ✅ MIGRACIÓN DE ESTRUCTURA COMPLETADA                    ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`\n📄 Log: ${logFile}\n`);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        await log(logFile, `ERROR: ${error.message}\n${error.stack}`);
    } finally {
        if (connection) await connection.end();
    }
}

// ============================================================================
// CREAR BACKUP
// ============================================================================
async function crearBackup(connection, logFile, timestamp) {
    console.log('📦 PASO 1: Creando backup...');
    await log(logFile, '\n--- BACKUP ---');
    
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch {}
    
    const backupFile = path.join(BACKUP_DIR, `backup_estructura_${timestamp}.sql`);
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let backupSQL = `-- Backup estructura - ${new Date().toISOString()}\n\n`;
    backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    
    for (const table of tableNames) {
        const [createTable] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
        backupSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        backupSQL += `${createTable[0]['Create Table']};\n\n`;
        
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
    }
    
    backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;
    await fs.writeFile(backupFile, backupSQL);
    
    console.log(`   ✅ Backup creado: ${backupFile}`);
    await log(logFile, `Backup: ${backupFile}`);
}

// ============================================================================
// VERIFICAR INVENTARIO
// ============================================================================
async function verificarInventario(connection, logFile) {
    console.log('🔍 PASO 2: Verificando InventarioProducto...');
    await log(logFile, '\n--- VERIFICACIÓN INVENTARIO ---');
    
    const [existe] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'inventarioproducto'
    `, [DB_CONFIG.database]);
    
    if (existe[0].count === 0) {
        console.log('   ❌ InventarioProducto NO EXISTE');
        console.log('   Creando tabla...');
        
        await connection.query(`
            CREATE TABLE inventarioproducto (
                InventarioID INT AUTO_INCREMENT PRIMARY KEY,
                ProductoID INT NOT NULL,
                ColorID INT NOT NULL,
                TallaID INT NOT NULL,
                Stock INT NOT NULL DEFAULT 0,
                Estado TINYINT(1) DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID) ON DELETE CASCADE,
                FOREIGN KEY (ColorID) REFERENCES Colores(ColorID) ON DELETE CASCADE,
                FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID) ON DELETE CASCADE,
                UNIQUE KEY unique_variant (ProductoID, ColorID, TallaID)
            )
        `);
        
        console.log('   ✅ Tabla inventarioproducto creada');
    } else {
        const [count] = await connection.query('SELECT COUNT(*) as total FROM inventarioproducto');
        console.log(`   ✅ InventarioProducto existe (${count[0].total} registros)`);
    }
    
    await log(logFile, 'InventarioProducto verificado');
}

// ============================================================================
// AGREGAR CAMPOS FALTANTES
// ============================================================================
async function agregarCamposFaltantes(connection, logFile) {
    console.log('🔧 PASO 3: Agregando campos faltantes...');
    await log(logFile, '\n--- AGREGAR CAMPOS ---');
    
    const cambios = [
        {
            tabla: 'DetalleVentas',
            campo: 'ColorID',
            sql: `ALTER TABLE DetalleVentas 
                  ADD COLUMN ColorID INT,
                  ADD CONSTRAINT fk_detalleventa_color 
                      FOREIGN KEY (ColorID) REFERENCES Colores(ColorID)`
        },
        {
            tabla: 'DetalleVentas',
            campo: 'TallaID',
            sql: `ALTER TABLE DetalleVentas 
                  ADD COLUMN TallaID INT,
                  ADD CONSTRAINT fk_detalleventa_talla 
                      FOREIGN KEY (TallaID) REFERENCES Tallas(TallaID)`
        },
        {
            tabla: 'DetalleVentas',
            campo: 'Cantidad',
            sql: `ALTER TABLE DetalleVentas 
                  ADD COLUMN Cantidad INT NOT NULL DEFAULT 1`
        },
        {
            tabla: 'DetalleVentas',
            campo: 'PrecioUnitario',
            sql: `ALTER TABLE DetalleVentas 
                  ADD COLUMN PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0`
        },
        {
            tabla: 'DetalleCotizacion',
            campo: 'ProductoID',
            sql: `ALTER TABLE DetalleCotizacion 
                  ADD COLUMN ProductoID INT,
                  ADD CONSTRAINT fk_detallecotizacion_producto 
                      FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)`
        },
        {
            tabla: 'Cotizaciones',
            campo: 'DocumentoID',
            sql: `ALTER TABLE Cotizaciones 
                  ADD COLUMN DocumentoID INT,
                  ADD CONSTRAINT fk_cotizacion_usuario 
                      FOREIGN KEY (DocumentoID) REFERENCES Usuarios(DocumentoID)`
        }
    ];
    
    for (const cambio of cambios) {
        try {
            // Verificar si el campo ya existe
            const [existe] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.columns 
                WHERE table_schema = ? 
                AND table_name = ? 
                AND column_name = ?
            `, [DB_CONFIG.database, cambio.tabla, cambio.campo]);
            
            if (existe[0].count === 0) {
                await connection.query(cambio.sql);
                console.log(`   ✅ ${cambio.tabla}.${cambio.campo} agregado`);
                await log(logFile, `${cambio.tabla}.${cambio.campo} agregado`);
            } else {
                console.log(`   ⏭️  ${cambio.tabla}.${cambio.campo} ya existe`);
            }
        } catch (error) {
            if (!error.message.includes('Duplicate')) {
                console.log(`   ⚠️  ${cambio.tabla}.${cambio.campo}: ${error.message}`);
                await log(logFile, `ERROR ${cambio.tabla}.${cambio.campo}: ${error.message}`);
            }
        }
    }
}

// ============================================================================
// ELIMINAR TABLAS OBSOLETAS
// ============================================================================
async function eliminarTablasObsoletas(connection, logFile) {
    console.log('🗑️  PASO 4: Eliminando tablas obsoletas...');
    await log(logFile, '\n--- ELIMINAR OBSOLETAS ---');
    
    const tablasObsoletas = [
        'ProductoColor',
        'ProductoTalla',
        'productocolors',
        'productotallas',
        'CotizacionProducto',
        'cotizacionproductos'
    ];
    
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    
    for (const tabla of tablasObsoletas) {
        try {
            const [existe] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = ? AND table_name = ?
            `, [DB_CONFIG.database, tabla]);
            
            if (existe[0].count > 0) {
                await connection.query(`DROP TABLE IF EXISTS \`${tabla}\``);
                console.log(`   ✅ Eliminada: ${tabla}`);
                await log(logFile, `Eliminada: ${tabla}`);
            } else {
                console.log(`   ⏭️  ${tabla} no existe`);
            }
        } catch (error) {
            console.log(`   ⚠️  Error eliminando ${tabla}: ${error.message}`);
        }
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
}

// ============================================================================
// VALIDAR ESTRUCTURA
// ============================================================================
async function validarEstructura(connection, logFile) {
    console.log('✓ PASO 5: Validando estructura final...');
    await log(logFile, '\n--- VALIDACIÓN ---');
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`\n   📊 Tablas finales: ${tableNames.length}`);
    
    // Verificar tablas críticas
    const criticas = ['inventarioproducto', 'Productos', 'Colores', 'Tallas'];
    let todasOK = true;
    
    for (const tabla of criticas) {
        if (tableNames.includes(tabla)) {
            const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tabla}\``);
            console.log(`   ✅ ${tabla}: ${count[0].total} registros`);
        } else {
            console.log(`   ❌ ${tabla}: NO EXISTE`);
            todasOK = false;
        }
    }
    
    if (todasOK) {
        console.log('\n   ✅ Estructura validada correctamente');
    } else {
        console.log('\n   ⚠️  Revisar estructura manualmente');
    }
}

// ============================================================================
// UTILIDAD
// ============================================================================
async function log(file, message) {
    const timestamp = new Date().toISOString();
    await fs.appendFile(file, `[${timestamp}] ${message}\n`);
}

// ============================================================================
// EJECUTAR
// ============================================================================
migrarEstructura().catch(console.error);