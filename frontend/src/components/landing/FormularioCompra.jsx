import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaCreditCard, FaTruck, FaBoxOpen, FaQrcode, FaEyeSlash, FaChevronDown, FaCloudUploadAlt, FaCheckCircle, FaPalette, FaLock } from "react-icons/fa";
import Swal from "sweetalert2";
import * as api from "../../Services/api-cotizacion-landing/cotizacion-landing";
import { getVariantesByProducto } from '../../Services/api-productos/variantes';
import NavbarComponent from "../landing/NavBarLanding";
import FooterComponent from "../landing/footer";
import { crearVenta } from '../../Services/api-ventas/ventas';
import usePlus from "../../hooks/usePlus";
import { MC_CSS, leerUsuario, MiCuentaHero } from "./miCuentaKit";
import { ESTADO_VENTA } from "../../config/estados";
import { getConfigPublica, CONFIG_POR_DEFECTO } from "../../Services/api-cliente/cliente";
import { textoCostoEnvio, num } from "../../utils/clienteUtils";
import { FaStore } from "react-icons/fa";
import { C } from "../../config/tokens";

/* ── Tokens de color ── */

/* ── SelectField wrapper con chevron ── */
const SelectField = ({ label, value, onChange, disabled, children, required }) => (
    <div className="mc-field">
        <label>{label} {required && <i>*</i>}</label>
        <div className="mc-selwrap">
            <select className="mc-input" value={value} onChange={onChange} disabled={disabled} required={required}>
                {children}
            </select>
            <FaChevronDown size={11} />
        </div>
    </div>
);

/* ── InputField ── */
const InputField = ({ label, type = "text", value, onChange, placeholder, required, maxLength, hint, pattern }) => (
    <div className="mc-field">
        <label>{label} {required && <i>*</i>}</label>
        <input className="mc-input" type={type} value={value} onChange={onChange} placeholder={placeholder}
            required={required} maxLength={maxLength} pattern={pattern} />
        {hint && <p className="mc-hint">{hint}</p>}
    </div>
);

/* ── SectionCard numerada ── */
const SectionCard = ({ title, icon, n, children }) => (
    <div className="mc-fsec mc-fc-sec sx-reveal">
        <p className="mc-fsec-h"><span>{icon || n}</span> {title}</p>
        {children}
    </div>
);

