import { useEffect } from "react";
import { FaSearch, FaExclamationTriangle } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { STOCK_BAJO, TH, inputStyle, invalidStyle } from "./compraUtils";

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────────────────── */
export const Label = ({ children, required }) => (
    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5, display: "block", fontFamily: "'Outfit',sans-serif" }}>
        {children}{required && <span style={{ color: C.danger }}> *</span>}
    </label>
);

export const Input = ({ readOnly, invalid, style: sx, ...props }) => (
    <input {...props} readOnly={readOnly}
        style={{ ...inputStyle, ...(readOnly ? { background: C.bg, color: C.muted, cursor: "default" } : {}), ...(invalid ? invalidStyle : {}), ...sx }}
        onFocus={e => { if (!readOnly) { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 4px rgba(79,142,247,.12)"; } }}
        onBlur={e => { e.target.style.borderColor = invalid ? C.danger : C.border; e.target.style.boxShadow = "none"; }}
    />
);

export const Select = ({ children, invalid, ...props }) => (
    <select {...props} style={{ ...inputStyle, cursor: "pointer", appearance: "auto", ...(invalid ? invalidStyle : {}) }}>
        {children}
    </select>
);

export const FieldError = ({ msg }) => msg ? <p className="cp-err"><FaExclamationTriangle size={10} /> {msg}</p> : null;

export const Badge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        warning: { bg: C.warningSoft, color: C.warning, border: C.warningBorder },
        danger: { bg: C.dangerSoft, color: C.danger, border: C.dangerBorder },
        accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        violet: { bg: C.purpleSoft, color: C.violet, border: C.purpleBorder },
        navy: { bg: C.navy, color: C.white, border: C.navy },
        info: { bg: C.infoSoft, color: C.info, border: "#bae6fd" },
        muted: { bg: "#f1f5f9", color: C.muted, border: C.border },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            {children}
        </span>
    );
};

export const SectionTitle = ({ children, sub }) => (
    <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 18, borderRadius: 4, background: `linear-gradient(180deg, ${C.accent}, ${C.violet})` }} />
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>{children}</h5>
        </div>
        {sub && <p style={{ margin: "4px 0 0 14px", fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
);

export const Card = ({ children, style }) => (
    <div style={{ background: C.white, borderRadius: 16, padding: "22px 26px", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #f1f5f9", marginBottom: 20, ...style }}>
        {children}
    </div>
);

export const Btn = ({ variant = "primary", children, style: sx, ...props }) => {
    const variants = {
        primary: { background: C.navy, color: C.white, border: "none" },
        secondary: { background: "#f1f5f9", color: C.muted, border: "none" },
        success: { background: C.success, color: C.white, border: "none" },
        danger: { background: C.danger, color: C.white, border: "none" },
        outline: { background: "transparent", color: C.navy, border: `1.5px solid ${C.navy}` },
        "outline-danger": { background: "transparent", color: C.danger, border: `1.5px solid ${C.danger}` },
        "outline-accent": { background: "transparent", color: C.accent, border: `1.5px solid ${C.accent}` },
    };
    const v = variants[variant] || variants.primary;
    return (
        <button type="button" {...props} style={{
            ...v, borderRadius: 9, padding: "8px 18px", fontSize: 13, fontWeight: 700,
            cursor: props.disabled ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.18s",
            opacity: props.disabled ? 0.55 : 1, ...sx,
        }}
            onMouseEnter={e => { if (!props.disabled) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = props.disabled ? "0.55" : "1"; e.currentTarget.style.transform = "none"; }}
        >{children}</button>
    );
};

export const StockBadge = ({ stock }) => {
    const n = Number(stock) || 0;
    return <Badge type={n === 0 ? "danger" : n <= STOCK_BAJO ? "warning" : "success"}>{n}{n > 0 && n <= STOCK_BAJO ? " · bajo" : ""}</Badge>;
};

/* ─────────────────────────────────────────────────────────
   MODAL GENÉRICO
───────────────────────────────────────────────────────── */
export const Modal = ({ show, onHide, title, children, footer, size = "lg" }) => {
    useEffect(() => {
        if (!show) return;
        const onKey = e => { if (e.key === "Escape") onHide(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [show, onHide]);
    if (!show) return null;
    const maxW = { sm: 480, md: 640, lg: 820, xl: 1020 }[size] || 820;
    return (
        <div className="cp-overlay" onClick={onHide}>
            <div className="cp-modal" role="dialog" aria-modal="true" style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: maxW, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}
                onClick={e => e.stopPropagation()}>
                <div style={{ background: "radial-gradient(120% 160% at 100% 0%, rgba(124,58,237,.4) 0%, rgba(124,58,237,0) 55%), linear-gradient(120deg,#1a2540 0%,#2d3f6e 100%)", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.white, fontWeight: 700, fontSize: 15, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>{title}</span>
                    <button type="button" onClick={onHide} aria-label="Cerrar" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, width: 28, height: 28, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
                </div>
                <div style={{ overflowY: "auto", padding: "22px 24px", flex: 1 }}>{children}</div>
                {footer && <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>{footer}</div>}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   MODAL: TABLA BÚSQUEDA INSUMOS / PRODUCTOS
───────────────────────────────────────────────────────── */
export const SearchModal = ({ show, onHide, title, icon, searchValue, onSearch, placeholder, columns, rows, emptyMsg }) => (
    <Modal show={show} onHide={onHide} title={<>{icon}{title}</>} size="lg"
        footer={<Btn variant="secondary" onClick={onHide}>Cerrar</Btn>}>
        <div style={{ position: "relative", marginBottom: 18 }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
            <input value={searchValue} onChange={e => onSearch(e.target.value)} placeholder={placeholder} autoFocus
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border} />
        </div>
        <div style={{ overflowY: "auto", maxHeight: 380, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr>{columns.map((c, i) => <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 14px", position: "sticky", top: 0, background: C.navy }}>{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0
                        ? <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 36, color: C.muted }}>{emptyMsg}</td></tr>
                        : rows}
                </tbody>
            </table>
        </div>
    </Modal>
);

export const TR = ({ children, idx }) => (
    <tr className="det-row" style={{ background: idx % 2 === 0 ? C.white : "#fafbff" }}>
        {children}
    </tr>
);

export const TD = ({ children, center, muted }) => (
    <td style={{ padding: "11px 14px", color: muted ? C.muted : C.text, textAlign: center ? "center" : "left", fontSize: 13 }}>
        {children}
    </td>
);
