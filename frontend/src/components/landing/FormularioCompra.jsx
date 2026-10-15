import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaCreditCard, FaTruck, FaBoxOpen, FaQrcode, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import Swal from "sweetalert2";
import * as api from "../../Services/api-cotizacion-landing/cotizacion-landing";
import { getVariantesByProducto } from '../../Services/api-productos/variantes';
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import { crearVenta } from '../../Services/api-ventas/ventas';

/* ── Tokens de color ── */
const C = {
    navy: "#1a2540",
    navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
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
    border: "#e2e8f0",
    bg: "#f8fafc",
};

/* ── Helpers de estilo ── */
const selectStyle = (focused) => ({
    width: "100%", padding: "10px 14px", fontSize: 13,
    fontFamily: "'Outfit',sans-serif",
    border: `1.5px solid ${focused ? C.accent : C.border}`,
    borderRadius: 10, outline: "none", color: "#0f172a",
    background: "#fff", transition: "border-color 0.15s",
    cursor: "pointer", appearance: "none", WebkitAppearance: "none",
});

const inputStyle = (focused, error) => ({
    width: "100%", padding: "10px 14px", fontSize: 13,
    fontFamily: "'Outfit',sans-serif",
    border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
    borderRadius: 10, outline: "none", color: "#0f172a",
    background: error ? C.dangerSoft : "#fff",
    transition: "border-color 0.15s", boxSizing: "border-box",
});

/* ── SelectField wrapper con chevron ── */
const SelectField = ({ label, value, onChange, disabled, children, required }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            <div style={{ position: "relative" }}>
                <select value={value} onChange={onChange} disabled={disabled} required={required}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ ...selectStyle(focused), opacity: disabled ? 0.6 : 1, paddingRight: 36 }}>
                    {children}
                </select>
                <FaChevronDown size={11} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
        </div>
    );
};

/* ── InputField ── */
const InputField = ({ label, type = "text", value, onChange, placeholder, required, maxLength, hint, pattern }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder}
                required={required} maxLength={maxLength} pattern={pattern}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={inputStyle(focused)} />
            {hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.muted }}>{hint}</p>}
        </div>
    );
};

/* ── SectionCard ── */
const SectionCard = ({ title, icon, children }) => (
    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(26,37,64,0.06)", overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9, background: C.bg }}>
            {icon && <span style={{ color: C.accent }}>{icon}</span>}
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.navy }}>{title}</p>
        </div>
        <div style={{ padding: "18px 20px" }}>
            {children}
        </div>
    </div>
);

