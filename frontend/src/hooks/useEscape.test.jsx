import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import useEscape from "./useEscape";

const Capa = ({ onClose, activo = true }) => { useEscape(onClose, activo); return null; };
const esc = () => fireEvent.keyDown(document, { key: "Escape" });

// Contenedor de SweetAlert con su popup: "swal2-modal" (alerta normal) o "swal2-toast" (aviso en una esquina)
const swal = (tipo) => {
    const c = document.createElement("div"); c.className = "swal2-container";
    const p = document.createElement("div"); p.className = `swal2-popup ${tipo}`;
    c.appendChild(p); document.body.appendChild(c);
    return c;
};

afterEach(() => { document.querySelectorAll(".swal2-container").forEach((n) => n.remove()); });

describe("useEscape", () => {
    it("llama a onClose con Escape y no con otras teclas", () => {
        const f = vi.fn();
        render(<Capa onClose={f} />);
        fireEvent.keyDown(document, { key: "Enter" });
        expect(f).not.toHaveBeenCalled();
        esc();
        expect(f).toHaveBeenCalledTimes(1);
    });

    it("inactivo no escucha", () => {
        const f = vi.fn();
        render(<Capa onClose={f} activo={false} />);
        esc();
        expect(f).not.toHaveBeenCalled();
    });

    it("con dos capas solo cierra la de arriba (la última abierta)", () => {
        const abajo = vi.fn(); const arriba = vi.fn();
        const { rerender } = render(<><Capa onClose={abajo} /><Capa onClose={arriba} /></>);
        esc();
        expect(arriba).toHaveBeenCalledTimes(1);
        expect(abajo).not.toHaveBeenCalled();
        rerender(<><Capa onClose={abajo} /><Capa onClose={arriba} activo={false} /></>);
        esc();
        expect(abajo).toHaveBeenCalledTimes(1);
    });

    it("con un SweetAlert abierto, Escape es del Swal", () => {
        const f = vi.fn();
        render(<Capa onClose={f} />);
        swal("swal2-modal");
        esc();
        expect(f).not.toHaveBeenCalled();
    });

    it("un toast de SweetAlert no bloquea Escape: el modal se cierra", () => {
        const f = vi.fn();
        render(<Capa onClose={f} />);
        swal("swal2-toast");
        esc();
        expect(f).toHaveBeenCalledTimes(1);
    });

    it("usa siempre la versión más reciente de onClose y deja de escuchar al desmontar", () => {
        const f1 = vi.fn(); const f2 = vi.fn();
        const { rerender, unmount } = render(<Capa onClose={f1} />);
        rerender(<Capa onClose={f2} />);
        esc();
        expect(f1).not.toHaveBeenCalled();
        expect(f2).toHaveBeenCalledTimes(1);
        unmount();
        esc();
        expect(f2).toHaveBeenCalledTimes(1);
    });
});
