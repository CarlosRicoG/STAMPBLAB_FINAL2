// Convierte las imágenes base64 que ya están en la BD (productos y técnicas) a archivos en /uploads.
// Seguro de repetir: lo que ya es ruta/URL o SVG se deja igual.  Uso: node scripts/migrar-imagenes.js
const db = require('../models');
const { normalizar } = require('../utils/imagenes');

(async () => {
    try {
        let convertidas = 0, omitidas = 0;
        const trabajos = [
            { Modelo: db.Producto, campo: 'ImagenProducto', carpeta: 'productos' },
            { Modelo: db.Tecnica, campo: 'imagenTecnica', carpeta: 'tecnicas' },
        ];
        for (const { Modelo, campo, carpeta } of trabajos) {
            const filas = await Modelo.findAll();
            for (const fila of filas) {
                const actual = fila.getDataValue(campo);
                if (typeof actual !== 'string' || !actual.startsWith('data:image/')) continue;
                const nuevo = normalizar(actual, carpeta);
                if (nuevo === actual) { omitidas++; continue; } // p. ej. SVG
                await fila.update({ [campo]: nuevo });
                convertidas++;
            }
        }
        console.log(`Imagenes migradas a archivos: ${convertidas} (sin cambios, p. ej. SVG: ${omitidas})`);
        process.exit(0);
    } catch (e) {
        console.error('Fallo la migracion de imagenes:', e.message);
        process.exit(1);
    }
})();
