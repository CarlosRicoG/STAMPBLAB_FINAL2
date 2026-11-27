import { useEffect, useState } from "react";

/** Mismo corte que Bootstrap "md": por debajo de 768 px el panel usa el menú desplegable. */
export const CONSULTA_MOVIL = "(max-width: 767.98px)";

export const esPantallaMovil = () => {
    try { return typeof window !== "undefined" && !!window.matchMedia?.(CONSULTA_MOVIL).matches; } catch { return false; }
};

/** true mientras la ventana mide menos de 768 px (se actualiza al girar o redimensionar). */
export default function useEsMovil() {
    const [movil, setMovil] = useState(esPantallaMovil);
    useEffect(() => {
        const mq = typeof window !== "undefined" ? window.matchMedia?.(CONSULTA_MOVIL) : null;
        if (!mq) return undefined;
        const alCambiar = (e) => setMovil(e.matches);
        mq.addEventListener?.("change", alCambiar);
        return () => mq.removeEventListener?.("change", alCambiar);
    }, []);
    return movil;
}
