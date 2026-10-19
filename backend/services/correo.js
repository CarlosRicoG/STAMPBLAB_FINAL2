/**
 * Envío de correo. NUNCA lanza errores ni frena una operación: si falla, lo anota y sigue.
 *
 * Modos (se elige solo):
 *  - smtp:    hay MAIL_USER + MAIL_PASS (Gmail con contraseña de aplicación) o MAIL_HOST/MAIL_PORT (SMTP propio) -> envía de verdad
 *  - archivo: MAIL_MODO=archivo (solo pruebas, jamás en producción) -> guarda los últimos 50 correos en memoria
 *  - consola: sin configuración -> no envía, solo deja una línea en el registro (la app funciona igual)
 */
const nodemailer = require('nodemailer');

const buzon = []; // modo archivo: últimos correos "enviados"
let transporte = null;

function modo() {
    if (process.env.MAIL_MODO === 'archivo' && process.env.NODE_ENV !== 'production') return 'archivo';
    if (process.env.MAIL_USER && process.env.MAIL_PASS) return 'smtp';
    if (process.env.MAIL_HOST) return 'smtp';
    return 'consola';
}

function obtenerTransporte() {
    if (transporte) return transporte;
    if (process.env.MAIL_HOST) {
        transporte = nodemailer.createTransport({
            host: process.env.MAIL_HOST, port: Number(process.env.MAIL_PORT) || 587,
            secure: process.env.MAIL_SECURE === 'true',
            auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined,
        });
    } else {
        transporte = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
    }
    return transporte;
}

async function enviar({ para, asunto, html }) {
    try {
        if (!para || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return { enviado: false, motivo: 'correo inválido' };
        const m = modo();
        if (m === 'archivo') {
            buzon.unshift({ para, asunto, html, fecha: new Date().toISOString() });
            buzon.length = Math.min(buzon.length, 50);
            return { enviado: true, modo: m };
        }
        if (m === 'consola') {
            console.log(`[correo] (sin configurar MAIL_USER/MAIL_PASS) no se envía "${asunto}" a ${para}`);
            return { enviado: false, modo: m, motivo: 'sin configurar' };
        }
        await obtenerTransporte().sendMail({
            from: process.env.MAIL_FROM || `STAMPLAB <${process.env.MAIL_USER || 'no-responder@stamplab.local'}>`,
            to: para, subject: asunto, html,
        });
        return { enviado: true, modo: m };
    } catch (error) {
        console.error(`[correo] no se pudo enviar "${asunto}" a ${para}:`, error.message);
        return { enviado: false, error: error.message };
    }
}

module.exports = { enviar, modo, buzon };
