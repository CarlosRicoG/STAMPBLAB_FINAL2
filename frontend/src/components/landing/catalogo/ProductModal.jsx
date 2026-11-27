import { useState, useEffect, useId } from "react";
import { FaBoxOpen, FaShoppingCart, FaTimes, FaPlus, FaMinus, FaCheck } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { formatDinero } from "../../../utils/formato";
import { swalTop } from "../../../utils/alertas";
import useEscape from "../../../hooks/useEscape";
import useFocoModal from "../../../hooks/useFocoModal";
import { coloresHex } from "./catalogoComun";

/* ══════════════════════════════════
   MODAL PRODUCTO (ver + agregar/editar)
══════════════════════════════════ */
const ProductModal = ({ product, open, onClose, tallas, onAddToCart, initColor = "", initTalla = "", initQty = 1, editMode = false }) => {
    const [color, setColor] = useState(initColor);
    const [talla, setTalla] = useState(initTalla);
    const [qty, setQty] = useState(initQty);
    const abierto = !!(open && product);
    const tituloId = useId();
    useEscape(onClose, abierto);
    const dialogoRef = useFocoModal(abierto);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
    useEffect(() => { if (open) { setColor(initColor); setTalla(initTalla); setQty(initQty); } }, [open, product]);
    if (!open || !product) return null;

    const vars = product.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
    const coloresDisp = [...new Set(vars.map(i => i.color?.Nombre).filter(Boolean))];
    const tallasDisp = [...new Set(vars.filter(i => !color || i.color?.Nombre === color).map(i => i.talla?.Nombre).filter(Boolean))];
    const stock = (() => {
        if (!color && !talla) return 999;
        if (!Array.isArray(product.inventario)) return 999; // inventario no cargado: no se limita (el servidor valida al comprar)
        const v = vars.find(i => (!color || i.color?.Nombre === color) && (!talla || i.talla?.Nombre === talla));
        return v?.Stock || 0;
    })();
    const precio = (() => {
        const base = parseFloat(product.PrecioBase) || 0;
        const t = tallas.find(t => t.Nombre === talla);
        return base + (parseFloat(t?.Precio) || 0);
    })();

    const handleAdd = () => {
        if (coloresDisp.length > 0 && !color) { swalTop({ icon: "warning", title: "Selecciona un color", timer: 1400, showConfirmButton: false }); return; }
        if (tallasDisp.length > 0 && !talla) { swalTop({ icon: "warning", title: "Selecciona una talla", timer: 1400, showConfirmButton: false }); return; }
        if (qty > stock) { swalTop({ icon: "warning", title: `Solo hay ${stock} en stock`, timer: 1600, showConfirmButton: false }); return; }
        onAddToCart({ producto: product, color, talla, cantidad: qty, precio });
        onClose();
    };

    return (
        <div className="cat-layer cat-overlay" onClick={onClose}>
            <div className="cat-modal cat-pm" onClick={e => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1} ref={dialogoRef} style={{ outline: "none" }}>
                {/* Galería */}
                <div className="cat-pm-gal">
                    <div className="cat-pmbar"><span>{editMode ? "Editar ítem del carrito" : "Detalle del producto"}</span><button className="cat-x dark" style={{ position: "static", width: 30, height: 30, borderRadius: 8 }} onClick={onClose} aria-label="Cerrar"><FaTimes size={12} /></button></div>
                    {product.ImagenProducto
                        ? <img src={product.ImagenProducto} alt={product.Nombre} onError={e => e.target.style.display = "none"} />
                        : <div className="cat-empty-img"><FaBoxOpen size={64} style={{ opacity: .35 }} />Sin imagen</div>}
                    <span className="cat-badge"><i /> Disponible</span>
                </div>

                {/* Info */}
                <div className="cat-pm-info">
                    <div className="cat-pm-head"><h2 id={tituloId}>{product.Nombre}</h2><span className="cat-pm-price">{formatDinero(precio)}</span></div>
                    {product.Descripcion && <p className="cat-pm-desc">{product.Descripcion}</p>}

                    {coloresDisp.length > 0 && (
                        <div>
                            <p className="cat-lbl">Color<span>{color || "—"}</span></p>
                            <div className="cat-swatches">
                                {coloresDisp.map(c => (
                                    <button key={c} onClick={() => { setColor(c); setTalla(""); }} title={c} aria-label={c}
                                        className={`cat-sw ${color === c ? "on" : ""}`} style={{ background: coloresHex[c] || "#ccc" }}>
                                        <span className="cat-check" style={c === "Blanco" ? { color: C.navy, filter: "none" } : undefined}><FaCheck /></span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tallasDisp.length > 0 && (
                        <div>
                            <p className="cat-lbl">Talla<span>{talla || "—"}</span></p>
                            <div className="cat-pills">
                                {tallasDisp.map(t => (
                                    <button key={t} onClick={() => setTalla(t)} className={`cat-pill ${talla === t ? "on" : ""}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {color && talla && (
                        <p className="cat-stock" style={{ color: stock > 5 ? C.success : stock > 0 ? C.warning : C.danger }}>
                            {stock > 5 ? `✓ ${stock} disponibles` : stock > 0 ? `⚠ Solo ${stock} en stock` : "✗ Sin stock para esta combinación"}
                        </p>
                    )}

                    <div className="cat-buy">
                        <div className="cat-buyrow">
                            <div className="cat-qty">
                                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos"><FaMinus size={12} /></button>
                                <span>{qty}</span>
                                <button onClick={() => setQty(Math.min(stock || 99, qty + 1))} aria-label="Más"><FaPlus size={12} /></button>
                            </div>
                            <button className="sx-btn sx-btn-dark" onClick={handleAdd}>
                                <FaShoppingCart size={13} /> {editMode ? "Actualizar ítem" : "Agregar al carrito"}
                            </button>
                        </div>
                        <p className="cat-total" style={{ margin: "8px 0 0" }}><small style={{ display: "inline" }}>Total: </small><strong style={{ fontSize: 16 }}>{formatDinero(precio * qty)}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
