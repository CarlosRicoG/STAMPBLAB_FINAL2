// Transacción simulada: el controlador debe hacer commit al terminar bien y rollback si algo falla
const mockTx = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
    Venta: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
    Usuario: { findByPk: jest.fn().mockResolvedValue({ DocumentoID: 1 }) },
    DetalleVenta: { findAll: jest.fn(), create: jest.fn(), destroy: jest.fn() },
    DetalleCompra: { findAll: jest.fn() },
    Compra: {},
    Producto: {},
    Insumo: {},
    InventarioProducto: {},
    Color: {},
    Talla: {},
    Estado: { findByPk: jest.fn() },
    sequelize: {
        fn: jest.fn(), col: jest.fn(), where: jest.fn(), literal: jest.fn(),
        transaction: jest.fn(() => Promise.resolve(mockTx)),
    },
}));

// El movimiento de stock vive en un servicio (con bloqueo de filas); aquí se prueba que el controlador lo use bien.
jest.mock('../services/inventario', () => {
    class ErrorNegocio extends Error {
        constructor(m, status = 400) { super(m); this.esErrorNegocio = true; this.status = status; }
    }
    return { ErrorNegocio, reservar: jest.fn(), devolver: jest.fn(), resolverId: jest.fn() };
});

const { Venta, DetalleVenta, Estado } = require('../models');
const inventario = require('../services/inventario');
const controller = require('../controllers/ventaController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => {
    mockTx.commit.mockClear();
    mockTx.rollback.mockClear();
    inventario.reservar.mockReset();
    inventario.devolver.mockReset();
});

