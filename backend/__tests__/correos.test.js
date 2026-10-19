const plantillas = require('../services/plantillas');

describe('Plantillas de correo', () => {
    const usuario = { Nombre: 'María José' };

    test('pedido recibido: trae número, productos, total y enlace', () => {
        const { asunto, html } = plantillas.pedidoRecibido({ usuario, venta: { VentaID: 7, Total: 125000, MetodoPago: 'transferencia' }, lineas: [{ nombre: 'Camiseta Básica', cantidad: 2, subtotal: 50000 }] });
        expect(asunto).toBe('Recibimos tu pedido #7');
        expect(html).toContain('Camiseta Básica');
        expect(html).toContain('$125.000');
        expect(html).toContain('Transferencia bancaria');
        expect(html).toContain('/miscompras');
        expect(html).toContain('Hola María');
    });

    test('cambio de estado usa un mensaje propio de cada estado', () => {
        for (const [estado, frase] of [['Pagada', 'Confirmamos tu pago'], ['En Producción', 'producción'], ['Entregada', 'entregado'], ['Cancelada', 'cancelado']]) {
            const { asunto, html } = plantillas.pedidoEstado({ usuario, venta: { VentaID: 3, Total: 1000 }, estadoNombre: estado });
            expect(asunto).toContain(estado);
            expect(html).toContain(frase);
        }
    });

    test('un estado desconocido igual genera un mensaje correcto', () => {
        const { html } = plantillas.pedidoEstado({ usuario, venta: { VentaID: 3, Total: 1 }, estadoNombre: 'Nuevo' });
        expect(html).toContain('Actualizamos el estado de tu pedido');
    });

    test('cotización aprobada muestra el total; la rechazada no', () => {
        const aprob = plantillas.cotizacionEstado({ usuario, cotizacion: { CotizacionID: 5, ValorTotal: 220000 }, estadoNombre: 'Aprobada' });
        expect(aprob.html).toContain('$220.000');
        const rech = plantillas.cotizacionEstado({ usuario, cotizacion: { CotizacionID: 5, ValorTotal: 220000 }, estadoNombre: 'Rechazada' });
        expect(rech.html).not.toContain('$220.000');
        expect(rech.html).toContain('No pudimos aprobar');
    });

    test('SEGURIDAD: el nombre del cliente y de los productos se escapa (no se inyecta HTML en el correo)', () => {
        const malo = '<script>alert(1)</script><img src=x onerror=alert(2)>';
        const { html } = plantillas.pedidoRecibido({ usuario: { Nombre: malo }, venta: { VentaID: 1, Total: 1 }, lineas: [{ nombre: malo, cantidad: 1, subtotal: 1 }] });
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<img src=x');
        expect(html).toContain('&lt;img');
    });

    test('los precios se formatean como pesos colombianos sin decimales', () => {
        expect(plantillas.cop(1234567.89)).toBe('$1.234.568');
        expect(plantillas.cop(null)).toBe('$0');
    });
});

describe('Servicio de correo', () => {
    const cargar = (env) => {
        jest.resetModules();
        const guardado = { ...process.env };
        for (const k of ['MAIL_USER', 'MAIL_PASS', 'MAIL_HOST', 'MAIL_MODO']) delete process.env[k];
        Object.assign(process.env, env);
        const m = require('../services/correo');
        return { m, restaurar: () => { process.env = guardado; } };
    };

    test('sin configuración NO envía y NO falla (modo consola)', async () => {
        const { m, restaurar } = cargar({});
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});
        expect(m.modo()).toBe('consola');
        const r = await m.enviar({ para: 'a@b.com', asunto: 'x', html: '<p>x</p>' });
        expect(r.enviado).toBe(false);
        log.mockRestore(); restaurar();
    });

    test('modo archivo guarda en el buzón (máximo 50, el más reciente primero)', async () => {
        const { m, restaurar } = cargar({ MAIL_MODO: 'archivo' });
        expect(m.modo()).toBe('archivo');
        for (let i = 0; i < 55; i++) await m.enviar({ para: 'a@b.com', asunto: 'n' + i, html: 'x' });
        expect(m.buzon.length).toBe(50);
        expect(m.buzon[0].asunto).toBe('n54');
        restaurar();
    });

    test('el modo archivo NUNCA se activa en producción', () => {
        const { m, restaurar } = cargar({ MAIL_MODO: 'archivo', NODE_ENV: 'production' });
        expect(m.modo()).toBe('consola');
        restaurar();
    });

    test('un correo de destino inválido se rechaza sin lanzar error', async () => {
        const { m, restaurar } = cargar({ MAIL_MODO: 'archivo' });
        for (const para of ['', null, 'sin-arroba', 'a@b', 'a b@c.com']) {
            const r = await m.enviar({ para, asunto: 'x', html: 'x' });
            expect(r.enviado).toBe(false);
        }
        expect(m.buzon.length).toBe(0);
        restaurar();
    });
});
