import { FaBoxOpen, FaTshirt, FaTrash } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { money, TH, inputStyle, invalidStyle, subtotalDetalle } from "./compraUtils";
import { Badge } from "./ui";

/* Tabla editable del detalle de la compra (o el aviso de que está vacía) */
const DetalleCompraTabla = ({ detalles, intentoEnvio, totalCompra, handleCambiarPrecio, handleCambiarCantidad, handleEliminarDetalle }) => (
    <>
        {detalles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "44px 24px", background: C.accentSoft, borderRadius: 14, border: `1.5px dashed ${intentoEnvio ? C.danger : C.accentBorder}` }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#fff,#ede9fe)", color: C.accent, fontSize: 24 }}><FaBoxOpen /></div>
                <p style={{ color: intentoEnvio ? C.danger : C.muted, margin: 0, fontSize: 13, fontWeight: intentoEnvio ? 700 : 400 }}>No hay ítems. Usa los botones de arriba para agregar insumos o productos.</p>
            </div>
        ) : (
            <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>#</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Tipo</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Nombre</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px" }}>Detalle</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Base</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>+ Talla</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>+ Tela</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Venta</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>P. Compra</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Cantidad</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}>Subtotal</th>
                            <th style={{ ...TH, fontSize: 11, padding: "11px 14px", textAlign: "center" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.map((d, i) => {
                            const precioMal = !(parseFloat(d.PrecioUnitario) > 0);
                            const cantMal = !(Number.isInteger(Number(d.Cantidad)) && Number(d.Cantidad) > 0);
                            const esProd = d.TipoSeleccion === "producto";
                            return (
                            <tr key={i} className="det-row" style={{ background: i % 2 === 0 ? C.white : "#fafbff", borderBottom: `1px solid #eef2f7` }}>
                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12, fontWeight: 600 }}>{i + 1}</td>
                                <td style={{ padding: "11px 14px" }}>
                                    {!esProd
                                        ? <Badge type="info"><FaBoxOpen size={10} />{d.TipoInsumo || "Insumo"}</Badge>
                                        : <Badge type="success"><FaTshirt size={10} />Producto</Badge>}
                                </td>
                                <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>
                                    {!esProd ? d.NombreInsumo : d.NombreProducto}
                                </td>
                                <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>
                                    {esProd
                                        ? <span style={{ whiteSpace: "nowrap" }}>{d.NombreColor} / {d.NombreTalla}{d.TelaID ? ` / ${d.NombreTela}` : ""}</span>
                                        : <span>—</span>}
                                </td>
                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                    {esProd ? <span style={{ fontWeight: 600, color: C.navy, fontSize: 12 }}>{money(d.PrecioBase)}</span> : <span style={{ color: C.muted }}>—</span>}
                                </td>
                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                    {esProd
                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTalla || 0) > 0 ? C.accent : C.muted, fontSize: 12 }}>
                                            {parseFloat(d.PrecioTalla || 0) > 0 ? `+${money(d.PrecioTalla)}` : "$0"}
                                        </span>
                                        : <span style={{ color: C.muted }}>—</span>}
                                </td>
                                <td style={{ padding: "11px 14px", textAlign: "center", background: "rgba(79,142,247,.04)" }}>
                                    {esProd
                                        ? <span style={{ fontWeight: 600, color: parseFloat(d.PrecioTela || 0) > 0 ? C.violet : C.muted, fontSize: 12 }}>
                                            {parseFloat(d.PrecioTela || 0) > 0 ? `+${money(d.PrecioTela)}` : "$0"}
                                        </span>
                                        : <span style={{ color: C.muted }}>—</span>}
                                </td>
                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                    {esProd ? <Badge type="success">{money(d.PrecioVenta)}</Badge> : <span style={{ color: C.muted }}>—</span>}
                                </td>
                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                    <input type="number" min="0" aria-label={`Precio de compra ítem ${i + 1}`}
                                        value={d.PrecioUnitario ?? ""}
                                        onChange={e => handleCambiarPrecio(i, e.target.value)}
                                        style={{ ...inputStyle, width: 110, textAlign: "center", padding: "6px 10px", ...(precioMal ? invalidStyle : {}) }}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => e.target.style.borderColor = precioMal ? C.danger : C.border} />
                                </td>
                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                    <input type="number" min="1" step="1" aria-label={`Cantidad ítem ${i + 1}`}
                                        value={d.Cantidad ?? ""}
                                        onChange={e => handleCambiarCantidad(i, e.target.value === "" ? "" : Number(e.target.value))}
                                        onFocus={e => e.target.style.borderColor = C.accent}
                                        onBlur={e => {
                                            e.target.style.borderColor = C.border;
                                            if (!d.Cantidad || d.Cantidad < 1) handleCambiarCantidad(i, 1);
                                            else if (!Number.isInteger(Number(d.Cantidad))) handleCambiarCantidad(i, Math.round(Number(d.Cantidad)) || 1);
                                        }}
                                        style={{ ...inputStyle, width: 80, textAlign: "center", padding: "6px 10px", ...(cantMal ? invalidStyle : {}) }} />
                                </td>
                                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                    <span style={{ fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>{money(subtotalDetalle(d))}</span>
                                </td>
                                <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                    <button type="button" title="Quitar ítem" aria-label="Quitar ítem" onClick={() => handleEliminarDetalle(i)}
                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = `${C.danger}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = `${C.danger}0d`; e.currentTarget.style.transform = "none"; }}>
                                        <FaTrash size={12} />
                                    </button>
                                </td>
                            </tr>
                        ); })}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: C.accentSoft, borderTop: `2px solid ${C.border}` }}>
                            <td colSpan={10} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: C.muted, fontSize: 12 }}>TOTAL DE LA COMPRA:</td>
                            <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 800, color: C.navy, fontSize: 16 }}>
                                {money(totalCompra)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}
    </>
);

export default DetalleCompraTabla;
