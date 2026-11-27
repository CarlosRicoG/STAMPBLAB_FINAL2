import { C } from "../../../config/tokens";
import { formatDinero } from "../../../utils/formato";

/* ─────────────────────────────────────────────────────────
   TOKENS Y UTILIDADES DEL FORMULARIO DE COMPRA
───────────────────────────────────────────────────────── */
export const STOCK_BAJO = 10;
export const money = (n) => formatDinero(n, { maximumFractionDigits: 2 });
export const esActivo = (e) => e === true || e === 1 || e === "1";

export const getFechaHoyLocal = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

// Fecha local YYYY-MM-DD a partir del valor que devuelve la API (evita corrimientos por zona horaria)
export const fechaLocalDe = (valor) => {
    if (!valor) return getFechaHoyLocal();
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor).split("T")[0];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const CSS = `
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes cpPop { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
@keyframes cpFade { from{opacity:0} to{opacity:1} }
@keyframes spin   { to{transform:rotate(360deg)} }
.cp-form { animation: fadeIn .35s ease both; }
.cp-layout { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:20px; align-items:start; }
.cp-sticky { position:sticky; top:18px; }
.det-row { transition: background .15s, box-shadow .15s; animation: fadeIn .25s ease both; }
.det-row:hover { background: #eef4ff !important; box-shadow: inset 3px 0 0 #4f8ef7; }
.cp-table thead tr { background: linear-gradient(90deg,#1a2540 0%,#2d3f6e 100%); }
.cp-table th { background: transparent !important; text-transform: uppercase; letter-spacing: .06em; }
.cp-pick { flex:1; padding:16px 20px; border-radius:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:'Outfit',sans-serif; font-weight:700; font-size:14px; transition:all .2s; }
.cp-pick:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15,23,42,.08); }
.cp-ticket { background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(26,37,64,.10), 0 0 0 1px #eef2f7; overflow:hidden; font-family:'Outfit',sans-serif; animation: fadeIn .4s ease both; }
.cp-ticket-head { background: radial-gradient(120% 160% at 100% 0%, rgba(124,58,237,.45) 0%, rgba(124,58,237,0) 55%), linear-gradient(120deg,#1a2540 0%,#2d3f6e 100%); color:#fff; padding:18px 20px; }
.cp-perf { height:14px; background: radial-gradient(circle at 7px 0, #f8fafc 6px, transparent 6.5px) repeat-x; background-size: 14px 14px; margin-top:-7px; }
.cp-tline { display:flex; justify-content:space-between; gap:10px; font-size:12.5px; padding:6px 0; color:#475569; }
.cp-tline span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cp-check { display:flex; align-items:center; gap:8px; font-size:12px; padding:3px 0; }
.cp-err { margin:5px 0 0; font-size:11.5px; color:#dc2626; font-weight:600; display:flex; align-items:center; gap:5px; animation: fadeIn .2s ease both; }
.cp-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(3px); z-index:1050; display:flex; align-items:center; justify-content:center; padding:20px; animation: cpFade .2s ease both; }
.cp-modal { animation: cpPop .26s cubic-bezier(.2,.8,.2,1) both; box-shadow: 0 30px 80px rgba(15,23,42,.35); }
@media (max-width: 1180px) {
  .cp-layout { grid-template-columns: 1fr; }
  .cp-sticky { position: static; }
}
@media (max-width: 760px) {
  .cp-grid-resp { grid-template-columns: 1fr 1fr !important; }
  .cp-grid-resp > button { grid-column: 1 / -1; }
  .cp-grid-2 { grid-template-columns: 1fr !important; }
  .cp-picks { flex-direction: column; }
  .cp-form-head { flex-wrap: wrap; gap: 12px; }
}
`;

export const TH = {
    color: C.white, fontSize: 12, fontWeight: 700,
    padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em", textAlign: "left",
};

export const inputStyle = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 9,
    padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif",
    color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow .2s", background: C.white,
};
export const invalidStyle = { borderColor: C.danger, background: C.dangerSoft };

/* ─────────────────────────────────────────────────────────
   VALIDACIÓN (funciones puras; las usa useCompraForm y el formulario)
───────────────────────────────────────────────────────── */
export const subtotalDetalle = d => (parseFloat(d.PrecioUnitario) || 0) * (Number(d.Cantidad) || 0);

