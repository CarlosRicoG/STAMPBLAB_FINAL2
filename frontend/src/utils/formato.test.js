import { describe, it, expect } from "vitest";
import { formatPrecio, fmtCOP, formatDinero } from "./formato";

// Las cadenas esperadas se calculan con toLocaleString para no depender de los datos ICU del entorno
const es = (n, o) => n.toLocaleString("es-CO", o);
const DOS = { minimumFractionDigits: 0, maximumFractionDigits: 2 };

describe("formatPrecio", () => {
    it("formatea con 0 a 2 decimales y sin signo", () => {
        expect(formatPrecio(15000)).toBe(es(15000, DOS));
        expect(formatPrecio(1234.567)).toBe(es(1234.57, DOS));
        expect(formatPrecio("2500.5")).toBe(es(2500.5, DOS));
        expect(formatPrecio(15000)).not.toMatch(/\$/);
    });
    it("valores vacíos o inválidos valen 0; usa parseFloat", () => {
        expect(formatPrecio(null)).toBe("0");
        expect(formatPrecio(undefined)).toBe("0");
        expect(formatPrecio("abc")).toBe("0");
        expect(formatPrecio("12abc")).toBe("12");
    });
});

describe("fmtCOP", () => {
    it("antepone $ al formato de formatPrecio", () => {
        expect(fmtCOP(15000)).toBe("$" + es(15000, DOS));
        expect(fmtCOP(99.999)).toBe("$" + es(100, DOS));
        expect(fmtCOP(null)).toBe("$0");
    });
});

describe("formatDinero", () => {
    it("sin opciones usa el formato por defecto de es-CO (hasta 3 decimales)", () => {
        expect(formatDinero(15000)).toBe("$" + es(15000));
        expect(formatDinero(1.2345)).toBe("$" + es(1.2345));
    });
    it("acepta opciones de toLocaleString", () => {
        expect(formatDinero(1.2345, { maximumFractionDigits: 2 })).toBe("$" + es(1.2345, { maximumFractionDigits: 2 }));
    });
    it("usa Number: lo no numérico vale 0", () => {
        expect(formatDinero("12abc")).toBe("$0");
        expect(formatDinero(undefined)).toBe("$0");
        expect(formatDinero("3000")).toBe("$" + es(3000));
    });
});
