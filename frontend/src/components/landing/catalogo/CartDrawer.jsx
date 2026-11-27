import { useId } from "react";
import { FaBoxOpen, FaShoppingCart, FaTrash, FaEdit, FaTimes, FaPlus, FaMinus, FaBolt, FaChevronRight, FaShoppingBag, FaTshirt } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { formatDinero } from "../../../utils/formato";
import useEscape from "../../../hooks/useEscape";
import useFocoModal from "../../../hooks/useFocoModal";
import { coloresHex } from "./catalogoComun";

/* ══════════════════════════════════
   CARRITO DRAWER
   (siempre montado: se muestra/oculta con transform; el diálogo solo es modal mientras está abierto)
══════════════════════════════════ */
const CartDrawer = ({ open, onClose, cart, onRemove, onUpdateQty, onEdit, onCheckout }) => {
    const tituloId = useId();
    useEscape(onClose, !!open);
    const dialogoRef = useFocoModal(!!open);
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const nItems = cart.reduce((s, i) => s + i.cantidad, 0);
    return (
        <div className="cat-layer">
            <div className="cat-scrim" onClick={onClose} style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} />
            <aside className="cat-drawer" style={{ transform: open ? "translateX(0)" : "translateX(100%)", outline: "none" }}
                role="dialog" aria-modal={open ? "true" : undefined} aria-labelledby={tituloId} tabIndex={-1} ref={dialogoRef}>
                <div className="cat-dh sx-hero-bg">
                    <span className="sx-blob b1" style={{ width: 200, height: 200 }} />
                    <div className="cat-dh-in">
                        <div className="cat-dh-ico"><FaShoppingBag size={20} color={C.white} /></div>
                        <div>
                            <h3 id={tituloId}>Mi carrito</h3>
                            <small>{nItems} {nItems === 1 ? "ítem" : "ítems"}</small>
                        </div>
                    </div>
                    <button className="cat-x dark" style={{ position: "relative", top: 0, right: 0 }} onClick={onClose} aria-label="Cerrar carrito"><FaTimes size={14} /></button>
                </div>

                <div className="cat-list">
                    {cart.length === 0 ? (
                        <div className="cat-state" style={{ padding: "50px 10px" }}>
                            <div className="cat-state-ico" style={{ width: 88, height: 88, fontSize: 34, borderRadius: 28 }}><FaShoppingCart /></div>
                            <h3 style={{ fontSize: 22 }}>Tu carrito está vacío</h3>
                            <p>Agrega productos para comenzar</p>
                            <button className="sx-btn sx-btn-sm" onClick={onClose}><FaTshirt /> Explorar catálogo</button>
                        </div>
                    ) : cart.map((item, idx) => (
                        <div key={idx} className="cat-item" style={{ "--i": idx }}>
                            <div className="cat-item-img">
                                {item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <FaBoxOpen size={22} color={C.muted} />}
                            </div>
                            <div className="cat-item-main">
                                <p className="cat-item-name">{item.nombre}</p>
                                <div className="cat-item-var">
                                    {item.color && <span><i className="cat-dot" style={{ width: 10, height: 10, background: coloresHex[item.color] || "#ccc" }} />{item.color}</span>}
                                    {item.talla && <span>Talla {item.talla}</span>}
                                    {!item.color && !item.talla && <span>Sin variante</span>}
                                </div>
                                <div className="cat-item-row">
                                    <div className="cat-mini-qty">
                                        <button onClick={() => onUpdateQty(idx, item.cantidad - 1)} aria-label="Menos"><FaMinus size={9} /></button>
                                        <span>{item.cantidad}</span>
                                        <button onClick={() => onUpdateQty(idx, item.cantidad + 1)} aria-label="Más"><FaPlus size={9} /></button>
                                    </div>
                                    <div className="cat-item-btns">
                                        <button className="cat-ib edit" onClick={() => onEdit(idx)} title="Editar"><FaEdit size={12} /></button>
                                        <button className="cat-ib del" onClick={() => onRemove(idx)} title="Eliminar"><FaTrash size={12} /></button>
                                    </div>
                                </div>
                                <span className="cat-item-price">{formatDinero(item.precio * item.cantidad)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {cart.length > 0 && (
                    <div className="cat-dfoot">
                        <div className="cat-sum"><span>Subtotal ({nItems} ítems)</span><span>{formatDinero(total)}</span></div>
                        <div className="cat-sum"><span>Envío</span><span>Se coordina al finalizar</span></div>
                        <div className="cat-sum big"><span>Total</span><strong>{formatDinero(total)}</strong></div>
                        <button className="sx-btn" onClick={onCheckout}>
                            <FaBolt size={14} /> Comprar ahora <FaChevronRight size={12} />
                        </button>
                        <p className="cat-secure">Pago seguro · Transferencia o contra entrega</p>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default CartDrawer;
