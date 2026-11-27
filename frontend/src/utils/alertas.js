import Swal from "sweetalert2";

/**
 * SweetAlert por encima de los modales propios (que usan z-index altos). Hay dos formas en la app y se
 * conservan las dos tal cual:
 *  - swalTop: añade la clase "swal-ontop" al contenedor (la regla CSS la define la página que la usa).
 *  - swalEncima: sube el z-index del contenedor a 99999 al abrir (no necesita CSS).
 */
export const swalTop = (opts) => Swal.fire({ ...opts, customClass: { container: "swal-ontop", ...(opts.customClass || {}) } });

export const swalEncima = (opts) => Swal.fire({
    ...opts,
    didOpen: () => {
        const c = document.querySelector(".swal2-container");
        if (c) c.style.zIndex = "99999";
    },
});
