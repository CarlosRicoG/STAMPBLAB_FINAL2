import { describe, it, expect } from "vitest";
import { plazoDePagoAplica,
    precioUnitarioPrenda, estimarProducto, estimarCotizacion, desgloseCotizacion, fechaLimitePago,
    textoTiempoRestante, textoCostoEnvio, fusionarCarritos, itemsParaVolverAPedir, urlWhatsApp,
    validarComprobante, resumenAtencion, ultimoPedidoEnCurso, formatoFechaCO,
} from "./clienteUtils";

describe("estimado de cotización", () => {
    const tarifas = [{ TecnicaID: 1, ParteID: 2, Costo: "5000" }];
    it("suma base + talla + tela", () => {
        expect(precioUnitarioPrenda({ producto: { PrecioBase: 20000 }, talla: { Precio: 2000 }, tela: { PrecioTela: 3000 } })).toBe(25000);
    });
    it("multiplica prenda y diseños por la cantidad y cuenta los diseños sin tarifa", () => {
        const e = estimarProducto({
            Cantidad: 3, producto: { PrecioBase: 20000 }, talla: { Precio: 1000 },
            disenos: [{ TecnicaID: 1, ParteID: 2 }, { TecnicaID: 9, ParteID: 9 }],
        }, tarifas);
        expect(e.prenda).toBe(63000);
        expect(e.disenos).toBe(15000);
        expect(e.porCotizar).toBe(1);
        expect(e.total).toBe(78000);
    });
    it("prenda propia no cobra prenda", () => {
        const e = estimarProducto({ Cantidad: 2, TraePrenda: true, producto: { PrecioBase: 99999 }, disenos: [{ TecnicaID: 1, ParteID: 2 }] }, tarifas);
        expect(e.prenda).toBe(0);
        expect(e.total).toBe(10000);
    });
    it("totaliza varios productos", () => {
        const r = estimarCotizacion([{ Cantidad: 1, producto: { PrecioBase: 10 }, disenos: [] }, { Cantidad: 2, producto: { PrecioBase: 5 }, disenos: [] }], []);
        expect(r.total).toBe(20);
    });
    it("desglose de cotización aprobada", () => {
        const d = desgloseCotizacion({ ValorTotal: "50000", detalles: [{ Cantidad: 2, producto: { Nombre: "Camiseta", PrecioBase: 20000 }, tallas: [], insumos: [], tecnicas: [{ CostoTecnica: 5000 }] }] });
        expect(d.lineas[0]).toMatchObject({ nombre: "Camiseta", prenda: 40000, disenos: 10000, subtotal: 50000 });
        expect(d.total).toBe(50000);
    });
});

describe("plazos", () => {
    it("calcula la fecha límite de pago", () => {
        const l = fechaLimitePago("2026-01-01T10:00:00.000Z", 48);
        expect(l.toISOString()).toBe("2026-01-03T10:00:00.000Z");
        expect(fechaLimitePago("x", 48)).toBeNull();
        expect(fechaLimitePago("2026-01-01", 0)).toBeNull();
    });
    it("texto de tiempo restante", () => {
        const ahora = new Date("2026-01-01T00:00:00Z");
        expect(textoTiempoRestante(new Date("2025-12-31T00:00:00Z"), ahora)).toBe("plazo vencido");
        expect(textoTiempoRestante(new Date("2026-01-01T05:00:00Z"), ahora)).toBe("faltan 5 h");
        expect(textoTiempoRestante(new Date("2026-01-05T00:00:00Z"), ahora)).toBe("faltan 4 días");
    });
    it("fecha sin zona no se corre de día", () => {
        expect(formatoFechaCO("2026-03-15")).toContain("15");
    });
});

describe("envío", () => {
    it("formatea el costo", () => {
        expect(textoCostoEnvio(0)).toBe("Gratis");
        expect(textoCostoEnvio(null)).toBe("A convenir");
        expect(textoCostoEnvio(12000)).toContain("12");
    });
});

