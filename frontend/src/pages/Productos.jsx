import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { FaPlusCircle, FaSearch, FaEye, FaEdit, FaTrash, FaBoxOpen, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getProductos, deleteProducto } from "../Services/api-productos/productos";
import { getVariantesByProducto } from "../Services/api-productos/variantes";
import { getTallas, getColores, getTelas } from "../Services/api-productos/atributos";

/* ── Tokens ── */
const C = {
  navy: "#1a2540",
  navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
  accent: "#4f8ef7",
  accentSoft: "#f0f4ff",
  accentBorder: "#c7d9ff",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
};


const formatPrecio = (valor) =>
  (parseFloat(valor) || 0).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });


const TH = { background: C.navyGrad, color: "#fff", fontSize: 12, fontWeight: 700, padding: "13px 16px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

const Badge = ({ type, children }) => {
  const map = {
    success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
    warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
    danger: { bg: "#fef2f2", color: C.danger, border: "#fecaca" },
    accent: { bg: "#f0f4ff", color: C.accent, border: "#c7d9ff" },
    navy: { bg: C.navy, color: "#fff", border: C.navy },
    muted: { bg: "#f1f5f9", color: C.muted, border: "#e2e8f0" },
  };
  const s = map[type] || map.muted;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700,
      fontFamily: "'Outfit',sans-serif", display: "inline-block",
    }}>{children}</span>
  );
};

const ActionBtn = ({ onClick, title, color, children }) => (
  <button onClick={onClick} title={title} style={{
    width: 32, height: 32, borderRadius: 8,
    border: `1.5px solid ${color}20`,
    background: `${color}0d`,
    color, cursor: "pointer", display: "inline-flex",
    alignItems: "center", justifyContent: "center",
    transition: "all 0.18s", flexShrink: 0,
  }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.transform = "none"; }}
  >{children}</button>
);

/* ── Paginación (idéntica a Compras) ── */
const ITEMS_POR_PAGINA_OPCIONES = [5, 10, 20, 50];

