import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaBoxOpen, FaTshirt, FaEye, FaArrowLeft, FaCheck, FaReceipt, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { getProveedores, getVariantesByProductoEnCompra } from "../../Services/api-compras/compras";
import { getInsumos } from "../../Services/api-insumos/insumos";
import { getProductos } from "../../Services/api-productos/productos";
import { getColores, getTallas, getTelas } from "../../Services/api-productos/atributos";
import { createVariante } from "../../Services/api-productos/variantes";
import { C } from "../../config/tokens";
import { STOCK_BAJO, money, esActivo, getFechaHoyLocal, fechaLocalDe, CSS, subtotalDetalle, erroresInsumo, erroresProducto } from "./compra/compraUtils";
import { Label, Input, Select, FieldError, Badge, SectionTitle, Card, Btn, StockBadge, SearchModal, TR, TD } from "./compra/ui";
import DetalleCompraTabla from "./compra/DetalleCompraTabla";
import ModalVariantes from "./compra/ModalVariantes";
import useCompraForm from "./compra/useCompraForm";

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
const NuevaCompra = ({ onClose, onSave, compra = null }) => {

    const [formData, setFormData] = useState({ proveedorRefId: "", fechaCompra: getFechaHoyLocal() });
    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [telas, setTelas] = useState([]);
    const [detalles, setDetalles] = useState([]);
    const [tipoSeleccion, setTipo] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Insumo temp
    const [insumoSel, setInsumoSel] = useState(null);
    const [cantInsumo, setCantInsumo] = useState(1);
    const [precioInsumo, setPrecioIns] = useState("");
    const [intentoInsumo, setIntentoInsumo] = useState(false);

    // Producto temp
    const [prodSel, setProdSel] = useState(null);
    const [varConfig, setVarConfig] = useState({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
    const [variantesProd, setVariantesProd] = useState([]);
    const [intentoProd, setIntentoProd] = useState(false);

    // Modales
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalProducto, setModalProducto] = useState(false);
    const [modalVerVar, setModalVerVar] = useState(false);
    const [modalNuevaVar, setModalNuevaVar] = useState(false);

    const [busqInsumo, setBusqInsumo] = useState("");
    const [busqProd, setBusqProd] = useState("");
    const [variantesModal, setVarModal] = useState([]);
    const [loadingVar, setLoadingVar] = useState(false);
    const [nuevaVarForm, setNuevaVarF] = useState({ ColorID: "", TallaID: "", TelaID: "", Stock: 0 });
    const [creandoVar, setCreandoVar] = useState(false);
    const { intentoEnvio, submitting, fechaFutura, checks, puedeGuardar, handleSubmit } = useCompraForm({ formData, detalles, onSave });

    /* ── Cargar datos ── */
    useEffect(() => {
        cargarDatos();
        if (compra) cargarCompraExistente(compra);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se ejecuta solo cuando cambia esta dependencia; usa la versión actual de las funciones
    }, [compra]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [pR, iR, prR, cR, tR, teR] = await Promise.all([
                getProveedores(), getInsumos(), getProductos(), getColores(), getTallas(), getTelas()
            ]);
            // Activos + el proveedor actual de la compra (aunque esté inactivo) para poder editarla
            setProveedores((pR || []).filter(p => esActivo(p.Estado) || (compra && p.id === compra.ProveedorRefId)));
            // Todos los insumos activos (incluidas las telas, que también se compran por stock)
            setInsumos((iR || []).filter(i => esActivo(i.Estado)));
            setProductos(prR?.datos || prR || []);
            setColores(cR?.datos || cR || []);
            setTallas(tR?.datos || tR || []);
            setTelas(teR || []);
        } catch { Swal.fire("Error", "No se pudieron cargar los datos", "error"); }
        finally { setCargando(false); }
    };

    const cargarCompraExistente = (c) => {
        setFormData({ proveedorRefId: c.ProveedorRefId?.toString() || "", fechaCompra: fechaLocalDe(c.FechaCompra) });
        if (c.detalles?.length > 0) {
            setDetalles(c.detalles.map(d => {
                if (d.TipoSeleccion === "producto" || d.ProductoID) {
                    const v = d.variante;
                    return {
                        TipoSeleccion: "producto",
                        ProductoID: d.ProductoID,
                        NombreProducto: d.producto?.Nombre || "N/A",
                        ColorID: v?.ColorID, TallaID: v?.TallaID, TelaID: v?.TelaID || null,
                        InventarioID: d.InventarioID,
                        NombreColor: v?.color?.Nombre || "N/A",
                        NombreTalla: v?.talla?.Nombre || "N/A",
                        NombreTela: v?.tela?.Nombre || "Sin tela",
                        PrecioBase: d.producto?.PrecioBase || 0,
                        PrecioTalla: v?.talla?.Precio || 0,
                        PrecioTela: v?.tela?.PrecioTela || 0,
                        PrecioVenta: parseFloat(d.PrecioVenta) || 0,
                        PrecioUnitario: parseFloat(d.PrecioUnitario) || 0,
                        Cantidad: d.Cantidad
                    };
                } else {
                    return {
                        TipoSeleccion: "insumo",
                        InsumoID: d.InsumoID,
                        NombreInsumo: d.insumo?.Nombre || "N/A",
                        TipoInsumo: d.insumo?.Tipo || "N/A",
                        StockActual: d.insumo?.Stock || 0,
                        PrecioUnitario: parseFloat(d.PrecioUnitario) || 0,
                        PrecioVenta: parseFloat(d.PrecioVenta) || 0,
                        Cantidad: d.Cantidad
                    };
                }
            }));
        }
    };

    /* ── Insumo ── */
    const handleSelInsumo = (ins) => { setInsumoSel(ins); setCantInsumo(1); setPrecioIns(""); setIntentoInsumo(false); setModalInsumo(false); setProdSel(null); setTipo("insumo"); };

    const { precio: errPrecioIns, cantidad: errCantIns } = erroresInsumo(precioInsumo, cantInsumo);

    const handleAgregarInsumo = () => {
        setIntentoInsumo(true);
        if (!insumoSel) return Swal.fire("Atención", "Seleccione un insumo", "warning");
        if (errPrecioIns || errCantIns) return Swal.fire("Datos inválidos", [errPrecioIns, errCantIns].filter(Boolean).join(". "), "warning");
        if (detalles.find(d => d.TipoSeleccion === "insumo" && d.InsumoID === insumoSel.InsumoID)) return Swal.fire("Atención", "Este insumo ya fue agregado. Puede editar su cantidad en el detalle.", "warning");
        setDetalles(p => [...p, {
            TipoSeleccion: "insumo",
            InsumoID: insumoSel.InsumoID,
            NombreInsumo: insumoSel.Nombre,
            TipoInsumo: insumoSel.Tipo,
            StockActual: insumoSel.Stock,
            PrecioUnitario: parseFloat(precioInsumo) || 0,
            PrecioVenta: 0,
            Cantidad: cantInsumo
        }]);
        setInsumoSel(null); setCantInsumo(1); setPrecioIns(""); setTipo(null); setIntentoInsumo(false);
    };

    /* ── Producto ── */
    const calcPrecioVenta = (prod, tallaId, telaId) => {
        const base = parseFloat(prod?.PrecioBase || prodSel?.PrecioBase || 0);
        const pT = parseFloat(tallas.find(t => t.TallaID === parseInt(tallaId))?.Precio || 0);
        const pTe = parseFloat(telas.find(t => t.InsumoID === parseInt(telaId))?.PrecioTela || 0);
        return base + pT + pTe;
    };

    const cargarVariantesProd = async (prod) => {
        setVariantesProd([]);
        try { const r = await getVariantesByProductoEnCompra(prod.ProductoID); setVariantesProd(r.variantes || []); }
        catch { setVariantesProd([]); }
    };

    const handleSelProducto = (prod) => {
        setProdSel(prod);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setIntentoProd(false);
        setModalProducto(false);
        setInsumoSel(null);
        setTipo("producto");
        cargarVariantesProd(prod);
    };

    const cantProd = Number(varConfig.Cantidad);
    const errProd = erroresProducto(varConfig);
    const varianteExistente = prodSel && varConfig.ColorID && varConfig.TallaID
        ? variantesProd.find(v => v.ColorID === parseInt(varConfig.ColorID) && v.TallaID === parseInt(varConfig.TallaID) && (v.TelaID || null) === (varConfig.TelaID ? parseInt(varConfig.TelaID) : null))
        : null;

    const handleAgregarProducto = () => {
        const { ColorID, TallaID, TelaID, PrecioUnitario } = varConfig;
        setIntentoProd(true);
        if (!prodSel) return Swal.fire("Atención", "Seleccione un producto", "warning");
        if (Object.values(errProd).some(Boolean)) return Swal.fire("Datos inválidos", Object.entries(errProd).filter(([, m]) => m).map(([k, m]) => `${{ ColorID: "Color", TallaID: "Talla", PrecioUnitario: "Precio", Cantidad: "Cantidad" }[k]}: ${m}`).join(". "), "warning");
        if (detalles.find(d => d.TipoSeleccion === "producto" && d.ProductoID === prodSel.ProductoID && d.ColorID === parseInt(ColorID) && d.TallaID === parseInt(TallaID) && (d.TelaID || null) === (TelaID ? parseInt(TelaID) : null)))
            return Swal.fire("Atención", "Ya existe este producto con esa variante. Puede editar su cantidad en el detalle.", "warning");

        const color = colores.find(c => c.ColorID === parseInt(ColorID));
        const talla = tallas.find(t => t.TallaID === parseInt(TallaID));
        const tela = telas.find(t => t.InsumoID === parseInt(TelaID));
        const precioVenta = calcPrecioVenta(prodSel, TallaID, TelaID);

        setDetalles(p => [...p, {
            TipoSeleccion: "producto",
            ProductoID: prodSel.ProductoID,
            NombreProducto: prodSel.Nombre,
            ColorID: parseInt(ColorID),
            TallaID: parseInt(TallaID),
            TelaID: TelaID ? parseInt(TelaID) : null,
            NombreColor: color?.Nombre || "",
            NombreTalla: talla?.Nombre || "",
            NombreTela: tela?.Nombre || "Sin tela",
            PrecioBase: parseFloat(prodSel.PrecioBase || 0),
            PrecioTalla: parseFloat(talla?.Precio || 0),
            PrecioTela: parseFloat(tela?.PrecioTela || 0),
            PrecioVenta: precioVenta,
            PrecioUnitario: parseFloat(PrecioUnitario) || 0,
            Cantidad: cantProd
        }]);
        setProdSel(null);
        setVarConfig({ ColorID: "", TallaID: "", TelaID: "", Cantidad: 1, PrecioUnitario: "" });
        setTipo(null); setIntentoProd(false);
    };

    /* ── Ver variantes ── */
    const handleVerVariantes = async (prod) => {
        setProdSel(prod); setLoadingVar(true); setModalVerVar(true);
        try { const r = await getVariantesByProductoEnCompra(prod.ProductoID); setVarModal(r.variantes || []); }
        catch { Swal.fire("Error", "No se pudieron cargar las variantes", "error"); }
        finally { setLoadingVar(false); }
    };

    /* ── Crear variante ── */
    const handleAbrirNuevaVar = (prod) => { setProdSel(prod); setNuevaVarF({ ColorID: "", TallaID: "", TelaID: "", Stock: 0 }); setModalNuevaVar(true); };

    const handleGuardarNuevaVar = async () => {
        const { ColorID, TallaID, TelaID, Stock } = nuevaVarForm;
        if (!ColorID || !TallaID) return Swal.fire("Atención", "Color y talla son obligatorios", "warning");
        setCreandoVar(true);
        try {
            await createVariante({ ProductoID: prodSel.ProductoID, ColorID, TallaID, TelaID: TelaID || null, Stock: parseInt(Stock) || 0, Estado: 1 });
            Swal.fire({ icon: "success", title: "Variante creada", timer: 1500, showConfirmButton: false });
            setModalNuevaVar(false);
            if (modalVerVar) { const r = await getVariantesByProductoEnCompra(prodSel.ProductoID); setVarModal(r.variantes || []); }
        } catch (e) { Swal.fire("Error", e.response?.data?.mensaje || e.response?.data?.message || e.message || "No se pudo crear la variante", "error"); }
        finally { setCreandoVar(false); }
    };

    /* ── Detalle edits ── */
    const handleEliminarDetalle = (i) => setDetalles(p => p.filter((_, idx) => idx !== i));
    const handleCambiarCantidad = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, Cantidad: v } : d));
    // Se guarda el texto tal cual para permitir escribir decimales/borrar; se convierte al enviar
    const handleCambiarPrecio = (i, v) => setDetalles(p => p.map((d, idx) => idx === i ? { ...d, PrecioUnitario: v } : d));

    /* ── Filtros ── */
    const norm = s => (s || "").toString().toLowerCase();
    const insumosFiltrados = insumos.filter(i => norm(i.Nombre).includes(norm(busqInsumo)) || norm(i.Tipo).includes(norm(busqInsumo)));
    const prodsFiltrados = productos.filter(p => norm(p.Nombre).includes(norm(busqProd)));
    const subtotal = subtotalDetalle;
    const totalCompra = detalles.reduce((s, d) => s + subtotal(d), 0);
    const totalUnidades = detalles.reduce((s, d) => s + (Number(d.Cantidad) || 0), 0);
    const proveedorActual = proveedores.find(p => String(p.id) === String(formData.proveedorRefId));

    /* ═══════════════════════════════════════
       RENDER
    ═══════════════════════════════════════ */
    return (
        <>
            <style>{CSS}</style>

            <div className="cp-form" style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div className="cp-form-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button type="button" onClick={onClose} aria-label="Volver" style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}>
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                                {compra ? "Editar Compra" : "Nueva Compra a Proveedor"}
                            </h4>
                            <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 13 }}>
                                {detalles.length} ítem{detalles.length !== 1 ? "s" : ""} · Total: <strong style={{ color: C.navy }}>{money(totalCompra)}</strong>
                            </p>
                        </div>
                    </div>
                    <Btn variant="outline-danger" onClick={onClose}><FaTimes size={13} /> Cerrar</Btn>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="cp-layout">
                    <div style={{ minWidth: 0 }}>

                    {/* ── 1. PROVEEDOR Y FECHA ── */}
                    <Card>
                        <SectionTitle sub="Información general de la compra">Datos de la Compra</SectionTitle>
                        <div className="cp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
                            <div>
                                <Label required>Proveedor</Label>
                                <Select name="proveedorRefId" value={formData.proveedorRefId} invalid={intentoEnvio && !formData.proveedorRefId}
                                    onChange={e => setFormData(p => ({ ...p, proveedorRefId: e.target.value }))} required>
                                    <option value="">{cargando ? "Cargando proveedores..." : "Seleccione un proveedor..."}</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.Nombre} — {p.Nit}{!esActivo(p.Estado) ? " (inactivo)" : ""}</option>)}
                                </Select>
                                <FieldError msg={intentoEnvio && !formData.proveedorRefId ? "Seleccione el proveedor de la compra" : ""} />
                                {!cargando && proveedores.length === 0 && <p className="cp-err">No hay proveedores activos. Cree o active uno en el módulo de Proveedores.</p>}
                            </div>
                            <div>
                                <Label required>Fecha</Label>
                                <Input type="date" value={formData.fechaCompra} max={getFechaHoyLocal()} invalid={(intentoEnvio && !formData.fechaCompra) || fechaFutura}
                                    onChange={e => setFormData(p => ({ ...p, fechaCompra: e.target.value }))} required />
                                <FieldError msg={fechaFutura ? "No puede ser posterior a hoy" : intentoEnvio && !formData.fechaCompra ? "Seleccione una fecha" : ""} />
                            </div>
                        </div>
                    </Card>

                    {/* ── 2. SELECTOR DE TIPO ── */}
                    <Card>
                        <SectionTitle sub="Elige qué deseas agregar al detalle de esta compra">Agregar al Detalle</SectionTitle>

                        <div className="cp-picks" style={{ display: "flex", gap: 12, marginBottom: (insumoSel || prodSel) ? 22 : 0 }}>
                            <button type="button" className="cp-pick" onClick={() => { setBusqInsumo(""); setModalInsumo(true); }}
                                style={{
                                    border: `2px solid ${tipoSeleccion === "insumo" ? C.accent : C.border}`,
                                    background: tipoSeleccion === "insumo" ? C.accentSoft : C.white,
                                    color: tipoSeleccion === "insumo" ? C.accent : C.muted,
                                }}>
                                <FaBoxOpen size={18} /> Elegir Insumo
                            </button>
                            <button type="button" className="cp-pick" onClick={() => { setBusqProd(""); setModalProducto(true); }}
                                style={{
                                    border: `2px solid ${tipoSeleccion === "producto" ? C.success : C.border}`,
                                    background: tipoSeleccion === "producto" ? C.successSoft : C.white,
                                    color: tipoSeleccion === "producto" ? C.success : C.muted,
                                }}>
                                <FaTshirt size={18} /> Elegir Producto
                            </button>
                        </div>

                        {/* ── Panel Insumo seleccionado ── */}
                        {tipoSeleccion === "insumo" && insumoSel && (
                            <div style={{ background: C.accentSoft, borderRadius: 14, border: `1.5px solid ${C.accentBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <Badge type="accent"><FaBoxOpen size={10} /> Insumo</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{insumoSel.Nombre}</span>
                                        <Badge type={String(insumoSel.Tipo).toLowerCase() === "tela" ? "violet" : "muted"}>{insumoSel.Tipo}</Badge>
                                    </div>
                                    <button type="button" aria-label="Quitar selección" onClick={() => { setInsumoSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>
                                <div className="cp-grid-resp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "start" }}>
                                    <div>
                                        <Label>Nombre</Label>
                                        <Input value={insumoSel.Nombre} readOnly />
                                    </div>
                                    <div>
                                        <Label required>Precio de Compra</Label>
                                        <Input type="number" placeholder="$ 0" min="1" value={precioInsumo} invalid={intentoInsumo && !!errPrecioIns} onChange={e => setPrecioIns(e.target.value)} />
                                        <FieldError msg={intentoInsumo && errPrecioIns} />
                                    </div>
                                    <div>
                                        <Label required>Cantidad</Label>
                                        <Input type="number" min="1" step="1" value={cantInsumo || ""} invalid={intentoInsumo && !!errCantIns} onChange={e => setCantInsumo(Number(e.target.value))} />
                                        <FieldError msg={intentoInsumo && errCantIns} />
                                        <p style={{ margin: "5px 0 0", fontSize: 11, color: C.muted }}>
                                            Stock actual: <strong style={{ color: Number(insumoSel.Stock) <= STOCK_BAJO ? C.warning : C.navy }}>{insumoSel.Stock}</strong>
                                            {cantInsumo > 0 && <> → <strong style={{ color: C.success }}>{(Number(insumoSel.Stock) || 0) + cantInsumo}</strong></>}
                                        </p>
                                    </div>
                                    <Btn variant="success" onClick={handleAgregarInsumo} style={{ height: 38, marginTop: 22 }}>
                                        <FaPlus size={13} /> Agregar
                                    </Btn>
                                </div>
                            </div>
                        )}

                        {/* ── Panel Producto seleccionado ── */}
                        {tipoSeleccion === "producto" && prodSel && (
                            <div style={{ background: C.successSoft, borderRadius: 14, border: `1.5px solid ${C.successBorder}`, padding: "20px 22px", animation: "fadeIn 0.2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <Badge type="success"><FaTshirt size={10} /> Producto</Badge>
                                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{prodSel.Nombre}</span>
                                        <Badge type="navy">{money(prodSel.PrecioBase)} base</Badge>
                                    </div>
                                    <button type="button" aria-label="Quitar selección" onClick={() => { setProdSel(null); setTipo(null); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
                                </div>

                                <div className="cp-grid-resp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1fr 0.8fr 1fr auto", gap: 12, alignItems: "start" }}>
                                    <div>
                                        <Label required>Color</Label>
                                        <Select value={varConfig.ColorID} invalid={intentoProd && !!errProd.ColorID} onChange={e => setVarConfig(p => ({ ...p, ColorID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {colores.map(c => <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>)}
                                        </Select>
                                        <FieldError msg={intentoProd && errProd.ColorID} />
                                    </div>
                                    <div>
                                        <Label required>Talla</Label>
                                        <Select value={varConfig.TallaID} invalid={intentoProd && !!errProd.TallaID} onChange={e => setVarConfig(p => ({ ...p, TallaID: e.target.value }))}>
                                            <option value="">Seleccionar...</option>
                                            {tallas.map(t => <option key={t.TallaID} value={t.TallaID}>{t.Nombre}</option>)}
                                        </Select>
                                        <FieldError msg={intentoProd && errProd.TallaID} />
                                    </div>
                                    <div>
                                        <Label>Tela</Label>
                                        <Select value={varConfig.TelaID} onChange={e => setVarConfig(p => ({ ...p, TelaID: e.target.value }))}>
                                            <option value="">Sin tela</option>
                                            {telas.map(t => <option key={t.InsumoID} value={t.InsumoID}>{t.Nombre}</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label required>Precio Compra</Label>
                                        <Input type="number" placeholder="$ 0" min="0" value={varConfig.PrecioUnitario} invalid={intentoProd && !!errProd.PrecioUnitario} onChange={e => setVarConfig(p => ({ ...p, PrecioUnitario: e.target.value }))} />
                                        <FieldError msg={intentoProd && errProd.PrecioUnitario} />
                                    </div>
                                    <div>
                                        <Label required>Cant.</Label>
                                        <Input type="number" min="1" step="1" value={varConfig.Cantidad} invalid={intentoProd && !!errProd.Cantidad} onChange={e => setVarConfig(p => ({ ...p, Cantidad: e.target.value }))} />
                                        <FieldError msg={intentoProd && errProd.Cantidad} />
                                    </div>
                                    <div>
                                        <Label>Precio Venta</Label>
                                        <Input readOnly value={money(calcPrecioVenta(prodSel, varConfig.TallaID, varConfig.TelaID))}
                                            style={{ fontWeight: 700, color: C.success, background: C.white }} />
                                    </div>
                                    <Btn variant="success" onClick={handleAgregarProducto} title="Agregar al detalle" style={{ height: 38, marginTop: 22, flexShrink: 0 }}>
                                        <FaPlus size={13} />
                                    </Btn>
                                </div>
                                {varConfig.ColorID && varConfig.TallaID && (
                                    <p style={{ margin: "12px 0 0", fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        {varianteExistente
                                            ? <>Variante existente · stock actual <StockBadge stock={varianteExistente.Stock} />{cantProd > 0 && <>→ quedará en <strong style={{ color: C.success }}>{(Number(varianteExistente.Stock) || 0) + cantProd}</strong></>}</>
                                            : <><Badge type="violet">Variante nueva</Badge> se creará automáticamente al registrar la compra.</>}
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* ── 3. TABLA DE DETALLES ── */}
                    <Card>
                        <SectionTitle sub={`${detalles.length} ítem${detalles.length !== 1 ? "s" : ""} en el detalle`}>Detalle de la Compra</SectionTitle>

                        <DetalleCompraTabla detalles={detalles} intentoEnvio={intentoEnvio} totalCompra={totalCompra}
                            handleCambiarPrecio={handleCambiarPrecio} handleCambiarCantidad={handleCambiarCantidad} handleEliminarDetalle={handleEliminarDetalle} />
                    </Card>
                    </div>

                    {/* ── 4. RESUMEN TIPO TICKET ── */}
                    <aside className="cp-sticky">
                        <div className="cp-ticket">
                            <div className="cp-ticket-head">
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <FaReceipt size={18} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: .7, fontWeight: 700 }}>Resumen</p>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{compra ? `Compra #${compra.CompraID}` : "Nueva compra"}</p>
                                    </div>
                                </div>
                                <p style={{ margin: "10px 0 0", fontSize: 12.5, opacity: .85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {proveedorActual ? proveedorActual.Nombre : "Sin proveedor"} · {formData.fechaCompra || "Sin fecha"}
                                </p>
                            </div>
                            <div className="cp-perf" />
                            <div style={{ padding: "6px 20px 0" }}>
                                {detalles.length === 0 ? (
                                    <p style={{ fontSize: 12.5, color: C.muted, textAlign: "center", margin: "10px 0 14px" }}>Aún no hay ítems</p>
                                ) : (
                                    <div style={{ maxHeight: 220, overflowY: "auto", borderBottom: `1.5px dashed ${C.border}`, paddingBottom: 8 }}>
                                        {detalles.map((d, i) => (
                                            <div key={i} className="cp-tline">
                                                <span title={d.NombreInsumo || d.NombreProducto}>
                                                    <strong style={{ color: C.navy }}>{d.Cantidad || 0}×</strong> {d.NombreInsumo || d.NombreProducto}
                                                    {d.TipoSeleccion === "producto" && <span style={{ color: C.muted }}> · {d.NombreTalla}</span>}
                                                </span>
                                                <span style={{ fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>{money(subtotal(d))}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="cp-tline" style={{ marginTop: 6 }}><span>Ítems</span><strong style={{ color: C.navy }}>{detalles.length}</strong></div>
                                <div className="cp-tline"><span>Unidades</span><strong style={{ color: C.navy }}>{totalUnidades}</strong></div>
                            </div>
                            <div style={{ margin: "8px 16px 0", background: C.navyGrad, borderRadius: 14, padding: "14px 16px", color: C.white, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", opacity: .8, fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" }}>{money(totalCompra)}</span>
                            </div>
                            <div style={{ padding: "14px 20px 4px" }}>
                                {checks.map(c => (
                                    <div key={c.label} className="cp-check" style={{ color: c.ok ? C.success : (intentoEnvio ? C.danger : C.muted) }}>
                                        {c.ok ? <FaCheckCircle size={13} /> : <FaRegCircle size={13} />} {c.label}
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: "12px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <Btn variant="primary" type="submit" disabled={!puedeGuardar || submitting} style={{ padding: "12px 20px", width: "100%", boxShadow: puedeGuardar ? `0 8px 18px ${C.navy}40` : "none" }}>
                                    {submitting
                                        ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Guardando...</>
                                        : <><FaCheck size={13} /> {compra ? "Guardar Cambios" : "Registrar Compra"}</>}
                                </Btn>
                                <Btn variant="secondary" onClick={onClose} style={{ padding: "10px 20px", width: "100%" }}>
                                    Cancelar
                                </Btn>
                            </div>
                        </div>
                    </aside>
                  </div>
                </form>
            </div>

            {/* ════════════════════════════════════════
          MODAL: Seleccionar Insumo
      ════════════════════════════════════════ */}
            <SearchModal
                show={modalInsumo} onHide={() => setModalInsumo(false)}
                title="Seleccionar Insumo" icon={<FaBoxOpen style={{ marginRight: 8 }} />}
                searchValue={busqInsumo} onSearch={setBusqInsumo} placeholder="Buscar insumo por nombre o tipo..."
                columns={["Nombre", "Tipo", "Stock", "Precio Tela", ""]}
                emptyMsg={insumos.length === 0 ? "No hay insumos activos" : "No se encontraron insumos"}
                rows={insumosFiltrados.map((ins, i) => (
                    <TR key={ins.InsumoID} idx={i}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{ins.Nombre}</td>
                        <TD><Badge type={String(ins.Tipo).toLowerCase() === "tela" ? "violet" : "muted"}>{ins.Tipo}</Badge></TD>
                        <TD center><StockBadge stock={ins.Stock} /></TD>
                        <TD>{String(ins.Tipo).toLowerCase() === "tela" && ins.PrecioTela ? money(ins.PrecioTela) : "—"}</TD>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                            <Btn variant="primary" onClick={() => handleSelInsumo(ins)} style={{ padding: "6px 14px", fontSize: 12 }}>
                                Seleccionar
                            </Btn>
                        </td>
                    </TR>
                ))}
            />

            {/* ════════════════════════════════════════
          MODAL: Seleccionar Producto
      ════════════════════════════════════════ */}
            <SearchModal
                show={modalProducto} onHide={() => setModalProducto(false)}
                title="Seleccionar Producto" icon={<FaTshirt style={{ marginRight: 8 }} />}
                searchValue={busqProd} onSearch={setBusqProd} placeholder="Buscar producto..."
                columns={["Nombre", "Descripción", "Precio Base", "Acciones"]}
                emptyMsg="No se encontraron productos"
                rows={prodsFiltrados.map((prod, i) => (
                    <TR key={prod.ProductoID} idx={i}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: C.navy }}>{prod.Nombre}</td>
                        <TD muted>{prod.Descripcion || "—"}</TD>
                        <TD><Badge type="navy">{money(prod.PrecioBase)}</Badge></TD>
                        <td style={{ padding: "8px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                                <Btn variant="success" onClick={() => handleSelProducto(prod)} style={{ padding: "6px 14px", fontSize: 12 }}>
                                    Seleccionar
                                </Btn>
                                <button type="button" title="Ver variantes" aria-label="Ver variantes"
                                    onClick={() => { setModalProducto(false); handleVerVariantes(prod); }}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.accent}30`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    onMouseEnter={e => e.currentTarget.style.background = `${C.accent}22`}
                                    onMouseLeave={e => e.currentTarget.style.background = `${C.accent}0d`}>
                                    <FaEye size={13} />
                                </button>
                            </div>
                        </td>
                    </TR>
                ))}
            />

            {/* ════════════════════════════════════════
          MODALES: Ver variantes / Crear nueva variante
      ════════════════════════════════════════ */}
            <ModalVariantes prodSel={prodSel} modalVerVar={modalVerVar} setModalVerVar={setModalVerVar} loadingVar={loadingVar}
                variantesModal={variantesModal} handleAbrirNuevaVar={handleAbrirNuevaVar}
                modalNuevaVar={modalNuevaVar} setModalNuevaVar={setModalNuevaVar} handleGuardarNuevaVar={handleGuardarNuevaVar}
                creandoVar={creandoVar} nuevaVarForm={nuevaVarForm} setNuevaVarF={setNuevaVarF} colores={colores} tallas={tallas} telas={telas} />
        </>
    );
};

export default NuevaCompra;
