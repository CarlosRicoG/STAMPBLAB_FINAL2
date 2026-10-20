/**
 * IDs de la tabla `estados`. FUENTE ÚNICA: el backend y `scripts/seed-base.js` leen de aquí
 * (el frontend tiene su espejo en frontend/src/config/estados.js; mantenerlos iguales).
 * Si cambias un ID, vuelve a correr `node scripts/seed-base.js`.
 */
const ESTADO_COTIZACION = Object.freeze({
    PENDIENTE: 1,
    APROBADA: 2,
    RECHAZADA: 3,
    CANCELADA: 4,
    PROCESADA: 5, // ya convertida en venta
    EN_REVISION: 6,
    VENCIDA: 7,
});

const ESTADO_VENTA = Object.freeze({
    PENDIENTE: 8,
    PAGADA: 9,
    EN_PRODUCCION: 10,
    ENTREGADA: 11,
    CANCELADA: 12,
    LISTA_ENTREGA: 13,
});

/**
 * Máquina de estados de un pedido: solo se avanza por el camino normal (o se cancela antes de entregar).
 * Entregada y Cancelada son finales.
 */
const TRANSICIONES_VENTA = Object.freeze({
    [ESTADO_VENTA.PENDIENTE]: [ESTADO_VENTA.PAGADA, ESTADO_VENTA.CANCELADA],
    [ESTADO_VENTA.PAGADA]: [ESTADO_VENTA.EN_PRODUCCION, ESTADO_VENTA.CANCELADA],
    [ESTADO_VENTA.EN_PRODUCCION]: [ESTADO_VENTA.LISTA_ENTREGA, ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA],
    [ESTADO_VENTA.LISTA_ENTREGA]: [ESTADO_VENTA.ENTREGADA, ESTADO_VENTA.CANCELADA],
    [ESTADO_VENTA.ENTREGADA]: [],
    [ESTADO_VENTA.CANCELADA]: [],
});

/** Datos que carga seed-base.js */
const ESTADOS_SEED = [
    { EstadoID: ESTADO_COTIZACION.PENDIENTE, Nombre: 'Pendiente', Tipo: 'cotizacion', Descripcion: 'Cotizacion recibida, esperando revision' },
    { EstadoID: ESTADO_COTIZACION.APROBADA, Nombre: 'Aprobada', Tipo: 'cotizacion', Descripcion: 'Cotizacion aprobada' },
    { EstadoID: ESTADO_COTIZACION.RECHAZADA, Nombre: 'Rechazada', Tipo: 'cotizacion', Descripcion: 'Cotizacion rechazada' },
    { EstadoID: ESTADO_COTIZACION.CANCELADA, Nombre: 'Cancelada', Tipo: 'cotizacion', Descripcion: 'Cotizacion cancelada' },
    { EstadoID: ESTADO_COTIZACION.PROCESADA, Nombre: 'Procesada', Tipo: 'cotizacion', Descripcion: 'Cotizacion convertida a venta' },
    { EstadoID: ESTADO_COTIZACION.EN_REVISION, Nombre: 'En revision', Tipo: 'cotizacion', Descripcion: 'Cotizacion en revision' },
    { EstadoID: ESTADO_COTIZACION.VENCIDA, Nombre: 'Vencida', Tipo: 'cotizacion', Descripcion: 'Cotizacion vencida' },
    { EstadoID: ESTADO_VENTA.PENDIENTE, Nombre: 'Pendiente', Tipo: 'venta', Descripcion: 'Venta registrada, pendiente de procesar' },
    { EstadoID: ESTADO_VENTA.PAGADA, Nombre: 'Pagada', Tipo: 'venta', Descripcion: 'Pago confirmado' },
    { EstadoID: ESTADO_VENTA.EN_PRODUCCION, Nombre: 'En Producción', Tipo: 'venta', Descripcion: 'Pedido en proceso de producción' },
    { EstadoID: ESTADO_VENTA.ENTREGADA, Nombre: 'Entregada', Tipo: 'venta', Descripcion: 'Pedido entregado al cliente' },
    { EstadoID: ESTADO_VENTA.CANCELADA, Nombre: 'Cancelada', Tipo: 'venta', Descripcion: 'Venta cancelada (devuelve stock si estaba pendiente)' },
    { EstadoID: ESTADO_VENTA.LISTA_ENTREGA, Nombre: 'Lista para Entrega', Tipo: 'venta', Descripcion: 'Pedido listo para entregar' },
];

module.exports = { ESTADO_COTIZACION, ESTADO_VENTA, TRANSICIONES_VENTA, ESTADOS_SEED };
