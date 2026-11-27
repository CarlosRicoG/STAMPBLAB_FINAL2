// Cancelación automática: con la fila bloqueada se vuelve a evaluar TODA la condición (no solo el estado)
const mockTx = { commit: jest.fn(), rollback: jest.fn().mockResolvedValue(), LOCK: { UPDATE: 'UPDATE' } };
jest.mock('../models', () => ({
    Venta: { findAll: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
    DetalleVenta: { findAll: jest.fn().mockResolvedValue([]) },
    sequelize: { transaction: jest.fn(() => Promise.resolve(mockTx)) },
}));
jest.mock('../services/inventario', () => ({ devolver: jest.fn() }));
jest.mock('../services/historial', () => ({ registrar: jest.fn() }));
jest.mock('../services/notificaciones', () => ({ pedidoVencido: jest.fn(), pedidoPorVencer: jest.fn() }));
jest.mock('../services/config', () => ({ leer: () => ({ plazoPagoHoras: 48, plazoContraentregaDias: 7 }) }));

const { Op } = require('sequelize');
const db = require('../models');
const notificaciones = require('../services/notificaciones');
const { cancelarPedidosSinPago, sigueVencido, avisarPedidosPorVencer } = require('../services/vencimientos');
const plantillas = require('../services/plantillas');
const { ESTADO_VENTA } = require('../config/estados');

const AHORA = new Date('2026-11-18T12:00:00Z');
const hace = (h) => new Date(AHORA.getTime() - h * 3600 * 1000);
const plazos = { plazoPagoHoras: 48, plazoContraentregaDias: 7 };
const pedido = (extra = {}) => ({ VentaID: 1, EstadoID: ESTADO_VENTA.PENDIENTE, MetodoPago: 'transferencia', FechaVenta: hace(72), ComprobanteTransferencia: null, ComprobanteMotivoRechazo: null, ComprobanteFechaRechazo: null, ...extra });

beforeEach(() => { jest.clearAllMocks(); db.DetalleVenta.findAll.mockResolvedValue([]); });

describe('sigueVencido (condición evaluada con la fila bloqueada)', () => {
    test('sin comprobante y pasado el plazo: vencido', () => {
        expect(sigueVencido(pedido(), AHORA, plazos)).toBe(true);
    });
    test('el cliente subió el comprobante mientras tanto: ya no vence', () => {
        expect(sigueVencido(pedido({ ComprobanteTransferencia: 'data:image/png;base64,xx' }), AHORA, plazos)).toBe(false);
    });
    test('rechazado hace poco (aunque el pedido sea viejo): no vence todavía', () => {
        expect(sigueVencido(pedido({ ComprobanteTransferencia: 'x', ComprobanteMotivoRechazo: 'borroso', ComprobanteFechaRechazo: hace(1) }), AHORA, plazos)).toBe(false);
    });
    test('rechazado hace más del plazo: vencido', () => {
        expect(sigueVencido(pedido({ ComprobanteTransferencia: 'x', ComprobanteMotivoRechazo: 'borroso', ComprobanteFechaRechazo: hace(49) }), AHORA, plazos)).toBe(true);
    });
    test('ya no está pendiente: no vence', () => {
        expect(sigueVencido(pedido({ EstadoID: ESTADO_VENTA.PAGADA }), AHORA, plazos)).toBe(false);
    });
    test('contra entrega: solo cuenta los días desde el pedido', () => {
        expect(sigueVencido(pedido({ MetodoPago: 'contraentrega', FechaVenta: hace(8 * 24) }), AHORA, plazos)).toBe(true);
        expect(sigueVencido(pedido({ MetodoPago: 'contraentrega', FechaVenta: hace(6 * 24) }), AHORA, plazos)).toBe(false);
    });
});

describe('cancelarPedidosSinPago', () => {
    test('si con la fila bloqueada ya hay comprobante nuevo, no cancela', async () => {
        db.Venta.findAll.mockResolvedValue([{ VentaID: 1, MetodoPago: 'transferencia' }]);
        const venta = { ...pedido({ ComprobanteTransferencia: 'data:image/png;base64,xx' }), update: jest.fn() };
        db.Venta.findByPk.mockResolvedValue(venta);
        expect(await cancelarPedidosSinPago(AHORA)).toBe(0);
        expect(venta.update).not.toHaveBeenCalled();
        expect(mockTx.rollback).toHaveBeenCalled();
    });

    test('si sigue vencido, cancela', async () => {
        db.Venta.findAll.mockResolvedValue([{ VentaID: 1, MetodoPago: 'transferencia' }]);
        const venta = { ...pedido(), update: jest.fn() };
        db.Venta.findByPk.mockResolvedValue(venta);
        expect(await cancelarPedidosSinPago(AHORA)).toBe(1);
        expect(venta.update).toHaveBeenCalledWith({ EstadoID: ESTADO_VENTA.CANCELADA }, { transaction: mockTx });
    });
});

describe('aviso previo de un comprobante rechazado', () => {
    test('las horas restantes se cuentan desde el rechazo', async () => {
        db.Venta.findAll.mockImplementation(async ({ where }) => where[Op.or][0].MetodoPago === 'contraentrega' ? [] :
            [{ VentaID: 1, MetodoPago: 'transferencia', FechaVenta: hace(100), ComprobanteMotivoRechazo: 'borroso', ComprobanteFechaRechazo: hace(30) }]);
        db.Venta.update.mockResolvedValue([1]);
        await avisarPedidosPorVencer(AHORA);
        expect(notificaciones.pedidoPorVencer).toHaveBeenCalledWith(1, 18, false);
    });
});

describe('correo de comprobante rechazado', () => {
    test('dice hasta cuándo sigue reservado el pedido', () => {
        const { html } = plantillas.comprobanteRechazado({ usuario: { Nombre: 'Ana' }, venta: { VentaID: 9 }, motivo: 'borroso', hasta: new Date('2026-11-20T17:00:00Z') });
        expect(html).toMatch(/reservado hasta/);
        // 17:00 UTC = 12:00 en Colombia (ZONA_HORARIA por defecto -05:00)
        expect(html).toContain('reservado hasta el 20 de noviembre de 2026 a las 12:00 p.');
    });
    test('sin fecha límite mantiene el texto anterior', () => {
        const { html } = plantillas.comprobanteRechazado({ usuario: { Nombre: 'Ana' }, venta: { VentaID: 9 }, motivo: 'borroso' });
        expect(html).toMatch(/sigue reservado mientras tanto/);
    });
});
