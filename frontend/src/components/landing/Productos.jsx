import { useState, useEffect, useId } from "react";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate, useLocation } from "react-router-dom";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";
import { getConfigPublica, CONFIG_POR_DEFECTO } from "../../Services/api-cliente/cliente";
import usePlus from "../../hooks/usePlus";
import useEscape from "../../hooks/useEscape";
import useFocoModal from "../../hooks/useFocoModal";
import { FaSearch, FaBoxOpen, FaShoppingCart, FaEye, FaTimes, FaCheckCircle, FaRegSadTear } from "react-icons/fa";
import { C } from "../../config/tokens";
import { formatDinero } from "../../utils/formato";
import { swalTop } from "../../utils/alertas";
import { productoDelCatalogo } from "../../utils/clienteUtils";
import { coloresHex } from "./catalogo/catalogoComun";
import useCarrito from "./catalogo/useCarrito";
import ProductModal from "./catalogo/ProductModal";
import CartDrawer from "./catalogo/CartDrawer";
import PaymentModal from "./catalogo/PaymentModal";
import "./catalogo/catalogo.css";

const PER_PAGE = 8;

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
const ProductosLanding = () => {
    usePlus();
    const [search, setSearch] = useState("");
    const [productos, setProductos] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    const [page, setPage] = useState(1);
    const [filtroColor, setFiltroColor] = useState("");
    const [filtroTalla, setFiltroTalla] = useState("");
    const [cartOpen, setCartOpen] = useState(false);
    const [cartBounce, setCartBounce] = useState(false);
    const [productModal, setProductModal] = useState({ open: false, product: null, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [config, setConfig] = useState(CONFIG_POR_DEFECTO);
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, agregar, quitar, cambiarCantidad, vaciar, recargarLocal, guardarLocal, totalUnidades: cartTotal } = useCarrito({ productos, tallas });
    const exitoTituloId = useId();
    useEscape(() => setOrderSuccess(null), !!orderSuccess);
    const exitoRef = useFocoModal(!!orderSuccess);

    useEffect(() => { cargarDatos(); }, []);
    useEffect(() => { getConfigPublica().then(setConfig); }, []);

    // "Volver a pedir" navega aquí con el carrito ya cargado: lo abrimos
    useEffect(() => {
        if (location.state?.abrirCarrito) {
            recargarLocal();
            setCartOpen(true);
            navigate(location.pathname, { replace: true, state: null });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
    }, [location.state]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [pRes, tRes] = await Promise.all([getProductos(), getTallas()]);
            const data = pRes.datos || pRes;
            setProductos(data.filter(p => p.inventario?.some(i => i.Stock > 0 && i.Estado)));
            setTallas(tRes.datos || tRes);
        } catch (e) { console.error(e); }
        finally { setCargando(false); }
    };

    const obtenerPrecio = (p) => {
        const base = parseFloat(p.PrecioBase) || 0;
        const vars = p.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
        if (!vars.length) return base;
        const ids = [...new Set(vars.map(i => i.TallaID))].sort((a, b) => a - b);
        const tMin = tallas.find(t => t.TallaID === ids[0]);
        return base + (parseFloat(tMin?.Precio) || 0);
    };
    const obtenerColores = (p) => [...new Set(p.inventario?.filter(i => i.Stock > 0 && i.Estado).map(i => i.color?.Nombre).filter(Boolean))];
    const obtenerTallas = (p) => [...new Set(p.inventario?.filter(i => i.Stock > 0 && i.Estado).map(i => i.talla?.Nombre).filter(Boolean))];

    /* Abrir modal producto normal o edición de carrito */
    const openProductModal = (p, editIdx = null) => {
        if (editIdx !== null) {
            const item = cart[editIdx];
            // El modal usa el producto actual del catálogo (stock y variantes al día), no la copia guardada en el carrito
            const actual = productoDelCatalogo(item, productos);
            setProductModal({ open: true, product: actual || item.producto, editIdx, initColor: item.color, initTalla: item.talla, initQty: item.cantidad });
        } else {
            setProductModal({ open: true, product: p, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
        }
    };
    const closeProductModal = () => setProductModal(m => ({ ...m, open: false }));

    /* Agregar / editar en carrito */
    const handleAddToCart = ({ producto, color, talla, cantidad, precio }) => {
        const raw = localStorage.getItem("usuario");
        const { editIdx } = productModal;
        // Nunca por encima del stock de la variante (también al repetir producto+color+talla);
        // con o sin sesión se guarda en el navegador: se fusiona con el del servidor al iniciar sesión
        const r = agregar({ producto, color, talla, cantidad, precio }, editIdx);
        if (!raw) {
            swalTop({
                icon: "warning", title: "Inicia sesión para comprar",
                text: r.limitado
                    ? `Solo había ${r.stock} disponibles; tu carrito quedó con ${r.cantidad}. Tu carrito está guardado, no perderás nada.`
                    : "Tu carrito está guardado, no perderás nada.",
                confirmButtonText: "Iniciar sesión", cancelButtonText: "Cancelar",
                showCancelButton: true, confirmButtonColor: C.navy
            }).then(res => { if (res.isConfirmed) navigate("/login"); });
            return;
        }
        if (r.carrito !== cart) {
            setCartBounce(true);
            setTimeout(() => setCartBounce(false), 700);
        }
        if (r.limitado) {
            // Un solo aviso (Swal muestra uno a la vez): el de stock reemplaza al de "agregado"
            swalTop({
                icon: "warning", title: `Solo hay ${r.stock} en stock`,
                text: r.cantidad > 0 ? `Tu carrito quedó con ${r.cantidad} de esta combinación.` : undefined,
                timer: 2200, showConfirmButton: false
            });
            return;
        }
        swalTop({ icon: "success", title: editIdx !== null ? "Ítem actualizado" : `¡${producto.Nombre} agregado!`, timer: 1400, showConfirmButton: false, position: "top-end", toast: true });
    };

    const handleRemove = quitar;
    const handleUpdateQty = cambiarCantidad;

    /* Checkout */
    const handleCheckout = () => {
        const raw = localStorage.getItem("usuario");
        if (!raw) {
            guardarLocal(cart);
            swalTop({
                icon: "warning", title: "Inicia sesión para continuar",
                text: "Tu carrito está guardado, no perderás nada.",
                confirmButtonText: "Iniciar sesión", cancelButtonText: "Cancelar",
                showCancelButton: true, confirmButtonColor: C.navy
            }).then(r => { if (r.isConfirmed) navigate("/login"); });
            return;
        }

        // Verificar que tenga documentoID válido
        const usuarioLocal = JSON.parse(raw);
        const docID = usuarioLocal?.documentoID || usuarioLocal?.DocumentoID;
        if (!docID || isNaN(Number(docID))) {
            swalTop({
                icon: "warning", title: "Sesión inválida",
                text: "Por favor cierra sesión e inicia nuevamente.",
                confirmButtonColor: C.navy
            });
            return;
        }

        setCartOpen(false);
        setTimeout(() => setPaymentOpen(true), 220);
    };

    const handlePaymentSuccess = (ventaId) => {
        setPaymentOpen(false);
        vaciar();
        setOrderSuccess(ventaId);
    };

    const usuario = (() => { try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; } })();

    /* Opciones de filtro derivadas de los datos (solo vista) */
    const hayFiltros = !!(search || filtroColor || filtroTalla);
    const limpiar = () => { setSearch(""); setFiltroColor(""); setFiltroTalla(""); setPage(1); };

    const filtered = productos.filter(p =>
        p.Nombre.toLowerCase().includes(search.toLowerCase()) &&
        (!filtroColor || obtenerColores(p).includes(filtroColor)) &&
        (!filtroTalla || obtenerTallas(p).includes(filtroTalla))
    );
    const totalPgs = Math.ceil(filtered.length / PER_PAGE);
    const pageProds = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <>
            <NavbarComponent />

            {/* Botón flotante carrito */}
            <button className={`cat-fab ${cartBounce ? "bump" : ""} ${cartTotal > 0 ? "sx-pulse" : ""}`} onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
                <FaShoppingCart size={20} />
                {cartTotal > 0 && <span key={cartTotal} className="cat-fab-n">{cartTotal > 99 ? "99+" : cartTotal}</span>}
            </button>

            {/* Modales */}
            <CartDrawer
                open={cartOpen} onClose={() => setCartOpen(false)}
                cart={cart} onRemove={handleRemove} onUpdateQty={handleUpdateQty}
                onEdit={(idx) => { setCartOpen(false); setTimeout(() => openProductModal(null, idx), 200); }}
                onCheckout={handleCheckout}
            />
            <ProductModal
                product={productModal.product} open={productModal.open}
                onClose={closeProductModal} tallas={tallas}
                onAddToCart={handleAddToCart}
                initColor={productModal.initColor} initTalla={productModal.initTalla} initQty={productModal.initQty}
                editMode={productModal.editIdx !== null}
            />
            <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} cart={cart} usuario={usuario} onSuccess={handlePaymentSuccess} costoEnvio={config?.costoEnvio} pago={config?.pago} />

            {/* Pedido exitoso */}
            {orderSuccess && (
                <div className="cat-layer cat-overlay" style={{ zIndex: 9999 }}>
                    <div className="cat-modal cat-ok" role="dialog" aria-modal="true" aria-labelledby={exitoTituloId} tabIndex={-1} ref={exitoRef} style={{ outline: "none" }}>
                        <div className="cat-ok-ico"><FaCheckCircle /></div>
                        <h2 id={exitoTituloId}>¡Pedido confirmado!</h2>
                        <p>Tu pedido fue registrado. Pronto te contactaremos.</p>
                        <div className="cat-ok-n"><small>Número de pedido</small><b>#{orderSuccess}</b></div>
                        <button className="sx-btn" onClick={() => setOrderSuccess(null)}>Ok</button>
                    </div>
                </div>
            )}

            {/* Página */}
            <div className="cat-page">

                {/* Hero */}
                <section className="sx-hero-bg cat-hero">
                    <span className="sx-blob b1" /><span className="sx-blob b2" /><span className="sx-blob b3" />
                    <div className="sx-wrap sx-hero-in">
                        <span className="sx-eyebrow">Catálogo STAMPLAB</span>
                        <h1>Nuestros <span className="sx-gradient-text">Productos</span></h1>
                        <p className="cat-lead">Agrega al carrito y elige tu método de pago al finalizar</p>
                        <div className={`cat-search ${searchFocused ? "on" : ""}`}>
                            <FaSearch size={16} className="cat-s-ico" />
                            <input type="text" placeholder="Buscar productos..." value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
                            {search && <button className="cat-clear" onClick={() => { setSearch(""); setPage(1); }} aria-label="Borrar búsqueda"><FaTimes size={12} /></button>}
                        </div>
                    </div>
                </section>

                {/* Contenido */}
                <div className="cat-wrap">

                    {/* Barra info */}
                    {!cargando && (
                        <div className="cat-info">
                            <span>
                                <b>{filtered.length}</b> {filtered.length === 1 ? "producto" : "productos"}
                                {search && <span style={{ color: C.accent }}> · "{search}"</span>}
                                {totalPgs > 1 && <span> · Pág. {page}/{totalPgs}</span>}
                            </span>
                            <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                {cartTotal > 0 && <button className="sx-btn sx-btn-dark sx-btn-sm" onClick={() => setCartOpen(true)}><FaShoppingCart size={11} /> {cartTotal} en carrito</button>}
                                {hayFiltros && <button className="cat-link" onClick={limpiar}>Limpiar ✕</button>}
                            </span>
                        </div>
                    )}

                    {/* Skeleton */}
                    {cargando ? (
                        <div className="cat-grid" style={{ marginTop: 28 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="cat-skel">
                                    <div className="cat-sh" style={{ aspectRatio: "1/1", borderRadius: 0 }} />
                                    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div className="cat-sh" style={{ height: 18, width: "70%" }} />
                                        <div className="cat-sh" style={{ height: 12 }} />
                                        <div className="cat-sh" style={{ height: 12, width: "50%" }} />
                                        <div className="cat-sh" style={{ height: 44, marginTop: 10, borderRadius: 13 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="cat-state">
                            <div className="cat-state-ico">{hayFiltros ? <FaRegSadTear /> : <FaBoxOpen />}</div>
                            <h3>{hayFiltros ? "Sin resultados" : "Sin productos disponibles"}</h3>
                            <p>{search ? `No encontramos "${search}"` : hayFiltros ? "Ningún producto coincide con esos filtros." : "No hay productos en este momento."}</p>
                            {hayFiltros && <button className="sx-btn" onClick={limpiar}>Ver todos</button>}
                        </div>
                    ) : (
                        <>
                            <div className="cat-grid">
                                {pageProds.map((p, idx) => {
                                    const tallasP = obtenerTallas(p);
                                    const coloresP = obtenerColores(p);
                                    const precio = obtenerPrecio(p);
                                    return (
                                        <div key={p.ProductoID} className="sx-reveal" style={{ "--sx-i": idx % 4 }}>
                                            <article className="sx-card cat-card">
                                                <div className="cat-media sx-zoom" onClick={() => openProductModal(p)}>
                                                    {p.ImagenProducto
                                                        ? <img loading="lazy" decoding="async" src={p.ImagenProducto} alt={p.Nombre} onError={e => { e.target.style.display = "none"; }} />
                                                        : <div className="cat-empty-img"><FaBoxOpen size={38} style={{ opacity: .4 }} />Sin imagen</div>}
                                                    <span className="cat-badge"><i /> Disponible</span>
                                                    <button className="cat-eye" onClick={(e) => { e.stopPropagation(); openProductModal(p); }} title="Ver detalle" aria-label="Ver detalle"><FaEye size={15} /></button>
                                                </div>
                                                <div className="cat-body">
                                                    <h3 className="cat-name">{p.Nombre}</h3>
                                                    {p.Descripcion && <p className="cat-desc">{p.Descripcion}</p>}
                                                    {tallasP.length > 0 && <div className="cat-sizes">{tallasP.map(t => <span key={t} className="cat-size">{t}</span>)}</div>}
                                                    {coloresP.length > 0 && (
                                                        <div className="cat-colors">
                                                            {coloresP.map(c => <i key={c} title={c} className="cat-dot" style={{ background: coloresHex[c] || "#ccc" }} />)}
                                                        </div>
                                                    )}
                                                    <div className="cat-foot">
                                                        <div className="cat-price"><small>Desde</small><strong>{formatDinero(precio)}</strong></div>
                                                        <div className="cat-actions">
                                                            <button className="sx-btn sx-btn-dark" onClick={() => openProductModal(p)}><FaShoppingCart size={13} /> Agregar</button>
                                                            <button className="sx-btn cat-ghost" onClick={() => openProductModal(p)}><FaEye size={13} /> Ver</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Paginación */}
                            {totalPgs > 1 && (
                                <div className="cat-pager">
                                    {page < totalPgs && (
                                        <button className="cat-more" onClick={() => setPage(p => p + 1)}>
                                            Ver más productos
                                            <span>{Math.max(0, filtered.length - page * PER_PAGE)} restantes</span>
                                        </button>
                                    )}
                                    <div className="cat-pages">
                                        {Array.from({ length: totalPgs }, (_, i) => i + 1).map(n => (
                                            <button key={n} className={n === page ? "on" : ""} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{n}</button>
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Mostrando {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} productos</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default ProductosLanding;
