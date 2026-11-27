import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaDownload, FaTrashAlt, FaShieldAlt } from "react-icons/fa";
import { descargarMisDatos, suprimirMiCuenta } from "../../Services/api-cliente/miCuenta";
import { cerrarSesion } from "../../Services/api-auth/auth";
import { C } from "../../config/tokens";

/*
 * Derechos del titular (Ley 1581 de 2012): acceso (descargar mis datos) y supresión (eliminar mi cuenta).
 * Se muestra en "Mi cuenta".
 */
const CONSECUENCIAS = `
<p style="text-align:left;margin:0 0 10px">Esto <b>no se puede deshacer</b>. Al eliminar tu cuenta:</p>
<ul style="text-align:left;margin:0 0 10px;padding-left:20px;font-size:14px;line-height:1.6">
  <li>Borramos tu nombre, correo, teléfono y dirección, los datos de entrega y los comprobantes de tus pedidos, tus imágenes de diseño, tus notificaciones y tu carrito.</li>
  <li>Conservamos sin tus datos de contacto las cifras de tus compras y tu número de documento, porque la ley nos obliga a guardar los soportes contables.</li>
  <li>Se cierra tu sesión en todos tus dispositivos y ya no podrás entrar con esta cuenta.</li>
</ul>
<p style="text-align:left;margin:0;font-size:14px">Si tienes pedidos o cotizaciones en curso, primero deben terminar o cancelarse.
Te recomendamos <b>descargar tus datos</b> antes de continuar.</p>`;

const mensajeDe = (err, porDefecto) => err?.response?.data?.mensaje || err?.response?.data?.message || porDefecto;

const MisDatosPersonales = () => {
    const navigate = useNavigate();
    const [descargando, setDescargando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    const descargar = async () => {
        setDescargando(true);
        try {
            await descargarMisDatos();
        } catch (err) {
            Swal.fire({ icon: "error", title: "No pudimos descargar tus datos", text: mensajeDe(err, "Intenta de nuevo en unos minutos."), confirmButtonColor: C.danger });
        } finally {
            setDescargando(false);
        }
    };

    const eliminar = async () => {
        const { isConfirmed, value } = await Swal.fire({
            icon: "warning",
            title: "¿Eliminar tu cuenta y tus datos?",
            html: CONSECUENCIAS,
            input: "password",
            inputLabel: "Escribe tu contraseña actual para confirmar",
            inputAttributes: { autocomplete: "current-password", "aria-label": "Contraseña actual" },
            inputValidator: (v) => (!v ? "Escribe tu contraseña" : undefined),
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar mi cuenta",
            cancelButtonText: "Cancelar",
            confirmButtonColor: C.danger,
            cancelButtonColor: C.muted,
            focusCancel: true,
        });
        if (!isConfirmed || !value) return;

        setEliminando(true);
        try {
            await suprimirMiCuenta(value);
        } catch (err) {
            const estado = err?.response?.status;
            setEliminando(false);
            Swal.fire({
                icon: estado === 409 ? "warning" : "error",
                title: estado === 409 ? "Todavía no podemos eliminar tu cuenta" : "No se pudo eliminar tu cuenta",
                text: mensajeDe(err, "Intenta de nuevo en unos minutos."),
                confirmButtonColor: C.navy,
            });
            return;
        }
        // El servidor ya invalidó todas las sesiones: se quita el token antes de cerrar sesión para que el aviso al
        // servidor (que respondería 401) no dispare la redirección automática a /login.
        try { localStorage.removeItem("token"); } catch { /* sin almacenamiento */ }
        await cerrarSesion();
        await Swal.fire({ icon: "success", title: "Tu cuenta fue eliminada", text: "Eliminamos tu cuenta y tus datos personales. Gracias por haber confiado en StampLab.", confirmButtonColor: C.navy });
        navigate("/", { replace: true });
    };

    return (
        <section className="mcu-panel sx-reveal" aria-labelledby="mcu-datos" style={{ marginTop: 22 }}>
            <h2 id="mcu-datos">Tus datos personales</h2>
            <p className="ck-muted" style={{ marginTop: 0 }}>
                <FaShieldAlt color={C.accent} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                Puedes descargar una copia de tus datos o pedirnos que los eliminemos. Consulta la{" "}
                <Link to="/privacidad">Política de Tratamiento de Datos Personales</Link>.
            </p>
            <div className="ck-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button type="button" className="ck-btn ghost" onClick={descargar} disabled={descargando || eliminando}>
                    <FaDownload size={12} /> {descargando ? "Preparando..." : "Descargar mis datos"}
                </button>
                <button type="button" className="ck-btn" onClick={eliminar} disabled={descargando || eliminando}
                    style={{ background: C.dangerSoft, color: C.danger, border: `1.5px solid ${C.dangerBorder}` }}>
                    <FaTrashAlt size={12} /> {eliminando ? "Eliminando..." : "Eliminar mi cuenta y mis datos"}
                </button>
            </div>
        </section>
    );
};

export default MisDatosPersonales;
