import { useState, useEffect, useRef } from "react";
import { getCarritoServidor, guardarCarritoServidor } from "../../../Services/api-carrito/carrito";
import { fusionarCarritos, actualizarPreciosCarrito, agregarItemCarrito, productoDelCatalogo } from "../../../utils/clienteUtils";
import { CART_KEY, saveCart, loadCart } from "./catalogoComun";

/**
 * Carrito del catálogo de la tienda.
 *  - Se carga del navegador (localStorage) y se guarda en cada cambio.
 *  - Con sesión: al montar se fusiona con el carrito del servidor (si el servidor falla, sigue el local) y,
 *    solo después de esa fusión, cada cambio se sube al servidor con una espera de ~800 ms.
 *  - Con el catálogo cargado (productos/tallas) pone al día los precios guardados.
 *
 * @param {{ productos?: Array, tallas?: Array }} catalogo  el catálogo ya cargado (vacío mientras carga)
 */
export default function useCarrito({ productos = [], tallas = [] } = {}) {
    const [cart, setCart] = useState(() => loadCart());
    const carritoSincronizado = useRef(false); // true cuando ya se fusionó con el servidor (solo entonces se sube)

    useEffect(() => { saveCart(cart); }, [cart]);

    // Al entrar con sesión: fusionar el carrito local con el del servidor (si el servidor falla, sigue el local)
    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        let vivo = true;
        getCarritoServidor().then((remoto) => {
            if (!vivo || remoto === null) return;
            carritoSincronizado.current = true;
            setCart((prev) => {
                const fusionado = fusionarCarritos(prev, remoto);
                return JSON.stringify(fusionado) === JSON.stringify(prev) ? prev : fusionado;
            });
        });
        return () => { vivo = false; };
    }, []);

    // Con el catálogo cargado: poner al día los precios guardados en el carrito (si el precio subió, el servidor
    // rechazaría el pedido una y otra vez hasta que el cliente quitara y volviera a agregar el producto)
    useEffect(() => {
        if (!productos.length) return;
        setCart((prev) => {
            const alDia = actualizarPreciosCarrito(prev, productos, tallas);
            if (alDia !== prev) saveCart(alDia);
            return alDia;
        });
    }, [productos, tallas]);

    // Guardar en el servidor con espera de ~800 ms tras el último cambio
    useEffect(() => {
        if (!carritoSincronizado.current || !localStorage.getItem("token")) return undefined;
        const t = setTimeout(() => { guardarCarritoServidor(cart); }, 800);
        return () => clearTimeout(t);
    }, [cart]);

    /**
     * Agrega (o edita con editIdx) sin pasar del stock de la variante; guarda en el navegador con o sin sesión.
     * El tope sale del producto ACTUAL del catálogo cargado (no de la copia guardada en el carrito, que puede estar
     * vieja o venir del servidor sin inventario); si no está en el catálogo o no trae inventario, no se limita.
     * @returns el resultado de agregarItemCarrito ({ carrito, cantidad, limitado, stock })
     */
    const agregar = (item, editIdx = null) => {
        const actual = productoDelCatalogo(item, productos);
        const productoStock = actual && Array.isArray(actual.inventario) ? actual : null;
        const r = agregarItemCarrito(cart, item, editIdx, { productoStock });
        if (r.carrito !== cart) { setCart(r.carrito); }
        saveCart(r.carrito); // con o sin sesión: el carrito local se fusiona con el del servidor al iniciar sesión
        return r;
    };

    const quitar = (idx) => setCart(prev => { const u = prev.filter((_, i) => i !== idx); saveCart(u); return u; });

    const cambiarCantidad = (idx, qty) => {
        if (qty < 1) { quitar(idx); return; }
        setCart(prev => { const u = prev.map((item, i) => i === idx ? { ...item, cantidad: qty } : item); saveCart(u); return u; });
    };

    const vaciar = () => {
        setCart([]);
        localStorage.removeItem(CART_KEY);
    };

    /** Vuelve a leer el carrito guardado en el navegador (p. ej. tras "Volver a pedir"). */
    const recargarLocal = () => setCart(loadCart());

    const totalUnidades = cart.reduce((s, i) => s + i.cantidad, 0);

    return { cart, agregar, quitar, cambiarCantidad, vaciar, recargarLocal, guardarLocal: saveCart, totalUnidades };
}
