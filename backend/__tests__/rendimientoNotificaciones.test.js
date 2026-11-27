// Notificaciones: la venta se lee sin el comprobante en base64 y el aviso de stock bajo
// carga inventario, productos, colores y tallas con una consulta por tabla (no ~4 por línea).
jest.mock('../models', () => ({
    Venta: { findByPk: jest.fn() },
    Cotizacion: { findByPk: jest.fn() },
    Usuario: { findAll: jest.fn().mockResolvedValue([]) },
    Estado: {},
    DetalleVenta: { findAll: jest.fn() },
    InventarioProducto: { findAll: jest.fn(), findByPk: jest.fn() },
    Producto: { findAll: jest.fn(), findByPk: jest.fn() },
    Color: { findAll: jest.fn(), findByPk: jest.fn() },
    Talla: { findAll: jest.fn(), findByPk: jest.fn() },
    sequelize: { literal: jest.fn((sql) => ({ sql })) },
}));
jest.mock('../services/correo', () => ({ enviar: jest.fn().mockResolvedValue() }));
jest.mock('../services/avisos', () => ({ paraUsuario: jest.fn().mockResolvedValue(), paraAdmins: jest.fn().mockResolvedValue() }));
jest.mock('../services/config', () => ({ leer: jest.fn(() => ({ stockMinimo: 5, plazoPagoHoras: 24 })) }));
jest.mock('../services/plantillas', () => new Proxy({ cop: (v) => String(v) }, { get: (o, k) => (o[k] = o[k] || jest.fn(() => ({ asunto: 'a', html: 'h' }))) }));

const db = require('../models');
const avisos = require('../services/avisos');
const notificaciones = require('../services/notificaciones');

beforeEach(() => { jest.clearAllMocks(); });

describe('cargarVenta: sin el comprobante', () => {
    test('excluye ComprobanteTransferencia y trae TieneComprobante', async () => {
        db.Venta.findByPk.mockResolvedValue(null);
        await notificaciones.cargarVenta(7);
        const { attributes } = db.Venta.findByPk.mock.calls[0][1];
        expect(attributes.exclude).toContain('ComprobanteTransferencia');
        expect(attributes.include.map(([, alias]) => alias)).toContain('TieneComprobante');
    });

    test('pedidoRecibido avisa del comprobante por revisar usando TieneComprobante', async () => {
        const venta = { VentaID: 7, DocumentoID: 1, Total: 10, MetodoPago: 'transferencia', usuario: null, detalles: [], get: (k) => (k === 'TieneComprobante' ? 1 : undefined) };
        db.Venta.findByPk.mockResolvedValue(venta);
        db.DetalleVenta.findAll.mockResolvedValue([]);
        await notificaciones.pedidoRecibido(7);
        expect(avisos.paraAdmins).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pago', mensaje: expect.stringMatching(/comprobante por revisar/) }));
    });

    test('sin comprobante no hay aviso de pago', async () => {
        const venta = { VentaID: 7, DocumentoID: 1, Total: 10, MetodoPago: 'transferencia', usuario: null, detalles: [], get: () => 0 };
        db.Venta.findByPk.mockResolvedValue(venta);
        db.DetalleVenta.findAll.mockResolvedValue([]);
        await notificaciones.pedidoRecibido(7);
        expect(avisos.paraAdmins).not.toHaveBeenCalledWith(expect.objectContaining({ tipo: 'pago' }));
    });
});

describe('variantesBajas: una consulta por tabla', () => {
    test('detecta solo las variantes que acaban de cruzar el mínimo, con nombres', async () => {
        db.DetalleVenta.findAll.mockResolvedValue([
            { InventarioID: 1, Cantidad: 2 }, // 6 -> 4: cruza (mínimo 5)
            { InventarioID: 2, Cantidad: 1 }, // 3 -> 2: ya estaba bajo
            { InventarioID: 3, Cantidad: 1 }, // 20: no está bajo
            { InventarioID: null, Cantidad: 1 }, // prenda propia
            { InventarioID: 4, Cantidad: 5 }, // 9 -> 4: cruza
        ]);
        db.InventarioProducto.findAll.mockResolvedValue([
            { InventarioID: 1, ProductoID: 10, ColorID: 100, TallaID: 1000, Stock: 4 },
            { InventarioID: 2, ProductoID: 10, ColorID: 100, TallaID: 1001, Stock: 2 },
            { InventarioID: 3, ProductoID: 11, ColorID: 101, TallaID: 1000, Stock: 20 },
            { InventarioID: 4, ProductoID: 11, ColorID: 101, TallaID: 1001, Stock: 4 },
        ]);
        db.Producto.findAll.mockResolvedValue([{ ProductoID: 10, Nombre: 'Camiseta' }, { ProductoID: 11, Nombre: 'Buzo' }]);
        db.Color.findAll.mockResolvedValue([{ ColorID: 100, Nombre: 'Negro' }, { ColorID: 101, Nombre: 'Blanco' }]);
        db.Talla.findAll.mockResolvedValue([{ TallaID: 1000, Nombre: 'M' }, { TallaID: 1001, Nombre: 'L' }]);

        const bajas = await notificaciones.variantesBajas(7);

        expect(bajas).toEqual([
            { producto: 'Camiseta', color: 'Negro', talla: 'M', stock: 4 },
            { producto: 'Buzo', color: 'Blanco', talla: 'L', stock: 4 },
        ]);
        for (const m of [db.InventarioProducto, db.Producto, db.Color, db.Talla]) {
            expect(m.findAll).toHaveBeenCalledTimes(1);
            expect(m.findByPk).not.toHaveBeenCalled();
        }
        expect(db.InventarioProducto.findAll.mock.calls[0][0].where.InventarioID).toEqual([1, 2, 3, 4]);
        // Solo se piden los nombres de las variantes que cruzaron
        expect(db.Producto.findAll.mock.calls[0][0].where.ProductoID).toEqual([10, 11]);
    });

    test('si ninguna cruza el mínimo no consulta productos, colores ni tallas', async () => {
        db.DetalleVenta.findAll.mockResolvedValue([{ InventarioID: 3, Cantidad: 1 }]);
        db.InventarioProducto.findAll.mockResolvedValue([{ InventarioID: 3, ProductoID: 11, ColorID: 101, TallaID: 1000, Stock: 20 }]);
        expect(await notificaciones.variantesBajas(7)).toEqual([]);
        expect(db.Producto.findAll).not.toHaveBeenCalled();
    });

    test('nombres que ya no existen: usa los textos de respaldo', async () => {
        db.DetalleVenta.findAll.mockResolvedValue([{ InventarioID: 1, Cantidad: 2 }]);
        db.InventarioProducto.findAll.mockResolvedValue([{ InventarioID: 1, ProductoID: 10, ColorID: 100, TallaID: 1000, Stock: 4 }]);
        db.Producto.findAll.mockResolvedValue([]); db.Color.findAll.mockResolvedValue([]); db.Talla.findAll.mockResolvedValue([]);
        expect(await notificaciones.variantesBajas(7)).toEqual([{ producto: 'Producto', color: '—', talla: '—', stock: 4 }]);
    });
});
