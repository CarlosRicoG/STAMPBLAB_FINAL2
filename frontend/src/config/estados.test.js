import { describe, it, expect } from "vitest";
import { ESTADO_COTIZACION, ESTADO_VENTA, ventaEstaActiva } from "./estados";

describe("estados (IDs fijos que usa el backend)", () => {
    it("coinciden con la tabla estados: cotización 1-7, venta 8-13", () => {
        expect(ESTADO_COTIZACION).toMatchObject({ PENDIENTE: 1, APROBADA: 2, RECHAZADA: 3, CANCELADA: 4, PROCESADA: 5 });
        expect(ESTADO_VENTA).toMatchObject({ PENDIENTE: 8, PAGADA: 9, EN_PRODUCCION: 10, ENTREGADA: 11, CANCELADA: 12, LISTA_ENTREGA: 13 });
    });

    it("no hay IDs repetidos entre cotizaciones y ventas", () => {
        const ids = [...Object.values(ESTADO_COTIZACION), ...Object.values(ESTADO_VENTA)];
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("las constantes están congeladas (no se pueden pisar por error)", () => {
        expect(Object.isFrozen(ESTADO_VENTA)).toBe(true);
        expect(Object.isFrozen(ESTADO_COTIZACION)).toBe(true);
    });
});

describe("ventaEstaActiva", () => {
    it("una venta pendiente, pagada, en producción o lista para entrega está activa", () => {
        for (const e of [ESTADO_VENTA.PENDIENTE, ESTADO_VENTA.PAGADA, ESTADO_VENTA.EN_PRODUCCION, ESTADO_VENTA.LISTA_ENTREGA]) {
            expect(ventaEstaActiva(e)).toBe(true);
        }
    });

    it("entregada y cancelada NO están activas (no deben impedir borrar al cliente)", () => {
        expect(ventaEstaActiva(ESTADO_VENTA.ENTREGADA)).toBe(false);
        expect(ventaEstaActiva(ESTADO_VENTA.CANCELADA)).toBe(false);
    });
});
