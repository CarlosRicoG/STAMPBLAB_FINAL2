import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useVariantesProducto from "./useVariantesProducto";

// Promesa que se resuelve/rechaza a mano para simular respuestas lentas y desordenadas
const diferida = () => { let resolve, reject; const p = new Promise((a, b) => { resolve = a; reject = b; }); return { p, resolve, reject }; };

describe("useVariantesProducto", () => {
    it("sin producto no pide nada, deja [] y avisa alLimpiar", () => {
        const cargar = vi.fn(); const alLimpiar = vi.fn();
        const { result } = renderHook(() => useVariantesProducto(null, { cargar, alLimpiar }));
        expect(result.current[0]).toEqual([]);
        expect(cargar).not.toHaveBeenCalled();
        expect(alLimpiar).toHaveBeenCalledTimes(1);
    });

    it("carga, filtra y avisa alCargar; pasa { signal } a la petición", async () => {
        const cargar = vi.fn().mockResolvedValue([{ ID: 1, Stock: 2, Estado: true }, { ID: 2, Stock: 0, Estado: true }]);
        const alCargar = vi.fn();
        const { result } = renderHook(() => useVariantesProducto(7, { cargar, filtrar: (v) => v.Stock > 0, alCargar }));
        await waitFor(() => expect(result.current[0]).toHaveLength(1));
        expect(cargar).toHaveBeenCalledWith(7, expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expect(alCargar).toHaveBeenCalledWith([{ ID: 1, Stock: 2, Estado: true }]);
    });

    it("una respuesta tardía del producto anterior no pisa las del nuevo (y la anterior se cancela)", async () => {
        const lenta = diferida(); const rapida = diferida();
        const señales = [];
        const cargar = vi.fn((id, o) => { señales.push(o.signal); return id === 1 ? lenta.p : rapida.p; });
        const alCargar = vi.fn();
        const { result, rerender } = renderHook(({ id }) => useVariantesProducto(id, { cargar, alCargar }), { initialProps: { id: 1 } });
        rerender({ id: 2 });
        expect(señales[0].aborted).toBe(true);
        await act(async () => { rapida.resolve([{ ID: "del 2" }]); });
        await act(async () => { lenta.resolve([{ ID: "del 1" }]); });
        expect(result.current[0]).toEqual([{ ID: "del 2" }]);
        expect(alCargar).toHaveBeenCalledTimes(1);
    });

    it("si falla la carga vigente deja [] y avisa alFallar; si falla una vieja, no", async () => {
        const vieja = diferida();
        const alFallar = vi.fn();
        const cargar = vi.fn((id) => (id === 1 ? vieja.p : Promise.reject(new Error("500"))));
        const { result, rerender } = renderHook(({ id }) => useVariantesProducto(id, { cargar, alFallar }), { initialProps: { id: 1 } });
        rerender({ id: 2 });
        await waitFor(() => expect(alFallar).toHaveBeenCalledTimes(1));
        await act(async () => { vieja.reject(new Error("abortada")); });
        expect(alFallar).toHaveBeenCalledTimes(1);
        expect(result.current[0]).toEqual([]);
    });

    it("inactivo (p. ej. prenda propia) limpia las variantes sin pedir", async () => {
        const cargar = vi.fn().mockResolvedValue([{ ID: 1 }]);
        const alLimpiar = vi.fn();
        const { result, rerender } = renderHook(({ activo }) => useVariantesProducto(3, { cargar, activo, alLimpiar }), { initialProps: { activo: true } });
        await waitFor(() => expect(result.current[0]).toHaveLength(1));
        rerender({ activo: false });
        expect(result.current[0]).toEqual([]);
        expect(alLimpiar).toHaveBeenCalledTimes(1);
        expect(cargar).toHaveBeenCalledTimes(1);
    });

    it("una respuesta que no es arreglo deja []", async () => {
        const cargar = vi.fn().mockResolvedValue({ raro: true });
        const alCargar = vi.fn();
        const { result } = renderHook(() => useVariantesProducto(1, { cargar, alCargar }));
        await waitFor(() => expect(cargar).toHaveBeenCalled());
        await act(async () => {});
        expect(result.current[0]).toEqual([]);
        expect(alCargar).not.toHaveBeenCalled();
    });

    it("setVariantes permite vaciarlas desde fuera", async () => {
        const cargar = vi.fn().mockResolvedValue([{ ID: 1 }]);
        const { result } = renderHook(() => useVariantesProducto(1, { cargar }));
        await waitFor(() => expect(result.current[0]).toHaveLength(1));
        act(() => { result.current[1]([]); });
        expect(result.current[0]).toEqual([]);
    });
});
