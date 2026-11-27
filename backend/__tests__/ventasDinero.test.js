// Ventas: totales calculados en el servidor, carrito vaciado al comprar, borrado con reembolso pendiente y comprobante sin carreras
const mockTx = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
    Venta: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
    Usuario: { findByPk: jest.fn().mockResolvedValue({ DocumentoID: 123, RolID: 2 }) },
    DetalleVenta: { findAll: jest.fn().mockResolvedValue([]), create: jest.fn(), destroy: jest.fn() },
    Carrito: { destroy: jest.fn() },
    DetalleCompra: {}, Compra: {}, Producto: {}, Tecnica: {}, Insumo: {}, InventarioProducto: {}, Color: {}, Talla: {},
    Estado: { findByPk: jest.fn() },
    sequelize: { literal: jest.fn(), transaction: jest.fn(() => Promise.resolve(mockTx)) },
}));
jest.mock('../services/inventario', () => ({ reservar: jest.fn(), devolver: jest.fn() }));
jest.mock('../services/historial', () => ({ registrar: jest.fn() }));
jest.mock('../services/notificaciones', () => new Proxy({}, { get: (o, k) => (o[k] = o[k] || jest.fn()) }));

const { Venta, DetalleVenta, Carrito, sequelize } = require('../models');
const controller = require('../controllers/ventaController');
const { esquemas } = require('../middleware/validar');
const { ESTADO_VENTA } = require('../config/estados');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const comprobante = `data:image/png;base64,${PNG.toString('base64')}`;
const CLIENTE = { id: '123', rol: 2 };
const ADMIN = { id: '1', rol: 1 };

beforeEach(() => {
    jest.clearAllMocks();
    DetalleVenta.findAll.mockResolvedValue([]);
});

describe('updateVenta: el total lo calcula el servidor', () => {
    test('Subtotal = Σ cantidad·precio y Total = Subtotal + costo de envío; ignora lo que mande el cliente', async () => {
        const venta = { VentaID: 1, EstadoID: ESTADO_VENTA.PENDIENTE, CostoEnvio: '5000.00', Subtotal: 0, Total: 0, update: jest.fn() };
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.updateVenta({ params: { id: '1' }, body: {
            Subtotal: 1, Total: 1,
            detalles: [{ ProductoID: 1, Cantidad: 2, PrecioUnitario: 10000 }, { ProductoID: 2, Cantidad: 1, PrecioUnitario: '3000' }],
        } }, res);
        expect(venta.update).toHaveBeenCalledWith(expect.objectContaining({ Subtotal: 23000, Total: 28000 }), { transaction: mockTx });
        expect(mockTx.commit).toHaveBeenCalled();
    });
});

