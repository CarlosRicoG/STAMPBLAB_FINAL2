// Rendimiento en ventas: el comprobante en base64 (hasta ~7 MB) solo viaja en GET /api/ventas/:id;
// las lecturas bajo bloqueo y las respuestas de escritura lo omiten y dicen si existe (TieneComprobante).
// Los precios del cliente se validan con una consulta por tabla, no dos por línea.
const mockTx = { commit: jest.fn(), rollback: jest.fn(() => Promise.resolve()), LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
    Venta: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
    Usuario: { findByPk: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
    DetalleVenta: { findAll: jest.fn().mockResolvedValue([]), create: jest.fn(), destroy: jest.fn() },
    Carrito: { destroy: jest.fn() },
    DetalleCompra: {}, Compra: {}, Tecnica: {}, Insumo: {}, InventarioProducto: {},
    Producto: { findAll: jest.fn(), findByPk: jest.fn() },
    Color: { findAll: jest.fn() },
    Talla: { findAll: jest.fn(), findByPk: jest.fn() },
    Estado: { findByPk: jest.fn() },
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]) },
    sequelize: { literal: jest.fn((sql) => ({ sql })), transaction: jest.fn(() => Promise.resolve(mockTx)) },
}));
jest.mock('../services/inventario', () => ({ reservar: jest.fn(), devolver: jest.fn() }));
jest.mock('../services/historial', () => ({ registrar: jest.fn() }));
jest.mock('../services/notificaciones', () => new Proxy({}, { get: (o, k) => (o[k] = o[k] || jest.fn()) }));

const { Venta, Usuario, Producto, Talla, Estado } = require('../models');
const controller = require('../controllers/ventaController');
const facturaController = require('../controllers/facturaController');
const { preciosDelCliente } = require('../routes/ventas');
const { ESTADO_VENTA } = require('../config/estados');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const ADMIN = { id: '1', rol: 1 };
const CLIENTE = { id: '123', rol: 2 };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const comprobante = `data:image/png;base64,${PNG.toString('base64')}`;

