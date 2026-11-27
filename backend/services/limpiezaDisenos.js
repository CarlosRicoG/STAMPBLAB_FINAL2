/**
 * Limpieza de imágenes de diseño huérfanas.
 * /api/cotizaciones/upload-diseno guarda el archivo en uploads/disenos ANTES de crear la cotización; si el cliente no
 * llega a enviarla, el archivo queda sin uso. Cada hora se borran los archivos con más de DISENOS_HUERFANOS_HORAS horas
 * (24 por defecto) que ninguna fila referencia. La única columna que guarda estos archivos es
 * cotizaciontecnica.ImagenDiseño (nombre del archivo; en datos antiguos puede ser una URL o ruta que termina en él).
 * Si la consulta a la base falla, no se borra nada. Respeta JOBS_DESACTIVADOS=1, como los vencimientos.
 */
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');

const DIR = path.join(__dirname, '..', 'uploads', 'disenos');
const NOMBRE_SUBIDA = /^[\w-][\w.-]{0,119}$/; // como los que genera multer (sin rutas ni archivos ocultos)
const MAX_BORRADOS_RONDA = 200; // tope por ronda: un fallo inesperado nunca vacía la carpeta de golpe

const horasHuerfanos = () => {
    const h = Number(process.env.DISENOS_HUERFANOS_HORAS);
    return Number.isFinite(h) && h > 0 ? h : 24;
};

// Nombre de archivo al que apunta un valor guardado (nombre, URL o ruta)
const nombreReferido = (valor) => {
    if (valor == null) return null;
    const nombre = String(valor).trim().split(/[?#]/)[0].split(/[\\/]/).pop();
    try { return decodeURIComponent(nombre) || null; } catch { return nombre || null; }
};

/** Regla pura: archivos ({ nombre, mtimeMs }) con más de `horas` y sin ninguna referencia. */
function seleccionarHuerfanos(archivos, referencias, { ahora = Date.now(), horas = horasHuerfanos() } = {}) {
    const usados = new Set(referencias.map(nombreReferido).filter(Boolean));
    const limite = ahora - horas * 3600 * 1000;
    return archivos
        .filter((a) => NOMBRE_SUBIDA.test(a.nombre) && a.mtimeMs < limite && !usados.has(a.nombre))
        .map((a) => a.nombre);
}

/** Borra los huérfanos de `dir`. Devuelve los nombres borrados. Lanza (sin borrar nada) si no puede leer las referencias. */
async function limpiar({ dir = DIR, ahora = Date.now(), horas = horasHuerfanos(), maximo = MAX_BORRADOS_RONDA } = {}) {
    if (!fs.existsSync(dir)) return [];
    const archivos = [];
    for (const nombre of await fs.promises.readdir(dir)) {
        const st = await fs.promises.stat(path.join(dir, nombre)).catch(() => null);
        if (st?.isFile()) archivos.push({ nombre, mtimeMs: st.mtimeMs });
    }
    if (!archivos.length) return [];
    const filas = await db.CotizacionTecnica.findAll({
        attributes: ['ImagenDiseño'], where: { ImagenDiseño: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } }, raw: true,
    });
    const candidatos = seleccionarHuerfanos(archivos, filas.map((f) => f['ImagenDiseño']), { ahora, horas });
    // Ninguna referencia en la base pero sí archivos viejos: sospechoso (base vacía o equivocada). No se borra nada.
    if (!filas.length && candidatos.length) {
        console.warn(`[disenos] la base no referencia ninguna imagen y hay ${candidatos.length} archivo(s) antiguo(s): no se borra nada por seguridad`);
        return [];
    }
    const borrados = [];
    for (const nombre of candidatos.slice(0, maximo)) {
        try { await fs.promises.unlink(path.join(dir, nombre)); borrados.push(nombre); } catch { /* ya no estaba */ }
    }
    return borrados;
}

let temporizador = null;
function iniciar() {
    if (temporizador || process.env.JOBS_DESACTIVADOS === '1' || process.env.NODE_ENV === 'test') return;
    const correr = () => limpiar()
        .then((b) => { if (b.length) console.log(`[disenos] ${b.length} imagen(es) sin usar borrada(s)`); })
        .catch((e) => console.error('[disenos] limpieza:', e.message));
    temporizador = setInterval(correr, 60 * 60 * 1000);
    temporizador.unref();
}
function detener() { if (temporizador) clearInterval(temporizador); temporizador = null; }

module.exports = { seleccionarHuerfanos, limpiar, horasHuerfanos, iniciar, detener };
