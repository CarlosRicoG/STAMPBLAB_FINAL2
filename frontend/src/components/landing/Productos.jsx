import { useState, useEffect, useRef } from "react";
import NavbarComponent from "./NavBarLanding";
import FooterComponent from "./footer";
import { useNavigate } from "react-router-dom";
import { getProductos } from "../../Services/api-productos/productos";
import { getTallas } from "../../Services/api-productos/atributos";
import Swal from "sweetalert2";
import {
    FaSearch, FaBoxOpen, FaShoppingCart, FaTag, FaTrash,
    FaEye, FaEdit, FaTimes, FaPlus, FaMinus, FaChevronDown,
    FaMotorcycle, FaExchangeAlt, FaCheckCircle, FaBolt, FaChevronRight
} from "react-icons/fa";

/* ─── Paleta exacta del proyecto ─── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
    navyDeep: "linear-gradient(135deg, #0f1824 0%, #1a2540 60%, #2d3f6e 100%)",
    accent: "#4f8ef7",
    accentSoft: "#f0f4ff",
    accentBorder: "#c7d9ff",
    success: "#16a34a",
    successSoft: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningSoft: "#fffbeb",
    warningBorder: "#fde68a",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    dangerBorder: "#fecaca",
    muted: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    white: "#ffffff",
};

const FONT = "'Outfit', sans-serif";
const PER_PAGE = 8;
const CART_KEY = "cart_productos_landing";

const coloresHex = {
    "Rojo": "#ef4444", "Azul": "#3b82f6", "Verde": "#22c55e", "Amarillo": "#eab308",
    "Negro": "#0f172a", "Blanco": "#f0f0f0", "Rosa": "#ec4899", "Morado": "#a855f7",
    "Naranja": "#f97316", "Gris": "#94a3b8", "Cafe": "#92400e", "Café": "#92400e",
};

/* Swal siempre por encima de los modales */
const swalTop = (opts) => Swal.fire({ ...opts, customClass: { container: "swal-ontop", ...(opts.customClass || {}) } });

const saveCart = (c) => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch { } };
const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } };

