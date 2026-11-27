// Cliente que se vuelve a registrar con el documento de una cuenta suprimida: no ve el historial del titular anterior
// (usuarios.HistorialDesde). El administrador lo ve todo. Y una cuenta suprimida no crea pedidos ni cotizaciones.
jest.mock('../models', () => ({
    Usuario: { findByPk: jest.fn(), findAll: jest.fn().mockResolvedValue([]) },
    Venta: { findByPk: jest.fn() },
    Cotizacion: { findByPk: jest.fn() },
    Producto: {}, Talla: {}, Tecnica: {}, Parte: {},
    SesionRevocada: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn().mockResolvedValue([]) },
}));

const { Op } = require('sequelize');
const db = require('../models');
const { visible, desdeWhere, historialDelCliente, cuentaActiva } = require('../services/historialCliente');
const ventas = require('../routes/ventas');
const cotizaciones = require('../routes/cotizaciones');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const cliente = { id: 555, rol: 2 };
const admin = { id: 1, rol: 1 };
const DESDE = new Date('2026-12-01T00:00:00Z');
const ANTES = new Date('2026-11-01T00:00:00Z');
const DESPUES = new Date('2026-12-05T00:00:00Z');

const correr = async (mw, req) => {
    const res = mockRes(); const next = jest.fn();
    await mw(req, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
    db.Usuario.findByPk.mockResolvedValue({ HistorialDesde: DESDE, SuprimidoEn: null });
});

describe('reglas', () => {
    test('visible: sin HistorialDesde todo es visible; con fecha, solo lo estrictamente posterior', () => {
        expect(visible(ANTES, null)).toBe(true);
        expect(visible(ANTES, DESDE)).toBe(false);
        expect(visible(DESDE, DESDE)).toBe(false); // mismo segundo de la supresión: del titular anterior
        expect(visible(DESPUES, DESDE)).toBe(true);
        expect(visible(null, DESDE)).toBe(false);
    });

    test('desdeWhere', () => {
        expect(desdeWhere('FechaVenta', null)).toEqual({});
        expect(desdeWhere('FechaVenta', DESDE)).toEqual({ FechaVenta: { [Op.gt]: DESDE } });
    });

    test('historialDelCliente: fija req.historialDesde al cliente; al administrador no', async () => {
        const req = { usuario: cliente };
        const { next } = await correr(historialDelCliente, req);
        expect(next).toHaveBeenCalledWith();
        expect(req.historialDesde).toEqual(DESDE);
        const reqAdmin = { usuario: admin };
        await correr(historialDelCliente, reqAdmin);
        expect(reqAdmin.historialDesde).toBeNull();
        expect(db.Usuario.findByPk).toHaveBeenCalledTimes(1);
    });
});

describe('pedidos del cliente', () => {
    test('listado (soloSuyas): fuerza su documento y su HistorialDesde', async () => {
        const req = { usuario: cliente };
        const { next } = await correr(ventas.soloSuyas, req);
        expect(next).toHaveBeenCalled();
        expect(req.documentoForzado).toBe('555');
        expect(req.historialDesde).toEqual(DESDE);
    });

    test('un pedido del titular anterior (antes de HistorialDesde) no existe para el cliente: 404', async () => {
        db.Venta.findByPk.mockResolvedValue({ VentaID: 3, DocumentoID: 555, FechaVenta: ANTES });
        const { res, next } = await correr(ventas.ventaPropiaOAdmin, { usuario: cliente, params: { id: '3' } });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
        expect(db.Venta.findByPk.mock.calls[0][1].attributes).toContain('FechaVenta');
    });

    test('un pedido propio posterior sí se ve (detalle, historial, factura, comprobante, cancelar)', async () => {
        db.Venta.findByPk.mockResolvedValue({ VentaID: 4, DocumentoID: 555, FechaVenta: DESPUES });
        const { next } = await correr(ventas.ventaPropiaOAdmin, { usuario: cliente, params: { id: '4' } });
        expect(next).toHaveBeenCalled();
    });

    test('el administrador ve todos los pedidos', async () => {
        const { next } = await correr(ventas.ventaPropiaOAdmin, { usuario: admin, params: { id: '3' } });
        expect(next).toHaveBeenCalled();
        expect(db.Venta.findByPk).not.toHaveBeenCalled();
    });
});

describe('cotizaciones del cliente', () => {
    test.each([
        ['ver (detalle e historial)', 'cotizacionPropiaOAdmin', { id: '7' }],
        ['cancelar', 'cancelarPropiaOAdmin', { cotizacionID: '7' }],
        ['aceptar o rechazar', 'respuestaPropia', { cotizacionID: '7' }],
    ])('%s una cotización del titular anterior: 404', async (_, guardia, params) => {
        db.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 7, DocumentoID: 555, EstadoID: 1, FechaCotizacion: ANTES });
        const { res, next } = await correr(cotizaciones[guardia], { usuario: cliente, params });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
        expect(db.Cotizacion.findByPk.mock.calls[0][1].attributes).toContain('FechaCotizacion');
    });

    test('una cotización propia posterior sí se ve', async () => {
        db.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 8, DocumentoID: 555, FechaCotizacion: DESPUES });
        const { next } = await correr(cotizaciones.cotizacionPropiaOAdmin, { usuario: cliente, params: { id: '8' } });
        expect(next).toHaveBeenCalled();
    });

    test('sin HistorialDesde (cuenta normal) todo sigue visible', async () => {
        db.Usuario.findByPk.mockResolvedValue({ HistorialDesde: null });
        db.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 8, DocumentoID: 555, FechaCotizacion: ANTES });
        const { next } = await correr(cotizaciones.cotizacionPropiaOAdmin, { usuario: cliente, params: { id: '8' } });
        expect(next).toHaveBeenCalled();
    });
});

describe('cuentaActiva (crear pedidos y cotizaciones)', () => {
    test('una cuenta suprimida no crea pedidos ni cotizaciones (token emitido antes del commit de la supresión)', async () => {
        db.Usuario.findByPk.mockResolvedValue({ SuprimidoEn: new Date() });
        const { res, next } = await correr(cuentaActiva, { usuario: cliente });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('cuenta activa: sigue', async () => {
        db.Usuario.findByPk.mockResolvedValue({ SuprimidoEn: null });
        const { next } = await correr(cuentaActiva, { usuario: cliente });
        expect(next).toHaveBeenCalled();
    });

    test('el administrador no se consulta', async () => {
        const { next } = await correr(cuentaActiva, { usuario: admin });
        expect(next).toHaveBeenCalled();
        expect(db.Usuario.findByPk).not.toHaveBeenCalled();
    });

    test('está en las rutas de creación del cliente', () => {
        const nombres = (router, ruta, metodo) => router.stack.find((c) => c.route?.path === ruta && c.route.methods[metodo]).route.stack.map((s) => s.name);
        expect(nombres(ventas, '/', 'post')).toContain('cuentaActiva');
        expect(nombres(cotizaciones, '/inteligente', 'post')).toContain('cuentaActiva');
        expect(nombres(cotizaciones, '/usuario/:documentoID', 'get')).toContain('historialDelCliente');
    });
});
