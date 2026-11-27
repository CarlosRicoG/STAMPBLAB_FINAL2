import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../dashboard/layout/sidebar";
import NavAdmin from "../dashboard/layout/NavAdmin";
import usePlus from "../../hooks/usePlus";
import useEsMovil from "../dashboard/layout/useEsMovil";

/*
 * Por debajo de 768 px el menú lateral es un panel desplegable (por encima del contenido) que abre el botón de
 * menú de la barra superior y se cierra al navegar, con Escape o al tocar fuera. Desde 768 px todo queda igual
 * que antes (columna fija a la izquierda). Las reglas solo existen dentro de la media query.
 */
const CSS_MOVIL = `
@media (max-width: 767.98px) {
  .dl-aside { position: fixed; top: 0; left: 0; bottom: 0; z-index: 1045; transform: translateX(-100%); visibility: hidden;
    transition: transform .25s cubic-bezier(.4,0,.2,1), visibility .25s; }
  .dl-aside.abierto { transform: none; visibility: visible; box-shadow: 0 0 40px rgba(15,23,42,.35); }
  .dl-backdrop { position: fixed; inset: 0; z-index: 1040; background: rgba(15,23,42,.5); animation: dlFade .2s ease; }
  @keyframes dlFade { from { opacity: 0; } to { opacity: 1; } }
}
@media (max-width: 767.98px) and (prefers-reduced-motion: reduce) { .dl-aside { transition: none; } }
`;

const enfocarBotonMenu = () => document.querySelector(".hb-btn")?.focus();

const DashboardLayout = () => {
    usePlus(); // efectos compartidos (revelado, brillo de tarjetas) para todo el panel
    const esMovil = useEsMovil();
    const { pathname } = useLocation();
    const [menuMovil, setMenuMovil] = useState(false);

    // Se cierra al navegar y al pasar a escritorio (ajuste de estado durante el render, sin efecto)
    const [ruta, setRuta] = useState(pathname);
    if (ruta !== pathname) { setRuta(pathname); if (menuMovil) setMenuMovil(false); }
    if (!esMovil && menuMovil) setMenuMovil(false);

    // En móvil el botón de menú de la barra superior abre/cierra el panel (en escritorio lo atiende el menú lateral)
    useEffect(() => {
        if (!esMovil) return undefined;
        const alternar = () => setMenuMovil((a) => !a);
        window.addEventListener("stamplab:menu-toggle", alternar);
        return () => window.removeEventListener("stamplab:menu-toggle", alternar);
    }, [esMovil]);

    // Avisa al botón de menú si el panel está abierto (aria-expanded)
    useEffect(() => {
        if (esMovil) window.dispatchEvent(new CustomEvent("stamplab:menu-estado", { detail: { abierto: menuMovil } }));
    }, [esMovil, menuMovil]);

    // Abierto: foco al primer enlace del panel y Escape lo cierra devolviendo el foco al botón de menú
    useEffect(() => {
        if (!esMovil || !menuMovil) return undefined;
        document.querySelector("#panel-menu-lateral a, #panel-menu-lateral button")?.focus();
        const alTeclear = (e) => { if (e.key === "Escape") { setMenuMovil(false); enfocarBotonMenu(); } };
        window.addEventListener("keydown", alTeclear);
        return () => window.removeEventListener("keydown", alTeclear);
    }, [esMovil, menuMovil]);

    const cerrarMenu = () => { setMenuMovil(false); enfocarBotonMenu(); };

    return (
        <div className="container-fluid vh-100">
            <style>{CSS_MOVIL}</style>
            <div className="row h-100">
                {/* Columna izquierda: Sidebar (en móvil, panel desplegable) */}
                <aside id="panel-menu-lateral" className={`col-2 text-white p-0 dl-aside${menuMovil ? " abierto" : ""}`}>
                    <Sidebar movil={esMovil} onCerrarMovil={cerrarMenu} />
                </aside>
                {esMovil && menuMovil && <div className="dl-backdrop" aria-hidden="true" onClick={cerrarMenu} />}

                {/* Columna derecha: Nav arriba y contenido abajo */}
                <div className="col-10 d-flex flex-column p-0">
                    {/* Navbar arriba */}
                    <header className="">
                        <NavAdmin />
                    </header>

                    {/* Contenido debajo del Navbar */}
                    <main className="flex-grow-1 p-4 bg-light overflow-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
