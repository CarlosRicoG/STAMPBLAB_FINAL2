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