describe("carrito", () => {
    const a = { producto: { ProductoID: 1 }, color: "Rojo", talla: "M", cantidad: 1 };
    it("fusiona sin duplicar y conserva la mayor cantidad", () => {
        const r = fusionarCarritos([{ ...a, cantidad: 3 }], [a, { producto: { ProductoID: 2 }, color: "", talla: "", cantidad: 1 }]);
        expect(r).toHaveLength(2);
        expect(r.find((i) => i.producto.ProductoID === 1).cantidad).toBe(3);
    });
    it("tolera entradas inválidas", () => {
        expect(fusionarCarritos(null, undefined)).toEqual([]);
    });
    it("volver a pedir usa el precio actual y avisa lo que no puede agregar", () => {
        const venta = { detalles: [
            { ProductoID: 1, ColorID: 1, TallaID: 1, Cantidad: 5, producto: { Nombre: "Camiseta" } },
            { ProductoID: 2, ColorID: 1, TallaID: 1, Cantidad: 1, producto: { Nombre: "Gorra" } },
            { ProductoID: 3, ColorID: 1, TallaID: 1, Cantidad: 1, producto: { Nombre: "Buzo" } },
        ] };
        const catalogo = [
            { ProductoID: 1, Nombre: "Camiseta", PrecioBase: 30000, inventario: [{ ColorID: 1, TallaID: 1, Stock: 2, Estado: true, color: { Nombre: "Rojo" }, talla: { Nombre: "M" } }] },
            { ProductoID: 3, Nombre: "Buzo", PrecioBase: 1, inventario: [{ ColorID: 2, TallaID: 1, Stock: 9, Estado: true }] },
        ];
        const { items, omitidos } = itemsParaVolverAPedir(venta, catalogo, [{ TallaID: 1, Precio: 1000 }]);
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ nombre: "Camiseta", color: "Rojo", talla: "M", cantidad: 2, precio: 31000 });
        expect(omitidos.map((o) => o.nombre).sort()).toEqual(["Buzo", "Camiseta", "Gorra"]);
    });
});

describe("whatsapp y comprobante", () => {
    it("arma el enlace", () => {
        expect(urlWhatsApp("+57 300 123 4567", "Hola #5")).toBe("https://wa.me/573001234567?text=Hola%20%235");
        expect(urlWhatsApp("", "x")).toBe("");
    });
    it("valida el comprobante", () => {
        expect(validarComprobante(null)).not.toBe("");
        expect(validarComprobante({ type: "application/pdf", size: 10 })).toMatch(/PNG, JPG o WEBP/);
        expect(validarComprobante({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
        expect(validarComprobante({ type: "image/webp", size: 1000 })).toBe("");
    });
});

describe("resumen de atención", () => {
    const cots = [{ EstadoID: 2, ValorTotal: 1000 }, { EstadoID: 2, ValorTotal: 0 }, { EstadoID: 1, ValorTotal: 0 }];
    const ventas = [
        { VentaID: 1, EstadoID: 8, MetodoPago: "transferencia", FechaVenta: "2026-01-01T00:00:00Z" },
        { VentaID: 2, EstadoID: 8, MetodoPago: "transferencia", ComprobanteTransferencia: "x", FechaVenta: "2026-01-02T00:00:00Z", ComprobanteMotivoRechazo: "borroso" },
        { VentaID: 3, EstadoID: 11, FechaVenta: "2026-01-03T00:00:00Z" },
        { VentaID: 4, EstadoID: 10, FechaVenta: "2026-01-04T00:00:00Z" },
    ];
    it("clasifica lo que requiere atención", () => {
        const r = resumenAtencion(cots, ventas, 48, new Date("2026-01-01T10:00:00Z"));
        expect(r.porAceptar).toHaveLength(1);
        expect(r.pendientesPago).toHaveLength(1);
        expect(r.pendientesPago[0].restante).toBe("faltan 38 h");
        expect(r.rechazados).toHaveLength(1);
        expect(r.total).toBe(3);
    });
    it("último pedido en curso", () => {
        expect(ultimoPedidoEnCurso(ventas).VentaID).toBe(4);
        expect(ultimoPedidoEnCurso([])).toBeNull();
    });
});

describe("plazoDePagoAplica", () => {
    const base = { EstadoID: 8, MetodoPago: "transferencia" };
    it("corre solo si es transferencia pendiente sin comprobante válido", () => {
        expect(plazoDePagoAplica({ ...base })).toBe(true);
        expect(plazoDePagoAplica({ ...base, ComprobanteTransferencia: "x", ComprobanteMotivoRechazo: "borroso" })).toBe(true);
    });
    it("no corre con el comprobante en revisión, contra entrega ni pedidos que no están pendientes", () => {
        expect(plazoDePagoAplica({ ...base, ComprobanteTransferencia: "x" })).toBe(false);
        expect(plazoDePagoAplica({ ...base, MetodoPago: "contraentrega" })).toBe(false);
        expect(plazoDePagoAplica({ ...base, EstadoID: 9 })).toBe(false);
        expect(plazoDePagoAplica({ EstadoID: 8 })).toBe(false);
    });
});
