import { describe, it, expect } from "vitest";
import { telefonoValido } from "./validarTelefono.js";

describe("telefonoValido (misma regla que el backend)", () => {
    it("acepta vacío (el teléfono es opcional) y formatos habituales", () => {
        for (const t of ["", "   ", null, undefined, "3001234567", "+57 300 123 4567", "(604) 444-55-66", "  1234567  "]) {
            expect(telefonoValido(t)).toBe(true);
        }
    });

    it("rechaza letras, símbolos y longitudes fuera de 7-20", () => {
        for (const t of ["123456", "1".repeat(21), "300abc4567", "300.123.4567", "300<1234567"]) {
            expect(telefonoValido(t)).toBe(false);
        }
    });
});
