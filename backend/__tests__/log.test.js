// Registro sin datos personales: rutas sin documentos ni query y correos enmascarados
const log = require('../utils/log');

describe('enmascararRuta', () => {
    test('oculta secuencias de 5 o más dígitos (documentos)', () => {
        expect(log.enmascararRuta('/api/usuarios/12345')).toBe('/api/usuarios/***');
        expect(log.enmascararRuta('/api/usuarios/1023456789')).toBe('/api/usuarios/***');
        expect(log.enmascararRuta('/api/cotizaciones/usuario/123456/x')).toBe('/api/cotizaciones/usuario/***/x');
    });

    test('deja los identificadores cortos (ids de pedido, producto…)', () => {
        expect(log.enmascararRuta('/api/ventas/1234')).toBe('/api/ventas/1234');
    });

    test('nunca incluye la query', () => {
        expect(log.enmascararRuta('/api/usuarios?search=juan@x.com')).toBe('/api/usuarios');
    });
});

describe('enmascararCorreo', () => {
    test('deja las dos primeras letras y el dominio', () => {
        expect(log.enmascararCorreo('juan.perez@dominio.com')).toBe('ju***@dominio.com');
    });

    test('usuarios muy cortos: solo la primera letra', () => {
        expect(log.enmascararCorreo('ab@x.co')).toBe('a***@x.co');
    });

    test('valores raros no revelan nada', () => {
        expect(log.enmascararCorreo('sin-arroba')).toBe('***');
        expect(log.enmascararCorreo(null)).toBe('***');
    });
});

describe('peticion (línea de registro)', () => {
    test('método, ruta enmascarada, estado y duración', () => {
        expect(log.lineaPeticion({ method: 'GET', path: '/api/usuarios/1023456789' }, 200, 12.345)).toBe('GET /api/usuarios/*** 200 12ms');
    });
});

describe('correo: el destinatario no aparece completo en el registro', () => {
    const antes = { ...process.env };
    afterEach(() => { process.env = { ...antes }; });

    test('modo consola', async () => {
        delete process.env.MAIL_USER; delete process.env.MAIL_PASS; delete process.env.MAIL_HOST; delete process.env.MAIL_MODO;
        const correo = require('../services/correo');
        const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
        await correo.enviar({ para: 'juan.perez@dominio.com', asunto: 'Hola', html: '<p>x</p>' });
        const salida = espia.mock.calls.flat().join(' ');
        espia.mockRestore();
        expect(salida).not.toContain('juan.perez@dominio.com');
        expect(salida).toContain('ju***@dominio.com');
    });
});