/* ── Radio de método de pago ── */
const MetodoRadio = ({ id, value, checked, onChange, icon, label, color }) => (
    <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${checked ? color : C.border}`, background: checked ? `${color}0d` : "#fff", cursor: "pointer", transition: "all 0.15s", marginBottom: 10 }}>
        <input type="radio" id={id} name="metodoPago" value={value} checked={checked} onChange={onChange} style={{ display: "none" }} />
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${checked ? color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {checked && <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />}
        </div>
        <span style={{ color }}>{icon}</span>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: checked ? color : C.navy }}>{label}</p>
    </label>
);

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
const FormularioCompra = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const producto = location.state?.producto;

    const [usuario, setUsuario] = useState(null);
    const [colorID, setColorID] = useState("");
    const [tallaID, setTallaID] = useState("");
    const [telaID, setTelaID] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [metodoPago, setMetodoPago] = useState("");
    const [mostrarQR, setMostrarQR] = useState(false);
    const [comprobanteArchivo, setComprobanteArchivo] = useState(null);
    const [direccionEntrega, setDireccionEntrega] = useState("");
    const [telefonoEntrega, setTelefonoEntrega] = useState("");
    const [nombreReceptor, setNombreReceptor] = useState("");
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [variantesProducto, setVariantesProducto] = useState([]);
    const [cargando, setCargando] = useState(false);

    /* ── Focused states ── */
    const [cantidadFocused, setCantidadFocused] = useState(false);
    const [textareaFocused, setTextareaFocused] = useState(false);

    useEffect(() => {
        verificarAutenticacion();
        if (!producto) { navigate("/productosLanding"); return; }
        cargarCatalogos();
    }, [producto, navigate]);

    useEffect(() => {
        if (!producto || variantesProducto.length === 0) return;
        if (colorID && !obtenerColoresDisponibles().some(c => c.ColorID === parseInt(colorID))) {
            setColorID(""); setTallaID(""); setTelaID(""); return;
        }
        if (tallaID && !obtenerTallasDisponibles().some(t => t.TallaID === parseInt(tallaID))) {
            setTallaID(""); setTelaID(""); return;
        }
        if (telaID && !obtenerTelasDisponibles().some(t => t.InsumoID === parseInt(telaID))) setTelaID("");
    }, [colorID, tallaID, variantesProducto]);

    const verificarAutenticacion = () => {
        const usuarioStorage = localStorage.getItem("usuario");
        if (!usuarioStorage) {
            Swal.fire({ icon: "warning", title: "Autenticación requerida", text: "Debes iniciar sesión para comprar productos." })
                .then(() => navigate("/login"));
            return;
        }
        const user = JSON.parse(usuarioStorage);
        setUsuario(user);
        setNombreReceptor(user.Nombre || "");
        setTelefonoEntrega(user.Telefono || "");
        setDireccionEntrega(user.Direccion || "");
    };

    const cargarCatalogos = async () => {
        try {
            const [colData, tallData, telData] = await Promise.all([api.getColores(), api.getTallas(), api.getTelas()]);
            setColores(colData || []); setTallas(tallData || []); setTelas(telData || []);
            const variantesRes = await getVariantesByProducto(producto.ProductoID);
            const variantes = variantesRes.datos || variantesRes;
            setVariantesProducto(variantes.filter(v => v.Estado && v.Stock > 0));
        } catch (error) {
            Swal.fire("Error", "No se pudieron cargar los datos del producto", "error");
        }
    };

    const obtenerColoresDisponibles = () => {
        if (!variantesProducto.length) return colores;
        const ids = [...new Set(variantesProducto.filter(v => v.Estado && v.Stock > 0).map(v => v.ColorID))];
        return colores.filter(c => ids.includes(c.ColorID));
    };

    const obtenerTallasDisponibles = () => {
        if (!variantesProducto.length) return tallas;
        const filtered = colorID
            ? variantesProducto.filter(v => v.Estado && v.Stock > 0 && v.ColorID === parseInt(colorID))
            : variantesProducto.filter(v => v.Estado && v.Stock > 0);
        const ids = [...new Set(filtered.map(v => v.TallaID))];
        return tallas.filter(t => ids.includes(t.TallaID));
    };

    const obtenerTelasDisponibles = () => {
        if (!variantesProducto.length) return telas;
        const filtered = variantesProducto.filter(v => {
            const cc = !colorID || v.ColorID === parseInt(colorID);
            const ct = !tallaID || v.TallaID === parseInt(tallaID);
            return v.Estado && v.Stock > 0 && cc && ct;
        });
        const ids = [...new Set(filtered.filter(v => v.TelaID).map(v => v.TelaID))];
        return telas.filter(t => ids.includes(t.InsumoID));
    };

    const coloresDisponibles = obtenerColoresDisponibles();
    const tallasDisponibles = obtenerTallasDisponibles();
    const telasDisponibles = obtenerTelasDisponibles();

    /* ── Validaciones (sin cambios de lógica) ── */
    const validarNombreReceptor = (n) => {
        const t = n.trim();
        if (!t.length) return { valido: false, mensaje: "El nombre no puede estar vacío." };
        if (t.length < 3) return { valido: false, mensaje: "El nombre debe tener al menos 3 caracteres." };
        if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s'-]+$/.test(t)) return { valido: false, mensaje: "El nombre solo puede contener letras, espacios y guiones." };
        return { valido: true };
    };
    const validarTelefono = (tel) => {
        const t = tel.trim(); const limpio = t.replace(/[\s\-()]/g, '');
        if (!t.length) return { valido: false, mensaje: "El teléfono no puede estar vacío." };
        if (!/^\d+$/.test(limpio)) return { valido: false, mensaje: "El teléfono solo puede contener números." };
        if (limpio.length < 7 || limpio.length > 10) return { valido: false, mensaje: "El teléfono debe tener entre 7 y 10 dígitos." };
        return { valido: true, telefonoLimpio: limpio };
    };
    const validarDireccion = (d) => {
        const t = d.trim();
        if (!t.length) return { valido: false, mensaje: "La dirección no puede estar vacía." };
        if (t.length < 10) return { valido: false, mensaje: "La dirección debe tener al menos 10 caracteres." };
        if (!/\d/.test(t)) return { valido: false, mensaje: "La dirección debe incluir un número." };
        return { valido: true };
    };
    const validarStockDisponible = () => {
        const cant = parseInt(cantidad) || 0;
        const variante = variantesProducto.find(v => {
            const cc = !colorID || v.ColorID === parseInt(colorID);
            const ct = !tallaID || v.TallaID === parseInt(tallaID);
            const cte = !telaID || v.TelaID === parseInt(telaID);
            return cc && ct && cte && v.Estado;
        });
        if (!variante) return { valido: false, mensaje: "No existe esta combinación. Por favor verifica tu selección." };
        const stock = variante.Stock || 0;
        if (stock < cant) return { valido: false, mensaje: `Solo hay ${stock} unidad(es) disponible(s).`, stockDisponible: stock };
        return { valido: true, stockDisponible: stock };
    };

    const validarFormularioCompleto = () => {
        if (!metodoPago) { Swal.fire("Atención", "Selecciona un método de pago.", "warning"); return false; }
        if (metodoPago === "transferencia") {
            if (!comprobanteArchivo) { Swal.fire("Atención", "Debes subir el comprobante de transferencia.", "warning"); return false; }
            if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(comprobanteArchivo.type)) { Swal.fire("Atención", "El comprobante debe ser JPG, PNG o PDF.", "warning"); return false; }
            if (comprobanteArchivo.size > 5 * 1024 * 1024) { Swal.fire("Atención", "El comprobante no puede pesar más de 5MB.", "warning"); return false; }
        }
        if (metodoPago === "contraentrega") {
            const vn = validarNombreReceptor(nombreReceptor); if (!vn.valido) { Swal.fire("Atención", vn.mensaje, "warning"); return false; }
            const vt = validarTelefono(telefonoEntrega); if (!vt.valido) { Swal.fire("Atención", vt.mensaje, "warning"); return false; }
            const vd = validarDireccion(direccionEntrega); if (!vd.valido) { Swal.fire("Atención", vd.mensaje, "warning"); return false; }
        }
        if (coloresDisponibles.length > 0 && !colorID) { Swal.fire("Atención", "Debes seleccionar un color.", "warning"); return false; }
        if (tallasDisponibles.length > 0 && !tallaID) { Swal.fire("Atención", "Debes seleccionar una talla.", "warning"); return false; }
        if (telasDisponibles.length > 0 && !telaID) { Swal.fire("Atención", "Debes seleccionar una tela.", "warning"); return false; }
        const vs = validarStockDisponible();
        const cant = parseInt(cantidad);
        if (isNaN(cant) || cant < 1) { Swal.fire("Atención", "La cantidad mínima es 1.", "warning"); return false; }
        if (cant > 100) { Swal.fire("Atención", "La cantidad máxima es 100 unidades.", "warning"); return false; }
        if (!vs.valido) { Swal.fire({ icon: "error", title: "Stock insuficiente", text: vs.mensaje, confirmButtonColor: C.danger }); return false; }
        return true;
    };

    const calcularPrecioTotal = () => {
        const tallaObj = tallasDisponibles.length > 0 && tallaID ? tallas.find(t => t.TallaID === parseInt(tallaID)) : null;
        const precioTalla = parseFloat(tallaObj?.Precio) || 0;
        const telaObj = telasDisponibles.length > 0 && telaID ? telas.find(t => t.InsumoID === parseInt(telaID)) : null;
        const precioTela = parseFloat(telaObj?.PrecioTela) || 0;
        const precioBaseProducto = parseFloat(producto?.PrecioBase) || 0;
        const precioUnitario = precioBaseProducto + precioTalla + precioTela;
        const cantidadUnidades = parseInt(cantidad) || 1;
        return { precioBaseProducto, precioTalla, precioTela, precioUnitario, cantidadUnidades, subtotal: precioUnitario * cantidadUnidades };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usuario) { Swal.fire("Error", "No hay usuario autenticado.", "error"); return; }
        if (!validarFormularioCompleto()) return;
        setCargando(true);
        try {
            const precios = calcularPrecioTotal();
            let comprobanteBase64 = null;
            if (metodoPago === "transferencia" && comprobanteArchivo) {
                comprobanteBase64 = await new Promise((res, rej) => {
                    const r = new FileReader(); r.readAsDataURL(comprobanteArchivo);
                    r.onload = () => res(r.result); r.onerror = rej;
                });
            }
            const ventaData = {
                DocumentoID: usuario.DocumentoID,
                Subtotal: precios.subtotal, Total: precios.subtotal, EstadoID: 8,
                detalles: [{ ProductoID: producto.ProductoID, ColorID: colorID ? parseInt(colorID) : null, TallaID: tallaID ? parseInt(tallaID) : null, Cantidad: parseInt(cantidad), PrecioUnitario: precios.precioUnitario }],
                metodoPago,
                ...(metodoPago === "transferencia" && { comprobanteTransferencia: comprobanteBase64, fechaTransferencia: new Date().toISOString() }),
                ...(metodoPago === "contraentrega" && { nombreReceptor, telefonoEntrega, direccionEntrega }),
            };
            const response = await crearVenta(ventaData);
            await Swal.fire({
                icon: "success", title: "¡Pedido registrado!",
                html: `<p style="font-family:'Outfit',sans-serif"><strong>Pedido #${response.venta?.VentaID || "N/A"}</strong><br>Método: ${metodoPago === "transferencia" ? "Transferencia bancaria" : "Contraentrega"}<br>Total: <strong style="color:${C.success}">$${precios.subtotal.toLocaleString()}</strong></p>`,
                confirmButtonColor: C.navy, confirmButtonText: "OK",
            });
            navigate("/productosLanding");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al procesar tu pedido.", confirmButtonColor: C.danger });
        } finally { setCargando(false); }
    };

    if (!producto) return null;
    const precios = calcularPrecioTotal();
    const validacionStock = validarStockDisponible();

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from{opacity:0;max-height:0;overflow:hidden} to{opacity:1;max-height:600px} }
        .upload-area:hover { border-color: ${C.accent} !important; background: ${C.accentSoft} !important; }
        .compra-sticky { position: sticky; top: 24px; }
      `}</style>

            <NavbarComponent />

            <div style={{ minHeight: "calc(100vh - 72px)", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>

                {/* ── Hero ── */}
                <div style={{ background: C.navyGrad, padding: "36px 24px 44px", textAlign: "center" }}>
                    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
                        <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}>
                            Comprar: {producto.Nombre}
                        </p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                            Completa el formulario para confirmar tu pedido
                        </p>
                    </div>
                </div>

                {/* ── Grid principal ── */}
                <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 20px 60px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}
                    className="compra-grid">
                    <style>{`@media(max-width:768px){.compra-grid{grid-template-columns:1fr !important}}`}</style>

                    {/* ══════ PANEL IZQUIERDO – Resumen ══════ */}
                    <div className="compra-sticky" style={{ animation: "fadeIn 0.35s ease" }}>

                        {/* Imagen producto */}
                        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(26,37,64,0.06)", overflow: "hidden", marginBottom: 16 }}>
                            <div style={{ height: 240, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                                {producto.ImagenProducto
                                    ? <img src={producto.ImagenProducto} alt={producto.Nombre} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                                    : <FaBoxOpen size={48} color={C.muted} style={{ opacity: 0.3 }} />}
                            </div>
                            <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
                                <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 15, color: C.navy }}>{producto.Nombre}</p>
                                {producto.Descripcion && <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{producto.Descripcion}</p>}
                            </div>
                        </div>

                        {/* Resumen de precios */}
                        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(26,37,64,0.06)", overflow: "hidden" }}>
                            <div style={{ background: C.navyGrad, padding: "14px 18px" }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#fff" }}>Resumen del Pedido</p>
                            </div>
                            <div style={{ padding: "16px 18px" }}>
                                {[
                                    { label: "Precio base", value: `$${precios.precioBaseProducto.toLocaleString()}` },
                                    ...(tallasDisponibles.length > 0 && tallaID ? [{ label: "Talla", value: `+$${precios.precioTalla.toLocaleString()}` }] : []),
                                    ...(telasDisponibles.length > 0 && telaID ? [{ label: "Tela", value: `+$${precios.precioTela.toLocaleString()}` }] : []),
                                    { label: "Precio unitario", value: `$${precios.precioUnitario.toLocaleString()}`, bold: true },
                                    { label: "Cantidad", value: `× ${precios.cantidadUnidades}`, bold: true },
                                ].map(({ label, value, bold }, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                                        <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
                                        <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: bold ? C.navy : C.muted }}>{value}</span>
                                    </div>
                                ))}
                                {/* Total */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 4px" }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Total</span>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: C.success }}>${precios.subtotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══════ PANEL DERECHO – Formulario ══════ */}
                    <form onSubmit={handleSubmit} style={{ animation: "fadeIn 0.35s ease 0.05s both" }}>

                        {/* ── Características ── */}
                        <SectionCard title="Características del Producto">
                            <div style={{ display: "grid", gridTemplateColumns: coloresDisponibles.length > 0 && tallasDisponibles.length > 0 ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 14 }}>
                                {coloresDisponibles.length > 0 && (
                                    <SelectField label="Color" value={colorID} required
                                        onChange={e => { setColorID(e.target.value); setTallaID(""); setTelaID(""); }}>
                                        <option value="">Seleccionar...</option>
                                        {coloresDisponibles.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                    </SelectField>
                                )}
                                {tallasDisponibles.length > 0 && (
                                    <SelectField label="Talla" value={tallaID} required
                                        onChange={e => { setTallaID(e.target.value); setTelaID(""); }}>
                                        <option value="">{!colorID ? "Primero selecciona un color" : "Seleccionar..."}</option>
                                        {tallasDisponibles.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre} — +${t.Precio?.toLocaleString()}</option>)}
                                    </SelectField>
                                )}
                            </div>
                            {telasDisponibles.length > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <SelectField label="Tipo de Tela" value={telaID} required
                                        onChange={e => setTelaID(e.target.value)}>
                                        <option value="">{!colorID || !tallaID ? "Primero selecciona color y talla" : "Seleccionar..."}</option>
                                        {telasDisponibles.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre} — +${t.PrecioTela?.toLocaleString()}</option>)}
                                    </SelectField>
                                </div>
                            )}
                            {/* Cantidad */}
                            <div style={{ maxWidth: 200 }}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                    Cantidad <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input type="number" min="1" max="100" value={cantidad}
                                    onChange={e => { const v = e.target.value; if (v === '' || (parseInt(v) > 0 && parseInt(v) <= 100)) setCantidad(v); }}
                                    onFocus={() => setCantidadFocused(true)} onBlur={() => setCantidadFocused(false)}
                                    style={inputStyle(cantidadFocused)} required />
                                {validacionStock.stockDisponible !== undefined && (
                                    <p style={{ margin: "5px 0 0", fontSize: 12, color: C.muted }}>
                                        Stock disponible: <strong style={{ color: validacionStock.stockDisponible > 0 ? C.success : C.danger }}>{validacionStock.stockDisponible} unidades</strong>
                                    </p>
                                )}
                            </div>
                        </SectionCard>

                        {/* ── Método de pago ── */}
                        <SectionCard title="Método de Pago" icon={<FaCreditCard size={14} />}>

                            <MetodoRadio id="pago-transferencia" value="transferencia" checked={metodoPago === "transferencia"}
                                onChange={e => setMetodoPago(e.target.value)}
                                icon={<FaCreditCard size={14} />} label="Transferencia Bancaria" color={C.accent} />

                            {/* Bloque transferencia */}
                            {metodoPago === "transferencia" && (
                                <div style={{ marginBottom: 14, animation: "slideDown 0.25s ease", borderRadius: 12, border: `1.5px solid ${C.accentBorder}`, background: C.accentSoft, overflow: "hidden" }}>
                                    {/* Datos bancarios */}
                                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.accentBorder}` }}>
                                        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos bancarios</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                                            {[["Banco", "Bancolombia"], ["Cuenta", "1234-5678-9012"], ["Titular", "La Empresa"]].map(([k, v]) => (
                                                <div key={k} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.accentBorder}`, gridColumn: k === "Titular" ? "1/-1" : "auto" }}>
                                                    <p style={{ margin: "0 0 2px", fontSize: 11, color: C.muted, fontWeight: 600 }}>{k}</p>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* QR */}
                                    <div style={{ padding: "12px 16px" }}>
                                        <button type="button" onClick={() => setMostrarQR(!mostrarQR)}
                                            style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: `1.5px solid ${C.accentBorder}`, borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: C.accent, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                            {mostrarQR ? <FaEyeSlash size={12} /> : <FaQrcode size={12} />}
                                            {mostrarQR ? "Ocultar QR" : "Ver código QR"}
                                        </button>
                                        {mostrarQR && (
                                            <div style={{ marginTop: 12, textAlign: "center" }}>
                                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALoAAAC6CAMAAAAu0KfDAAAABlBMVEX///8AAABVwtN+AAABxklEQVR4nO3QUZKDQAwD0eT+l94DgJQeCAXOtr4oGKzneb2MMebivHHSX31mbzljkC5d+hT6tj6dIcuQ+vRMDNKlS59I5zX9ZKKQ98QgXbr0X6X3f9P5NEG6dOnSSTGnk6/SpUv/PXrHEXpHHLsa6dKlT6cfq/nuMzdIly59Cv18SMGF9Wci/Y5IvyM301N9quxEshJZAy0sXbr0x9NJWRqXWH2NnnQR0qVLn0XvUL79KqVfFmmULl36FHpC9xBoByFi+ipduvQh9D4ivUllqwvwq5EuXfpEOjoK6NsJxy6iLyxduvRZ9M4lX8mSx7rieenSpQ+hry6z/TdVrl5E/1e6dOmz6H2B/kyI6TmtmhaLy0iXLv3B9FXWauXq5NSyE+nSpT+enupTyEoESto/oKVLl/54emKREemvPqf/tWCQLl36EHpfKYWc54vxLunSpU+hr2Zbn3Dkfb+yPkG6dOnPp79xTtWErmPXIV269Fn0nQ/hTHomK5FeflK6dOmz6O9N+Lgz6/XsoKVLl/6j9PS1V/LFert06dL/A31nUM13J0iXLn0inRfz9JnbM/3ipEuXPpF+DEGInN5bpEuXPpFujDEX5A/WVTvF1c+o+gAAAABJRU5ErkJggg=="
                                                    alt="QR" style={{ width: 160, height: 160, borderRadius: 10, border: `2px solid ${C.accentBorder}`, padding: 8, background: "#fff" }} />
                                                <p style={{ margin: "8px 0 0", fontSize: 12, color: C.muted }}>Escanea para realizar el pago</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Upload comprobante */}
                            {metodoPago === "transferencia" && (
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                        Comprobante de pago <span style={{ color: C.danger }}>*</span>
                                    </label>
                                    <label className="upload-area" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 16px", border: `2px dashed ${comprobanteArchivo ? C.success : C.border}`, borderRadius: 12, background: comprobanteArchivo ? C.successSoft : "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                                        <input type="file" accept="image/*,.pdf" onChange={e => setComprobanteArchivo(e.target.files[0])} style={{ display: "none" }} required />
                                        <FaShoppingCart size={20} color={comprobanteArchivo ? C.success : C.muted} style={{ opacity: 0.6 }} />
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: comprobanteArchivo ? C.success : C.muted }}>
                                            {comprobanteArchivo ? `✓ ${comprobanteArchivo.name}` : "Haz clic para subir el comprobante"}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>JPG, PNG o PDF · Máx. 5MB</p>
                                    </label>
                                </div>
                            )}

                            <MetodoRadio id="pago-contraentrega" value="contraentrega" checked={metodoPago === "contraentrega"}
                                onChange={e => setMetodoPago(e.target.value)}
                                icon={<FaTruck size={14} />} label="Pago Contraentrega" color={C.success} />

                            {/* Bloque contraentrega */}
                            {metodoPago === "contraentrega" && (
                                <div style={{ animation: "slideDown 0.25s ease", borderRadius: 12, border: `1.5px solid ${C.successBorder}`, background: C.successSoft, padding: "16px 18px", marginTop: 4 }}>
                                    <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: C.success, textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos de entrega</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                        <InputField label="Nombre de quien recibe" value={nombreReceptor}
                                            onChange={e => setNombreReceptor(e.target.value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s'-]/g, ''))}
                                            placeholder="Ej: Juan Pérez" required maxLength={100} />
                                        <InputField label="Teléfono de contacto" value={telefonoEntrega}
                                            onChange={e => setTelefonoEntrega(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                                            placeholder="Ej: 3001234567" required maxLength={10} />
                                        <div>
                                            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: 13, color: C.navy }}>
                                                Dirección de entrega <span style={{ color: C.danger }}>*</span>
                                            </label>
                                            <textarea rows={2} value={direccionEntrega} onChange={e => setDireccionEntrega(e.target.value)}
                                                placeholder="Ej: Calle 123 #45-67, Apto 301" required maxLength={250}
                                                onFocus={() => setTextareaFocused(true)} onBlur={() => setTextareaFocused(false)}
                                                style={{ ...inputStyle(textareaFocused), resize: "vertical", minHeight: 72 }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {/* ── Botones ── */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                            <button type="button" onClick={() => navigate("/productosLanding")} disabled={cargando}
                                style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={cargando}
                                style={{ background: cargando ? C.muted : C.navyGrad, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: cargando ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.15s" }}
                                onMouseEnter={e => { if (!cargando) e.currentTarget.style.opacity = "0.88"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                                {cargando ? (
                                    <>
                                        <div style={{ width: 15, height: 15, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                        Procesando...
                                    </>
                                ) : (
                                    <><FaShoppingCart size={13} /> Confirmar Pedido</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default FormularioCompra;