const Paginacion = ({ paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiarPagina, onCambiarItemsPorPagina, desde, hasta }) => {
  if (totalItems === 0) return null;

  const generarPaginas = () => {
    const paginas = [];
    const delta = 2;
    const rangoIzq = Math.max(2, paginaActual - delta);
    const rangoDer = Math.min(totalPaginas - 1, paginaActual + delta);

    paginas.push(1);
    if (rangoIzq > 2) paginas.push("...");
    for (let i = rangoIzq; i <= rangoDer; i++) paginas.push(i);
    if (rangoDer < totalPaginas - 1) paginas.push("...");
    if (totalPaginas > 1) paginas.push(totalPaginas);

    return paginas;
  };

  const btnBase = {
    minWidth: 34, height: 34, borderRadius: 8, border: `1.5px solid ${C.border}`,
    background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Outfit',sans-serif", transition: "all 0.18s", padding: "0 8px",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: `1px solid ${C.border}`, background: "#fff", flexWrap: "wrap", gap: 12 }}>

      {/* Info items */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
          Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> productos
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>Por página:</span>
          <select value={itemsPorPagina} onChange={e => onCambiarItemsPorPagina(Number(e.target.value))}
            style={{ border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", color: C.navy, cursor: "pointer", background: "#fff" }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}>
            {ITEMS_POR_PAGINA_OPCIONES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Controles de página */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          style={{ ...btnBase, opacity: paginaActual === 1 ? 0.4 : 1, cursor: paginaActual === 1 ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (paginaActual !== 1) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          <FaChevronLeft size={11} />
        </button>

        {generarPaginas().map((p, i) => (
          p === "..." ? (
            <span key={`e-${i}`} style={{ padding: "0 4px", color: C.muted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>…</span>
          ) : (
            <button key={p} onClick={() => onCambiarPagina(p)}
              style={{
                ...btnBase,
                background: p === paginaActual ? C.navy : "#fff",
                color: p === paginaActual ? "#fff" : C.muted,
                borderColor: p === paginaActual ? C.navy : C.border,
                fontWeight: p === paginaActual ? 700 : 600,
                cursor: p === paginaActual ? "default" : "pointer",
              }}
              onMouseEnter={e => { if (p !== paginaActual) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
              onMouseLeave={e => { if (p !== paginaActual) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}>
              {p}
            </button>
          )
        ))}

        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          style={{ ...btnBase, opacity: paginaActual === totalPaginas ? 0.4 : 1, cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (paginaActual !== totalPaginas) { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          <FaChevronRight size={11} />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const Productos = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [telas, setTelas] = useState([]);
  const [stockPorProducto, setStock] = useState({});
  const [cargando, setCargando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [productoSel, setProductoSel] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenModal, setImagenModal] = useState(null);

  /* ── Estado de paginación ── */
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Carga inicial
  // DESPUÉS:
  useEffect(() => {
    cargarDatos(1, itemsPorPagina, "");
  }, []);  // Solo en montaje

  useEffect(() => {
    // Evitar que se dispare en el montaje inicial (cuando busqueda aún es "")
    // Solo actuar cuando el usuario realmente escribe algo o borra
    const timeout = setTimeout(() => {
      setPaginaActual(1);
      cargarDatos(1, itemsPorPagina, busqueda);
    }, 350);  // debounce: espera 350ms después de que el usuario deja de escribir
    return () => clearTimeout(timeout);
  }, [busqueda]);


  const cargarDatos = async (page = paginaActual, limit = itemsPorPagina, search = busqueda) => {
    setCargando(true);
    try {
      const [pRes, cRes, tRes, teRes] = await Promise.all([
        getProductos({ page, limit, search }),   // ← ahora envía parámetros
        getColores(),
        getTallas(),
        getTelas()
      ]);

      const prods = pRes.datos || [];
      setProductos(prods);
      setTotalItems(pRes.total || 0);
      setTotalPaginas(pRes.totalPaginas || 1);
      setColores(cRes.datos || cRes);
      setTallas(tRes.datos || tRes);
      setTelas(teRes || []);

      // Stock: solo para los productos de esta página
      const stockMap = {};
      await Promise.all(prods.map(async p => {
        try {
          const r = await getVariantesByProducto(p.ProductoID);
          const vs = r.datos || r;
          stockMap[p.ProductoID] = vs.reduce((a, v) => a + (v.Stock || 0), 0);
        } catch { stockMap[p.ProductoID] = 0; }
      }));
      setStock(stockMap);

    } catch { Swal.fire("Error", "No se pudieron cargar los datos", "error"); }
    finally { setCargando(false); }
  };


  // REEMPLÁZALO por esto:
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const desde = totalItems === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaSegura * itemsPorPagina, totalItems);
  const productosPagina = productos;   // el backend ya devuelve solo los de esta página


  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      cargarDatos(nuevaPagina, itemsPorPagina, busqueda);
    }
  };

  const handleCambiarItemsPorPagina = (n) => {
    setItemsPorPagina(n);
    setPaginaActual(1);
    cargarDatos(1, n, busqueda);
  };


  const handleEliminar = async (producto) => {
    const r = await Swal.fire({
      title: "¿Eliminar producto?", text: `Se eliminará "${producto.Nombre}" y sus variantes`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: C.danger, cancelButtonColor: C.navy,
      confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar"
    });
    if (!r.isConfirmed) return;
    setCargando(true);
    try {
      await (await import("../Services/api-productos/productos")).deleteProducto(producto.ProductoID);
      Swal.fire({ title: "¡Eliminado!", icon: "success", timer: 2000, showConfirmButton: false });
      cargarDatos();
    } catch (e) {
      Swal.fire("Error", e.response?.data?.mensaje || "No se pudo eliminar", "error");
    } finally { setCargando(false); }
  };

  const handleVerDetalle = async (producto) => {
    setProductoSel(producto); setCargando(true);
    try {
      const r = await getVariantesByProducto(producto.ProductoID);
      setVariantes(r.datos || r); setShowModal(true);
    } catch { setVariantes([]); setShowModal(true); }
    finally { setCargando(false); }
  };

  const getNombreColor = id => colores.find(c => c.ColorID === id)?.Nombre || "—";
  const getNombreTalla = id => tallas.find(t => t.TallaID === id)?.Nombre || "—";
  const getPrecioTalla = id => parseFloat(tallas.find(t => t.TallaID === parseInt(id))?.Precio) || 0;
  const getPrecioTela = id => { if (!id) return 0; return parseFloat(telas.find(t => t.InsumoID === parseInt(id))?.PrecioTela) || 0; };
  const calcPrecio = (pid, tid, teid) => {
    const base = parseFloat(productos.find(p => p.ProductoID === pid)?.PrecioBase) || 0;
    return base + getPrecioTalla(tid) + getPrecioTela(teid);
  };
  const stockBadge = (n) => n > 20 ? "success" : n > 0 ? "warning" : "danger";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .prod-row:hover { background: #f0f4ff !important; }
        .prod-row:hover td { color: #0f172a; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
              Gestión de Productos
            </h4>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
              {totalItems} producto{totalItems !== 1 ? "s" : ""} registrado{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
              <input
                type="text" placeholder="Buscar producto..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ padding: "9px 12px 9px 36px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 240, transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <button
              onClick={() => navigate("/dashboard/agregar-producto")}
              disabled={cargando}
              style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", boxShadow: `0 4px 12px ${C.navy}33`, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2d3f6e"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = "none"; }}>
              <FaPlusCircle size={15} /> Agregar Producto
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
              <thead>
                <tr>
                  {["ID", "Imagen", "Nombre", "Descripción", "Precio Base", "Stock Total", "Acciones"].map((h, i) => (
                    <th key={i} style={{ ...TH, textAlign: i >= 4 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 6 ? 18 : 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <span style={{ color: C.muted, fontSize: 13 }}>Cargando productos...</span>
                  </td></tr>
                ) : totalItems === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted }}>
                    <FaBoxOpen size={36} style={{ opacity: 0.2, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                    {busqueda ? "No se encontraron productos con ese criterio" : "No hay productos registrados"}
                  </td></tr>
                ) : (
                  productosPagina.map((p, idx) => (
                    <tr key={p.ProductoID} className="prod-row"
                      style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, transition: "background 0.15s", borderBottom: `1px solid ${C.border}`, animation: "fadeIn 0.3s ease both", animationDelay: `${idx * 0.03}s` }}>
                      <td style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>#{p.ProductoID}</td>
                      <td style={{ padding: "10px 16px" }}>
                        {p.ImagenProducto ? (
                          <img src={p.ImagenProducto} alt={p.Nombre}
                            onClick={() => setImagenModal(p.ImagenProducto)}
                            style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, cursor: "pointer", border: `2px solid ${C.border}`, transition: "transform 0.2s" }}
                            onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
                            onMouseLeave={e => e.target.style.transform = "none"}
                          />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 10, background: C.accentSoft, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaBoxOpen style={{ color: C.muted, opacity: 0.4 }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: C.navy }}>{p.Nombre}</td>
                      <td style={{ padding: "12px 16px", color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.Descripcion || "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <Badge type="navy">${formatPrecio(p.PrecioBase)}</Badge>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <Badge type={stockBadge(stockPorProducto[p.ProductoID])}>
                          {stockPorProducto[p.ProductoID] !== undefined ? stockPorProducto[p.ProductoID] : "…"}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <ActionBtn onClick={() => handleVerDetalle(p)} title="Ver detalle" color={C.accent}><FaEye size={13} /></ActionBtn>
                          <ActionBtn onClick={() => navigate(`/dashboard/editar-producto/${p.ProductoID}`)} title="Editar" color={C.warning}><FaEdit size={13} /></ActionBtn>
                          <ActionBtn onClick={() => handleEliminar(p)} title="Eliminar" color={C.danger}><FaTrash size={13} /></ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINACIÓN ── */}
          {!cargando && (
            <Paginacion
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              totalItems={totalItems}
              itemsPorPagina={itemsPorPagina}
              onCambiarPagina={handleCambiarPagina}
              onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
              desde={desde}
              hasta={hasta}
            />
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {showModal && productoSel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.25s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: C.navyGrad, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 16 }}>Detalle del Producto</h5>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20, marginBottom: 24, background: C.accentSoft, borderRadius: 14, padding: 20 }}>
                {productoSel.ImagenProducto ? (
                  <img src={productoSel.ImagenProducto} alt={productoSel.Nombre}
                    style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, cursor: "pointer" }}
                    onClick={() => setImagenModal(productoSel.ImagenProducto)} />
                ) : (
                  <div style={{ height: 140, borderRadius: 10, background: C.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32 }} />
                  </div>
                )}
                <div>
                  <h5 style={{ margin: "0 0 6px", color: C.navy, fontWeight: 800 }}>{productoSel.Nombre}</h5>
                  <p style={{ color: C.muted, fontSize: 13, margin: "0 0 12px" }}>{productoSel.Descripcion || "Sin descripción"}</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Badge type="navy">${formatPrecio(productoSel.PrecioBase)} base</Badge>
                    <Badge type="accent">{variantes.length} variante{variantes.length !== 1 ? "s" : ""}</Badge>
                    <Badge type="success">Stock: {variantes.reduce((a, v) => a + (v.Stock || 0), 0)}</Badge>
                  </div>
                </div>
              </div>
              <h6 style={{ fontWeight: 700, color: C.navy, marginBottom: 12 }}>Variantes del Producto</h6>
              {variantes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: C.muted, background: C.accentSoft, borderRadius: 12 }}>
                  No hay variantes registradas
                </div>
              ) : (
                <div style={{ overflowX: "auto", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {["Color", "Talla", "Tela", "+Talla", "+Tela", "Precio Final", "Stock", "Estado"].map((h, i) => (
                          <th key={i} style={{ ...TH, fontSize: 11, padding: "10px 12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {variantes.map((v, i) => (
                        <tr key={v.InventarioID} style={{ background: i % 2 === 0 ? "#fff" : C.accentSoft }}>
                          <td style={{ padding: "10px 12px" }}>{getNombreColor(v.ColorID)}</td>
                          <td style={{ padding: "10px 12px" }}>{getNombreTalla(v.TallaID)}</td>
                          <td style={{ padding: "10px 12px" }}><Badge type={v.TelaID ? "accent" : "muted"}>{v.tela?.Nombre || "Sin tela"}</Badge></td>
                          <td style={{ padding: "10px 12px", color: C.accent, fontWeight: 600 }}>+${formatPrecio(getPrecioTalla(v.TallaID))}</td>
                          <td style={{ padding: "10px 12px", color: C.warning, fontWeight: 600 }}>+${formatPrecio(getPrecioTela(v.TelaID))}</td>
                          <td style={{ padding: "10px 12px" }}><Badge type="navy">${formatPrecio(calcPrecio(productoSel.ProductoID, v.TallaID, v.TelaID))}</Badge></td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}><Badge type={stockBadge(v.Stock)}>{v.Stock}</Badge></td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}><Badge type={v.Estado ? "success" : "muted"}>{v.Estado ? "Disponible" : "No disp."}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowModal(false)}
                style={{ background: "#f1f5f9", color: C.muted, border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Cerrar
              </button>
              <button onClick={() => { setShowModal(false); navigate(`/dashboard/editar-producto/${productoSel.ProductoID}`); }}
                style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                <FaEdit size={12} /> Editar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMAGEN */}
      {imagenModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setImagenModal(null)}>
          <div style={{ animation: "fadeIn 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <img src={imagenModal} alt="Vista ampliada" style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => setImagenModal(null)}
                style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 24, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Productos;