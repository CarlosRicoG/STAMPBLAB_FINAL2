/**
 * Reglas de negocio configurables por variables de entorno (con valores por defecto sensatos).
 *   PLAZO_PAGO_HORAS          horas para pagar un pedido pendiente antes de que se cancele solo (0 = nunca)   [48]
 *   PLAZO_CONTRAENTREGA_DIAS  días que un pedido contra entrega puede esperar antes de cancelarse solo (0 = nunca) [7]
 *   VIGENCIA_COTIZACION_DIAS  días que vive una cotización sin respuesta antes de marcarse Vencida (0 = nunca) [30]
 *   COSTO_ENVIO               costo del envío a domicilio en pesos                                           [0]
 *   STOCK_MINIMO              unidades por debajo de las cuales se avisa "stock bajo"                        [5]
 *   WHATSAPP                  número con indicativo, solo dígitos (ej. 573001234567) para los botones de WhatsApp
 *   ADMIN_NOTIFY_EMAIL        correo(s) separados por coma que reciben los avisos; si falta, se usa el de los administradores
 */
const entero = (valor, porDefecto) => {
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : porDefecto;
};

const leer = () => ({
    plazoPagoHoras: entero(process.env.PLAZO_PAGO_HORAS, 48),
    plazoContraentregaDias: entero(process.env.PLAZO_CONTRAENTREGA_DIAS, 7),
    vigenciaCotizacionDias: entero(process.env.VIGENCIA_COTIZACION_DIAS, 30),
    costoEnvio: entero(process.env.COSTO_ENVIO, 0),
    stockMinimo: entero(process.env.STOCK_MINIMO, 5),
    whatsapp: String(process.env.WHATSAPP || '').replace(/\D/g, ''),
});

module.exports = { leer };