/** Errores del insumo que se va a agregar al detalle ("" = sin error). */
export const erroresInsumo = (precioInsumo, cantInsumo) => ({
    precio: !precioInsumo || !(parseFloat(precioInsumo) > 0) ? "El precio debe ser mayor a 0" : "",
    cantidad: !Number.isInteger(cantInsumo) || cantInsumo < 1 ? "La cantidad debe ser un entero mayor o igual a 1" : "",
});

/** Errores de la variante de producto que se va a agregar al detalle ("" = sin error). */
export const erroresProducto = (varConfig) => {
    const cantProd = Number(varConfig.Cantidad);
    return {
        ColorID: !varConfig.ColorID ? "Requerido" : "",
        TallaID: !varConfig.TallaID ? "Requerido" : "",
        PrecioUnitario: !varConfig.PrecioUnitario || !(parseFloat(varConfig.PrecioUnitario) > 0) ? "El precio debe ser mayor a 0" : "",
        Cantidad: varConfig.Cantidad === "" || !Number.isInteger(cantProd) || cantProd < 1 ? "Debe ser un entero mayor o igual a 1" : "",
    };
};

/** Estado global del formulario: lista de comprobaciones del resumen y si se puede guardar. hoy: "YYYY-MM-DD". */
export const validarCompra = (formData, detalles, hoy) => {
    const fechaFutura = formData.fechaCompra && formData.fechaCompra > hoy;
    const detallesInvalidos = detalles.filter(d => !(parseFloat(d.PrecioUnitario) > 0) || !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0));
    const checks = [
        { ok: !!formData.proveedorRefId, label: "Proveedor seleccionado" },
        { ok: !!formData.fechaCompra && !fechaFutura, label: fechaFutura ? "La fecha no puede ser futura" : "Fecha válida" },
        { ok: detalles.length > 0, label: "Al menos un ítem en el detalle" },
        { ok: detalles.length > 0 && detallesInvalidos.length === 0, label: "Precios y cantidades mayores a 0" },
    ];
    return { fechaFutura, detallesInvalidos, checks, puedeGuardar: checks.every(c => c.ok) };
};

/** Primer motivo que impide enviar la compra, como [título, texto, icono] de SweetAlert; null si se puede enviar. */
export const errorAlEnviar = (formData, detalles, fechaFutura) => {
    if (!formData.proveedorRefId) return ["Error", "Seleccione un proveedor", "error"];
    if (!formData.fechaCompra) return ["Error", "Seleccione una fecha", "error"];
    if (detalles.length === 0) return ["Error", "Agregue al menos un ítem al detalle", "error"];
    if (fechaFutura) return ["Atención", "La fecha no puede ser posterior a hoy", "warning"];
    const sinPrecio = detalles.find(d => !d.PrecioUnitario || parseFloat(d.PrecioUnitario) <= 0);
    if (sinPrecio) return ["Atención", `El precio de "${sinPrecio.NombreInsumo || sinPrecio.NombreProducto}" debe ser mayor a 0`, "warning"];
    const malaCant = detalles.find(d => !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0));
    if (malaCant) return ["Atención", `La cantidad de "${malaCant.NombreInsumo || malaCant.NombreProducto}" debe ser un entero mayor a 0`, "warning"];
    return null;
};

/** Cuerpo que se envía al guardar (mismo formato que espera la API). */
export const payloadCompra = (formData, detalles) => ({
    ProveedorRefId: parseInt(formData.proveedorRefId),
    FechaCompra: formData.fechaCompra,
    detalles: detalles.map(d => d.TipoSeleccion === "insumo"
        ? { TipoSeleccion: "insumo", InsumoID: d.InsumoID, Cantidad: Number(d.Cantidad), PrecioUnitario: parseFloat(d.PrecioUnitario) || 0, PrecioVenta: d.PrecioVenta || 0 }
        : { TipoSeleccion: "producto", ProductoID: d.ProductoID, ColorID: d.ColorID, TallaID: d.TallaID, TelaID: d.TelaID || null, Cantidad: Number(d.Cantidad), PrecioUnitario: parseFloat(d.PrecioUnitario) || 0, PrecioVenta: d.PrecioVenta || 0 }
    )
});
