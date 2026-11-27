/**
 * Token de sesión en el navegador: lectura del JWT, desfase de reloj y limpieza local.
 * Sin dependencias (lo usan auth.js, authInterceptors.js y ProtectedRoute).
 *
 * El vencimiento se juzga con el reloj del SERVIDOR: al recibir un token se guarda el desfase
 * `Date.now() - iat*1000` (cuánto se adelanta o atrasa el reloj del equipo) y luego se compara `exp`
 * con `Date.now() - desfase`. Sin desfase conocido (token sin iat, o guardado antes de este cambio) no se
 * declara vencido por reloj: lo decide el servidor con su 401.
 */
export const CLAVE_DESFASE = "token_desfase_ms";

/** Payload de un JWT (base64url, UTF-8) sin verificar la firma, o null si no es un JWT legible. */
export function leerPayloadToken(token) {
    try {
        const partes = String(token || "").split(".");
        if (partes.length !== 3 || !partes[1]) return null;
        let b64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        return payload && typeof payload === "object" ? payload : null;
    } catch {
        return null;
    }
}

/** Guarda el desfase de reloj del token recién recibido (o lo borra si el token no trae iat). */
export function guardarDesfaseToken(token, ahoraMs = Date.now()) {
    try {
        const iat = Number(leerPayloadToken(token)?.iat);
        if (Number.isFinite(iat)) localStorage.setItem(CLAVE_DESFASE, String(ahoraMs - iat * 1000));
        else localStorage.removeItem(CLAVE_DESFASE);
    } catch { /* sin storage */ }
}

export function leerDesfase() {
    try {
        const v = localStorage.getItem(CLAVE_DESFASE);
        if (v === null || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    } catch {
        return null;
    }
}

/**
 * true si el token es ilegible, o si su `exp` ya pasó según el reloj del servidor (ahora - desfase).
 * Sin `exp` o sin desfase conocido, no se considera vencido por reloj.
 */
export function tokenVencido(token, ahoraMs = Date.now(), desfaseMs = leerDesfase()) {
    const payload = leerPayloadToken(token);
    if (!payload) return true;
    if (payload.exp === undefined || payload.exp === null || desfaseMs === null || desfaseMs === undefined) return false;
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp)) return true;
    return exp * 1000 <= ahoraMs - desfaseMs;
}

/** Borra la sesión del navegador (no el carrito: solo se borra en el cierre de sesión voluntario). */
export function limpiarSesionLocal() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("user");
        localStorage.removeItem(CLAVE_DESFASE);
    } catch { /* sin storage */ }
}
