jest.mock('../models', () => ({
    InventarioProducto: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    Producto: {},
    Color: {},
    Talla: {},
    Insumo: {},
    Venta: { count: jest.fn().mockResolvedValue(0) },
    DetalleVenta: { findAll: jest.fn() },
}));

const { InventarioProducto } = require('../models');
const controller = require('../controllers/inventarioproductoController');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('InventarioProductoController - Pruebas Unitarias', () => {

    describe('getAllInventario', () => {
        test('debería retornar el inventario completo exitosamente', async () => {
            InventarioProducto.findAll.mockResolvedValue([{ InventarioID: 1, Stock: 10 }]);
            const res = mockRes();
            await controller.getAllInventario({}, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: true }));
        });

        test('debería retornar 500 si falla la base de datos', async () => {
            InventarioProducto.findAll.mockRejectedValue(new Error('DB caída'));
            const res = mockRes();
            await controller.getAllInventario({}, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getInventarioById', () => {
        test('debería retornar la variante si existe', async () => {
            InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 1, Stock: 5 });
            const req = { params: { id: '1' } };
            const res = mockRes();
            await controller.getInventarioById(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: true }));
        });

        test('debería retornar 404 si la variante no existe', async () => {
            InventarioProducto.findByPk.mockResolvedValue(null);
            const req = { params: { id: '999' } };
            const res = mockRes();
            await controller.getInventarioById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Variante no encontrada' }));
        });
    });

    describe('createInventario', () => {
        test('debería retornar 400 si faltan ProductoID, ColorID o TallaID', async () => {
            const req = { body: { Stock: 5 } };
            const res = mockRes();
            await controller.createInventario(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'ProductoID, ColorID y TallaID son obligatorios' }));
        });

        test('debería retornar 400 si ya existe esa combinación', async () => {
            InventarioProducto.findOne.mockResolvedValue({ InventarioID: 1 });
            const req = { body: { ProductoID: 1, ColorID: 1, TallaID: 1 } };
            const res = mockRes();
            await controller.createInventario(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('Ya existe una variante') }));
        });

        test('debería crear la variante correctamente', async () => {
            InventarioProducto.findOne
                .mockResolvedValueOnce(null)   // verificar duplicado
                .mockResolvedValueOnce({ InventarioID: 5, Stock: 10 }); // findByPk interno
            InventarioProducto.create.mockResolvedValue({ InventarioID: 5 });
            InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 5, Stock: 10 });
            const req = { body: { ProductoID: 1, ColorID: 2, TallaID: 3, Stock: 10 } };
            const res = mockRes();
            await controller.createInventario(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: true, mensaje: 'Variante creada exitosamente' }));
        });
    });

    describe('deleteInventario', () => {
        test('debería retornar 404 si la variante no existe', async () => {
            InventarioProducto.findByPk.mockResolvedValue(null);
            const req = { params: { id: '999' } };
            const res = mockRes();
            await controller.deleteInventario(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('debería eliminar la variante correctamente', async () => {
            const destroyMock = jest.fn().mockResolvedValue(true);
            InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 1, destroy: destroyMock });
            const req = { params: { id: '1' } };
            const res = mockRes();
            await controller.deleteInventario(req, res);
            expect(destroyMock).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: true, mensaje: 'Variante eliminada exitosamente' }));
        });

        test('no se borra si la usan pedidos Pendientes o Pagados (una sola consulta filtrada)', async () => {
            const { Venta, DetalleVenta } = require('../models');
            const { ESTADO_VENTA } = require('../config/estados');
            const destroyMock = jest.fn();
            InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 7, destroy: destroyMock });
            Venta.count.mockResolvedValueOnce(2);
            const res = mockRes();
            await controller.deleteInventario({ params: { id: '7' } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringMatching(/2 pedido\(s\).*pagado/) }));
            expect(destroyMock).not.toHaveBeenCalled();
            // Cuenta con where (estado + variante) en vez de traer todos los detalles de la variante
            const consulta = Venta.count.mock.calls.at(-1)[0];
            expect(consulta.where.EstadoID).toEqual(expect.arrayContaining([ESTADO_VENTA.PENDIENTE, ESTADO_VENTA.PAGADA]));
            expect(consulta.include[0].where).toEqual({ InventarioID: 7 });
            expect(DetalleVenta.findAll).not.toHaveBeenCalled();
        });
    });

});