// Regla de qué pedidos se cancelan solos por falta de pago (la consulta se arma aquí; la integración prueba el efecto real)
jest.mock('../models', () => ({}));
jest.mock('../services/inventario', () => ({}));
jest.mock('../services/historial', () => ({}));
jest.mock('../services/notificaciones', () => ({}));

const { Op } = require('sequelize');
const { pedidosConPlazo } = require('../services/vencimientos');
const { ESTADO_VENTA } = require('../config/estados');

const AHORA = new Date('2026-11-18T12:00:00Z');
const horas = (n) => new Date(AHORA.getTime() - n * 3600 * 1000);
const ramas = (donde) => donde[Op.or];

describe('Vencimiento de pedidos sin pago (pedidosConPlazo)', () => {
    test('sin plazos configurados no hay nada que cancelar', () => {
        expect(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 0, plazoContraentregaDias: 0 })).toBeNull();
    });

    test('solo mira pedidos pendientes', () => {
        const donde = pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 7 });
        expect(donde.EstadoID).toBe(ESTADO_VENTA.PENDIENTE);
    });

    test('transferencia: incluye los pedidos sin método de pago (los que nacen de una cotización)', () => {
        const [transferencia] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 0 }));
        const condiciones = transferencia.MetodoPago[Op.or];
        expect(condiciones).toContainEqual({ [Op.eq]: 'transferencia' });
        expect(condiciones).toContainEqual({ [Op.is]: null });
    });

    test('transferencia sin comprobante: vence pasadas las horas del plazo desde la fecha del pedido', () => {
        const [transferencia] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 0 }));
        const [sinComprobante] = transferencia[Op.or];
        expect(sinComprobante[Op.or]).toContainEqual({ ComprobanteTransferencia: null });
        expect(sinComprobante[Op.or]).toContainEqual({ ComprobanteTransferencia: '' });
        expect(sinComprobante.FechaVenta[Op.lt]).toEqual(horas(48));
    });

    test('transferencia con comprobante rechazado: el plazo corre desde el rechazo, no desde el pedido', () => {
        const [transferencia] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 0 }));
        const [, rechazado, rechazadoAntiguo] = transferencia[Op.or];
        expect(rechazado.ComprobanteMotivoRechazo).toEqual({ [Op.ne]: null });
        expect(rechazado.ComprobanteFechaRechazo[Op.lt]).toEqual(horas(48));
        expect(rechazado.FechaVenta).toBeUndefined();
        // Rechazos sin fecha guardada (anteriores a la columna): se sigue contando desde el pedido
        expect(rechazadoAntiguo).toEqual({ ComprobanteMotivoRechazo: { [Op.ne]: null }, ComprobanteFechaRechazo: null, FechaVenta: { [Op.lt]: horas(48) } });
    });

    test('transferencia con comprobante en revisión (sin rechazo): ninguna rama lo incluye', () => {
        const [transferencia] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 0 }));
        expect(transferencia[Op.or]).toHaveLength(3);
        expect(transferencia.FechaVenta).toBeUndefined();
    });

    test('contra entrega: el plazo es en días y no depende del comprobante', () => {
        const [contra] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 0, plazoContraentregaDias: 7 }));
        expect(contra.MetodoPago).toBe('contraentrega');
        expect(contra.FechaVenta[Op.lt]).toEqual(horas(7 * 24));
        expect(contra[Op.or]).toBeUndefined();
    });

    test('con margen (aviso previo): ventana entre "plazo - margen" y el plazo, sin cancelar aún', () => {
        const [transferencia] = ramas(pedidosConPlazo({ ahora: AHORA, plazoPagoHoras: 48, plazoContraentregaDias: 0, margenHoras: 24, desde: true }));
        const [sinComprobante, rechazado] = transferencia[Op.or];
        for (const [desde, hasta] of [sinComprobante.FechaVenta[Op.between], rechazado.ComprobanteFechaRechazo[Op.between]]) {
            expect(hasta).toEqual(horas(48 - 24));   // ya pasaron 24 h
            expect(desde).toEqual(horas(48));         // pero todavía no se cumplen las 48 h
        }
    });
});