/* ── Radio de método de pago ── */
const MetodoRadio = ({ id, value, checked, onChange, icon, label, color, desc, name = "metodoPago" }) => (
    <label htmlFor={id} className={`mc-pay ${checked ? "on" : ""}`} style={{ "--pc": color }}>
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={onChange} style={{ display: "none" }} />
        <span className="mc-pay-ico">{icon}</span>
        <span style={{ flex: 1 }}>
            <b>{label}</b>
            <small>{desc}</small>
        </span>
        <span className="mc-pay-dot">{checked && <FaCheckCircle size={14} />}</span>
    </label>
);

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
const FormularioCompra = () => {
    usePlus();
    const location = useLocation();
    const navigate = useNavigate();
    const producto = location.state?.producto;

    const [usuario, setUsuario] = useState(null);
    const [colorID, setColorID] = useState("");
    const [tallaID, setTallaID] = useState("");
    const [telaID, setTelaID] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [metodoPago, setMetodoPago] = useState("");
    const [tipoEntrega, setTipoEntrega] = useState("retiro");
    const [config, setConfig] = useState(CONFIG_POR_DEFECTO);
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
    const enviandoRef = useRef(false); // seguro contra doble clic

    useEffect(() => { getConfigPublica().then(setConfig); }, []);
    const esEnvio = tipoEntrega === "envio";
    const envioNum = esEnvio ? num(config?.costoEnvio) : 0;
    const pideDatosEntrega = metodoPago === "contraentrega" || esEnvio;

    useEffect(() => {
        verificarAutenticacion();
        if (!producto) { navigate("/productosLanding"); return; }
        cargarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
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
        } catch {
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
        if (pideDatosEntrega) {
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
        if (enviandoRef.current) return;
        enviandoRef.current = true;
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
                Subtotal: precios.subtotal, Total: precios.subtotal, EstadoID: ESTADO_VENTA.PENDIENTE,
                detalles: [{ ProductoID: producto.ProductoID, ColorID: colorID ? parseInt(colorID) : null, TallaID: tallaID ? parseInt(tallaID) : null, Cantidad: parseInt(cantidad), PrecioUnitario: precios.precioUnitario }],
                metodoPago, tipoEntrega,
                ...(metodoPago === "transferencia" && { comprobanteTransferencia: comprobanteBase64, fechaTransferencia: new Date().toISOString() }),
                ...(pideDatosEntrega && { nombreReceptor, telefonoEntrega, direccionEntrega }),
            };
            const response = await crearVenta(ventaData);
            await Swal.fire({
                icon: "success", title: "¡Pedido registrado!",
                html: `<p style="font-family:'Outfit',sans-serif"><strong>Pedido #${response.venta?.VentaID || "N/A"}</strong><br>Método: ${metodoPago === "transferencia" ? "Transferencia bancaria" : "Contraentrega"}<br>Total: <strong style="color:${C.success}">$${(precios.subtotal + envioNum).toLocaleString()}</strong>${esEnvio ? "<br>Incluye envío a domicilio" : ""}</p>`,
                confirmButtonColor: C.navy, confirmButtonText: "OK",
            });
            navigate("/productosLanding");
        } catch (error) {
            Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Error al procesar tu pedido.", confirmButtonColor: C.danger });
        } finally { enviandoRef.current = false; setCargando(false); }
    };

    if (!producto) return null;
    const precios = calcularPrecioTotal();
    const validacionStock = validarStockDisponible();

    return (
        <>
            <style>{MC_CSS + `
            .mc-fc-grid { display: grid; grid-template-columns: 340px 1fr; gap: 28px; align-items: start; }
            .mc-fc-side { position: sticky; top: 90px; display: flex; flex-direction: column; gap: 20px; }
            .mc-fc-img { height: 270px; display: grid; place-items: center; padding: 18px; background: radial-gradient(circle at 50% 40%, #fff, #eaf0fb); position: relative; overflow: hidden; }
            .mc-fc-img img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 18px 24px rgba(26,37,64,.25)); transition: transform .8s var(--sx-ease); }
            .mc-fc-side .mc-glass-card:hover .mc-fc-img img { transform: scale(1.07) rotate(-1.5deg); }
            .mc-fc-name { padding: 18px 22px 20px; }
            .mc-fc-name h3 { margin: 0 0 6px; font-size: 19px; font-weight: 900; letter-spacing: -.02em; color: #1a2540; }
            .mc-fc-name p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.55; }
            .mc-fc-sum { background: #fff; border-radius: 18px; border: 1px solid #e2e8f0; position: relative; overflow: hidden; box-shadow: var(--sx-shadow-1); }
            .mc-fc-sum-b { padding: 16px 20px 18px; }
            .mc-fc-sum h4 { margin: 0; padding: 14px 20px; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(90deg, #1a2540, #2d3f6e); }
            .mc-fc-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
            .mc-fc-row b { color: #1a2540; font-weight: 700; }
            .mc-fc-tot { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; }
            .mc-fc-tot span { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; font-weight: 800; color: #1a2540; }
            .mc-fc-tot strong { font-size: 26px; font-weight: 900; letter-spacing: -.03em; line-height: 1; color: #16a34a; font-variant-numeric: tabular-nums; }
            .mc-secure { display: flex; gap: 8px; align-items: center; margin-top: 16px; font-size: 12px; color: #94a3b8; }
            .mc-pay { display: flex; align-items: center; gap: 14px; padding: 15px 18px; border-radius: 18px; border: 1.5px solid #dbe3ef; background: #fff; cursor: pointer; margin-bottom: 12px; transition: all .3s var(--sx-ease); }
            .mc-pay:hover { border-color: var(--pc); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(15,23,42,.08); }
            .mc-pay.on { border-color: var(--pc); background: linear-gradient(135deg, color-mix(in srgb, var(--pc) 9%, #fff), #fff); box-shadow: 0 0 0 4px color-mix(in srgb, var(--pc) 16%, transparent); }
            .mc-pay-ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: #fff; background: var(--pc); font-size: 17px; box-shadow: 0 8px 18px color-mix(in srgb, var(--pc) 40%, transparent); }
            .mc-pay b { display: block; font-size: 15px; font-weight: 800; color: #1a2540; }
            .mc-pay small { font-size: 12px; color: #64748b; }
            .mc-pay-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #cbd5e1; display: grid; place-items: center; color: #fff; background: #fff; transition: all .3s; }
            .mc-pay.on .mc-pay-dot { background: var(--pc); border-color: var(--pc); }
            .mc-reveal { animation: sx-in-up .5s var(--sx-ease); }
            .mc-bank { border-radius: 18px; border: 1.5px solid #c7d9ff; background: linear-gradient(135deg, #eef3ff, #f5f0ff); padding: 16px; margin: -2px 0 14px; }
            .mc-bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .mc-bank-grid > div { background: #fff; border: 1px solid #c7d9ff; border-radius: 12px; padding: 9px 13px; }
            .mc-bank-grid small { display: block; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; font-weight: 800; color: #94a3b8; }
            .mc-bank-grid b { font-size: 14px; color: #1a2540; }
            .mc-qrbtn { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; padding: 9px 16px; border-radius: 12px; border: 1.5px solid #c7d9ff; background: #fff; color: #3b6fe0; font-size: 12.5px; font-weight: 800; cursor: pointer; transition: all .25s; }
            .mc-qrbtn:hover { background: #4f8ef7; color: #fff; border-color: #4f8ef7; }
            .mc-upload { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 26px 16px; border: 2px dashed #cbd5e1; border-radius: 18px; background: #fff; cursor: pointer; transition: all .3s; text-align: center; }
            .mc-upload:hover { border-color: #4f8ef7; background: #f4f8ff; transform: translateY(-2px); }
            .mc-upload.done { border-color: #16a34a; background: #f0fdf4; }
            .mc-upload svg { font-size: 30px; color: #4f8ef7; } .mc-upload.done svg { color: #16a34a; }
            .mc-upload p { margin: 0; font-size: 14px; font-weight: 700; color: #475569; } .mc-upload small { font-size: 12px; color: #94a3b8; }
            .mc-deliver { border-radius: 18px; border: 1.5px solid #bbf7d0; background: linear-gradient(135deg, #f0fdf4, #f7fffa); padding: 18px; margin-top: 2px; display: flex; flex-direction: column; gap: 16px; }
            @media (max-width: 900px) { .mc-fc-grid { grid-template-columns: 1fr; } .mc-fc-side { position: static; } }
            @media (max-width: 560px) { .mc-bank-grid { grid-template-columns: 1fr; } .mc-fc-img { height: 220px; } }
            `}</style>

            <NavbarComponent />

            <div className="mc-page">
                <MiCuentaHero eyebrow="Finaliza tu pedido" title="Comprar:" accent={producto.Nombre} nombre={leerUsuario().Nombre || ""}
                    sub="Completa el formulario para confirmar tu pedido." />

                <div className="mc-wrap" style={{ maxWidth: 1040 }}>
                    <div className="mc-fc-grid">

                        {/* ══════ PANEL IZQUIERDO – Resumen ══════ */}
                        <div className="mc-fc-side">
                            <div className="mc-glass-card sx-reveal">
                                <div className="mc-fc-img">
                                    {producto.ImagenProducto
                                        ? <img src={producto.ImagenProducto} alt={producto.Nombre} />
                                        : <FaBoxOpen size={56} color={C.muted} style={{ opacity: 0.3 }} />}
                                </div>
                                <div className="mc-fc-name">
                                    <h3>{producto.Nombre}</h3>
                                    {producto.Descripcion && <p>{producto.Descripcion}</p>}
                                </div>
                            </div>

                            <div className="mc-fc-sum sx-reveal" style={{ "--sx-i": 1 }}>
                                <h4>Resumen del Pedido</h4>
                                <div className="mc-fc-sum-b">
                                    {[
                                        { label: "Precio base", value: `$${precios.precioBaseProducto.toLocaleString()}` },
                                        ...(tallasDisponibles.length > 0 && tallaID ? [{ label: "Talla", value: `+$${precios.precioTalla.toLocaleString()}` }] : []),
                                        ...(telasDisponibles.length > 0 && telaID ? [{ label: "Tela", value: `+$${precios.precioTela.toLocaleString()}` }] : []),
                                        { label: "Precio unitario", value: `$${precios.precioUnitario.toLocaleString()}` },
                                        { label: "Cantidad", value: `× ${precios.cantidadUnidades}` },
                                    ].map(({ label, value }, i) => (
                                        <div key={i} className="mc-fc-row"><span>{label}</span><b>{value}</b></div>
                                    ))}
                                    {esEnvio && <div className="mc-fc-row"><span>Envío a domicilio</span><b>{envioNum > 0 ? `$${envioNum.toLocaleString("es-CO")}` : textoCostoEnvio(config?.costoEnvio)}</b></div>}
                                    <div className="mc-fc-tot"><span>Total</span><strong>${(precios.subtotal + envioNum).toLocaleString()}</strong></div>
                                    <div className="mc-secure"><FaLock size={11} /> Tus datos viajan protegidos</div>
                                </div>
                            </div>
                        </div>

                        {/* ══════ PANEL DERECHO – Formulario ══════ */}
                        <form onSubmit={handleSubmit}>

                            {/* ── Características ── */}
                            <SectionCard title="Características del producto" icon={<FaPalette size={13} />}>
                                <div className="mc-fgrid" style={{ gridTemplateColumns: coloresDisponibles.length > 0 && tallasDisponibles.length > 0 ? undefined : "1fr", marginBottom: 16 }}>
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
                                    <div style={{ marginBottom: 16 }}>
                                        <SelectField label="Tipo de Tela" value={telaID} required
                                            onChange={e => setTelaID(e.target.value)}>
                                            <option value="">{!colorID || !tallaID ? "Primero selecciona color y talla" : "Seleccionar..."}</option>
                                            {telasDisponibles.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre} — +${t.PrecioTela?.toLocaleString()}</option>)}
                                        </SelectField>
                                    </div>
                                )}
                                {/* Cantidad */}
                                <div className="mc-field" style={{ maxWidth: 220 }}>
                                    <label>Cantidad <i>*</i></label>
                                    <input className="mc-input" type="number" min="1" max="100" value={cantidad}
                                        onChange={e => { const v = e.target.value; if (v === '' || (parseInt(v) > 0 && parseInt(v) <= 100)) setCantidad(v); }}
                                        required />
                                    {validacionStock.stockDisponible !== undefined && (
                                        <p className="mc-hint">
                                            Stock disponible: <strong style={{ color: validacionStock.stockDisponible > 0 ? C.success : C.danger }}>{validacionStock.stockDisponible} unidades</strong>
                                        </p>
                                    )}
                                </div>
                            </SectionCard>

                            {/* ── Tipo de entrega ── */}
                            <SectionCard title="Tipo de entrega" icon={<FaTruck size={13} />}>
                                <MetodoRadio id="entrega-retiro" name="tipoEntrega" value="retiro" checked={tipoEntrega === "retiro"}
                                    onChange={e => setTipoEntrega(e.target.value)}
                                    icon={<FaStore />} label="Recoger en tienda" desc="Te avisamos cuando tu pedido esté listo" color={C.accent} />
                                <MetodoRadio id="entrega-envio" name="tipoEntrega" value="envio" checked={tipoEntrega === "envio"}
                                    onChange={e => setTipoEntrega(e.target.value)}
                                    icon={<FaTruck />} label="Envío a domicilio" desc={`Costo de envío: ${textoCostoEnvio(config?.costoEnvio)}`} color={C.success} />
                            </SectionCard>

                            {/* ── Método de pago ── */}
                            <SectionCard title="Método de pago" icon={<FaCreditCard size={13} />}>

                                <MetodoRadio id="pago-transferencia" value="transferencia" checked={metodoPago === "transferencia"}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    icon={<FaCreditCard />} label="Transferencia bancaria" desc="Paga desde tu banco y sube el comprobante" color={C.accent} />

                                {metodoPago === "transferencia" && (
                                    <div className="mc-reveal">
                                        <div className="mc-bank">
                                            <small className="mc-lbl" style={{ color: "#3b6fe0" }}>Datos bancarios</small>
                                            <div className="mc-bank-grid">
                                                {[["Banco", "Bancolombia"], ["Cuenta", "1234-5678-9012"], ["Titular", "La Empresa"]].map(([k, v]) => (
                                                    <div key={k} style={{ gridColumn: k === "Titular" ? "1/-1" : "auto" }}>
                                                        <small>{k}</small><b>{v}</b>
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" className="mc-qrbtn" onClick={() => setMostrarQR(!mostrarQR)}>
                                                {mostrarQR ? <FaEyeSlash size={12} /> : <FaQrcode size={12} />}
                                                {mostrarQR ? "Ocultar QR" : "Ver código QR"}
                                            </button>
                                            {mostrarQR && (
                                                <div style={{ marginTop: 14, textAlign: "center" }} className="mc-reveal">
                                                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALoAAAC6CAMAAAAu0KfDAAAABlBMVEX///8AAABVwtN+AAABxklEQVR4nO3QUZKDQAwD0eT+l94DgJQeCAXOtr4oGKzneb2MMebivHHSX31mbzljkC5d+hT6tj6dIcuQ+vRMDNKlS59I5zX9ZKKQ98QgXbr0X6X3f9P5NEG6dOnSSTGnk6/SpUv/PXrHEXpHHLsa6dKlT6cfq/nuMzdIly59Cv18SMGF9Wci/Y5IvyM301N9quxEshJZAy0sXbr0x9NJWRqXWH2NnnQR0qVLn0XvUL79KqVfFmmULl36FHpC9xBoByFi+ipduvQh9D4ivUllqwvwq5EuXfpEOjoK6NsJxy6iLyxduvRZ9M4lX8mSx7rieenSpQ+hry6z/TdVrl5E/1e6dOmz6H2B/kyI6TmtmhaLy0iXLv3B9FXWauXq5NSyE+nSpT+enupTyEoESto/oKVLl/54emKREemvPqf/tWCQLl36EHpfKYWc54vxLunSpU+hr2Zbn3Dkfb+yPkG6dOnPp79xTtWErmPXIV269Fn0nQ/hTHomK5FeflK6dOmz6O9N+Lgz6/XsoKVLl/6j9PS1V/LFert06dL/A31nUM13J0iXLn0inRfz9JnbM/3ipEuXPpF+DEGInN5bpEuXPpFujDEX5A/WVTvF1c+o+gAAAABJRU5ErkJggg=="
                                                        alt="QR" style={{ width: 170, height: 170, borderRadius: 16, border: "2px solid #c7d9ff", padding: 8, background: "#fff" }} />
                                                    <p className="mc-hint">Escanea para realizar el pago</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload comprobante */}
                                        <div className="mc-field" style={{ marginBottom: 16 }}>
                                            <label>Comprobante de pago <i>*</i></label>
                                            <label className={`mc-upload ${comprobanteArchivo ? "done" : ""}`} style={{ fontWeight: 400, marginBottom: 0 }}>
                                                <input type="file" accept="image/*,.pdf" onChange={e => setComprobanteArchivo(e.target.files[0])} style={{ display: "none" }} required />
                                                {comprobanteArchivo ? <FaCheckCircle /> : <FaCloudUploadAlt />}
                                                <p style={{ color: comprobanteArchivo ? C.success : undefined }}>
                                                    {comprobanteArchivo ? `✓ ${comprobanteArchivo.name}` : "Haz clic para subir el comprobante"}
                                                </p>
                                                <small>JPG, PNG o PDF · Máx. 5MB</small>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <MetodoRadio id="pago-contraentrega" value="contraentrega" checked={metodoPago === "contraentrega"}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    icon={<FaTruck />} label="Pago contraentrega" desc="Paga cuando recibas tu pedido" color={C.success} />

                                {pideDatosEntrega && (
                                    <div className="mc-deliver mc-reveal">
                                        <small className="mc-lbl" style={{ color: "#16a34a", margin: 0 }}>Datos de entrega</small>
                                        <InputField label="Nombre de quien recibe" value={nombreReceptor}
                                            onChange={e => setNombreReceptor(e.target.value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s'-]/g, ''))}
                                            placeholder="Ej: Juan Pérez" required maxLength={100} />
                                        <InputField label="Teléfono de contacto" value={telefonoEntrega}
                                            onChange={e => setTelefonoEntrega(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                                            placeholder="Ej: 3001234567" required maxLength={10} />
                                        <div className="mc-field">
                                            <label>Dirección de entrega <i>*</i></label>
                                            <textarea className="mc-input" rows={2} value={direccionEntrega} onChange={e => setDireccionEntrega(e.target.value)}
                                                placeholder="Ej: Calle 123 #45-67, Apto 301" required maxLength={250} />
                                        </div>
                                    </div>
                                )}
                            </SectionCard>

                            {/* ── Botones ── */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
                                <button type="button" className="mc-ghostbtn" onClick={() => navigate("/productosLanding")} disabled={cargando}>Cancelar</button>
                                <button type="submit" className="mc-save" disabled={cargando}>
                                    {cargando ? (<><span className="mc-spin" /> Procesando...</>) : (<><FaShoppingCart size={14} /> Confirmar pedido</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <FooterComponent />
        </>
    );
};

export default FormularioCompra;
