/**
 * Ejecuta todas las pruebas de integracion y resume. Uso:  npm run test:integracion
 * Sale con codigo 1 si alguna falla.  Opcional: --fuerza-bruta (bloquea tu IP 15 min).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const pruebas = ['seguridad.js', 'validaciones.js', 'stock-flujos.js', 'cancelar-pedido.js', 'recuperacion.js', 'sesiones.js', 'correos.js', 'comprobante.js', 'abuso.js', 'concurrencia.js'];
const extra = process.argv.slice(2);
let fallaron = 0;

for (const archivo of pruebas) {
    process.stdout.write('\n▶ ' + archivo + '\n');
    const r = spawnSync(process.execPath, [path.join(__dirname, archivo), ...extra], { encoding: 'utf8' });
    const salida = (r.stdout || '') + (r.stderr || '');
    const lineasMalas = salida.split('\n').filter((l) => /^(FALLA|FAIL|EXC)/.test(l.trim()));
    const ok = /TODO OK/.test(salida) && !lineasMalas.length;
    console.log(ok ? '  ✔ TODO OK' : '  ✘ FALLO');
    if (!ok) { fallaron++; console.log(salida.split('\n').filter((l) => !/^OK/.test(l.trim())).join('\n')); }
}
console.log('\n' + (fallaron ? fallaron + ' conjunto(s) de pruebas con fallos' : 'Todas las pruebas de integracion pasaron'));
process.exit(fallaron ? 1 : 0);
