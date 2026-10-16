import { describe, it, expect, beforeAll } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import usePlus from "./usePlus";

// jsdom no trae IntersectionObserver: lo simulamos para poder "mostrar" elementos a voluntad
const observados = new Set();
beforeAll(() => {
    window.IntersectionObserver = class {
        constructor(cb) { this.cb = cb; }
        observe(el) { observados.add(el); this.cb([{ isIntersecting: true, target: el }]); }
        unobserve() {}
        disconnect() {}
    };
    window.matchMedia = window.matchMedia || (() => ({ matches: false }));
});

function Pagina() {
    usePlus();
    const [abierto, setAbierto] = useState(false);
    return (
        <div>
            {/* React REEMPLAZA className completo en cada render: antes esto borraba "sx-in" y la tarjeta desaparecía */}
            <div data-testid="faq" className={`item sx-reveal ${abierto ? "open" : ""}`}>pregunta</div>
            <button onClick={() => setAbierto((v) => !v)}>alternar</button>
        </div>
    );
}

describe("usePlus (revelado al hacer scroll)", () => {
    it("revela los elementos .sx-reveal al entrar en pantalla", async () => {
        render(<Pagina />);
        await act(async () => {});
        expect(screen.getByTestId("faq").classList.contains("sx-in")).toBe(true);
    });

    it("el elemento NO vuelve a quedar invisible cuando React cambia su className (bug de las preguntas frecuentes)", async () => {
        render(<Pagina />);
        await act(async () => {});
        const faq = screen.getByTestId("faq");
        expect(faq.classList.contains("sx-in")).toBe(true);

        for (let i = 0; i < 3; i++) {
            fireEvent.click(screen.getByText("alternar"));
            await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
            expect(faq.classList.contains("sx-in")).toBe(true);
        }
    });

    it("quita la barra de progreso al desmontar la página", async () => {
        const { unmount } = render(<Pagina />);
        await act(async () => {});
        expect(document.querySelector(".sx-progress")).not.toBeNull();
        unmount();
        expect(document.querySelector(".sx-progress")).toBeNull();
    });
});
