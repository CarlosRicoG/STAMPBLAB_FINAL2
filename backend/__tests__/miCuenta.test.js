// ============================================================
// Derechos del titular (Ley 1581 de 2012): acceso (descargar mis datos) y supresión (eliminar mi cuenta).
// ============================================================
jest.mock('../models', () => {
    const modelo = (extra = {}) => ({ findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn(), update: jest.fn(), destroy: jest.fn(), ...extra });
    return {
        Usuario: modelo(),
        Venta: modelo(),
        DetalleVenta: {},
        Cotizacion: modelo(),
        DetalleCotizacion: modelo(),
        CotizacionTecnica: modelo(),
        CotizacionTalla: {}, CotizacionColor: {}, CotizacionInsumo: {},
        Producto: {}, Color: {}, Talla: {}, Estado: {},
        HistorialEstado: modelo(),
        Carrito: modelo(),
        Notificacion: modelo(),
        // Transacción administrada: si el callback lanza, se deshace
        sequelize: { transaction: jest.fn(async (cb) => { const tx = { id: 'tx', LOCK: { UPDATE: 'UPDATE' } }; try { const r = await cb(tx); tx.confirmada = true; return r; } catch (e) { tx.deshecha = true; throw e; } }) },
    };
});
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hash-aleatorio'), compare: jest.fn() }));
jest.mock('../services/sesion', () => ({ revocarTodas: jest.fn(), cerrarCuenta: jest.fn() }));

const db = require('../models');
const bcrypt = require('bcryptjs');
const sesion = require('../services/sesion');
const { Op } = require('sequelize');
const { ESTADO_VENTA, ESTADO_COTIZACION } = require('../config/estados');
const controller = require('../controllers/miCuentaController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    return res;
};
const fila = (datos) => ({ ...datos, toJSON: () => ({ ...datos }), get: (k) => datos[k] });
const cliente = { id: 555, rol: 2 };

beforeEach(() => {
    jest.resetAllMocks();
    db.sequelize.transaction.mockImplementation(async (cb) => { const tx = { id: 'tx', LOCK: { UPDATE: 'UPDATE' } }; return cb(tx); });
    bcrypt.hash.mockResolvedValue('hash-aleatorio');
});

