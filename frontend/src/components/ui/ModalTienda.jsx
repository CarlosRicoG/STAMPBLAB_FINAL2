import { useId } from "react";
import { C } from "../../config/tokens";
import useEscape from "../../hooks/useEscape";
import useFocoModal from "../../hooks/useFocoModal";

/*
 * Modal base de la tienda ("Cotizar"): cabecera de color con título/subtítulo, cuerpo con scroll y pie opcional.
 * Accesible: role="dialog", aria-modal, título enlazado (aria-labelledby), cierre con Escape (llama a onClose;
 * si onClose no hace nada, como el aviso de inicio de sesión, Escape tampoco) y foco dentro mientras está abierto.
 * La animación "cotModal" y la clase .cot-overlay las define la página que lo usa.
 */
const ModalTienda = ({ open, onClose, title, subtitle, accentColor = C.navy, maxWidth = 680, children, footer }) => {
    const tituloId = useId();
    useEscape(onClose, !!open);
    const dialogoRef = useFocoModal(!!open);
    if (!open) return null;
    return (
        <div className="cot-overlay" style={{ position: "fixed", inset: 0, background: "rgba(10,16,30,0.62)", backdropFilter: "blur(6px)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1} ref={dialogoRef}
                style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "cotModal 0.45s cubic-bezier(.34,1.56,.64,1)", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", outline: "none" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ background: accentColor, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p id={tituloId} style={{ margin: 0, fontWeight: 800, fontSize: 17, color: C.white, fontFamily: "'Outfit',sans-serif" }}>{title}</p>
                        {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Outfit',sans-serif" }}>{subtitle}</p>}
                    </div>
                </div>
                <div style={{ overflowY: "auto", flex: 1, padding: "22px 24px" }}>{children}</div>
                {footer && <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>{footer}</div>}
            </div>
        </div>
    );
};

export default ModalTienda;
