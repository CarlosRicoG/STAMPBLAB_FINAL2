import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import axios from "axios";
import { crearVenta, updateVenta, getVentaById } from "../../Services/api-ventas/ventas";
import Swal from "sweetalert2";

/* ── Tokens de color (mismos que AgregarProducto) ── */
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
    danger: "#dc2626",
    muted: "#64748b",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const TH = {
    background: C.navyGrad,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "11px 14px",
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
    textAlign: "left",
};

/* ── Pequeño badge ── */
const Badge = ({ type, children }) => {
    const map = {
        success: { bg: C.successSoft, color: C.success, border: C.successBorder },
        accent:  { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
        muted:   { bg: "#f1f5f9", color: C.muted, border: C.border },
        navy:    { bg: C.navy, color: "#fff", border: C.navy },
    };
    const s = map[type] || map.muted;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
        }}>
            {children}
        </span>
    );
};

/* ── Modal de selección de producto (custom, sin Bootstrap Modal) ── */
const ProductoModal = ({ show, onClose, children }) => {
    if (!show) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
            <div style={{
                background: "#fff", borderRadius: 18, width: "100%", maxWidth: 860,
                maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)", fontFamily: "'Outfit',sans-serif",
            }}>
                {children}
            </div>
        </div>
    );
};

