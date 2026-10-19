/**
 * Respaldo: copia la carpeta uploads/ y, si mysqldump está disponible, la base de datos.
 * Uso:  npm run respaldo   (destino por defecto ./respaldos/AAAA-MM-DD_HHMM; cambia con RESPALDO_DIR)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const sello = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '');
const base = path.resolve(process.env.RESPALDO_DIR || path.join(__dirname, '..', 'respaldos'));
const destino = path.join(base, sello);
fs.mkdirSync(destino, { recursive: true });

const uploads = path.join(__dirname, '..', 'uploads');
if (fs.existsSync(uploads)) {
    fs.cpSync(uploads, path.join(destino, 'uploads'), { recursive: true });
    console.log('✔ uploads copiado');
} else console.log('(no hay carpeta uploads)');

const { DB_HOST = '127.0.0.1', DB_PORT = '3306', DB_USER, DB_PASSWORD, DB_NAME } = process.env;
if (DB_NAME && DB_USER) {
    const r = spawnSync('mysqldump', ['-h', DB_HOST, '-P', DB_PORT, '-u', DB_USER, '--single-transaction', '--routines', DB_NAME], { encoding: 'buffer', env: { ...process.env, MYSQL_PWD: DB_PASSWORD || '' }, maxBuffer: 1024 * 1024 * 512 });
    if (r.status === 0) { fs.writeFileSync(path.join(destino, `${DB_NAME}.sql`), r.stdout); console.log('✔ base de datos exportada'); }
    else console.log('⚠ no se pudo exportar la base (¿está mysqldump instalado?)');
}
console.log('Respaldo en', destino);
