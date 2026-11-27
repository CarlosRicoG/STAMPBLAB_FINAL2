import { FaCreditCard, FaTruck, FaCheck, FaBan, FaStore } from "react-icons/fa";
import { C } from "../../config/tokens";
import { VT, ESTADOS_VENTA, FLUJO_VENTA, estiloEstado } from "./ventasUi";

export const EstadoBadge = ({ id, nombre, size = "sm" }) => {
    const s = estiloEstado(id ?? nombre);
    const label = nombre || s.nombre;
    return (
        <span className={`vt-badge vt-badge-${size}`} style={{ background: s.bg, color: s.color, borderColor: s.border }}>
            <span className="vt-dot" style={{ background: s.color }} />
            {label}
        </span>
    );
};

/* ── Timeline de estado ── */
export const TimelineEstado = ({ estadoID }) => {
    if (estadoID === 12) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.dangerSoft, border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
                <FaBan /> Esta venta fue cancelada. El flujo del pedido se detuvo.
            </div>
        );
    }
    const idx = FLUJO_VENTA.indexOf(estadoID);
    return (
        <div className="vt-timeline">
            {FLUJO_VENTA.map((id, i) => {
                const cls = idx < 0 ? "" : i < idx ? "done" : i === idx ? (id === 11 ? "done" : "current") : "";
                return (
                    <div key={id} className={`vt-step ${cls}`}>
                        <div className="vt-step-dot">{(cls === "done" || cls === "current") && <FaCheck size={10} />}</div>
                        <div className="vt-step-lbl">{ESTADOS_VENTA[id].nombre}</div>
                    </div>
                );
            })}
        </div>
    );
};

/* ── Indicador compacto del método de pago (para tablas) ── */
export const MetodoPagoMini = ({ metodo }) => {
    if (metodo === "transferencia") return <span title="Transferencia" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: VT.accent }}><FaCreditCard size={10} /> Transferencia</span>;
    if (metodo === "contraentrega") return <span title="Contraentrega" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: VT.success }}><FaTruck size={10} /> Contraentrega</span>;
    return <span title="Venta presencial" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FaStore size={10} /> Presencial</span>;
};
