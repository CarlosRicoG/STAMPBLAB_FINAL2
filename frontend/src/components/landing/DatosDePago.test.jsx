import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DatosDePago from "./DatosDePago";

describe("DatosDePago", () => {
    it("no muestra nada si el negocio no configuró la cuenta", () => {
        const { container } = render(<DatosDePago pago={null} />);
        expect(container.firstChild).toBeNull();
        render(<DatosDePago pago={{ banco: "Banco X", cuenta: "" }} />);
        expect(screen.queryByTestId("datos-pago")).toBeNull();
    });

    it("muestra los datos configurados y omite los vacíos", () => {
        render(<DatosDePago pago={{ banco: "Banco X", tipoCuenta: "", cuenta: "123-456", titular: "Taller SAS", documento: "", nota: "Envía el comprobante" }} />);
        expect(screen.getByText("Banco X")).toBeTruthy();
        expect(screen.getByText("123-456")).toBeTruthy();
        expect(screen.getByText("Taller SAS")).toBeTruthy();
        expect(screen.getByText("Envía el comprobante")).toBeTruthy();
        expect(screen.queryByText("Tipo de cuenta")).toBeNull();
        expect(screen.queryByText("Documento")).toBeNull();
    });
});
