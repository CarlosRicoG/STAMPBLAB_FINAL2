// Cotizaciones: consultas agrupadas (tallas), creación completa en una sola transacción y conversión a venta bajo bloqueo
jest.mock('../models', () => ({
    Cotizacion: { findByPk: jest.fn(), create: jest.fn() },
    DetalleCotizacion: { create: jest.fn() },
    Usuario: { findByPk: jest.fn() },
    Estado: {}, Color: {}, Parte: {}, Tecnica: {},
    CotizacionTecnica: { bulkCreate: jest.fn() },
    CotizacionTalla: { bulkCreate: jest.fn() },
    CotizacionColor: { bulkCreate: jest.fn() },
    CotizacionInsumo: { bulkCreate: jest.fn() },
    Talla: { findAll: jest.fn(), findByPk: jest.fn() },
    Insumo: { findByPk: jest.fn() },
    Producto: { findByPk: jest.fn() },
    Venta: { create: jest.fn() },
    DetalleVenta: { create: jest.fn() },
    InventarioProducto: {},
    sequelize: { transaction: jest.fn() },
}));
jest.mock('../services/inventario', () => {
    class ErrorNegocio extends Error { constructor(m, s = 400) { super(m); this.esErrorNegocio = true; this.status = s; } }
    return { ErrorNegocio, reservar: jest.fn().mockResolvedValue(), devolver: jest.fn() };
});
jest.mock('../services/historial', () => ({ registrar: jest.fn().mockResolvedValue() }));
jest.mock('../services/notificaciones', () => ({ pedidoRecibido: jest.fn(), cotizacionRecibida: jest.fn() }));

const m = require('../models');
const controller = require('../controllers/cotizacionController');
const { ESTADO_COTIZACION } = require('../config/estados');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
// Transacción "administrada" de Sequelize: si el callback lanza, se deshace
const tx = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn(), finished: undefined };
const transaccionAdministrada = () => m.sequelize.transaction.mockImplementation(async (cb) => {
    if (!cb) return tx;
    try { const r = await cb(tx); await tx.commit(); return r; } catch (e) { await tx.rollback(); throw e; }
});

beforeEach(() => {
    jest.clearAllMocks();
    transaccionAdministrada();
    m.Usuario.findByPk.mockResolvedValue({ DocumentoID: 10, Nombre: 'Ana' });
});

