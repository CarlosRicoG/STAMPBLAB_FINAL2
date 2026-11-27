import API_ROOT from "../../../config/api";
import { useState, useEffect, useRef, useId } from "react";
import { FaTimes, FaMotorcycle, FaExchangeAlt, FaCheckCircle, FaCloudUploadAlt, FaFilePdf, FaCheck, FaStore, FaTruck } from "react-icons/fa";
import { C } from "../../../config/tokens";
import { textoCostoEnvio, num } from "../../../utils/clienteUtils";
import { formatDinero } from "../../../utils/formato";
import { swalTop } from "../../../utils/alertas";
import useEscape from "../../../hooks/useEscape";
import useFocoModal from "../../../hooks/useFocoModal";
import DatosDePago from "../DatosDePago";

/* ══════════════════════════════════
   MODAL PAGO
══════════════════════════════════ */
const PaymentModal = ({ open, onClose, cart, onSuccess, costoEnvio = 0, pago = null }) => {
    const [method, setMethod] = useState("");
    const [tipoEntrega, setTipoEntrega] = useState("retiro");
    const [comprobanteFile, setComprobanteFile] = useState(null);
    const [comprobantePreview, setComprobantePreview] = useState(null);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [fecha, setFecha] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const enviandoRef = useRef(false); // seguro contra doble clic
    const fileInputRef = useRef(null);
    const tituloId = useId();
    useEscape(onClose, !!open);
    const dialogoRef = useFocoModal(!!open);
    const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const esEnvio = tipoEntrega === "envio";
    const envioNum = esEnvio ? num(costoEnvio) : 0;
    const totalConEnvio = total + envioNum;
    const pideDatosEntrega = method === "contraentrega" || esEnvio;

    // ✅ Autocompletar con datos del usuario al abrir
    useEffect(() => {
        if (open) {
            setMethod("");
            setTipoEntrega("retiro");
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
        if (pideDatosEntrega) {
            if (!nombre.trim()) {
                newErrors.nombre = "El nombre es obligatorio";
            } else if (/\d/.test(nombre)) {
                newErrors.nombre = "El nombre no puede contener números";
            }
            if (!telefono.trim()) {
                newErrors.telefono = "El teléfono es obligatorio";
            } else if (!/^\d+$/.test(telefono.replace(/[\s-]/g, ""))) {
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

        if (enviandoRef.current) return;
        enviandoRef.current = true;
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
                tipoEntrega,
                ...(method === "transferencia" ? {
                    comprobanteTransferencia: comprobanteBase64 || comprobanteFile?.name,
                    fechaTransferencia: fecha || new Date().toISOString()
                } : {}),
                ...(pideDatosEntrega ? {
                    nombreReceptor: nombre,
                    telefonoEntrega: telefono,
                    direccionEntrega: direccion
                } : {}),
            };

            const res = await fetch(`${API_ROOT}/api/ventas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            let data = {};
            try { data = JSON.parse(await res.text()); } catch { /* respuesta no JSON */ }
            if (!res.ok) throw new Error(data.error || data.message || data.mensaje || "No se pudo procesar el pedido. Intenta de nuevo.");
            onSuccess(data.venta?.VentaID);
        } catch (err) {
            swalTop({ icon: "error", title: "Error al procesar", text: err.message, confirmButtonColor: C.accent });
        } finally {
            enviandoRef.current = false;
            setLoading(false);
        }
    };

    const methods = [
        { id: "transferencia", icon: <FaExchangeAlt />, label: "Transferencia bancaria", desc: "Sube foto o PDF de tu comprobante" },
        { id: "contraentrega", icon: <FaMotorcycle />, label: "Contra entrega", desc: "Paga al recibir tu pedido" },
    ];

    const ErrorMsg = ({ field }) => errors[field]
        ? <p className="cat-err">⚠ {errors[field]}</p>
        : null;

    return (
        <div className="cat-layer cat-overlay" onClick={onClose}>
            <div className="cat-modal cat-pay" onClick={e => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1} ref={dialogoRef} style={{ outline: "none" }}>

                <div className="cat-ph sx-hero-bg">
                    <span className="sx-blob b1" style={{ width: 240, height: 240 }} />
                    <span className="sx-blob b2" style={{ width: 200, height: 200 }} />
                    <button className="cat-x dark" onClick={onClose} aria-label="Cerrar"><FaTimes size={14} /></button>
                    <h3 id={tituloId}>Finalizar compra</h3>
                    <p>Total: <strong>{formatDinero(totalConEnvio)}</strong>{esEnvio && num(costoEnvio) <= 0 && costoEnvio === null ? " + envío a convenir" : ""}</p>
                </div>

                <div className="cat-pb">
                    <div className="cat-sumbox">
                        <p className="cat-lbl" style={{ margin: "0 0 8px" }}>Resumen del pedido</p>
                        {cart.map((item, i) => (
                            <div key={i} className="cat-sumrow">
                                <span>
                                    {item.nombre} × {item.cantidad}
                                    {(item.color || item.talla) && <em> ({[item.color, item.talla].filter(Boolean).join("/")})</em>}
                                </span>
                                <b>{formatDinero(item.precio * item.cantidad)}</b>
                            </div>
                        ))}
                        {esEnvio && (
                            <div className="cat-sumrow"><span>Envío a domicilio</span><b>{num(costoEnvio) > 0 ? formatDinero(costoEnvio) : textoCostoEnvio(costoEnvio)}</b></div>
                        )}
                        <div className="cat-sumtot"><span>Total</span><strong>{formatDinero(totalConEnvio)}</strong></div>
                    </div>

                    <p className="cat-lbl" style={{ margin: "0 0 10px" }}>¿Cómo recibes tu pedido?</p>
                    <div className="cat-methods" role="radiogroup" aria-label="Tipo de entrega">
                        {[
                            { id: "retiro", icon: <FaStore />, label: "Recoger en tienda", desc: "Te avisamos cuando esté listo" },
                            { id: "envio", icon: <FaTruck />, label: "Envío a domicilio", desc: `Costo de envío: ${textoCostoEnvio(costoEnvio)}` },
                        ].map(t => (
                            <div key={t.id} role="radio" aria-checked={tipoEntrega === t.id} tabIndex={0}
                                className={`cat-method ${tipoEntrega === t.id ? "on" : ""}`}
                                onClick={() => { setTipoEntrega(t.id); setErrors({}); }}
                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTipoEntrega(t.id); setErrors({}); } }}>
                                <span className="cat-m-ck"><FaCheck /></span>
                                <div className="cat-m-ico">{t.icon}</div>
                                <strong>{t.label}</strong>
                                <span className="d">{t.desc}</span>
                            </div>
                        ))}
                    </div>

                    <p className="cat-lbl" style={{ margin: "0 0 10px" }}>Método de pago</p>
                    <div className="cat-methods">
                        {methods.map(m => (
                            <div key={m.id} role="button" tabIndex={0}
                                className={`cat-method ${method === m.id ? "on" : ""}`}
                                onClick={() => { setMethod(m.id); setErrors({}); }}
                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setMethod(m.id); setErrors({}); } }}>
                                <span className="cat-m-ck"><FaCheck /></span>
                                <div className="cat-m-ico">{m.icon}</div>
                                <strong>{m.label}</strong>
                                <span className="d">{m.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── TRANSFERENCIA ── */}
                    {method === "transferencia" && (
                        <div className="cat-sec">
                            <DatosDePago pago={pago} />
                            <p className="cat-lbl" style={{ margin: "0 0 8px" }}>Comprobante de pago *</p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`cat-drop ${errors.comprobante ? "err" : comprobanteFile ? "ok" : ""}`}
                            >
                                {comprobanteFile ? (
                                    comprobantePreview === "pdf" ? (
                                        <div>
                                            <div className="cat-drop-ico" style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}><FaFilePdf /></div>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.success }}>{comprobanteFile.name}</p>
                                            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>PDF cargado · {(comprobanteFile.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <img src={comprobantePreview} alt="comprobante" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 12, objectFit: "contain", marginBottom: 8 }} />
                                            <p style={{ margin: 0, fontSize: 13, color: C.success, fontWeight: 800 }}>✓ {comprobanteFile.name}</p>
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <div className="cat-drop-ico"><FaCloudUploadAlt /></div>
                                        <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: errors.comprobante ? C.danger : "#3b6fe0" }}>Haz clic para subir</p>
                                        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Solo JPG, PNG, WEBP o PDF · Máx. 5MB</p>
                                    </div>
                                )}
                            </div>
                            <ErrorMsg field="comprobante" />

                            {comprobanteFile && (
                                <button onClick={(e) => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    style={{ background: C.dangerSoft, border: "1px solid #fecaca", color: C.danger, borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
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

                            <div className="cat-field" style={{ marginTop: 14 }}>
                                <label>Fecha de transferencia (opcional)</label>
                                <input type="date" className="cat-input" value={fecha} onChange={e => setFecha(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* ── DATOS DE ENTREGA (contra entrega o envío a domicilio) ── */}
                    {pideDatosEntrega && (
                        <div className="cat-sec">
                            <p className="cat-lbl" style={{ margin: "4px 0 10px" }}>Datos de quien recibe</p>
                            <div className="cat-field">
                                <label htmlFor="pay-nombre">Nombre del receptor *</label>
                                <input
                                    type="text"
                                    className={`cat-input ${errors.nombre ? "err" : ""}`}
                                    id="pay-nombre" placeholder="Nombre completo"
                                    value={nombre}
                                    onChange={e => {
                                        // ✅ No permite números
                                        const val = e.target.value.replace(/[0-9]/g, "");
                                        setNombre(val);
                                        if (errors.nombre) setErrors(prev => ({ ...prev, nombre: "" }));
                                    }}
                                />
                                <ErrorMsg field="nombre" />
                            </div>

                            <div className="cat-field">
                                <label htmlFor="pay-telefono">Teléfono de entrega *</label>
                                <input
                                    type="tel"
                                    className={`cat-input ${errors.telefono ? "err" : ""}`}
                                    id="pay-telefono" placeholder="Ej: 300 123 4567"
                                    value={telefono}
                                    onChange={e => {
                                        // ✅ Solo números, espacios y guiones
                                        const val = e.target.value.replace(/[^0-9\s-]/g, "");
                                        setTelefono(val);
                                        if (errors.telefono) setErrors(prev => ({ ...prev, telefono: "" }));
                                    }}
                                />
                                <ErrorMsg field="telefono" />
                            </div>

                            <div className="cat-field">
                                <label htmlFor="pay-direccion">Dirección de entrega *</label>
                                <input
                                    type="text"
                                    className={`cat-input ${errors.direccion ? "err" : ""}`}
                                    id="pay-direccion" placeholder="Calle, barrio, ciudad..."
                                    value={direccion}
                                    onChange={e => {
                                        setDireccion(e.target.value);
                                        if (errors.direccion) setErrors(prev => ({ ...prev, direccion: "" }));
                                    }}
                                />
                                <ErrorMsg field="direccion" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="cat-pf">
                    <button className="sx-btn sx-btn-dark" onClick={handleSubmit} disabled={loading || !method}>
                        {loading
                            ? <><span className="cat-spin" /> Procesando...</>
                            : <><FaCheckCircle size={16} /> Confirmar pedido</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
