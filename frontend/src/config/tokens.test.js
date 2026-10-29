import { describe, test, expect } from "vitest";
import { C } from "./tokens";

describe("tokens de diseño", () => {
    test("conservan los valores de la interfaz (si cambias uno, cámbialo aquí a propósito)", () => {
        expect(C.navy).toBe("#1a2540");
        expect(C.accent).toBe("#4f8ef7");
        expect(C.success).toBe("#16a34a");
        expect(C.warning).toBe("#d97706");
        expect(C.danger).toBe("#dc2626");
        expect(C.muted).toBe("#64748b");
        expect(C.border).toBe("#e2e8f0");
        expect(C.navyGrad).toBe("linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)");
    });

    test("no se pueden modificar en tiempo de ejecución", () => {
        expect(Object.isFrozen(C)).toBe(true);
    });

    test("todos los colores sólidos son hexadecimales válidos", () => {
        for (const [clave, valor] of Object.entries(C)) {
            if (valor.startsWith("linear-gradient")) continue;
            expect(valor, clave).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });
});