/* ══════════════════════════════════
   MODAL PRODUCTO (ver + agregar/editar)
══════════════════════════════════ */
const ProductModal = ({ product, open, onClose, tallas, onAddToCart, initColor = "", initTalla = "", initQty = 1, editMode = false }) => {
    const [color, setColor] = useState(initColor);
    const [talla, setTalla] = useState(initTalla);
    const [qty, setQty] = useState(initQty);

    useEffect(() => { if (open) { setColor(initColor); setTalla(initTalla); setQty(initQty); } }, [open, product]);
    if (!open || !product) return null;

    const vars = product.inventario?.filter(i => i.Stock > 0 && i.Estado) || [];
    const coloresDisp = [...new Set(vars.map(i => i.color?.Nombre).filter(Boolean))];
    const tallasDisp = [...new Set(vars.filter(i => !color || i.color?.Nombre === color).map(i => i.talla?.Nombre).filter(Boolean))];
    const stock = (() => {
        if (!color && !talla) return 999;
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
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
            <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "modalIn 0.26s ease", fontFamily: FONT }} onClick={e => e.stopPropagation()}>

                {/* Imagen con barra de título */}
                <div style={{ position: "relative", height: 240, background: C.bg, flexShrink: 0, overflow: "hidden" }}>
                    {product.ImagenProducto
                        ? <img src={product.ImagenProducto} alt={product.Nombre} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
                        : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaBoxOpen size={48} color={C.muted} style={{ opacity: 0.3 }} /></div>
                    }
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "13px 16px", background: C.navyDeep, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#fff", fontFamily: FONT }}>
                            {editMode ? "Editar ítem del carrito" : "Detalle del producto"}
                        </p>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.14)", border: "none", borderRadius: 7, width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes size={12} /></button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, fontFamily: FONT }}>{product.Nombre}</h2>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.accent, whiteSpace: "nowrap", marginLeft: 12 }}>${precio.toLocaleString("es-CO")}</p>
                    </div>
                    {product.Descripcion && <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{product.Descripcion}</p>}

                    {/* Colores */}
                    {coloresDisp.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Color: <span style={{ color: C.text, textTransform: "none", letterSpacing: 0 }}>{color || "—"}</span></p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {coloresDisp.map(c => (
                                    <button key={c} onClick={() => { setColor(c); setTalla(""); }} title={c} style={{
                                        width: 28, height: 28, borderRadius: "50%", background: coloresHex[c] || "#ccc",
                                        border: `3px solid ${color === c ? C.accent : "transparent"}`,
                                        outline: `2px solid ${color === c ? C.accent : "transparent"}`,
                                        outlineOffset: 2, cursor: "pointer", transition: "all 0.15s",
                                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tallas */}
                    {tallasDisp.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Talla</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {tallasDisp.map(t => (
                                    <button key={t} onClick={() => setTalla(t)} style={{
                                        padding: "6px 15px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                                        border: `2px solid ${talla === t ? C.accent : C.border}`,
                                        background: talla === t ? C.accentSoft : C.bg,
                                        color: talla === t ? C.accent : C.text,
                                        cursor: "pointer", fontFamily: FONT, transition: "all 0.15s"
                                    }}>{t}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock info */}
                    {color && talla && (
                        <p style={{ margin: "0 0 12px", fontSize: 12, color: stock > 5 ? C.success : stock > 0 ? C.warning : C.danger, fontWeight: 700 }}>
                            {stock > 5 ? `✓ ${stock} disponibles` : stock > 0 ? `⚠ Solo ${stock} en stock` : "✗ Sin stock para esta combinación"}
                        </p>
                    )}

                    {/* Cantidad + Botón */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 38, height: 42, background: C.bg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}><FaMinus size={11} /></button>
                            <span style={{ width: 44, textAlign: "center", fontWeight: 800, fontSize: 15, color: C.text, fontFamily: FONT }}>{qty}</span>
                            <button onClick={() => setQty(Math.min(stock || 99, qty + 1))} style={{ width: 38, height: 42, background: C.bg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}><FaPlus size={11} /></button>
                        </div>
                        <button onClick={handleAdd} style={{
                            flex: 1, padding: "11px 16px", background: C.navyGrad, color: "#fff", border: "none",
                            borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FONT,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7
                        }}>
                            <FaShoppingCart size={13} /> {editMode ? "Actualizar ítem" : "Agregar al carrito"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   CARRITO DRAWER
══════════════════════════════════ */
const CartDrawer = ({ open, onClose, cart, onRemove, onUpdateQty, onEdit, onCheckout }) => {
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const nItems = cart.reduce((s, i) => s + i.cantidad, 0);
    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 8998, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 0.3s" }} />
            <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "95vw",
                background: C.white, zIndex: 8999,
                transform: open ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.34s cubic-bezier(.4,0,.2,1)",
                display: "flex", flexDirection: "column",
                boxShadow: "-8px 0 36px rgba(0,0,0,0.2)", fontFamily: FONT
            }}>
                {/* Header */}
                <div style={{ padding: "18px 20px", background: C.navyDeep, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaShoppingCart size={15} color="#fff" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#fff" }}>Mi carrito</p>
                            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{nItems} {nItems === 1 ? "ítem" : "ítems"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes size={12} /></button>
                </div>

                {/* Items */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 15px" }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: "center", paddingTop: 56 }}>
                            <div style={{ width: 70, height: 70, borderRadius: "50%", background: C.accentSoft, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <FaBoxOpen size={24} color={C.accent} />
                            </div>
                            <p style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>Tu carrito está vacío</p>
                            <p style={{ fontSize: 12, color: C.muted }}>Agrega productos para comenzar</p>
                        </div>
                    ) : cart.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                            {/* Imagen */}
                            <div style={{ width: 62, height: 62, borderRadius: 9, overflow: "hidden", background: C.bg, flexShrink: 0, border: `1px solid ${C.border}` }}>
                                {item.imagen
                                    ? <img src={item.imagen} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaBoxOpen size={17} color={C.muted} /></div>
                                }
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nombre}</p>
                                <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted }}>{[item.color, item.talla].filter(Boolean).join(" · ") || "Sin variante"}</p>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    {/* Qty */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.bg, borderRadius: 7, padding: "3px 7px", border: `1px solid ${C.border}` }}>
                                        <button onClick={() => onUpdateQty(idx, item.cantidad - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}><FaMinus size={9} /></button>
                                        <span style={{ fontWeight: 800, fontSize: 13, minWidth: 18, textAlign: "center", color: C.text }}>{item.cantidad}</span>
                                        <button onClick={() => onUpdateQty(idx, item.cantidad + 1)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}><FaPlus size={9} /></button>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.accent }}>${(item.precio * item.cantidad).toLocaleString("es-CO")}</p>
                                        {/* Editar */}
                                        <button onClick={() => onEdit(idx)} title="Editar" style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
                                            <FaEdit size={10} />
                                        </button>
                                        {/* Eliminar */}
                                        <button onClick={() => onRemove(idx)} title="Eliminar" style={{ background: C.dangerSoft, border: `1px solid ${C.dangerBorder}`, borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.danger }}>
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div style={{ padding: "13px 15px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
                            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Subtotal ({nItems} ítems)</p>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: 19, color: C.text }}>${total.toLocaleString("es-CO")}</p>
                        </div>
                        <button onClick={onCheckout} style={{
                            width: "100%", padding: "13px", background: C.navyGrad, color: "#fff", border: "none",
                            borderRadius: 11, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: FONT,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            boxShadow: "0 6px 18px rgba(26,37,64,0.35)"
                        }}>
                            <FaBolt size={13} /> Comprar ahora <FaChevronRight size={11} />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

/* ══════════════════════════════════
   MODAL PAGO
══════════════════════════════════ */
const FormField = ({ label, placeholder, value, onChange, type = "text", readOnly = false }) => (
    <div style={{ marginBottom: 11 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontFamily: FONT }}>{label} *</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            style={{
                width: "100%", padding: "10px 12px",
                border: `1.5px solid ${C.border}`, borderRadius: 9,
                fontSize: 13, fontFamily: FONT, outline: "none",
                boxSizing: "border-box",
                background: readOnly ? C.bg : C.white,
                color: C.text
            }}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = C.accent; }}
            onBlur={e => e.target.style.borderColor = C.border}
        />
    </div>
);


const PaymentModal = ({ open, onClose, cart, onSuccess }) => {
    const [method, setMethod] = useState("");
    const [comprobanteFile, setComprobanteFile] = useState(null);
    const [comprobantePreview, setComprobantePreview] = useState(null);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

    // ✅ Autocompletar con datos del usuario al abrir
    useEffect(() => {
        if (open) {
            setMethod("");
            setComprobanteFile(null);
            setComprobantePreview(null);
            setFecha("");
            setErrors({});
            setDireccion("");

            // Cargar nombre y teléfono del usuario logueado
            try {
                const raw = localStorage.getItem("usuario");
                const u = raw ? JSON.parse(raw) : null;
                setNombre(u?.nombre || u?.Nombre || "");
                setTelefono(u?.telefono || u?.Telefono || "");
            } catch {
                setNombre("");
                setTelefono("");
            }
        }
    }, [open]);

    if (!open) return null;

    // ✅ Solo imágenes y PDF
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
        if (!allowed.includes(file.type)) {
            swalTop({
                icon: "warning",
                title: "Archivo no permitido",
                text: "Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF.",
                timer: 2500,
                showConfirmButton: false
            });
            e.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            swalTop({ icon: "warning", title: "Archivo muy grande", text: "El archivo no puede superar 5MB.", timer: 2000, showConfirmButton: false });
            e.target.value = "";
            return;
        }

        setComprobanteFile(file);
        if (file.type === "application/pdf") {
            setComprobantePreview("pdf");
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => setComprobantePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const toBase64 = (file) => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });

    // ✅ Validaciones
    const validate = () => {
        const newErrors = {};
        if (method === "transferencia") {
            if (!comprobanteFile) newErrors.comprobante = "Debes subir el comprobante de pago";
        }
        if (method === "contraentrega") {
            if (!nombre.trim()) {
                newErrors.nombre = "El nombre es obligatorio";
            } else if (/\d/.test(nombre)) {
                newErrors.nombre = "El nombre no puede contener números";
            }
            if (!telefono.trim()) {
                newErrors.telefono = "El teléfono es obligatorio";
            } else if (!/^\d+$/.test(telefono.replace(/[\s\-]/g, ""))) {
                newErrors.telefono = "El teléfono solo puede contener números";
            }
            if (!direccion.trim()) newErrors.direccion = "La dirección es obligatoria";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!method) {
            swalTop({ icon: "warning", title: "Selecciona un método de pago", timer: 1500, showConfirmButton: false });
            return;
        }
        if (!validate()) return;

        const raw = localStorage.getItem("usuario");
        const usuarioLocal = raw ? JSON.parse(raw) : null;
        const docID = usuarioLocal?.documentoID || usuarioLocal?.DocumentoID;

        if (!docID) {
            swalTop({ icon: "error", title: "Sesión no encontrada", text: "Por favor inicia sesión nuevamente.", confirmButtonColor: C.navy });
            return;
        }

        setLoading(true);
        try {
            let comprobanteBase64 = null;
            if (comprobanteFile) comprobanteBase64 = await toBase64(comprobanteFile);

            const detalles = cart.map(item => ({
                ProductoID: item.producto.ProductoID,
                Cantidad: item.cantidad,
                PrecioUnitario: item.precio,
                ColorID: item.producto.inventario?.find(i => i.color?.Nombre === item.color && i.talla?.Nombre === item.talla)?.ColorID || null,
                TallaID: item.producto.inventario?.find(i => i.color?.Nombre === item.color && i.talla?.Nombre === item.talla)?.TallaID || null,
            }));

            const payload = {
                DocumentoID: docID,
                Subtotal: total,
                Total: total,
                detalles,
                metodoPago: method,
                ...(method === "transferencia" ? {
                    comprobanteTransferencia: comprobanteBase64 || comprobanteFile?.name,
                    fechaTransferencia: fecha || new Date().toISOString()
                } : {}),
                ...(method === "contraentrega" ? {
                    nombreReceptor: nombre,
                    telefonoEntrega: telefono,
                    direccionEntrega: direccion
                } : {}),
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "Error al procesar");
            onSuccess(data.venta?.VentaID);
        } catch (err) {
            swalTop({ icon: "error", title: "Error al procesar", text: err.message, confirmButtonColor: C.accent });
        } finally {
            setLoading(false);
        }
    };

    const methods = [
        { id: "transferencia", icon: <FaExchangeAlt />, label: "Transferencia bancaria", desc: "Sube foto o PDF de tu comprobante" },
        { id: "contraentrega", icon: <FaMotorcycle />, label: "Contra entrega", desc: "Paga al recibir tu pedido" },
    ];

    const ErrorMsg = ({ field }) => errors[field]
        ? <p style={{ margin: "3px 0 0", fontSize: 11, color: C.danger, fontWeight: 600 }}>⚠ {errors[field]}</p>
        : null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
            <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 500, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "modalIn 0.26s ease", fontFamily: FONT }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: "17px 22px", background: C.navyDeep, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Finalizar compra</p>
                        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total: <strong style={{ color: "#fbbf24" }}>${total.toLocaleString("es-CO")}</strong></p>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTimes size={12} /></button>
                </div>

                {/* Body */}
                <div style={{ overflowY: "auto", padding: "18px 22px", flex: 1 }}>

                    {/* Resumen */}
                    <div style={{ background: C.bg, borderRadius: 11, padding: "12px 14px", marginBottom: 18, border: `1px solid ${C.border}` }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Resumen del pedido</p>
                        {cart.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <p style={{ margin: 0, fontSize: 13, color: C.text }}>
                                    {item.nombre} × {item.cantidad}
                                    {(item.color || item.talla) && <span style={{ color: C.muted, fontSize: 11 }}> ({[item.color, item.talla].filter(Boolean).join("/")})</span>}
                                </p>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>${(item.precio * item.cantidad).toLocaleString("es-CO")}</p>
                            </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                            <p style={{ margin: 0, fontWeight: 800, color: C.text }}>Total</p>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: C.accent }}>${total.toLocaleString("es-CO")}</p>
                        </div>
                    </div>

                    {/* Métodos */}
                    <p style={{ margin: "0 0 9px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Método de pago</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                        {methods.map(m => (
                            <div key={m.id} onClick={() => { setMethod(m.id); setErrors({}); }} style={{
                                display: "flex", alignItems: "center", gap: 11, padding: "12px 13px",
                                border: `2px solid ${method === m.id ? C.accent : C.border}`,
                                borderRadius: 11, cursor: "pointer",
                                background: method === m.id ? C.accentSoft : C.bg,
                                transition: "all 0.2s"
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: method === m.id ? C.accent : "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", color: method === m.id ? "#fff" : C.muted, fontSize: 14, transition: "all 0.2s" }}>{m.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{m.label}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{m.desc}</p>
                                </div>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? C.accent : C.border}`, background: method === m.id ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {method === m.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── TRANSFERENCIA ── */}
                    {method === "transferencia" && (
                        <div style={{ animation: "slideDown 0.22s ease" }}>
                            <p style={{ margin: "0 0 7px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Comprobante de pago *</p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${errors.comprobante ? C.danger : comprobanteFile ? C.success : C.accentBorder}`,
                                    borderRadius: 11, padding: "18px 14px", textAlign: "center",
                                    cursor: "pointer",
                                    background: errors.comprobante ? C.dangerSoft : comprobanteFile ? C.successSoft : C.accentSoft,
                                    marginBottom: 6, transition: "all 0.2s"
                                }}
                            >
                                {comprobanteFile ? (
                                    comprobantePreview === "pdf" ? (
                                        <div>
                                            <div style={{ fontSize: 32, marginBottom: 6 }}>📄</div>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.success }}>{comprobanteFile.name}</p>
                                            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.muted }}>PDF cargado · {(comprobanteFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <img src={comprobantePreview} alt="comprobante" style={{ maxHeight: 130, maxWidth: "100%", borderRadius: 8, objectFit: "contain", marginBottom: 6 }} />
                                            <p style={{ margin: 0, fontSize: 12, color: C.success, fontWeight: 700 }}>✓ {comprobanteFile.name}</p>
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <div style={{ fontSize: 28, marginBottom: 7 }}>📎</div>
                                        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: errors.comprobante ? C.danger : C.accent }}>Haz clic para subir</p>
                                        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Solo JPG, PNG, WEBP o PDF · Máx. 5MB</p>
                                    </div>
                                )}
                            </div>
                            <ErrorMsg field="comprobante" />

                            {comprobanteFile && (
                                <button onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    style={{ background: C.dangerSoft, border: `1px solid ${C.dangerBorder}`, color: C.danger, borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginTop: 6, marginBottom: 4 }}>
                                    ✕ Cambiar archivo
                                </button>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />

                            <div style={{ marginTop: 10 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontFamily: FONT }}>Fecha de transferencia (opcional)</label>
                                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
                                    onFocus={e => e.target.style.borderColor = C.accent}
                                    onBlur={e => e.target.style.borderColor = C.border} />
                            </div>
                        </div>
                    )}

                    {/* ── CONTRAENTREGA ── */}
                    {method === "contraentrega" && (
                        <div style={{ animation: "slideDown 0.22s ease" }}>

                            {/* Nombre */}
                            <div style={{ marginBottom: 11 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontFamily: FONT }}>Nombre del receptor *</label>
                                <input
                                    type="text"
                                    placeholder="Nombre completo"
                                    value={nombre}
                                    onChange={e => {
                                        // ✅ No permite números
                                        const val = e.target.value.replace(/[0-9]/g, "");
                                        setNombre(val);
                                        if (errors.nombre) setErrors(prev => ({ ...prev, nombre: "" }));
                                    }}
                                    style={{
                                        width: "100%", padding: "10px 12px",
                                        border: `1.5px solid ${errors.nombre ? C.danger : C.border}`,
                                        borderRadius: 9, fontSize: 13, fontFamily: FONT,
                                        outline: "none", boxSizing: "border-box", color: C.text
                                    }}
                                    onFocus={e => e.target.style.borderColor = errors.nombre ? C.danger : C.accent}
                                    onBlur={e => e.target.style.borderColor = errors.nombre ? C.danger : C.border}
                                />
                                <ErrorMsg field="nombre" />
                            </div>

                            {/* Teléfono */}
                            <div style={{ marginBottom: 11 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontFamily: FONT }}>Teléfono de entrega *</label>
                                <input
                                    type="tel"
                                    placeholder="Ej: 300 123 4567"
                                    value={telefono}
                                    onChange={e => {
                                        // ✅ Solo números, espacios y guiones
                                        const val = e.target.value.replace(/[^0-9\s\-]/g, "");
                                        setTelefono(val);
                                        if (errors.telefono) setErrors(prev => ({ ...prev, telefono: "" }));
                                    }}
                                    style={{
                                        width: "100%", padding: "10px 12px",
                                        border: `1.5px solid ${errors.telefono ? C.danger : C.border}`,
                                        borderRadius: 9, fontSize: 13, fontFamily: FONT,
                                        outline: "none", boxSizing: "border-box", color: C.text
                                    }}
                                    onFocus={e => e.target.style.borderColor = errors.telefono ? C.danger : C.accent}
                                    onBlur={e => e.target.style.borderColor = errors.telefono ? C.danger : C.border}
                                />
                                <ErrorMsg field="telefono" />
                            </div>

                            {/* Dirección */}
                            <div style={{ marginBottom: 11 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontFamily: FONT }}>Dirección de entrega *</label>
                                <input
                                    type="text"
                                    placeholder="Calle, barrio, ciudad..."
                                    value={direccion}
                                    onChange={e => {
                                        setDireccion(e.target.value);
                                        if (errors.direccion) setErrors(prev => ({ ...prev, direccion: "" }));
                                    }}
                                    style={{
                                        width: "100%", padding: "10px 12px",
                                        border: `1.5px solid ${errors.direccion ? C.danger : C.border}`,
                                        borderRadius: 9, fontSize: 13, fontFamily: FONT,
                                        outline: "none", boxSizing: "border-box", color: C.text
                                    }}
                                    onFocus={e => e.target.style.borderColor = errors.direccion ? C.danger : C.accent}
                                    onBlur={e => e.target.style.borderColor = errors.direccion ? C.danger : C.border}
                                />
                                <ErrorMsg field="direccion" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: "13px 22px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <button onClick={handleSubmit} disabled={loading || !method} style={{
                        width: "100%", padding: "13px",
                        background: loading || !method ? "#d1d5db" : C.navyGrad,
                        color: "#fff", border: "none", borderRadius: 11, fontWeight: 800, fontSize: 14,
                        cursor: loading || !method ? "not-allowed" : "pointer", fontFamily: FONT,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}>
                        {loading
                            ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Procesando...</>
                            : <><FaCheckCircle size={14} /> Confirmar pedido</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
const ProductosLanding = () => {
    const [search, setSearch] = useState("");
    const [productos, setProductos] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [searchFocused, setSearchFocused] = useState(false);
    const [page, setPage] = useState(1);
    const [cart, setCart] = useState(() => loadCart());
    const [cartOpen, setCartOpen] = useState(false);
    const [cartBounce, setCartBounce] = useState(false);
    const [productModal, setProductModal] = useState({ open: false, product: null, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { saveCart(cart); }, [cart]);
    useEffect(() => { cargarDatos(); }, []);

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
            setProductModal({ open: true, product: item.producto, editIdx, initColor: item.color, initTalla: item.talla, initQty: item.cantidad });
        } else {
            setProductModal({ open: true, product: p, editIdx: null, initColor: "", initTalla: "", initQty: 1 });
        }
    };
    const closeProductModal = () => setProductModal(m => ({ ...m, open: false }));

    /* Agregar / editar en carrito */
    const handleAddToCart = ({ producto, color, talla, cantidad, precio }) => {
        const raw = localStorage.getItem("usuario");
        if (!raw) {
            saveCart(cart); // Guardar antes de redirigir
            swalTop({
                icon: "warning", title: "Inicia sesión para comprar",
                text: "Tu carrito está guardado, no perderás nada.",
                confirmButtonText: "Iniciar sesión", cancelButtonText: "Cancelar",
                showCancelButton: true, confirmButtonColor: C.navy
            }).then(r => { if (r.isConfirmed) navigate("/login"); });
            return;
        }
        const { editIdx } = productModal;
        setCart(prev => {
            let updated;
            if (editIdx !== null) {
                updated = prev.map((item, i) => i === editIdx ? { ...item, color, talla, cantidad, precio } : item);
            } else {
                const ex = prev.findIndex(i => i.producto.ProductoID === producto.ProductoID && i.color === color && i.talla === talla);
                if (ex >= 0) {
                    updated = prev.map((item, i) => i === ex ? { ...item, cantidad: item.cantidad + cantidad } : item);
                } else {
                    updated = [...prev, { producto, nombre: producto.Nombre, imagen: producto.ImagenProducto, color, talla, cantidad, precio }];
                }
            }
            saveCart(updated);
            return updated;
        });
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 600);
        swalTop({ icon: "success", title: editIdx !== null ? "Ítem actualizado" : `¡${producto.Nombre} agregado!`, timer: 1400, showConfirmButton: false, position: "top-end", toast: true });
    };

    const handleRemove = (idx) => setCart(prev => { const u = prev.filter((_, i) => i !== idx); saveCart(u); return u; });
    const handleUpdateQty = (idx, qty) => {
        if (qty < 1) { handleRemove(idx); return; }
        setCart(prev => { const u = prev.map((item, i) => i === idx ? { ...item, cantidad: qty } : item); saveCart(u); return u; });
    };

    /* Checkout */
    const handleCheckout = () => {
        const raw = localStorage.getItem("usuario");
        if (!raw) {
            saveCart(cart);
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
        setCart([]);
        localStorage.removeItem(CART_KEY);
        setOrderSuccess(ventaId);
    };

    const usuario = (() => { try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; } })();
    const filtered = productos.filter(p => p.Nombre.toLowerCase().includes(search.toLowerCase()));
    const totalPgs = Math.ceil(filtered.length / PER_PAGE);
    const pageProds = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const cartTotal = cart.reduce((s, i) => s + i.cantidad, 0);

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            @keyframes spin      { to { transform: rotate(360deg); } }
            @keyframes shimmer   { 0%{background-position:-500px 0} 100%{background-position:500px 0} }
            @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
            @keyframes modalIn   { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:none} }
            @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
            @keyframes cartBounce{ 0%{transform:scale(1)} 30%{transform:scale(1.28)} 65%{transform:scale(0.92)} 100%{transform:scale(1)} }
            .prod-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .prod-card:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(26,37,64,0.14) !important; }
            .prod-img  { transition: transform 0.32s ease; }
            .prod-card:hover .prod-img { transform: scale(1.06); }
            .icon-btn  { transition: all 0.15s; }
            .icon-btn:hover { transform: scale(1.09); }
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
            .swal-ontop { z-index: 99999 !important; }
          `}</style>

            <NavbarComponent />

            {/* Botón flotante carrito */}
            <button onClick={() => setCartOpen(true)} style={{
                position: "fixed", bottom: 28, right: 28, width: 56, height: 56,
                borderRadius: "50%", background: C.navyGrad, border: "none", cursor: "pointer",
                zIndex: 7000, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 28px rgba(26,37,64,0.42)",
                animation: cartBounce ? "cartBounce 0.6s ease" : "none"
            }}>
                <FaShoppingCart size={20} color="#fff" />
                {cartTotal > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4, width: 21, height: 21,
                        borderRadius: "50%", background: "#ef4444", color: "#fff",
                        fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2.5px solid #fff", fontFamily: FONT
                    }}>{cartTotal > 99 ? "99+" : cartTotal}</span>
                )}
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
            <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} cart={cart} usuario={usuario} onSuccess={handlePaymentSuccess} />

            {/* Pedido exitoso */}
            {orderSuccess && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: C.white, borderRadius: 20, padding: "36px 30px", maxWidth: 380, width: "100%", textAlign: "center", fontFamily: FONT, animation: "fadeUp 0.3s ease", boxShadow: "0 24px 60px rgba(0,0,0,0.28)" }}>
                        <div style={{ width: 74, height: 74, borderRadius: "50%", background: C.successSoft, border: `2px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 34, color: C.success }}><FaCheckCircle /></div>
                        <h2 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 900, color: C.text }}>¡Pedido confirmado!</h2>
                        <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Tu pedido fue registrado. Pronto te contactaremos.</p>
                        <div style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 11, padding: "10px 18px", display: "inline-block", marginBottom: 20 }}>
                            <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Número de pedido</p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.accent }}>#{orderSuccess}</p>
                        </div>
                        <button onClick={() => setOrderSuccess(null)} style={{ width: "100%", padding: "12px", background: C.navyGrad, color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
                            Ok
                        </button>
                    </div>
                </div>
            )}

            {/* Página */}
            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, fontFamily: FONT }}>

                {/* Hero */}
                <div style={{ background: C.navyDeep, padding: "50px 32px 54px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -90, right: -90, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: -50, left: -50, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em" }}>Catálogo</p>
                        <p style={{ margin: "0 0 8px", fontWeight: 900, fontSize: "clamp(1.8rem,4vw,2.6rem)", color: "#fff", letterSpacing: "-0.02em" }}>Nuestros Productos</p>
                        <p style={{ margin: "0 0 26px", color: "rgba(255,255,255,0.5)", fontSize: 15 }}>Agrega al carrito y elige tu método de pago al finalizar</p>
                        <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>
                            <FaSearch size={13} color={searchFocused ? C.accent : "rgba(255,255,255,0.35)"} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", transition: "color 0.2s", zIndex: 1 }} />
                            <input type="text" placeholder="Buscar productos..." value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                style={{ width: "100%", padding: "12px 16px 12px 40px", fontSize: 14, fontFamily: FONT, border: `2px solid ${searchFocused ? C.accent : "rgba(255,255,255,0.15)"}`, borderRadius: 12, outline: "none", color: C.text, background: "#fff", transition: "border-color 0.2s", boxShadow: searchFocused ? "0 0 0 4px rgba(79,142,247,0.14)" : "none" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 24px 70px" }}>

                    {/* Barra info */}
                    {!cargando && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 8 }}>
                            <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 600 }}>
                                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
                                {search && <span style={{ color: C.accent }}> · "{search}"</span>}
                                {totalPgs > 1 && <><span style={{ color: C.border, margin: "0 6px" }}>|</span><span>Pág. {page}/{totalPgs}</span></>}
                            </p>
                            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                                {cartTotal > 0 && (
                                    <button onClick={() => setCartOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.navyGrad, color: "#fff", border: "none", borderRadius: 9, padding: "6px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                                        <FaShoppingCart size={11} /> {cartTotal} en carrito
                                    </button>
                                )}
                                {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Limpiar ✕</button>}
                            </div>
                        </div>
                    )}

                    {/* Skeleton */}
                    {cargando ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                                    <div style={{ height: 200, background: "linear-gradient(90deg,#f1f5f9 25%,#e8e6e1 50%,#f1f5f9 75%)", backgroundSize: "500px 100%", animation: "shimmer 1.4s infinite" }} />
                                    <div style={{ padding: 15 }}>
                                        <div style={{ height: 12, borderRadius: 5, background: "#f1f5f9", marginBottom: 7 }} />
                                        <div style={{ height: 11, borderRadius: 5, background: "#f1f5f9", width: "55%", marginBottom: 14 }} />
                                        <div style={{ height: 36, borderRadius: 9, background: "#f1f5f9" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "70px 20px", animation: "fadeUp 0.3s ease" }}>
                            <div style={{ width: 76, height: 76, borderRadius: "50%", background: C.accentSoft, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                <FaBoxOpen size={28} color={C.accent} />
                            </div>
                            <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: 17, color: C.text }}>{search ? "Sin resultados" : "Sin productos disponibles"}</p>
                            <p style={{ margin: "0 0 16px", color: C.muted, fontSize: 13 }}>{search ? `No encontramos "${search}"` : "No hay productos en este momento."}</p>
                            {search && <button onClick={() => setSearch("")} style={{ background: C.navyGrad, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Ver todos</button>}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20, animation: "fadeUp 0.3s ease" }}>
                                {pageProds.map(p => {
                                    const tallasP = obtenerTallas(p);
                                    const coloresP = obtenerColores(p);
                                    const precio = obtenerPrecio(p);
                                    return (
                                        <div key={p.ProductoID} className="prod-card" style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(26,37,64,0.06)", display: "flex", flexDirection: "column" }}>
                                            {/* Imagen */}
                                            <div style={{ position: "relative", height: 200, overflow: "hidden", background: C.bg }}>
                                                {p.ImagenProducto
                                                    ? <img src={p.ImagenProducto} alt={p.Nombre} className="prod-img" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                                                    : <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}><FaBoxOpen size={26} color={C.muted} style={{ opacity: 0.3 }} /><p style={{ margin: 0, fontSize: 11, color: C.muted, opacity: 0.55 }}>Sin imagen</p></div>
                                                }
                                                <div style={{ position: "absolute", top: 10, left: 10 }}>
                                                    <span style={{ background: C.successSoft, color: C.success, border: `1px solid ${C.successBorder}`, borderRadius: 20, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>✓ Disponible</span>
                                                </div>
                                                <div style={{ position: "absolute", top: 10, right: 10 }}>
                                                    <button className="icon-btn" onClick={() => openProductModal(p)} title="Ver detalle" style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 7px rgba(0,0,0,0.12)" }}>
                                                        <FaEye size={12} color={C.navy} />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div style={{ padding: "13px 14px", display: "flex", flexDirection: "column", flex: 1, gap: 5 }}>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{p.Nombre}</p>
                                                {p.Descripcion && <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.Descripcion}</p>}
                                                {tallasP.length > 0 && (
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                        {tallasP.map(t => <span key={t} style={{ background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{t}</span>)}
                                                    </div>
                                                )}
                                                {coloresP.length > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                        <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 600 }}>Colores:</p>
                                                        {coloresP.map(c => <span key={c} title={c} style={{ width: 14, height: 14, borderRadius: "50%", background: coloresHex[c] || "#ccc", border: "2px solid rgba(0,0,0,0.1)", display: "inline-block" }} />)}
                                                    </div>
                                                )}
                                                {/* Precio + botones */}
                                                <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><FaTag size={8} /> Desde</p>
                                                            <p style={{ margin: 0, fontWeight: 900, fontSize: 17, color: C.text }}>${precio.toLocaleString("es-CO")}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button onClick={() => openProductModal(p)}
                                                            style={{ flex: 1, padding: "8px 10px", background: C.navyGrad, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.84"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                                            <FaShoppingCart size={11} /> Agregar
                                                        </button>
                                                        <button onClick={() => openProductModal(p)}
                                                            style={{ padding: "8px 11px", background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                                            <FaEye size={11} /> Ver
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Paginación */}
                            {totalPgs > 1 && (
                                <div style={{ marginTop: 42, display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>
                                    {page < totalPgs && (
                                        <button onClick={() => setPage(p => p + 1)} style={{
                                            display: "flex", alignItems: "center", gap: 8, padding: "12px 30px",
                                            background: C.white, border: `2px solid ${C.border}`, borderRadius: 12,
                                            color: C.text, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT,
                                            transition: "all 0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; e.currentTarget.style.transform = "none"; }}>
                                            <FaChevronDown size={12} /> Ver más productos
                                            <span style={{ background: C.accentSoft, color: C.accent, borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 800 }}>
                                                {Math.max(0, filtered.length - page * PER_PAGE)} restantes
                                            </span>
                                        </button>
                                    )}
                                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                        {Array.from({ length: totalPgs }, (_, i) => i + 1).map(n => (
                                            <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{
                                                width: 33, height: 33, borderRadius: 7,
                                                border: `1.5px solid ${n === page ? C.navy : C.border}`,
                                                background: n === page ? C.navy : C.white,
                                                color: n === page ? "#fff" : C.muted,
                                                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s"
                                            }}>{n}</button>
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Mostrando {Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} productos</p>
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