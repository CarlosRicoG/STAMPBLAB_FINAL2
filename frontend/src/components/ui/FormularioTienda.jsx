import { C } from "../../config/tokens";

/* ═══════════════════════════════════════════════════════════
   Piezas de formulario de la tienda (estilos en línea, fuente Outfit).
   Las usa "Cotizar" (CotizacionesL). Las animaciones de .cot-btn / .cot-card / .cot-ico
   las define la página que las usa.
   ═══════════════════════════════════════════════════════════ */

export const Label = ({ children, required }) => (
    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Outfit',sans-serif" }}>
        {children}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
    </p>
);

export const InputBase = ({ style, ...props }) => (
    <input {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px rgba(79,142,247,0.16), 0 8px 22px rgba(79,142,247,0.16)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

export const SelectBase = ({ style, ...props }) => (
    <select {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, cursor: "pointer", ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px rgba(79,142,247,0.16), 0 8px 22px rgba(79,142,247,0.16)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

export const TextareaBase = ({ style, ...props }) => (
    <textarea {...props} style={{
        width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`,
        borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif",
        color: C.text, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
        background: C.white, resize: "vertical", ...style
    }}
        onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 4px rgba(79,142,247,0.16), 0 8px 22px rgba(79,142,247,0.16)`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
);

export const SectionCard = ({ title, subtitle, icon, accentColor = C.accent, children, headerRight }) => (
    <div className="cot-card sx-reveal" style={{ background: C.white, borderRadius: 18, border: `1.5px solid ${C.border}`, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "16px 22px", borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: `linear-gradient(90deg, ${accentColor}08 0%, transparent 100%)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="cot-ico" style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}15`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, fontSize: 15 }}>
                    {icon}
                </div>
                <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{title}</p>
                    {subtitle && <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>{subtitle}</p>}
                </div>
            </div>
            {headerRight}
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
);

export const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style, className = "", ...rest }) => {
    const variants = {
        primary: { bg: C.navyGrad, color: C.white, border: "none" },
        success: { bg: `linear-gradient(90deg, #16a34a, #15803d)`, color: C.white, border: "none" },
        danger: { bg: C.dangerSoft, color: C.danger, border: `1.5px solid ${C.dangerBorder}` },
        ghost: { bg: "transparent", color: C.muted, border: `1.5px solid ${C.border}` },
        accent: { bg: `linear-gradient(90deg, #4f8ef7, #7c3aed)`, color: C.white, border: "none" },
        warning: { bg: C.warningSoft, color: C.warning, border: `1.5px solid ${C.warningBorder}` },
    };
    const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 13 }, lg: { padding: "13px 28px", fontSize: 14 } };
    const v = variants[variant]; const s = sizes[size];
    return (
        <button onClick={onClick} disabled={disabled} {...rest} className={`cot-btn ${className}`} style={{ position: "relative", overflow: "hidden",
            ...v, ...s, borderRadius: 10, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
            cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center",
            gap: 7, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...style
        }}
        >
            {children}
        </button>
    );
};

export const InfoBadge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        warning: { bg: C.warningSoft, color: C.warning, border: C.warningBorder },
        danger: { bg: C.dangerSoft, color: C.danger, border: C.dangerBorder },
        info: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        purple: { bg: C.purpleSoft, color: C.purple, border: C.purpleBorder },
    };
    const s = map[type] || map.info;
    return (
        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            {children}
        </span>
    );
};
