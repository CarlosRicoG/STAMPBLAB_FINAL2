/**
 * Pide una lista a la API con fetch y comprueba la respuesta: si el servidor responde con error
 * (res.ok falso) lanza un Error con el estado; si responde bien pero sin arreglo, devuelve [].
 * Acepta { datos: [...] } o el arreglo directo.
 */
export async function pedirLista(url, opciones) {
    const r = await fetch(url, opciones);
    if (!r.ok) throw new Error(`Error ${r.status}`);
    const d = await r.json();
    const lista = d && typeof d === "object" && "datos" in d ? d.datos : d;
    return Array.isArray(lista) ? lista : [];
}

/**
 * Carga varias listas a la vez sin que una caída tumbe a las demás.
 * @param {Record<string, () => Promise<Array>>} cargadores
 * @returns {Promise<{ listas: Record<string, Array>, fallidas: string[] }>} las fallidas quedan como []
 */
export async function cargarListas(cargadores) {
    const claves = Object.keys(cargadores);
    const res = await Promise.allSettled(claves.map((k) => cargadores[k]()));
    const listas = {};
    const fallidas = [];
    res.forEach((r, i) => {
        const k = claves[i];
        if (r.status === "fulfilled" && Array.isArray(r.value)) listas[k] = r.value;
        else { listas[k] = []; fallidas.push(k); }
    });
    return { listas, fallidas };
}
