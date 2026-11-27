import { useEffect, useRef } from "react";

/*
 * Cierre con la tecla Escape para modales y paneles.
 * - Solo responde el modal abierto más reciente (pila): con dos capas, Escape cierra la de arriba.
 * - Si hay un SweetAlert MODAL visible, Escape es suyo (lo cierra Swal) y el modal de debajo no se toca.
 *   Los toasts de Swal (avisos pequeños en una esquina) no cuentan: con un toast, Escape sigue cerrando el modal.
 * Un único listener en document atiende a toda la pila.
 */
const pila = [];

/** true si hay un SweetAlert modal abierto (un toast no cuenta). */
export const hayAlertaModal = () => !!document.querySelector(".swal2-container .swal2-popup:not(.swal2-toast)");

const alPulsar = (e) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    if (hayAlertaModal()) return;
    const arriba = pila[pila.length - 1];
    if (arriba) arriba();
};

/**
 * @param {() => void} onClose  qué hacer al pulsar Escape (se usa siempre la versión más reciente)
 * @param {boolean} [activo=true]  solo escucha mientras sea true (p. ej. el estado "open" del modal)
 */
export default function useEscape(onClose, activo = true) {
    const ref = useRef(onClose);
    useEffect(() => { ref.current = onClose; });
    useEffect(() => {
        if (!activo) return undefined;
        const entrada = () => { if (typeof ref.current === "function") ref.current(); };
        pila.push(entrada);
        if (pila.length === 1) document.addEventListener("keydown", alPulsar);
        return () => {
            const i = pila.indexOf(entrada);
            if (i >= 0) pila.splice(i, 1);
            if (pila.length === 0) document.removeEventListener("keydown", alPulsar);
        };
    }, [activo]);
}
