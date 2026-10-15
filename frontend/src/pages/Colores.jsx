import { useState, useEffect } from "react";
import { FaPlusCircle, FaEdit, FaTrash, FaBoxOpen } from "react-icons/fa";
import Swal from "sweetalert2";

import ColoresForm from "./formularios_dash/colores.jsx";
import { getColores, deleteColor } from "../Services/api-colores/colores.js";

/* ── Tokens de color (mismos que Técnicas) ── */
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

const Colores = () => {
    const [search, setSearch] = useState("");
    const [colores, setColores] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [colorEdit, setColorEdit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchColores(); }, []);

    const fetchColores = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getColores();
            if (result.estado) setColores(result.datos);
            else setError("Error al cargar colores");
        } catch (err) {
            setError("Error al cargar los colores: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        await fetchColores();
        setShowForm(false);
        setColorEdit(null);
    };

    const handleEdit = (c) => { setColorEdit(c); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setColorEdit(null); };

    const handleDelete = async (id) => {
        const colorAEliminar = colores.find(c => c.ColorID === id);
        const result = await Swal.fire({
            title: "¿Eliminar color?",
            html: `<p>Vas a eliminar el color <strong>${colorAEliminar?.Nombre}</strong></p><p style="color:${C.muted};font-size:13px">Esta acción no se puede revertir</p>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: C.danger,
            cancelButtonColor: C.navy,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await deleteColor(id);
                if (response.estado) {
                    await fetchColores();
                    Swal.fire({ toast: true, icon: "success", title: "Color eliminado", position: "top-end", showConfirmButton: false, timer: 2000 });
                } else throw new Error(response.mensaje);
            } catch (err) {
                const errorMsg = err.response?.data?.mensaje || err.message || "No se pudo eliminar el color";
                const detalles = err.response?.data?.detalles;
                Swal.fire({
                    icon: "error", title: "No se puede eliminar",
                    html: `<div style="text-align:left"><p style="margin-bottom:8px">${errorMsg}</p>${detalles ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-top:10px;font-size:12px"><strong>Detalles:</strong><br>${detalles.variantesAsociadas ? `• Variantes en inventario: ${detalles.variantesAsociadas}<br>` : ""}${detalles.cotizacionesAsociadas ? `• Cotizaciones: ${detalles.cotizacionesAsociadas}<br>` : ""}${detalles.ventasAsociadas ? `• Ventas: ${detalles.ventasAsociadas}` : ""}</div>` : ""}</div>`,
                    confirmButtonColor: C.danger,
                });
            } finally { setLoading(false); }
        }
    };

    const filtered = colores.filter(c => c.Nombre.toLowerCase().includes(search.toLowerCase()));

    if (showForm) return <ColoresForm onClose={handleCloseForm} onSave={handleSave} colorEdit={colorEdit} coloresExistentes={colores} />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .col-row:hover { background: ${C.accentSoft} !important; }
        .icon-btn { transition: all 0.18s; }
        .icon-btn:hover { transform: scale(1.08); }
      `}</style>

            <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 32px", fontFamily: "'Outfit',sans-serif" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: C.navy, letterSpacing: "-0.02em" }}>Gestión de Colores</h4>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <input type="text" placeholder="Buscar color..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", width: 220, color: "#0f172a" }}
                            onFocus={e => e.target.style.borderColor = C.accent}
                            onBlur={e => e.target.style.borderColor = C.border} />
                        <button onClick={() => { setColorEdit(null); setShowForm(true); }} disabled={loading}
                            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2d3f6e"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.navy; }}>
                            <FaPlusCircle size={15} /> Agregar Color
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", border: `1.5px solid #fecaca`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, color: C.danger, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                        {error}
                        <button onClick={fetchColores} style={{ background: C.danger, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reintentar</button>
                    </div>
                )}

                {/* ── TABLA ── */}
                <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px #f1f5f9", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                        <thead>
                            <tr>
                                {["ID", "Nombre", "Acciones"].map((h, i) => (
                                    <th key={i} style={{ ...TH, textAlign: i === 2 ? "center" : "left", borderTopLeftRadius: i === 0 ? 18 : 0, borderTopRightRadius: i === 2 ? 18 : 0 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Cargando colores...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={3} style={{ textAlign: "center", padding: "48px 0" }}>
                                    <FaBoxOpen style={{ color: C.muted, opacity: 0.3, fontSize: 32, marginBottom: 10 }} />
                                    <p style={{ color: C.muted, marginBottom: 14, fontSize: 13 }}>
                                        {search ? "No se encontraron colores con ese nombre." : "No hay colores registrados."}
                                    </p>
                                    {!search && <button onClick={() => { setColorEdit(null); setShowForm(true); }} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Crear primer color</button>}
                                </td></tr>
                            ) : (
                                filtered.map((c, idx) => (
                                    <tr key={c.ColorID} className="col-row" style={{ background: idx % 2 === 0 ? "#fff" : C.accentSoft, borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}>
                                        <td style={{ padding: "11px 14px" }}>
                                            <Badge type="accent">{c.ColorID}</Badge>
                                        </td>
                                        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.navy }}>{c.Nombre}</td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                                <button className="icon-btn" onClick={() => handleEdit(c)} title="Editar"
                                                    style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${C.warning}20`, background: `${C.warning}0d`, color: C.warning, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button className="icon-btn" onClick={() => handleDelete(c.ColorID)} title="Eliminar"
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
            </div>
        </>
    );
};

export default Colores;