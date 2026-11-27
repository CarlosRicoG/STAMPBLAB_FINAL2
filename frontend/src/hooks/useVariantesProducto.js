import { useState, useEffect, useRef } from "react";

/**
 * Variantes (inventario) del producto elegido, sin carreras: cada cambio de producto invalida la petición
 * anterior (id de petición + AbortController), así una respuesta tardía no pisa las variantes del nuevo.
 *
 * @param {number|string|null} productoID  producto elegido (null/undefined: ninguno)
 * @param {object} opciones
 * @param {(id, opcionesFetch?: {signal}) => Promise<Array>} opciones.cargar  pide las variantes (recibe { signal } si hay AbortController)
 * @param {boolean} [opciones.activo=true]  si es false no se cargan (p. ej. "traes tu prenda") y se limpian
 * @param {(v) => boolean} [opciones.filtrar]  qué variantes se quedan (por defecto todas)
 * @param {(variantes: Array) => void} [opciones.alCargar]  tras una carga vigente (ya filtradas)
 * @param {(error) => void} [opciones.alFallar]  si falla una carga vigente (las variantes quedan [])
 * @param {() => void} [opciones.alLimpiar]  cuando no hay producto o está inactivo (las variantes quedan [])
 * @returns {[Array, Function]} [variantes, setVariantes]
 */
export default function useVariantesProducto(productoID, opciones = {}) {
    const [variantes, setVariantes] = useState([]);
    const peticion = useRef(0);
    const ops = useRef(opciones);
    useEffect(() => { ops.current = opciones; });
    const activo = opciones.activo ?? true;
    const hayProducto = productoID !== null && productoID !== undefined;

    useEffect(() => {
        const id = ++peticion.current;
        const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const signal = ctrl?.signal;
        const vigente = () => id === peticion.current && !signal?.aborted;
        if (hayProducto && activo) {
            (async () => {
                try {
                    const res = await ops.current.cargar(productoID, signal ? { signal } : undefined);
                    if (!vigente()) return; // respuesta vieja: la ignoramos
                    if (!Array.isArray(res)) { setVariantes([]); return; }
                    const filtrar = ops.current.filtrar;
                    const lista = filtrar ? res.filter(filtrar) : res;
                    setVariantes(lista);
                    ops.current.alCargar?.(lista);
                } catch (e) {
                    if (!vigente()) return;
                    setVariantes([]);
                    ops.current.alFallar?.(e);
                }
            })();
        } else {
            setVariantes([]);
            ops.current.alLimpiar?.();
        }
        return () => ctrl?.abort();
    }, [productoID, hayProducto, activo]);

    return [variantes, setVariantes];
}
