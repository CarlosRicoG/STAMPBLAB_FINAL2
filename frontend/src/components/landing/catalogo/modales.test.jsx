import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({})) } }));
import Swal from "sweetalert2";
import ProductModal from "./ProductModal";
import CartDrawer from "./CartDrawer";

const producto = {
    ProductoID: 1, Nombre: "Camiseta Básica", PrecioBase: 20000, ImagenProducto: "",
    inventario: [{ Stock: 4, Estado: true, color: { Nombre: "Negro" }, talla: { Nombre: "M" } }],
};
const tallas = [{ Nombre: "M", Precio: 0 }];

describe("ProductModal", () => {
    it("es un diálogo con el nombre del producto, toma el foco y cierra con Escape", () => {
        const onClose = vi.fn();
        render(<ProductModal open product={producto} tallas={tallas} onClose={onClose} onAddToCart={vi.fn()} />);
        const d = screen.getByRole("dialog", { name: "Camiseta Básica" });
        expect(d.getAttribute("aria-modal")).toBe("true");
        expect(document.activeElement).toBe(d);
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("mantiene los botones de color (title) y talla y agrega con color y talla elegidos", () => {
        const onAdd = vi.fn(); const onClose = vi.fn();
        render(<ProductModal open product={producto} tallas={tallas} onClose={onClose} onAddToCart={onAdd} />);
        fireEvent.click(screen.getByRole("button", { name: /Agregar al carrito/ }));
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Selecciona un color", customClass: { container: "swal-ontop" } }));
        fireEvent.click(screen.getByTitle("Negro"));
        fireEvent.click(screen.getByRole("button", { name: "M" }));
        fireEvent.click(screen.getByRole("button", { name: /Agregar al carrito/ }));
        expect(onAdd).toHaveBeenCalledWith({ producto, color: "Negro", talla: "M", cantidad: 1, precio: 20000 });
        expect(onClose).toHaveBeenCalled();
    });

    it("cerrado no pinta nada", () => {
        const { container } = render(<ProductModal open={false} product={producto} tallas={tallas} onClose={vi.fn()} onAddToCart={vi.fn()} />);
        expect(container.innerHTML).toBe("");
    });
});

describe("CartDrawer", () => {
    const cart = [{ producto, nombre: "Camiseta Básica", color: "Negro", talla: "M", cantidad: 2, precio: 20000 }];
    const props = { onRemove: vi.fn(), onUpdateQty: vi.fn(), onEdit: vi.fn(), onCheckout: vi.fn() };

    it("cerrado: sigue montado (oculto) y Escape no hace nada", () => {
        const onClose = vi.fn();
        render(<CartDrawer open={false} onClose={onClose} cart={cart} {...props} />);
        const d = screen.getByRole("dialog", { name: "Mi carrito", hidden: true });
        expect(d.getAttribute("aria-modal")).toBeNull();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).not.toHaveBeenCalled();
    });

    it("abierto: es modal, toma el foco, cierra con Escape y ofrece Comprar ahora", () => {
        const onClose = vi.fn();
        render(<CartDrawer open onClose={onClose} cart={cart} {...props} />);
        const d = screen.getByRole("dialog", { name: "Mi carrito" });
        expect(d.getAttribute("aria-modal")).toBe("true");
        expect(document.activeElement).toBe(d);
        fireEvent.click(screen.getByRole("button", { name: /Comprar ahora/ }));
        expect(props.onCheckout).toHaveBeenCalled();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
