import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("../../../Services/api-carrito/carrito", () => ({
    getCarritoServidor: vi.fn(),
    guardarCarritoServidor: vi.fn(() => Promise.resolve(true)),
}));
import { getCarritoServidor, guardarCarritoServidor } from "../../../Services/api-carrito/carrito";
import useCarrito from "./useCarrito";
import { CART_KEY } from "./catalogoComun";

const camiseta = {
    ProductoID: 1, Nombre: "Camiseta", ImagenProducto: "c.png", PrecioBase: 20000,
    inventario: [
        { Stock: 3, Estado: true, color: { Nombre: "Negro" }, talla: { Nombre: "M" } },
        { Stock: 0, Estado: true, color: { Nombre: "Blanco" }, talla: { Nombre: "S" } },
    ],
};
const item = (extra = {}) => ({ producto: camiseta, color: "Negro", talla: "M", cantidad: 1, precio: 20000, ...extra });
const guardado = () => JSON.parse(localStorage.getItem(CART_KEY) || "null");

beforeEach(() => {
    getCarritoServidor.mockReset();
    guardarCarritoServidor.mockClear();
});
afterEach(() => { vi.useRealTimers(); });

describe("useCarrito sin sesión", () => {
    it("arranca con el carrito guardado en el navegador y no llama al servidor", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...item(), nombre: "Camiseta", cantidad: 2 }]));
        const { result } = renderHook(() => useCarrito());
        expect(result.current.cart).toHaveLength(1);
        expect(result.current.totalUnidades).toBe(2);
        expect(getCarritoServidor).not.toHaveBeenCalled();
    });

    it("un carrito guardado corrupto arranca vacío", () => {
        localStorage.setItem(CART_KEY, "{no es json");
        const { result } = renderHook(() => useCarrito());
        expect(result.current.cart).toEqual([]);
    });

    it("agregar suma al ítem existente, guarda en el navegador y no pasa del stock del catálogo", () => {
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [camiseta], tallas: [] } });
        let r;
        act(() => { r = result.current.agregar(item({ cantidad: 2 })); });
        expect(r.limitado).toBe(false);
        expect(result.current.cart[0]).toMatchObject({ nombre: "Camiseta", imagen: "c.png", color: "Negro", talla: "M", cantidad: 2 });
        expect(guardado()[0].cantidad).toBe(2);
        act(() => { r = result.current.agregar(item({ cantidad: 5 })); });
        expect(r).toMatchObject({ limitado: true, stock: 3, cantidad: 3 });
        expect(result.current.cart).toHaveLength(1);
        expect(result.current.totalUnidades).toBe(3);
    });

    it("agregar una variante sin stock no cambia el carrito", () => {
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [camiseta], tallas: [] } });
        const antes = result.current.cart;
        let r;
        act(() => { r = result.current.agregar(item({ color: "Blanco", talla: "S" })); });
        expect(r.limitado).toBe(true);
        expect(r.carrito).toBe(antes);
        expect(result.current.cart).toBe(antes);
    });

    it("editar (editIdx) reemplaza la variante y la cantidad del ítem", () => {
        const { result } = renderHook(() => useCarrito());
        act(() => { result.current.agregar(item()); });
        act(() => { result.current.agregar(item({ cantidad: 3 }), 0); });
        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].cantidad).toBe(3);
    });

    it("cambiarCantidad cambia la cantidad y por debajo de 1 quita el ítem", () => {
        const { result } = renderHook(() => useCarrito());
        act(() => { result.current.agregar(item()); });
        act(() => { result.current.cambiarCantidad(0, 2); });
        expect(result.current.cart[0].cantidad).toBe(2);
        expect(guardado()[0].cantidad).toBe(2);
        act(() => { result.current.cambiarCantidad(0, 0); });
        expect(result.current.cart).toEqual([]);
        expect(guardado()).toEqual([]);
    });

    it("quitar elimina por posición", () => {
        const { result } = renderHook(() => useCarrito());
        act(() => { result.current.agregar(item()); });
        act(() => { result.current.agregar({ ...item(), producto: { ...camiseta, ProductoID: 2, Nombre: "Buso" } }); });
        act(() => { result.current.quitar(0); });
        expect(result.current.cart.map((i) => i.nombre)).toEqual(["Buso"]);
    });

    it("vaciar deja el carrito vacío (y el guardado en [])", () => {
        const { result } = renderHook(() => useCarrito());
        act(() => { result.current.agregar(item()); });
        act(() => { result.current.vaciar(); });
        expect(result.current.cart).toEqual([]);
        expect(guardado()).toEqual([]);
    });

    it("recargarLocal vuelve a leer lo guardado (Volver a pedir)", () => {
        const { result } = renderHook(() => useCarrito());
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...item(), nombre: "Camiseta", cantidad: 4 }]));
        act(() => { result.current.recargarLocal(); });
        expect(result.current.totalUnidades).toBe(4);
    });

    it("con el catálogo cargado pone al día el precio guardado", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...item(), nombre: "Camiseta", precio: 1000 }]));
        const tallas = [{ Nombre: "M", Precio: 2000 }];
        const { result, rerender } = renderHook((p) => useCarrito(p), { initialProps: { productos: [], tallas: [] } });
        expect(result.current.cart[0].precio).toBe(1000);
        rerender({ productos: [camiseta], tallas });
        expect(result.current.cart[0].precio).toBe(22000);
        expect(guardado()[0].precio).toBe(22000);
    });
});

