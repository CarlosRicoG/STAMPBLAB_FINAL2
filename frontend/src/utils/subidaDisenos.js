import API_ROOT from "../config/api.js";

/** Tipos y tamaño máximo (MB) aceptados para la imagen de un diseño (página "Cotizar" y formulario del panel). */
export const TIPOS_IMAGEN_DISENO = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
export const MAX_MB_DISENO = 5;

/**
 * Sube la imagen de un diseño a /api/cotizaciones/upload-diseno y devuelve el nombre que asignó el servidor.
 * Lanza un Error con el mensaje del backend si la subida falla (p. ej. el límite de subidas por hora).
 */
export async function subirImagenDiseno(archivo) {
    const fd = new FormData();
    fd.append("imagen", archivo);
    const r = await fetch(`${API_ROOT}/api/cotizaciones/upload-diseno`, { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.filename) throw new Error(d.message || d.mensaje || "No se pudo subir la imagen de un diseño. Intenta de nuevo.");
    return d.filename;
}

/**
 * Devuelve una función `subir(archivo)` que recuerda lo ya subido: si el envío de la cotización falla y el usuario
 * reintenta, las imágenes que ya subieron NO se vuelven a subir (el backend limita las subidas por hora).
 * La clave es el propio objeto File: si el usuario cambia la imagen de un diseño es otro File y sí se sube.
 * Una subida fallida se olvida para que el reintento la repita. Dos llamadas simultáneas con el mismo archivo
 * comparten una sola subida.
 */
export function crearSubidorDisenos(subirArchivo = subirImagenDiseno) {
    const subidos = new WeakMap(); // File -> Promise<nombre en el servidor>
    return (archivo) => {
        if (!archivo) return Promise.resolve(null);
        let promesa = subidos.get(archivo);
        if (!promesa) {
            promesa = Promise.resolve().then(() => subirArchivo(archivo));
            subidos.set(archivo, promesa);
            promesa.catch(() => { if (subidos.get(archivo) === promesa) subidos.delete(archivo); });
        }
        return promesa;
    };
}
