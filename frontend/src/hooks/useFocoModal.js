import { useEffect, useRef } from "react";
import { hayAlertaModal } from "./useEscape";

/*
 * Foco de un modal accesible: al abrir lleva el foco al contenedor del diálogo (que debe tener tabIndex={-1})
 * y al cerrar lo devuelve al elemento que lo tenía antes (normalmente el botón que abrió el modal).
 * - No desplaza la página (preventScroll).
 * - Si al cerrar hay un SweetAlert modal abierto, no le roba el foco: Swal lo devuelve al cerrarse (un toast no cuenta).
 */
export default function useFocoModal(activo) {
    const ref = useRef(null);
    useEffect(() => {
        if (!activo) return undefined;
        const previo = document.activeElement;
        const el = ref.current;
        if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
        return () => {
            if (hayAlertaModal()) return;
            if (previo && previo !== document.body && typeof previo.focus === "function" && document.contains(previo)) {
                previo.focus({ preventScroll: true });
            }
        };
    }, [activo]);
    return ref;
}
