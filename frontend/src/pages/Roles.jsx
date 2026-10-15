import { useState, useEffect } from "react";
import RolesForm from "./formularios_dash/RolesForm";
import { FaPlusCircle, FaEdit, FaTrash, FaSyncAlt } from "react-icons/fa";
import { getRoles, createRol, updateRol, deleteRol } from "../Services/api-roles/roles";
import Swal from "sweetalert2";

/* ── Tokens (mismos que AgregarProducto) ── */
const C = {
  navy: "#1a2540",
  navyGrad: "linear-gradient(90deg, #1a2540 0%, #2d3f6e 100%)",
  accent: "#4f8ef7",
  accentSoft: "#f0f4ff",
  accentBorder: "#c7d9ff",
  success: "#16a34a",
  successSoft: "#f0fdf4",
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

const SectionTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
    <div style={{ width: 4, height: 20, borderRadius: 4, background: C.navy }} />
    <h5 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.navy, fontFamily: "'Outfit',sans-serif" }}>{children}</h5>
  </div>
);

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rolEdit, setRolEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Toast = Swal.mixin({
    toast: true, position: "top-end", showConfirmButton: false,
    timer: 3000, timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try {
      setLoading(true); setError(null);
      const response = await getRoles();
      if (Array.isArray(response)) setRoles(response);
      else setError("Error al cargar roles");
    } catch { setError("Error de conexión al servidor"); }
    finally { setLoading(false); }
  };

  const handleSave = async (rolData) => {
    try {
      setLoading(true);
      let response;
      if (rolEdit) {
        response = await updateRol(rolEdit.RolID, rolData);
        if (response.estado) {
          setRoles(prev => prev.map(r => r.RolID === rolEdit.RolID ? { ...r, ...response.datos } : r));
          Toast.fire({ icon: "success", title: "Rol actualizado correctamente" });
        }
      } else {
        response = await createRol(rolData);
        if (response.estado) {
          setRoles(prev => [...prev, response.datos]);
          Toast.fire({ icon: "success", title: "Rol creado correctamente" });
        }
      }
      if (response.estado) { setShowForm(false); setRolEdit(null); }
      else throw new Error(response.mensaje || "Error al guardar el rol");
    } catch (err) {
      const mensaje = err.message || err.response?.data?.mensaje || "Error al guardar el rol";
      if (mensaje.toLowerCase().includes("ya existe")) {
        Swal.fire({ icon: "warning", title: "Rol duplicado", text: mensaje, confirmButtonColor: C.warning });
      } else if (mensaje.toLowerCase().includes("protegido")) {
        Swal.fire({ icon: "warning", title: "Rol protegido", text: mensaje, confirmButtonColor: C.warning });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: mensaje, confirmButtonColor: C.danger });
      }
      throw err;
    } finally { setLoading(false); }
  };

  const handleEdit = (rol) => { setRolEdit(rol); setShowForm(true); };

  const handleEliminar = async (id) => {
    const rol = roles.find(r => r.RolID === id);
    const nombreRol = rol ? rol.Nombre : "este rol";
    try {
      const result = await Swal.fire({
        title: "¿Eliminar rol?",
        html: `¿Estás seguro de eliminar el rol <strong>"${nombreRol}"</strong>?<br><small>Esta acción no se puede revertir</small>`,
        icon: "warning", showCancelButton: true,
        confirmButtonColor: C.danger, cancelButtonColor: C.navy,
        confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
      });
      if (result.isConfirmed) {
        setLoading(true);
        const response = await deleteRol(id);
        if (response.estado) {
          setRoles(prev => prev.filter(r => r.RolID !== id));
          Toast.fire({ icon: "success", title: "Rol eliminado correctamente" });
        } else throw new Error(response.mensaje || "Error al eliminar el rol");
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.mensaje || "Error al eliminar el rol";
      if (errorMsg.toLowerCase().includes("protegido") || errorMsg.toLowerCase().includes("no se puede eliminar") || errorMsg.toLowerCase().includes("necesario")) {
        Swal.fire({ icon: "warning", title: "Rol Protegido", text: errorMsg, confirmButtonColor: C.warning });
      } else if (errorMsg.toLowerCase().includes("usuario")) {
        Swal.fire({ icon: "info", title: "Rol en uso", text: errorMsg, confirmButtonColor: C.accent });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: errorMsg, confirmButtonColor: C.danger });
      }
    } finally { setLoading(false); }
  };

  const handleCambiarEstado = async (rol) => {
    const nuevoEstado = !rol.Estado;
    const estadoTexto = nuevoEstado ? "Activo" : "Inactivo";
    try {
      const result = await Swal.fire({
        title: "¿Cambiar estado?",
        html: `¿Seguro que deseas cambiar el estado del rol <strong>"${rol.Nombre}"</strong> a <strong>${estadoTexto}</strong>?`,
        icon: "question", showCancelButton: true,
        confirmButtonColor: C.navy, cancelButtonColor: C.danger,
        confirmButtonText: "Sí, cambiar", cancelButtonText: "Cancelar",
      });
      if (result.isConfirmed) {
        setLoading(true);
        const response = await updateRol(rol.RolID, { ...rol, Estado: nuevoEstado });
        if (response.estado) {
          setRoles(prev => prev.map(r => r.RolID === rol.RolID ? { ...r, Estado: nuevoEstado } : r));
          Toast.fire({ icon: "success", title: `Estado cambiado a ${estadoTexto}` });
        } else throw new Error(response.mensaje || "Error al cambiar el estado");
      }
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.mensaje || "Error al cambiar el estado";
      if (errorMsg.toLowerCase().includes("protegido") || errorMsg.toLowerCase().includes("no se puede")) {
        Swal.fire({ icon: "warning", title: "Rol Protegido", text: errorMsg, confirmButtonColor: C.warning });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: errorMsg, confirmButtonColor: C.danger });
      }
    } finally { setLoading(false); }
  };

  const handleCloseForm = () => { setShowForm(false); setRolEdit(null); };

  if (showForm) {
    return <RolesForm onClose={handleCloseForm} onSave={handleSave} rolEdit={rolEdit} rolesExistentes={roles} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rol-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>
              Gestión de Roles
            </h4>
          </div>
          <button
            onClick={() => { setRolEdit(null); setShowForm(true); }}
            disabled={loading}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2d3f6e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}
          >
            <FaPlusCircle size={15} /> Agregar Rol
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
            {error}
            <button onClick={loadRoles} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Reintentar
            </button>
          </div>
        )}

        {/* ── TABLA ── */}
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <thead>
              <tr>
                {["ID", "Nombre", "Descripción", "Estado", "Acciones"].map((h, i) => (
                  <th key={i} style={{
                    ...TH,
                    textAlign: i === 4 ? "center" : "left",
                    borderTopLeftRadius: i === 0 ? 18 : 0,
                    borderTopRightRadius: i === 4 ? 18 : 0,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando roles...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                    <p style={{ color: C.danger, fontWeight: 600, marginBottom: 12 }}>❌ Error al cargar datos</p>
                    <button onClick={loadRoles} style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 9, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 0" }}>
                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>📝 No hay roles registrados</p>
                    <button onClick={() => { setRolEdit(null); setShowForm(true); }}
                      style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      Crear primer rol
                    </button>
                  </td>
                </tr>
              ) : (
                roles.map((r, idx) => (
                  <tr key={r.RolID} className="rol-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <Badge type="muted">{r.RolID}</Badge>
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{r.Nombre}</td>
                    <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>
                      {r.Descripcion && r.Descripcion.length > 50 ? r.Descripcion.substring(0, 50) + "..." : r.Descripcion}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <Badge type={r.Estado ? "success" : "danger"}>{r.Estado ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button className="icon-btn" onClick={() => handleEdit(r)} title="Editar"
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FaEdit size={12} />
                        </button>
                        <button className="icon-btn" onClick={() => handleEliminar(r.RolID)} title="Eliminar"
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FaTrash size={12} />
                        </button>
                        <button className="icon-btn" onClick={() => handleCambiarEstado(r)} title="Cambiar estado"
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FaSyncAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Roles;