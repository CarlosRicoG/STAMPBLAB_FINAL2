// Servicio de inventario: reserva/devolución de stock y protección contra reposición de stock que nunca se descontó
const mockTx = { LOCK: { UPDATE: 'UPDATE' } };

jest.mock('../models', () => ({
    InventarioProducto: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
}));

const { InventarioProducto } = require('../models');
const inventario = require('../services/inventario');

const variante = (props) => ({ decrement: jest.fn(), increment: jest.fn(), Estado: 1, ...props });

beforeEach(() => {
    InventarioProducto.findByPk.mockReset();
    InventarioProducto.findOne.mockReset();
    InventarioProducto.findAll.mockReset();
});

describe('inventario.devolver', () => {
    test('repone la variante guardada en el detalle (InventarioID)', async () => {
        const v = variante({ InventarioID: 7 });
        InventarioProducto.findAll.mockResolvedValue([v]);
        await inventario.devolver([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 3, InventarioID: 7 }], mockTx);
        expect(v.increment).toHaveBeenCalledTimes(1);
        expect(v.increment).toHaveBeenCalledWith('Stock', { by: 3, transaction: mockTx });
        expect(InventarioProducto.findOne).not.toHaveBeenCalled();
    });

    test('un detalle sin InventarioID ni color/talla no repone nada (prenda propia)', async () => {
        await inventario.devolver([{ ProductoID: 1, ColorID: null, TallaID: null, Cantidad: 100, InventarioID: null }], mockTx);
        expect(InventarioProducto.findOne).not.toHaveBeenCalled();
        expect(InventarioProducto.findAll).not.toHaveBeenCalled();
    });

    test('pedidos antiguos (sin InventarioID pero con producto, color y talla) se resuelven por esos datos', async () => {
        const v = variante({ InventarioID: 12 });
        InventarioProducto.findOne.mockResolvedValue({ InventarioID: 12 });
        InventarioProducto.findAll.mockResolvedValue([v]);
        await inventario.devolver([{ ProductoID: 1, ColorID: 2, TallaID: 3, Cantidad: 4, InventarioID: null }], mockTx);
        expect(v.increment).toHaveBeenCalledWith('Stock', { by: 4, transaction: mockTx });
    });

    test('no toca el inventario si ninguna línea tiene variante', async () => {
        await inventario.devolver([{ ProductoID: 1, Cantidad: 5 }], mockTx);
        expect(InventarioProducto.findAll).not.toHaveBeenCalled();
    });
});

describe('inventario.reservar', () => {
    test('una línea TraePrenda no descuenta stock y se desliga de cualquier variante', async () => {
        const lineas = [{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 100, TraePrenda: true, InventarioID: 9 }];
        await inventario.reservar(lineas, mockTx);
        expect(lineas[0].InventarioID).toBeNull();
        expect(InventarioProducto.findAll).not.toHaveBeenCalled();
    });

    test('rechaza un InventarioID que pertenece a otro producto', async () => {
        InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 9, ProductoID: 99, ColorID: 1, TallaID: 1 });
        await expect(inventario.reservar([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, InventarioID: 9 }], mockTx))
            .rejects.toMatchObject({ esErrorNegocio: true });
    });

    test('rechaza un InventarioID inexistente', async () => {
        InventarioProducto.findByPk.mockResolvedValue(null);
        await expect(inventario.reservar([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, InventarioID: 9 }], mockTx))
            .rejects.toMatchObject({ esErrorNegocio: true });
    });

    test('rechaza una variante desactivada', async () => {
        InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 9, ProductoID: 1, ColorID: 1, TallaID: 1 });
        InventarioProducto.findAll.mockResolvedValue([variante({ InventarioID: 9, Stock: 10, Estado: 0 })]);
        await expect(inventario.reservar([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 1, InventarioID: 9 }], mockTx))
            .rejects.toThrow(/no está disponible/);
    });

    test('rechaza cuando el stock no alcanza y no descuenta nada', async () => {
        const v = variante({ InventarioID: 9, Stock: 2 });
        InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 9, ProductoID: 1, ColorID: 1, TallaID: 1 });
        InventarioProducto.findAll.mockResolvedValue([v]);
        await expect(inventario.reservar([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 5, InventarioID: 9 }], mockTx))
            .rejects.toThrow(/Stock insuficiente/);
        expect(v.decrement).not.toHaveBeenCalled();
    });

    test('descuenta el stock de la variante correcta', async () => {
        const v = variante({ InventarioID: 9, Stock: 10 });
        InventarioProducto.findByPk.mockResolvedValue({ InventarioID: 9, ProductoID: 1, ColorID: 1, TallaID: 1 });
        InventarioProducto.findAll.mockResolvedValue([v]);
        await inventario.reservar([{ ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 4, InventarioID: 9 }], mockTx);
        expect(v.decrement).toHaveBeenCalledWith('Stock', { by: 4, transaction: mockTx });
    });
});