describe('Pedido directo (sin diseños): precios de talla con una sola consulta', () => {
    test('carga todas las tallas con un findAll y calcula el subtotal', async () => {
        m.Producto.findByPk.mockResolvedValue({ ProductoID: 1, Nombre: 'Camiseta', PrecioBase: 10 });
        m.Insumo.findByPk.mockResolvedValue(null);
        m.Talla.findAll.mockResolvedValue([{ TallaID: 1, Precio: 2 }, { TallaID: 2, Precio: 3 }]);
        m.Venta.create.mockResolvedValue({ VentaID: 9 });
        const res = mockRes();
        await controller.createCotizacionInteligente({ body: { DocumentoID: 10, detalles: [
            { ProductoID: 1, Cantidad: 3, colores: [{ ColorID: 1 }], tallas: [{ TallaID: 1, Cantidad: 1 }, { TallaID: 2, Cantidad: 2 }] },
        ] } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(m.Talla.findAll).toHaveBeenCalledTimes(1);
        expect(m.Talla.findByPk).not.toHaveBeenCalled();
        expect(m.Venta.create).toHaveBeenCalledWith(expect.objectContaining({ Subtotal: 38, Total: 38 }), expect.anything());
    });
});

describe('createCotizacionCompleta: todo o nada', () => {
    const cuerpo = { DocumentoID: 10, detalles: [{ ProductoID: 1, Cantidad: 2, tallas: [{ TallaID: 1 }], tecnicas: [{ TecnicaID: 1, ParteID: 1 }] }] };

    test('cada escritura va dentro de la transacción', async () => {
        m.Producto.findByPk.mockResolvedValue({ ProductoID: 1 });
        m.Cotizacion.create.mockResolvedValue({ CotizacionID: 5 });
        m.DetalleCotizacion.create.mockResolvedValue({ DetalleCotizacionID: 7 });
        m.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 5, EstadoID: ESTADO_COTIZACION.PENDIENTE, detalles: [], update: jest.fn() });
        const res = mockRes();
        await controller.createCotizacionCompleta({ body: cuerpo }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(m.Cotizacion.create).toHaveBeenCalledWith(expect.anything(), { transaction: tx });
        expect(m.DetalleCotizacion.create).toHaveBeenCalledWith(expect.anything(), { transaction: tx });
        expect(m.CotizacionTalla.bulkCreate).toHaveBeenCalledWith(expect.anything(), { transaction: tx });
        expect(m.CotizacionTecnica.bulkCreate).toHaveBeenCalledWith(expect.anything(), { transaction: tx });
        // El total se recalcula dentro de la misma transacción (si no, no vería las filas aún sin confirmar)
        expect(m.Cotizacion.findByPk.mock.calls[0][1]).toEqual(expect.objectContaining({ transaction: tx }));
        expect(tx.commit).toHaveBeenCalled();
    });

    test('si falla a mitad de camino se deshace y responde 500', async () => {
        m.Producto.findByPk.mockResolvedValue({ ProductoID: 1 });
        m.Cotizacion.create.mockResolvedValue({ CotizacionID: 5 });
        m.DetalleCotizacion.create.mockResolvedValue({ DetalleCotizacionID: 7 });
        m.CotizacionTecnica.bulkCreate.mockRejectedValueOnce(new Error('falla'));
        const res = mockRes();
        await controller.createCotizacionCompleta({ body: cuerpo }, res);
        expect(tx.rollback).toHaveBeenCalled();
        expect(tx.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('calcularValorTotalCotizacion', () => {
    test('dentro de una transacción relanza el error (para que se deshaga)', async () => {
        m.Cotizacion.findByPk.mockRejectedValueOnce(new Error('falla'));
        await expect(controller.calcularValorTotalCotizacion(5, { transaction: tx })).rejects.toThrow('falla');
    });

    test('sin transacción conserva el comportamiento anterior (0 y sigue)', async () => {
        m.Cotizacion.findByPk.mockRejectedValueOnce(new Error('falla'));
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(await controller.calcularValorTotalCotizacion(5)).toBe(0);
        error.mockRestore();
    });

    test('createCotizacionCompleta: si falla el recálculo del total, se deshace todo', async () => {
        m.Producto.findByPk.mockResolvedValue({ ProductoID: 1 });
        m.Cotizacion.create.mockResolvedValue({ CotizacionID: 5 });
        m.DetalleCotizacion.create.mockResolvedValue({ DetalleCotizacionID: 7 });
        m.Cotizacion.findByPk.mockRejectedValueOnce(new Error('falla'));
        const res = mockRes();
        await controller.createCotizacionCompleta({ body: { DocumentoID: 10, detalles: [{ ProductoID: 1, Cantidad: 1 }] } }, res);
        expect(tx.rollback).toHaveBeenCalled();
        expect(tx.commit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('convertirCotizacionAVenta: la cotización desaparece antes del bloqueo', () => {
    test('si al releerla bajo bloqueo ya no existe: se deshace y responde 404', async () => {
        const detalle = { ProductoID: null, TraePrenda: true, Cantidad: 1, tallas: [], colores: [], insumos: [], tecnicas: [{ CostoTecnica: 5 }] };
        m.Cotizacion.findByPk
            .mockResolvedValueOnce({ CotizacionID: 3, EstadoID: ESTADO_COTIZACION.APROBADA, ValorTotal: 5, detalles: [detalle], usuario: {}, update: jest.fn() })
            .mockResolvedValueOnce(null);
        const res = mockRes();
        await controller.convertirCotizacionAVenta({ params: { cotizacionID: '3' }, usuario: { id: 1, rol: 1 } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(tx.rollback).toHaveBeenCalled();
        expect(m.Venta.create).not.toHaveBeenCalled();
    });
});
