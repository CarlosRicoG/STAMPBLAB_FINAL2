/**
 * Formato de dinero en pesos colombianos (es-CO). Cada variante reproduce exactamente un formato que ya
 * existía en la app; no se unifican porque redondean distinto y cambiaría lo que ve el usuario.
 */

/** Número sin signo: 0 a 2 decimales; usa parseFloat ("12abc" -> 12). Ej.: 15000.5 -> "15.000,5" */
export const formatPrecio = (valor) =>
    (parseFloat(valor) || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Igual que formatPrecio pero con "$" delante. Ej.: 15000 -> "$15.000" */
export const fmtCOP = (valor) => "$" + formatPrecio(valor);

/**
 * "$" + Number(n) con las opciones de toLocaleString que se pasen (sin opciones: el formato por defecto
 * de es-CO, hasta 3 decimales). Usa Number ("12abc" -> 0). Ej.: formatDinero(15000) -> "$15.000"
 */
export const formatDinero = (n, opciones) => "$" + (Number(n) || 0).toLocaleString("es-CO", opciones);
