// Rendimiento en cotizaciones: las asociaciones hasMany del árbol de una cotización se cargan con separate: true
// (sin producto cartesiano detalles × técnicas × tallas × colores × insumos), el listado del cliente admite
// paginación opcional y los productos/telas se cargan con una consulta por tabla.
jest.mock('../models', () => ({
    Cotizacion: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn() },
    DetalleCotizacion: { create: jest.fn() },
    Usuario: { findByPk: jest.fn() },
    Estado: { name: 'Estado' },
    CotizacionTecnica: { name: 'CotizacionTecnica', bulkCreate: jest.fn() },
    CotizacionTalla: { name: 'CotizacionTalla', bulkCreate: jest.fn() },
    CotizacionColor: { name: 'CotizacionColor', bulkCreate: jest.fn() },
    CotizacionInsumo: { name: 'CotizacionInsumo', bulkCreate: jest.fn() },
    Tecnica: {}, Color: {}, Parte: {},
    Talla: { findAll: jest.fn(), findByPk: jest.fn() },
    Insumo: { findAll: jest.fn(), findByPk: jest.fn() },
    Producto: { findAll: jest.fn(), findByPk: jest.fn() },
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
jest.mock('../services/notificaciones', () => new Proxy({}, { get: (o, k) => (o[k] = o[k] || jest.fn()) }));

const m = require('../models');
const controller = require('../controllers/cotizacionController');
const { ESTADO_COTIZACION } = require('../config/estados');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const tx = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn(), finished: undefined };

beforeEach(() => {
    jest.clearAllMocks();
    m.sequelize.transaction.mockImplementation(async (cb) => {
        if (!cb) return tx;
        try { const r = await cb(tx); await tx.commit(); return r; } catch (e) { await tx.rollback(); throw e; }
    });
    m.Usuario.findByPk.mockResolvedValue({ DocumentoID: 10, Nombre: 'Ana' });
});

// Comprueba la forma del árbol: mismas asociaciones y alias que antes, con las hasMany en consultas separadas
const comprobarArbol = (include) => {
    const porAlias = Object.fromEntries(include.map((i) => [i.as, i]));
    expect(Object.keys(porAlias).sort()).toEqual(['detalles', 'estado', 'usuario']);
    expect(porAlias.usuario.separate).toBeFalsy();
    expect(porAlias.estado.separate).toBeFalsy();
    const detalles = porAlias.detalles;
    expect(detalles.separate).toBe(true);
    const hijos = Object.fromEntries(detalles.include.map((i) => [i.as, i]));
    expect(Object.keys(hijos).sort()).toEqual(['colores', 'insumos', 'producto', 'tallas', 'tecnicas']);
    expect(hijos.producto.separate).toBeFalsy(); // belongsTo: va en el JOIN
    for (const alias of ['tecnicas', 'tallas', 'colores', 'insumos']) expect(hijos[alias].separate).toBe(true);
    expect(hijos.tecnicas.include.map((i) => i.as).sort()).toEqual(['parte', 'tecnica']);
    expect(hijos.tallas.include.map((i) => i.as)).toEqual(['talla']);
    expect(hijos.colores.include.map((i) => i.as)).toEqual(['color']);
    expect(hijos.insumos.include.map((i) => i.as)).toEqual(['insumo']);
};

describe('Árbol de la cotización: hasMany con separate', () => {
    test('getAllCotizaciones: sin producto cartesiano, misma forma, filtros y paginación', async () => {
        m.Cotizacion.count.mockResolvedValue(25);
        m.Cotizacion.findAll.mockResolvedValue([{ CotizacionID: 3 }]);
        const res = mockRes();
        await controller.getAllCotizaciones({ query: { page: '2', limit: '10', search: 'ana', estado: 'Pendiente' } }, res);
        const opciones = m.Cotizacion.findAll.mock.calls[0][0];
        comprobarArbol(opciones.include);
        const usuario = opciones.include.find((i) => i.as === 'usuario');
        const estado = opciones.include.find((i) => i.as === 'estado');
        expect(usuario.required).toBe(true);
        expect(estado).toEqual(expect.objectContaining({ where: { Nombre: 'Pendiente' }, required: true }));
        expect(opciones).toEqual(expect.objectContaining({ order: [['CotizacionID', 'DESC']], limit: 10, offset: 10 }));
        expect(res.json).toHaveBeenCalledWith({ datos: [{ CotizacionID: 3 }], total: 25, pagina: 2, totalPaginas: 3, limit: 10 });
    });

    test('getCotizacionById usa el mismo árbol', async () => {
        m.Cotizacion.findByPk.mockResolvedValue(null);
        await controller.getCotizacionById({ params: { id: '1' } }, mockRes());
        comprobarArbol(m.Cotizacion.findByPk.mock.calls[0][1].include);
    });

    test('cada llamada recibe un árbol nuevo (Sequelize modifica los include que recibe)', async () => {
        m.Cotizacion.findAll.mockResolvedValue([]);
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: {} }, mockRes());
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: {} }, mockRes());
        const [a, b] = m.Cotizacion.findAll.mock.calls.map((c) => c[0].include);
        expect(a).not.toBe(b);
        expect(a[2]).not.toBe(b[2]);
    });
});

