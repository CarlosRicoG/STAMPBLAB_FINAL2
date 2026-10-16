import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const montar = (adminOnly) =>
    render(
        <MemoryRouter initialEntries={["/panel"]}>
            <Routes>
                <Route path="/panel" element={<ProtectedRoute adminOnly={adminOnly}><p>PANEL SECRETO</p></ProtectedRoute>} />
                <Route path="/login" element={<p>PAGINA LOGIN</p>} />
                <Route path="/landing" element={<p>PAGINA TIENDA</p>} />
            </Routes>
        </MemoryRouter>
    );

const iniciarSesion = (rol) => {
    localStorage.setItem("token", "t");
    localStorage.setItem("usuario", JSON.stringify({ rol }));
};

describe("ProtectedRoute", () => {
    it("sin sesión lleva al login", () => {
        montar(false);
        expect(screen.getByText("PAGINA LOGIN")).toBeTruthy();
    });

    it("con sesión deja pasar a una ruta normal", () => {
        iniciarSesion(2);
        montar(false);
        expect(screen.getByText("PANEL SECRETO")).toBeTruthy();
    });

    it("ruta de administrador: un cliente (rol 2) es enviado a la tienda", () => {
        iniciarSesion(2);
        montar(true);
        expect(screen.getByText("PAGINA TIENDA")).toBeTruthy();
        expect(screen.queryByText("PANEL SECRETO")).toBeNull();
    });

    it("ruta de administrador: el administrador (rol 1) entra", () => {
        iniciarSesion(1);
        montar(true);
        expect(screen.getByText("PANEL SECRETO")).toBeTruthy();
    });

    it("el rol guardado como texto ('1') también cuenta como administrador", () => {
        iniciarSesion("1");
        montar(true);
        expect(screen.getByText("PANEL SECRETO")).toBeTruthy();
    });

    it("un 'usuario' corrupto en localStorage no rompe la página: se trata como cliente", () => {
        localStorage.setItem("token", "t");
        localStorage.setItem("usuario", "{esto no es json");
        montar(true);
        expect(screen.getByText("PAGINA TIENDA")).toBeTruthy();
    });
});
