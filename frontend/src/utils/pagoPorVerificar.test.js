import { describe, it, expect } from "vitest";
import { esPagoPorVerificar } from "./pagoPorVerificar";

const base = { EstadoID: 12, MetodoPago: "transferencia", ComprobanteTransferencia: "data:image/png;base64,AAA", ComprobanteMotivoRechazo: null, ReembolsoPendiente: false, ReembolsoRealizadoEn: null };

describe("esPagoPorVerificar", () => {
    it("cancelada, por transferencia y con comprobante sin revisar", () => {
        expect(esPagoPorVerificar(base)).toBe(true);
    });
    it("acepta TieneComprobante (lecturas sin el base64) como 1 o true", () => {
        const { ComprobanteTransferencia: _c, ...sinBase64 } = base;
        expect(esPagoPorVerificar({ ...sinBase64, TieneComprobante: 1 })).toBe(true);
        expect(esPagoPorVerificar({ ...sinBase64, TieneComprobante: true })).toBe(true);
        expect(esPagoPorVerificar({ ...sinBase64, TieneComprobante: 0 })).toBe(false);
    });
    it("sin comprobante (o vacío) no hay nada que verificar", () => {
        expect(esPagoPorVerificar({ ...base, ComprobanteTransferencia: null })).toBe(false);
        expect(esPagoPorVerificar({ ...base, ComprobanteTransferencia: "" })).toBe(false);
    });
    it("solo aplica a pedidos cancelados", () => {
        for (const id of [8, 9, 10, 11, 13]) expect(esPagoPorVerificar({ ...base, EstadoID: id })).toBe(false);
        expect(esPagoPorVerificar({ ...base, EstadoID: "12" })).toBe(true);
    });
    it("solo aplica a transferencias", () => {
        expect(esPagoPorVerificar({ ...base, MetodoPago: "contraentrega" })).toBe(false);
        expect(esPagoPorVerificar({ ...base, MetodoPago: null })).toBe(false);
    });
    it("ya resuelto: comprobante rechazado, reembolso pendiente o reembolso hecho", () => {
        expect(esPagoPorVerificar({ ...base, ComprobanteMotivoRechazo: "No llegó el pago" })).toBe(false);
        expect(esPagoPorVerificar({ ...base, ReembolsoPendiente: true })).toBe(false);
        expect(esPagoPorVerificar({ ...base, ReembolsoRealizadoEn: "2026-11-27T10:00:00Z" })).toBe(false);
    });
    it("sin venta", () => {
        expect(esPagoPorVerificar(null)).toBe(false);
        expect(esPagoPorVerificar(undefined)).toBe(false);
    });
});