describe('getCotizacionesByUsuario: paginación opcional', () => {
    test('cliente re-registrado sobre una cuenta suprimida (req.historialDesde): solo sus cotizaciones nuevas', async () => {
        const { Op } = require('sequelize');
        const desde = new Date('2026-12-01T00:00:00Z');
        m.Cotizacion.findAll.mockResolvedValue([]);
        m.Cotizacion.count.mockResolvedValue(0);
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: {}, historialDesde: desde }, mockRes());
        expect(m.Cotizacion.findAll.mock.calls[0][0].where).toEqual({ DocumentoID: '10', FechaCotizacion: { [Op.gt]: desde } });
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: { page: '1' }, historialDesde: desde }, mockRes());
        expect(m.Cotizacion.count).toHaveBeenCalledWith({ where: { DocumentoID: '10', FechaCotizacion: { [Op.gt]: desde } } });
    });

    test('sin page ni limit: responde el arreglo de siempre, sin límite', async () => {
        const filas = [{ CotizacionID: 2 }, { CotizacionID: 1 }];
        m.Cotizacion.findAll.mockResolvedValue(filas);
        const res = mockRes();
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: {} }, res);
        const opciones = m.Cotizacion.findAll.mock.calls[0][0];
        comprobarArbol(opciones.include);
        expect(opciones.where).toEqual({ DocumentoID: '10' });
        expect(opciones.order).toEqual([['CotizacionID', 'DESC']]);
        expect(opciones.limit).toBeUndefined();
        expect(m.Cotizacion.count).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(filas);
    });

    test('con page y limit: { datos, total, pagina, totalPaginas, limit }', async () => {
        m.Cotizacion.count.mockResolvedValue(12);
        m.Cotizacion.findAll.mockResolvedValue([{ CotizacionID: 7 }]);
        const res = mockRes();
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: { page: '2', limit: '5' } }, res);
        expect(m.Cotizacion.count).toHaveBeenCalledWith({ where: { DocumentoID: '10' } });
        expect(m.Cotizacion.findAll.mock.calls[0][0]).toEqual(expect.objectContaining({ limit: 5, offset: 5, order: [['CotizacionID', 'DESC']] }));
        expect(res.json).toHaveBeenCalledWith({ datos: [{ CotizacionID: 7 }], total: 12, pagina: 2, totalPaginas: 3, limit: 5 });
    });

    test('solo limit: primera página; limit acotado a 100', async () => {
        m.Cotizacion.count.mockResolvedValue(0);
        m.Cotizacion.findAll.mockResolvedValue([]);
        await controller.getCotizacionesByUsuario({ params: { documentoID: '10' }, query: { limit: '5000' } }, mockRes());
        expect(m.Cotizacion.findAll.mock.calls[0][0]).toEqual(expect.objectContaining({ limit: 100, offset: 0 }));
    });
});

