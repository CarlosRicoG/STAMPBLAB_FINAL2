import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";

// El módulo se importa UNA vez (registra interceptores sobre axios y window.fetch)
let fetchSimulado;
beforeEach(async () => {
    if (!fetchSimulado) {
        fetchSimulado = vi.fn(async () => new Response("{}", { status: 200 }));
        window.fetch = fetchSimulado;
        await import("./authInterceptors.js");
    }
    fetchSimulado.mockClear();
    fetchSimulado.mockImplementation(async () => new Response("{}", { status: 200 }));
});

const cabecera = (llamada) => {
    const init = llamada[1] || {};
    return new Headers(init.headers || {}).get("Authorization");
};

describe("authInterceptors (fetch)", () => {
    it("agrega el token a las llamadas a la API", async () => {
        localStorage.setItem("token", "abc123");
        await window.fetch("http://api.test/api/ventas");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBe("Bearer abc123");
    });

    it("NO manda el token a otros sitios (no filtrar la sesión a terceros)", async () => {
        localStorage.setItem("token", "abc123");
        await window.fetch("https://otro-sitio.com/datos");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBeNull();
    });

    it("no inventa cabecera si no hay sesión", async () => {
        await window.fetch("http://api.test/api/productos");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBeNull();
    });

    it("respeta una cabecera Authorization que ya viene puesta", async () => {
        localStorage.setItem("token", "abc123");
        await window.fetch("http://api.test/api/ventas", { headers: { Authorization: "Bearer otro" } });
        expect(cabecera(fetchSimulado.mock.calls[0])).toBe("Bearer otro");
    });

    it("cierra la sesión cuando la API responde 401 (token vencido)", async () => {
        localStorage.setItem("token", "vencido");
        localStorage.setItem("usuario", "{}");
        fetchSimulado.mockImplementation(async () => new Response("{}", { status: 401 }));
        const assign = vi.fn();
        Object.defineProperty(window, "location", { value: { pathname: "/miscompras", assign }, writable: true });
        await window.fetch("http://api.test/api/ventas");
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("usuario")).toBeNull();
        expect(assign).toHaveBeenCalledWith("/login");
    });

    it("un 401 del LOGIN (credenciales malas) no borra nada ni redirige", async () => {
        localStorage.setItem("token", "valido");
        fetchSimulado.mockImplementation(async () => new Response("{}", { status: 401 }));
        const assign = vi.fn();
        Object.defineProperty(window, "location", { value: { pathname: "/login", assign }, writable: true });
        await window.fetch("http://api.test/api/login", { method: "POST" });
        expect(localStorage.getItem("token")).toBe("valido");
        expect(assign).not.toHaveBeenCalled();
    });
});

describe("authInterceptors (renovación de sesión)", () => {
    it("guarda el token nuevo cuando el servidor lo manda en X-Token-Renovado (fetch)", async () => {
        localStorage.setItem("token", "viejo");
        fetchSimulado.mockImplementation(async () => new Response("{}", { status: 200, headers: { "X-Token-Renovado": "nuevo123" } }));
        await window.fetch("http://api.test/api/ventas");
        expect(localStorage.getItem("token")).toBe("nuevo123");
    });

    it("NO revive una sesión que el usuario ya cerró (sin token local no se guarda el renovado)", async () => {
        fetchSimulado.mockImplementation(async () => new Response("{}", { status: 200, headers: { "X-Token-Renovado": "intruso" } }));
        await window.fetch("http://api.test/api/ventas");
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("guarda el token nuevo en respuestas de axios", async () => {
        localStorage.setItem("token", "viejo");
        let res = { headers: { "x-token-renovado": "nuevoAxios" } };
        for (const h of axios.interceptors.response.handlers) if (h && h.fulfilled) res = await h.fulfilled(res);
        expect(localStorage.getItem("token")).toBe("nuevoAxios");
    });
});

describe("authInterceptors (axios)", () => {
    const ejecutarInterceptor = async (config) => {
        let resultado = config;
        for (const h of axios.interceptors.request.handlers) {
            if (h && h.fulfilled) resultado = await h.fulfilled(resultado);
        }
        return resultado;
    };

    it("agrega Authorization a las peticiones a la API", async () => {
        localStorage.setItem("token", "tok");
        const cfg = await ejecutarInterceptor({ url: "http://api.test/api/compras", headers: {} });
        expect(cfg.headers.Authorization).toBe("Bearer tok");
    });

    it("no agrega Authorization a otros dominios", async () => {
        localStorage.setItem("token", "tok");
        const cfg = await ejecutarInterceptor({ url: "https://terceros.com/x", headers: {} });
        expect(cfg.headers.Authorization).toBeUndefined();
    });
});

describe("authInterceptors (solo el origen exacto de la API recibe el token)", () => {
    beforeEach(() => {
        localStorage.setItem("token", "secreto");
        Object.defineProperty(window, "location", {
            value: { href: "http://tienda.test/productos", origin: "http://tienda.test", pathname: "/productos", search: "", assign: vi.fn() },
            writable: true,
        });
    });
    const ejecutarAxios = async (config) => {
        let resultado = config;
        for (const h of axios.interceptors.request.handlers) if (h && h.fulfilled) resultado = await h.fulfilled(resultado);
        return resultado;
    };

    it("misma API (mismo origen que config/api.js): sí manda el token", async () => {
        await window.fetch("http://api.test/api/ventas");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBe("Bearer secreto");
        const cfg = await ejecutarAxios({ url: "http://api.test/api/compras", headers: {} });
        expect(cfg.headers.Authorization).toBe("Bearer secreto");
    });

    it("otro dominio cuya ruta contiene /api/: no manda el token", async () => {
        await window.fetch("https://terceros.com/api/datos");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBeNull();
        const cfg = await ejecutarAxios({ url: "https://terceros.com/api/datos", headers: {} });
        expect(cfg.headers.Authorization).toBeUndefined();
    });

    it("dominio con prefijo engañoso (api.test.evil.com, api.test@evil.com, otro puerto): no manda el token", async () => {
        for (const url of ["http://api.test.evil.com/api/ventas", "http://api.test@evil.com/api/ventas", "http://api.test:8080/api/ventas", "https://api.test/api/ventas"]) {
            fetchSimulado.mockClear();
            await window.fetch(url);
            expect(cabecera(fetchSimulado.mock.calls[0])).toBeNull();
        }
        const cfg = await ejecutarAxios({ url: "http://api.test.evil.com/api/ventas", headers: {} });
        expect(cfg.headers.Authorization).toBeUndefined();
    });

    it("ruta relativa al propio sitio: sí manda el token; una URL absoluta en axios ignora baseURL", async () => {
        await window.fetch("/api/ventas");
        expect(cabecera(fetchSimulado.mock.calls[0])).toBe("Bearer secreto");
        const relativa = await ejecutarAxios({ url: "/api/ventas", headers: {} });
        expect(relativa.headers.Authorization).toBe("Bearer secreto");
        const conBase = await ejecutarAxios({ baseURL: "http://api.test", url: "/api/ventas", headers: {} });
        expect(conBase.headers.Authorization).toBe("Bearer secreto");
        const absoluta = await ejecutarAxios({ baseURL: "http://api.test", url: "https://evil.com/api/x", headers: {} });
        expect(absoluta.headers.Authorization).toBeUndefined();
    });
});
