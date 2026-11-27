const configuracion = require('../services/config');

const PAGO = ['PAGO_BANCO', 'PAGO_TIPO_CUENTA', 'PAGO_CUENTA', 'PAGO_TITULAR', 'PAGO_DOCUMENTO', 'PAGO_NOTA'];

describe('Reglas del negocio configurables', () => {
    beforeEach(() => { for (const k of PAGO) delete process.env[k]; });
    const guardado = { ...process.env };
    afterEach(() => { process.env = { ...guardado }; });

    test('valores por defecto sensatos', () => {
        for (const k of ['PLAZO_PAGO_HORAS', 'PLAZO_CONTRAENTREGA_DIAS', 'VIGENCIA_COTIZACION_DIAS', 'COSTO_ENVIO', 'STOCK_MINIMO', 'WHATSAPP', ...PAGO]) delete process.env[k];
        expect(configuracion.leer()).toEqual({ plazoPagoHoras: 48, plazoContraentregaDias: 7, vigenciaCotizacionDias: 30, costoEnvio: 0, stockMinimo: 5, whatsapp: '', pago: null });
    });

    test('lee las variables de entorno', () => {
        Object.assign(process.env, { PLAZO_PAGO_HORAS: '24', PLAZO_CONTRAENTREGA_DIAS: '3', VIGENCIA_COTIZACION_DIAS: '10', COSTO_ENVIO: '12000', STOCK_MINIMO: '3', WHATSAPP: '+57 300 123 4567' });
        expect(configuracion.leer()).toEqual({ plazoPagoHoras: 24, plazoContraentregaDias: 3, vigenciaCotizacionDias: 10, costoEnvio: 12000, stockMinimo: 3, whatsapp: '573001234567', pago: null });
    });

    test('0 desactiva el plazo; valores inválidos o negativos vuelven al defecto', () => {
        Object.assign(process.env, { PLAZO_PAGO_HORAS: '0', VIGENCIA_COTIZACION_DIAS: '-5', COSTO_ENVIO: 'abc' });
        const c = configuracion.leer();
        expect(c.plazoPagoHoras).toBe(0);
        expect(c.vigenciaCotizacionDias).toBe(30);
        expect(c.costoEnvio).toBe(0);
    });

    test('datos de pago: sin número de cuenta no se muestra nada', () => {
        Object.assign(process.env, { PAGO_BANCO: 'Banco X', PAGO_TITULAR: 'Taller' });
        expect(configuracion.leer().pago).toBeNull();
    });

    test('datos de pago: se leen completos y recortados', () => {
        Object.assign(process.env, { PAGO_BANCO: ' Banco X ', PAGO_TIPO_CUENTA: 'Ahorros', PAGO_CUENTA: ' 123-456 ', PAGO_TITULAR: 'Taller SAS', PAGO_DOCUMENTO: 'NIT 900', PAGO_NOTA: 'Envía el comprobante' });
        expect(configuracion.leer().pago).toEqual({ banco: 'Banco X', tipoCuenta: 'Ahorros', cuenta: '123-456', titular: 'Taller SAS', documento: 'NIT 900', nota: 'Envía el comprobante' });
    });
});
