import { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import UsuariosForm from "./formularios_dash/usuarios";
import { getUsuarios, deleteUsuario } from "../Services/api-usuarios/usuarios";
import Swal from "sweetalert2";

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

const Badge = ({ type, children }) => {
  const map = {
    success: { bg: "#f0fdf4", color: C.success, border: "#bbf7d0" },
    warning: { bg: "#fffbeb", color: C.warning, border: "#fde68a" },
    danger: { bg: "#fef2f2", color: C.danger, border: "#fecaca" },
    accent: { bg: C.accentSoft, color: C.accent, border: C.accentBorder },
    navy: { bg: C.navy, color: "#fff", border: C.navy },
    muted: { bg: "#f1f5f9", color: C.muted, border: "#e2e8f0" },
  };
  const s = map[type] || map.muted;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
      {children}
    </span>
  );
};

const TH = { background: C.navyGrad, color: "#fff", fontSize: 11, fontWeight: 700, padding: "11px 14px", whiteSpace: "nowrap", letterSpacing: "0.04em" };

/* ── Paginación ── */
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Outfit',sans-serif" }}>
          Mostrando <strong style={{ color: C.navy }}>{desde}–{hasta}</strong> de <strong style={{ color: C.navy }}>{totalItems}</strong> usuarios
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

