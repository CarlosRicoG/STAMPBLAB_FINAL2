import { useEffect, useState } from "react";

const CLAVE = "cf_sidebar_collapsed"; // misma clave que usa el menú lateral

/**
 * Botón de hamburguesa de la barra superior: abre y cierra el menú lateral.
 * Se comunica con el menú por eventos (sidebar.jsx escucha "stamplab:menu-toggle" y avisa su estado con "stamplab:menu-estado").
 */
export default function BotonMenu() {
    const [abierto, setAbierto] = useState(() => {
        try { return localStorage.getItem(CLAVE) !== "1"; } catch { return true; }
    });

    useEffect(() => {
        const alCambiar = (e) => setAbierto(Boolean(e.detail?.abierto));
        window.addEventListener("stamplab:menu-estado", alCambiar);
        return () => window.removeEventListener("stamplab:menu-estado", alCambiar);
    }, []);

    return (
        <>
            <style>{`
                .hb-btn { width: 42px; height: 42px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #f8fafc; cursor: pointer; padding: 0;
                    display: grid; place-items: center; transition: background .18s, border-color .18s, box-shadow .18s, transform .18s; flex-shrink: 0; }
                .hb-btn:hover { background: #1a2540; border-color: #1a2540; box-shadow: 0 6px 16px rgba(26,37,64,.25); transform: translateY(-1px); }
                .hb-btn:active { transform: scale(.94); }
                .hb-btn:focus-visible { outline: 3px solid #4f8ef7; outline-offset: 2px; }
                .hb-lines { width: 18px; height: 14px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; }
                .hb-lines i { display: block; height: 2px; border-radius: 2px; background: #1a2540; transition: width .22s, transform .25s, background .18s, opacity .18s; }
                .hb-lines i:nth-child(1) { width: 18px; } .hb-lines i:nth-child(2) { width: 12px; } .hb-lines i:nth-child(3) { width: 18px; }
                .hb-btn:hover .hb-lines i { background: #fff; }
                .hb-btn:hover .hb-lines i:nth-child(2) { width: 18px; }
                /* menú cerrado: las líneas se alinean al otro lado para que se note el cambio */
                .hb-btn[aria-expanded="false"] .hb-lines { align-items: flex-end; }
                @media (prefers-reduced-motion: reduce) { .hb-btn, .hb-lines i { transition: none; } }
            `}</style>
            <button type="button" className="hb-btn" aria-label={abierto ? "Cerrar el menú lateral" : "Abrir el menú lateral"} aria-expanded={abierto}
                title={abierto ? "Ocultar menú" : "Mostrar menú"} onClick={() => window.dispatchEvent(new Event("stamplab:menu-toggle"))}>
                <span className="hb-lines" aria-hidden="true"><i /><i /><i /></span>
            </button>
        </>
    );
}
