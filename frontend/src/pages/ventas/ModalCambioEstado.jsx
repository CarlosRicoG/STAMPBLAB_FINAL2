import { useEffect, useState } from "react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { siguientesEstados, NOMBRE_ESTADO_VENTA, ESTADOS_CON_FECHA, hoyISO } from "../../Services/api-ventas/flujo";
import { ESTADO_VENTA } from "../../config/estados";
import { C } from "../../config/tokens";
import { fmtCOP } from "../../utils/formato";
import { VT, VT_CSS, estiloEstado } from "./ventasUi";
import { EstadoBadge } from "./componentesVenta";

/* ── Campos opcionales al cambiar de estado: nota para el cliente y fecha estimada ── */
export const CamposNotaFecha = ({ nota, setNota, fecha, setFecha, pideFecha, errorFecha, errorNota }) => (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {pideFecha && (
            <div>
                <label htmlFor="vt-fecha-est" style={{ fontSize: 12, fontWeight: 700, color: VT.navy, display: "block", marginBottom: 6 }}>
                    Fecha estimada de entrega <span style={{ fontWeight: 500, color: VT.muted }}>(opcional)</span>
                </label>
                <input id="vt-fecha-est" type="date" value={fecha} min={hoyISO()} onChange={e => setFecha(e.target.value)}
                    aria-invalid={!!errorFecha}
                    style={{ border: `1.5px solid ${errorFecha ? VT.danger : VT.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif", color: VT.navy }} />
                {errorFecha && <div role="alert" style={{ color: VT.danger, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{errorFecha}</div>}
            </div>
        )}
        <div>
            <label htmlFor="vt-nota-cli" style={{ fontSize: 12, fontWeight: 700, color: VT.navy, display: "block", marginBottom: 6 }}>
                Nota para el cliente <span style={{ fontWeight: 500, color: VT.muted }}>(opcional)</span>
            </label>
            <textarea id="vt-nota-cli" value={nota} onChange={e => setNota(e.target.value)} rows={2} maxLength={320}
                placeholder="Ej.: Tu pedido ya está en producción, te avisamos cuando esté listo."
                aria-invalid={!!errorNota}
                style={{ width: "100%", border: `1.5px solid ${errorNota ? VT.danger : VT.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", color: VT.navy }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: errorNota ? VT.danger : VT.muted, marginTop: 3 }}>
                <span role={errorNota ? "alert" : undefined}>{errorNota || "El cliente la verá en el seguimiento de su pedido."}</span>
                <span>{nota.length}/300</span>
            </div>
        </div>
    </div>
);

/* ── Modal para cambiar / procesar el estado de una venta ── */
export const EstadoVentaModal = ({ show, venta, estados, titulo = "Cambiar estado de la venta", aviso, onClose, onConfirm }) => {
    const [sel, setSel] = useState("");
    const [saving, setSaving] = useState(false);
    const [nota, setNota] = useState("");
    const [fechaEst, setFechaEst] = useState("");
    useEffect(() => { if (show) { setSel(""); setSaving(false); setNota(""); setFechaEst(""); } }, [show, venta?.VentaID]);
    useEffect(() => {
        if (!show) return;
        const onKey = (e) => { if (e.key === "Escape" && !saving) onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [show, saving, onClose]);
    if (!show || !venta) return null;

    const unidades = (venta.detalles || []).reduce((a, d) => a + (parseInt(d.Cantidad) || 0), 0);
    // Misma regla que el servidor: al cancelar, el stock vuelve si el pedido aún no entró a producción
    const devuelveStock = [ESTADO_VENTA.PENDIENTE, ESTADO_VENTA.PAGADA].includes(venta.EstadoID);
    const selID = parseInt(sel);
    // Solo estados válidos según la máquina de estados del pedido
    const validos = siguientesEstados(venta.EstadoID);
    const opciones = validos.map(id => estados.find(e => e.EstadoID === id) || { EstadoID: id, Nombre: NOMBRE_ESTADO_VENTA[id] });
    const pideFecha = ESTADOS_CON_FECHA.includes(selID);
    const hoy = hoyISO();
    const errorFecha = pideFecha && fechaEst && fechaEst < hoy ? "La fecha estimada no puede ser anterior a hoy." : "";
    const errorNota = nota.length > 300 ? "La nota no puede superar 300 caracteres." : "";

    const confirmar = async () => {
        if (!sel || saving || errorFecha || errorNota) return;
        setSaving(true);
        try {
            await onConfirm(selID, {
                nota: nota.trim() || undefined,
                fechaEstimadaEntrega: pideFecha && fechaEst ? fechaEst : undefined,
            });
        } finally { setSaving(false); }
    };

    return (
        <div className="vt-overlay" style={{ zIndex: 1060 }} onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose?.(); }}>
            <style>{VT_CSS}{`
                .vt-opt { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:1.5px solid #e2e8f0; background:#fff; border-radius:12px; padding:10px 14px; cursor:pointer; font-family:'Outfit',sans-serif; transition:border-color .15s, background .15s, transform .15s; }
                .vt-opt:hover { border-color:#c7d9ff; background:#fafcff; transform:translateX(2px); }
                .vt-opt.on { border-width:2px; padding:9.5px 13.5px; }
                .vt-radio { width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
            `}</style>
            <div className="vt-modal" style={{ maxWidth: 500 }}>
                <div className="vt-mhead" style={{ padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{titulo}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.7)" }}>Venta #{venta.VentaID} · {venta.usuario?.Nombre || `Doc: ${venta.DocumentoID}`} · {fmtCOP(venta.Total)}</p>
                        </div>
                        <button className="vt-mclose" onClick={onClose} disabled={saving} aria-label="Cerrar"><FaTimes size={13} /></button>
                    </div>
                </div>
                <div className="vt-mbody" style={{ background: C.white, padding: "18px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontSize: 12, color: VT.muted, fontWeight: 600, flexWrap: "wrap" }}>
                        Estado actual <EstadoBadge id={venta.EstadoID} nombre={venta.estado?.Nombre} />
                        {sel && <><span style={{ fontSize: 16, color: "#94a3b8" }}>→</span><EstadoBadge id={selID} /></>}
                    </div>
                    {aviso && (
                        <div style={{ background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#92400e", fontWeight: 600, display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <FaInfoCircle style={{ marginTop: 2, flexShrink: 0 }} /> {aviso}
                        </div>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 700, color: VT.navy, margin: "0 0 8px" }}>Seleccione el nuevo estado</p>
                    {opciones.length === 0 && (
                        <p style={{ fontSize: 13, color: VT.muted, margin: "0 0 8px" }}>Este pedido está en un estado final: ya no admite cambios de estado.</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="radiogroup" aria-label="Nuevo estado">
                        {opciones.map(e => {
                            const s = estiloEstado(e.EstadoID);
                            const on = selID === e.EstadoID;
                            return (
                                <button key={e.EstadoID} type="button" role="radio" aria-checked={on} data-estado={e.EstadoID}
                                    className={`vt-opt ${on ? "on" : ""}`} onClick={() => setSel(String(e.EstadoID))}
                                    style={on ? { borderColor: s.color, background: s.bg } : undefined}>
                                    <span className="vt-radio" style={on ? { borderColor: s.color } : undefined}>{on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ display: "block", fontWeight: 700, fontSize: 13.5, color: on ? s.color : VT.navy }}>{e.Nombre}</span>
                                        {e.Descripcion && <span style={{ display: "block", fontSize: 11.5, color: VT.muted }}>{e.Descripcion}</span>}
                                    </span>
                                    <span className="vt-dot" style={{ background: s.color, width: 9, height: 9 }} />
                                </button>
                            );
                        })}
                    </div>
                    {sel && (
                        <CamposNotaFecha nota={nota} setNota={setNota} fecha={fechaEst} setFecha={setFechaEst}
                            pideFecha={pideFecha} errorFecha={errorFecha} errorNota={errorNota} />
                    )}
                    {selID === 12 && (
                        <div style={{ marginTop: 12, background: devuelveStock ? VT.successSoft : C.dangerSoft, border: `1px solid ${devuelveStock ? VT.successBorder : C.dangerBorder}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: devuelveStock ? "#166534" : "#991b1b", fontWeight: 600 }}>
                            {devuelveStock
                                ? `Se devolverán ${unidades} unidad(es) al inventario. `
                                : "El pedido ya entró a producción: el stock NO se devuelve al inventario. "}
                            {venta.EstadoID !== ESTADO_VENTA.PENDIENTE && "Como ya estaba pagado, quedará un reembolso pendiente. "}
                            Una venta cancelada no se puede reactivar.
                        </div>
                    )}
                    {selID === ESTADO_VENTA.PENDIENTE && venta.EstadoID !== ESTADO_VENTA.PENDIENTE && (
                        <div style={{ marginTop: 12, background: VT.warningSoft, border: `1px solid ${VT.warningBorder}`, borderRadius: 12, padding: "10px 14px", fontSize: 12.5, color: "#92400e", fontWeight: 600 }}>
                            La venta volverá al módulo de Pedidos Pendientes.
                        </div>
                    )}
                </div>
                <div className="vt-mfoot">
                    <button className="vt-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button className="vt-btn-primary vt-confirm-estado" onClick={confirmar} disabled={!sel || saving || !!errorFecha || !!errorNota}
                        style={selID === 12 ? { background: VT.danger, boxShadow: "0 4px 14px rgba(220,38,38,.3)" } : undefined}>
                        {saving && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: C.white, borderRadius: "50%", animation: "vtSpin .7s linear infinite" }} />}
                        {selID === 12 ? "Cancelar venta" : "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EstadoVentaModal;
