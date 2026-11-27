import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModalTienda from "./ModalTienda";

describe("ModalTienda", () => {
    it("cerrado no pinta nada", () => {
        const { container } = render(<ModalTienda open={false} onClose={() => {}} title="T">x</ModalTienda>);
        expect(container.innerHTML).toBe("");
    });

    it("es un diálogo modal con nombre (su título), recibe el foco y cierra con Escape", () => {
        const onClose = vi.fn();
        render(<ModalTienda open onClose={onClose} title="Catálogo de Productos" subtitle="3 producto(s)" footer={<button>Ok</button>}>contenido</ModalTienda>);
        const d = screen.getByRole("dialog", { name: "Catálogo de Productos" });
        expect(d.getAttribute("aria-modal")).toBe("true");
        expect(document.activeElement).toBe(d);
        expect(screen.getByText("3 producto(s)")).toBeTruthy();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("clic fuera cierra, clic dentro no", () => {
        const onClose = vi.fn();
        render(<ModalTienda open onClose={onClose} title="T">contenido</ModalTienda>);
        fireEvent.click(screen.getByText("contenido"));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(document.querySelector(".cot-overlay"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
