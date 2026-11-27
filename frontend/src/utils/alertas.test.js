import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) } }));
import Swal from "sweetalert2";
import { swalTop, swalEncima } from "./alertas";

beforeEach(() => { Swal.fire.mockClear(); document.body.innerHTML = ""; });

describe("swalTop", () => {
    it("pasa las opciones y añade la clase swal-ontop al contenedor", async () => {
        const r = await swalTop({ icon: "warning", title: "Hola" });
        expect(r.isConfirmed).toBe(true);
        expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", title: "Hola", customClass: { container: "swal-ontop" } });
    });
    it("conserva las demás clases propias y una clase container explícita gana", () => {
        swalTop({ title: "x", customClass: { popup: "p" } });
        expect(Swal.fire.mock.calls[0][0].customClass).toEqual({ container: "swal-ontop", popup: "p" });
        swalTop({ title: "x", customClass: { container: "otra" } });
        expect(Swal.fire.mock.calls[1][0].customClass).toEqual({ container: "otra" });
    });
});

describe("swalEncima", () => {
    it("al abrir sube el z-index del contenedor a 99999", () => {
        swalEncima({ title: "x", icon: "info" });
        const opts = Swal.fire.mock.calls[0][0];
        expect(opts).toMatchObject({ title: "x", icon: "info" });
        const c = document.createElement("div"); c.className = "swal2-container"; document.body.appendChild(c);
        opts.didOpen();
        expect(c.style.zIndex).toBe("99999");
    });
    it("no falla si no hay contenedor", () => {
        swalEncima({ title: "x" });
        expect(() => Swal.fire.mock.calls[0][0].didOpen()).not.toThrow();
    });
});