// ============================================================
describe('GET /api/mi-cuenta/datos (derecho de acceso)', () => {
    beforeEach(() => {
        db.Usuario.findByPk.mockResolvedValue(fila({
            DocumentoID: 555, Nombre: 'Ana', Correo: 'ana@x.co', Telefono: '300', Direccion: 'Calle 1', RolID: 2,
            PrivacidadAceptadaEn: new Date('2026-11-27T10:00:00Z'), PrivacidadVersion: '1.0-2026-11-27', SuprimidoEn: null, HistorialDesde: null,
        }));
        db.Venta.findAll.mockResolvedValue([
            fila({ VentaID: 1, DocumentoID: 555, Total: '10000.00', TieneComprobante: 1, FechaTransferencia: new Date('2026-11-20'), detalles: [{ ProductoID: 3, Cantidad: 2 }] }),
            fila({ VentaID: 2, DocumentoID: 555, Total: '5000.00', TieneComprobante: 0, FechaTransferencia: null, detalles: [] }),
        ]);
        db.Cotizacion.findAll.mockResolvedValue([fila({ CotizacionID: 7, DocumentoID: 555, detalles: [{ Cantidad: 10, tecnicas: [] }] })]);
        db.Notificacion.findAll.mockResolvedValue([{ Tipo: 'pedido', Mensaje: 'Recibimos tu pedido #1', Fecha: new Date(), Leida: true }]);
        db.Carrito.findByPk.mockResolvedValue({ Datos: '[{"ProductoID":3,"cantidad":1}]', Actualizado: new Date() });
        db.HistorialEstado.findAll.mockResolvedValue([
            { Tipo: 'venta', RefID: 1, Fecha: new Date('2026-11-20'), Estado: 'Pendiente', Nota: 'Pedido recibido' },
            { Tipo: 'cotizacion', RefID: 7, Fecha: new Date('2026-11-19'), Estado: 'Pendiente', Nota: null },
        ]);
    });

    test('solo consulta los datos del usuario de la sesión (ignora parámetros)', async () => {
        const res = mockRes();
        await controller.descargarDatos({ usuario: cliente, params: { id: 1 }, query: { DocumentoID: 1 } }, res);
        expect(db.Usuario.findByPk).toHaveBeenCalledWith(555, expect.anything());
        expect(db.Venta.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555 });
        expect(db.Cotizacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555 });
        expect(db.Notificacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555 });
        expect(db.Carrito.findByPk).toHaveBeenCalledWith(555, expect.anything());
    });

    test('nunca lee la contraseña, la versión de sesión ni el comprobante en base64', async () => {
        await controller.descargarDatos({ usuario: cliente }, mockRes());
        const excluidos = db.Usuario.findByPk.mock.calls[0][1].attributes.exclude;
        expect(excluidos).toEqual(expect.arrayContaining(['Contraseña', 'SesionesVersion']));
        expect(db.Venta.findAll.mock.calls[0][0].attributes.exclude).toContain('ComprobanteTransferencia');
    });

    test('devuelve perfil, autorización, pedidos con líneas e historial, cotizaciones, notificaciones y carrito', async () => {
        const res = mockRes();
        await controller.descargarDatos({ usuario: cliente }, res);
        const datos = res.json.mock.calls[0][0];
        expect(datos.perfil).toMatchObject({ DocumentoID: 555, Nombre: 'Ana', Correo: 'ana@x.co', Telefono: '300', Direccion: 'Calle 1' });
        expect(datos.perfil.Contraseña).toBeUndefined();
        expect(datos.perfil.SesionesVersion).toBeUndefined();
        expect(datos.perfil.HistorialDesde).toBeUndefined();
        expect(datos.autorizacionPrivacidad).toEqual({ aceptadaEn: new Date('2026-11-27T10:00:00Z'), version: '1.0-2026-11-27' });
        expect(datos.pedidos).toHaveLength(2);
        expect(datos.pedidos[0].detalles).toEqual([{ ProductoID: 3, Cantidad: 2 }]);
        expect(datos.pedidos[0].comprobante).toEqual({ adjunto: true, fecha: new Date('2026-11-20') });
        expect(datos.pedidos[1].comprobante).toBeNull();
        expect(datos.pedidos[0].ComprobanteTransferencia).toBeUndefined();
        expect(datos.pedidos[0].TieneComprobante).toBeUndefined();
        expect(datos.pedidos[0].historial).toEqual([{ Fecha: new Date('2026-11-20'), Estado: 'Pendiente', Nota: 'Pedido recibido' }]);
        expect(datos.pedidos[1].historial).toEqual([]);
        expect(datos.cotizaciones[0]).toMatchObject({ CotizacionID: 7, detalles: [{ Cantidad: 10, tecnicas: [] }], historial: [{ Estado: 'Pendiente', Nota: null }] });
        expect(db.HistorialEstado.findAll.mock.calls[0][0].where[Op.or]).toEqual([{ Tipo: 'venta', RefID: [1, 2] }, { Tipo: 'cotizacion', RefID: [7] }]);
        expect(datos.notificaciones).toHaveLength(1);
        expect(datos.carrito).toEqual([{ ProductoID: 3, cantidad: 1 }]);
        expect(datos.generadoEn).toBeDefined();
        expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringMatching(/attachment; filename="mis-datos-stamplab-\d{4}-\d{2}-\d{2}\.json"/));
    });

    test('cuenta re-registrada sobre una suprimida: solo exporta lo posterior a HistorialDesde', async () => {
        const desde = new Date('2026-12-01T00:00:00Z');
        db.Usuario.findByPk.mockResolvedValue(fila({ DocumentoID: 555, Nombre: 'Nuevo', HistorialDesde: desde }));
        db.Venta.findAll.mockResolvedValue([]); db.Cotizacion.findAll.mockResolvedValue([]);
        await controller.descargarDatos({ usuario: cliente }, mockRes());
        expect(db.Venta.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555, FechaVenta: { [Op.gt]: desde } });
        expect(db.Cotizacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555, FechaCotizacion: { [Op.gt]: desde } });
        expect(db.Notificacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555, Fecha: { [Op.gt]: desde } });
        expect(db.HistorialEstado.findAll).not.toHaveBeenCalled(); // sin pedidos ni cotizaciones no hay línea de tiempo
    });

    test('usuario creado por el administrador: autorización sin registrar (null)', async () => {
        db.Usuario.findByPk.mockResolvedValue(fila({ DocumentoID: 555, Nombre: 'Ana', PrivacidadAceptadaEn: null, PrivacidadVersion: null }));
        db.Carrito.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await controller.descargarDatos({ usuario: cliente }, res);
        const datos = res.json.mock.calls[0][0];
        expect(datos.autorizacionPrivacidad).toEqual({ aceptadaEn: null, version: null });
        expect(datos.carrito).toBeNull();
    });

    test('404 si la cuenta no existe o fue suprimida', async () => {
        db.Usuario.findByPk.mockResolvedValue(fila({ DocumentoID: 555, SuprimidoEn: new Date() }));
        const res = mockRes();
        await controller.descargarDatos({ usuario: cliente }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        db.Usuario.findByPk.mockResolvedValue(null);
        const res2 = mockRes();
        await controller.descargarDatos({ usuario: cliente }, res2);
        expect(res2.status).toHaveBeenCalledWith(404);
    });

    test('500 sin detalles internos si falla la base', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        db.Usuario.findByPk.mockRejectedValue(new Error('ER_NO_SUCH_TABLE usuarios'));
        const res = mockRes();
        await controller.descargarDatos({ usuario: cliente }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/ER_NO_SUCH_TABLE/);
        console.error.mockRestore();
    });
});