export default function NuevaVenta({ onClose, ventaEdit }) {
    const navigate = useNavigate();
    const modoEdicion = !!ventaEdit;

    // UI states
    const [showModalProducto, setShowModalProducto] = useState(false);
    const [busquedaProducto, setBusquedaProducto] = useState("");

    // Datos maestros
    const [usuarios, setUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);

    // Producto seleccionado y sus variantes
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [variantes, setVariantes] = useState([]);

    // Selects dependientes
    const [colorSeleccionado, setColorSeleccionado] = useState("");
    const [tallaSeleccionada, setTallaSeleccionada] = useState("");
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

    // Carrito / venta
    const [productosAgregados, setProductosAgregados] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [clienteSeleccionado, setClienteSeleccionado] = useState("");

    // Carga inicial
    useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchUsuarios = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsuarios(res.data);
            } catch (err) { console.error(err); }
        };

        const fetchProductos = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProductos(res.data.datos || []);
            } catch (err) { console.error(err); }
        };

        fetchUsuarios();
        fetchProductos();

        if (ventaEdit) cargarDatosVenta();
    }, [ventaEdit]);

    const cargarDatosVenta = async () => {
        try {
            const ventaData = await getVentaById(ventaEdit.VentaID);
            setClienteSeleccionado(ventaData.DocumentoID);
            setSubtotal(parseFloat(ventaData.Subtotal));
            setTotal(parseFloat(ventaData.Total));

            if (ventaData.detalles?.length > 0) {
                const productosEditados = ventaData.detalles.map(det => ({
                    ProductoID: det.ProductoID,
                    Nombre: det.producto?.Nombre || "Producto",
                    Cantidad: det.Cantidad,
                    PrecioUnitario: parseFloat(det.PrecioUnitario),
                    ColorID: det.ColorID,
                    ColorNombre: det.color?.Nombre || "-",
                    TallaID: det.TallaID,
                    TallaNombre: det.talla?.Nombre || "-",
                    TelaID: det.TelaID || null,
                    TelaNombre: det.tela?.Nombre || "Sin tela",
                    InventarioID: det.InventarioID || null,
                    StockDisponible: 999,
                }));
                setProductosAgregados(productosEditados);
            }
        } catch (error) {
            console.error("Error al cargar venta:", error);
            Swal.fire({ icon: "error", title: "Error", text: "Error al cargar datos de la venta", confirmButtonColor: C.danger });
        }
    };

    // Filtro productos modal
    const productosFiltrados = productos.filter(p =>
        p.Nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
    );

    // Recalcula totales
    useEffect(() => {
        const sub = productosAgregados.reduce(
            (acc, item) => acc + item.Cantidad * item.PrecioUnitario, 0
        );
        setSubtotal(sub);
        setTotal(sub);
    }, [productosAgregados]);

    // Cargar variantes al seleccionar producto
    const onSeleccionarProductoModal = async (producto) => {
        setProductoSeleccionado(producto);
        setColorSeleccionado("");
        setTallaSeleccionada("");
        setCantidadSeleccionada(1);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/inventarioproducto/producto/${producto.ProductoID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const variantesResp = res.data.datos || res.data || [];
            setVariantes(Array.isArray(variantesResp) ? variantesResp : []);
        } catch (error) {
            console.error("Error cargando variantes:", error);
            Swal.fire({ icon: "error", title: "Error", text: "Error al cargar variantes del producto", confirmButtonColor: C.danger });
            setVariantes([]);
        }
    };

    // Colores únicos disponibles
    const coloresDisponibles = variantes
        .map(v => v.color)
        .filter((c, i, self) => c && i === self.findIndex(x => x?.ColorID === c.ColorID));

    // Tallas disponibles según color seleccionado
    const tallasDisponibles = variantes
        .filter(v => v.ColorID === parseInt(colorSeleccionado))
        .map(v => v.talla)
        .filter((t, i, self) => t && i === self.findIndex(x => x?.TallaID === t.TallaID));

    const obtenerVarianteActual = () =>
        variantes.find(
            v => v.ColorID === parseInt(colorSeleccionado) && v.TallaID === parseInt(tallaSeleccionada)
        );

    /* ── TELA: obtener la tela de la variante actual ── */
    const telaVarianteActual = obtenerVarianteActual()?.tela || null;

    const calcularStockDisponible = (variante, excludeIndex = null) => {
        if (!variante) return 0;
        const usadoEnCarrito = productosAgregados
            .map((p, idx) => ({ ...p, idx }))
            .filter(p =>
                p.ProductoID === productoSeleccionado?.ProductoID &&
                p.ColorID === variante.ColorID &&
                p.TallaID === variante.TallaID &&
                (excludeIndex === null || p.idx !== excludeIndex)
            )
            .reduce((acc, p) => acc + (p.Cantidad || 0), 0);
        return Math.max(0, (variante.Stock || 0) - usadoEnCarrito);
    };

    const agregarProducto = () => {
        if (!productoSeleccionado) return Swal.fire({ icon: "warning", title: "Seleccione un producto", confirmButtonColor: C.navy });
        if (!colorSeleccionado) return Swal.fire({ icon: "warning", title: "Seleccione un color", confirmButtonColor: C.navy });
        if (!tallaSeleccionada) return Swal.fire({ icon: "warning", title: "Seleccione una talla", confirmButtonColor: C.navy });

        const variante = obtenerVarianteActual();
        if (!variante) return Swal.fire({ icon: "error", title: "Variante no encontrada", confirmButtonColor: C.danger });

        const cantidad = parseInt(cantidadSeleccionada) || 1;
        if (cantidad <= 0) return Swal.fire({ icon: "warning", title: "Cantidad inválida", confirmButtonColor: C.navy });

        const stockDisponible = calcularStockDisponible(variante);
        if (!modoEdicion && cantidad > stockDisponible) {
            return Swal.fire({ icon: "warning", title: "Stock insuficiente", text: `Solo quedan ${stockDisponible} unidades disponibles`, confirmButtonColor: C.navy });
        }

        const precioBase = parseFloat(productoSeleccionado.PrecioBase) || 0;
        const precioTalla = parseFloat(variante.talla?.Precio) || 0;
        const precioTela = parseFloat(variante.tela?.PrecioTela) || 0;
        const precioUnitario = precioBase + precioTalla + precioTela;

        const existenteIndex = productosAgregados.findIndex(
            p => p.ProductoID === productoSeleccionado.ProductoID &&
                p.ColorID === variante.ColorID &&
                p.TallaID === variante.TallaID
        );

        if (existenteIndex >= 0) {
            const stockDisponibleParaAgregar = calcularStockDisponible(variante, existenteIndex);
            if (!modoEdicion && cantidad > stockDisponibleParaAgregar) {
                return Swal.fire({ icon: "warning", title: "Stock insuficiente", text: `Máximo disponible: ${stockDisponibleParaAgregar}`, confirmButtonColor: C.navy });
            }
            const nuevos = [...productosAgregados];
            nuevos[existenteIndex].Cantidad += cantidad;
            setProductosAgregados(nuevos);
        } else {
            setProductosAgregados(prev => ([
                ...prev,
                {
                    ProductoID: productoSeleccionado.ProductoID,
                    Nombre: productoSeleccionado.Nombre,
                    Cantidad: cantidad,
                    PrecioUnitario: precioUnitario,
                    ColorID: variante.ColorID,
                    ColorNombre: variante.color?.Nombre || "-",
                    TallaID: variante.TallaID,
                    TallaNombre: variante.talla?.Nombre || "-",
                    /* ── TELA: guardamos id y nombre de la tela de la variante ── */
                    TelaID: variante.TelaID || variante.tela?.InsumoID || null,
                    TelaNombre: variante.tela?.Nombre || "Sin tela",
                    InventarioID: variante.InventarioID,
                    StockDisponible: variante.Stock,
                },
            ]));
        }

        // Reset UI
        setProductoSeleccionado(null);
        setVariantes([]);
        setColorSeleccionado("");
        setTallaSeleccionada("");
        setCantidadSeleccionada(1);
        setShowModalProducto(false);
    };

    const eliminarProducto = (index) => {
        const nuevos = [...productosAgregados];
        nuevos.splice(index, 1);
        setProductosAgregados(nuevos);
    };

    const cambiarCantidad = (index, valor) => {
        const nuevos = [...productosAgregados];
        const cantidad = parseInt(valor);
        if (isNaN(cantidad) || cantidad <= 0) return;

        const item = nuevos[index];
        const variante = variantes.find(
            v => v.ProductoID === item.ProductoID && v.ColorID === item.ColorID && v.TallaID === item.TallaID
        );
        let stockTotal = variante ? variante.Stock : (item.StockDisponible ?? 0);
        const usadoExcluyendoActual = productosAgregados
            .map((p, idx) => ({ ...p, idx }))
            .filter(p =>
                p.ProductoID === item.ProductoID &&
                p.ColorID === item.ColorID &&
                p.TallaID === item.TallaID &&
                p.idx !== index
            )
            .reduce((acc, p) => acc + (p.Cantidad || 0), 0);
        const stockDisponible = Math.max(0, stockTotal - usadoExcluyendoActual);

        if (!modoEdicion && cantidad > stockDisponible) {
            Swal.fire({ icon: "warning", title: "Stock insuficiente", text: `Solo quedan ${stockDisponible} unidades`, confirmButtonColor: C.navy });
            return;
        }
        item.Cantidad = cantidad;
        setProductosAgregados(nuevos);
    };

    const generarVenta = async () => {
        if (!clienteSeleccionado) {
            return Swal.fire({ icon: "warning", title: "Cliente requerido", text: "Por favor selecciona un cliente", confirmButtonColor: C.navy });
        }
        if (productosAgregados.length === 0) {
            return Swal.fire({ icon: "warning", title: "Sin productos", text: "Debes agregar al menos un producto a la venta", confirmButtonColor: C.navy });
        }

        const detalles = productosAgregados.map(p => ({
            ProductoID: p.ProductoID,
            Cantidad: p.Cantidad,
            PrecioUnitario: parseFloat(p.PrecioUnitario),
            ColorID: p.ColorID,
            TallaID: p.TallaID,
            TelaID: p.TelaID ?? null,
            InventarioID: p.InventarioID,
        }));

        const venta = {
            DocumentoID: clienteSeleccionado,
            Subtotal: parseFloat(subtotal.toFixed(2)),
            Total: parseFloat(total.toFixed(2)),
            EstadoID: modoEdicion ? ventaEdit.EstadoID : 9,
            detalles,
        };

        try {
            const token = localStorage.getItem("token");
            if (modoEdicion) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/ventas/${ventaEdit.VentaID}`, venta, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                await Swal.fire({
                    icon: "success", title: "¡Venta actualizada!",
                    html: `<p>La venta <strong>#${ventaEdit.VentaID}</strong> se actualizó correctamente</p><p><strong>Total:</strong> $${total.toLocaleString()}</p>`,
                    confirmButtonColor: C.success,
                });
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ventas`, venta, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const ventaCreada = response.data?.venta || response.data;
                const clienteNombre = usuarios.find(u => u.DocumentoID === parseInt(clienteSeleccionado))?.Nombre || "Cliente";
                await Swal.fire({
                    icon: "success", title: "¡Venta registrada exitosamente!",
                    html: `
                        <div style="text-align:left;padding:10px;font-family:'Outfit',sans-serif">
                            <p><strong>Número:</strong> #${ventaCreada.VentaID || "N/A"}</p>
                            <p><strong>Cliente:</strong> ${clienteNombre}</p>
                            <p><strong>Productos:</strong> ${productosAgregados.length} ítem(s)</p>
                            <hr style="margin:10px 0">
                            <p style="font-size:1.2rem;color:${C.success}"><strong>Total:</strong> $${total.toLocaleString()}</p>
                        </div>`,
                    confirmButtonColor: C.success, confirmButtonText: "Ver ventas",
                });
            }
            if (onClose) onClose(); else navigate("/dashboard/ventas");
        } catch (err) {
            console.error("Error:", err.response?.data || err);
            const msg = err.response?.data?.error || err.message || "Error inesperado";
            Swal.fire({ icon: "error", title: "Error al procesar la venta", text: msg, confirmButtonColor: C.danger });
        }
    };

    const varianteActual = obtenerVarianteActual();
    const stockActual = calcularStockDisponible(varianteActual);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                .venta-row:hover { background: ${C.accentSoft} !important; }
                .prod-card:hover { transform: scale(1.03); border-color: ${C.accent} !important; }
                .icon-btn:hover { transform: scale(1.08); }
                .field-label { font-size:12px; font-weight:700; color:${C.navy}; margin-bottom:5px; display:block; }
                .field-input {
                    width:100%; border:1.5px solid ${C.border}; border-radius:9px;
                    padding:9px 13px; font-family:'Outfit',sans-serif; font-size:13px;
                    color:#0f172a; background:#fff; outline:none; transition:border-color 0.18s;
                }
                .field-input:focus { border-color:${C.accent}; }
                .field-input:disabled { background:${C.bg}; color:${C.muted}; cursor:not-allowed; }
                .field-select {
                    width:100%; border:1.5px solid ${C.border}; border-radius:9px;
                    padding:9px 13px; font-family:'Outfit',sans-serif; font-size:13px;
                    color:#0f172a; background:#fff; outline:none; transition:border-color 0.18s; cursor:pointer;
                }
                .field-select:focus { border-color:${C.accent}; }
                .field-select:disabled { background:${C.bg}; color:${C.muted}; cursor:not-allowed; }
            `}</style>

            <div style={{ minHeight: "100%", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif", animation: "fadeIn 0.3s ease" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
                        {modoEdicion ? "Editar Venta" : "Nueva Venta"}
                    </h4>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={generarVenta}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#2d3f6e"}
                            onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                            {modoEdicion ? "Actualizar Venta" : "Generar Venta"}
                        </button>
                        <button onClick={onClose || (() => navigate("/dashboard/ventas"))}
                            style={{ background: "#fef2f2", color: C.danger, border: `1.5px solid #fecaca`, borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                            Cancelar
                        </button>
                    </div>
                </div>

                {/* ── CARD PRINCIPAL ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "24px 28px", marginBottom: 24 }}>

                    {/* Fila cliente + totales */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 20, marginBottom: 24, alignItems: "end" }}>
                        <div>
                            <label className="field-label">Cliente *</label>
                            <select
                                className="field-select"
                                value={clienteSeleccionado}
                                onChange={e => setClienteSeleccionado(e.target.value)}
                                disabled={modoEdicion}
                            >
                                <option value="">Seleccione un cliente...</option>
                                {usuarios.map(u => (
                                    <option key={u.DocumentoID} value={u.DocumentoID}>
                                        {u.Nombre} — {u.DocumentoID}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="field-label">Subtotal</label>
                            <input
                                className="field-input"
                                readOnly
                                value={`$${subtotal.toLocaleString()}`}
                                style={{ background: C.bg, fontWeight: 600, color: C.muted }}
                            />
                        </div>

                        <div>
                            <label className="field-label">Total</label>
                            <input
                                className="field-input"
                                readOnly
                                value={`$${total.toLocaleString()}`}
                                style={{ background: C.successSoft, fontWeight: 700, color: C.success, border: `1.5px solid ${C.successBorder}` }}
                            />
                        </div>
                    </div>

                    <div style={{ height: 1, background: C.border, marginBottom: 22 }} />

                    {/* Botón agregar producto */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.navy }}>Productos en la venta</p>
                        <button
                            onClick={() => setShowModalProducto(true)}
                            style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                            + Elegir Producto
                        </button>
                    </div>

                    {/* ── TABLA PRODUCTOS AGREGADOS ── */}
                    <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                            <thead>
                                <tr>
                                    {["#", "Producto", "Color", "Talla", "Tela", "Cant.", "P. Unit.", "Subtotal", ""].map((h, i) => (
                                        <th key={i} style={{
                                            ...TH,
                                            textAlign: ["Cant.", "P. Unit.", "Subtotal"].includes(h) ? "right" : (h === "" ? "center" : "left"),
                                            borderTopLeftRadius: i === 0 ? 14 : 0,
                                            borderTopRightRadius: i === 8 ? 14 : 0,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {productosAgregados.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
                                            <p style={{ margin: "0 0 10px" }}>No hay productos agregados</p>
                                            <button onClick={() => setShowModalProducto(true)}
                                                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                + Agregar primer producto
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    productosAgregados.map((p, i) => (
                                        <tr key={i} className="venta-row" style={{ background: i % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                            <td style={{ padding: "10px 14px" }}>
                                                <Badge type="muted">{i + 1}</Badge>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontWeight: 600, color: C.navy }}>{p.Nombre}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                                <Badge type="accent">{p.ColorNombre}</Badge>
                                            </td>
                                            <td style={{ padding: "10px 14px" }}>
                                                <Badge type="navy">{p.TallaNombre}</Badge>
                                            </td>
                                            <td style={{ padding: "10px 14px" }}>
                                                {/* ── TELA mostrada en la tabla ── */}
                                                <Badge type={p.TelaNombre !== "Sin tela" ? "success" : "muted"}>
                                                    {p.TelaNombre}
                                                </Badge>
                                            </td>
                                            <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={p.Cantidad}
                                                    onChange={e => cambiarCantidad(i, e.target.value)}
                                                    style={{ width: 62, border: `1.5px solid ${C.border}`, borderRadius: 7, padding: "5px 8px", fontFamily: "'Outfit',sans-serif", fontSize: 13, textAlign: "center", outline: "none" }}
                                                    onFocus={e => e.target.style.borderColor = C.accent}
                                                    onBlur={e => e.target.style.borderColor = C.border}
                                                />
                                            </td>
                                            <td style={{ padding: "10px 14px", textAlign: "right", color: C.muted }}>
                                                ${parseFloat(p.PrecioUnitario).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: C.navy }}>
                                                ${(p.Cantidad * parseFloat(p.PrecioUnitario)).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                                <button className="icon-btn" onClick={() => eliminarProducto(i)} title="Eliminar"
                                                    style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid #fecaca`, background: "#fef2f2", color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
                                                    <X size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Resumen totales */}
                    {productosAgregados.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18, gap: 24 }}>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ margin: "0 0 4px", fontSize: 13, color: C.muted, fontWeight: 600 }}>
                                    Subtotal: <span style={{ color: C.accent }}>${subtotal.toLocaleString()}</span>
                                </p>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.navy }}>
                                    Total: <span style={{ color: C.success }}>${total.toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL SELECCIÓN DE PRODUCTO ── */}
            <ProductoModal show={showModalProducto} onClose={() => setShowModalProducto(false)}>
                {/* Header */}
                <div style={{ background: C.navyGrad, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Seleccionar Producto</p>
                    <button onClick={() => setShowModalProducto(false)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

                    {/* Buscador */}
                    <div style={{ position: "relative", marginBottom: 20 }}>
                        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                        <input
                            className="field-input"
                            placeholder="Buscar producto por nombre..."
                            value={busquedaProducto}
                            onChange={e => setBusquedaProducto(e.target.value)}
                            style={{ paddingLeft: 38 }}
                        />
                    </div>

                    {/* Grid de productos */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                        {productosFiltrados.map(producto => (
                            <div key={producto.ProductoID} className="prod-card"
                                onClick={() => onSeleccionarProductoModal(producto)}
                                style={{
                                    border: `1.5px solid ${productoSeleccionado?.ProductoID === producto.ProductoID ? C.accent : C.border}`,
                                    borderRadius: 14, overflow: "hidden", cursor: "pointer",
                                    background: productoSeleccionado?.ProductoID === producto.ProductoID ? C.accentSoft : "#fff",
                                    transition: "all 0.18s", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                }}>
                                <div style={{ height: 150, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {producto.ImagenProducto
                                        ? <img src={producto.ImagenProducto} alt={producto.Nombre} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                                        : <span style={{ color: C.muted, fontSize: 12 }}>Sin imagen</span>
                                    }
                                </div>
                                <div style={{ padding: "12px 14px" }}>
                                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: C.navy }}>{producto.Nombre}</p>
                                    <p style={{ margin: 0, fontSize: 12, color: C.accent, fontWeight: 600 }}>
                                        Precio base: ${parseFloat(producto.PrecioBase || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── CONFIGURACIÓN DE VARIANTE ── */}
                    {productoSeleccionado && (
                        <div style={{ border: `1.5px solid ${C.accentBorder}`, borderRadius: 14, padding: "18px 20px", background: C.accentSoft }}>
                            <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: C.navy }}>
                                Configurar: <span style={{ color: C.accent }}>{productoSeleccionado.Nombre}</span>
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                                {/* Color */}
                                <div>
                                    <label className="field-label">Color</label>
                                    <select className="field-select" value={colorSeleccionado}
                                        onChange={e => { setColorSeleccionado(e.target.value); setTallaSeleccionada(""); setCantidadSeleccionada(1); }}>
                                        <option value="">Seleccione color</option>
                                        {coloresDisponibles.map(c => (
                                            <option key={c.ColorID} value={c.ColorID}>{c.Nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Talla */}
                                <div>
                                    <label className="field-label">Talla</label>
                                    <select className="field-select" value={tallaSeleccionada}
                                        onChange={e => setTallaSeleccionada(e.target.value)}
                                        disabled={!colorSeleccionado}>
                                        <option value="">Seleccione talla</option>
                                        {tallasDisponibles.map(t => (
                                            <option key={t.TallaID} value={t.TallaID}>{t.Nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cantidad */}
                                <div>
                                    <label className="field-label">Cantidad</label>
                                    <input type="number" min={1} className="field-input"
                                        value={cantidadSeleccionada}
                                        onChange={e => setCantidadSeleccionada(e.target.value)} />
                                </div>
                            </div>

                            {/* ── INFO DE VARIANTE: Tela + Stock ── */}
                            {colorSeleccionado && tallaSeleccionada && varianteActual && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                    {/* Tela de la variante */}
                                    <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                                        <p style={{ margin: "0 0 5px", fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tela de la variante</p>
                                        {telaVarianteActual ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Badge type="success">{telaVarianteActual.Nombre}</Badge>
                                                <span style={{ fontSize: 12, color: C.muted }}>
                                                    +${parseFloat(telaVarianteActual.PrecioTela || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge type="muted">Sin tela</Badge>
                                        )}
                                    </div>

                                    {/* Stock disponible */}
                                    <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                                        <p style={{ margin: "0 0 5px", fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock disponible</p>
                                        <span style={{ fontSize: 18, fontWeight: 800, color: stockActual > 0 ? C.success : C.danger }}>
                                            {stockActual}
                                        </span>
                                        <span style={{ fontSize: 12, color: C.muted, marginLeft: 5 }}>unidades</span>
                                    </div>
                                </div>
                            )}

                            {/* Desglose de precio */}
                            {colorSeleccionado && tallaSeleccionada && varianteActual && (
                                <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}`, marginBottom: 16, fontSize: 12 }}>
                                    <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Desglose de precio unitario</p>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                        <span style={{ color: C.muted }}>Base: <strong style={{ color: C.navy }}>${parseFloat(productoSeleccionado.PrecioBase || 0).toLocaleString()}</strong></span>
                                        <span style={{ color: C.muted }}>Talla: <strong style={{ color: C.navy }}>${parseFloat(varianteActual.talla?.Precio || 0).toLocaleString()}</strong></span>
                                        <span style={{ color: C.muted }}>Tela: <strong style={{ color: C.navy }}>${parseFloat(varianteActual.tela?.PrecioTela || 0).toLocaleString()}</strong></span>
                                        <span style={{ color: C.muted }}>
                                            Total unit.: <strong style={{ color: C.accent, fontSize: 13 }}>
                                                ${(parseFloat(productoSeleccionado.PrecioBase || 0) + parseFloat(varianteActual.talla?.Precio || 0) + parseFloat(varianteActual.tela?.PrecioTela || 0)).toLocaleString()}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Botón agregar */}
                            {colorSeleccionado && tallaSeleccionada ? (
                                <button
                                    onClick={agregarProducto}
                                    disabled={!modoEdicion && stockActual <= 0}
                                    style={{
                                        background: (!modoEdicion && stockActual <= 0) ? "#e2e8f0" : C.navy,
                                        color: (!modoEdicion && stockActual <= 0) ? C.muted : "#fff",
                                        border: "none", borderRadius: 10, padding: "10px 22px",
                                        fontSize: 13, fontWeight: 700, cursor: (!modoEdicion && stockActual <= 0) ? "not-allowed" : "pointer",
                                        fontFamily: "'Outfit',sans-serif",
                                    }}>
                                    {(!modoEdicion && stockActual <= 0) ? "Sin stock disponible" : "Agregar a la venta"}
                                </button>
                            ) : (
                                <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Seleccione color y talla para continuar</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer modal */}
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                    <button onClick={() => setShowModalProducto(false)}
                        style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        Cerrar
                    </button>
                </div>
            </ProductoModal>
        </>
    );
}