import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import useFocoModal from "./useFocoModal";

const Dialogo = ({ open }) => {
    const ref = useFocoModal(open);
    if (!open) return null;
    return <div role="dialog" tabIndex={-1} ref={ref}><button>dentro</button></div>;
};

// Contenedor de SweetAlert con su popup: "swal2-modal" (alerta normal) o "swal2-toast" (aviso en una esquina)
const swal = (tipo) => {
    const c = document.createElement("div"); c.className = "swal2-container";
    const p = document.createElement("div"); p.className = `swal2-popup ${tipo}`;
    c.appendChild(p); document.body.appendChild(c);
    return c;
};

afterEach(() => { document.querySelectorAll(".swal2-container").forEach((n) => n.remove()); });

const conBoton = () => {
    const b = document.createElement("button"); b.textContent = "abrir"; document.body.appendChild(b); b.focus();
    return b;
};

describe("useFocoModal", () => {
    it("al abrir enfoca el diálogo y al cerrar devuelve el foco a quien lo tenía", () => {
        const b = conBoton();
        const { rerender, getByRole } = render(<Dialogo open={false} />);
        expect(document.activeElement).toBe(b);
        rerender(<Dialogo open />);
        expect(document.activeElement).toBe(getByRole("dialog"));
        rerender(<Dialogo open={false} />);
        expect(document.activeElement).toBe(b);
        b.remove();
    });

    it("no roba el foco a un SweetAlert abierto al cerrar", () => {
        const b = conBoton();
        const { rerender } = render(<Dialogo open />);
        const c = swal("swal2-modal");
        const conf = document.createElement("button"); c.firstChild.appendChild(conf); conf.focus();
        rerender(<Dialogo open={false} />);
        expect(document.activeElement).toBe(conf);
        b.remove();
    });

    it("con solo un toast de SweetAlert sí devuelve el foco", () => {
        const b = conBoton();
        const { rerender } = render(<Dialogo open />);
        swal("swal2-toast");
        rerender(<Dialogo open={false} />);
        expect(document.activeElement).toBe(b);
        b.remove();
    });

    it("si el elemento anterior ya no existe no falla", () => {
        const b = conBoton();
        const { rerender } = render(<Dialogo open />);
        b.remove();
        expect(() => rerender(<Dialogo open={false} />)).not.toThrow();
    });
});
