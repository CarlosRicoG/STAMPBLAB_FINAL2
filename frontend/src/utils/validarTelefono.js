// Misma regla que el backend (backend/middleware/validar.js, pieza `telefono`): opcional; si se escribe,
// de 7 a 20 caracteres entre dígitos, +, -, espacios y paréntesis (se valida ya recortado).
export const TELEFONO_REGEX = /^[0-9+\-\s()]{7,20}$/;
export const MENSAJE_TELEFONO = "El teléfono debe tener entre 7 y 20 caracteres y solo puede incluir números, espacios, +, - y paréntesis.";

export function telefonoValido(valor) {
    const t = String(valor ?? "").trim();
    return t === "" || TELEFONO_REGEX.test(t);
}