/* ── Modal Detalle ── */
const DetailModal = ({ show, onClose, usuario, getRoleName, onEdit }) => {
  if (!show || !usuario) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ background: C.navyGrad, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Detalles del Usuario</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Documento: {usuario.DocumentoID}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Nombre", value: usuario.Nombre },
            { label: "Correo Electrónico", value: usuario.Correo },
            { label: "Dirección", value: usuario.Direccion },
            { label: "Teléfono", value: usuario.Telefono },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: C.navy, fontWeight: 500 }}>{value}</p>
            </div>
          ))}
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 6 }}>Rol</p>
            <Badge type="accent">{getRoleName(usuario)}</Badge>
          </div>
        </div>
        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => { onClose(); onEdit(usuario); }} style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            <FaEdit size={11} style={{ marginRight: 6 }} />Editar
          </button>
          <button onClick={onClose} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const Usuarios = () => {
  const [showForm, setShowForm] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState("");

  /* ── Paginación ── */
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  const Toast = Swal.mixin({
    toast: true, position: "top-end", showConfirmButton: false,
    timer: 3000, timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  useEffect(() => { loadUsuarios(); }, []);

  // Reset página al buscar
  useEffect(() => { setPaginaActual(1); }, [search]);

  const loadUsuarios = async () => {
    try {
      setLoading(true); setError(null);
      const response = await getUsuarios({ page: 1, limit: 1000 }); // trae todos para paginación client-side
      if (response && response.datos) setUsuarios(response.datos);
      else setError("Error al cargar usuarios");
    } catch { setError("Error de conexión al servidor"); }
    finally { setLoading(false); }
  };

  const handleAgregar = () => { setSelectedUsuario(null); setShowForm(true); };
  const handleEditar = (u) => { setSelectedUsuario(u); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setSelectedUsuario(null); };
  const handleSaveSuccess = async () => { await loadUsuarios(); handleCloseForm(); };
  const handleVer = (u) => { setSelectedUsuario(u); setShowDetailModal(true); };

  const handleEliminar = async (documentoID) => {
    try {
      setLoading(true);
      const cotizacionesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizaciones/usuario/${documentoID}`);
      const cotizaciones = await cotizacionesResponse.json();
      const cotizacionesActivas = cotizaciones.filter(c => { const eID = c.EstadoID || c.estado?.EstadoID; return eID === 1 || eID === 2; });
      if (cotizacionesActivas.length > 0) {
        await Swal.fire({ icon: "warning", title: "No se puede eliminar", html: `Este usuario tiene <strong>${cotizacionesActivas.length} cotización(es) activa(s)</strong>.`, confirmButtonText: "Entendido", confirmButtonColor: C.warning });
        setLoading(false); return;
      }
      const ventasResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas?limit=1000&page=1`);
      const ventasData = await ventasResponse.json();
      const todasLasVentas = ventasData.datos || [];  
      const ventasActivas = todasLasVentas.filter(v => v.DocumentoID === documentoID && v.EstadoID !== 11);
      if (ventasActivas.length > 0) {
        await Swal.fire({ icon: "warning", title: "No se puede eliminar", html: `Este usuario tiene <strong>${ventasActivas.length} venta(s) registrada(s)</strong>.`, confirmButtonText: "Entendido", confirmButtonColor: C.warning });
        setLoading(false); return;
      }
      const result = await Swal.fire({
        title: "¿Está seguro?", html: `<p>Está a punto de eliminar el usuario con documento <strong>${documentoID}</strong>.</p><p style="color:${C.danger};font-weight:600">Esta acción no se puede deshacer.</p>`,
        icon: "warning", showCancelButton: true, confirmButtonColor: C.danger, cancelButtonColor: C.navy, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
      });
      if (result.isConfirmed) {
        const response = await deleteUsuario(documentoID);
        if (response.estado) { await loadUsuarios(); Toast.fire({ icon: "success", title: "Usuario eliminado correctamente" }); }
        else throw new Error(response.mensaje || "Error al eliminar el usuario");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.mensaje || err.message || "Error al eliminar el usuario";
      Swal.fire({ icon: "error", title: "Error", text: errorMsg, confirmButtonColor: C.danger });
    } finally { setLoading(false); }
  };

  const getRoleName = (usuario) => {
    if (usuario.RolNombre) return usuario.RolNombre;
    const rolesMap = { "AD": "Administrador", "CL": "Cliente", "EM": "Empleado", "1": "Administrador", "2": "Cliente", "3": "Empleado" };
    return rolesMap[usuario.RolID] || usuario.RolID;
  };

  /* ── Filtrado ── */
  const usuariosFiltrados = usuarios.filter(u => {
    const b = search.toLowerCase();
    return (
      u.DocumentoID?.toString().includes(b) ||
      u.Nombre?.toLowerCase().includes(b) ||
      u.Correo?.toLowerCase().includes(b) ||
      u.Telefono?.toLowerCase().includes(b)
    );
  });

  /* ── Paginado ── */
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / itemsPorPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const desde = usuariosFiltrados.length === 0 ? 0 : (paginaSegura - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaSegura * itemsPorPagina, usuariosFiltrados.length);
  const usuariosPagina = usuariosFiltrados.slice((paginaSegura - 1) * itemsPorPagina, paginaSegura * itemsPorPagina);

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) setPaginaActual(nuevaPagina);
  };
  const handleCambiarItemsPorPagina = (n) => { setItemsPorPagina(n); setPaginaActual(1); };

  if (showForm) return <UsuariosForm onClose={handleCloseForm} onSave={handleSaveSuccess} usuario={selectedUsuario} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .usr-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Usuarios</h4>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
              {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? "s" : ""} registrado{usuariosFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }} />
              <input
                type="text" placeholder="Buscar usuario..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: "9px 12px 9px 36px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 240, transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <button onClick={handleAgregar} disabled={loading}
              style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1, boxShadow: `0 4px 12px ${C.navy}33`, transition: "all 0.2s" }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#2d3f6e"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.transform = "none"; }}>
              <FaPlusCircle size={15} /> Agregar Usuario
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
            {error}
            <button onClick={loadUsuarios} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
          </div>
        )}

        {/* ── TABLA ── */}
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
              <thead>
                <tr>
                  {["Documento", "Nombre", "Correo", "Dirección", "Teléfono", "Rol", "Acciones"].map((h, i) => (
                    <th key={i} style={{ ...TH, textAlign: i === 6 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 6 ? 18 : 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando usuarios...</p>
                  </td></tr>
                ) : error ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                    <p style={{ color: C.danger, fontWeight: 600, marginBottom: 12 }}>❌ Error al cargar datos</p>
                    <button onClick={loadUsuarios} style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 9, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                  </td></tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                      {search ? `No se encontraron usuarios con "${search}"` : "📝 No hay usuarios registrados"}
                    </p>
                    {!search && <button onClick={handleAgregar} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primer usuario</button>}
                  </td></tr>
                ) : (
                  usuariosPagina.map((u, idx) => (
                    <tr key={u.DocumentoID} className="usr-row"
                      style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                      <td style={{ padding: "11px 14px" }}><Badge type="muted">{u.DocumentoID}</Badge></td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{u.Nombre}</td>
                      <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>{u.Correo}</td>
                      <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>{(u.Direccion || "").length > 40 ? (u.Direccion || "").substring(0, 40) + "..." : (u.Direccion || "")}</td>
                      <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>{u.Telefono || ""}</td>
                      <td style={{ padding: "11px 14px" }}><Badge type="accent">{getRoleName(u)}</Badge></td>
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button className="icon-btn" onClick={() => handleVer(u)} title="Ver detalles"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaEye size={12} />
                          </button>
                          <button className="icon-btn" onClick={() => handleEditar(u)} title="Editar"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaEdit size={12} />
                          </button>
                          <button className="icon-btn" onClick={() => handleEliminar(u.DocumentoID)} title="Eliminar"
                            style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINACIÓN ── */}
          {!loading && !error && (
            <Paginacion
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              totalItems={usuariosFiltrados.length}
              itemsPorPagina={itemsPorPagina}
              onCambiarPagina={handleCambiarPagina}
              onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
              desde={desde}
              hasta={hasta}
            />
          )}
        </div>
      </div>

      <DetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        usuario={selectedUsuario}
        getRoleName={getRoleName}
        onEdit={(u) => { setSelectedUsuario(u); setShowForm(true); }}
      />
    </>
  );
};

export default Usuarios;