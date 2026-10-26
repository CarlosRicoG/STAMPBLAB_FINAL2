/* Utilidades puras del flujo de pedidos y contacto (sin dependencias de React). */

/* Máquina de estados de un pedido (la valida el backend): 8→9|12, 9→10|12, 10→13|11|12, 13→11|12 */
export const TRANSICIONES_VENTA = Object.freeze({
    8: [9, 12],
    9: [10, 12],
    10: [13, 11, 12],
    13: [11, 12],
    11: [],
    12: [],
});

export const siguientesEstados = (estadoID) => TRANSICIONES_VENTA[estadoID] || [];

/* Siguiente paso "natural" del pedido para el botón rápido de la bandeja Hoy */
export const SIGUIENTE_NORMAL = Object.freeze({ 9: 10, 10: 13, 13: 11 });

export const NOMBRE_ESTADO_VENTA = Object.freeze({
    8: "Pendiente", 9: "Pagada", 10: "En Producción", 13: "Lista para Entrega", 11: "Entregada", 12: "Cancelada",
});

/* Estados que piden una fecha estimada de entrega */
export const ESTADOS_CON_FECHA = Object.freeze([10, 13]);

/* Fecha de hoy como YYYY-MM-DD en hora local (para el atributo min de <input type="date">) */
export const hoyISO = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* Enlace de WhatsApp: agrega el prefijo 57 si el teléfono tiene 10 dígitos. Devuelve null si no es utilizable. */
export const whatsappUrl = (telefono, texto = "") => {
    let digitos = String(telefono || "").replace(/\D/g, "");
    if (digitos.length === 10) digitos = `57${digitos}`;
    if (digitos.length < 11 || digitos.length > 15) return null;
    return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
};

/* Fecha límite de pago = FechaVenta + plazoPagoHoras. Devuelve Date o null. */
export const fechaLimitePago = (fechaVenta, plazoHoras) => {
    const h = Number(plazoHoras);
    const d = fechaVenta ? new Date(fechaVenta) : null;
    if (!d || isNaN(d) || !h || h <= 0) return null;
    return new Date(d.getTime() + h * 3600 * 1000);
};
