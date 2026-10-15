import { useState, useEffect } from "react";
import { FaPlusCircle, FaEye, FaEdit, FaTrash, FaSyncAlt, FaBoxOpen } from "react-icons/fa";
import ProveedoresForm from "./formularios_dash/ProveedoresForm";
import { getProveedores, createProveedor, updateProveedor, deleteProveedor, cambiarEstadoProveedor } from "../Services/api-proveedores/proveedores.js";
import Swal from "sweetalert2";

/* ── Tokens de color ── */
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

/* ── Modal detalle ── */
const DetailModal = ({ show, onClose, proveedor, onEdit }) => {
    if (!show || !proveedor) return null;
    const isActive = proveedor.Estado === true || proveedor.Estado === "Activo";
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ background: C.navyGrad, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>Detalles del Proveedor</p>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>NIT: {proveedor.Nit}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                        { label: "Nombre del Proveedor", value: proveedor.Nombre, bold: true },
                        { label: "Correo Electrónico", value: proveedor.Correo },
                        { label: "Teléfono", value: proveedor.Telefono },
                        { label: "Dirección", value: proveedor.Direccion },
                    ].map(({ label, value, bold }) => (
                        <div key={label} style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</p>
                            <p style={{ margin: 0, fontSize: bold ? 15 : 13, color: C.navy, fontWeight: bold ? 800 : 500 }}>{value}</p>
                        </div>
                    ))}
                    <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 11, color: C.muted, fontWeight: 600 }}>Estado</p>
                        <Badge type={isActive ? "success" : "danger"}>{isActive ? "✓ Activo" : "✗ Inactivo"}</Badge>
                    </div>
                </div>
                <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={() => { onClose(); onEdit(proveedor); }}
                        style={{ background: C.accentSoft, color: C.accent, border: `1.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        <FaEdit size={11} /> Editar
                    </button>
                    <button onClick={onClose} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const Proveedores = () => {
    const [searchName, setSearchName] = useState("");
    const [searchStatus, setSearchStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState(null);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => { cargarProveedores(); }, []);

    const cargarProveedores = async () => {
        try {
            setLoading(true); setError(null);
            const response = await getProveedores();
            if (response) setProveedores(response);
            else setError("Error al cargar los proveedores");
        } catch (err) { setError("Error de conexión al cargar proveedores"); }
        finally { setLoading(false); }
    };

    const handleCloseForm = (updated = false) => {
        setShowForm(false); setSelectedProveedor(null);
        if (updated) cargarProveedores();
    };

    const handleSave = async (proveedorData) => {
        try {
            setLoading(true);
            if (selectedProveedor) {
                const r = await updateProveedor(selectedProveedor.Nit, proveedorData);
                Swal.fire({ toast: true, icon: "success", title: r.mensaje || "Proveedor actualizado correctamente", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
            } else {
                const r = await createProveedor(proveedorData);
                Swal.fire({ toast: true, icon: "success", title: r.mensaje || "Proveedor creado correctamente", position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
            }
            setShowForm(false);
            await cargarProveedores();
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "Error al procesar la solicitud", confirmButtonColor: C.danger });
        } finally { setLoading(false); }
    };

    const handleEliminar = async (nit) => {
        const result = await Swal.fire({
            title: "¿Está seguro?",
            html: `<p>Esta acción intentará eliminar el proveedor.</p><small style="color:${C.muted}">Si tiene compras asociadas, solo se desactivará.</small>`,
            icon: "warning", showCancelButton: true,
            confirmButtonColor: C.danger, cancelButtonColor: C.navy,
            confirmButtonText: "Sí, continuar", cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await deleteProveedor(nit);
                await cargarProveedores();
                if (response.accion === "desactivado") {
                    Swal.fire({ icon: "info", title: "Proveedor Desactivado", html: `<p>${response.mensaje}</p><small style="color:${C.muted}">El proveedor no se eliminó porque tiene compras registradas.</small>`, confirmButtonColor: C.navy });
                } else {
                    Swal.fire({ toast: true, icon: "success", title: "Proveedor eliminado correctamente", position: "top-end", showConfirmButton: false, timer: 2000 });
                }
            } catch (err) {
                Swal.fire({ icon: "error", title: "Error", text: err.message || "Error al procesar la solicitud", confirmButtonColor: C.danger });
            } finally { setLoading(false); }
        }
    };

    const handleCambiarEstado = async (proveedor) => {
        const isActive = proveedor.Estado === true || proveedor.Estado === "Activo";
        const nuevoEstado = !isActive;
        const result = await Swal.fire({
            title: "¿Cambiar estado?", text: `¿Seguro que desea cambiar a ${nuevoEstado ? "Activo" : "Inactivo"}?`,
            icon: "question", showCancelButton: true,
            confirmButtonColor: C.navy, cancelButtonColor: C.danger,
            confirmButtonText: "Sí, cambiar", cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            setLoading(true);
            try {
                const r = await cambiarEstadoProveedor(proveedor.Nit, nuevoEstado);
                if (r.estado) { await cargarProveedores(); }
            } catch {
                await updateProveedor(proveedor.Nit, { ...proveedor, Estado: nuevoEstado });
                await cargarProveedores();
            }
            Swal.fire({ toast: true, icon: "success", title: `Estado cambiado a ${nuevoEstado ? "Activo" : "Inactivo"}`, position: "top-end", showConfirmButton: false, timer: 2500, timerProgressBar: true });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error al cambiar estado", text: err.message || "Error", confirmButtonColor: C.danger });
        } finally { setLoading(false); }
    };

    const filtered = proveedores.filter(p =>
        p.Nombre.toLowerCase().includes(searchName.toLowerCase()) &&
        (searchStatus === "" || p.Estado === (searchStatus.toLowerCase() === "activo"))
    );

    if (showForm) return <ProveedoresForm onClose={handleCloseForm} onSave={handleSave} proveedor={selectedProveedor} proveedores={proveedores} />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .prov-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Proveedores</h4>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input type="text" placeholder="Buscar por nombre..." value={searchName} onChange={e => setSearchName(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 200, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <input type="text" placeholder="Filtrar por estado..." value={searchStatus} onChange={e => setSearchStatus(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 180, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button onClick={() => { setSelectedProveedor(null); setShowForm(true); }} disabled={loading}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2d3f6e"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                            <FaPlusCircle size={15} /> Agregar Proveedor
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={cargarProveedores} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                        <thead>
                            <tr>
                                {["NIT", "Nombre", "Correo", "Teléfono", "Dirección", "Estado", "Acciones"].map((h, i) => (
                                    <th key={i} style={{ ...TH, textAlign: i === 6 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 6 ? 18 : 0 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando proveedores...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                                        {searchName || searchStatus ? "No se encontraron proveedores con los filtros aplicados." : "No hay proveedores registrados."}
                                    </p>
                                    {!searchName && !searchStatus && <button onClick={() => { setSelectedProveedor(null); setShowForm(true); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primer proveedor</button>}
                                </td></tr>
                            ) : (
                                filtered.map((p, idx) => {
                                    const isActive = p.Estado === true || p.Estado === "Activo";
                                    return (
                                        <tr key={p.Nit} className="prov-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                            <td style={{ padding: "11px 14px" }}><Badge type="accent">{p.Nit}</Badge></td>
                                            <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{p.Nombre}</td>
                                            <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12 }}>{p.Correo}</td>
                                            <td style={{ padding: "11px 14px", color: C.muted }}>{p.Telefono}</td>
                                            <td style={{ padding: "11px 14px", color: C.muted, fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.Direccion}</td>
                                            <td style={{ padding: "11px 14px" }}>
                                                <Badge type={isActive ? "success" : "danger"}>{isActive ? "Activo" : "Inactivo"}</Badge>
                                            </td>
                                            <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                    <button className="icon-btn" onClick={() => { setSelectedProveedor(p); setShowDetailModal(true); }} title="Ver detalle"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaEye size={12} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => { setSelectedProveedor(p); setShowForm(true); }} title="Editar"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaEdit size={12} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleEliminar(p.Nit)} title="Eliminar"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.danger}20`, background: `${C.danger}0d`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaTrash size={12} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleCambiarEstado(p)} title="Cambiar estado"
                                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.accent}20`, background: `${C.accent}0d`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FaSyncAlt size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <DetailModal show={showDetailModal} onClose={() => setShowDetailModal(false)} proveedor={selectedProveedor}
                onEdit={p => { setSelectedProveedor(p); setShowForm(true); }} />
        </>
    );
};

export default Proveedores;