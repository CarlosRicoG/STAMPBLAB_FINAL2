/**
 * Imágenes del catálogo (productos y técnicas) como ARCHIVOS en disco en lugar de base64 dentro de la BD.
 *
 *  - La BD guarda una ruta relativa:   /uploads/productos/ab12cd….png
 *  - La API devuelve la URL completa:  http://localhost:3000/uploads/productos/ab12cd….png
 *    (usa PUBLIC_URL si está definida; en producción debe apuntar a la URL pública del backend)
 *  - Lo que llega como data URL (data:image/png;base64,…) se convierte a archivo al guardar.
 *  - Los SVG y las URLs externas se dejan tal cual (un SVG subido por un usuario no se sirve como archivo).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..', 'uploads');
const EXTENSIONES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 5 * 1024 * 1024;
const CARPETAS = ['productos', 'tecnicas'];

const urlBase = () =>
    (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

/** Ruta relativa guardada en la BD -> URL completa para el cliente. Otros valores pasan sin cambios. */
function aUrlPublica(valor) {
    if (typeof valor === 'string' && valor.startsWith('/uploads/')) return urlBase() + valor;
    return valor;
}

/**
 * Valor recibido del cliente -> valor a guardar en la BD.
 *  - data URL png/jpg/webp/gif  -> guarda el archivo y devuelve la ruta relativa
 *  - URL completa de nuestro propio /uploads/<carpeta>/ -> vuelve a ruta relativa (ida y vuelta al editar)
 *  - cualquier otra cosa (vacío, URL externa, svg) -> sin cambios
 */
function normalizar(valor, carpeta) {
    if (typeof valor !== 'string' || !valor) return valor;
    const v = valor.trim();

    const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is.exec(v);
    if (m) {
        const ext = EXTENSIONES[m[1].toLowerCase()];
        if (!ext) return v; // svg u otro: se conserva como estaba
        const buffer = Buffer.from(m[2], 'base64');
        if (buffer.length > MAX_BYTES) {
            const err = new Error('La imagen supera el máximo permitido de 5 MB');
            err.status = 400;
            throw err;
        }
        fs.mkdirSync(path.join(RAIZ, carpeta), { recursive: true });
        const nombre = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
        fs.writeFileSync(path.join(RAIZ, carpeta, nombre), buffer);
        return `/uploads/${carpeta}/${nombre}`;
    }

    const propia = new RegExp(`/uploads/${carpeta}/([A-Za-z0-9._-]+)$`).exec(v);
    if (propia) return `/uploads/${carpeta}/${propia[1]}`;
    return v;
}

/** Borra el archivo si el valor es una ruta local nuestra (nunca sale de /uploads). */
function borrarSiEsLocal(valor) {
    if (typeof valor !== 'string') return;
    const m = /^\/uploads\/(productos|tecnicas)\/([A-Za-z0-9._-]+)$/.exec(valor);
    if (!m || !CARPETAS.includes(m[1])) return;
    const archivo = path.join(RAIZ, m[1], m[2]);
    if (!archivo.startsWith(RAIZ)) return;
    fs.promises.unlink(archivo).catch(() => { /* ya no existía */ });
}

module.exports = { aUrlPublica, normalizar, borrarSiEsLocal, RAIZ };
