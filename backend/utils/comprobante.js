/**
 * Comprobante de transferencia: llega como data URL (imagen o PDF en base64) y así se guarda.
 * El navegador ya lo valida, pero el servidor no puede confiar en eso: aquí se comprueba el formato,
 * el tamaño y que el contenido sea de verdad lo que dice ser (nada de URLs externas ni texto libre).
 */
const { esImagenReal } = require('./imagenes');

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];

/** Devuelve '' si el comprobante es válido, o el mensaje de error para el usuario. */
function errorDeComprobante(valor) {
    if (typeof valor !== 'string' || !valor.trim()) return 'Debes adjuntar el comprobante de transferencia';
    const m = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(valor.trim());
    if (!m || !TIPOS.includes(m[1].toLowerCase())) return 'El comprobante debe ser una imagen (PNG, JPG, WEBP) o un PDF';
    const tipo = m[1].toLowerCase();
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > MAX_BYTES) return 'El comprobante no puede pesar más de 5 MB';
    const real = tipo === 'application/pdf' ? buffer.subarray(0, 5).toString('latin1') === '%PDF-' : esImagenReal(buffer, tipo);
    if (!real) return 'El comprobante no es un archivo válido (su contenido no coincide con el formato)';
    return '';
}

module.exports = { errorDeComprobante, MAX_BYTES };
