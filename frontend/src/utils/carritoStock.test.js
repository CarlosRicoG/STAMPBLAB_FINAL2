import { describe, it, expect } from "vitest";
import { agregarItemCarrito, stockVariante, fusionarCarritos, productoDelCatalogo } from "./clienteUtils";

const producto = {
    ProductoID: 7, Nombre: "Camiseta", ImagenProducto: "x.png",
    inventario: [
        { Stock: 3, Estado: true, color: { Nombre: "Rojo" }, talla: { Nombre: "M" } },
        { Stock: 0, Estado: true, color: { Nombre: "Azul" }, talla: { Nombre: "M" } },
    ],
};
const item = (cantidad, extra = {}) => ({ producto, color: "Rojo", talla: "M", cantidad, precio: 30000, ...extra });

describe("carrito y stock de la variante", () => {
    it("stockVariante busca por color y talla; sin stock da 0", () => {
        expect(stockVariante(producto, "Rojo", "M")).toBe(3);
        expect(stockVariante(producto, "Azul", "M")).toBe(0);
        expect(stockVariante(producto, "", "")).toBe(Infinity);
    });

    it("agrega un ítem nuevo dentro del stock", () => {
        const r = agregarItemCarrito([], item(2));
        expect(r.limitado).toBe(false);
        expect(r.carrito).toHaveLength(1);
        expect(r.carrito[0]).toMatchObject({ nombre: "Camiseta", imagen: "x.png", cantidad: 2, precio: 30000 });
    });

    it("al repetir producto+color+talla suma pero no pasa del stock", () => {
        const r1 = agregarItemCarrito([], item(2));
        const r2 = agregarItemCarrito(r1.carrito, item(2));
        expect(r2.carrito).toHaveLength(1);
        expect(r2.carrito[0].cantidad).toBe(3);
        expect(r2).toMatchObject({ limitado: true, stock: 3, cantidad: 3 });
    });

    it("si ya está en el tope, no cambia el carrito y avisa", () => {
        const lleno = agregarItemCarrito([], item(3)).carrito;
        const r = agregarItemCarrito(lleno, item(1));
        expect(r.carrito).toBe(lleno);
        expect(r.limitado).toBe(true);
    });

    it("editar respeta el stock de la variante elegida", () => {
        const base = agregarItemCarrito([], item(1)).carrito;
        const r = agregarItemCarrito(base, item(5), 0);
        expect(r.carrito[0].cantidad).toBe(3);
        expect(r.limitado).toBe(true);
    });

    it("lo agregado sin sesión sobrevive a la fusión con el carrito del servidor", () => {
        const local = agregarItemCarrito([], item(2)).carrito;
        const remoto = [{ producto: { ProductoID: 9 }, color: "", talla: "", cantidad: 1 }];
        const f = fusionarCarritos(local, remoto);
        expect(f).toHaveLength(2);
        expect(f.find((i) => i.producto.ProductoID === 7).cantidad).toBe(2);
    });
});

describe("stock con inventario no cargado y producto del catálogo", () => {
    it("stockVariante sin inventario cargado no pone tope", () => {
        expect(stockVariante({ ProductoID: 1 }, "Rojo", "M")).toBe(Infinity);
        expect(stockVariante(null, "Rojo", "M")).toBe(Infinity);
        expect(stockVariante({ inventario: [] }, "Rojo", "M")).toBe(0);
    });
    it("agregarItemCarrito calcula el tope con opciones.productoStock (null = sin tope)", () => {
        const base = [{ producto: { ProductoID: 1 }, nombre: "X", color: "Rojo", talla: "M", cantidad: 1, precio: 1 }];
        const nuevo = { producto: { ProductoID: 1 }, color: "Rojo", talla: "M", cantidad: 5, precio: 1 };
        expect(agregarItemCarrito(base, nuevo, 0, { productoStock: null })).toMatchObject({ limitado: false, cantidad: 5 });
        const catalogo = { ProductoID: 1, inventario: [{ Stock: 2, Estado: true, color: { Nombre: "Rojo" }, talla: { Nombre: "M" } }] };
        expect(agregarItemCarrito(base, nuevo, 0, { productoStock: catalogo })).toMatchObject({ limitado: true, cantidad: 2 });
    });
    it("productoDelCatalogo busca por ProductoID (texto o número)", () => {
        const cat = [{ ProductoID: 1 }, { ProductoID: 2 }];
        expect(productoDelCatalogo({ producto: { ProductoID: "2" } }, cat)).toBe(cat[1]);
        expect(productoDelCatalogo({ ProductoID: 1 }, cat)).toBe(cat[0]);
        expect(productoDelCatalogo({ producto: { ProductoID: 9 } }, cat)).toBeNull();
        expect(productoDelCatalogo({}, cat)).toBeNull();
    });
});
