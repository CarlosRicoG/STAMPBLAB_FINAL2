// Derechos del titular de los datos (Ley 1581 de 2012): descargar mis datos (acceso) y eliminar mi cuenta (supresión).
// El token se adjunta solo (utils/authInterceptors).
import axios from "axios";
import API_BASE from "../../config/api";

const API = `${API_BASE}/api`;

const dosDigitos = (n) => String(n).padStart(2, "0");
export const nombreArchivoDatos = (fecha = new Date()) =>
    `mis-datos-stamplab-${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}.json`;

/** Pide al servidor los datos propios y los descarga como archivo JSON. Devuelve el nombre del archivo. */
export async function descargarMisDatos(fecha = new Date()) {
    const { data } = await axios.get(`${API}/mi-cuenta/datos`);
    const nombre = nombreArchivoDatos(fecha);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    try {
        const a = document.createElement("a");
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        URL.revokeObjectURL(url);
    }
    return nombre;
}

/** Elimina la cuenta y los datos personales del usuario de la sesión. Exige la contraseña actual. */
export const suprimirMiCuenta = (contrasena) => axios.post(`${API}/mi-cuenta/suprimir`, { Contraseña: contrasena });
