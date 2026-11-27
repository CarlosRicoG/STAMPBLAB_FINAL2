import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../../Services/api-cliente/miCuenta", () => ({ descargarMisDatos: vi.fn(), suprimirMiCuenta: vi.fn() }));
vi.mock("../../Services/api-auth/auth", () => ({ cerrarSesion: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

import MisDatosPersonales from "./MisDatosPersonales";
import { descargarMisDatos, suprimirMiCuenta } from "../../Services/api-cliente/miCuenta";
import { cerrarSesion } from "../../Services/api-auth/auth";
import Swal from "sweetalert2";

const montar = () => render(
    <MemoryRouter initialEntries={["/micuenta"]}>
        <Routes>
            <Route path="/micuenta" element={<MisDatosPersonales />} />
            <Route path="/" element={<p>INICIO</p>} />
        </Routes>
    </MemoryRouter>
);
const botonEliminar = () => screen.getByRole("button", { name: /eliminar mi cuenta y mis datos/i });

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "t");
    Swal.fire.mockResolvedValue({});
    cerrarSesion.mockImplementation(async () => { localStorage.removeItem("token"); });
});

describe("Mi cuenta: tus datos personales", () => {
    it("enlaza la política de tratamiento de datos", () => {
        montar();
        expect(screen.getByRole("link", { name: /política de tratamiento de datos/i }).getAttribute("href")).toBe("/privacidad");
    });

    it("'Descargar mis datos' baja el archivo", async () => {
        descargarMisDatos.mockResolvedValue("mis-datos.json");
        montar();
        fireEvent.click(screen.getByRole("button", { name: /descargar mis datos/i }));
        await waitFor(() => expect(descargarMisDatos).toHaveBeenCalledTimes(1));
    });

    it("si la descarga falla avisa con un mensaje", async () => {
        descargarMisDatos.mockRejectedValue({ response: { data: { mensaje: "No se pudieron obtener tus datos" } } });
        montar();
        fireEvent.click(screen.getByRole("button", { name: /descargar mis datos/i }));
        await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: "No se pudieron obtener tus datos" })));
    });

    it("eliminar pide la contraseña, explica las consecuencias y no hace nada si se cancela", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        montar();
        fireEvent.click(botonEliminar());
        await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(1));
        const opciones = Swal.fire.mock.calls[0][0];
        expect(opciones.input).toBe("password");
        expect(opciones.html).toMatch(/no se puede deshacer/i);
        expect(opciones.html).toMatch(/pedidos o cotizaciones en curso/i);
        expect(typeof opciones.inputValidator).toBe("function");
        expect(opciones.inputValidator("")).toBeTruthy();
        expect(suprimirMiCuenta).not.toHaveBeenCalled();
        expect(cerrarSesion).not.toHaveBeenCalled();
    });

    it("con la contraseña confirmada elimina la cuenta y cierra la sesión", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: "Clave1234" });
        suprimirMiCuenta.mockResolvedValue({ data: { estado: true, mensaje: "Eliminada" } });
        montar();
        fireEvent.click(botonEliminar());
        await waitFor(() => expect(cerrarSesion).toHaveBeenCalledTimes(1));
        expect(suprimirMiCuenta).toHaveBeenCalledWith("Clave1234");
        expect(localStorage.getItem("token")).toBeNull();
        await waitFor(() => expect(screen.getByText("INICIO")).toBeTruthy());
    });

    it("si tiene pedidos en curso (409) muestra la explicación del servidor y no cierra la sesión", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: true, value: "Clave1234" });
        suprimirMiCuenta.mockRejectedValue({ response: { status: 409, data: { mensaje: "Aún no podemos eliminar tu cuenta: tienes 1 pedido(s) en curso." } } });
        montar();
        fireEvent.click(botonEliminar());
        await waitFor(() => expect(Swal.fire).toHaveBeenCalledTimes(2));
        expect(Swal.fire.mock.calls[1][0]).toMatchObject({ icon: "warning", text: expect.stringMatching(/pedido\(s\) en curso/) });
        expect(cerrarSesion).not.toHaveBeenCalled();
        expect(localStorage.getItem("token")).toBe("t");
    });
});
