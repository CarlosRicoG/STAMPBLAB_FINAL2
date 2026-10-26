// Utilidades puras del lado del CLIENTE (estimados, plazos, carrito, WhatsApp, comprobantes).
// Sin dependencias de React ni del DOM para poder probarlas con vitest.

export const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

/* ───────── Precios / estimado de cotización ───────── */

/** Precio de la prenda por unidad: PrecioBase + precio de la talla + precio de la tela. */
export function precioUnitarioPrenda({ producto, talla, tela } = {}) {
    return num(producto?.PrecioBase) + num(talla?.Precio) + num(tela?.PrecioTela);
}

/** Busca la tarifa pública de una técnica + parte. */
export function buscarTarifa(tarifas, tecnicaID, parteID) {
    if (!Array.isArray(tarifas)) return null;
    return tarifas.find((t) => Number(t.TecnicaID) === Number(tecnicaID) && Number(t.ParteID) === Number(parteID)) || null;
}

/**
 * Estima un producto de la cotización. Los diseños se cobran por unidad (igual que el servidor).
 * Devuelve { cantidad, prendaUnit, prenda, disenosUnit, disenos, porCotizar, total }.
 */
export function estimarProducto(prod, tarifas = []) {
    const cantidad = Math.max(1, parseInt(prod?.Cantidad, 10) || 1);
    const prendaUnit = prod?.TraePrenda ? 0 : precioUnitarioPrenda(prod);
    let disenosUnit = 0;
    let porCotizar = 0;
    for (const d of prod?.disenos || []) {
        const t = buscarTarifa(tarifas, d.TecnicaID, d.ParteID);
        const costo = num(t?.Costo);
        if (t && costo > 0) disenosUnit += costo;
        else porCotizar += 1;
    }
    const prenda = prendaUnit * cantidad;
    const disenos = disenosUnit * cantidad;
    return { cantidad, prendaUnit, prenda, disenosUnit, disenos, porCotizar, total: prenda + disenos };
}

/** Suma el estimado de todos los productos. */
export function estimarCotizacion(productos = [], tarifas = []) {
    const items = productos.map((p) => estimarProducto(p, tarifas));
    return {
        items,
        prenda: items.reduce((s, i) => s + i.prenda, 0),
        disenos: items.reduce((s, i) => s + i.disenos, 0),
        porCotizar: items.reduce((s, i) => s + i.porCotizar, 0),
        total: items.reduce((s, i) => s + i.total, 0),
    };
}

/** Desglose de una cotización ya respondida (objeto del GET /cotizaciones/:id). */
export function desgloseCotizacion(cot) {
    const lineas = (cot?.detalles || []).map((d) => {
        const cantidad = Math.max(1, parseInt(d.Cantidad, 10) || 1);
        const unit = d.TraePrenda
            ? 0
            : num(d.PrecioUnitario) > 0
                ? num(d.PrecioUnitario)
                : num(d.producto?.PrecioBase) + num(d.tallas?.[0]?.talla?.Precio) + num(d.insumos?.[0]?.insumo?.PrecioTela);
        const disenosUnit = (d.tecnicas || []).reduce((s, t) => s + num(t.CostoTecnica), 0);
        return {
            nombre: d.TraePrenda ? "Prenda del cliente" : d.producto?.Nombre || "Producto",
            cantidad,
            prenda: unit * cantidad,
            disenos: disenosUnit * cantidad,
            subtotal: (unit + disenosUnit) * cantidad,
        };
    });
    return { lineas, total: num(cot?.ValorTotal) };
}

/* ───────── Plazos y fechas ───────── */

/** Fecha límite para pagar: FechaVenta + plazoPagoHoras. Devuelve Date o null. */
export function fechaLimitePago(fechaVenta, plazoPagoHoras) {
    const h = num(plazoPagoHoras);
    const base = new Date(fechaVenta);
    if (!fechaVenta || Number.isNaN(base.getTime()) || h <= 0) return null;
    return new Date(base.getTime() + h * 3600 * 1000);
}

/** Texto corto "faltan 5 h" / "faltan 2 días" / "plazo vencido". */
export function textoTiempoRestante(limite, ahora = new Date()) {
    if (!(limite instanceof Date) || Number.isNaN(limite.getTime())) return "";
    const ms = limite.getTime() - ahora.getTime();
    if (ms <= 0) return "plazo vencido";
    const min = Math.floor(ms / 60000);
    if (min < 60) return `faltan ${Math.max(1, min)} min`;
    const h = Math.floor(min / 60);
    if (h < 48) return `faltan ${h} h`;
    return `faltan ${Math.floor(h / 24)} días`;
}

export function formatoFechaHoraCO(fecha) {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatoFechaCO(fecha) {
    if (!fecha) return "";
    // Fechas 'YYYY-MM-DD' se interpretan como locales para no correrse un día por zona horaria
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha));
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(fecha);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
}

/* ───────── Envío ───────── */

/** Texto del costo de envío: "Gratis" / "A convenir" / "$12.000". */
export function textoCostoEnvio(costoEnvio) {
    if (costoEnvio === null || costoEnvio === undefined || costoEnvio === "") return "A convenir";
    const c = num(costoEnvio);
    if (c > 0) return "$" + c.toLocaleString("es-CO");
    return "Gratis";
}

/* ───────── Carrito ───────── */

export const claveItemCarrito = (i) => `${i?.producto?.ProductoID ?? i?.ProductoID ?? ""}|${i?.color ?? ""}|${i?.talla ?? ""}`;

