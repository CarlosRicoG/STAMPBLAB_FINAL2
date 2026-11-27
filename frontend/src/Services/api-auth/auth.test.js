import { describe, it, expect, vi, afterEach } from "vitest";
import { isAuthenticated, leerPayloadToken, tokenVencido } from "./auth.js";
import { guardarDesfaseToken, CLAVE_DESFASE } from "../../utils/tokenSesion.js";

// JWT de prueba (firma falsa: el cliente no la verifica)
const b64url = (obj) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (payload) => `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.firma`;
const seg = (ms) => Math.floor(ms / 1000);
const H = 3600 * 1000;

// Simula lo que pasa al iniciar sesión o renovar: se guarda el token y su desfase de reloj
const recibirToken = (t, ahoraMs = Date.now()) => { localStorage.setItem("token", t); guardarDesfaseToken(t, ahoraMs); };

afterEach(() => { vi.useRealTimers(); });

describe("isAuthenticated", () => {
    it("sin token no hay sesión", () => {
        expect(isAuthenticated()).toBe(false);
    });

    it("token vigente: hay sesión", () => {
        const ahora = Date.now();
        recibirToken(jwt({ id: 1, iat: seg(ahora), exp: seg(ahora + 2 * H) }));
        expect(isAuthenticated()).toBe(true);
    });

    it("reloj del equipo adelantado 5 h con un token recién emitido: sigue autenticado", () => {
        const servidor = Date.UTC(2026, 10, 27, 12, 0, 0);
        const equipo = servidor + 5 * H;
        vi.useFakeTimers(); vi.setSystemTime(equipo);
        recibirToken(jwt({ id: 1, iat: seg(servidor), exp: seg(servidor + 2 * H) }), equipo);
        expect(isAuthenticated()).toBe(true);
        vi.setSystemTime(equipo + 1 * H); // pasa 1 h real: aún dentro de las 2 h del token
        expect(isAuthenticated()).toBe(true);
    });

    it("token realmente vencido (según el reloj del servidor): no hay sesión", () => {
        const servidor = Date.UTC(2026, 10, 27, 12, 0, 0);
        const equipo = servidor + 5 * H;
        vi.useFakeTimers(); vi.setSystemTime(equipo);
        recibirToken(jwt({ id: 1, iat: seg(servidor), exp: seg(servidor + 2 * H) }), equipo);
        vi.setSystemTime(equipo + 2 * H + 1000);
        expect(isAuthenticated()).toBe(false);
    });

    it("token sin iat: no se declara vencido por reloj (lo decide el servidor)", () => {
        recibirToken(jwt({ id: 1, exp: seg(Date.now() - H) }));
        expect(localStorage.getItem(CLAVE_DESFASE)).toBeNull();
        expect(isAuthenticated()).toBe(true);
    });

    it("token guardado sin desfase (sesión anterior a este cambio): no vencido por reloj", () => {
        localStorage.setItem("token", jwt({ id: 1, iat: seg(Date.now() - 3 * H), exp: seg(Date.now() - H) }));
        expect(isAuthenticated()).toBe(true);
    });

    it("token corrupto: no hay sesión y no lanza error", () => {
        localStorage.setItem("token", "esto-no-es-un-jwt");
        expect(isAuthenticated()).toBe(false);
        localStorage.setItem("token", "a.%%%.c");
        expect(isAuthenticated()).toBe(false);
    });

    it("token renovado por el servidor (X-Token-Renovado) se toma de inmediato", () => {
        const ahora = Date.now();
        recibirToken(jwt({ id: 1, iat: seg(ahora - 3 * H), exp: seg(ahora - 10_000) }), ahora - 3 * H);
        expect(isAuthenticated()).toBe(false);
        recibirToken(jwt({ id: 1, iat: seg(ahora), exp: seg(ahora + 600_000) }), ahora); // lo que hace guardarRenovado
        expect(isAuthenticated()).toBe(true);
    });
});

describe("tokenVencido / leerPayloadToken", () => {
    it("lee payload base64url con caracteres no ASCII", () => {
        const t = jwt({ nombre: "Ñandú ü", exp: 100 });
        expect(leerPayloadToken(t)).toEqual({ nombre: "Ñandú ü", exp: 100 });
    });

    it("compara exp contra ahora - desfase", () => {
        const t = jwt({ exp: 1000 });
        expect(tokenVencido(t, 999_000, 0)).toBe(false);
        expect(tokenVencido(t, 1_000_000, 0)).toBe(true);
        expect(tokenVencido(t, 1_000_000 + 5 * H, 5 * H)).toBe(true);
        expect(tokenVencido(t, 999_000 + 5 * H, 5 * H)).toBe(false);
    });

    it("sin exp o sin desfase no se considera vencido", () => {
        expect(tokenVencido(jwt({ id: 1 }), Date.now(), 0)).toBe(false);
        expect(tokenVencido(jwt({ exp: 1 }), Date.now(), null)).toBe(false);
    });
});