describe('VentaController - Pruebas Unitarias', () => {

    describe('getAllVentas', () => {
        test('debería retornar lista paginada de ventas exitosamente', async () => {
            Venta.count.mockResolvedValue(1);
            Venta.findAll.mockResolvedValue([{ VentaID: 1, Total: 50000 }]);
            const req = { query: {} };
            const res = mockRes();
            await controller.getAllVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 1 }));
        });

        test('debería retornar 500 si falla la base de datos', async () => {
            Venta.count.mockRejectedValue(new Error('DB caída'));
            const req = { query: {} };
            const res = mockRes();
            await controller.getAllVentas(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getVentaById', () => {
        test('debería retornar la venta si existe', async () => {
            Venta.findByPk.mockResolvedValue({ VentaID: 1, Total: 80000 });
            const req = { params: { id: '1' } };
            const res = mockRes();
            await controller.getVentaById(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        test('debería retornar 404 si la venta no existe', async () => {
            Venta.findByPk.mockResolvedValue(null);
            const req = { params: { id: '999' } };
            const res = mockRes();
            await controller.getVentaById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Venta no encontrada' }));
        });
    });

    describe('crearVenta', () => {
        const detalles = () => [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 2, PrecioUnitario: 10000 }];

        test('debería retornar 400 si faltan datos obligatorios (sin abrir transacción)', async () => {
            const res = mockRes();
            await controller.crearVenta({ body: {} }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Faltan datos obligatorios' }));
            expect(inventario.reservar).not.toHaveBeenCalled();
        });

        test('si el servicio dice que no hay stock responde 400, hace rollback y NO crea la venta', async () => {
            const { ErrorNegocio } = inventario;
            inventario.reservar.mockRejectedValue(new ErrorNegocio('Stock insuficiente. Disponible: 1, Solicitado: 5'));
            Venta.create.mockClear();
            const res = mockRes();
            await controller.crearVenta({ body: { DocumentoID: '123', detalles: detalles() } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Stock insuficiente') }));
            expect(mockTx.rollback).toHaveBeenCalled();
            expect(mockTx.commit).not.toHaveBeenCalled();
            expect(Venta.create).not.toHaveBeenCalled();
        });

        test('si no existe la variante responde 400 con el detalle', async () => {
            const { ErrorNegocio } = inventario;
            inventario.reservar.mockRejectedValue(new ErrorNegocio('No existe variante para Producto 1, Color 1, Talla 1'));
            const res = mockRes();
            await controller.crearVenta({ body: { DocumentoID: '123', detalles: detalles() } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('No existe variante') }));
        });

        test('crea la venta dentro de la transacción: reserva el stock, guarda la variante exacta y hace commit', async () => {
            inventario.reservar.mockImplementation(async (lineas) => { lineas.forEach((l) => { l.InventarioID = 77; }); });
            Venta.create.mockResolvedValue({ VentaID: 5, DocumentoID: '123', Total: 20000 });
            DetalleVenta.create.mockClear();
            DetalleVenta.create.mockResolvedValue({});
            const res = mockRes();
            await controller.crearVenta({ body: { DocumentoID: '123', Subtotal: 18000, Total: 20000, detalles: detalles() } }, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(inventario.reservar).toHaveBeenCalledWith(expect.any(Array), mockTx);
            expect(Venta.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTx });
            expect(DetalleVenta.create).toHaveBeenCalledWith(expect.objectContaining({ VentaID: 5, InventarioID: 77 }), { transaction: mockTx });
            expect(mockTx.commit).toHaveBeenCalled();
            expect(mockTx.rollback).not.toHaveBeenCalled();
        });

        test('un error inesperado responde 500 y deshace todo', async () => {
            inventario.reservar.mockResolvedValue();
            Venta.create.mockRejectedValue(new Error('se cayó la BD'));
            const res = mockRes();
            await controller.crearVenta({ body: { DocumentoID: '123', detalles: detalles() } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockTx.rollback).toHaveBeenCalled();
        });
    });

    describe('updateEstadoVenta', () => {
        const ventaConEstado = (EstadoID) => ({ VentaID: 1, EstadoID, update: jest.fn().mockResolvedValue(true) });

        test('cancelar una venta PENDIENTE devuelve el stock', async () => {
            Estado.findByPk.mockResolvedValue({ EstadoID: 12, Tipo: 'venta' });
            const venta = ventaConEstado(8);
            Venta.findByPk.mockResolvedValue(venta);
            DetalleVenta.findAll.mockResolvedValue([{ ProductoID: 1, Cantidad: 2 }]);
            const res = mockRes();
            await controller.updateEstadoVenta({ params: { id: '1' }, body: { EstadoID: 12 } }, res);
            expect(inventario.devolver).toHaveBeenCalledTimes(1);
            expect(venta.update).toHaveBeenCalledWith({ EstadoID: 12 }, { transaction: mockTx });
            expect(mockTx.commit).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stockDevuelto: true }));
        });

        test('cancelar una venta que YA está pagada NO devuelve stock', async () => {
            Estado.findByPk.mockResolvedValue({ EstadoID: 12, Tipo: 'venta' });
            Venta.findByPk.mockResolvedValue(ventaConEstado(9));
            const res = mockRes();
            await controller.updateEstadoVenta({ params: { id: '1' }, body: { EstadoID: 12 } }, res);
            expect(inventario.devolver).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stockDevuelto: false }));
        });

        test('una venta cancelada no puede cambiar de estado (evita descuadrar el inventario)', async () => {
            Estado.findByPk.mockResolvedValue({ EstadoID: 9, Tipo: 'venta' });
            Venta.findByPk.mockResolvedValue(ventaConEstado(12));
            const res = mockRes();
            await controller.updateEstadoVenta({ params: { id: '1' }, body: { EstadoID: 9 } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockTx.rollback).toHaveBeenCalled();
            expect(inventario.devolver).not.toHaveBeenCalled();
        });

        test('un estado que no es de venta se rechaza', async () => {
            Estado.findByPk.mockResolvedValue({ EstadoID: 2, Tipo: 'cotizacion' });
            const res = mockRes();
            await controller.updateEstadoVenta({ params: { id: '1' }, body: { EstadoID: 2 } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteVenta', () => {
        test('debería retornar 404 si la venta no existe', async () => {
            Venta.findByPk.mockResolvedValue(null);
            const res = mockRes();
            await controller.deleteVenta({ params: { id: '999' } }, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        test.each([9, 10, 13, 11])('NO se puede eliminar un pedido en estado %i (es historial): 400, nada se borra ni se devuelve', async (estado) => {
            const destroyMock = jest.fn();
            Venta.findByPk.mockResolvedValue({ VentaID: 1, EstadoID: estado, destroy: destroyMock });
            DetalleVenta.destroy.mockClear();
            const res = mockRes();
            await controller.deleteVenta({ params: { id: '1' } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(destroyMock).not.toHaveBeenCalled();
            expect(DetalleVenta.destroy).not.toHaveBeenCalled();
            expect(inventario.devolver).not.toHaveBeenCalled();
            expect(mockTx.rollback).toHaveBeenCalled();
        });

        test('un pedido CANCELADO sí se puede eliminar y NO devuelve stock otra vez', async () => {
            const destroyMock = jest.fn().mockResolvedValue(true);
            Venta.findByPk.mockResolvedValue({ VentaID: 1, EstadoID: 12, destroy: destroyMock });
            DetalleVenta.findAll.mockResolvedValue([]);
            DetalleVenta.destroy.mockResolvedValue(true);
            const res = mockRes();
            await controller.deleteVenta({ params: { id: '1' } }, res);
            expect(destroyMock).toHaveBeenCalled();
            expect(inventario.devolver).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Venta eliminada exitosamente', stockDevuelto: false }));
        });

        test('borrar una venta PENDIENTE devuelve el stock', async () => {
            Venta.findByPk.mockResolvedValue({ VentaID: 1, EstadoID: 8, destroy: jest.fn().mockResolvedValue(true) });
            DetalleVenta.findAll.mockResolvedValue([{ ProductoID: 1, Cantidad: 3 }]);
            const res = mockRes();
            await controller.deleteVenta({ params: { id: '1' } }, res);
            expect(inventario.devolver).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stockDevuelto: true }));
        });
    });

});
