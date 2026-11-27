import { C } from "../../config/tokens";

export const Badge = ({ type, children, dot }) => (
  <span className={`cz-badge ${type}`}>{dot && <span className="cz-dot" />}{children}</span>
);

export const ActionBtn = ({ onClick, title, color, children, disabled }) => (
  <button className="cz-act" onClick={onClick} title={title} aria-label={title} disabled={disabled}
    style={{ borderColor: `${color}33`, background: `${color}10`, color }}>{children}</button>
);

/* ── Modal imagen ampliada ── */
export const ImagenModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="cz-overlay" style={{ zIndex: 1070, background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div style={{ animation: "cz-pop .3s ease" }} onClick={e => e.stopPropagation()}>
        <img src={src} alt="Vista ampliada"
          style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", background: C.white }} />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="cz-btn red" onClick={onClose} style={{ borderRadius: 24, padding: "9px 24px" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
