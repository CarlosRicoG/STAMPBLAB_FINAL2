import { describe, it, expect, vi, afterEach } from "vitest";
import { pedirLista, cargarListas } from "./pedirLista";

const fetchOriginal = globalThis.fetch;
afterEach(() => { globalThis.fetch = fetchOriginal; });
const responder = (cuerpo, status = 200) => { globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(cuerpo), { status })); };

describe("pedirLista", () => {
    it("acepta { datos } o el arreglo directo", async () => {
        responder({ datos: [1, 2] });
        expect(await pedirLista("http://api.test/api/x")).toEqual([1, 2]);
        responder([3]);
        expect(await pedirLista("http://api.test/api/x")).toEqual([3]);
    });

    it("con error del servidor lanza en vez de devolver el cuerpo del error", async () => {
        responder({ error: "fallo" }, 500);
        await expect(pedirLista("http://api.test/api/insumos")).rejects.toThrow("500");
    });

    it("una respuesta sin arreglo da lista vacía (no revienta un .filter)", async () => {
        responder({ mensaje: "nada" });
        expect(await pedirLista("http://api.test/api/x")).toEqual([]);
    });
});

describe("cargarListas", () => {
    it("las que fallan quedan vacías y se informan; las demás llegan", async () => {
        const { listas, fallidas } = await cargarListas({
            productos: async () => [{ id: 1 }],
            telas: async () => { throw new Error("Error 500"); },
        });
        expect(listas).toEqual({ productos: [{ id: 1 }], telas: [] });
        expect(fallidas).toEqual(["telas"]);
    });
});