// ============================================================
describe('POST /api/mi-cuenta/suprimir (derecho de supresión)', () => {
    let usuario, aplicar;
    // Conteos de motivoParaEsperar, en orden: Venta.count = en curso, reembolsos, pagos por verificar;
    // Cotizacion.count = pendientes, en trámite
    const conteos = ({ enCurso = 0, reembolsos = 0, porVerificar = 0, cotPendientes = 0, cotEnTramite = 0 } = {}) => {
        db.Venta.count.mockReset().mockResolvedValueOnce(enCurso).mockResolvedValueOnce(reembolsos).mockResolvedValueOnce(porVerificar);
        db.Cotizacion.count.mockReset().mockResolvedValueOnce(cotPendientes).mockResolvedValueOnce(cotEnTramite);
    };
    // Venta.findAll: todas sus ventas (para anonimizarlas)
    const ventasFindAll = (_sinUso, todas = [{ VentaID: 1 }, { VentaID: 12 }]) => {
        db.Venta.findAll.mockReset().mockResolvedValue(todas);
    };
    beforeEach(() => {
        usuario = {
            DocumentoID: 555, Nombre: 'Ana', Correo: 'ana@x.co', Telefono: '300', Direccion: 'Calle 1', RolID: 2, Contraseña: 'hash-real', SuprimidoEn: null,
            update: jest.fn().mockResolvedValue(),
        };
        aplicar = jest.fn();
        sesion.revocarTodas.mockResolvedValue(aplicar);
        db.Usuario.findByPk.mockResolvedValue(usuario);
        db.Usuario.findAll.mockResolvedValue([{ DocumentoID: 1000000001 }]);
        bcrypt.compare.mockResolvedValue(true);
        conteos();
        ventasFindAll();
        db.HistorialEstado.findAll.mockResolvedValue([]);
        db.Cotizacion.findAll.mockResolvedValue([{ CotizacionID: 7 }, { CotizacionID: 8 }]);
        db.DetalleCotizacion.findAll.mockResolvedValue([{ DetalleCotizacionID: 70 }, { DetalleCotizacionID: 80 }]);
        db.Venta.update.mockResolvedValue([2]);
    });
    const suprimir = async (body = { Contraseña: 'Clave1234' }) => {
        const res = mockRes();
        await controller.suprimirCuenta({ usuario: cliente, body }, res);
        return res;
    };
    const mensaje409 = (res) => { expect(res.status).toHaveBeenCalledWith(409); return res.json.mock.calls[0][0].mensaje; };

    test('400 si no envía la contraseña', async () => {
        const res = await suprimir({});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('403 (no 401: no cierra la sesión del navegador) si la contraseña no es correcta', async () => {
        bcrypt.compare.mockResolvedValue(false);
        const res = await suprimir();
        expect(bcrypt.compare).toHaveBeenCalledWith('Clave1234', 'hash-real');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('el administrador no puede suprimir su cuenta desde la tienda', async () => {
        usuario.RolID = 1;
        const res = await suprimir();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('404 si la cuenta ya fue suprimida', async () => {
        usuario.SuprimidoEn = new Date();
        const res = await suprimir();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('los conteos se hacen dentro de la transacción, con la fila del usuario ya bloqueada', async () => {
        await suprimir();
        expect(db.Usuario.findByPk).toHaveBeenCalledWith(555, expect.objectContaining({ lock: 'UPDATE', transaction: expect.objectContaining({ id: 'tx' }) }));
        const ordenBloqueo = db.Usuario.findByPk.mock.invocationCallOrder[0];
        for (const llamada of [...db.Venta.count.mock.calls, ...db.Cotizacion.count.mock.calls]) expect(llamada[0].transaction).toEqual(expect.objectContaining({ id: 'tx' }));
        expect(db.Venta.count.mock.invocationCallOrder[0]).toBeGreaterThan(ordenBloqueo);
    });

    test('409 si tiene pedidos en curso (no finales), con explicación', async () => {
        conteos({ enCurso: 2 });
        const msg = mensaje409(await suprimir());
        expect(msg).toMatch(/2 pedido\(s\) en curso/);
        expect(msg).toMatch(/Mis compras/);
        const where = db.Venta.count.mock.calls[0][0].where;
        expect(where.DocumentoID).toBe(555);
        expect(where.EstadoID[Op.notIn]).toEqual([ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA]);
        expect(usuario.update).not.toHaveBeenCalled();
        expect(db.Venta.update).not.toHaveBeenCalled();
    });

    test('409 si tiene un reembolso pendiente (pedido cancelado ya pagado)', async () => {
        conteos({ reembolsos: 1 });
        expect(mensaje409(await suprimir())).toMatch(/reembolso/);
        expect(db.Venta.count.mock.calls[1][0].where).toEqual({ DocumentoID: 555, ReembolsoPendiente: true });
    });

    test('409 con cotizaciones pendientes: puede cancelarlas', async () => {
        conteos({ cotPendientes: 1 });
        const msg = mensaje409(await suprimir());
        expect(msg).toMatch(/1 cotización\(es\) pendiente\(s\): puedes cancelarlas/);
        expect(db.Cotizacion.count.mock.calls[0][0].where).toEqual({ DocumentoID: 555, EstadoID: ESTADO_COTIZACION.PENDIENTE });
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('409 con cotizaciones en revisión o aprobadas: que espere o contacte al equipo (no puede cancelarlas)', async () => {
        conteos({ cotEnTramite: 2 });
        const msg = mensaje409(await suprimir());
        expect(msg).toMatch(/2 cotización\(es\) en revisión o aprobada\(s\)/);
        expect(msg).toMatch(/espera|escríbenos/);
        expect(msg).not.toMatch(/puedes cancelarlas/);
        expect(db.Cotizacion.count.mock.calls[1][0].where.EstadoID[Op.in].sort()).toEqual([ESTADO_COTIZACION.APROBADA, ESTADO_COTIZACION.EN_REVISION].sort());
    });

    test('409 si hay un pago por verificar (cancelado por transferencia con comprobante sin revisar)', async () => {
        conteos({ porVerificar: 1 });
        const msg = mensaje409(await suprimir());
        expect(msg).toMatch(/pago por verificar.*el equipo te contactará/);
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('la condición usa datos explícitos de la venta (no texto del historial): resuelta por reembolso o por "no hubo pago"', async () => {
        await suprimir();
        const where = db.Venta.count.mock.calls[2][0].where;
        expect(where).toMatchObject({
            DocumentoID: 555, EstadoID: ESTADO_VENTA.CANCELADA, MetodoPago: 'transferencia', ReembolsoPendiente: false,
            ReembolsoRealizadoEn: null, ComprobanteMotivoRechazo: null,
        });
        expect(where.ComprobanteTransferencia[Op.and]).toEqual([{ [Op.ne]: null }, { [Op.ne]: '' }]);
        expect(db.HistorialEstado.findAll).not.toHaveBeenCalled();
    });

    test('anonimiza contacto, comprobante y motivo de rechazo de sus pedidos (conserva las cifras)', async () => {
        const res = await suprimir();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].estado).toBe(true);
        const [campos, opciones] = db.Venta.update.mock.calls[0];
        expect(campos).toEqual({
            ContactoNombre: 'Titular suprimido', ContactoTelefono: null, ContactoDireccion: null,
            NombreReceptor: null, TelefonoEntrega: null, DireccionEntrega: null, ComprobanteTransferencia: null, ComprobanteMotivoRechazo: null,
        });
        expect(campos.Total).toBeUndefined();
        expect(opciones.where).toEqual({ DocumentoID: 555 });
        expect(opciones.transaction).toEqual(expect.objectContaining({ id: 'tx' }));
    });

    test('borra las notas de la línea de tiempo de sus pedidos y cotizaciones', async () => {
        await suprimir();
        const [campos, opciones] = db.HistorialEstado.update.mock.calls[0];
        expect(campos).toEqual({ Nota: null });
        expect(opciones.where[Op.or]).toEqual([{ Tipo: 'venta', RefID: [1, 12] }, { Tipo: 'cotizacion', RefID: [7, 8] }]);
    });

    test('borra los textos libres y las imágenes de diseño de sus cotizaciones', async () => {
        await suprimir();
        expect(db.Cotizacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: 555 });
        expect(db.DetalleCotizacion.update).toHaveBeenCalledWith({ PrendaDescripcion: null }, expect.objectContaining({ where: { CotizacionID: [7, 8] } }));
        expect(db.CotizacionTecnica.update).toHaveBeenCalledWith({ ImagenDiseño: null, Observaciones: null }, expect.objectContaining({ where: { DetalleCotizacionID: [70, 80] } }));
    });

    test('sin pedidos ni cotizaciones no toca ventas, detalles, historial ni avisos del equipo', async () => {
        ventasFindAll([], []);
        db.Cotizacion.findAll.mockResolvedValue([]);
        await suprimir();
        expect(db.Venta.update).not.toHaveBeenCalled();
        expect(db.DetalleCotizacion.update).not.toHaveBeenCalled();
        expect(db.CotizacionTecnica.update).not.toHaveBeenCalled();
        expect(db.HistorialEstado.update).not.toHaveBeenCalled();
        expect(db.Notificacion.update).not.toHaveBeenCalled();
        expect(usuario.update).toHaveBeenCalled();
    });

    test('borra su carrito y sus notificaciones', async () => {
        await suprimir();
        expect(db.Carrito.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { DocumentoID: 555 } }));
        expect(db.Notificacion.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { DocumentoID: 555 } }));
    });

    test('reescribe solo los avisos del equipo sobre SUS pedidos/cotizaciones, por número y no por nombre', async () => {
        await suprimir();
        const llamadas = db.Notificacion.update.mock.calls;
        expect(llamadas.map(([c]) => c.Mensaje)).toEqual([
            'Pedido #1 (titular suprimido)', 'Pedido #12 (titular suprimido)', 'Cotización #7 (titular suprimido)', 'Cotización #8 (titular suprimido)',
        ]);
        for (const [, { where }] of llamadas) {
            expect(where.DocumentoID).toEqual([1000000001]); // solo destinatarios administradores
            expect(JSON.stringify(where)).not.toMatch(/Ana/); // nunca por nombre
        }
        expect(db.Usuario.findAll.mock.calls[0][0].where).toEqual({ RolID: 1 });
    });

    test('los patrones reconocen el número exacto: "Ana" vs "Mariana" y #1 vs #12', () => {
        const pedido1 = new RegExp(controller.patronPedido(1));
        const cot7 = new RegExp(controller.patronCotizacion(7));
        expect(pedido1.test('Ana canceló su pedido #1.')).toBe(true);
        expect(pedido1.test('Hay un comprobante por revisar en el pedido #1 de Ana.')).toBe(true);
        expect(pedido1.test('Mariana canceló su pedido #12.')).toBe(false); // otro cliente, otro pedido
        expect(pedido1.test('Mariana canceló su pedido #10')).toBe(false);
        expect(pedido1.test('Pedido #1')).toBe(true);
        expect(cot7.test('Ana envió la cotización #7. Falta ponerle precio.')).toBe(true);
        expect(cot7.test('Mariana envió la cotización #71.')).toBe(false);
        expect(controller.patronPedido('1; DROP')).toMatch(/#NaN/); // solo números
    });

    test('conserva la fila del usuario anonimizada y marcada como suprimida, con contraseña aleatoria', async () => {
        const antes = Date.now();
        await suprimir();
        const [campos, opciones] = usuario.update.mock.calls[0];
        expect(campos).toMatchObject({ Nombre: 'Titular suprimido', Correo: 'suprimido-555@invalid', Telefono: null, Direccion: null, Contraseña: 'hash-aleatorio' });
        expect(campos.SuprimidoEn).toBeInstanceOf(Date);
        expect(campos.SuprimidoEn.getTime()).toBeGreaterThanOrEqual(antes);
        expect(bcrypt.hash.mock.calls[0][0]).not.toBe('Clave1234');
        expect(bcrypt.hash.mock.calls[0][0].length).toBeGreaterThanOrEqual(32);
        expect(opciones.transaction).toEqual(expect.objectContaining({ id: 'tx' }));
    });

    test('invalida sus sesiones en la transacción y aplica en memoria solo tras el commit', async () => {
        let enTransaccion = false;
        db.sequelize.transaction.mockImplementation(async (cb) => { enTransaccion = true; const r = await cb({ id: 'tx', LOCK: { UPDATE: 'UPDATE' } }); enTransaccion = false; return r; });
        let aplicadoDentro = null;
        aplicar.mockImplementation(() => { aplicadoDentro = enTransaccion; });
        await suprimir();
        expect(sesion.revocarTodas).toHaveBeenCalledWith(555, expect.objectContaining({ id: 'tx' }));
        expect(aplicar).toHaveBeenCalledTimes(1);
        expect(aplicadoDentro).toBe(false);
    });

    test('si algo falla se deshace todo, no aplica el corte de sesiones y responde 500 sin detalles', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        db.Carrito.destroy.mockRejectedValueOnce(new Error('ER_LOCK_DEADLOCK carritos'));
        const res = await suprimir();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(JSON.stringify(res.json.mock.calls[0][0])).not.toMatch(/ER_LOCK/);
        expect(usuario.update).not.toHaveBeenCalled();
        expect(aplicar).not.toHaveBeenCalled();
        console.error.mockRestore();
    });
});

// ============================================================
describe('límite de intentos de supresión (contraseña incorrecta)', () => {
    const express = require('express');
    const { crearLimiteSupresion } = require('../routes/miCuenta');
    let servidor, url;
    beforeAll(async () => {
        const antes = process.env.SUPRIMIR_MAX_FALLOS;
        process.env.SUPRIMIR_MAX_FALLOS = '2';
        const limite = crearLimiteSupresion();
        if (antes === undefined) delete process.env.SUPRIMIR_MAX_FALLOS; else process.env.SUPRIMIR_MAX_FALLOS = antes;
        const app = express();
        app.use((req, res, next) => { req.usuario = { id: req.headers['x-usuario'], rol: 2 }; next(); });
        app.post('/suprimir', limite, (req, res) => res.status(Number(req.headers['x-estado'])).json({}));
        await new Promise((r) => { servidor = app.listen(0, '127.0.0.1', r); });
        url = `http://127.0.0.1:${servidor.address().port}/suprimir`;
    });
    afterAll(() => new Promise((r) => servidor.close(r)));
    const intentar = (usuario, estado) => fetch(url, { method: 'POST', headers: { 'x-usuario': usuario, 'x-estado': String(estado) } }).then((r) => r.status);

    test('tras SUPRIMIR_MAX_FALLOS contraseñas incorrectas responde 429, contado por usuario', async () => {
        expect(await intentar('ana', 403)).toBe(403);
        expect(await intentar('ana', 403)).toBe(403);
        expect(await intentar('ana', 403)).toBe(429);
        expect(await intentar('luis', 403)).toBe(403); // misma IP, otro usuario
    });

    test('los 409 (pedidos en curso) no cuentan como intento fallido', async () => {
        for (let i = 0; i < 4; i++) expect(await intentar('carla', 409)).toBe(409);
    });
});
