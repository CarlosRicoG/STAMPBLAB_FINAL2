import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VERSION_POLITICA } from "../../config/privacidad";

vi.mock("../landing/NavBarLanding", () => ({ default: () => null }));
vi.mock("../../Services/api-auth/auth", () => ({ registrarUsuario: vi.fn() }));
vi.mock("../../hooks/usePlus", () => ({ default: () => {} })); // animaciones (IntersectionObserver no existe en jsdom)
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({})) } }));

import Registro from "./Registro";
import { registrarUsuario } from "../../Services/api-auth/auth";
import Swal from "sweetalert2";

const montar = () => render(<MemoryRouter><Registro /></MemoryRouter>);
const escribir = (container, id, valor) => fireEvent.change(container.querySelector(`#${id}`), { target: { value: valor } });
const llenar = (container) => {
    escribir(container, "reg-nombre", "Ana Pérez");
    escribir(container, "reg-documento", "1234567");
    escribir(container, "reg-correo", "ana@correo.com");
    escribir(container, "reg-telefono", "3001234567");
    escribir(container, "reg-direccion", "Calle 1 # 2-3");
    escribir(container, "reg-pass", "Clave1234");
    escribir(container, "reg-confirmar", "Clave1234");
};
const casilla = () => screen.getByRole("checkbox", { name: /autorizo el tratamiento de mis datos personales/i });

beforeEach(() => {
    vi.clearAllMocks();
    registrarUsuario.mockResolvedValue({ data: { estado: true } });
});

describe("Registro: autorización de tratamiento de datos (Ley 1581)", () => {
    it("muestra la casilla obligatoria SIN marcar por defecto", () => {
        montar();
        expect(casilla().checked).toBe(false);
        expect(casilla().required).toBe(true);
    });

    it("enlaza la política en una pestaña nueva (no se pierde el formulario)", () => {
        montar();
        const enlace = screen.getByRole("link", { name: /política de tratamiento de datos/i });
        expect(enlace.getAttribute("href")).toBe("/privacidad");
        expect(enlace.getAttribute("target")).toBe("_blank");
        expect(enlace.getAttribute("rel")).toMatch(/noopener/);
    });

    it("no envía el registro si no se marca la casilla y explica el motivo", async () => {
        const { container } = montar();
        llenar(container);
        fireEvent.click(screen.getByRole("button", { name: /registrar/i }));
        await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
        expect(registrarUsuario).not.toHaveBeenCalled();
        expect(screen.getByText(/debes autorizar el tratamiento de tus datos/i)).toBeTruthy();
    });

    it("con la casilla marcada envía la autorización y la versión de la política", async () => {
        const { container } = montar();
        llenar(container);
        fireEvent.click(casilla());
        expect(casilla().checked).toBe(true);
        fireEvent.click(screen.getByRole("button", { name: /registrar/i }));
        await waitFor(() => expect(registrarUsuario).toHaveBeenCalledTimes(1));
        expect(registrarUsuario.mock.calls[0][0]).toMatchObject({ AceptaPrivacidad: true, VersionPolitica: VERSION_POLITICA, DocumentoID: "1234567" });
    });
});
