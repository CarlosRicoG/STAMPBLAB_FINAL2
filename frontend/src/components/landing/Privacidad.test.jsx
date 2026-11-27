import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Privacidad from "./Privacidad";
import { RESPONSABLE, VERSION_POLITICA, FECHA_POLITICA, hayMarcadoresPendientes } from "../../config/privacidad";

vi.mock("./NavBarLanding", () => ({ default: () => null }));

const montar = () => render(<MemoryRouter><Privacidad /></MemoryRouter>);

describe("configuración de la política", () => {
    it("los datos del responsable son marcadores a completar (no se inventan)", () => {
        expect(RESPONSABLE.razonSocial).toBe("[RAZÓN SOCIAL]");
        expect(RESPONSABLE.nit).toBe("[NIT]");
        expect(hayMarcadoresPendientes()).toBe(true);
    });

    it("la versión es un texto corto que el servidor acepta (máx. 50)", () => {
        expect(typeof VERSION_POLITICA).toBe("string");
        expect(VERSION_POLITICA.length).toBeGreaterThan(0);
        expect(VERSION_POLITICA.length).toBeLessThanOrEqual(50);
    });
});

describe("página de la Política de Tratamiento de Datos", () => {
    it("identifica al responsable con los datos de la configuración", () => {
        montar();
        expect(screen.getByRole("heading", { level: 1, name: /política de tratamiento de datos personales/i })).toBeTruthy();
        expect(screen.getAllByText(RESPONSABLE.razonSocial).length).toBeGreaterThan(0);
        expect(screen.getAllByText(RESPONSABLE.nit).length).toBeGreaterThan(0);
        expect(screen.getAllByText(RESPONSABLE.correo).length).toBeGreaterThan(0);
    });

    it("menciona el marco legal, los datos que se recogen y las finalidades reales", () => {
        const { container } = montar();
        const texto = container.textContent;
        expect(texto).toMatch(/Ley 1581 de 2012/);
        expect(texto).toMatch(/Decreto 1377 de 2013/);
        for (const dato of [/documento de identidad/i, /correo electrónico/i, /teléfono/i, /dirección/i, /comprobantes? de pago/i, /imágenes de diseño/i]) expect(texto).toMatch(dato);
        for (const fin of [/cuenta/i, /pedidos/i, /cotizaciones/i, /transferencia/i, /envío/i, /WhatsApp/i]) expect(texto).toMatch(fin);
    });

    it("explica los derechos del titular y cómo ejercerlos desde la cuenta", () => {
        const { container } = montar();
        const texto = container.textContent;
        for (const d of [/conocer/i, /actualizar/i, /rectificar/i, /suprimir|supresión/i, /revocar/i, /prueba de la autorización/i, /Superintendencia de Industria y Comercio/i]) expect(texto).toMatch(d);
        expect(texto).toMatch(/Descargar mis datos/);
        expect(texto).toMatch(/Eliminar mi cuenta/);
    });

    it("indica los plazos de consultas (10 días hábiles) y reclamos (15 días hábiles)", () => {
        const { container } = montar();
        expect(container.textContent).toMatch(/diez \(10\) días hábiles/);
        expect(container.textContent).toMatch(/quince \(15\) días hábiles/);
    });

    it("muestra versión y fecha de vigencia, y no muestra avisos internos", () => {
        const { container } = montar();
        expect(container.textContent).toContain(VERSION_POLITICA);
        expect(container.textContent).toContain(FECHA_POLITICA);
        expect(container.textContent).not.toMatch(/revisión legal|pendiente de revisión/i);
    });
});

describe("versión pública", () => {
    it("la versión que se muestra y se guarda como prueba no dice 'borrador'", () => {
        expect(VERSION_POLITICA).not.toMatch(/borrador/i);
    });
});
