// Precio congelado: las partes de una cotización solo se editan en Pendiente / En revisión
jest.mock('../models', () => ({
    DetalleCotizacion: { findByPk: jest.fn() },
    CotizacionTalla: { findByPk: jest.fn() },
    Cotizacion: { findByPk: jest.fn() },
}));

const models = require('../models');
const { cotizacionEditable } = require('../middleware/cotizacionEditable');
const { ESTADO_COTIZACION } = require('../config/estados');

const mockRes = () => { const res = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res; };
const ejecutar = async (modelo, req) => { const res = mockRes(); const next = jest.fn(); await cotizacionEditable(modelo)(req, res, next); return { res, next }; };

beforeEach(() => Object.values(models).forEach((m) => m.findByPk.mockReset()));

test('las lecturas pasan sin consultar nada', async () => {
    const { next } = await ejecutar('CotizacionTalla', { method: 'GET', params: {}, body: {} });
    expect(next).toHaveBeenCalledWith();
    expect(models.Cotizacion.findByPk).not.toHaveBeenCalled();
});

test.each([ESTADO_COTIZACION.PENDIENTE, ESTADO_COTIZACION.EN_REVISION])('crear una talla en una cotización en estado %i se permite', async (estado) => {
    models.DetalleCotizacion.findByPk.mockResolvedValue({ CotizacionID: 7 });
    models.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 7, EstadoID: estado });
    const { next, res } = await ejecutar('CotizacionTalla', { method: 'POST', params: {}, body: { DetalleCotizacionID: 3 } });
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
});

test.each([ESTADO_COTIZACION.APROBADA, ESTADO_COTIZACION.PROCESADA, ESTADO_COTIZACION.RECHAZADA, ESTADO_COTIZACION.CANCELADA, ESTADO_COTIZACION.VENCIDA])(
    'modificar una talla en una cotización en estado %i da 400', async (estado) => {
        models.CotizacionTalla.findByPk.mockResolvedValue({ DetalleCotizacionID: 3 });
        models.DetalleCotizacion.findByPk.mockResolvedValue({ CotizacionID: 7 });
        models.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 7, EstadoID: estado });
        const { next, res } = await ejecutar('CotizacionTalla', { method: 'PUT', params: { id: 9 }, body: { Cantidad: 50 } });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

test('un detalle se identifica por CotizacionID al crear', async () => {
    models.Cotizacion.findByPk.mockResolvedValue({ CotizacionID: 7, EstadoID: ESTADO_COTIZACION.APROBADA });
    const { res } = await ejecutar('DetalleCotizacion', { method: 'POST', params: {}, body: { CotizacionID: 7 } });
    expect(res.status).toHaveBeenCalledWith(400);
});

test('si el registro no existe deja pasar (el controlador responde 404)', async () => {
    models.CotizacionTalla.findByPk.mockResolvedValue(null);
    const { next } = await ejecutar('CotizacionTalla', { method: 'DELETE', params: { id: 99 }, body: {} });
    expect(next).toHaveBeenCalledWith();
});
