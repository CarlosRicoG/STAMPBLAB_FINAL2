/**
 * IDs de la tabla `estados` (espejo de backend/config/estados.js: mantenerlos iguales).
 */
export const ESTADO_COTIZACION = Object.freeze({
    PENDIENTE: 1,
    APROBADA: 2,
    RECHAZADA: 3,
    CANCELADA: 4,
    PROCESADA: 5, // ya convertida en venta
    EN_REVISION: 6,
    VENCIDA: 7,
});

export const ESTADO_VENTA = Object.freeze({
    PENDIENTE: 8,
    PAGADA: 9,
    EN_PRODUCCION: 10,
    ENTREGADA: 11,
    CANCELADA: 12,
    LISTA_ENTREGA: 13,
});

/** Una venta "activa" es la que todavía no terminó (ni entregada ni cancelada). */
export const ventaEstaActiva = (estadoID) =>
    estadoID !== ESTADO_VENTA.ENTREGADA && estadoID !== ESTADO_VENTA.CANCELADA;
