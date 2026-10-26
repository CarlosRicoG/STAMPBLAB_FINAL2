const configuracion = require('../services/config');

describe('Reglas del negocio configurables', () => {
    const guardado = { ...process.env };
    afterEach(() => { process.env = { ...guardado }; });

    test('valores por defecto sensatos', () => {
        for (const k of ['PLAZO_PAGO_HORAS', 'VIGENCIA_COTIZACION_DIAS', 'COSTO_ENVIO', 'STOCK_MINIMO', 'WHATSAPP']) delete process.env[k];
        expect(configuracion.leer()).toEqual({ plazoPagoHoras: 48, vigenciaCotizacionDias: 30, costoEnvio: 0, stockMinimo: 5, whatsapp: '' });
    });

    test('lee las variables de entorno', () => {
        Object.assign(process.env, { PLAZO_PAGO_HORAS: '24', VIGENCIA_COTIZACION_DIAS: '10', COSTO_ENVIO: '12000', STOCK_MINIMO: '3', WHATSAPP: '+57 300 123 4567' });
        expect(configuracion.leer()).toEqual({ plazoPagoHoras: 24, vigenciaCotizacionDias: 10, costoEnvio: 12000, stockMinimo: 3, whatsapp: '573001234567' });
    });

    test('0 desactiva el plazo; valores inválidos o negativos vuelven al defecto', () => {
        Object.assign(process.env, { PLAZO_PAGO_HORAS: '0', VIGENCIA_COTIZACION_DIAS: '-5', COSTO_ENVIO: 'abc' });
        const c = configuracion.leer();
        expect(c.plazoPagoHoras).toBe(0);
        expect(c.vigenciaCotizacionDias).toBe(30);
        expect(c.costoEnvio).toBe(0);
    });
});