describe("useCarrito: editar usa el stock del catálogo actual, no la copia guardada", () => {
    // Ítem tal como llega del carrito del servidor: producto sin inventario
    const delServidor = { producto: { ProductoID: 1, Nombre: "Camiseta", PrecioBase: 20000 }, nombre: "Camiseta", color: "Negro", talla: "M", cantidad: 1, precio: 20000 };
    const conStock = (n) => ({ ...camiseta, inventario: [{ Stock: n, Estado: true, color: { Nombre: "Negro" }, talla: { Nombre: "M" } }] });
    const editar = (result, cantidad) => { let r; act(() => { r = result.current.agregar({ ...item({ cantidad }), producto: result.current.cart[0].producto }, 0); }); return r; };

    it("un ítem del servidor sin inventario se puede editar (sin catálogo: no se limita)", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([delServidor]));
        const { result } = renderHook(() => useCarrito());
        const r = editar(result, 4);
        expect(r.limitado).toBe(false);
        expect(result.current.cart[0].cantidad).toBe(4);
    });

    it("un ítem del servidor sin inventario usa el stock del catálogo cargado", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([delServidor]));
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [conStock(10)], tallas: [] } });
        const r = editar(result, 6);
        expect(r).toMatchObject({ limitado: false, cantidad: 6 });
    });

    it("si el stock del catálogo subió frente a la copia guardada, permite más", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...delServidor, producto: conStock(2) }]));
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [conStock(8)], tallas: [] } });
        const r = editar(result, 7);
        expect(r).toMatchObject({ limitado: false, cantidad: 7 });
        expect(result.current.cart[0].cantidad).toBe(7);
    });

    it("si el stock del catálogo bajó, limita a lo que hay ahora", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...delServidor, producto: conStock(9) }]));
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [conStock(2)], tallas: [] } });
        const r = editar(result, 5);
        expect(r).toMatchObject({ limitado: true, stock: 2, cantidad: 2 });
        expect(result.current.cart[0].cantidad).toBe(2);
    });

    it("si el producto no está en el catálogo cargado, no se limita", () => {
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...delServidor, producto: conStock(1) }]));
        const { result } = renderHook((p) => useCarrito(p), { initialProps: { productos: [{ ...camiseta, ProductoID: 99 }], tallas: [] } });
        const r = editar(result, 3);
        expect(r).toMatchObject({ limitado: false, cantidad: 3 });
    });
});

describe("useCarrito con sesión", () => {
    beforeEach(() => { localStorage.setItem("token", "t"); });

    it("fusiona con el carrito del servidor y luego sube los cambios con ~800 ms de espera", async () => {
        const remoto = [{ ...item(), producto: { ...camiseta, ProductoID: 9 }, nombre: "Gorra", cantidad: 1 }];
        getCarritoServidor.mockResolvedValue(remoto);
        localStorage.setItem(CART_KEY, JSON.stringify([{ ...item(), nombre: "Camiseta" }]));
        const { result } = renderHook(() => useCarrito());
        await waitFor(() => expect(result.current.cart).toHaveLength(2));
        // la fusión cambió el carrito: se sube tras la espera
        await waitFor(() => expect(guardarCarritoServidor).toHaveBeenCalledTimes(1), { timeout: 2000 });
        expect(guardarCarritoServidor.mock.calls[0][0]).toHaveLength(2);

        vi.useFakeTimers();
        act(() => { result.current.cambiarCantidad(0, 2); });
        act(() => { result.current.cambiarCantidad(0, 3); });
        act(() => { vi.advanceTimersByTime(799); });
        expect(guardarCarritoServidor).toHaveBeenCalledTimes(1);
        act(() => { vi.advanceTimersByTime(1); });
        expect(guardarCarritoServidor).toHaveBeenCalledTimes(2);
        expect(guardarCarritoServidor.mock.calls[1][0][0].cantidad).toBe(3);
    });

    it("si el servidor no responde (null) sigue el carrito local y nunca lo sube", async () => {
        getCarritoServidor.mockResolvedValue(null);
        const { result } = renderHook(() => useCarrito());
        await waitFor(() => expect(getCarritoServidor).toHaveBeenCalled());
        vi.useFakeTimers();
        act(() => { result.current.agregar(item()); });
        act(() => { vi.advanceTimersByTime(2000); });
        expect(result.current.cart).toHaveLength(1);
        expect(guardarCarritoServidor).not.toHaveBeenCalled();
    });
});
