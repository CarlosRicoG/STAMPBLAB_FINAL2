import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import Swal from "sweetalert2";
import { erroresInsumo, erroresProducto, validarCompra, errorAlEnviar, payloadCompra, subtotalDetalle, getFechaHoyLocal } from "./compraUtils";
import useCompraForm from "./useCompraForm";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({})) } }));

const insumo = { TipoSeleccion: "insumo", InsumoID: 3, NombreInsumo: "Tinta", PrecioUnitario: "1500", PrecioVenta: 0, Cantidad: 2 };
const producto = { TipoSeleccion: "producto", ProductoID: 7, NombreProducto: "Camiseta", ColorID: 1, TallaID: 2, TelaID: null, PrecioUnitario: 20000, PrecioVenta: 35000, Cantidad: 3 };
const HOY = "2026-11-27";
const form = { proveedorRefId: "4", fechaCompra: HOY };

describe("erroresInsumo", () => {
    it("precio > 0 y cantidad entera >= 1", () => {
        expect(erroresInsumo("100", 1)).toEqual({ precio: "", cantidad: "" });
        expect(erroresInsumo("", 1).precio).toBe("El precio debe ser mayor a 0");
        expect(erroresInsumo("0", 1).precio).toBe("El precio debe ser mayor a 0");
        expect(erroresInsumo("-5", 1).precio).toBe("El precio debe ser mayor a 0");
        expect(erroresInsumo("10", 0).cantidad).toBe("La cantidad debe ser un entero mayor o igual a 1");
        expect(erroresInsumo("10", 1.5).cantidad).toBe("La cantidad debe ser un entero mayor o igual a 1");
        expect(erroresInsumo("10", NaN).cantidad).toBe("La cantidad debe ser un entero mayor o igual a 1");
    });
});

describe("erroresProducto", () => {
    const ok = { ColorID: "1", TallaID: "2", TelaID: "", Cantidad: 1, PrecioUnitario: "100" };
    it("sin errores con color, talla, precio y cantidad válidos", () => {
        expect(Object.values(erroresProducto(ok)).some(Boolean)).toBe(false);
    });
    it("marca cada campo", () => {
        const e = erroresProducto({ ColorID: "", TallaID: "", Cantidad: "", PrecioUnitario: "0" });
        expect(e).toEqual({ ColorID: "Requerido", TallaID: "Requerido", PrecioUnitario: "El precio debe ser mayor a 0", Cantidad: "Debe ser un entero mayor o igual a 1" });
        expect(erroresProducto({ ...ok, Cantidad: "2.5" }).Cantidad).toBe("Debe ser un entero mayor o igual a 1");
        expect(erroresProducto({ ...ok, Cantidad: "3" }).Cantidad).toBe("");
    });
});

describe("validarCompra", () => {
    it("todo correcto: se puede guardar", () => {
        const v = validarCompra(form, [insumo, producto], HOY);
        expect(v.puedeGuardar).toBe(true);
        expect(v.checks.map(c => c.label)).toEqual(["Proveedor seleccionado", "Fecha válida", "Al menos un ítem en el detalle", "Precios y cantidades mayores a 0"]);
    });
    it("fecha futura, sin proveedor, sin ítems o ítems inválidos", () => {
        const fut = validarCompra({ ...form, fechaCompra: "2026-11-28" }, [insumo], HOY);
        expect(fut.fechaFutura).toBe(true);
        expect(fut.checks[1]).toEqual({ ok: false, label: "La fecha no puede ser futura" });
        expect(validarCompra({ ...form, proveedorRefId: "" }, [insumo], HOY).puedeGuardar).toBe(false);
        expect(validarCompra(form, [], HOY).puedeGuardar).toBe(false);
        const mal = validarCompra(form, [{ ...insumo, Cantidad: 0 }], HOY);
        expect(mal.detallesInvalidos).toHaveLength(1);
        expect(mal.puedeGuardar).toBe(false);
    });
});

describe("errorAlEnviar", () => {
    it("devuelve el primer problema, en el mismo orden que antes", () => {
        expect(errorAlEnviar({ proveedorRefId: "", fechaCompra: "" }, [], false)).toEqual(["Error", "Seleccione un proveedor", "error"]);
        expect(errorAlEnviar({ ...form, fechaCompra: "" }, [], false)).toEqual(["Error", "Seleccione una fecha", "error"]);
        expect(errorAlEnviar(form, [], false)).toEqual(["Error", "Agregue al menos un ítem al detalle", "error"]);
        expect(errorAlEnviar(form, [insumo], true)).toEqual(["Atención", "La fecha no puede ser posterior a hoy", "warning"]);
        expect(errorAlEnviar(form, [{ ...insumo, PrecioUnitario: "" }], false)).toEqual(["Atención", 'El precio de "Tinta" debe ser mayor a 0', "warning"]);
        expect(errorAlEnviar(form, [{ ...producto, Cantidad: 1.5 }], false)).toEqual(["Atención", 'La cantidad de "Camiseta" debe ser un entero mayor a 0', "warning"]);
        expect(errorAlEnviar(form, [insumo, producto], false)).toBeNull();
    });
});

describe("payloadCompra y subtotalDetalle", () => {
    it("convierte tipos igual que antes", () => {
        expect(payloadCompra(form, [insumo, producto])).toEqual({
            ProveedorRefId: 4, FechaCompra: HOY,
            detalles: [
                { TipoSeleccion: "insumo", InsumoID: 3, Cantidad: 2, PrecioUnitario: 1500, PrecioVenta: 0 },
                { TipoSeleccion: "producto", ProductoID: 7, ColorID: 1, TallaID: 2, TelaID: null, Cantidad: 3, PrecioUnitario: 20000, PrecioVenta: 35000 },
            ],
        });
        expect(subtotalDetalle(insumo)).toBe(3000);
        expect(subtotalDetalle({ PrecioUnitario: "abc", Cantidad: "" })).toBe(0);
    });
});

describe("useCompraForm", () => {
    beforeEach(() => vi.clearAllMocks());
    const evento = () => ({ preventDefault: vi.fn() });

    it("con errores avisa con SweetAlert y no guarda", async () => {
        const onSave = vi.fn();
        const { result } = renderHook(() => useCompraForm({ formData: { proveedorRefId: "", fechaCompra: getFechaHoyLocal() }, detalles: [], onSave }));
        expect(result.current.intentoEnvio).toBe(false);
        await act(() => result.current.handleSubmit(evento()));
        expect(Swal.fire).toHaveBeenCalledWith("Error", "Seleccione un proveedor", "error");
        expect(onSave).not.toHaveBeenCalled();
        expect(result.current.intentoEnvio).toBe(true);
        expect(result.current.puedeGuardar).toBe(false);
    });

    it("sin errores envía el cuerpo convertido", async () => {
        const onSave = vi.fn(() => Promise.resolve());
        const datos = { proveedorRefId: "4", fechaCompra: getFechaHoyLocal() };
        const { result } = renderHook(() => useCompraForm({ formData: datos, detalles: [insumo], onSave }));
        expect(result.current.puedeGuardar).toBe(true);
        await act(() => result.current.handleSubmit(evento()));
        expect(Swal.fire).not.toHaveBeenCalled();
        expect(onSave).toHaveBeenCalledWith(payloadCompra(datos, [insumo]));
        expect(result.current.submitting).toBe(false);
    });
});