// Lo que la base devuelve cuando se lee sin el comprobante: TieneComprobante (0/1 en MySQL) en su lugar
const ventaSinBlob = (extra = {}) => ({ VentaID: 7, EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', TieneComprobante: 1, ComprobanteMotivoRechazo: null, ReembolsoPendiente: false, CostoEnvio: 0, update: jest.fn(), destroy: jest.fn(), ...extra });
const leeSinComprobante = (opciones) => {
    expect(opciones.attributes.exclude).toContain('ComprobanteTransferencia');
    expect(opciones.attributes.include.map(([, alias]) => alias)).toContain('TieneComprobante');
};
const ultimaLectura = () => Venta.findByPk.mock.calls[Venta.findByPk.mock.calls.length - 1][1];

beforeEach(() => { jest.clearAllMocks(); });

describe('Escrituras de ventas: leen la fila bloqueada sin el comprobante', () => {
    test('updateEstadoVenta: sin el comprobante, pero detecta el comprobante sin revisar al cancelar', async () => {
        Estado.findByPk.mockResolvedValue({ EstadoID: ESTADO_VENTA.CANCELADA, Tipo: 'venta' });
        Venta.findByPk.mockResolvedValue(ventaSinBlob());
        const res = mockRes();
        await controller.updateEstadoVenta({ params: { id: '7' }, usuario: ADMIN, body: { EstadoID: ESTADO_VENTA.CANCELADA } }, res);
        const opciones = ultimaLectura();
        leeSinComprobante(opciones);
        expect(opciones).toEqual(expect.objectContaining({ transaction: mockTx, lock: 'UPDATE' }));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagoPorVerificar: true }));
        expect(res.json.mock.calls[0][0].venta).not.toHaveProperty('ComprobanteTransferencia');
    });

    test('updateEstadoVenta: sin comprobante (TieneComprobante 0) no pide verificar el pago', async () => {
        Estado.findByPk.mockResolvedValue({ EstadoID: ESTADO_VENTA.CANCELADA, Tipo: 'venta' });
        Venta.findByPk.mockResolvedValue(ventaSinBlob({ TieneComprobante: 0 }));
        const res = mockRes();
        await controller.updateEstadoVenta({ params: { id: '7' }, usuario: ADMIN, body: { EstadoID: ESTADO_VENTA.CANCELADA } }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagoPorVerificar: false }));
    });

    test('rechazarComprobante: lee sin el comprobante y rechaza si existe', async () => {
        const venta = ventaSinBlob();
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide' } }, res);
        leeSinComprobante(ultimaLectura());
        expect(venta.update).toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].venta).not.toHaveProperty('ComprobanteTransferencia');
    });

    test('rechazarComprobante: sin comprobante (TieneComprobante 0) responde 400', async () => {
        const venta = ventaSinBlob({ TieneComprobante: 0 });
        Venta.findByPk.mockResolvedValue(venta);
        const res = mockRes();
        await controller.rechazarComprobante({ params: { id: '7' }, usuario: ADMIN, body: { motivo: 'El valor no coincide' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(venta.update).not.toHaveBeenCalled();
    });

    test('marcarReembolsado, updateVenta, subirComprobante y deleteVenta tampoco leen el comprobante', async () => {
        Venta.findByPk.mockResolvedValue(ventaSinBlob({ EstadoID: ESTADO_VENTA.CANCELADA, ReembolsoPendiente: true }));
        await controller.marcarReembolsado({ params: { id: '7' }, usuario: ADMIN }, mockRes());
        leeSinComprobante(ultimaLectura());

        Venta.findByPk.mockResolvedValue(ventaSinBlob());
        await controller.updateVenta({ params: { id: '7' }, body: { detalles: [{ ProductoID: 1, Cantidad: 1, PrecioUnitario: 10 }] } }, mockRes());
        leeSinComprobante(ultimaLectura());

        Venta.findByPk.mockResolvedValue(ventaSinBlob());
        const res = mockRes();
        await controller.subirComprobante({ params: { id: '7' }, usuario: CLIENTE, body: { comprobanteTransferencia: comprobante } }, res);
        leeSinComprobante(ultimaLectura());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ venta: { VentaID: 7 } }));

        Venta.findByPk.mockResolvedValue(ventaSinBlob());
        await controller.deleteVenta({ params: { id: '7' } }, mockRes());
        leeSinComprobante(ultimaLectura());
    });

    test('crearVenta: la respuesta no devuelve el comprobante recién subido, solo TieneComprobante', async () => {
        Usuario.findByPk.mockResolvedValue({ DocumentoID: 123, RolID: 2 });
        Venta.create.mockImplementation(async (datos) => ({ VentaID: 9, ...datos, toJSON() { const { toJSON, ...resto } = this; return resto; } }));
        const res = mockRes();
        await controller.crearVenta({ usuario: CLIENTE, body: {
            DocumentoID: '123', Subtotal: 10, Total: 10, metodoPago: 'transferencia', comprobanteTransferencia: comprobante,
            detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 10 }],
        } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        const { venta } = res.json.mock.calls[0][0];
        expect(venta.VentaID).toBe(9);
        expect(venta.MetodoPago).toBe('transferencia');
        expect(venta).not.toHaveProperty('ComprobanteTransferencia');
        expect(venta.TieneComprobante).toBe(true);
        // Sí se guarda
        expect(Venta.create.mock.calls[0][0].ComprobanteTransferencia).toBe(comprobante);
    });

    test('listado del cliente re-registrado sobre una cuenta suprimida (req.historialDesde): solo sus pedidos nuevos', async () => {
        const { Op } = require('sequelize');
        const desde = new Date('2026-12-01T00:00:00Z');
        Venta.count.mockResolvedValue(0);
        Venta.findAll.mockResolvedValue([]);
        await controller.getAllVentas({ query: {}, documentoForzado: '555', historialDesde: desde }, mockRes());
        expect(Venta.findAll.mock.calls[0][0].where).toMatchObject({ DocumentoID: '555', FechaVenta: { [Op.gt]: desde } });
        expect(Venta.count.mock.calls[0][0].where).toMatchObject({ DocumentoID: '555', FechaVenta: { [Op.gt]: desde } });
    });

    test('listado: sin el comprobante y con la misma regla de TieneComprobante (NULL y vacío cuentan como "sin comprobante")', async () => {
        Venta.count.mockResolvedValue(1);
        Venta.findAll.mockResolvedValue([{ VentaID: 7, TieneComprobante: 0 }]);
        const res = mockRes();
        await controller.getAllVentas({ query: {} }, res);
        const { attributes } = Venta.findAll.mock.calls[0][0];
        expect(attributes.exclude).toContain('ComprobanteTransferencia');
        const [[literal, alias]] = attributes.include;
        expect(alias).toBe('TieneComprobante');
        expect(literal.sql).toMatch(/IS NOT NULL AND `Venta`\.`ComprobanteTransferencia` <> ''/);
        // Es la misma expresión que usan las lecturas bajo bloqueo
        await controller.marcarReembolsado({ params: { id: '7' }, usuario: ADMIN }, mockRes()).catch(() => {});
        expect(ultimaLectura().attributes.include[0][0].sql).toBe(literal.sql);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 1, datos: [{ VentaID: 7, TieneComprobante: 0 }] }));
    });

    test('GET /api/ventas/:id sigue devolviendo el comprobante (es donde el panel y el cliente lo ven)', async () => {
        Venta.findByPk.mockResolvedValue({ VentaID: 7, ComprobanteTransferencia: comprobante });
        const res = mockRes();
        await controller.getVentaById({ params: { id: '7' } }, res);
        expect(ultimaLectura().attributes).toBeUndefined();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ComprobanteTransferencia: comprobante }));
    });

    test('el PDF de la venta no lee el comprobante', async () => {
        Venta.findByPk.mockResolvedValue(null);
        const res = mockRes();
        await facturaController.descargarComprobante({ params: { id: '7' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(ultimaLectura().attributes.exclude).toContain('ComprobanteTransferencia');
    });
});

describe('preciosDelCliente: una consulta por tabla, no dos por línea', () => {
    const lineas = (n) => Array.from({ length: n }, (_, i) => ({ ProductoID: (i % 3) + 1, ColorID: 1, TallaID: (i % 2) + 1, Cantidad: 2, PrecioUnitario: 15000 }));
    beforeEach(() => {
        Producto.findAll.mockResolvedValue([1, 2, 3].map((id) => ({ ProductoID: id, PrecioBase: '10000.00' })));
        Talla.findAll.mockResolvedValue([{ TallaID: 1, Precio: '0.00' }, { TallaID: 2, Precio: '5000.00' }]);
    });

    test('10 líneas: 1 findAll de productos y 1 de tallas; recalcula el total', async () => {
        const req = { usuario: CLIENTE, body: { detalles: lineas(10), Subtotal: 1, Total: 1 } };
        const next = jest.fn();
        await preciosDelCliente(req, mockRes(), next);
        expect(next).toHaveBeenCalledWith();
        expect(Producto.findAll).toHaveBeenCalledTimes(1);
        expect(Talla.findAll).toHaveBeenCalledTimes(1);
        expect(Producto.findByPk).not.toHaveBeenCalled();
        expect(Talla.findByPk).not.toHaveBeenCalled();
        expect([...Producto.findAll.mock.calls[0][0].where.ProductoID].sort()).toEqual([1, 2, 3]);
        expect(req.body.Subtotal).toBe(300000);
        expect(req.body.Total).toBe(300000);
    });

    test('producto inexistente: 404 con el mismo mensaje', async () => {
        const res = mockRes(); const next = jest.fn();
        await preciosDelCliente({ usuario: CLIENTE, body: { detalles: [{ ProductoID: 99, ColorID: 1, TallaID: 1, Cantidad: 1, PrecioUnitario: 1 }] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Producto 99 no encontrado' });
        expect(next).not.toHaveBeenCalled();
    });

    test('precio por debajo del catálogo (base + talla): 400', async () => {
        const res = mockRes(); const next = jest.fn();
        await preciosDelCliente({ usuario: CLIENTE, body: { detalles: [{ ProductoID: 1, ColorID: 1, TallaID: 2, Cantidad: 1, PrecioUnitario: 12000 }] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    test('línea sin color o talla: 400 sin consultar la base', async () => {
        const res = mockRes(); const next = jest.fn();
        await preciosDelCliente({ usuario: CLIENTE, body: { detalles: [{ ProductoID: 1, Cantidad: 1, PrecioUnitario: 1 }] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(Producto.findAll).not.toHaveBeenCalled();
    });

    test('el administrador no pasa por la validación', async () => {
        const next = jest.fn();
        await preciosDelCliente({ usuario: ADMIN, body: { detalles: lineas(2) } }, mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(Producto.findAll).not.toHaveBeenCalled();
    });
});
