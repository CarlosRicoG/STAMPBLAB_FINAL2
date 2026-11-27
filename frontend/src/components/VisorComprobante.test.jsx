import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VisorComprobante, { LightboxComprobante } from "./VisorComprobante";
import { esPdf, urlComprobante, dataUrlABlob, abrirPdf, MS_LIBERAR_BLOB } from "../utils/comprobante";

const PDF = `data:application/pdf;base64,${btoa("%PDF-1.4 hola")}`;
const PNG = "data:image/png;base64,iVBORw0KGgo=";

beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:http://localhost/abc");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(window, "open").mockImplementation(() => null);
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("utilidades del comprobante", () => {
    it("reconoce PDF por data URL o extensión", () => {
        expect(esPdf(PDF)).toBe(true);
        expect(esPdf("/uploads/c/abc.PDF")).toBe(true);
        expect(esPdf(PNG)).toBe(false);
        expect(esPdf("/uploads/c/abc.jpg")).toBe(false);
        expect(esPdf(null)).toBe(false);
    });

    it("antepone la URL del backend a las rutas /uploads", () => {
        expect(urlComprobante("/uploads/x.png")).toBe("http://api.test/uploads/x.png");
        expect(urlComprobante(PNG)).toBe(PNG);
        expect(urlComprobante("https://cdn.x/y.png")).toBe("https://cdn.x/y.png");
    });

    it("convierte la data URL en un Blob con su tipo", async () => {
        const b = dataUrlABlob(PDF);
        expect(b.type).toBe("application/pdf");
        expect(b.size).toBe("%PDF-1.4 hola".length);
    });

    it("abre el PDF desde un blob en el mismo clic y luego libera el blob", () => {
        vi.useFakeTimers();
        abrirPdf(PDF);
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledWith("blob:http://localhost/abc", "_blank", "noopener");
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
        vi.advanceTimersByTime(MS_LIBERAR_BLOB);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/abc");
    });

    it("un PDF guardado en /uploads se abre directo contra el backend (sin blob)", () => {
        abrirPdf("/uploads/c/1.pdf");
        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith("http://api.test/uploads/c/1.pdf", "_blank", "noopener");
    });
});

describe("<VisorComprobante>", () => {
    it("imagen: miniatura con zoom y URL completa del backend", () => {
        const onZoom = vi.fn();
        render(<VisorComprobante comprobante="/uploads/c/1.png" ventaID={5} onZoom={onZoom} />);
        expect(screen.getByAltText("Comprobante de pago").getAttribute("src")).toBe("http://api.test/uploads/c/1.png");
        fireEvent.click(screen.getByText("Ver comprobante"));
        expect(onZoom).toHaveBeenCalled();
    });

    it("PDF: no pinta <img>, muestra Ver PDF y lo abre", () => {
        render(<VisorComprobante comprobante={PDF} ventaID={5} onZoom={vi.fn()} />);
        expect(screen.queryByRole("img")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Ver PDF/ }));
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Descargar").closest("a").getAttribute("download")).toBe("comprobante-venta-5.pdf");
    });
});

describe("<LightboxComprobante>", () => {
    it("imagen ampliada", () => {
        render(<LightboxComprobante comprobante={PNG} onCerrar={vi.fn()} className="x" />);
        expect(screen.getByAltText("Comprobante ampliado").getAttribute("src")).toBe(PNG);
    });

    it("PDF: tarjeta con Ver PDF (sin <img>) y cierra al hacer clic fuera", () => {
        const onCerrar = vi.fn();
        const { container } = render(<LightboxComprobante comprobante={PDF} onCerrar={onCerrar} className="x" />);
        expect(container.querySelector("img")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Ver PDF/ }));
        expect(window.open).toHaveBeenCalledTimes(1);
        expect(onCerrar).not.toHaveBeenCalled();
        fireEvent.click(container.firstChild);
        expect(onCerrar).toHaveBeenCalled();
    });
});
