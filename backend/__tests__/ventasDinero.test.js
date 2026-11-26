// Ventas: totales calculados en el servidor, carrito vaciado al comprar, borrado con reembolso pendiente y comprobante sin carreras
const mockTx = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
    Venta: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
    Usuario: { findByPk: jest.fn().mockResolvedValue({ DocumentoID: 123, RolID: 2 }) },
    DetalleVenta: { findAll: jest.fn().mockResolvedValue([]), create: jest.fn(), destroy: jest.fn() },
    Carrito: { destroy: jest.fn() },
    DetalleCompra: {}, Compra: {}, Producto: {}, Tecnica: {}, Insumo: {}, InventarioProducto: {}, Color: {}, Talla: {},
    Estado: { findByPk: jest.fn() },
    sequelize: { transaction: jest.fn(() => Promise.resolve(mockTx)) },
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
        VentaID: 7, EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', ComprobanteTransferencia: comprobante,
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
