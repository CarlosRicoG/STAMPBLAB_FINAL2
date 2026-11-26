import { describe, it, expect, vi } from "vitest";
import { crearSubidorDisenos } from "./subidaDisenos.js";

const archivo = (nombre) => new File(["x"], nombre, { type: "image/png" });

describe("crearSubidorDisenos (reintentos de cotización)", () => {
    it("un reintento NO vuelve a subir una imagen que ya subió", async () => {
        const subir = vi.fn(async (f) => `srv-${f.name}`);
        const subirDiseno = crearSubidorDisenos(subir);
        const a = archivo("a.png");
        expect(await subirDiseno(a)).toBe("srv-a.png");
        expect(await subirDiseno(a)).toBe("srv-a.png");
        expect(subir).toHaveBeenCalledTimes(1);
    });

    it("si una falla, el reintento solo sube la que falló", async () => {
        let fallar = true;
        const subir = vi.fn(async (f) => {
            if (f.name === "b.png" && fallar) throw new Error("Límite de subidas");
            return `srv-${f.name}`;
        });
        const subirDiseno = crearSubidorDisenos(subir);
        const a = archivo("a.png"), b = archivo("b.png");
        await expect(Promise.all([subirDiseno(a), subirDiseno(b)])).rejects.toThrow("Límite de subidas");
        fallar = false;
        expect(await Promise.all([subirDiseno(a), subirDiseno(b)])).toEqual(["srv-a.png", "srv-b.png"]);
        expect(subir.mock.calls.map(([f]) => f.name)).toEqual(["a.png", "b.png", "b.png"]);
    });

    it("si el archivo del diseño cambia (otro File), sí se sube de nuevo", async () => {
        const subir = vi.fn(async (f) => `srv-${f.name}`);
        const subirDiseno = crearSubidorDisenos(subir);
        await subirDiseno(archivo("a.png"));
        await subirDiseno(archivo("a.png"));
        expect(subir).toHaveBeenCalledTimes(2);
    });

    it("sin archivo no sube nada y devuelve null", async () => {
        const subir = vi.fn();
        expect(await crearSubidorDisenos(subir)(null)).toBeNull();
        expect(subir).not.toHaveBeenCalled();
    });
});
