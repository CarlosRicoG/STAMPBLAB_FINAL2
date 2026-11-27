import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import axios from "axios";
import { descargarMisDatos, suprimirMiCuenta, nombreArchivoDatos } from "./miCuenta";

describe("servicios de derechos del titular", () => {
    let crear, revocar, clics;
    beforeEach(() => {
        vi.clearAllMocks();
        clics = [];
        crear = vi.fn(() => "blob:datos");
        revocar = vi.fn();
        URL.createObjectURL = crear;
        URL.revokeObjectURL = revocar;
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { clics.push({ href: this.href, download: this.download }); });
    });
    afterEach(() => vi.restoreAllMocks());

    it("descarga mis datos del endpoint propio y los guarda como archivo JSON", async () => {
        axios.get.mockResolvedValue({ data: { perfil: { Nombre: "Ana" }, pedidos: [] } });
        const nombre = await descargarMisDatos(new Date("2026-11-27T12:00:00"));
        expect(axios.get).toHaveBeenCalledWith("http://api.test/api/mi-cuenta/datos");
        expect(nombre).toBe("mis-datos-stamplab-2026-11-27.json");
        const blob = crear.mock.calls[0][0];
        expect(blob.type).toBe("application/json");
        expect(JSON.parse(await blob.text())).toEqual({ perfil: { Nombre: "Ana" }, pedidos: [] });
        expect(clics).toEqual([{ href: "blob:datos", download: "mis-datos-stamplab-2026-11-27.json" }]);
        expect(revocar).toHaveBeenCalledWith("blob:datos");
    });

    it("si la descarga falla, lanza el error y no crea archivo", async () => {
        axios.get.mockRejectedValue(new Error("caída"));
        await expect(descargarMisDatos()).rejects.toThrow("caída");
        expect(crear).not.toHaveBeenCalled();
    });

    it("suprimir envía la contraseña actual", async () => {
        axios.post.mockResolvedValue({ data: { estado: true } });
        await suprimirMiCuenta("Clave1234");
        expect(axios.post).toHaveBeenCalledWith("http://api.test/api/mi-cuenta/suprimir", { Contraseña: "Clave1234" });
    });

    it("nombre del archivo con la fecha local", () => {
        expect(nombreArchivoDatos(new Date(2026, 0, 5))).toBe("mis-datos-stamplab-2026-01-05.json");
    });
});
