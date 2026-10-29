/**
 * Tokens de diseño de STAMPLAB: FUENTE ÚNICA de los colores usados en estilos en línea (`style={{ color: C.navy }}`).
 * Antes cada pantalla tenía su propia copia de este objeto; ahora todas importan de aquí, así que un valor se cambia en un solo lugar.
 * Los valores son los mismos que ya usaba la interfaz.
 */
export const C = Object.freeze({
    // Marca / navegación
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyDeep: "linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%)",
    navyHover: "#243050",

    // Acentos
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    violet: "#7c3aed",
    purple: "#7c3aed",
    purpleSoft: "#f5f3ff",
    purpleBorder: "#ddd6fe",

    // Estados
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    info: "#0369a1",
    infoSoft: "#e0f2fe",

    // Neutros
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
    white: "#ffffff",
});