/** Une el carrito local con el del servidor sin duplicar (misma clave: gana la mayor cantidad). */
export function fusionarCarritos(local, remoto) {
    const salida = [];
    const idx = new Map();
    for (const it of [...(Array.isArray(remoto) ? remoto : []), ...(Array.isArray(local) ? local : [])]) {
        if (!it || typeof it !== "object") continue;
        const k = claveItemCarrito(it);
        if (idx.has(k)) {
            const pos = idx.get(k);
            if ((Number(it.cantidad) || 0) > (Number(salida[pos].cantidad) || 0)) salida[pos] = { ...salida[pos], ...it };
        } else {
            idx.set(k, salida.length);
            salida.push(it);
        }
    }
    return salida.slice(0, 200);
}

/**
 * Arma los ítems del carrito para "Volver a pedir" a partir de un pedido y el catálogo actual.
 * Usa el precio ACTUAL (PrecioBase + talla) y solo variantes existentes con stock.
 * @returns {{ items: Array, omitidos: Array<{nombre:string, motivo:string}> }}
 */
export function itemsParaVolverAPedir(venta, productosCatalogo = [], tallasCatalogo = []) {
    const items = [];
    const omitidos = [];
    for (const det of venta?.detalles || []) {
        const nombre = det.producto?.Nombre || "Producto";
        const prod = productosCatalogo.find((p) => Number(p.ProductoID) === Number(det.ProductoID ?? det.producto?.ProductoID));
        if (!prod) { omitidos.push({ nombre, motivo: "ya no está en el catálogo" }); continue; }
        const vars = (prod.inventario || []).filter((i) => i.Estado && Number(i.Stock) > 0);
        if (!vars.length) { omitidos.push({ nombre, motivo: "sin stock por ahora" }); continue; }
        const colorID = det.ColorID ?? det.color?.ColorID ?? null;
        const tallaID = det.TallaID ?? det.talla?.TallaID ?? null;
        const variante = vars.find((v) => (colorID == null || Number(v.ColorID) === Number(colorID)) && (tallaID == null || Number(v.TallaID) === Number(tallaID)));
        if (!variante) { omitidos.push({ nombre, motivo: "esa combinación de color y talla ya no está disponible" }); continue; }
        const cantidad = Math.max(1, Math.min(Number(det.Cantidad) || 1, Number(variante.Stock)));
        const tallaObj = tallasCatalogo.find((t) => Number(t.TallaID) === Number(variante.TallaID));
        const precio = num(prod.PrecioBase) + num(tallaObj?.Precio);
        items.push({
            producto: prod,
            nombre: prod.Nombre,
            imagen: prod.ImagenProducto,
            color: variante.color?.Nombre || det.color?.Nombre || "",
            talla: variante.talla?.Nombre || det.talla?.Nombre || "",
            cantidad,
            precio,
        });
        if (cantidad < (Number(det.Cantidad) || 1)) omitidos.push({ nombre, motivo: `solo se agregaron ${cantidad} unidades por el stock disponible` });
    }
    return { items, omitidos };
}

/* ───────── WhatsApp ───────── */

/** Enlace wa.me con el mensaje ya escrito. Devuelve "" si no hay número válido. */
export function urlWhatsApp(numero, texto = "") {
    const digitos = String(numero ?? "").replace(/\D/g, "");
    if (digitos.length < 7) return "";
    return `https://wa.me/${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/* ───────── Comprobantes ───────── */

export const COMPROBANTE_TIPOS = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024;

/** Valida un archivo de comprobante (PNG/JPG/WEBP ≤ 5 MB). Devuelve un texto de error o "" si es válido. */
export function validarComprobante(file) {
    if (!file) return "Selecciona una imagen de tu comprobante.";
    if (!COMPROBANTE_TIPOS.includes(file.type)) return "El comprobante debe ser una imagen PNG, JPG o WEBP.";
    if (file.size > COMPROBANTE_MAX_BYTES) return "El comprobante no puede pesar más de 5 MB.";
    return "";
}

/* ───────── Resumen "Mi cuenta" ───────── */

const nombreEstado = (x) => x?.estado?.Nombre || x?.Estado || "";

/**
 * Qué necesita atención del cliente:
 *  - cotizaciones aprobadas con precio (por aceptar)
 *  - pedidos pendientes de pago (con plazo)
 *  - comprobantes rechazados
 */
export function resumenAtencion(cotizaciones = [], ventas = [], plazoPagoHoras = 0, ahora = new Date()) {
    const porAceptar = cotizaciones.filter((c) =>
        (Number(c.EstadoID) === 2 || nombreEstado(c) === "Aprobada") && num(c.ValorTotal) > 0);
    const esPendiente = (v) => Number(v.EstadoID) === 8 || nombreEstado(v) === "Pendiente";
    const rechazados = ventas.filter((v) => esPendiente(v) && v.ComprobanteMotivoRechazo);
    const pendientesPago = ventas.filter((v) => esPendiente(v) && !v.ComprobanteMotivoRechazo).map((v) => {
        const limite = fechaLimitePago(v.FechaVenta, plazoPagoHoras);
        return { venta: v, limite, restante: textoTiempoRestante(limite, ahora) };
    });
    return {
        porAceptar,
        pendientesPago,
        rechazados,
        total: porAceptar.length + pendientesPago.length + rechazados.length,
    };
}

/** Último pedido en curso (no entregado ni cancelado), el más reciente. */
export function ultimoPedidoEnCurso(ventas = []) {
    const enCurso = ventas.filter((v) => {
        const id = Number(v.EstadoID);
        const n = nombreEstado(v);
        return id !== 11 && id !== 12 && n !== "Entregada" && n !== "Cancelada";
    });
    enCurso.sort((a, b) => new Date(b.FechaVenta) - new Date(a.FechaVenta));
    return enCurso[0] || null;
}