describe('crearVenta: el carrito del servidor se vacía al comprar', () => {
    const detalles = () => [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 2, PrecioUnitario: 10000 }];
    beforeEach(() => { Venta.create.mockResolvedValue({ VentaID: 5, EstadoID: ESTADO_VENTA.PENDIENTE }); });

    test('compra del cliente: borra su carrito dentro de la misma transacción', async () => {
        const res = mockRes();
        await controller.crearVenta({ usuario: CLIENTE, body: { DocumentoID: '123', Subtotal: 20000, Total: 20000, detalles: detalles() } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(Carrito.destroy).toHaveBeenCalledWith({ where: { DocumentoID: '123' }, transaction: mockTx });
    });

    test('venta creada por el administrador: no toca el carrito del cliente', async () => {
        const res = mockRes();
        await controller.crearVenta({ usuario: ADMIN, body: { DocumentoID: '123', Subtotal: 20000, Total: 20000, detalles: detalles() } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(Carrito.destroy).not.toHaveBeenCalled();
    });
});

describe('deleteVenta: un cancelado con reembolso pendiente no se borra', () => {
    test('400 con message y mensaje; no borra nada', async () => {
        const destroy = jest.fn();
        Venta.findByPk.mockResolvedValue({ VentaID: 1, EstadoID: ESTADO_VENTA.CANCELADA, ReembolsoPendiente: true, destroy });
        const res = mockRes();
        await controller.deleteVenta({ params: { id: '1' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/reembolso/i), mensaje: expect.stringMatching(/reembolso/i) }));
        expect(destroy).not.toHaveBeenCalled();
        expect(DetalleVenta.destroy).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });
});

describe('rechazarComprobante: con bloqueo y sin pisar un comprobante nuevo', () => {
    const FECHA = '2026-11-20T15:00:00.000Z';
    const pendiente = (extra = {}) => ({
        VentaID: 7, EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', TieneComprobante: 1, // la fila bloqueada se lee sin el comprobante (base64)
        FechaTransferencia: new Date(FECHA), update: jest.fn(), ...extra,
    });

    test('bloquea la fila, guarda motivo y fecha del rechazo, y hace commit', async () => {
        const venta = pendiente();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide' } }, res);
        expect(sequelize.transaction).toHaveBeenCalled();
        expect(Venta.findByPk).toHaveBeenCalledWith('7', expect.objectContaining({ transaction: mockTx, lock: 'UPDATE' }));
        expect(venta.update).toHaveBeenCalledWith(expect.objectContaining({ ComprobanteMotivoRechazo: 'El valor no coincide', ComprobanteFechaRechazo: expect.any(Date) }), { transaction: mockTx });
        expect(mockTx.commit).toHaveBeenCalled();
    });

    test('si el pedido ya no está pendiente (comprobado con la fila bloqueada): 400 y rollback', async () => {
        const venta = pendiente({ EstadoID: ESTADO_VENTA.PAGADA });
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(venta.update).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test('el panel revisó otro comprobante (FechaTransferencia distinta): 409 y no rechaza', async () => {
        const venta = pendiente();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide', FechaTransferencia: '2026-11-19T10:00:00.000Z' } }, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/subió otro comprobante/) }));
        expect(venta.update).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test('misma FechaTransferencia que la revisada: rechaza normalmente', async () => {
        const venta = pendiente();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide', FechaTransferencia: FECHA } }, res);
        expect(res.status).not.toHaveBeenCalled();
        expect(venta.update).toHaveBeenCalled();
    });
});

describe('subirComprobante: con bloqueo', () => {
    test('bloquea la fila; si ya no está pendiente: 400, rollback y no guarda', async () => {
        const venta = { VentaID: 7, EstadoID: ESTADO_VENTA.CANCELADA, MetodoPago: 'transferencia', update: jest.fn() };
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.subirComprobante({ params: { id: '7' }, usuario: CLIENTE, body: { comprobanteTransferencia: comprobante } }, res);
        expect(Venta.findByPk).toHaveBeenCalledWith('7', expect.objectContaining({ transaction: mockTx, lock: 'UPDATE' }));
        expect(res.status).toHaveBeenCalledWith(400);
        expect(venta.update).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test('pendiente: guarda el comprobante, limpia el rechazo y hace commit', async () => {
        const venta = { VentaID: 7, EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', ComprobanteMotivoRechazo: 'x', update: jest.fn() };
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.subirComprobante({ params: { id: '7' }, usuario: CLIENTE, body: { comprobanteTransferencia: comprobante } }, res);
        expect(venta.update).toHaveBeenCalledWith(expect.objectContaining({ ComprobanteMotivoRechazo: null, ComprobanteFechaRechazo: null }), { transaction: mockTx });
        expect(mockTx.commit).toHaveBeenCalled();
    });
});

describe('POST /api/ventas (validación): EstadoID solo Pendiente o Pagada', () => {
    const base = { DocumentoID: '1234567', detalles: [{ ProductoID: 1, Cantidad: 1, PrecioUnitario: 1000 }] };
    const validar = (cuerpo) => esquemas.venta.validate(cuerpo, { abortEarly: false, allowUnknown: true }).error;

    test.each([ESTADO_VENTA.PENDIENTE, ESTADO_VENTA.PAGADA, undefined])('acepta %p', (EstadoID) => {
        expect(validar({ ...base, EstadoID })).toBeUndefined();
    });

    test.each([ESTADO_VENTA.EN_PRODUCCION, ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA, ESTADO_VENTA.LISTA_ENTREGA, 1, 999])('rechaza %p', (EstadoID) => {
        expect(validar({ ...base, EstadoID })).toBeDefined();
    });
});

describe('pago por verificar: el administrador lo resuelve (pedido cancelado con comprobante sin revisar)', () => {
    const historial = require('../services/historial');
    const notificaciones = require('../services/notificaciones');
    const { esPagoPorVerificar } = require('../utils/pagoPorVerificar');
    // Fila bloqueada, leída sin el comprobante (TieneComprobante en su lugar)
    const porVerificar = (extra = {}) => ({
        VentaID: 7, EstadoID: ESTADO_VENTA.CANCELADA, MetodoPago: 'transferencia', TieneComprobante: 1, ReembolsoPendiente: false,
        ReembolsoRealizadoEn: null, ComprobanteMotivoRechazo: null, FechaTransferencia: new Date('2026-11-20T15:00:00Z'), update: jest.fn(), ...extra,
    });

    test('la regla: cancelado, transferencia, con comprobante, sin motivo, sin reembolso pendiente ni realizado', () => {
        expect(esPagoPorVerificar(porVerificar(), true)).toBe(true);
        expect(esPagoPorVerificar(porVerificar(), false)).toBe(false);
        expect(esPagoPorVerificar(porVerificar({ ReembolsoRealizadoEn: new Date() }), true)).toBe(false);
        expect(esPagoPorVerificar(porVerificar({ ComprobanteMotivoRechazo: 'No llegó' }), true)).toBe(false);
        expect(esPagoPorVerificar(porVerificar({ ReembolsoPendiente: true }), true)).toBe(false);
        expect(esPagoPorVerificar(porVerificar({ EstadoID: ESTADO_VENTA.PENDIENTE }), true)).toBe(false);
        expect(esPagoPorVerificar(porVerificar({ MetodoPago: 'contraentrega' }), true)).toBe(false);
    });

    test('(a) "reembolso realizado": con bloqueo, guarda ReembolsoRealizadoEn y deja nota; sale de la condición', async () => {
        const venta = porVerificar();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.marcarReembolsado({ params: { id: '7' }, usuario: ADMIN }, res);
        expect(Venta.findByPk).toHaveBeenCalledWith('7', expect.objectContaining({ transaction: mockTx, lock: 'UPDATE' }));
        const [campos] = venta.update.mock.calls[0];
        expect(campos).toEqual({ ReembolsoPendiente: false, ReembolsoRealizadoEn: expect.any(Date) });
        expect(historial.registrar.mock.calls[0][0].nota).toMatch(/Reembolso realizado/);
        expect(mockTx.commit).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(esPagoPorVerificar({ ...venta, ...campos }, true)).toBe(false);
    });

    test('el reembolso pendiente de siempre también guarda ReembolsoRealizadoEn', async () => {
        const venta = porVerificar({ ReembolsoPendiente: true, TieneComprobante: 0 });
        Venta.findByPk.mockResolvedValue(venta);
        await controller.marcarReembolsado({ params: { id: '7' }, usuario: ADMIN }, mockRes());
        expect(venta.update.mock.calls[0][0]).toEqual({ ReembolsoPendiente: false, ReembolsoRealizadoEn: expect.any(Date) });
        expect(historial.registrar.mock.calls[0][0].nota).toBe('Reembolso realizado');
    });

    test('marcar reembolso sin reembolso pendiente ni pago por verificar: 400 y rollback', async () => {
        const venta = porVerificar({ ReembolsoRealizadoEn: new Date() }); // ya resuelto
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.marcarReembolsado({ params: { id: '7' }, usuario: ADMIN }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(venta.update).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test('(b) "no hubo pago": rechazar-comprobante guarda el motivo con bloqueo, sin avisar al cliente ni reiniciar plazos', async () => {
        const venta = porVerificar();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'No llegó ningún pago a la cuenta' } }, res);
        expect(Venta.findByPk).toHaveBeenCalledWith('7', expect.objectContaining({ transaction: mockTx, lock: 'UPDATE' }));
        const [campos] = venta.update.mock.calls[0];
        expect(campos).toEqual({ ComprobanteMotivoRechazo: 'No llegó ningún pago a la cuenta', ComprobanteFechaRechazo: expect.any(Date) });
        expect(historial.registrar.mock.calls[0][0].nota).toMatch(/Pago por verificar cerrado.*No llegó ningún pago/);
        expect(notificaciones.comprobanteRechazado).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].pagoPorVerificarCerrado).toBe(true);
        expect(mockTx.commit).toHaveBeenCalled();
        expect(esPagoPorVerificar({ ...venta, ...campos }, true)).toBe(false);
    });

    test('(b) exige motivo (5 a 300 caracteres)', async () => {
        Venta.findByPk.mockResolvedValue(porVerificar());
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'no' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('un cancelado ya resuelto (con motivo) no se puede "rechazar" otra vez: 400', async () => {
        const venta = porVerificar({ ComprobanteMotivoRechazo: 'No llegó' });
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'Otra vez el motivo' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(venta.update).not.toHaveBeenCalled();
    });
});

describe('deleteVenta: un cancelado con pago por verificar no se borra', () => {
    const cancelada = (extra = {}) => ({
        VentaID: 7, EstadoID: ESTADO_VENTA.CANCELADA, MetodoPago: 'transferencia', TieneComprobante: 1, ReembolsoPendiente: false,
        ReembolsoRealizadoEn: null, ComprobanteMotivoRechazo: null, destroy: jest.fn(), ...extra,
    });

    test('400 con message y mensaje, rollback, sin leer el comprobante en base64', async () => {
        const venta = cancelada();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.deleteVenta({ params: { id: '7' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        const cuerpo = res.json.mock.calls[0][0];
        expect(cuerpo.message).toMatch(/pago por verificar/);
        expect(cuerpo.mensaje).toBe(cuerpo.message);
        expect(Venta.findByPk.mock.calls[0][1]).toEqual(expect.objectContaining({ lock: 'UPDATE', transaction: mockTx }));
        expect(Venta.findByPk.mock.calls[0][1].attributes.exclude).toContain('ComprobanteTransferencia');
        expect(DetalleVenta.destroy).not.toHaveBeenCalled();
        expect(venta.destroy).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test.each([
        ['resuelto con reembolso', { ReembolsoRealizadoEn: new Date() }],
        ['resuelto como "no hubo pago"', { ComprobanteMotivoRechazo: 'No llegó ningún pago' }],
        ['sin comprobante', { TieneComprobante: 0 }],
    ])('cancelado %s: sí se puede eliminar', async (_, extra) => {
        const venta = cancelada(extra);
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.deleteVenta({ params: { id: '7' } }, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(DetalleVenta.destroy).toHaveBeenCalled();
    });
});