describe('Sin consultas dentro de bucles', () => {
    test('pedido directo: productos y telas con un findAll cada uno', async () => {
        m.Producto.findAll.mockResolvedValue([{ ProductoID: 1, Nombre: 'Camiseta', PrecioBase: 10 }, { ProductoID: 2, Nombre: 'Buzo', PrecioBase: 20 }]);
        m.Insumo.findAll.mockResolvedValue([{ InsumoID: 5, PrecioTela: 4 }]);
        m.Talla.findAll.mockResolvedValue([{ TallaID: 1, Precio: 2 }]);
        m.Venta.create.mockResolvedValue({ VentaID: 9 });
        const res = mockRes();
        await controller.createCotizacionInteligente({ body: { DocumentoID: 10, detalles: [
            { ProductoID: 1, Cantidad: 2, colores: [{ ColorID: 1 }], tallas: [{ TallaID: 1 }], insumos: [{ InsumoID: 5 }] },
            { ProductoID: 2, Cantidad: 1, colores: [{ ColorID: 1 }], tallas: [{ TallaID: 1 }] },
            { ProductoID: 1, Cantidad: 1, colores: [{ ColorID: 2 }], tallas: [{ TallaID: 1 }] },
        ] } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(m.Producto.findAll).toHaveBeenCalledTimes(1);
        expect(m.Insumo.findAll).toHaveBeenCalledTimes(1);
        expect(m.Producto.findByPk).not.toHaveBeenCalled();
        expect(m.Insumo.findByPk).not.toHaveBeenCalled();
        // (10+2+4)·2 + (20+2)·1 + (10+2)·1 = 66
        expect(m.Venta.create).toHaveBeenCalledWith(expect.objectContaining({ Subtotal: 66, Total: 66 }), expect.anything());
        const { detalles } = res.json.mock.calls[0][0];
        expect(detalles.map((d) => d.Nombre)).toEqual(['Camiseta', 'Buzo', 'Camiseta']);
    });

    test('pedido directo: producto inexistente sigue respondiendo 404', async () => {
        m.Producto.findAll.mockResolvedValue([]);
        m.Insumo.findAll.mockResolvedValue([]);
        m.Talla.findAll.mockResolvedValue([]);
        const res = mockRes();
        await controller.createCotizacionInteligente({ body: { DocumentoID: 10, detalles: [{ ProductoID: 99, Cantidad: 1, colores: [{ ColorID: 1 }], tallas: [{ TallaID: 1 }] }] } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Producto 99 no encontrado' });
    });

    test('createCotizacionCompleta: existencia de productos con un solo findAll', async () => {
        m.Producto.findAll.mockResolvedValue([{ ProductoID: 1 }, { ProductoID: 2 }]);
        m.Cotizacion.create.mockResolvedValue({ CotizacionID: 5 });
        m.DetalleCotizacion.create.mockResolvedValue({ DetalleCotizacionID: 7 });
        m.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 5, EstadoID: ESTADO_COTIZACION.PENDIENTE, detalles: [], update: jest.fn() });
        const res = mockRes();
        await controller.createCotizacionCompleta({ body: { DocumentoID: 10, detalles: [{ ProductoID: 1, Cantidad: 1 }, { ProductoID: 2, Cantidad: 1 }, { ProductoID: 1, Cantidad: 3 }] } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(m.Producto.findAll).toHaveBeenCalledTimes(1);
        expect(m.Producto.findByPk).not.toHaveBeenCalled();
        comprobarArbol(m.Cotizacion.findByPk.mock.calls[m.Cotizacion.findByPk.mock.calls.length - 1][1].include);
    });

    test('createCotizacionCompleta: producto inexistente responde 400 con su posición', async () => {
        m.Producto.findAll.mockResolvedValue([{ ProductoID: 1 }]);
        const res = mockRes();
        await controller.createCotizacionCompleta({ body: { DocumentoID: 10, detalles: [{ ProductoID: 1, Cantidad: 1 }, { ProductoID: 8, Cantidad: 1 }] } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Producto 2: el producto 8 no existe' });
        expect(m.Cotizacion.create).not.toHaveBeenCalled();
    });
});
